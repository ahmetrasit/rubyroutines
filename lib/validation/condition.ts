import { idValidator } from './id-validator';
import { z } from 'zod';
import { ConditionLogic, ConditionOperator } from '@/lib/types/prisma-enums';

// Condition check schema
export const conditionCheckSchema = z.object({
  id: idValidator.optional(), // Optional for creation
  negate: z.boolean().default(false),
  operator: z.nativeEnum(ConditionOperator),
  value: z.string().optional(),
  targetTaskId: idValidator.optional(),
  targetRoutineId: idValidator.optional(),
  targetGoalId: idValidator.optional(),
}).refine((data) => {
  // At least one target must be specified
  const hasTarget = data.targetTaskId || data.targetRoutineId || data.targetGoalId;
  return hasTarget;
}, {
  message: 'At least one target (task, routine, or goal) must be specified',
  path: ['targetTaskId'],
});

// Create condition schema
export const createConditionSchema = z.object({
  routineId: idValidator,
  controlsRoutine: z.boolean().default(false),
  logic: z.nativeEnum(ConditionLogic).default(ConditionLogic.AND),
  checks: z.array(conditionCheckSchema).min(1, 'At least one check is required'),
});

// Update condition schema
export const updateConditionSchema = z.object({
  id: idValidator,
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

// List conditions for routine schema
export const listConditionsSchema = z.object({
  routineId: idValidator,
  controlsRoutine: z.boolean().optional(),
});

// Evaluate condition schema
export const evaluateConditionSchema = z.object({
  conditionId: idValidator,
  personId: idValidator, // For task/routine completion context
});
