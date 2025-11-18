/**
 * User Initialization Service
 * Handles creation of default roles, persons, routines, and groups for new users
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/utils/logger';

interface CreateDefaultDataOptions {
  userId: string;
  name: string;
  prisma: PrismaClient | any; // Support both Prisma client and transaction
}

/**
 * Create default "Me" person for a role
 */
async function createDefaultPerson(roleId: string, prisma: any) {
  return prisma.person.create({
    data: {
      roleId,
      name: 'Me',
      avatar: JSON.stringify({
        color: '#BAE1FF', // Light blue
        emoji: '👤',
      }),
      isAccountOwner: true, // Mark as account owner
      status: 'ACTIVE',
    },
  });
}

/**
 * Create default "Daily Routine" assigned to a person
 */
async function createDefaultRoutine(
  roleId: string,
  personId: string,
  prisma: any
) {
  return prisma.routine.create({
    data: {
      roleId,
      name: '☀️ Daily Routine',
      description: 'Default routine for daily tasks',
      resetPeriod: 'DAILY',
      color: '#3B82F6',
      status: 'ACTIVE',
      assignments: {
        create: {
          personId,
        },
      },
    },
  });
}

/**
 * Create default classroom group for teacher role
 */
async function createDefaultClassroom(
  roleId: string,
  personId: string,
  prisma: any
) {
  return prisma.group.create({
    data: {
      roleId,
      name: 'Teacher-Only',
      type: 'CLASSROOM',
      isClassroom: true,
      status: 'ACTIVE',
      members: {
        create: {
          personId,
          role: 'member',
        },
      },
    },
  });
}

/**
 * Initialize a role with default data (person, routine, and classroom for teachers)
 */
async function initializeRole(
  roleId: string,
  roleType: 'PARENT' | 'TEACHER',
  prisma: any
) {
  // Create "Me" person
  const mePerson = await createDefaultPerson(roleId, prisma);

  // Create default routine
  await createDefaultRoutine(roleId, mePerson.id, prisma);

  // Create default classroom for teacher
  if (roleType === 'TEACHER') {
    await createDefaultClassroom(roleId, mePerson.id, prisma);
  }

  return mePerson;
}

/**
 * Create default roles (PARENT and TEACHER) for a new user
 */
export async function createDefaultRoles({
  userId,
  name,
  prisma,
}: CreateDefaultDataOptions) {
  const roles = await prisma.role.createMany({
    data: [
      {
        userId,
        type: 'PARENT',
        tier: 'FREE',
        color: '#9333ea', // Purple for parent mode
      },
      {
        userId,
        type: 'TEACHER',
        tier: 'FREE',
        color: '#3b82f6', // Blue for teacher mode
      },
    ],
  });

  // Get the created roles
  const parentRole = await prisma.role.findFirst({
    where: { userId, type: 'PARENT' },
  });
  const teacherRole = await prisma.role.findFirst({
    where: { userId, type: 'TEACHER' },
  });

  if (!parentRole || !teacherRole) {
    throw new Error('Failed to create default roles');
  }

  // Initialize each role with default data
  await Promise.all([
    initializeRole(parentRole.id, 'PARENT', prisma),
    initializeRole(teacherRole.id, 'TEACHER', prisma),
  ]);

  logger.info('Created default roles and data for new user', { userId });

  return { parentRole, teacherRole };
}

/**
 * Ensure a user has both PARENT and TEACHER roles
 * Creates missing roles if needed
 */
export async function ensureUserHasRoles(
  userId: string,
  prisma: any
): Promise<void> {
  const existingRoles = await prisma.role.findMany({
    where: { userId, deletedAt: null },
  });

  const hasParent = existingRoles.some((r: any) => r.type === 'PARENT');
  const hasTeacher = existingRoles.some((r: any) => r.type === 'TEACHER');

  // Create missing roles
  const rolesToCreate = [];
  if (!hasParent) {
    rolesToCreate.push({
      userId,
      type: 'PARENT',
      tier: 'FREE',
      color: '#9333ea',
    });
  }
  if (!hasTeacher) {
    rolesToCreate.push({
      userId,
      type: 'TEACHER',
      tier: 'FREE',
      color: '#3b82f6',
    });
  }

  if (rolesToCreate.length > 0) {
    await prisma.role.createMany({ data: rolesToCreate });

    // Initialize the new roles
    const newRoles = await prisma.role.findMany({
      where: {
        userId,
        type: { in: rolesToCreate.map((r) => r.type) },
      },
    });

    await Promise.all(
      newRoles.map((role: any) =>
        initializeRole(role.id, role.type, prisma)
      )
    );

    logger.info('Created missing roles for user', {
      userId,
      createdRoles: rolesToCreate.map((r) => r.type),
    });
  }
}
