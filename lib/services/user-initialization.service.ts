/**
 * User Initialization Service
 * Handles creation of default roles, persons, routines, and groups for new users
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/utils/logger';
import { AVATAR_COLORS, ROLE_COLORS } from '@/lib/constants/theme';

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
        color: '#BAE1FF', // Light blue matching auth/callback
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
      color: '#3B82F6', // Blue color for routine
      isProtected: true, // Cannot be deleted or renamed
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
  try {
    // Create "Me" person
    const mePerson = await createDefaultPerson(roleId, prisma);
    logger.debug(`Created "Me" person for ${roleType} role`, {
      roleId,
      personId: mePerson.id
    });

    // Create default routine
    const routine = await createDefaultRoutine(roleId, mePerson.id, prisma);
    logger.debug(`Created "Daily Routine" for ${roleType} role`, {
      roleId,
      routineId: routine.id,
      personId: mePerson.id
    });

    // Create default classroom for teacher
    if (roleType === 'TEACHER') {
      const classroom = await createDefaultClassroom(roleId, mePerson.id, prisma);
      logger.debug(`Created default classroom for teacher role`, {
        roleId,
        groupId: classroom.id,
        personId: mePerson.id
      });
    }

    return mePerson;
  } catch (error) {
    logger.error(`Failed to initialize ${roleType} role`, {
      roleId,
      error
    });
    throw error;
  }
}

/**
 * Create default roles (PARENT and TEACHER) for a new user
 */
export async function createDefaultRoles({
  userId,
  name,
  prisma,
}: CreateDefaultDataOptions) {
  try {
    // Create roles individually to ensure we get the created records
    const parentRole = await prisma.role.create({
      data: {
        userId,
        type: 'PARENT',
        tier: 'FREE',
        color: ROLE_COLORS.PARENT, // Purple for parent mode
      },
    });

    const teacherRole = await prisma.role.create({
      data: {
        userId,
        type: 'TEACHER',
        tier: 'FREE',
        color: ROLE_COLORS.TEACHER, // Blue for teacher mode
      },
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
  } catch (error) {
    logger.error('Failed to create default roles', { userId, error });
    throw new Error(`Failed to create default roles for user ${userId}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Ensure a user has both PARENT and TEACHER roles
 * Creates missing roles if needed and initializes roles without persons
 */
export async function ensureUserHasRoles(
  userId: string,
  prisma: any
): Promise<void> {
  const existingRoles = await prisma.role.findMany({
    where: { userId, deletedAt: null },
    include: {
      persons: {
        where: { status: 'ACTIVE' },
      },
    },
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
      color: ROLE_COLORS.PARENT,
    });
  }
  if (!hasTeacher) {
    rolesToCreate.push({
      userId,
      type: 'TEACHER',
      tier: 'FREE',
      color: ROLE_COLORS.TEACHER,
    });
  }

  if (rolesToCreate.length > 0) {
    await prisma.role.createMany({ data: rolesToCreate });

    logger.info('Created missing roles for user', {
      userId,
      createdRoles: rolesToCreate.map((r) => r.type),
    });
  }

  // Get all roles (existing + newly created) and initialize those without persons
  const allRoles = await prisma.role.findMany({
    where: { userId, deletedAt: null },
    include: {
      persons: {
        where: { status: 'ACTIVE' },
      },
    },
  });

  const rolesToInitialize = allRoles.filter((role: any) => role.persons.length === 0);

  if (rolesToInitialize.length > 0) {
    await Promise.all(
      rolesToInitialize.map((role: any) =>
        initializeRole(role.id, role.type, prisma)
      )
    );

    logger.info('Initialized roles without persons for user', {
      userId,
      initializedRoles: rolesToInitialize.map((r: any) => r.type),
    });
  }
}
