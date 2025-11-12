# Stage 1: Foundation & Setup

**Duration:** 2-3 days  
**Token Estimate:** 50K tokens ($0.75)  
**Prerequisites:** Local environment set up (see SETUP.md)

---

## SESSION PROMPT (Copy-Paste This)

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

BEGIN IMPLEMENTATION:
Start with project initialization and basic structure.
Show only code blocks with minimal explanation.
After each major component, confirm it's working before proceeding.
```

---

## Deliverables Checklist

```
□ Project initialized
□ Supabase connected
□ Prisma schema implemented
□ RLS policies created
□ Auth system implemented
□ UI components created
□ Database seed script
□ Tests written
□ CI/CD configured
□ Documentation updated
```

For full checklist and implementation details, see repository documentation.

---

## Next Stage

After completing Stage 1, proceed to:
**[Stage 2: Core CRUD](stage-2.md)**
