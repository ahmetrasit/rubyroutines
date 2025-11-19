import { z } from 'zod';
import { EntityStatus, GoalType, ResetPeriod } from '@/lib/types/prisma-enums';
import { idValidator } from './id-validator';

// ============================================================================
// GOAL SCHEMAS
// ============================================================================

export const createGoalSchema = z.object({
  roleId: idValidator,
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),

  // Goal Configuration
  type: z.nativeEnum(GoalType).default('COMPLETION_COUNT'),
  target: z.number().positive('Target must be positive'),
  unit: z.string().max(50).optional(),
  period: z.nativeEnum(ResetPeriod).default('WEEKLY'),
  resetDay: z.number().int().min(0).max(6).optional(), // 0 = Sunday, 6 = Saturday

  // Goal Scope
  personIds: z.array(idValidator).default([]),
  groupIds: z.array(idValidator).default([]),

  // Task links
  taskIds: z.array(idValidator).optional().default([]),
});

export const updateGoalSchema = z.object({
  id: idValidator,
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),

  // Goal Configuration
  type: z.nativeEnum(GoalType).optional(),
  target: z.number().positive().optional(),
  unit: z.string().max(50).optional().nullable(),
  period: z.nativeEnum(ResetPeriod).optional(),
  resetDay: z.number().int().min(0).max(6).optional().nullable(),

  // Goal Scope
  personIds: z.array(idValidator).optional(),
  groupIds: z.array(idValidator).optional(),

  // Task links
  taskIds: z.array(idValidator).optional(),
});

export const deleteGoalSchema = z.object({
  id: idValidator,
});

export const archiveGoalSchema = z.object({
  id: idValidator,
});

export const listGoalsSchema = z.object({
  roleId: idValidator,
  includeInactive: z.boolean().optional().default(false),
  personId: idValidator.optional(), // Filter by person
  groupId: idValidator.optional(),  // Filter by group
  type: z.nativeEnum(GoalType).optional(), // Filter by type
});

export const getGoalSchema = z.object({
  id: idValidator,
});

// ============================================================================
// GOAL PROGRESS SCHEMAS
// ============================================================================

export const getGoalProgressSchema = z.object({
  goalId: idValidator,
  personId: idValidator.optional(), // Get progress for specific person
  dateRange: z.object({
    start: z.coerce.date(),
    end: z.coerce.date(),
  }).optional(),
});

export const updateGoalProgressSchema = z.object({
  goalId: idValidator,
  personId: idValidator,
  value: z.number().nonnegative('Value must be non-negative'),
  increment: z.boolean().optional().default(false), // If true, add to current value
});

// ============================================================================
// GOAL LINK SCHEMAS
// ============================================================================

export const linkTaskToGoalSchema = z.object({
  goalId: idValidator,
  taskId: idValidator,
  weight: z.number().positive().optional().default(1.0),
});

export const linkRoutineToGoalSchema = z.object({
  goalId: idValidator,
  routineId: idValidator,
  weight: z.number().positive().optional().default(1.0),
});

export const unlinkTaskFromGoalSchema = z.object({
  goalId: idValidator,
  taskId: idValidator,
});

export const unlinkRoutineFromGoalSchema = z.object({
  goalId: idValidator,
  routineId: idValidator,
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type DeleteGoalInput = z.infer<typeof deleteGoalSchema>;
export type ArchiveGoalInput = z.infer<typeof archiveGoalSchema>;
export type ListGoalsInput = z.infer<typeof listGoalsSchema>;
export type GetGoalInput = z.infer<typeof getGoalSchema>;

export type GetGoalProgressInput = z.infer<typeof getGoalProgressSchema>;
export type UpdateGoalProgressInput = z.infer<typeof updateGoalProgressSchema>;

export type LinkTaskToGoalInput = z.infer<typeof linkTaskToGoalSchema>;
export type LinkRoutineToGoalInput = z.infer<typeof linkRoutineToGoalSchema>;
export type UnlinkTaskFromGoalInput = z.infer<typeof unlinkTaskFromGoalSchema>;
export type UnlinkRoutineFromGoalInput = z.infer<typeof unlinkRoutineFromGoalSchema>;