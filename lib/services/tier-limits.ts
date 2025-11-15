import { Tier } from '@/lib/types/prisma-enums';
import { TRPCError } from '@trpc/server';

type LimitKey =
  | 'children_per_family'
  | 'students_per_classroom'
  | 'routines_per_person'
  | 'tasks_per_routine'
  | 'smart_tasks_per_routine'
  | 'goals'
  | 'items_per_goal';

const TIER_LIMITS: Record<Tier, Record<LimitKey, number>> = {
  [Tier.FREE]: {
    children_per_family: 3,
    students_per_classroom: 24,
    routines_per_person: 2,
    tasks_per_routine: 5,
    smart_tasks_per_routine: 1,
    goals: 3,
    items_per_goal: 3,
  },
  [Tier.BRONZE]: {
    children_per_family: 5,
    students_per_classroom: 50,
    routines_per_person: 5,
    tasks_per_routine: 10,
    smart_tasks_per_routine: 3,
    goals: 5,
    items_per_goal: 5,
  },
  [Tier.GOLD]: {
    children_per_family: 10,
    students_per_classroom: 100,
    routines_per_person: 10,
    tasks_per_routine: 20,
    smart_tasks_per_routine: 10,
    goals: 10,
    items_per_goal: 10,
  },
  [Tier.PRO]: {
    children_per_family: 50,
    students_per_classroom: 500,
    routines_per_person: 50,
    tasks_per_routine: 100,
    smart_tasks_per_routine: 25,
    goals: 20,
    items_per_goal: 20,
  },
};

export function getTierLimit(tier: Tier, limitKey: LimitKey): number {
  return TIER_LIMITS[tier][limitKey];
}

export function checkTierLimit(
  tier: Tier,
  limitKey: LimitKey,
  currentCount: number
): void {
  const limit = getTierLimit(tier, limitKey);

  if (currentCount >= limit) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Tier limit reached: ${limitKey} (${limit} max for ${tier} tier)`,
    });
  }
}

export function canAddMore(
  tier: Tier,
  limitKey: LimitKey,
  currentCount: number
): boolean {
  const limit = getTierLimit(tier, limitKey);
  return currentCount < limit;
}
