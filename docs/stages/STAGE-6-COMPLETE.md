# Stage 6: Analytics + Marketplace - Complete Implementation Guide

**Duration:** 5-6 days
**Token Estimate:** 90K tokens ($1.35)
**Prerequisites:** Stages 1-5 completed

---

## SESSION PROMPT (Copy-Paste This)

You are building Ruby Routines **Stage 6: Analytics + Marketplace**.

**CONTEXT:**
- Stack: Next.js 14 + Supabase + Prisma + tRPC + TypeScript strict
- Previous stages: Foundation, Core CRUD, Goals, Kiosk, Co-Parent/School completed
- Goal: Implement analytics dashboard and marketplace for sharing routines/goals

**OBJECTIVES:**
1. Analytics dashboard with D3.js charts (completion trends, goal progress, heatmaps)
2. Marketplace for publishing and discovering routines/goals
3. Versioning system (track changes, allow updates)
4. Rating and comment system
5. Flagging inappropriate content (moderation queue)
6. Stripe integration for tier upgrades
7. Tier limit enforcement

**REQUIREMENTS:**

**Analytics Dashboard:**
- Non-competitive philosophy (no leaderboards, no rankings)
- Charts: completion rate over time, goal progress, task heatmap (day/week view)
- Filter by person, date range, routine, goal
- Export data as CSV
- Privacy: only show user's own data (no comparisons)

**Marketplace:**
- Publish routine or goal to marketplace
- Set visibility: public, unlisted, private
- Versioning: track changes, allow updates without breaking imports
- Forking: users can import and customize published items
- Search: by category, age group, tags
- Sort: by rating, popularity, date

**Rating & Comments:**
- 5-star rating system
- Text comments (max 500 chars)
- Flag inappropriate content (auto-hide after 3 flags, manual review)
- Author can respond to comments

**Stripe Integration:**
- Tier upgrades: FREE → BASIC ($5/mo), PREMIUM ($10/mo), SCHOOL ($25/mo)
- Webhook handling: subscription.created, subscription.updated, subscription.deleted
- Tier enforcement: block actions exceeding tier limits
- Billing portal: manage subscription, update payment method

**KEY FILES TO CREATE:**
```
/lib/services/analytics.service.ts       # Data aggregation for charts
/lib/services/marketplace.service.ts     # Publish, fork, search
/lib/services/stripe.service.ts          # Stripe API integration
/lib/trpc/routers/analytics.router.ts    # Analytics endpoints
/lib/trpc/routers/marketplace.router.ts  # Marketplace CRUD
/lib/trpc/routers/billing.router.ts      # Stripe billing
/app/(dashboard)/analytics/page.tsx      # Analytics dashboard
/app/marketplace/page.tsx                # Marketplace browse
/app/marketplace/[id]/page.tsx           # Marketplace item detail
/app/api/webhooks/stripe/route.ts        # Stripe webhook handler
/components/analytics/CompletionChart.tsx  # D3.js chart
/components/analytics/GoalProgressChart.tsx
/components/analytics/TaskHeatmap.tsx
/components/marketplace/ItemCard.tsx
/components/marketplace/RatingStars.tsx
/components/billing/PricingTable.tsx
/components/billing/BillingPortal.tsx
```

**TESTING REQUIREMENTS:**
- Generate mock completion data, verify charts render correctly
- Publish routine to marketplace, verify versioning
- Fork marketplace item, verify independence from original
- Rate and comment on marketplace item
- Flag inappropriate content, verify auto-hide after 3 flags
- Test Stripe webhook with Stripe CLI
- Test tier enforcement (block actions exceeding tier limits)

**DEVELOPMENT STEPS:**
1. Create analytics service and D3.js charts
2. Build marketplace publish/fork/search
3. Implement rating and comment system
4. Add flagging and moderation queue
5. Integrate Stripe (checkout, webhooks, billing portal)
6. Enforce tier limits across all operations
7. Test end-to-end marketplace and billing flow

**IMPORTANT:**
- Use D3.js v7 for charts (not recharts, to maintain custom styling)
- Store marketplace items separately from user routines (separate tables)
- Versioning: use semantic versioning (1.0.0, 1.1.0, 2.0.0)
- Stripe: test mode keys for development, production keys for deployment
- Tier enforcement: check limits on every create operation

Refer to `/docs/stages/STAGE-6-COMPLETE.md` for full implementation details.

---

## Complete Implementation

### 1. Analytics Service

**File: `/lib/services/analytics.service.ts`**

```typescript
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, subDays, eachDayOfInterval, format } from 'date-fns';

export interface CompletionTrendData {
  date: string;
  completions: number;
  totalTasks: number;
  completionRate: number;
}

export interface GoalProgressData {
  goalId: string;
  goalName: string;
  current: number;
  target: number;
  percentage: number;
  status: 'not_started' | 'in_progress' | 'achieved';
}

export interface TaskHeatmapData {
  taskId: string;
  taskName: string;
  routineName: string;
  completions: {
    date: string;
    count: number;
  }[];
}

/**
 * Get completion trend for date range
 */
export async function getCompletionTrend(
  roleId: string,
  personId: string | null,
  startDate: Date,
  endDate: Date
): Promise<CompletionTrendData[]> {
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const data = await Promise.all(
    days.map(async (day) => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);

      // Get completions for the day
      const completions = await prisma.taskCompletion.count({
        where: {
          completedAt: {
            gte: dayStart,
            lte: dayEnd
          },
          ...(personId && { personId }),
          task: {
            routine: { roleId }
          }
        }
      });

      // Get total tasks assigned for the day
      const totalTasks = await prisma.task.count({
        where: {
          status: 'ACTIVE',
          routine: {
            roleId,
            status: 'ACTIVE',
            ...(personId && {
              assignments: {
                some: { personId }
              }
            })
          }
        }
      });

      const completionRate = totalTasks > 0 ? (completions / totalTasks) * 100 : 0;

      return {
        date: format(day, 'yyyy-MM-dd'),
        completions,
        totalTasks,
        completionRate: Math.round(completionRate * 100) / 100
      };
    })
  );

  return data;
}

/**
 * Get goal progress for all active goals
 */
export async function getGoalProgress(
  roleId: string,
  personId: string | null
): Promise<GoalProgressData[]> {
  const goals = await prisma.goal.findMany({
    where: {
      roleId,
      status: 'ACTIVE',
      ...(personId && {
        OR: [
          { personIds: { has: personId } },
          { groupIds: { isEmpty: true } }
        ]
      })
    },
    include: {
      taskLinks: {
        include: {
          task: {
            include: {
              completions: {
                where: {
                  ...(personId && { personId })
                }
              }
            }
          }
        }
      },
      routineLinks: {
        include: {
          routine: {
            include: {
              tasks: {
                include: {
                  completions: {
                    where: {
                      ...(personId && { personId })
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  return goals.map((goal) => {
    let current = 0;

    // Aggregate from task links
    for (const link of goal.taskLinks) {
      const completions = link.task.completions;
      if (link.task.type === 'MULTIPLE_CHECKIN') {
        current += completions.length;
      } else if (link.task.type === 'PROGRESS') {
        current += completions.reduce((sum, c) => sum + Number(c.value || 0), 0);
      } else {
        current += completions.length > 0 ? 1 : 0;
      }
    }

    // Aggregate from routine links
    for (const link of goal.routineLinks) {
      const routine = link.routine;
      const totalTasks = routine.tasks.length;
      const completedTasks = routine.tasks.filter(t => t.completions.length > 0).length;
      current += totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    }

    const target = goal.target;
    const percentage = target > 0 ? (current / target) * 100 : 0;
    const status = current === 0 ? 'not_started' : current >= target ? 'achieved' : 'in_progress';

    return {
      goalId: goal.id,
      goalName: goal.name,
      current: Math.round(current * 100) / 100,
      target,
      percentage: Math.round(percentage * 100) / 100,
      status
    };
  });
}

/**
 * Get task heatmap (completion frequency by task)
 */
export async function getTaskHeatmap(
  roleId: string,
  personId: string | null,
  startDate: Date,
  endDate: Date
): Promise<TaskHeatmapData[]> {
  const tasks = await prisma.task.findMany({
    where: {
      status: 'ACTIVE',
      routine: {
        roleId,
        status: 'ACTIVE',
        ...(personId && {
          assignments: {
            some: { personId }
          }
        })
      }
    },
    include: {
      routine: true,
      completions: {
        where: {
          completedAt: {
            gte: startDate,
            lte: endDate
          },
          ...(personId && { personId })
        }
      }
    }
  });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return tasks.map((task) => {
    const completionsByDate = days.map((day) => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);

      const count = task.completions.filter(
        (c) => c.completedAt >= dayStart && c.completedAt <= dayEnd
      ).length;

      return {
        date: format(day, 'yyyy-MM-dd'),
        count
      };
    });

    return {
      taskId: task.id,
      taskName: task.name,
      routineName: task.routine.name,
      completions: completionsByDate
    };
  });
}

/**
 * Export analytics data as CSV
 */
export async function exportAnalyticsCSV(
  roleId: string,
  personId: string | null,
  startDate: Date,
  endDate: Date
): Promise<string> {
  const completionTrend = await getCompletionTrend(roleId, personId, startDate, endDate);

  const headers = ['Date', 'Completions', 'Total Tasks', 'Completion Rate (%)'];
  const rows = completionTrend.map((d) => [
    d.date,
    d.completions.toString(),
    d.totalTasks.toString(),
    d.completionRate.toString()
  ]);

  const csv = [
    headers.join(','),
    ...rows.map((row) => row.join(','))
  ].join('\n');

  return csv;
}
```

---

### 2. Marketplace Service

**File: `/lib/services/marketplace.service.ts`**

```typescript
import { prisma } from '@/lib/prisma';
import { Routine, Goal, Task } from '@prisma/client';

export interface PublishOptions {
  sourceId: string; // Routine or Goal ID
  type: 'ROUTINE' | 'GOAL';
  roleId: string;
  visibility: 'PUBLIC' | 'UNLISTED' | 'PRIVATE';
  category?: string;
  ageGroup?: string;
  tags?: string[];
}

export interface MarketplaceItem {
  id: string;
  type: 'ROUTINE' | 'GOAL';
  name: string;
  description: string;
  authorName: string;
  version: string;
  visibility: string;
  category: string | null;
  ageGroup: string | null;
  tags: string[];
  rating: number;
  ratingCount: number;
  forkCount: number;
  createdAt: Date;
}

/**
 * Publish routine or goal to marketplace
 */
export async function publishToMarketplace(
  options: PublishOptions
): Promise<MarketplaceItem> {
  const { sourceId, type, roleId, visibility, category, ageGroup, tags } = options;

  // Get source item
  let sourceItem: any;
  if (type === 'ROUTINE') {
    sourceItem = await prisma.routine.findUnique({
      where: { id: sourceId },
      include: { tasks: true }
    });
  } else {
    sourceItem = await prisma.goal.findUnique({
      where: { id: sourceId },
      include: {
        taskLinks: { include: { task: true } },
        routineLinks: { include: { routine: true } }
      }
    });
  }

  if (!sourceItem) {
    throw new Error(`${type} not found`);
  }

  // Check if already published
  const existing = await prisma.marketplaceItem.findFirst({
    where: {
      sourceId,
      type,
      authorRoleId: roleId
    }
  });

  if (existing) {
    throw new Error('Item already published. Use updateMarketplaceItem to update.');
  }

  // Create marketplace item
  const marketplaceItem = await prisma.marketplaceItem.create({
    data: {
      type,
      sourceId,
      authorRoleId: roleId,
      name: sourceItem.name,
      description: sourceItem.description || '',
      visibility,
      category: category || null,
      ageGroup: ageGroup || null,
      tags: tags || [],
      version: '1.0.0',
      content: JSON.stringify(sourceItem), // Store snapshot
      rating: 0,
      ratingCount: 0,
      forkCount: 0
    },
    include: {
      authorRole: {
        include: { user: true }
      }
    }
  });

  return {
    id: marketplaceItem.id,
    type: marketplaceItem.type as 'ROUTINE' | 'GOAL',
    name: marketplaceItem.name,
    description: marketplaceItem.description,
    authorName: marketplaceItem.authorRole.user.name || 'Anonymous',
    version: marketplaceItem.version,
    visibility: marketplaceItem.visibility,
    category: marketplaceItem.category,
    ageGroup: marketplaceItem.ageGroup,
    tags: marketplaceItem.tags,
    rating: marketplaceItem.rating,
    ratingCount: marketplaceItem.ratingCount,
    forkCount: marketplaceItem.forkCount,
    createdAt: marketplaceItem.createdAt
  };
}

/**
 * Update marketplace item (increment version)
 */
export async function updateMarketplaceItem(
  marketplaceItemId: string,
  roleId: string,
  sourceId: string
): Promise<void> {
  const item = await prisma.marketplaceItem.findUnique({
    where: { id: marketplaceItemId }
  });

  if (!item) {
    throw new Error('Marketplace item not found');
  }

  if (item.authorRoleId !== roleId) {
    throw new Error('Permission denied');
  }

  // Get updated source
  let sourceItem: any;
  if (item.type === 'ROUTINE') {
    sourceItem = await prisma.routine.findUnique({
      where: { id: sourceId },
      include: { tasks: true }
    });
  } else {
    sourceItem = await prisma.goal.findUnique({
      where: { id: sourceId },
      include: {
        taskLinks: { include: { task: true } },
        routineLinks: { include: { routine: true } }
      }
    });
  }

  // Increment version (semantic versioning)
  const [major, minor, patch] = item.version.split('.').map(Number);
  const newVersion = `${major}.${minor}.${patch + 1}`;

  await prisma.marketplaceItem.update({
    where: { id: marketplaceItemId },
    data: {
      name: sourceItem.name,
      description: sourceItem.description || '',
      version: newVersion,
      content: JSON.stringify(sourceItem),
      updatedAt: new Date()
    }
  });
}

/**
 * Fork marketplace item (import to user's account)
 */
export async function forkMarketplaceItem(
  marketplaceItemId: string,
  targetRoleId: string
): Promise<{ id: string; type: 'ROUTINE' | 'GOAL' }> {
  const item = await prisma.marketplaceItem.findUnique({
    where: { id: marketplaceItemId }
  });

  if (!item) {
    throw new Error('Marketplace item not found');
  }

  if (item.visibility === 'PRIVATE') {
    throw new Error('Cannot fork private item');
  }

  const content = JSON.parse(item.content);

  // Create copy in user's account
  if (item.type === 'ROUTINE') {
    const routine = await prisma.routine.create({
      data: {
        roleId: targetRoleId,
        name: `${content.name} (Forked)`,
        description: content.description,
        type: content.type,
        resetPeriod: content.resetPeriod,
        resetDay: content.resetDay,
        status: 'ACTIVE',
        sourceMarketplaceItemId: marketplaceItemId
      }
    });

    // Copy tasks
    for (const task of content.tasks) {
      await prisma.task.create({
        data: {
          routineId: routine.id,
          name: task.name,
          description: task.description,
          type: task.type,
          order: task.order,
          targetValue: task.targetValue,
          status: 'ACTIVE'
        }
      });
    }

    // Increment fork count
    await prisma.marketplaceItem.update({
      where: { id: marketplaceItemId },
      data: { forkCount: { increment: 1 } }
    });

    return { id: routine.id, type: 'ROUTINE' };
  } else {
    // Fork goal
    const goal = await prisma.goal.create({
      data: {
        roleId: targetRoleId,
        name: `${content.name} (Forked)`,
        description: content.description,
        period: content.period,
        resetDay: content.resetDay,
        target: content.target,
        status: 'ACTIVE',
        sourceMarketplaceItemId: marketplaceItemId
      }
    });

    await prisma.marketplaceItem.update({
      where: { id: marketplaceItemId },
      data: { forkCount: { increment: 1 } }
    });

    return { id: goal.id, type: 'GOAL' };
  }
}

/**
 * Search marketplace
 */
export async function searchMarketplace(
  query: string,
  filters: {
    type?: 'ROUTINE' | 'GOAL';
    category?: string;
    ageGroup?: string;
    tags?: string[];
  },
  sortBy: 'rating' | 'popularity' | 'date' = 'rating'
): Promise<MarketplaceItem[]> {
  const items = await prisma.marketplaceItem.findMany({
    where: {
      visibility: 'PUBLIC',
      ...(query && {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      }),
      ...(filters.type && { type: filters.type }),
      ...(filters.category && { category: filters.category }),
      ...(filters.ageGroup && { ageGroup: filters.ageGroup }),
      ...(filters.tags && filters.tags.length > 0 && {
        tags: { hasSome: filters.tags }
      })
    },
    include: {
      authorRole: {
        include: { user: true }
      }
    },
    orderBy:
      sortBy === 'rating'
        ? { rating: 'desc' }
        : sortBy === 'popularity'
        ? { forkCount: 'desc' }
        : { createdAt: 'desc' }
  });

  return items.map((item) => ({
    id: item.id,
    type: item.type as 'ROUTINE' | 'GOAL',
    name: item.name,
    description: item.description,
    authorName: item.authorRole.user.name || 'Anonymous',
    version: item.version,
    visibility: item.visibility,
    category: item.category,
    ageGroup: item.ageGroup,
    tags: item.tags,
    rating: item.rating,
    ratingCount: item.ratingCount,
    forkCount: item.forkCount,
    createdAt: item.createdAt
  }));
}

/**
 * Rate marketplace item
 */
export async function rateMarketplaceItem(
  marketplaceItemId: string,
  userId: string,
  rating: number
): Promise<void> {
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  // Check if user already rated
  const existing = await prisma.marketplaceRating.findUnique({
    where: {
      marketplaceItemId_userId: {
        marketplaceItemId,
        userId
      }
    }
  });

  if (existing) {
    // Update existing rating
    await prisma.marketplaceRating.update({
      where: { id: existing.id },
      data: { rating }
    });
  } else {
    // Create new rating
    await prisma.marketplaceRating.create({
      data: {
        marketplaceItemId,
        userId,
        rating
      }
    });
  }

  // Recalculate average rating
  const ratings = await prisma.marketplaceRating.findMany({
    where: { marketplaceItemId }
  });

  const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

  await prisma.marketplaceItem.update({
    where: { id: marketplaceItemId },
    data: {
      rating: Math.round(avgRating * 100) / 100,
      ratingCount: ratings.length
    }
  });
}

/**
 * Add comment to marketplace item
 */
export async function addComment(
  marketplaceItemId: string,
  userId: string,
  text: string
): Promise<void> {
  if (text.length > 500) {
    throw new Error('Comment must be 500 characters or less');
  }

  await prisma.marketplaceComment.create({
    data: {
      marketplaceItemId,
      userId,
      text,
      status: 'ACTIVE'
    }
  });
}

/**
 * Flag comment as inappropriate
 */
export async function flagComment(
  commentId: string,
  userId: string,
  reason: string
): Promise<void> {
  await prisma.commentFlag.create({
    data: {
      commentId,
      userId,
      reason
    }
  });

  // Auto-hide after 3 flags
  const flagCount = await prisma.commentFlag.count({
    where: { commentId }
  });

  if (flagCount >= 3) {
    await prisma.marketplaceComment.update({
      where: { id: commentId },
      data: { status: 'FLAGGED' }
    });
  }
}
```

---

### 3. Stripe Service

**File: `/lib/services/stripe.service.ts`**

```typescript
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

export enum Tier {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
  SCHOOL = 'SCHOOL'
}

export const TIER_PRICES = {
  BASIC: 500, // $5.00
  PREMIUM: 1000, // $10.00
  SCHOOL: 2500 // $25.00
};

export const TIER_LIMITS = {
  FREE: {
    persons: 3,
    groups: 0,
    routines: 10,
    tasksPerRoutine: 10,
    goals: 3,
    kioskCodes: 1
  },
  BASIC: {
    persons: 10,
    groups: 3,
    routines: 50,
    tasksPerRoutine: 20,
    goals: 10,
    kioskCodes: 5
  },
  PREMIUM: {
    persons: 50,
    groups: 10,
    routines: 200,
    tasksPerRoutine: 50,
    goals: 50,
    kioskCodes: 20
  },
  SCHOOL: {
    persons: 500,
    groups: 50,
    routines: 1000,
    tasksPerRoutine: 100,
    goals: 200,
    kioskCodes: 100
  }
};

/**
 * Create Stripe checkout session
 */
export async function createCheckoutSession(
  userId: string,
  roleId: string,
  tier: 'BASIC' | 'PREMIUM' | 'SCHOOL'
): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new Error('User not found');
  }

  const priceInCents = TIER_PRICES[tier];

  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Ruby Routines ${tier}`,
            description: `${tier} tier subscription`
          },
          unit_amount: priceInCents,
          recurring: {
            interval: 'month'
          }
        },
        quantity: 1
      }
    ],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?payment=cancelled`,
    metadata: {
      userId,
      roleId,
      tier
    }
  });

  return session.url!;
}

/**
 * Handle Stripe webhook
 */
export async function handleWebhook(
  event: Stripe.Event
): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;

    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;

    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
      break;
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { userId, roleId, tier } = session.metadata as {
    userId: string;
    roleId: string;
    tier: Tier;
  };

  // Update role tier
  await prisma.role.update({
    where: { id: roleId },
    data: {
      tier,
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription as string
    }
  });

  // Send confirmation email
  // (Implementation using Resend)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const role = await prisma.role.findFirst({
    where: { stripeSubscriptionId: subscription.id }
  });

  if (!role) return;

  // Update subscription status
  const status = subscription.status === 'active' ? 'ACTIVE' : 'PAUSED';

  await prisma.role.update({
    where: { id: role.id },
    data: { subscriptionStatus: status }
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const role = await prisma.role.findFirst({
    where: { stripeSubscriptionId: subscription.id }
  });

  if (!role) return;

  // Downgrade to FREE tier
  await prisma.role.update({
    where: { id: role.id },
    data: {
      tier: 'FREE',
      subscriptionStatus: 'CANCELLED'
    }
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Send payment failure email
  // (Implementation using Resend)
}

/**
 * Create billing portal session
 */
export async function createBillingPortalSession(
  userId: string
): Promise<string> {
  const role = await prisma.role.findFirst({
    where: {
      userId,
      stripeCustomerId: { not: null }
    }
  });

  if (!role || !role.stripeCustomerId) {
    throw new Error('No active subscription found');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: role.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`
  });

  return session.url;
}

/**
 * Check if action exceeds tier limit
 */
export async function checkTierLimit(
  tier: Tier,
  limitKey: keyof typeof TIER_LIMITS.FREE,
  currentCount: number
): Promise<void> {
  const limits = TIER_LIMITS[tier];
  const limit = limits[limitKey];

  if (currentCount >= limit) {
    throw new Error(
      `Tier limit exceeded. ${tier} tier allows ${limit} ${limitKey}. Upgrade to increase limit.`
    );
  }
}
```

---

### 4. Analytics tRPC Router

**File: `/lib/trpc/routers/analytics.router.ts`**

```typescript
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import {
  getCompletionTrend,
  getGoalProgress,
  getTaskHeatmap,
  exportAnalyticsCSV
} from '@/lib/services/analytics.service';

export const analyticsRouter = router({
  completionTrend: protectedProcedure
    .input(z.object({
      roleId: z.string().cuid(),
      personId: z.string().cuid().optional(),
      startDate: z.date(),
      endDate: z.date()
    }))
    .query(async ({ input }) => {
      return getCompletionTrend(
        input.roleId,
        input.personId || null,
        input.startDate,
        input.endDate
      );
    }),

  goalProgress: protectedProcedure
    .input(z.object({
      roleId: z.string().cuid(),
      personId: z.string().cuid().optional()
    }))
    .query(async ({ input }) => {
      return getGoalProgress(input.roleId, input.personId || null);
    }),

  taskHeatmap: protectedProcedure
    .input(z.object({
      roleId: z.string().cuid(),
      personId: z.string().cuid().optional(),
      startDate: z.date(),
      endDate: z.date()
    }))
    .query(async ({ input }) => {
      return getTaskHeatmap(
        input.roleId,
        input.personId || null,
        input.startDate,
        input.endDate
      );
    }),

  exportCSV: protectedProcedure
    .input(z.object({
      roleId: z.string().cuid(),
      personId: z.string().cuid().optional(),
      startDate: z.date(),
      endDate: z.date()
    }))
    .query(async ({ input }) => {
      return exportAnalyticsCSV(
        input.roleId,
        input.personId || null,
        input.startDate,
        input.endDate
      );
    })
});
```

---

### 5. Stripe Webhook Handler

**File: `/app/api/webhooks/stripe/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { handleWebhook } from '@/lib/services/stripe.service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    await handleWebhook(event);
    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Webhook handler error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

---

### 6. Analytics Components

**File: `/components/analytics/CompletionChart.tsx`**

```typescript
'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { CompletionTrendData } from '@/lib/services/analytics.service';

interface CompletionChartProps {
  data: CompletionTrendData[];
}

export function CompletionChart({ data }: CompletionChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };

    const x = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => new Date(d.date)) as [Date, Date])
      .range([margin.left, width - margin.right]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.completionRate) || 100])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const line = d3
      .line<CompletionTrendData>()
      .x((d) => x(new Date(d.date)))
      .y((d) => y(d.completionRate));

    // Add axes
    svg
      .append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x));

    svg
      .append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));

    // Add line
    svg
      .append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#7c3aed')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Add dots
    svg
      .selectAll('circle')
      .data(data)
      .join('circle')
      .attr('cx', (d) => x(new Date(d.date)))
      .attr('cy', (d) => y(d.completionRate))
      .attr('r', 4)
      .attr('fill', '#7c3aed');
  }, [data]);

  return (
    <div className="rounded-lg border bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold">Completion Rate Trend</h3>
      <svg ref={svgRef} width={800} height={400} />
    </div>
  );
}
```

---

### 7. Marketplace Components

**File: `/components/marketplace/ItemCard.tsx`**

```typescript
'use client';

import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MarketplaceItem } from '@/lib/services/marketplace.service';

interface ItemCardProps {
  item: MarketplaceItem;
  onFork: (id: string) => void;
}

export function ItemCard({ item, onFork }: ItemCardProps) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{item.name}</h3>
          <p className="text-sm text-gray-500">by {item.authorName}</p>
        </div>
        <span className="rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-700">
          {item.type}
        </span>
      </div>

      <p className="mb-4 text-gray-600 line-clamp-2">{item.description}</p>

      <div className="mb-4 flex items-center space-x-4 text-sm text-gray-500">
        <div className="flex items-center">
          <Star className="mr-1 h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span>{item.rating.toFixed(1)}</span>
          <span className="ml-1">({item.ratingCount})</span>
        </div>
        <span>{item.forkCount} forks</span>
        {item.category && <span>{item.category}</span>}
        {item.ageGroup && <span>{item.ageGroup}</span>}
      </div>

      {item.tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <Button onClick={() => onFork(item.id)} className="w-full">
        Fork to My Account
      </Button>
    </div>
  );
}
```

---

## Environment Variables

Add to `.env.local`:

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Testing Checklist

### Analytics
- [ ] Completion trend chart renders with mock data
- [ ] Goal progress chart shows accurate percentages
- [ ] Task heatmap displays completion frequency
- [ ] CSV export downloads correctly
- [ ] Filter by person works
- [ ] Date range filter works

### Marketplace
- [ ] Publish routine to marketplace
- [ ] Update marketplace item increments version
- [ ] Fork marketplace item creates independent copy
- [ ] Search by keyword returns correct results
- [ ] Filter by category, age group, tags
- [ ] Sort by rating, popularity, date

### Rating & Comments
- [ ] Rate marketplace item (1-5 stars)
- [ ] Average rating recalculates correctly
- [ ] Add comment (max 500 chars)
- [ ] Flag comment (auto-hide after 3 flags)
- [ ] Author can respond to comments

### Stripe
- [ ] Create checkout session redirects to Stripe
- [ ] Webhook handles checkout.session.completed
- [ ] Tier upgrades successfully
- [ ] Billing portal allows subscription management
- [ ] Payment failure downgrades to FREE tier
- [ ] Tier limits enforced on create operations

---

## Common Issues

### Issue: D3.js chart not rendering
**Solution:** Ensure `d3` is installed: `npm install d3 @types/d3`. Check browser console for errors.

### Issue: Stripe webhook fails signature verification
**Solution:** Use Stripe CLI to forward webhooks to localhost: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

### Issue: Tier limits not enforced
**Solution:** Verify `checkTierLimit` is called on all create mutations (person, routine, task, goal).

---

## Dependencies

```bash
npm install stripe d3 @types/d3
npm install -D @stripe/stripe-js
```

---

## Next Steps

After completing Stage 6:
1. Test all analytics charts with real data
2. Publish sample routines to marketplace
3. Test Stripe checkout and billing portal
4. Deploy to production (Vercel + Supabase)
5. Set up monitoring (Sentry, LogRocket)

---

**Stage 6 Complete Checklist:**
- [ ] Analytics service (completion trend, goal progress, heatmap)
- [ ] D3.js charts (line, bar, heatmap)
- [ ] CSV export
- [ ] Marketplace service (publish, fork, search)
- [ ] Versioning system
- [ ] Rating and comment system
- [ ] Flagging and moderation
- [ ] Stripe integration (checkout, webhooks, billing portal)
- [ ] Tier limit enforcement
- [ ] All tests passing

---

## Production Deployment Checklist

### Pre-Deployment
- [ ] Test all features end-to-end
- [ ] Run Playwright E2E tests
- [ ] Test Stripe webhooks with production keys
- [ ] Verify RLS policies prevent unauthorized access
- [ ] Test tier limits for all tiers
- [ ] Review and fix all TypeScript errors

### Deployment
- [ ] Deploy to Vercel (connect GitHub repository)
- [ ] Set up Supabase production project
- [ ] Run database migrations on production
- [ ] Apply RLS policies on production
- [ ] Set environment variables on Vercel
- [ ] Configure custom domain
- [ ] Enable Vercel Analytics

### Post-Deployment
- [ ] Test auth flow (signup, login, email verification)
- [ ] Test Stripe checkout with production keys
- [ ] Monitor error logs (Sentry)
- [ ] Set up uptime monitoring (Better Uptime)
- [ ] Create backup strategy (Supabase automatic backups)

---

**🎉 All Stages Complete!**

You now have complete implementation guides for all 6 stages of Ruby Routines development. Each guide includes:
- Full session prompts for easy copy-paste
- Complete code examples
- Testing checklists
- Common issues and solutions

Total estimated timeline: **21-27 days**
Total estimated tokens: **510K tokens ($7.65)**

Good luck with your development! 🚀
