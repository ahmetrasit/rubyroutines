# Local Development Setup

## Prerequisites

Install these before starting:

1. **Node.js 20 LTS** - [Download](https://nodejs.org/)
2. **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/)
3. **Git** - [Download](https://git-scm.com/)
4. **VS Code** (recommended) - [Download](https://code.visualstudio.com/)

## Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/rubyroutines.git
cd rubyroutines
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Create Supabase Project

### Option A: Use Supabase Cloud (Recommended for beginners)

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create new project (choose region closest to you)
4. Wait 2-3 minutes for provisioning
5. Go to Project Settings → API
6. Copy these values:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` key → `SUPABASE_SERVICE_ROLE_KEY`

### Option B: Use Local Supabase (Advanced)

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize local Supabase
supabase init

# Start local stack
supabase start

# Note the output values (API URL, anon key, service role key)
```

## Step 4: Set Environment Variables

Create `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGc..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."

# Database (use connection string from Supabase → Database → Connection String)
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# NextAuth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (optional for MVP)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Email (use Resend or log to console in dev)
EMAIL_FROM="dev@rubyroutines.local"
RESEND_API_KEY=""

# Stripe (optional until Stage 6)
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""

# Redis (optional, for production caching)
REDIS_URL="redis://localhost:6379"
```

Generate `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

## Step 5: Run Database Migrations

```bash
# Push schema to database
npx prisma db push

# Generate Prisma client
npx prisma generate
```

## Step 6: Apply RLS Policies

```bash
# Connect to Supabase database
psql "$DATABASE_URL"

# Or use Supabase SQL Editor in dashboard
# Copy contents of /supabase/policies.sql and run
```

## Step 7: Seed Database (Optional)

```bash
npm run seed
```

This creates:
- Test users (parent, teacher, principal)
- Sample children/students
- Sample routines and tasks
- Test kiosk codes

**Test Credentials:**
```
Parent:    parent@test.com / password123
Teacher:   teacher@test.com / password123
Principal: principal@test.com / password123
```

## Step 8: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 9: Run Tests

```bash
# Unit tests
npm run test

# E2E tests (requires dev server running)
npm run test:e2e

# Type checking
npm run type-check

# Linting
npm run lint
```

## Troubleshooting

### Port 3000 already in use
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
PORT=3001 npm run dev
```

### Prisma connection errors
```bash
# Reset database
npx prisma migrate reset

# Regenerate client
npx prisma generate
```

### Supabase connection errors
- Verify `DATABASE_URL` has correct pooler URL (port 6543)
- Verify `DIRECT_URL` uses direct connection (port 5432)
- Check Supabase dashboard for database status

### RLS policies blocking queries
- Ensure you're authenticated (check `auth.users()` returns user)
- Verify policies in Supabase → Authentication → Policies
- Check policies match `/supabase/policies.sql`

## VS Code Extensions (Recommended)

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "bradlc.vscode-tailwindcss",
    "ms-playwright.playwright",
    "supabase.vscode-supabase"
  ]
}
```

## Development Workflow

1. Create feature branch: `git checkout -b feature/routine-crud`
2. Make changes
3. Run tests: `npm run test`
4. Commit: `git commit -m "feat: add routine CRUD"`
5. Push: `git push origin feature/routine-crud`
6. Create PR in GitHub

## Docker Compose (Local DB Alternative)

If you prefer fully local development without Supabase cloud:

```bash
# Start Postgres + Redis
docker-compose up -d

# Use this DATABASE_URL
DATABASE_URL="postgresql://rubydev:devpassword@localhost:5432/rubyroutines"
```

Note: This skips Supabase features (auth, realtime, storage). Only for testing database schema.

## Next Steps

After setup is complete, start with:
- [Stage 1: Foundation & Setup](stages/stage-1.md)
