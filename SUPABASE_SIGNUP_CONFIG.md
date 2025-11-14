# Supabase Email Verification Configuration

## Current Setup: Using Supabase Email Confirmation

The app now uses **Supabase's built-in email confirmation system**. Here's how it works:

### Flow:

1. User signs up with email/password
2. Supabase sends a verification email automatically
3. User clicks the verification link in the email
4. User is redirected to `/auth/callback` and then to `/parent`
5. User can now log in and access the app

### Configuration Required:

**In Supabase Dashboard:**

1. Go to **Authentication** → **Providers** → **Email**
2. Make sure **"Enable email confirmations"** is **CHECKED**
3. Set **"Confirm email"** redirect URL to: `http://localhost:3000/auth/callback` (or your production URL)
4. Click **Save**

**Email Template (Optional):**

You can customize the verification email template in:
**Authentication** → **Email Templates** → **Confirm Signup**

### Development Testing:

If you want to skip email verification during development:

1. Sign up a test user
2. Go to **Authentication** → **Users** in Supabase Dashboard
3. Find the user and click to edit
4. Manually set `email_confirmed_at` to current timestamp
5. User can now log in

Or use SQL:

```sql
-- Manually confirm a test user
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'test@example.com';
```

### Troubleshooting:

**"Invalid credentials" after signup:**
- User hasn't clicked the verification link yet
- Check spam/junk folder for verification email
- Manually confirm the user via Supabase dashboard (for testing)

**Email not being sent:**
- Check Supabase email settings
- Make sure email confirmation is enabled
- Check Supabase logs for email delivery errors

**User confirmed but still can't log in:**
- Check if email_confirmed_at is set in auth.users table
- Try refreshing the Supabase session
- Make sure user exists in both auth.users and your users table
