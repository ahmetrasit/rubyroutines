import { z } from 'zod';
import { TaskType, EntityStatus } from '@/lib/types/prisma-enums';

// Base task input schema
export const createTaskSchema = z.object({
  routineId: z.string().cuid(),
  name: z.string().min(1, 'Task name is required').max(200),
  description: z.string().max(500).optional(),
  type: z.nativeEnum(TaskType).default(TaskType.SIMPLE),
  order: z.number().int().min(0).default(0),
  targetValue: z.number().positive().optional(),
  unit: z.string().max(50).optional(),
}).refine((data) => {
  // PROGRESS tasks must have targetValue and unit
  if (data.type === TaskType.PROGRESS) {
    return data.targetValue !== undefined && data.unit !== undefined;
  }
  return true;
}, {
  message: 'Progress tasks must have targetValue and unit',
  path: ['targetValue'],
});

// Update task schema
export const updateTaskSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional().nullable(),
  type: z.nativeEnum(TaskType).optional(),
  order: z.number().int().min(0).optional(),
  targetValue: z.number().positive().optional().nullable(),
  unit: z.string().max(50).optional().nullable(),
});

// Delete task schema
export const deleteTaskSchema = z.object({
  id: z.string().cuid(),
});

// Restore task schema
export const restoreTaskSchema = z.object({
  id: z.string().cuid(),
});

// Reorder tasks schema
export const reorderTasksSchema = z.object({
  routineId: z.string().cuid(),
  taskIds: z.array(z.string().cuid()),
});

// List tasks schema
export const listTasksSchema = z.object({
  routineId: z.string().cuid(),
  includeInactive: z.boolean().optional().default(false),
});

// Get task by ID schema
export const getTaskByIdSchema = z.object({
  id: z.string().cuid(),
});

// Complete task schema
export const completeTaskSchema = z.object({
  taskId: z.string().cuid(),
  personId: z.string().cuid(),
  value: z.string().optional(), // For PROGRESS type
  notes: z.string().max(500).optional(),
});

// Undo completion schema
export const undoCompletionSchema = z.object({
  completionId: z.string().cuid(),
});

// Get task completions schema
export const getTaskCompletionsSchema = z.object({
  taskId: z.string().cuid(),
  personId: z.string().cuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});
