# Authentication Setup Guide

## Overview

This application uses Supabase Auth for authentication with Next.js App Router. The auth system includes:

- **Middleware** for automatic session management
- **tRPC** endpoints for auth operations
- **Protected routes** with automatic redirects
- **Industry best practices** for session handling

## Quick Start

### 1. Create Test Users

The easiest way to create test users is to run the setup script:

```bash
# Make sure you have the SUPABASE_SERVICE_ROLE_KEY in your .env.local
npx tsx scripts/create-test-users.ts
```

This will create three test users:

| Role      | Email                | Password      |
|-----------|----------------------|---------------|
| Parent    | parent@test.com      | parent123     |
| Teacher   | teacher@test.com     | teacher123    |
| Principal | principal@test.com   | principal123  |

### 2. Seed the Database

After creating auth users, run the database seed:

```bash
npm run db:seed
# or
npx prisma db seed
```

This creates test data (children, students, routines, tasks, etc.) for the test users.

## Architecture

### Components

1. **Middleware** (`middleware.ts`)
   - Automatically refreshes expired sessions
   - Manages session cookies for SSR
   - Protects routes requiring authentication
   - Redirects unauthenticated users to `/login`
   - Redirects authenticated users away from `/login` and `/signup`

2. **Supabase Clients**
   - **Server Client** (`lib/supabase/server.ts`) - For Server Components and API routes
   - **Browser Client** (`lib/supabase/client.ts`) - For Client Components

3. **tRPC Auth Router** (`lib/trpc/routers/auth.ts`)
   - `signUp` - Create new user account
   - `signIn` - Authenticate user
   - `signOut` - End user session
   - `getSession` - Get current user with roles

4. **Protected Procedures** (`lib/trpc/init.ts`)
   - Middleware that checks for authenticated user
   - Throws UNAUTHORIZED error if no session

### Authentication Flow

#### Sign Up
```
Client → tRPC signUp
  → Supabase Auth (create user)
  → Prisma (create user record)
  → Prisma (create role)
  → Success
```

#### Sign In
```
Client → tRPC signIn
  → Supabase Auth (signInWithPassword)
  → Set session cookies
  → Success
  → Client redirects to /dashboard
  → Middleware intercepts
  → Refresh session if needed
  → Allow access
```

#### Session Check
```
Client → tRPC getSession
  → Supabase Auth (getUser)
  → If authenticated:
    → Prisma (fetch user with roles)
    → Return user data
  → Else:
    → Return null
```

#### Protected Routes
```
Browser → Request /dashboard
  → Middleware intercepts
  → Check Supabase session
  → If authenticated:
    → Allow request
  → Else:
    → Redirect to /login
```

## Security Best Practices

### ✅ Implemented

1. **Session Management**
   - Automatic token refresh via middleware
   - Secure, HTTP-only cookies
   - Server-side session validation

2. **Protected Routes**
   - Middleware-level protection
   - Cannot be bypassed client-side
   - Automatic redirects

3. **Protected API Endpoints**
   - tRPC `protectedProcedure` middleware
   - Server-side auth checks
   - Throws UNAUTHORIZED for invalid sessions

4. **Password Requirements**
   - Minimum 6 characters (configurable)
   - Enforced by Supabase Auth
   - Client-side validation

5. **Email Verification**
   - Users auto-verified for testing
   - Can enable email confirmation in production

6. **Database Security**
   - Supabase RLS policies enabled
   - Row-level security per user/role
   - Prevents unauthorized data access

### 🔒 Production Recommendations

1. **Environment Variables**
   ```bash
   # Required
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_key  # For admin operations only
   DATABASE_URL=your_database_url
   ```

2. **Password Requirements**
   - Increase minimum to 8+ characters
   - Add complexity requirements
   - Consider password strength indicator

3. **Email Verification**
   - Enable email confirmation
   - Configure email templates in Supabase
   - Handle unverified users appropriately

4. **Rate Limiting**
   - Implement on signIn/signUp endpoints
   - Prevent brute force attacks
   - Use services like Upstash or built-in Supabase protections

5. **Multi-Factor Authentication**
   - Consider MFA for sensitive accounts
   - Supabase supports TOTP MFA

6. **Session Duration**
   - Configure in Supabase dashboard
   - Default: 1 hour access token, 7 days refresh token
   - Adjust based on security requirements

7. **HTTPS Only**
   - Always use HTTPS in production
   - Secure flag on cookies
   - HSTS headers

## Troubleshooting

### "Invalid credentials" on login

**Cause**: User doesn't exist in Supabase Auth

**Solution**:
```bash
# Option 1: Run the test user script
npx tsx scripts/create-test-users.ts

# Option 2: Sign up via the UI at /signup
```

### Session not persisting

**Cause**: Missing middleware or cookie issues

**Solution**: Ensure `middleware.ts` exists at the root and:
```typescript
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

### "UNAUTHORIZED" errors

**Cause**: Using `protectedProcedure` without valid session

**Solution**: Ensure user is logged in or use `publicProcedure` for public endpoints

### Middleware not running

**Cause**: Matcher config issue or middleware.ts not at root

**Solution**: Verify file location is `/middleware.ts` (not `/app/middleware.ts`)

## Testing

### Manual Testing

1. **Sign Up Flow**
   ```
   Navigate to /signup
   → Enter email, password, name
   → Submit
   → Should redirect to /dashboard
   → Should see user name
   ```

2. **Sign In Flow**
   ```
   Navigate to /login
   → Enter email: parent@test.com
   → Enter password: parent123
   → Submit
   → Should redirect to /dashboard
   → Should see "Test Parent"
   → Should see PARENT role (FREE tier)
   ```

3. **Protected Route**
   ```
   Log out
   → Navigate to /dashboard
   → Should redirect to /login
   ```

4. **Session Persistence**
   ```
   Log in
   → Refresh page
   → Should remain logged in
   → Session should persist across page loads
   ```

### Automated Testing

TODO: Add Playwright E2E tests for auth flows

## References

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [tRPC Docs](https://trpc.io/docs)
