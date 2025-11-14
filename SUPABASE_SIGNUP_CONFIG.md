# Supabase Signup Configuration

## Issue: "Invalid credentials" after signup

If you're experiencing "invalid credentials" errors after signing up, this is likely because **Supabase email confirmation is enabled** and the user account is not confirmed yet.

## Solution: Disable Email Confirmation (Development)

For development environments, you should disable Supabase's built-in email confirmation:

### Steps:

1. **Go to your Supabase Dashboard**
2. Navigate to **Authentication** → **Providers** → **Email**
3. Scroll down to **"Email confirmation"** section
4. **Uncheck** "Enable email confirmations"
5. Click **Save**

### What this does:

- Users are automatically confirmed when they sign up
- No confirmation email is sent by Supabase
- Your custom verification code system (in the app) still works
- Users can log in immediately after signup

## Alternative: Manual Confirmation (Production)

If you want to keep email confirmation enabled, you'll need to:

1. Have Supabase send confirmation emails
2. OR manually confirm users via SQL:

```sql
-- Find unconfirmed users
SELECT id, email, email_confirmed_at 
FROM auth.users 
WHERE email_confirmed_at IS NULL;

-- Manually confirm a user
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'user@example.com';
```

## Current App Behavior:

The app has its own verification code system that:
- Generates a 6-digit code after signup
- Logs it to the console (development)
- Requires users to enter the code before accessing protected routes
- Sets `user_metadata.emailVerified = true` after code verification

This works independently of Supabase's email confirmation system.

## Recommended Setup:

**Development:**
- Disable Supabase email confirmation
- Use app's verification code system (console logs)

**Production:**
- Keep Supabase email confirmation disabled
- Implement proper email service for verification codes
- OR enable Supabase confirmation and remove app verification

