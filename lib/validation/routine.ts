import { idValidator } from './id-validator';
import { z } from 'zod';
import { RoutineType, ResetPeriod, Visibility } from '@/lib/types/prisma-enums';

// Time format validator (HH:MM in 24-hour format)
const timeValidator = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)').optional().nullable();

export const createRoutineSchema = z.object({
  roleId: idValidator,
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  type: z.nativeEnum(RoutineType).default(RoutineType.REGULAR),
  resetPeriod: z.nativeEnum(ResetPeriod).default(ResetPeriod.DAILY),
  resetDay: z.number().int().min(0).max(99).optional().nullable(),
  visibility: z.nativeEnum(Visibility).default(Visibility.ALWAYS),
  visibleDays: z.array(z.number().int().min(0).max(6)).default([]),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  startTime: timeValidator,
  endTime: timeValidator,
  personIds: z.array(idValidator).optional().default([]),
}).refine((data) => {
  // If both times are provided, validate that start is before end
  if (data.startTime && data.endTime) {
    return data.startTime < data.endTime;
  }
  return true;
}, {
  message: 'Start time must be earlier than end time',
  path: ['startTime'],
});

export const updateRoutineSchema = z.object({
  id: idValidator,
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  resetPeriod: z.nativeEnum(ResetPeriod).optional(),
  resetDay: z.number().int().min(0).max(99).optional().nullable(),
  visibility: z.nativeEnum(Visibility).optional(),
  visibleDays: z.array(z.number().int().min(0).max(6)).optional(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  startTime: timeValidator,
  endTime: timeValidator,
}).refine((data) => {
  // If both times are provided, validate that start is before end
  if (data.startTime && data.endTime) {
    return data.startTime < data.endTime;
  }
  return true;
}, {
  message: 'Start time must be earlier than end time',
  path: ['startTime'],
});

export const deleteRoutineSchema = z.object({
  id: idValidator,
});

export const restoreRoutineSchema = z.object({
  id: idValidator,
});

export const listRoutinesSchema = z.object({
  roleId: idValidator.optional(),
  personId: idValidator.optional(),
  includeInactive: z.boolean().optional().default(false),
});

export const getRoutineSchema = z.object({
  id: idValidator,
});

export const copyRoutineSchema = z.object({
  routineId: idValidator,
  targetPersonIds: z.array(idValidator).min(1, 'At least one person required'),
});

export const createVisibilityOverrideSchema = z.object({
  routineId: idValidator,
  duration: z.number().int().min(10).max(60), // 10-60 minutes
});

export const cancelVisibilityOverrideSchema = z.object({
  routineId: idValidator,
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
