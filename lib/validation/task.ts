import { idValidator } from './id-validator';
import { z } from 'zod';
import { TaskType, EntityStatus } from '@/lib/types/prisma-enums';

// Base task input schema
export const createTaskSchema = z.object({
  routineId: idValidator,
  name: z.string().min(1, 'Task name is required').max(200),
  description: z.string().max(500).optional(),
  type: z.nativeEnum(TaskType).default(TaskType.SIMPLE),
  isSmart: z.boolean().default(false),
  conditionId: idValidator.optional(),
  order: z.number().int().min(0).default(0),
  unit: z.string().max(50).optional(),
  emoji: z.string().max(100).optional(),
  color: z.string().max(20).optional(),
});

// Update task schema
export const updateTaskSchema = z.object({
  id: idValidator,
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional().nullable(),
  type: z.nativeEnum(TaskType).optional(),
  isSmart: z.boolean().optional(),
  conditionId: idValidator.optional().nullable(),
  order: z.number().int().min(0).optional(),
  unit: z.string().max(50).optional().nullable(),
  emoji: z.string().max(100).optional().nullable(),
  color: z.string().max(20).optional().nullable(),
});

// Delete task schema
export const deleteTaskSchema = z.object({
  id: idValidator,
});

// Restore task schema
export const restoreTaskSchema = z.object({
  id: idValidator,
});

// Reorder tasks schema
export const reorderTasksSchema = z.object({
  routineId: idValidator,
  taskIds: z.array(idValidator),
});

// List tasks schema
export const listTasksSchema = z.object({
  routineId: idValidator,
  includeInactive: z.boolean().optional().default(false),
});

// Get task by ID schema
export const getTaskByIdSchema = z.object({
  id: idValidator,
});

// Complete task schema
export const completeTaskSchema = z.object({
  taskId: idValidator,
  personId: idValidator,
  value: z.string().optional(), // For PROGRESS type
  notes: z.string().max(500).optional(),
});

// Undo completion schema
export const undoCompletionSchema = z.object({
  completionId: idValidator,
});

// Get task completions schema
export const getTaskCompletionsSchema = z.object({
  taskId: idValidator,
  personId: idValidator.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});
