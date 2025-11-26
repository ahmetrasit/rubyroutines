import { PrismaClient, TaskType, Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { createHash } from 'crypto';

export interface CompleteTaskInput {
  taskId: string;
  personId: string;
  value?: string;
  notes?: string;
  resetDate: Date;
  deviceId?: string;
  sessionId?: string;
}

/**
 * Main entry point for coordinated task completion
 * Routes to appropriate strategy based on task type
 */
export async function completeTaskCoordinated(
  prisma: PrismaClient,
  input: CompleteTaskInput
) {
  // Get task type
  const task = await prisma.task.findUniqueOrThrow({
    where: { id: input.taskId },
    select: {
      type: true,
      routine: {
        select: { resetPeriod: true, resetDay: true }
      }
    }
  });

  // Generate idempotency key
  const idempotencyKey = generateIdempotencyKey(input);

  // Check for duplicate request
  const existing = await prisma.taskCompletion.findUnique({
    where: { idempotencyKey }
  });

  if (existing) {
    return { completion: existing, wasCached: true };
  }

  // Route to appropriate handler
  switch (task.type) {
    case TaskType.SIMPLE:
      return {
        completion: await completeSimpleTaskAtomic(prisma, input, idempotencyKey),
        wasCached: false
      };

    case TaskType.MULTIPLE_CHECKIN:
      return {
        completion: await completeMultipleCheckinTaskAtomic(prisma, input, idempotencyKey),
        wasCached: false
      };

    case TaskType.PROGRESS:
      return {
        completion: await completeProgressTaskAtomic(prisma, input, idempotencyKey),
        wasCached: false
      };

    default:
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Unknown task type'
      });
  }
}

/**
 * Complete SIMPLE task atomically
 * Only allows 1 completion per period
 */
async function completeSimpleTaskAtomic(
  prisma: PrismaClient,
  input: CompleteTaskInput,
  idempotencyKey: string
) {
  try {
    return await prisma.$transaction(async (tx) => {
      // Check for existing completion in period using SELECT FOR UPDATE NOWAIT
      // NOWAIT fails immediately if row is locked, providing better UX
      const existing = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM "task_completions"
        WHERE "taskId" = ${input.taskId}
          AND "personId" = ${input.personId}
          AND "completedAt" >= ${input.resetDate}
        FOR UPDATE NOWAIT
        LIMIT 1
      `;

      if (existing.length > 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Task already completed in this period'
        });
      }

      // Create completion with duplicate key error handling
      let completion;
      try {
        completion = await tx.taskCompletion.create({
          data: {
            taskId: input.taskId,
            personId: input.personId,
            entryNumber: 1,
            value: input.value,
            notes: input.notes,
            idempotencyKey,
            deviceId: input.deviceId,
            sessionId: input.sessionId,
            completedAt: new Date()
          }
        });
      } catch (createError: any) {
        // Handle duplicate idempotency key (P2002 = unique constraint violation)
        if (createError.code === 'P2002' && createError.meta?.target?.includes('idempotencyKey')) {
          // Fetch the existing completion and throw CONFLICT
          const existingCompletion = await tx.taskCompletion.findUnique({
            where: { idempotencyKey }
          });
          if (existingCompletion) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'Task completion already exists'
            });
          }
        }
        throw createError;
      }

      // Update timestamps
      await updateKioskTimestamps(tx, input.personId);

      return completion;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 10000
    });
  } catch (error: any) {
    // Handle lock timeout error (55P03 = lock_not_available)
    if (error.code === '55P03') {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Task is being completed by another device'
      });
    }
    throw error;
  }
}

/**
 * Complete MULTIPLE_CHECKIN task atomically
 * Ensures sequential entry numbers, max 9 entries
 */
async function completeMultipleCheckinTaskAtomic(
  prisma: PrismaClient,
  input: CompleteTaskInput,
  idempotencyKey: string
) {
  try {
    return await prisma.$transaction(async (tx) => {
      // Lock all matching rows with NOWAIT for immediate feedback
      // Then count them in application code (can't use COUNT with FOR UPDATE)
      const existingCompletions = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id
        FROM "task_completions"
        WHERE "taskId" = ${input.taskId}
          AND "personId" = ${input.personId}
          AND "completedAt" >= ${input.resetDate}
        FOR UPDATE NOWAIT
      `;

    const count = existingCompletions.length;

    if (count >= 9) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Maximum 9 check-ins reached for this period'
      });
    }

      const nextEntry = count + 1;

      // Create completion with duplicate key error handling
      let completion;
      try {
        completion = await tx.taskCompletion.create({
          data: {
            taskId: input.taskId,
            personId: input.personId,
            entryNumber: nextEntry,
            value: input.value,
            notes: input.notes,
            idempotencyKey,
            deviceId: input.deviceId,
            sessionId: input.sessionId,
            completedAt: new Date()
          }
        });
      } catch (createError: any) {
        // Handle duplicate idempotency key (P2002 = unique constraint violation)
        if (createError.code === 'P2002' && createError.meta?.target?.includes('idempotencyKey')) {
          const existingCompletion = await tx.taskCompletion.findUnique({
            where: { idempotencyKey }
          });
          if (existingCompletion) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'Task completion already exists'
            });
          }
        }
        throw createError;
      }

      await updateKioskTimestamps(tx, input.personId);

      return completion;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 10000
    });
  } catch (error: any) {
    // Handle lock timeout error (55P03 = lock_not_available)
    if (error.code === '55P03') {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Task is being completed by another device'
      });
    }
    throw error;
  }
}

/**
 * Complete PROGRESS task atomically
 * Ensures accurate summed values, max 20 entries
 */
async function completeProgressTaskAtomic(
  prisma: PrismaClient,
  input: CompleteTaskInput,
  idempotencyKey: string
) {
  // Validate value
  if (!input.value) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Progress tasks require a value'
    });
  }

  const numericValue = parseInt(input.value, 10);
  if (isNaN(numericValue) || numericValue < 1 || numericValue > 999) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Value must be an integer between 1 and 999'
    });
  }

  try {
    return await prisma.$transaction(async (tx) => {
      // Lock all matching rows with NOWAIT for immediate feedback
      // Then count/sum in application code (can't use aggregates with FOR UPDATE)
      const existingCompletions = await tx.$queryRaw<Array<{
        id: string;
        value: string | null;
      }>>`
        SELECT id, value
        FROM "task_completions"
        WHERE "taskId" = ${input.taskId}
          AND "personId" = ${input.personId}
          AND "completedAt" >= ${input.resetDate}
        FOR UPDATE NOWAIT
      `;

    const count = existingCompletions.length;
    const currentTotal = existingCompletions.reduce((sum, completion) => {
      const val = completion.value ? parseInt(completion.value, 10) : 0;
      return sum + (isNaN(val) ? 0 : val);
    }, 0);

    if (count >= 20) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Maximum 20 entries reached for this period'
      });
    }

      const newSum = currentTotal + numericValue;
      const nextEntry = count + 1;

      // Create completion with duplicate key error handling
      let completion;
      try {
        completion = await tx.taskCompletion.create({
          data: {
            taskId: input.taskId,
            personId: input.personId,
            value: input.value,
            entryNumber: nextEntry,
            summedValue: newSum,
            notes: input.notes,
            idempotencyKey,
            deviceId: input.deviceId,
            sessionId: input.sessionId,
            completedAt: new Date()
          }
        });
      } catch (createError: any) {
        // Handle duplicate idempotency key (P2002 = unique constraint violation)
        if (createError.code === 'P2002' && createError.meta?.target?.includes('idempotencyKey')) {
          const existingCompletion = await tx.taskCompletion.findUnique({
            where: { idempotencyKey }
          });
          if (existingCompletion) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'Task completion already exists'
            });
          }
        }
        throw createError;
      }

      await updateKioskTimestamps(tx, input.personId);

      return completion;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 10000
    });
  } catch (error: any) {
    // Handle lock timeout error (55P03 = lock_not_available)
    if (error.code === '55P03') {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Task is being completed by another device'
      });
    }
    throw error;
  }
}

/**
 * Update role and person timestamps for kiosk polling
 */
async function updateKioskTimestamps(
  tx: Prisma.TransactionClient,
  personId: string
) {
  const now = new Date();

  const person = await tx.person.findUniqueOrThrow({
    where: { id: personId },
    select: { roleId: true }
  });

  await Promise.all([
    tx.role.update({
      where: { id: person.roleId },
      data: { kioskLastUpdatedAt: now }
    }),
    tx.person.update({
      where: { id: personId },
      data: { kioskLastUpdatedAt: now }
    })
  ]);
}

/**
 * Generate idempotency key from request
 * Includes deviceId to prevent collisions between different devices within same second
 */
function generateIdempotencyKey(input: CompleteTaskInput): string {
  const normalized = {
    taskId: input.taskId,
    personId: input.personId,
    value: input.value || null,
    deviceId: input.deviceId || 'unknown', // Include deviceId to ensure uniqueness across devices
    // Round to nearest second to handle near-simultaneous clicks from same device
    timestamp: Math.floor(Date.now() / 1000)
  };

  return createHash('sha256')
    .update(JSON.stringify(normalized))
    .digest('hex');
}
