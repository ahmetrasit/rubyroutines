# Ruby Routines - Production Deployment Guide

**Version:** 1.0.0
**Last Updated:** 2025-12-01
**Branch:** test-review-v.1.0

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Environment Setup](#2-environment-setup)
3. [Database Setup](#3-database-setup)
4. [Deploy to Vercel](#4-deploy-to-vercel)
5. [Post-Deployment Configuration](#5-post-deployment-configuration)
6. [Feature Verification](#6-feature-verification)
7. [Go Live Checklist](#7-go-live-checklist)
8. [Monitoring & Maintenance](#8-monitoring--maintenance)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Prerequisites

### Required Accounts

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| [Vercel](https://vercel.com) | App hosting | Yes (100GB bandwidth) |
| [Supabase](https://supabase.com) | Database + Auth | Yes (500MB, 50K MAU) |
| [Stripe](https://stripe.com) | Payments | Yes (2.9% + $0.30/txn) |
| [Resend](https://resend.com) | Transactional emails | Yes (3K emails/month) |
| [Upstash](https://upstash.com) | Redis (rate limiting) | Yes (10K requests/day) |

### Required Secrets (Generate Before Starting)

```bash
# Generate these secrets locally before deployment
openssl rand -base64 32  # NEXTAUTH_SECRET
openssl rand -base64 32  # CRON_SECRET
openssl rand -base64 32  # JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"  # TWO_FACTOR_ENCRYPTION_KEY
```

---

## 2. Environment Setup

### Complete Environment Variables

Create these in Vercel > Settings > Environment Variables:

```env
# ============================================================================
# DATABASE (Supabase)
# ============================================================================
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# ============================================================================
# SUPABASE
# ============================================================================
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGci..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..."  # NEVER expose to client

# ============================================================================
# AUTHENTICATION
# ============================================================================
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="[generated-secret]"
JWT_SECRET="[generated-secret]"
TWO_FACTOR_ENCRYPTION_KEY="[64-hex-characters]"
CRON_SECRET="[generated-secret]"

# ============================================================================
# RATE LIMITING (Upstash Redis - Required for Production)
# ============================================================================
UPSTASH_REDIS_REST_URL="https://[region].upstash.io"
UPSTASH_REDIS_REST_TOKEN="[token]"

# ============================================================================
# OAUTH
# ============================================================================
GOOGLE_CLIENT_ID="[client-id].apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="[client-secret]"

# ============================================================================
# EMAIL (Resend)
# ============================================================================
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@yourdomain.com"

# ============================================================================
# STRIPE
# ============================================================================
STRIPE_SECRET_KEY="sk_live_..."        # Use sk_test_... for testing
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_BRONZE="price_..."
STRIPE_PRICE_GOLD="price_..."
STRIPE_PRICE_PRO="price_..."

# ============================================================================
# FEATURE FLAGS
# ============================================================================
ENABLE_MARKETPLACE="true"
ENABLE_ANALYTICS="true"
ENABLE_SCHOOL_MODE="true"
```

---

## 3. Database Setup

### 3.1 Create Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click **New Project**
3. Choose:
   - **Name:** `rubyroutines-production`
   - **Region:** Closest to your users
   - **Password:** Strong password (save it!)
4. Wait 2-3 minutes for provisioning

### 3.2 Get Connection Strings

1. Go to **Settings** > **Database**
2. Copy **Connection pooling** string (port 6543) → `DATABASE_URL`
3. Copy **Direct connection** string (port 5432) → `DIRECT_URL`
4. Replace `[YOUR-PASSWORD]` in both strings

### 3.3 Run Migrations

Apply database schema and migrations:

```bash
# Option A: Local with Vercel env
vercel link
vercel env pull .env.production
npx prisma db push

# Option B: Direct SQL execution
npx prisma db execute --file prisma/migrations/sync_all_missing_columns.sql
npx prisma db execute --file prisma/migrations/coparent_person_link.sql
npx prisma db execute --file prisma/migrations/coteacher_student_link.sql
```

### 3.4 Apply Latest Schema

The following tables must exist:

| Table | Purpose |
|-------|---------|
| `users` | User accounts |
| `roles` | Parent/Teacher roles |
| `persons` | Kids/Students |
| `routines` | Routine definitions |
| `tasks` | Task definitions |
| `task_completions` | Task completion records |
| `goals` | Goal tracking |
| `conditions` | Smart routine conditions |
| `kiosk_sessions` | Kiosk session management |
| `invitations` | CoParent/CoTeacher invitations |
| `co_parents` | CoParent relationships |
| `co_parent_person_links` | Kid-to-Kid linking |
| `co_teachers` | CoTeacher relationships |
| `co_teacher_student_links` | Student-to-Student linking |
| `person_connections` | Cross-account connections |
| `marketplace_items` | Marketplace content |

Verify with:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;
```

---

## 4. Deploy to Vercel

### 4.1 Connect Repository

1. Log in to [vercel.com](https://vercel.com)
2. Click **Add New Project**
3. Import your GitHub repository
4. Select the deployment branch: `test-review-v.1.0` or `main`

### 4.2 Configure Build Settings

| Setting | Value |
|---------|-------|
| Framework | Next.js |
| Build Command | `npm run build` |
| Output Directory | `.next` |
| Install Command | `npm install` |
| Node.js Version | 20.x |

### 4.3 Add Environment Variables

Paste all variables from Section 2 into Vercel > Settings > Environment Variables.

### 4.4 Deploy

Click **Deploy** and wait for build completion (3-5 minutes).

### 4.5 Update URLs After Deployment

Once deployed, update these variables with your actual Vercel URL:

```env
NEXT_PUBLIC_APP_URL="https://rubyroutines.vercel.app"
NEXTAUTH_URL="https://rubyroutines.vercel.app"
```

Then **Redeploy** from Vercel dashboard.

---

## 5. Post-Deployment Configuration

### 5.1 Supabase Authentication

1. Go to Supabase > **Authentication** > **URL Configuration**
2. Set **Site URL**: `https://your-app.vercel.app`
3. Add **Redirect URLs**:
   ```
   https://your-app.vercel.app/auth/callback
   https://your-app.vercel.app/api/auth/callback/credentials
   ```

### 5.2 Google OAuth (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI:
   ```
   https://your-app.vercel.app/api/auth/callback/google
   ```
4. Update `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Vercel

### 5.3 Stripe Webhook

1. Go to Stripe > **Developers** > **Webhooks**
2. Add endpoint: `https://your-app.vercel.app/api/webhooks/stripe`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `checkout.session.completed`
4. Copy signing secret → `STRIPE_WEBHOOK_SECRET`

### 5.4 Create Stripe Products

Create subscription tiers in Stripe:

| Tier | Name | Price | Features |
|------|------|-------|----------|
| Bronze | Ruby Routines Bronze | $4.99/mo | 20 routines, 100 tasks |
| Gold | Ruby Routines Gold | $9.99/mo | Unlimited routines |
| Pro | Ruby Routines Pro | $49.99/mo | Multi-user, school features |

Copy Price IDs to environment variables.

### 5.5 Create Admin User

1. Register via your app's signup page
2. Promote to admin:

```sql
-- Run in Supabase SQL Editor
UPDATE users
SET "isAdmin" = true
WHERE email = 'admin@yourdomain.com';
```

### 5.6 Configure Cron Jobs (Vercel)

Go to Vercel > Settings > Cron Jobs:

| Job | Path | Schedule | Description |
|-----|------|----------|-------------|
| Session Cleanup | `/api/cron/cleanup-sessions` | `0 3 * * *` | Daily at 3 AM |
| Analytics Update | `/api/cron/update-analytics` | `0 0 * * *` | Daily at midnight |

---

## 6. Feature Verification

### 6.1 Core Features Checklist

| Feature | Test | Expected |
|---------|------|----------|
| Sign Up | Create new account | Roles created, verification email sent |
| Sign In | Log in with credentials | Redirect to dashboard |
| 2FA | Enable in settings | QR code shows, backup codes generated |
| Parent Dashboard | Create person | Person appears with "Daily Routine" |
| Teacher Dashboard | Create classroom | Classroom with kiosk code |
| Kiosk | Enter code | Person selection, task completion |
| CoParent | Invite co-parent | Invitation email sent |
| CoParent Accept | Accept invitation | Kid linking UI shows |
| Merged Kiosk | Check in as linked kid | Tasks from both parents |
| Marketplace | Publish routine | Item appears in marketplace |
| Stripe | Start checkout | Redirect to Stripe |

### 6.2 Security Verification

| Security Feature | Implementation |
|------------------|----------------|
| Rate Limiting | Auth: 5/2min, Kiosk: 10/hr, Invitations: 10/min |
| Ownership Validation | sendVerificationCode requires user ownership |
| Session Management | 90-day kiosk sessions, admin timeout |
| 2FA Encryption | TOTP secrets encrypted with TWO_FACTOR_ENCRYPTION_KEY |
| Audit Logging | Admin actions logged |

### 6.3 CoParent/CoTeacher Verification

Test the merged kiosk flow:

1. **Dad** creates account, adds Kid A with Morning Routine
2. **Dad** invites Mom via CoParent (shares Kid A + Morning Routine)
3. **Mom** accepts, links to her "Emma"
4. **Either** parent's kiosk code shows merged tasks
5. **Both** dashboards show completion status

---

## 7. Go Live Checklist

### Pre-Launch

- [ ] All environment variables set (no test keys)
- [ ] Database migrations applied
- [ ] Admin user created
- [ ] Stripe products created with correct prices
- [ ] Webhook configured and tested
- [ ] Email templates customized
- [ ] Rate limiting configured (Upstash Redis)
- [ ] CORS origins restricted
- [ ] Error tracking enabled (optional: Sentry)

### Switch to Production

1. **Stripe**: Toggle to Live mode, update keys
2. **Update Environment Variables**:
   ```env
   STRIPE_SECRET_KEY="sk_live_..."
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
   STRIPE_WEBHOOK_SECRET="whsec_..." (new webhook for live mode)
   STRIPE_PRICE_BRONZE="price_..." (live mode price IDs)
   ```
3. **Redeploy** application

### Custom Domain (Optional)

1. Purchase domain
2. Vercel > Settings > Domains > Add domain
3. Configure DNS records
4. Update all URL environment variables
5. Update Supabase redirect URLs
6. Update Stripe webhook URL

---

## 8. Monitoring & Maintenance

### Logs

| Source | Location |
|--------|----------|
| Application | Vercel > Deployments > Logs |
| Database | Supabase > Logs Explorer |
| Auth | Supabase > Authentication > Logs |
| Payments | Stripe > Developers > Logs |
| Emails | Resend > Logs |

### Key Metrics

| Metric | Healthy Range |
|--------|---------------|
| Build time | < 5 minutes |
| Cold start | < 3 seconds |
| API response | < 500ms |
| Database connections | < 80% of pool |
| Error rate | < 0.1% |

### Backups

1. Supabase > Settings > Database > Backups
2. Enable daily backups
3. Configure point-in-time recovery (Pro plan)

### Updates

```bash
# Check for outdated packages
npm outdated

# Update dependencies
npm update

# Apply schema changes
npx prisma db push
```

---

## 9. Troubleshooting

### Database Connection Failed

```
Error: P1001 Can't reach database server
```

**Solution:**
- Use pooler URL (port 6543) for `DATABASE_URL`
- Use direct URL (port 5432) for `DIRECT_URL`
- Verify password contains no special characters that need escaping

### Rate Limiting Not Working

```
Warning: Falling back to in-memory rate limiter
```

**Solution:**
- Configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- Verify Upstash project is active

### Stripe Webhook Failures

```
Stripe webhook signature verification failed
```

**Solution:**
- Verify `STRIPE_WEBHOOK_SECRET` matches the webhook endpoint
- Check webhook is for correct mode (test vs live)
- Verify endpoint URL is correct

### Email Not Sending

**Solution:**
- Verify `RESEND_API_KEY` is correct
- Check sender domain is verified in Resend
- Check Resend logs for errors

### CoParent Kiosk Not Merging

**Solution:**
- Verify `CoParentPersonLink` records exist with `status = 'ACTIVE'`
- Check both `primaryPersonId` and `linkedPersonId` are set
- Verify `routineIds` array is not empty

### Admin Access Denied

**Solution:**
```sql
-- Check admin status
SELECT id, email, "isAdmin" FROM users WHERE email = 'admin@example.com';

-- Set admin
UPDATE users SET "isAdmin" = true WHERE email = 'admin@example.com';
```

---

## Quick Reference

### Important URLs

| Resource | URL |
|----------|-----|
| App | `https://your-app.vercel.app` |
| Admin Panel | `https://your-app.vercel.app/admin` |
| Kiosk | `https://your-app.vercel.app/kiosk` |
| API Health | `https://your-app.vercel.app/api/health` |

### Emergency Contacts

| Service | Support |
|---------|---------|
| Vercel | [vercel.com/support](https://vercel.com/support) |
| Supabase | [supabase.com/support](https://supabase.com/support) |
| Stripe | [support.stripe.com](https://support.stripe.com) |

### Cost Estimates

| Users | Vercel | Supabase | Stripe | Total |
|-------|--------|----------|--------|-------|
| 100 | $0 | $0 | Usage | ~$0/mo |
| 1,000 | $0-20 | $25 | Usage | ~$50/mo |
| 10,000 | $20-150 | $100+ | Usage | ~$200/mo |

---

**Deployment complete!** Your Ruby Routines app is ready for users.

For support: See [md/](./README.md) for full documentation index.
