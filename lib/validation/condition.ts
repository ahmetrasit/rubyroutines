import { idValidator } from './id-validator';
import { z } from 'zod';
import { ConditionLogic, ConditionOperator, TimeOperator } from '@/lib/types/prisma-enums';

// Condition check schema - Enhanced for Phase 1
export const conditionCheckSchema = z.object({
  id: idValidator.optional(), // Optional for creation
  negate: z.boolean().default(false),
  operator: z.nativeEnum(ConditionOperator),
  value: z.string().optional(),
  value2: z.string().optional(), // For range operators (Phase 2)

  // Targets
  targetTaskId: idValidator.optional(),
  targetRoutineId: idValidator.optional(),
  targetGoalId: idValidator.optional(),

  // Time-based conditions (Phase 1)
  timeOperator: z.nativeEnum(TimeOperator).optional(),
  timeValue: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(), // HH:MM format
  dayOfWeek: z.array(z.number().int().min(0).max(6)).optional(), // 0-6 for days
}).refine((data) => {
  // At least one target must be specified OR it must be a time-based condition
  const hasTarget = data.targetTaskId || data.targetRoutineId || data.targetGoalId;
  const isTimeBased = data.operator === 'TIME_OF_DAY' || data.operator === 'DAY_OF_WEEK';
  return hasTarget || isTimeBased;
}, {
  message: 'At least one target (task, routine, or goal) must be specified, or condition must be time-based',
  path: ['targetTaskId'],
});

// Create condition schema - Enhanced for Phase 1
export const createConditionSchema = z.object({
  routineId: idValidator.optional(), // Optional for standalone conditions (Phase 2)
  name: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  controlsRoutine: z.boolean().default(false),
  logic: z.nativeEnum(ConditionLogic).default(ConditionLogic.AND),
  checks: z.array(conditionCheckSchema).min(1, 'At least one check is required'),
});

// Update condition schema
export const updateConditionSchema = z.object({
  id: idValidator,
  name: z.string().max(100).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  logic: z.nativeEnum(ConditionLogic).optional(),
  checks: z.array(conditionCheckSchema).optional(),
});

// Delete condition schema
export const deleteConditionSchema = z.object({
  id: idValidator,
});

// Get condition by ID schema
export const getConditionByIdSchema = z.object({
  id: idValidator,
});
export const getConditionSchema = getConditionByIdSchema; // Alias for consistency

// List conditions for routine schema
export const listConditionsSchema = z.object({
  routineId: idValidator.optional(),
  controlsRoutine: z.boolean().optional(),
});

// Evaluate condition schema - Enhanced for Phase 1
export const evaluateConditionSchema = z.object({
  conditionId: idValidator,
  personId: idValidator,
  context: z.object({
    currentTime: z.string().optional(), // ISO string
    dayOfWeek: z.number().int().min(0).max(6).optional(),
  }).optional(),
});

// Batch evaluation schema for performance
export const evaluateBatchSchema = z.object({
  routineIds: z.array(idValidator).min(1).max(100),
  personId: idValidator,
  context: z.object({
    currentTime: z.string().optional(),
    dayOfWeek: z.number().int().min(0).max(6).optional(),
  }).optional(),
});

// Type exports for use in routers and services
export type CreateConditionInput = z.infer<typeof createConditionSchema>;
export type UpdateConditionInput = z.infer<typeof updateConditionSchema>;
export type DeleteConditionInput = z.infer<typeof deleteConditionSchema>;
export type ListConditionsInput = z.infer<typeof listConditionsSchema>;
export type GetConditionInput = z.infer<typeof getConditionSchema>;
export type EvaluateConditionInput = z.infer<typeof evaluateConditionSchema>;
export type EvaluateBatchInput = z.infer<typeof evaluateBatchSchema>;
