# Ruby Routines Deployment Guide

A step-by-step guide to deploy Ruby Routines to production.

## Prerequisites

Before you start, create accounts on these services (all have free tiers):

1. **Vercel** - https://vercel.com (for hosting the app)
2. **Supabase** - https://supabase.com (for database and authentication)
3. **Stripe** - https://stripe.com (for payments)
4. **GitHub** - https://github.com (your code repository)

---

## Step 1: Set Up Supabase Database

### 1.1 Create a New Supabase Project

1. Log in to https://app.supabase.com
2. Click **"New Project"**
3. Enter:
   - **Name**: `rubyroutines-production`
   - **Database Password**: Create a strong password and **save it somewhere safe**
   - **Region**: Choose closest to your users
4. Click **"Create new project"** (takes 2-3 minutes)

### 1.2 Get Database Connection String

1. In your Supabase project, go to **Settings** (gear icon) → **Database**
2. Scroll to **Connection String** section
3. Select **"Connection Pooling"** tab
4. Copy the **Connection pooling** string that looks like:
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
5. Replace `[PASSWORD]` with your actual database password
6. **Save this complete connection string** - you'll need it as `DATABASE_URL`

### 1.3 Enable Authentication Providers

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider (enabled by default)
3. Optional: Enable **Google**, **GitHub**, or other providers you want

### 1.4 Get Supabase API Keys

1. Go to **Settings** → **API**
2. Copy and save these values:
   - **Project URL** (save as `NEXT_PUBLIC_SUPABASE_URL`)
   - **anon public** key (save as `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - **service_role secret** key (save as `SUPABASE_SERVICE_ROLE_KEY`)

⚠️ **Important**: Keep the `service_role` key secret - never expose it in client-side code.

---

## Step 2: Set Up Stripe

### 2.1 Create Stripe Account

1. Log in to https://dashboard.stripe.com
2. Complete business verification if required

### 2.2 Get Stripe API Keys

1. In Stripe Dashboard, click **Developers** → **API Keys**
2. Copy and save:
   - **Publishable key** (starts with `pk_test_`) → save as `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** (starts with `sk_test_`) → save as `STRIPE_SECRET_KEY`

### 2.3 Set Up Webhook

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. Enter webhook URL: `https://YOUR-DOMAIN.vercel.app/api/webhooks/stripe`
   - Replace `YOUR-DOMAIN` with your actual Vercel domain (you'll get this in Step 3)
4. Click **"Select events"** and add these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **"Add endpoint"**
6. Copy the **Signing secret** (starts with `whsec_`) → save as `STRIPE_WEBHOOK_SECRET`

### 2.4 Create Stripe Products

1. Go to **Products** → **"Add product"**
2. Create three subscription products:

**BASIC Tier:**
- Name: `Ruby Routines - Basic`
- Price: `$4.99/month`
- Copy the **Price ID** (starts with `price_`) → save as `STRIPE_PRICE_ID_BASIC`

**PREMIUM Tier:**
- Name: `Ruby Routines - Premium`
- Price: `$9.99/month`
- Copy the **Price ID** → save as `STRIPE_PRICE_ID_PREMIUM`

**SCHOOL Tier:**
- Name: `Ruby Routines - School`
- Price: `$49.99/month`
- Copy the **Price ID** → save as `STRIPE_PRICE_ID_SCHOOL`

---

## Step 3: Deploy to Vercel

### 3.1 Push Code to GitHub

1. Ensure your code is pushed to GitHub:
   ```bash
   git push origin claude/ruby-routines-stages-5-6-final-011CV5JNjMCdrmQbjfnqR82o
   ```
2. Optionally, merge this branch into your main branch

### 3.2 Connect Vercel to GitHub

1. Log in to https://vercel.com
2. Click **"Add New Project"**
3. Click **"Import Git Repository"**
4. Select your `rubyroutines` repository
5. Click **"Import"**

### 3.3 Configure Environment Variables

In the **Configure Project** screen:

1. Click **"Environment Variables"**
2. Add each variable below (copy exact names and paste your values):

```
# Database
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-key-here
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-secret-key-here

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...your-key-here
STRIPE_SECRET_KEY=sk_test_...your-key-here
STRIPE_WEBHOOK_SECRET=whsec_...your-secret-here
STRIPE_PRICE_ID_BASIC=price_...your-price-id
STRIPE_PRICE_ID_PREMIUM=price_...your-price-id
STRIPE_PRICE_ID_SCHOOL=price_...your-price-id

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=your-random-secret-key-here

# Optional: Cron Secret (generate a random string)
CRON_SECRET=your-random-cron-secret
```

**How to generate random secrets:**
- Open terminal and run: `openssl rand -base64 32`
- Or use: https://generate-secret.vercel.app

3. Click **"Deploy"**

### 3.4 Get Your Vercel URL

1. Wait for deployment to complete (2-3 minutes)
2. Copy your app URL (looks like `https://rubyroutines.vercel.app`)
3. **Go back to Vercel** → **Settings** → **Environment Variables**
4. Update these two variables with your actual URL:
   - `NEXT_PUBLIC_APP_URL`
   - `NEXTAUTH_URL`
5. **Redeploy** the application (Vercel → Deployments → ⋯ menu → Redeploy)

### 3.5 Update Stripe Webhook URL

1. Go back to **Stripe Dashboard** → **Developers** → **Webhooks**
2. Edit your webhook endpoint
3. Update URL to: `https://your-actual-app-url.vercel.app/api/webhooks/stripe`
4. Save changes

---

## Step 4: Initialize Database

### 4.1 Run Database Migrations

**Option A: Using Vercel CLI (Recommended)**

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Log in to Vercel:
   ```bash
   vercel login
   ```

3. Link to your project:
   ```bash
   vercel link
   ```

4. Run migrations:
   ```bash
   vercel env pull .env.production
   npx prisma migrate deploy
   ```

**Option B: Using Supabase SQL Editor**

1. Go to Supabase project → **SQL Editor**
2. Open file: `prisma/migrations/add_admin_panel/migration.sql`
3. Copy entire SQL content
4. Paste into Supabase SQL Editor
5. Click **"Run"**
6. Repeat for any other migration files in `prisma/migrations/` folder

### 4.2 Generate Prisma Client

This happens automatically during Vercel build. If you need to do it manually:

```bash
npx prisma generate
```

---

## Step 5: Configure Supabase Authentication

### 5.1 Set Redirect URLs

1. In Supabase project, go to **Authentication** → **URL Configuration**
2. Add these URLs (replace with your actual domain):

**Site URL:**
```
https://your-app-name.vercel.app
```

**Redirect URLs:**
```
https://your-app-name.vercel.app/auth/callback
https://your-app-name.vercel.app/api/auth/callback/credentials
http://localhost:3000/auth/callback
http://localhost:3000/api/auth/callback/credentials
```

3. Click **"Save"**

### 5.2 Configure Email Templates (Optional)

1. Go to **Authentication** → **Email Templates**
2. Customize confirmation, reset password, and magic link emails
3. Update sender name and logo

---

## Step 6: Create Admin User

### 6.1 Register First User

1. Visit your deployed app: `https://your-app-name.vercel.app`
2. Click **"Sign Up"**
3. Register with your admin email address
4. Verify your email (check inbox)

### 6.2 Promote User to Admin

**Option A: Using Vercel CLI**

```bash
vercel link
npx tsx scripts/create-admin-user.ts admin@example.com
```

**Option B: Using Supabase SQL Editor**

1. Go to Supabase → **SQL Editor**
2. Run this query (replace with your email):
   ```sql
   UPDATE users
   SET "isAdmin" = true
   WHERE email = 'your-admin-email@example.com';
   ```
3. Click **"Run"**

### 6.3 Verify Admin Access

1. Log in to your app
2. Navigate to: `https://your-app-name.vercel.app/admin`
3. You should see the admin dashboard

---

## Step 7: Configure System Settings

### 7.1 Set Tier Limits

1. Log in as admin
2. Go to **Admin Panel** → **Tier Configuration**
3. Review and adjust default tier limits:
   - FREE: 5 routines, 25 tasks, 3 goals
   - BASIC: 20 routines, 100 tasks, 10 goals
   - PREMIUM: Unlimited
   - SCHOOL: Unlimited + multi-user features

### 7.2 Update Tier Pricing

1. In Admin Panel → **Tier Configuration** → **Pricing**
2. Verify prices match your Stripe products:
   - BASIC: $4.99/month
   - PREMIUM: $9.99/month
   - SCHOOL: $49.99/month

---

## Step 8: Set Up Cron Jobs (Optional)

For automated tasks like sending reminders and cleanup:

1. Go to Vercel project → **Settings** → **Cron Jobs**
2. Add these cron jobs:

**Daily Reminder Emails** (runs at 8 AM UTC):
- Path: `/api/cron/send-reminders`
- Schedule: `0 8 * * *`
- Environment: Production

**Marketplace Analytics** (runs daily at midnight):
- Path: `/api/cron/update-marketplace-analytics`
- Schedule: `0 0 * * *`
- Environment: Production

3. Ensure `CRON_SECRET` environment variable is set

---

## Step 9: Production Checklist

Before going live, verify these items:

### Security
- [ ] All environment variables are set correctly
- [ ] `SUPABASE_SERVICE_ROLE_KEY` and `STRIPE_SECRET_KEY` are kept secret
- [ ] HTTPS is enabled (automatic with Vercel)
- [ ] Admin user is created
- [ ] Stripe webhook is configured correctly

### Functionality
- [ ] User registration works
- [ ] User login works
- [ ] Email verification is sent
- [ ] Password reset works
- [ ] Routines can be created and edited
- [ ] Tasks can be created and completed
- [ ] Goals can be created and tracked
- [ ] Stripe checkout works (test with Stripe test cards)
- [ ] Admin panel is accessible

### Configuration
- [ ] Supabase redirect URLs are set
- [ ] Stripe webhook URL is updated to production domain
- [ ] Tier limits are configured
- [ ] Tier pricing matches Stripe products
- [ ] App URL environment variables are correct

### Performance
- [ ] Database connection pooling is enabled (Supabase)
- [ ] Images are optimized
- [ ] Vercel analytics is enabled (optional)

---

## Step 10: Go Live

### 10.1 Switch Stripe to Live Mode

When ready for real payments:

1. Go to Stripe Dashboard
2. Toggle from **Test mode** to **Live mode** (top right)
3. Get new API keys from **Developers** → **API Keys**:
   - Update `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (starts with `pk_live_`)
   - Update `STRIPE_SECRET_KEY` (starts with `sk_live_`)
4. Create new webhook for live mode with same events
   - Update `STRIPE_WEBHOOK_SECRET`
5. Copy product Price IDs from live mode products
6. Update environment variables in Vercel
7. Redeploy application

### 10.2 Custom Domain (Optional)

1. Purchase domain from registrar (Namecheap, GoDaddy, etc.)
2. In Vercel → **Settings** → **Domains**
3. Add your custom domain (e.g., `rubyroutines.com`)
4. Follow DNS configuration instructions
5. Update environment variables:
   - `NEXT_PUBLIC_APP_URL`
   - `NEXTAUTH_URL`
6. Update Supabase redirect URLs
7. Update Stripe webhook URL

### 10.3 Monitoring

Set up monitoring for production issues:

1. **Vercel Logs**: Vercel Dashboard → Deployments → View Logs
2. **Supabase Logs**: Supabase → Logs Explorer
3. **Stripe Dashboard**: Monitor failed payments and webhooks
4. **Error Tracking** (Optional): Add Sentry or similar service

---

## Troubleshooting

### "Database connection failed"
- Verify `DATABASE_URL` is correct with password included
- Check Supabase project is running
- Ensure connection pooling URL is used (port 6543)

### "Unauthorized" errors
- Check `NEXTAUTH_SECRET` is set
- Verify Supabase `ANON_KEY` and `SERVICE_ROLE_KEY` are correct
- Clear browser cookies and try again

### Stripe checkout doesn't work
- Verify all `STRIPE_PRICE_ID_*` variables match your Stripe products
- Check Stripe keys match the mode (test vs live)
- Test with Stripe test cards: `4242 4242 4242 4242`

### Emails not sending
- Check Supabase → Authentication → Email Templates
- Verify redirect URLs in Supabase
- Check spam folder

### Admin panel not accessible
- Verify user has `isAdmin = true` in database
- Check Supabase → Table Editor → users table
- Run create-admin-user script again

### Webhook failures
- Verify webhook URL matches your domain
- Check `STRIPE_WEBHOOK_SECRET` is correct
- View webhook logs in Stripe Dashboard

---

## Support Resources

- **Documentation**: See `docs/` folder in repository
- **Manual Testing**: See `MANUAL_TESTING_CHECKLIST.md`
- **User Guide**: See `docs/USER_GUIDE.md`
- **Admin Guide**: See `docs/ADMIN_PANEL.md`

---

## Cost Estimate (Free Tier Usage)

- **Vercel**: Free for hobby projects (100GB bandwidth)
- **Supabase**: Free tier (500MB database, 50,000 monthly active users)
- **Stripe**: No monthly fee (2.9% + $0.30 per transaction)
- **Total**: $0/month until you exceed free tiers

**Estimated costs with users:**
- 100 users: ~$0/month (within free tiers)
- 1,000 users: ~$10-25/month (database scaling)
- 10,000 users: ~$100-200/month (requires paid tiers)

---

## Next Steps After Deployment

1. **Test thoroughly** using `MANUAL_TESTING_CHECKLIST.md`
2. **Create sample data** to showcase features
3. **Invite beta users** for feedback
4. **Monitor error logs** for issues
5. **Set up backups** in Supabase (Settings → Database → Backups)
6. **Plan marketing** and user acquisition strategy

---

**Congratulations!** 🎉 Your Ruby Routines app is now deployed and ready for users!
