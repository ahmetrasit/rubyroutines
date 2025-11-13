import { z } from 'zod';
import { RoutineType, ResetPeriod, Visibility } from '@/lib/types/prisma-enums';

export const createRoutineSchema = z.object({
  roleId: z.string().cuid(),
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  type: z.nativeEnum(RoutineType).default(RoutineType.REGULAR),
  resetPeriod: z.nativeEnum(ResetPeriod).default(ResetPeriod.DAILY),
  resetDay: z.number().int().min(0).max(99).optional().nullable(),
  visibility: z.nativeEnum(Visibility).default(Visibility.ALWAYS),
  visibleDays: z.array(z.number().int().min(0).max(6)).default([]),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  personIds: z.array(z.string().cuid()).optional().default([]),
});

export const updateRoutineSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  resetPeriod: z.nativeEnum(ResetPeriod).optional(),
  resetDay: z.number().int().min(0).max(99).optional().nullable(),
  visibility: z.nativeEnum(Visibility).optional(),
  visibleDays: z.array(z.number().int().min(0).max(6)).optional(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
});

export const deleteRoutineSchema = z.object({
  id: z.string().cuid(),
});

export const restoreRoutineSchema = z.object({
  id: z.string().cuid(),
});

export const listRoutinesSchema = z.object({
  roleId: z.string().cuid().optional(),
  personId: z.string().cuid().optional(),
  includeInactive: z.boolean().optional().default(false),
});

export const getRoutineSchema = z.object({
  id: z.string().cuid(),
});

export const copyRoutineSchema = z.object({
  routineId: z.string().cuid(),
  targetPersonIds: z.array(z.string().cuid()).min(1, 'At least one person required'),
});

export const createVisibilityOverrideSchema = z.object({
  routineId: z.string().cuid(),
  duration: z.number().int().min(10).max(60), // 10-60 minutes
});

export const cancelVisibilityOverrideSchema = z.object({
  routineId: z.string().cuid(),
});

export type CreateRoutineInput = z.infer<typeof createRoutineSchema>;
export type UpdateRoutineInput = z.infer<typeof updateRoutineSchema>;
export type DeleteRoutineInput = z.infer<typeof deleteRoutineSchema>;
export type RestoreRoutineInput = z.infer<typeof restoreRoutineSchema>;
export type ListRoutinesInput = z.infer<typeof listRoutinesSchema>;
export type GetRoutineInput = z.infer<typeof getRoutineSchema>;
export type CopyRoutineInput = z.infer<typeof copyRoutineSchema>;
export type CreateVisibilityOverrideInput = z.infer<typeof createVisibilityOverrideSchema>;
export type CancelVisibilityOverrideInput = z.infer<typeof cancelVisibilityOverrideSchema>;
