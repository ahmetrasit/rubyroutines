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
  /admin            # Admin panel (requires admin privileges)
    /page.tsx       # Admin dashboard
    /users          # User management
    /tiers          # Tier configuration
    /settings       # System settings
    /audit          # Audit log viewer
  /kiosk            # Kiosk mode (code-based access)
  /marketplace      # Routine/goal marketplace
  /api              # API routes (webhooks, cron)
/components          # React components
  /ui               # shadcn/ui components
  /auth             # Auth-related components
  /admin            # Admin panel components
  /routine          # Routine CRUD
  /task             # Task CRUD
  /goal             # Goal CRUD
  /kiosk            # Kiosk UI
  /analytics        # Charts and visualizations
/lib                 # Utility libraries
  /supabase         # Supabase client setup
  /trpc             # tRPC routers and procedures
    /routers        # tRPC routers
      /admin-*      # Admin panel routers
  /services         # Business logic layer
    /admin          # Admin services (user mgmt, settings, audit)
  /hooks            # Custom React hooks
  /utils            # Helper functions
  /validation       # Zod schemas
/prisma              # Database schema and migrations
/supabase            # Supabase configuration
  /policies.sql     # Row Level Security policies
/scripts             # Utility scripts
  /create-admin-user.ts  # Create first admin user
/docs                # Documentation
  /stages           # Stage-by-stage development guides
/public              # Static assets
/tests               # Test files
```

## Features

### Core Features
- **Multi-Role Support** - Parent, Teacher, Principal modes with role switching
- **Routine Management** - Create, schedule, and track daily/weekly/monthly routines
- **Task Management** - Simple, multiple check-in, and progress-based tasks
- **Goal System** - Link tasks and routines to measurable goals
- **Kiosk Mode** - Child-friendly interface with code-based access
- **Smart Routines** - Conditional routines based on task/goal completion
- **Analytics Dashboard** - Visual progress tracking with D3.js charts

### Sharing & Collaboration
- **Co-Parent Sharing** - Share routines with co-parents (granular permissions)
- **Co-Teacher Collaboration** - Share classrooms between teachers
- **Student-Parent Connection** - Connect parents to teacher's students via 6-digit codes
- **Marketplace** - Publish and discover routines/goals from community

### Premium Features
- **Tier System** - FREE, BASIC, PREMIUM, SCHOOL subscription tiers
- **Stripe Integration** - Secure payment processing for tier upgrades
- **Advanced Analytics** - Completion trends, goal progress, task heatmaps
- **Export Data** - CSV export for reporting and analysis

### Admin Panel
- **User Management** - Search, view, manage all users
- **Admin Access Control** - Grant/revoke admin privileges
- **Tier Management** - Configure system-wide tier limits and pricing
- **User Tier Overrides** - Set custom limits for specific users
- **System Settings** - Configure application-wide settings
- **Audit Logging** - Complete trail of all administrative actions
- **Statistics Dashboard** - System metrics and activity monitoring

## Documentation

### ⭐ Start Here
- **[Project Context & Requirements](docs/PROJECT-CONTEXT.md)** - **READ THIS FIRST** before coding
  - Complete requirements and business rules
  - Gap analysis resolutions (all edge cases)
  - Common pitfalls to avoid
  - Critical implementation decisions

### Development Guides
- [Complete Development Plan](docs/plan.md)
- [Quick Start for New Sessions](QUICKSTART.md)
- [Local Setup Guide](docs/SETUP.md)
- [Admin Panel Guide](docs/ADMIN_PANEL.md) - Comprehensive admin documentation

### Stage Guides (Complete Implementation)
- [Stage 1: Foundation & Setup](docs/stages/STAGE-1-COMPLETE.md)
- [Stage 2: Core CRUD](docs/stages/STAGE-2-COMPLETE.md)
- [Stage 3: Goals & Smart Routines](docs/stages/STAGE-3-COMPLETE.md)
- [Stage 4: Kiosk Mode](docs/stages/STAGE-4-COMPLETE.md)
- [Stage 5: Co-Parent/Teacher + School](docs/stages/STAGE-5-COMPLETE.md)
- [Stage 6: Analytics + Marketplace](docs/stages/STAGE-6-COMPLETE.md)

## Admin Panel Access

### Creating Your First Admin User

After setting up the application, you'll need to create an admin user to access the admin panel at `/admin`.

**Step 1: Register a Regular User Account**
```bash
# Start the application
npm run dev

# Navigate to http://localhost:3000/signup
# Register with your email and password
# Verify your email
```

**Step 2: Promote User to Admin**
```bash
# Run the admin creation script with the registered email
npx tsx scripts/create-admin-user.ts admin@example.com

# Expected output:
# ✅ Successfully granted admin access to admin@example.com
# User ID: user_abc123xyz
```

**Step 3: Access Admin Panel**
```
1. Log in with your admin account
2. Navigate to http://localhost:3000/admin
3. You should see the admin dashboard with system statistics
```

### Admin Panel Features

Once logged in as an admin, you can:

**User Management** (`/admin/users`)
- Search and filter all users by email, tier, admin status
- View detailed user information including roles and statistics
- Grant or revoke admin privileges to other users
- Change user subscription tiers
- Set custom tier limits for specific users (overrides system defaults)
- Delete user accounts (with safety checks to prevent deleting admins)

**Tier Configuration** (`/admin/tiers`)
- Configure system-wide tier limits for all subscription levels:
  - FREE: Default limits for new users
  - BASIC: $5/month tier limits
  - PREMIUM: $10/month tier limits
  - SCHOOL: $25/month tier limits
- Set tier pricing (monthly subscription costs)
- Limits include: persons, groups, routines, tasks per routine, goals, kiosk codes

**System Settings** (`/admin/settings`)
- View and manage application configuration
- Settings organized by category:
  - General (maintenance mode, registration enabled)
  - Tiers (tier limits and pricing)
  - Features (marketplace enabled)
  - Security (max login attempts, session timeout)
  - Billing (Stripe configuration)

**Audit Log** (`/admin/audit`)
- View complete history of all administrative actions
- Filter by action type, entity type, date range
- See before/after changes for all modifications
- Track which admin performed which actions
- Compliance and security monitoring

**Dashboard** (`/admin`)
- System statistics (total users, verified users, admins, roles)
- Tier distribution visualization
- Recent admin activity feed
- 30-day activity metrics

### Admin Security Features

- **Access Control**: Only users with `isAdmin = true` can access admin panel
- **Self-Protection**: Admins cannot revoke their own admin access
- **Admin Protection**: Cannot delete users who have admin privileges
- **Audit Trail**: All administrative actions are logged with full context
- **Authorization**: All admin API endpoints verify admin status on every request
- **Type Safety**: Full TypeScript coverage with Zod validation

### Database Migration for Admin Panel

If setting up an existing database, run the admin panel migration:

```bash
# Apply the admin panel migration
psql $DATABASE_URL < prisma/migrations/add_admin_panel/migration.sql

# Or regenerate Prisma client
npx prisma generate
npx prisma db push
```

This adds:
- `isAdmin` field to users table
- `tierOverride` field to roles table
- `system_settings` table for configuration
- `audit_logs` table for action tracking

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
