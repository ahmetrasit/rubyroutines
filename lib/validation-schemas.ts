/**
 * Shared Validation Schemas
 *
 * Zod schemas for client-side and server-side validation.
 * Import these schemas in both forms and tRPC routers for consistency.
 */

import { z } from 'zod';
import { VALIDATION } from './utils/constants';

// ============================================================================
// Common Field Schemas
// ============================================================================

export const nameSchema = z
  .string()
  .min(VALIDATION.name.minLength, 'Name is required')
  .max(VALIDATION.name.maxLength, `Name must be less than ${VALIDATION.name.maxLength} characters`)
  .trim();

export const optionalNameSchema = nameSchema.optional();

export const descriptionSchema = z
  .string()
  .max(VALIDATION.description.maxLength, `Description must be less than ${VALIDATION.description.maxLength} characters`)
  .optional()
  .nullable();

export const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .max(VALIDATION.email.maxLength, 'Email is too long')
  .toLowerCase()
  .trim();

export const passwordSchema = z
  .string()
  .min(VALIDATION.password.minLength, `Password must be at least ${VALIDATION.password.minLength} characters`)
  .max(VALIDATION.password.maxLength, 'Password is too long');

export const colorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Please enter a valid hex color (e.g., #FF5733)')
  .optional()
  .nullable();

export const urlSchema = z
  .string()
  .url('Please enter a valid URL')
  .optional()
  .nullable();

// ============================================================================
// Person Validation
// ============================================================================

export const personSchema = z.object({
  name: nameSchema,
  avatar: z.string().optional().nullable(), // JSON string with color/emoji
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
});

export const createPersonSchema = personSchema.extend({
  roleId: z.string().cuid('Invalid role ID'),
});

export const updatePersonSchema = personSchema.partial().extend({
  id: z.string().cuid('Invalid person ID'),
});

// ============================================================================
// Task Validation
// ============================================================================

export const taskBaseSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  type: z.enum(['SIMPLE', 'MULTIPLE_CHECKIN', 'PROGRESS', 'TIMED']),
  isSmart: z.boolean().default(false),
  order: z.number().int().min(0).max(VALIDATION.task.maxOrder).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
});

export const taskProgressSchema = z.object({
  unit: z.string().min(1, 'Unit is required for progress tasks').max(20),
  targetValue: z.number().positive('Target value must be positive').max(1000000),
});

export const taskTimedSchema = z.object({
  durationMinutes: z.number().int().positive('Duration must be positive').max(1440), // Max 24 hours
});

export const createTaskSchema = taskBaseSchema.extend({
  routineId: z.string().cuid('Invalid routine ID'),
  // Conditional validation based on type
}).and(
  z.discriminatedUnion('type', [
    z.object({ type: z.literal('SIMPLE') }),
    z.object({ type: z.literal('MULTIPLE_CHECKIN') }),
    z.object({ type: z.literal('PROGRESS') }).merge(taskProgressSchema),
    z.object({ type: z.literal('TIMED') }).merge(taskTimedSchema),
  ])
);

export const updateTaskSchema = z.intersection(
  taskBaseSchema.partial().extend({
    routineId: z.string().cuid('Invalid routine ID').optional(),
  }),
  z.discriminatedUnion('type', [
    z.object({ type: z.literal('SIMPLE') }),
    z.object({ type: z.literal('MULTIPLE_CHECKIN') }),
    z.object({ type: z.literal('PROGRESS') }).merge(taskProgressSchema.partial()),
    z.object({ type: z.literal('TIMED') }).merge(taskTimedSchema.partial()),
  ])
).and(z.object({
  id: z.string().cuid('Invalid task ID'),
}));

// ============================================================================
// Routine Validation
// ============================================================================

export const routineSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  color: colorSchema,
  type: z.enum(['REGULAR', 'SMART']).optional(),
  resetPeriod: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).optional(),
  visibility: z.enum(['ALWAYS', 'DAYS_OF_WEEK', 'DATE_RANGE', 'CONDITIONAL']).optional(),
  visibleDays: z.array(z.number().int().min(0).max(6)).optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:MM format').optional().nullable(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:MM format').optional().nullable(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
});

export const createRoutineSchema = routineSchema.extend({
  roleId: z.string().uuid('Invalid role ID'),
});

export const updateRoutineSchema = routineSchema.partial().extend({
  id: z.string().cuid('Invalid routine ID'),
});

// ============================================================================
// Group Validation
// ============================================================================

export const groupSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  type: z.enum(['FAMILY', 'CLASSROOM']),
  color: colorSchema,
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
});

export const createGroupSchema = groupSchema.extend({
  roleId: z.string().uuid('Invalid role ID'),
});

export const updateGroupSchema = groupSchema.partial().extend({
  id: z.string().cuid('Invalid group ID'),
});

// ============================================================================
// Goal Validation
// ============================================================================

export const goalSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  type: z.enum(['TASK_COUNT', 'ROUTINE_STREAK', 'COMPLETION_RATE', 'CUSTOM']),
  target: z.number().int().positive('Target must be positive').max(1000000),
  period: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM']),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'FAILED', 'ARCHIVED']).optional(),
});

export const createGoalSchema = goalSchema.extend({
  roleId: z.string().uuid('Invalid role ID'),
});

export const updateGoalSchema = goalSchema.partial().extend({
  id: z.string().cuid('Invalid goal ID'),
});

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validate form data with Zod schema and return user-friendly errors
 */
export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Convert Zod errors to user-friendly format
  const errors: Record<string, string> = {};
  result.error.errors.forEach((error) => {
    const path = error.path.join('.');
    errors[path] = error.message;
  });

  return { success: false, errors };
}

/**
 * Get first error message from validation errors
 */
export function getFirstError(errors: Record<string, string>): string | null {
  const keys = Object.keys(errors);
  const firstKey = keys[0];
  return firstKey ? errors[firstKey] ?? null : null;
}
