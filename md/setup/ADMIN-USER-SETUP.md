# How to Create an Admin User

## Method 1: Using Supabase Dashboard (Recommended)

1. **Create a user through Supabase Auth:**
   - Go to Supabase Dashboard → Authentication → Users
   - Click "Add user"
   - Enter email and password
   - Click "Create user"
   - Copy the user ID

2. **Make the user an admin:**
   - Go to Table Editor → `users` table
   - Find the user by email
   - Click on the row to edit
   - Set `isAdmin` to `true`
   - Save

## Method 2: Using SQL (If user already exists)

If you already have a user account and want to make it admin:

```sql
-- Replace 'your-email@example.com' with your actual email
UPDATE users
SET "isAdmin" = true
WHERE email = 'your-email@example.com';
```

## Method 3: Create Admin User via SQL (Complete)

If you want to create a complete admin user from scratch using SQL:

```sql
-- First, create the user in Supabase Auth (you MUST do this through Supabase Dashboard or API)
-- Then run this SQL to set the user as admin:

-- Step 1: Find your user ID
SELECT id, email FROM users WHERE email = 'your-email@example.com';

-- Step 2: Set as admin
UPDATE users
SET "isAdmin" = true
WHERE email = 'your-email@example.com';

-- Step 3: Verify
SELECT id, email, "isAdmin" FROM users WHERE email = 'your-email@example.com';
```

## Accessing Admin Panel

Once you have admin privileges:

1. **Log in** with your admin account
2. **Navigate to** `/admin` (you may need to manually type this URL)
3. You should see the admin dashboard with:
   - User management
   - System limits and quotas
   - Analytics
   - Content moderation tools

## Testing Limits

As an admin, you can:

1. **View all users** and their tier levels (FREE, PREMIUM, ENTERPRISE)
2. **Check limits** for each tier (routines, tasks, persons, goals)
3. **Monitor usage** across the platform
4. **Modify tier limits** (if that functionality is implemented)

## Verification

To verify your admin status:

```sql
SELECT
  u.id,
  u.email,
  u."isAdmin",
  u."createdAt"
FROM users u
WHERE u."isAdmin" = true;
```

This will list all admin users in the system.

## Security Notes

- Keep admin credentials secure
- Use strong passwords for admin accounts
- Consider enabling two-factor authentication for admin accounts
- Regularly audit admin access logs
