import { TRPCError } from '@trpc/server';

/**
 * Verify that the authenticated user owns the specified role
 */
export async function verifyRoleOwnership(
  userId: string,
  roleId: string,
  prisma: any
): Promise<boolean> {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    select: { userId: true },
  });

  if (!role) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Role not found',
    });
  }

  if (role.userId !== userId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have permission to access this role',
    });
  }

  return true;
}

/**
 * Verify that a person belongs to a role owned by the user
 */
export async function verifyPersonOwnership(
  userId: string,
  personId: string,
  prisma: any
): Promise<boolean> {
  const person = await prisma.person.findUnique({
    where: { id: personId },
    include: {
      role: {
        select: { userId: true },
      },
    },
  });

  if (!person) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Person not found',
    });
  }

  if (person.role.userId !== userId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have permission to access this person',
    });
  }

  return true;
}

/**
 * Verify that a routine belongs to a role owned by the user
 */
export async function verifyRoutineOwnership(
  userId: string,
  routineId: string,
  prisma: any
): Promise<boolean> {
  const routine = await prisma.routine.findUnique({
    where: { id: routineId },
    include: {
      role: {
        select: { userId: true },
      },
    },
  });

  if (!routine) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Routine not found',
    });
  }

  if (routine.role.userId !== userId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have permission to access this routine',
    });
  }

  return true;
}

/**
 * Verify that a task belongs to a routine owned by the user
 */
export async function verifyTaskOwnership(
  userId: string,
  taskId: string,
  prisma: any
): Promise<boolean> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      routine: {
        include: {
          role: {
            select: { userId: true },
          },
        },
      },
    },
  });

  if (!task) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Task not found',
    });
  }

  if (task.routine.role.userId !== userId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have permission to access this task',
    });
  }

  return true;
}

/**
 * Verify that a goal belongs to a role owned by the user
 */
export async function verifyGoalOwnership(
  userId: string,
  goalId: string,
  prisma: any
): Promise<boolean> {
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: {
      role: {
        select: { userId: true },
      },
    },
  });

  if (!goal) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Goal not found',
    });
  }

  if (goal.role.userId !== userId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have permission to access this goal',
    });
  }

  return true;
}

/**
 * Verify that the user is an admin
 */
export async function verifyAdminStatus(
  userId: string,
  prisma: any
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });

  if (!user || !user.isAdmin) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required',
    });
  }

  return true;
}
