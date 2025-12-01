# Ruby Routines - Complete Development Plan

**Version:** 1.0  
**Last Updated:** 2025-01-12  
**Estimated Duration:** 21-27 days  
**Estimated Token Cost:** 510K tokens ($7.65)

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Development Stages](#development-stages)
4. [Cost Analysis](#cost-analysis)
5. [Token Optimization](#token-optimization)

---

## Overview

### Project Philosophy

**Long-Term Habit Formation**: Focus on building sustainable routines and discipline through consistent practice, not short-term dopamine-driven mechanics.

**Core Principles:**
- **No Time Pressure**: No timers, countdowns, or urgency mechanics
- **No Competition**: No leaderboards, rankings, or comparative metrics
- **Progress Over Perfection**: Emphasize growth patterns over daily performance
- **Non-Judgmental**: Present data objectively without scoring or labeling
- **Intrinsic Motivation**: Support internal drive, not external rewards

### Target Users
- Parents of advanced & gifted learners
- Teachers of advanced & gifted learners
- School principals/administrators

### Key Features

**Core Functionality:**
- Routine management (regular & smart routines)
- Task management (simple, multiple check-in, progress, smart)
- Goal system (task-based & routine-based)
- Dual-role accounts (parent + teacher modes)
- School mode (principal management)

**Sharing & Collaboration:**
- Co-parent system (granular permissions)
- Co-teacher system (read-only access)
- Student-parent connection
- Marketplace (routine & goal sharing)

**Access Modes:**
- Parent dashboard
- Teacher dashboard
- School/principal dashboard
- Kiosk mode (code-based, authentication-free)

---

## Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5 (strict mode)
- **UI Library:** React 18
- **Components:** shadcn/ui + Radix UI
- **Styling:** Tailwind CSS 3
- **State:** Zustand (global) + React Query (server)
- **Forms:** React Hook Form + Zod
- **Analytics:** D3.js + Observable Plot
- **PWA:** Workbox (next-pwa)

### Backend
- **Runtime:** Node.js 20 LTS
- **Framework:** Next.js API Routes + tRPC
- **Database:** Supabase Postgres 15
- **ORM:** Prisma 5
- **Auth:** Supabase Auth
- **Real-time:** Supabase Realtime
- **Storage:** Supabase Storage
- **Email:** Resend
- **Payments:** Stripe

### Infrastructure
- **Hosting:** Vercel (frontend + API)
- **Database:** Supabase (managed Postgres)
- **CDN:** Cloudflare (free tier)
- **CI/CD:** GitHub Actions

---

## Development Stages

### Stage 1: Foundation & Setup
**Duration:** 2-3 days | **Tokens:** 50K ($0.75)  
**[Detailed Guide →](stages/stage-1.md)**

**Deliverables:**
- Next.js 14 + TypeScript project initialized
- Supabase connected
- Prisma schema implemented (all tables)
- RLS policies applied
- Auth system (email/password + Google OAuth)
- Email verification (6-digit codes)
- Docker Compose for local dev
- CI/CD pipeline

---

### Stage 2: Core CRUD
**Duration:** 4-5 days | **Tokens:** 120K ($1.80)  
**[Detailed Guide →](stages/stage-2.md)**

**Deliverables:**
- Person management (children, adults, "Me" roles)
- Group management (families, classrooms)
- Routine CRUD (regular routines)
- Task CRUD (simple, multiple check-in, progress)
- Task completion tracking
- Reset period logic (daily/weekly/monthly)
- Visibility rules (time, day, date-range)
- Soft delete system
- Parent & Teacher dashboards

---

### Stage 3: Goals & Smart Routines
**Duration:** 3-4 days | **Tokens:** 80K ($1.20)  
**[Detailed Guide →](stages/stage-3.md)**

**Deliverables:**
- Goal system (task-based + routine-based)
- Goal progress calculation (real-time)
- Goal achievement tracking
- Smart routines (conditions)
- Condition evaluation engine
- Smart task visibility logic
- Cross-routine conditions
- Circular dependency prevention
- Task deletion warnings

---

### Stage 4: Kiosk Mode
**Duration:** 3-4 days | **Tokens:** 70K ($1.05)  
**[Detailed Guide →](stages/stage-4.md)**

**Deliverables:**
- Code generation system (2000-word safe list)
- Kiosk authentication (code-based)
- Kiosk UI (three-section layout)
- Task completion in kiosk
- Real-time updates (Supabase Realtime)
- Code validation (5-min intervals)
- Offline detection (1-hour timeout)
- Session management

---

### Stage 5: Co-Parent/Teacher + School Mode
**Duration:** 4-5 days | **Tokens:** 100K ($1.50)  
**[Detailed Guide →](stages/stage-5.md)**

**Deliverables:**
- Co-parent invitation system
- Co-parent granular permissions
- Co-teacher invitation system
- Student-parent connection
- Dual-role account system
- School mode (principal account)
- Principal-assigned routines
- Teacher classroom routines
- Room management

---

### Stage 6: Analytics + Marketplace
**Duration:** 5-6 days | **Tokens:** 90K ($1.35)  
**[Detailed Guide →](stages/stage-6.md)**

**Deliverables:**
- Analytics dashboard (D3.js charts)
- Multi-select filtering (tasks, routines, goals)
- Line graphs, bar charts, calendar heatmaps
- Export (CSV, JSON, PDF)
- Marketplace (routine + goal sharing)
- Versioning system
- Rating/comment system
- Flag/moderation system
- Routine/goal folders (templates)
- Stripe integration (subscriptions)
- Tier enforcement

---

## Cost Analysis

### Development Costs

| Stage | Duration | Tokens | Cost |
|-------|----------|--------|------|
| Stage 1 | 2-3 days | 50K | $0.75 |
| Stage 2 | 4-5 days | 120K | $1.80 |
| Stage 3 | 3-4 days | 80K | $1.20 |
| Stage 4 | 3-4 days | 70K | $1.05 |
| Stage 5 | 4-5 days | 100K | $1.50 |
| Stage 6 | 5-6 days | 90K | $1.35 |
| **Total** | **21-27 days** | **510K** | **$7.65** |

**Token Pricing:** Claude Sonnet 3.5 @ $3/M input, $15/M output (avg $1.50/10K tokens)

### Operational Costs

| Users | Monthly Cost | Revenue (3% conversion) | Net Profit |
|-------|--------------|-------------------------|------------|
| 1K | $0 | $300 | +$300 |
| 10K | $20 | $3,000 | +$2,980 |
| 100K | $295 | $30,000 | +$29,705 |
| 1M | $1,500 | $300,000 | +$298,500 |

**Services:**
- Supabase: $0 (free tier 0-10K users) → $25 (10K-100K) → $1,200 (1M users)
- Vercel: $0 (free tier) → $20 (paid tier)
- Resend: $0 (dev) → $20 (10K users) → $250 (1M users)
- Cloudflare: $0 (free tier, always)

---

## Token Optimization

### Master Prompt Template

Use this at the start of each coding session:

```
You are building Ruby Routines [Stage X: Feature Name].

CONTEXT:
- Stack: Next.js 14 + Supabase + Prisma + tRPC + TypeScript strict
- Completed: [List completed stages]
- Current Goal: [Specific feature to implement]

RULES:
1. TypeScript strict mode (no 'any')
2. tRPC for all APIs
3. Zod for validation
4. RLS policies enforced
5. React Query for caching
6. Max 200 lines per file

CURRENT TASK: [Specific task]

OUTPUT FORMAT:
1. Brief explanation (2-3 sentences)
2. Code with inline comments for complex logic only
3. Tests (if logic is non-trivial)

BEGIN:
```

### Token Savings Strategies

| Strategy | Token Savings | Speed Gain |
|----------|---------------|------------|
| Use "continue from above" | 30% | 2x faster |
| Reference line numbers | 20% | 1.5x faster |
| Paste only changed functions | 40% | 3x faster |
| Use git diff format | 50% | 4x faster |
| "Implement X similar to Y" | 60% | 5x faster |
| **Combined Effect** | **80%** | **10x faster** |

### Efficient Prompt Example

```
Continue implementing Task CRUD similar to Routine CRUD.
Changes from Routine:
- Add 'type' field (SIMPLE | MULTIPLE_CHECKIN | PROGRESS | SMART)
- Add TaskCompletion relationship
- Add undo logic for simple tasks (5 min window)

Only show the differences, not entire file.
```

---

## Data Model

**Complete Prisma schema:** See `/prisma/schema.prisma`

**Key Entities:**
- User, Role, Person, Group
- Routine, Task, TaskCompletion
- Goal, GoalTaskLink, GoalRoutineLink
- Condition, ConditionReference
- Code, KioskSession
- MarketplaceItem, MarketplaceVersion
- AdminConfig, TierLimit, AuditLog

**Security:** All tables protected by Row Level Security (RLS) policies

---

## Testing Strategy

### Unit Tests (Vitest)
- tRPC routers
- Service layer
- Validation schemas
- Utility functions

### Integration Tests
- Database queries (Prisma)
- RLS policies
- Real-time updates
- Email sending
- Stripe webhooks

### E2E Tests (Playwright)
- Auth flows
- Routine CRUD
- Task completion
- Goal progress
- Kiosk mode
- Marketplace

**Test Coverage Target:** 80%+

---

## Deployment

### Staging
```bash
git push origin feature/[feature-name]
# Vercel creates preview deployment automatically
```

### Production
```bash
git checkout main
git merge develop
git push origin main
# Vercel deploys to production automatically
```

---

## Maintenance

### Daily
- Monitor error rates (Sentry)
- Check failed jobs
- Review user feedback

### Weekly
- Review slow queries
- Check database size
- Update dependencies (minor)

### Monthly
- Security updates
- Dependency updates (major)
- Database backup verification
- Cost optimization review

---

## Support

For questions and issues during development:
- Reference stage guides in `/docs/stages/`
- Check SETUP.md for environment issues
- Review Prisma schema for data model questions
- Check RLS policies in `/supabase/policies.sql` for permissions

---

**Ready to start?** Begin with [Stage 1: Foundation & Setup](stages/stage-1.md)
