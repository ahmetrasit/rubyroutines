# Stage 6: Analytics + Marketplace

**Duration:** 5-6 days  
**Token Estimate:** 90K tokens ($1.35)  
**Prerequisites:** Stage 5 completed (sharing systems and school mode working)

---

## SESSION PROMPT (Copy-Paste This)

```
You are building Ruby Routines Stage 6: Analytics + Marketplace.

CONTEXT:
- Project: Ruby Routines (routine management PWA)
- Stack: Next.js 14 + Supabase + Prisma + tRPC + TypeScript strict + D3.js
- Stage Goal: Implement analytics system and marketplace

COMPLETED IN PREVIOUS STAGES:
- Complete CRUD for all entities
- Goals and smart routines
- Kiosk mode
- Sharing systems (co-parent, co-teacher)
- School mode
- Real-time updates

CURRENT STAGE OBJECTIVES:
1. Analytics dashboard (D3.js charts)
2. Multi-select task/routine/goal filtering
3. Line graphs, bar charts, calendar heatmaps
4. Export (CSV, JSON, PDF)
5. Marketplace (routine + goal sharing)
6. Versioning system
7. Rating/comment system
8. Flag/moderation system
9. Routine/goal folders (templates)
10. Merge conflict resolution
11. Stripe integration (subscriptions)
12. Tier enforcement

ANALYTICS SYSTEM:

**Philosophy:**
- No competition (no leaderboards)
- Progress over perfection
- Non-judgmental presentation
- Long-term patterns (not daily pressure)

**Views:**
- Parent view (for kids)
- Teacher view (for students)
- Principal view (school-wide aggregate)
- Adult self-analytics (personal "Me" roles)

**Chart Types:**
1. Line graphs (trends over time)
   - Multi-select filter (tasks, routines, goals)
   - What gets plotted:
     - Simple tasks: Not plotted (binary)
     - Progress tasks: Total value per period
     - Multiple check-in tasks: Count per period
     - Routines: Completion % per period
     - Goals: Achievement count + progress trend
   - Normalize to 100 for multi-scale
   - Hover tooltip with exact values

2. Bar charts (routine frequency)
   - Comparative view across time periods
   - No multi-select (shows all for person)

3. Calendar heatmap (completion visualization)
   - Day-by-day completion %
   - Neutral colors (light to dark, not red/green)
   - Click day for details

**Time Periods:**
- Weekly (7 days)
- Monthly (30 days)
- Quarterly (90 days)
- Yearly (365 days)
- Custom date range

**Export:**
- CSV (raw data)
- JSON (structured)
- PDF (formatted reports)
- Weekly/monthly summaries

MARKETPLACE:

**Two Tabs:**
1. Routines
2. Goals

**Goal Export:**
- Goals exported WITH linked tasks/routines (bundle)
- Import creates all linked items

**Versioning:**
- Original routine ID tracked
- Creator can update marketplace version
- Version history maintained
- Users can import specific version
- Rating per version

**Rating System:**
- Thumbs up/down only
- One vote per user per version
- User must import before rating
- Can change vote anytime

**Comment System:**
- 150 characters max
- One comment per user per version
- Must import before commenting
- Can edit/delete own comments

**Flagging & Moderation:**
- Users can flag routines/comments/goals
- Flag reasons: Inappropriate, Spam, Offensive, Copyright, Other
- One flag per user per item
- Auto-delist at 3 flags (admin-configurable)
- Admin moderation dashboard
- Email notification on auto-delist

**Merge Conflict Resolution:**
- When importing routine with name conflict
- Options: Cancel, Replace, Merge
- Merge process:
  - Detect task name matches
  - Show conflict dialog
  - User chooses: Keep existing or Use new
  - Enforce immediate rename if "keep both"

ROUTINE/GOAL FOLDERS:

**Purpose:** Save templates for reuse

**Features:**
- Max 50 routines per role (admin-configurable)
- Max 50 goals per role
- Not counted toward tier limits
- Reusable blueprints
- Not assigned to anyone

STRIPE INTEGRATION:

**Subscription Model:**
- Tiers: Free, Bronze, Gold, Pro
- Monthly billing
- Separate billing per role (dual-role)
- Combined billing discount (20%, admin-configurable)
- Upgrade: Immediate, prorated charge
- Downgrade: Next billing cycle, prorated refund

**Tier Enforcement:**
- Check limits before create/copy
- Downgrade blocking (if usage exceeds new limits)
- Usage warnings during billing cycle

**Webhooks:**
- subscription.created
- subscription.updated
- subscription.deleted
- invoice.payment_succeeded
- invoice.payment_failed

TESTING REQUIREMENTS:
- Analytics calculations
- Chart rendering (D3.js)
- Marketplace flows
- Versioning logic
- Merge conflict resolution
- Stripe webhook handling
- Tier limit enforcement

BEGIN IMPLEMENTATION:
Start with Analytics (foundation).
Then Marketplace (routines).
Then Marketplace (goals with bundling).
Then Routine/Goal folders.
Then Stripe integration.
Test each major component before moving to next.
```

---

## Deliverables Checklist

```
ANALYTICS:
□ Analytics dashboard
□ Multi-select filtering (tasks, routines, goals)
□ Line graphs (D3.js)
  □ Progress tasks plotting
  □ Multiple check-in plotting
  □ Routine completion % plotting
  □ Goal achievement plotting
  □ Multi-scale normalization
□ Bar charts
□ Calendar heatmap (neutral colors)
□ Export (CSV, JSON, PDF)
□ Time period selection
□ Parent/Teacher/Principal views

MARKETPLACE:
□ Two tabs (routines, goals)
□ Browse/search
□ Routine import/export
□ Goal import/export (with bundling)
□ Versioning system
□ Rating system (thumbs up/down)
□ Comment system (150 char)
□ Flag/moderation system
□ Auto-delist at threshold
□ Admin moderation dashboard

MERGE CONFLICTS:
□ Conflict detection
□ Conflict dialog UI
□ User selection (keep existing/use new)
□ Immediate rename enforcement

FOLDERS:
□ Routine folder (templates)
□ Goal folder (templates)
□ Max 50 per role
□ Load from folder

STRIPE:
□ Subscription creation
□ Upgrade/downgrade
□ Webhook handling
□ Tier enforcement
□ Downgrade blocking
□ Usage warnings
□ Combined billing (dual-role)
```

---

## Production Ready

After completing Stage 6, application is production-ready:

✅ Complete feature set
✅ Security (RLS policies)
✅ Performance (caching, indexing)
✅ Testing (unit + E2E)
✅ Monitoring (errors, logs)
✅ Payments (Stripe)
✅ Scalability (Supabase auto-scaling)

**Deploy to production:**
```bash
git checkout main
git merge develop
git push origin main
```

Vercel will automatically deploy to production.
