# Stage 1: Foundation & Setup

**Duration:** 2-3 days  
**Token Estimate:** 50K tokens ($0.75)  
**Prerequisites:** Local environment set up (see SETUP.md)

---

## 📋 SESSION PROMPT (Copy-Paste This)

```
You are building Ruby Routines Stage 1: Foundation & Setup.

CONTEXT:
- Project: Ruby Routines (routine management PWA for parents/teachers)
- Stack: Next.js 14 + Supabase + Prisma + tRPC + TypeScript strict
- Stage Goal: Set up project foundation, auth system, database schema, RLS policies

COMPLETED BEFORE THIS SESSION:
- Repository initialized
- Documentation created
- Local environment configured

CURRENT STAGE OBJECTIVES:
1. Initialize Next.js project with TypeScript strict mode
2. Set up Supabase connection
3. Implement complete Prisma schema (all tables from plan.md)
4. Create RLS policies for all tables
5. Implement auth system (email/password + Google OAuth)
6. Create email verification flow (6-digit codes)
7. Set up Docker Compose for local development
8. Configure CI/CD pipeline (GitHub Actions)

TECH STACK:
- Next.js 14 (App Router)
- Supabase (Postgres + Auth + Realtime)
- Prisma 5
- tRPC
- TypeScript strict mode
- shadcn/ui + Tailwind CSS
- Zod validation

SECURITY REQUIREMENTS:
- ALL database access through RLS policies
- JWT sessions (httpOnly cookies)
- Email verification required before account use
- 6-digit codes (uppercase alphanumeric, 15-min expiry)
- Rate limiting (3 attempts, 60-sec cooldown)
- Account lockout (5 failed logins → 15-min lock)

DATA MODEL - KEY ENTITIES:
User (email, password, status, verification codes)
Account (OAuth providers)
Session (JWT tokens)
Role (parent, teacher, principal, support_staff)
Person (adults, children)
Group (families, classrooms, rooms)
Routine (regular, smart, teacher_classroom)
Task (simple, multiple_checkin, progress, smart)
Goal (daily, weekly, monthly)
Condition (smart routine logic)
Code (kiosk, connection, invitation, sharing)
MarketplaceItem (shared routines/goals)
AdminConfig (all settings)

RLS POLICY REQUIREMENTS:
- Users can only access their own roles
- Parents can only see their own children
- Teachers can only see their own students
- Co-parents can only see granted children
- Co-teachers can only see granted students
- Principals can see all school entities
- Marketplace items are public (read-only)

OUTPUT REQUIREMENTS:
1. Full project initialization
2. Working auth (email/password + Google OAuth)
3. Database schema deployed
4. All RLS policies applied
5. Seed data for testing
6. Tests for auth flows
7. CI/CD pipeline configured

CONSTRAINTS:
- TypeScript strict mode (no 'any' types)
- Max 200 lines per file
- Use tRPC for all APIs
- Use Zod for validation
- Use shadcn/ui for components
- Follow Next.js 14 App Router conventions
- Use Server Components where possible

FILE STRUCTURE TO CREATE:
/app/(auth)/login/page.tsx
/app/(auth)/signup/page.tsx
/app/(auth)/verify/page.tsx
/app/api/auth/[...]/route.ts
/components/ui (shadcn/ui components)
/components/auth/login-form.tsx
/components/auth/signup-form.tsx
/components/auth/verify-form.tsx
/lib/supabase/client.ts
/lib/supabase/server.ts
/lib/trpc/init.ts
/lib/trpc/routers/auth.ts
/lib/validation/auth.ts
/prisma/schema.prisma (COMPLETE SCHEMA)
/supabase/policies.sql (ALL RLS POLICIES)

BEGIN IMPLEMENTATION:
Start with project initialization and basic structure.
Show only code blocks with minimal explanation.
After each major component, confirm it's working before proceeding.
```

---

## 📦 Deliverables Checklist

### Project Setup
```
□ Next.js 14 initialized
  □ TypeScript strict mode
  □ Tailwind CSS configured
  □ App Router structure
  
□ Supabase connected
  □ Client setup (/lib/supabase/client.ts)
  □ Server setup (/lib/supabase/server.ts)
  □ Environment variables configured
  
□ shadcn/ui installed
  □ Button component
  □ Input component
  □ Form component
  □ Toast component
  □ Dialog component
```

### Database Schema
```
□ Prisma schema implemented
  □ User entity (email, password, verification)
  □ Account entity (OAuth)
  □ Session entity (JWT)
  □ Role entity (parent, teacher, principal)
  □ Person entity (adults, children)
  □ Group entity (families, classrooms, rooms)
  □ GroupMembership (many-to-many)
  □ Routine entity (all types)
  □ Task entity (all types)
  □ TaskCompletion (tracking)
  □ VisibilityOverride (temporary)
  □ Goal entities (Goal, GoalTaskLink, GoalRoutineLink, GoalAchievement)
  □ Condition entities (Condition, ConditionReference)
  □ Co-parent entities (CoParentAccess, CoParentChildAccess, CoParentRoutineAccess)
  □ Co-teacher entities (CoTeacherAccess, CoTeacherStudentAccess)
  □ StudentParentConnection
  □ Code entity (all types)
  □ KioskSession
  □ Marketplace entities (Item, Version, Rating, Comment, Flag)
  □ Folder entities (RoutineFolder, GoalFolder)
  □ Admin entities (AdminConfig, TierLimit, AuditLog)
  □ All enums defined
  □ All relationships configured
  □ All indexes created
  □ Schema pushed to database
```

### RLS Policies
```
□ User policies
  □ Users see only their own data
  
□ Role policies
  □ Users see only their own roles
  □ Roles active status enforced
  
□ Person policies
  □ Parents see only their kids
  □ Teachers see only their students
  □ Principals see school students
  
□ Group policies
  □ Users see only their groups
  
□ Routine/Task policies
  □ Parents CRUD own kids' routines
  □ Teachers CRUD own students' routines
  □ Read-only for shared (co-parent, co-teacher)
  
□ Goal policies
  □ Adults create/manage goals
  □ Children view only
  
□ Co-parent policies
  □ Read-only access enforced
  □ Granular child/routine access
  
□ Co-teacher policies
  □ Read-only access enforced
  □ Student selection enforced
  
□ Marketplace policies
  □ Public read access
  □ Owner-only write access
  
□ Admin policies
  □ Config read-only for users
  □ Admin-only write
  
□ All policies applied to database
```

### Auth System
```
□ Supabase Auth configured
  □ Email/password provider
  □ Google OAuth provider
  
□ Email verification
  □ 6-digit code generation
  □ Code hashing (bcrypt)
  □ 15-minute expiration
  □ Resend with 60-sec cooldown
  □ 3 resend limit
  □ Rate limiting (3 attempts)
  □ Account lockout (5 failed → 15 min)
  
□ Password reset
  □ 6-digit code generation
  □ Same security as verification
  □ Session invalidation on change
  
□ Session management
  □ JWT tokens
  □ httpOnly cookies
  □ 30-day expiration
  □ 24-hour sliding window
  □ 3-device limit
```

### UI Components
```
□ Auth pages
  □ Login page (/app/(auth)/login/page.tsx)
  □ Signup page (/app/(auth)/signup/page.tsx)
  □ Verify page (/app/(auth)/verify/page.tsx)
  □ Password reset page
  
□ Auth components
  □ LoginForm (email/password + OAuth)
  □ SignupForm (role selection, email/password)
  □ VerifyForm (6-digit code input)
  □ PasswordResetForm
  
□ Layout components
  □ AuthLayout (for auth pages)
  □ RootLayout (with providers)
```

### Seed Data
```
□ Test users
  □ Parent account (parent@test.com / password123)
  □ Teacher account (teacher@test.com / password123)
  □ Principal account (principal@test.com / password123)
  
□ Test data
  □ Sample children/students
  □ Sample groups (families, classrooms)
  □ Sample routines
  □ Sample tasks
  
□ Seed script (/prisma/seed.ts)
  □ Runnable with: npm run seed
```

### Tests
```
□ Auth flow tests
  □ Signup with email/password
  □ Email verification
  □ Login with credentials
  □ Login with Google OAuth
  □ Password reset
  □ Session persistence
  □ Rate limiting
  □ Account lockout
  
□ RLS policy tests
  □ User isolation
  □ Role isolation
  □ Person ownership
  □ Co-parent permissions
  □ Co-teacher permissions
  
□ Validation tests
  □ Zod schema validation
  □ Email format
  □ Password strength
```

### CI/CD
```
□ GitHub Actions workflow
  □ Lint on push
  □ Type check on push
  □ Test on push
  □ Build verification
  □ Auto-deploy preview (Vercel)
  
□ Workflow file (.github/workflows/ci.yml)
```

---

## 🛠 Implementation Steps

### Step 1: Initialize Project (30 min)

```bash
# Create Next.js project
npx create-next-app@latest rubyroutines \
  --typescript \
  --tailwind \
  --app \
  --src-dir=false \
  --import-alias="@/*"

cd rubyroutines

# Install core dependencies
npm install @supabase/supabase-js @supabase/ssr
npm install @prisma/client
npm install @trpc/server @trpc/client @trpc/react-query @trpc/next
npm install @tanstack/react-query
npm install zod
npm install zustand
npm install react-hook-form @hookform/resolvers
npm install bcryptjs
npm install sonner

# Install dev dependencies
npm install -D prisma
npm install -D @types/node @types/bcryptjs
npm install -D vitest @vitest/ui
npm install -D @playwright/test
npm install -D eslint-config-prettier

# Install shadcn/ui
npx shadcn-ui@latest init -y

# Install shadcn components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add form
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add select
```

### Step 2: Configure Environment (15 min)

Create `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Database
DATABASE_URL=postgresql://postgres.[ref]:[pass]@...pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[ref]:[pass]@...pooler.supabase.com:5432/postgres

# NextAuth
NEXTAUTH_SECRET=generate_with_openssl
NEXTAUTH_URL=http://localhost:3000

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Generate secret:
```bash
openssl rand -base64 32
```

### Step 3: Prisma Schema (2 hours)

**CRITICAL:** Implement the COMPLETE schema from the gap analysis conversation.

Due to length, the full schema is in the original conversation. Key structure:

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ENUMS (all from gap analysis)
enum UserStatus { UNVERIFIED ACTIVE INACTIVE }
enum RoleType { PARENT TEACHER PRINCIPAL SUPPORT_STAFF }
// ... all other enums

// MODELS (all from gap analysis)
model User {
  id String @id @default(cuid())
  email String @unique
  hashedPassword String?
  emailVerified DateTime?
  // ... all fields
}

// ... all other models (70+ models total)
```

After creating schema:
```bash
npx prisma db push
npx prisma generate
```

### Step 4: RLS Policies (3 hours)

Create `/supabase/policies.sql`:

```sql
-- Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Role" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Person" ENABLE ROW LEVEL SECURITY;
-- ... all tables

-- User policies
CREATE POLICY "users_own_data" ON "User"
  FOR ALL USING (id = auth.uid());

-- Role policies
CREATE POLICY "users_own_roles" ON "Role"
  FOR ALL USING ("userId" = auth.uid());

-- Person policies (parent mode)
CREATE POLICY "parent_own_kids" ON "Person"
  FOR ALL USING (
    "roleId" IN (
      SELECT id FROM "Role"
      WHERE "userId" = auth.uid()
      AND type = 'PARENT'
    )
  );

-- Person policies (teacher mode)
CREATE POLICY "teacher_own_students" ON "Person"
  FOR ALL USING (
    "roleId" IN (
      SELECT id FROM "Role"
      WHERE "userId" = auth.uid()
      AND type IN ('TEACHER', 'PRINCIPAL')
    )
  );

-- Co-parent granular access
CREATE POLICY "coparent_granted_children" ON "Person"
  FOR SELECT USING (
    id IN (
      SELECT "childId" FROM "CoParentChildAccess"
      WHERE "coParentAccessId" IN (
        SELECT id FROM "CoParentAccess"
        WHERE "coParentRoleId" IN (
          SELECT id FROM "Role" WHERE "userId" = auth.uid()
        )
        AND status = 'ACTIVE'
      )
    )
  );

-- ... all other policies (100+ policies total)
```

Apply policies:
```bash
psql "$DATABASE_URL" < supabase/policies.sql
```

### Step 5: Supabase Client Setup (30 min)

**Client-side** (`/lib/supabase/client.ts`):
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Server-side** (`/lib/supabase/server.ts`):
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
```

### Step 6: Auth Implementation (4 hours)

**Validation schemas** (`/lib/validation/auth.ts`):
```typescript
import { z } from 'zod'

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain number'),
  roleType: z.enum(['PARENT', 'TEACHER', 'BOTH'])
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
})

export const verifySchema = z.object({
  code: z.string().length(6).regex(/^[A-Z2-9]+$/)
})
```

**Auth router** (`/lib/trpc/routers/auth.ts`):
```typescript
import { router, publicProcedure } from '../init'
import { signupSchema, loginSchema, verifySchema } from '@/lib/validation/auth'
import { createClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

export const authRouter = router({
  signup: publicProcedure
    .input(signupSchema)
    .mutation(async ({ input }) => {
      const supabase = createClient()
      
      // Create user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          emailRedirectTo: `${process.env.NEXTAUTH_URL}/auth/callback`
        }
      })
      
      if (error) throw error
      
      // Generate verification code
      const code = generateCode()
      const hashedCode = await bcrypt.hash(code, 10)
      
      // Store in database
      await prisma.user.update({
        where: { id: data.user!.id },
        data: {
          emailVerificationCode: hashedCode,
          emailVerificationExpiry: new Date(Date.now() + 15 * 60 * 1000)
        }
      })
      
      // Send email (implement with Resend)
      await sendVerificationEmail(input.email, code)
      
      return { success: true }
    }),
  
  // ... other procedures
})

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => 
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')
}
```

Continue in next file due to length...

---

## 🧪 Testing Checklist

Run these manual tests:

```
□ Can create account with email/password
□ Receives verification email
□ Can verify email with 6-digit code
□ Cannot access app without verification
□ Can login after verification
□ Can logout
□ Can reset password
□ Can login with Google OAuth
□ Rate limiting works
□ Account lockout works
□ Session persists
```

Automated tests:
```bash
npm run test tests/auth.test.ts
```

---

## ⚠️ Common Issues

**Prisma connection errors:**
```bash
# Check DATABASE_URL format (must use pooler)
# Should have :6543 port, not :5432
```

**RLS blocking queries:**
```sql
-- In Supabase SQL Editor, test:
SELECT auth.uid(); -- Should return user UUID
```

**Email verification not sending:**
```typescript
// For local dev, log to console:
console.log('Verification code:', code)
```

---

## ✅ Stage Complete When:

- [ ] Can signup with email/password
- [ ] Can verify email
- [ ] Can login
- [ ] Can reset password
- [ ] Database schema fully deployed
- [ ] All RLS policies applied
- [ ] All tests passing
- [ ] CI/CD pipeline running

**Next:** [Stage 2: Core CRUD](stage-2.md)
