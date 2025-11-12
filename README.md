# Ruby Routines

Progressive Web App (PWA) for routine management targeting parents and teachers of advanced & gifted learners.

## Philosophy

**Long-Term Habit Formation** - Focus on building sustainable routines through consistent practice, not short-term dopamine-driven mechanics.

**Core Principles:**
- No time pressure (no timers, countdowns)
- No competition (no leaderboards, rankings)
- Progress over perfection
- Non-judgmental data presentation
- Intrinsic motivation support

## Tech Stack

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes, tRPC
- **Database:** Supabase (Postgres 15)
- **Auth:** Supabase Auth
- **Real-time:** Supabase Realtime
- **ORM:** Prisma 5
- **Payments:** Stripe
- **Email:** Resend
- **Testing:** Vitest, Playwright
- **CI/CD:** GitHub Actions

## Quick Start

```bash
# Clone repository
git clone https://github.com/yourusername/rubyroutines.git
cd rubyroutines

# Install dependencies
npm install

# Set up local database
docker-compose up -d

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run database migrations
npx prisma db push
npx prisma generate

# Seed database (optional)
npm run seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
/app                  # Next.js 14 app directory
  /(auth)            # Auth pages (login, signup, verify)
  /(dashboard)       # Protected dashboard routes
    /parent          # Parent mode
    /teacher         # Teacher mode
    /school          # School/principal mode
  /kiosk            # Kiosk mode (code-based access)
  /marketplace      # Routine/goal marketplace
  /api              # API routes (webhooks, cron)
/components          # React components
  /ui               # shadcn/ui components
  /auth             # Auth-related components
  /routine          # Routine CRUD
  /task             # Task CRUD
  /goal             # Goal CRUD
  /kiosk            # Kiosk UI
  /analytics        # Charts and visualizations
/lib                 # Utility libraries
  /supabase         # Supabase client setup
  /trpc             # tRPC routers and procedures
  /services         # Business logic layer
  /hooks            # Custom React hooks
  /utils            # Helper functions
  /validation       # Zod schemas
/prisma              # Database schema and migrations
/supabase            # Supabase configuration
  /policies.sql     # Row Level Security policies
/docs                # Documentation
  /stages           # Stage-by-stage development guides
/public              # Static assets
/tests               # Test files
```

## Documentation

- [Complete Development Plan](docs/plan.md)
- [Local Setup Guide](docs/SETUP.md)
- [System Architecture](docs/ARCHITECTURE.md)
- [Security & RLS Policies](docs/SECURITY.md)
- [API Reference](docs/API.md)
- **Stage Guides:**
  - [Stage 1: Foundation & Setup](docs/stages/stage-1.md)
  - [Stage 2: Core CRUD](docs/stages/stage-2.md)
  - [Stage 3: Goals & Smart Routines](docs/stages/stage-3.md)
  - [Stage 4: Kiosk Mode](docs/stages/stage-4.md)
  - [Stage 5: Co-Parent/Teacher + School](docs/stages/stage-5.md)
  - [Stage 6: Analytics + Marketplace](docs/stages/stage-6.md)

## Development Stages

1. **Foundation** (2-3 days) - Auth, schema, RLS policies
2. **Core CRUD** (4-5 days) - Routines, tasks, basic dashboards
3. **Goals & Smart Routines** (3-4 days) - Goals, conditions, smart tasks
4. **Kiosk Mode** (3-4 days) - Code-based access, real-time updates
5. **Co-Parent/Teacher + School** (4-5 days) - Sharing, permissions, school mode
6. **Analytics + Marketplace** (5-6 days) - Analytics, marketplace, Stripe

**Total:** 21-27 days

## Cost Estimate

| Users | Monthly Cost |
|-------|--------------|
| 0-10K | $0-20 |
| 10K-50K | $125 |
| 50K-100K | $295 |
| 100K+ | $500-1,500 |

## License

Proprietary - All rights reserved

## Support

For issues and questions, contact: support@rubyroutines.com
