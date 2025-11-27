import { prisma } from '@/lib/prisma';
import { addHours } from 'date-fns';
import { getRandomSafeWords } from './safe-words';
import { checkRateLimit, recordFailedAttempt, RATE_LIMIT_CONFIGS } from './rate-limit.service';
import type { RoleType } from '@prisma/client';

/**
 * Person Connection Service
 *
 * Handles cross-account person-to-person connections where:
 * - Origin person = the person being observed (their tasks are shown)
 * - Target person = the observer (sees origin's tasks in their dashboard)
 *
 * Type constraints:
 * - Student (origin) → Kid (target) only
 * - Kid (origin) → Student (target) only
 * - Teacher account owner (origin) → Parent or Kid (target)
 * - Parent account owner (origin) → Student (target) only
 */

// Type constraint mapping: determines what target types are allowed for each origin
export type AllowedTargetType = 'KID' | 'STUDENT' | 'PARENT_OR_KID';

interface TypeConstraintResult {
  allowedTargetType: AllowedTargetType;
  description: string;
}

/**
 * Determine allowed target type based on origin person's role and account status
 *
 * Rules:
 * - Teacher's student → can connect to parent's kid (KID only)
 * - Parent's kid → can connect to teacher's student (STUDENT only)
 * - Teacher account owner → can connect to parent or kid (PARENT_OR_KID)
 * - Parent account owner → can connect to student (STUDENT only)
 */
export function determineAllowedTargetType(
  originRoleType: RoleType,
  originPersonIsAccountOwner: boolean
): TypeConstraintResult {
  if (originRoleType === 'TEACHER') {
    if (originPersonIsAccountOwner) {
      // Teacher (account owner) can connect to parent or kid
      return {
        allowedTargetType: 'PARENT_OR_KID',
        description: 'This teacher can be connected to a parent or a kid in a parent account'
      };
    } else {
      // Student (teacher's non-account-owner person) can only connect to kid
      return {
        allowedTargetType: 'KID',
        description: 'This student can be connected to a kid in a parent account'
      };
    }
  }

  if (originRoleType === 'PARENT') {
    if (originPersonIsAccountOwner) {
      // Parent (account owner) can only connect to student
      return {
        allowedTargetType: 'STUDENT',
        description: 'This parent can be connected to a student in a classroom'
      };
    } else {
      // Kid (parent's non-account-owner person) can only connect to student
      return {
        allowedTargetType: 'STUDENT',
        description: 'This kid can be connected to a student in a classroom'
      };
    }
  }

  throw new Error(`Unsupported role type for person connections: ${originRoleType}`);
}

/**
 * Validate if a target person matches the allowed target type
 */
export function validateTargetPersonType(
  allowedTargetType: AllowedTargetType,
  targetRoleType: RoleType,
  targetPersonIsAccountOwner: boolean
): { valid: boolean; error?: string } {
  // Determine the target person's type
  let targetType: string;

  if (targetRoleType === 'PARENT') {
    targetType = targetPersonIsAccountOwner ? 'PARENT' : 'KID';
  } else if (targetRoleType === 'TEACHER') {
    targetType = targetPersonIsAccountOwner ? 'TEACHER' : 'STUDENT';
  } else {
    return { valid: false, error: `Unsupported target role type: ${targetRoleType}` };
  }

  // Check against allowed types
  switch (allowedTargetType) {
    case 'KID':
      if (targetType === 'KID') {
        return { valid: true };
      }
      return { valid: false, error: 'This connection code can only be used to connect to a kid (not the parent account owner)' };

    case 'STUDENT':
      if (targetType === 'STUDENT') {
        return { valid: true };
      }
      return { valid: false, error: 'This connection code can only be used to connect to a student (not the teacher account owner)' };

    case 'PARENT_OR_KID':
      if (targetType === 'PARENT' || targetType === 'KID') {
        return { valid: true };
      }
      return { valid: false, error: 'This connection code can only be used to connect to a parent or kid' };

    default:
      return { valid: false, error: `Unknown allowed target type: ${allowedTargetType}` };
  }
}

/**
 * Generate a 4-word connection code for a person
 *
 * Rate limiting: 10 codes per role per hour
 */
export async function generatePersonConnectionCode(
  originRoleId: string,
  originPersonId: string,
  requestingUserId: string
): Promise<{ code: string; expiresAt: Date; allowedTargetType: AllowedTargetType }> {
  // Check rate limit
  const rateLimit = await checkRateLimit(
    originRoleId,
    RATE_LIMIT_CONFIGS.PERSON_CONNECTION_CODE_GENERATION
  );

  if (!rateLimit.allowed) {
    const resetTime = new Date(rateLimit.resetAt).toLocaleTimeString();
    throw new Error(
      `Rate limit exceeded. You can generate more codes after ${resetTime}. Limit: 10 codes per hour.`
    );
  }

  // Verify person belongs to role AND requesting user owns the role
  const person = await prisma.person.findFirst({
    where: {
      id: originPersonId,
      roleId: originRoleId,
      status: 'ACTIVE',
      role: {
        userId: requestingUserId
      }
    },
    include: {
      role: true
    }
  });

  if (!person) {
    throw new Error('Person not found or you do not have permission to generate codes for this person');
  }

  // Determine allowed target type based on role and account owner status
  const { allowedTargetType } = determineAllowedTargetType(
    person.role.type,
    person.isAccountOwner
  );

  // Generate 4-word code and ensure uniqueness
  let code: string | undefined;
  let attempts = 0;
  const maxAttempts = 50;

  while (attempts < maxAttempts) {
    const words = getRandomSafeWords(4);
    const candidate = words.join('-').toLowerCase();

    // Check if code already exists
    const existing = await prisma.personConnectionCode.findFirst({
      where: { code: candidate }
    });

    if (!existing) {
      code = candidate;
      break;
    }
    attempts++;
  }

  if (!code) {
    throw new Error('Failed to generate unique connection code after 50 attempts');
  }

  const expiresAt = addHours(new Date(), 24); // Expires in 24 hours

  // Store code
  await prisma.personConnectionCode.create({
    data: {
      code,
      originRoleId,
      originPersonId,
      allowedTargetType,
      expiresAt,
      status: 'ACTIVE'
    }
  });

  return { code, expiresAt, allowedTargetType };
}

/**
 * Validate a connection code and return details
 */
export async function validatePersonConnectionCode(
  code: string
): Promise<{
  valid: boolean;
  error?: string;
  codeDetails?: {
    codeId: string;
    originPerson: { id: string; name: string; avatar: string | null; isAccountOwner: boolean };
    originRole: { id: string; type: RoleType };
    allowedTargetType: AllowedTargetType;
    expiresAt: Date;
  };
}> {
  const connectionCode = await prisma.personConnectionCode.findFirst({
    where: {
      code: code.toLowerCase().trim(),
      status: 'ACTIVE',
      expiresAt: { gt: new Date() }
    },
    include: {
      originPerson: true,
      originRole: true
    }
  });

  if (!connectionCode) {
    return { valid: false, error: 'Invalid or expired connection code' };
  }

  return {
    valid: true,
    codeDetails: {
      codeId: connectionCode.id,
      originPerson: {
        id: connectionCode.originPerson.id,
        name: connectionCode.originPerson.name,
        avatar: connectionCode.originPerson.avatar,
        isAccountOwner: connectionCode.originPerson.isAccountOwner
      },
      originRole: {
        id: connectionCode.originRole.id,
        type: connectionCode.originRole.type
      },
      allowedTargetType: connectionCode.allowedTargetType as AllowedTargetType,
      expiresAt: connectionCode.expiresAt
    }
  };
}

/**
 * Connect two persons using a connection code
 *
 * Rate limiting: 5 failed attempts per role per hour
 */
export async function connectPersons(
  code: string,
  targetRoleId: string,
  targetPersonId: string,
  requestingUserId: string
): Promise<{ connectionId: string; originPersonName: string }> {
  // Check rate limit for failed attempts
  const rateLimit = await checkRateLimit(
    targetRoleId,
    RATE_LIMIT_CONFIGS.PERSON_CONNECTION_CODE_CLAIM
  );

  if (!rateLimit.allowed) {
    const resetTime = new Date(rateLimit.resetAt).toLocaleTimeString();
    throw new Error(
      `Too many failed attempts. Please try again after ${resetTime}.`
    );
  }

  // Validate the code
  const validation = await validatePersonConnectionCode(code);

  if (!validation.valid || !validation.codeDetails) {
    await recordFailedAttempt(targetRoleId, RATE_LIMIT_CONFIGS.PERSON_CONNECTION_CODE_CLAIM);
    throw new Error(validation.error || 'Invalid connection code');
  }

  const { codeDetails } = validation;

  // Verify origin person is still active
  const originPersonStatus = await prisma.person.findUnique({
    where: { id: codeDetails.originPerson.id },
    select: { status: true }
  });

  if (originPersonStatus?.status !== 'ACTIVE') {
    await recordFailedAttempt(targetRoleId, RATE_LIMIT_CONFIGS.PERSON_CONNECTION_CODE_CLAIM);
    throw new Error('The person associated with this code is no longer active');
  }

  // Prevent self-connections (same account)
  if (codeDetails.originRole.id === targetRoleId) {
    await recordFailedAttempt(targetRoleId, RATE_LIMIT_CONFIGS.PERSON_CONNECTION_CODE_CLAIM);
    throw new Error('Cannot connect persons from the same account');
  }

  // Get target person and role, verifying requesting user owns the role
  const targetPerson = await prisma.person.findFirst({
    where: {
      id: targetPersonId,
      roleId: targetRoleId,
      status: 'ACTIVE',
      role: {
        userId: requestingUserId
      }
    },
    include: {
      role: true
    }
  });

  if (!targetPerson) {
    await recordFailedAttempt(targetRoleId, RATE_LIMIT_CONFIGS.PERSON_CONNECTION_CODE_CLAIM);
    throw new Error('Target person not found or you do not have permission');
  }

  // Validate type constraints
  const typeValidation = validateTargetPersonType(
    codeDetails.allowedTargetType,
    targetPerson.role.type,
    targetPerson.isAccountOwner
  );

  if (!typeValidation.valid) {
    await recordFailedAttempt(targetRoleId, RATE_LIMIT_CONFIGS.PERSON_CONNECTION_CODE_CLAIM);
    throw new Error(typeValidation.error);
  }

  // Check if connection already exists
  const existingConnection = await prisma.personConnection.findFirst({
    where: {
      originPersonId: codeDetails.originPerson.id,
      targetPersonId: targetPersonId,
      status: 'ACTIVE'
    }
  });

  if (existingConnection) {
    throw new Error('A connection between these persons already exists');
  }

  // Use transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Create connection
    const connection = await tx.personConnection.create({
      data: {
        originRoleId: codeDetails.originRole.id,
        originPersonId: codeDetails.originPerson.id,
        targetRoleId: targetRoleId,
        targetPersonId: targetPersonId,
        status: 'ACTIVE',
        scopeMode: 'ALL', // Default to all routines visible
        visibleRoutineIds: [],
        visibleGoalIds: []
      }
    });

    // Mark code as used
    await tx.personConnectionCode.update({
      where: { id: codeDetails.codeId },
      data: { status: 'USED', usedAt: new Date() }
    });

    return connection;
  });

  return {
    connectionId: result.id,
    originPersonName: codeDetails.originPerson.name
  };
}

/**
 * Get connections where person is the origin (being observed)
 */
export async function getConnectionsAsOrigin(
  originRoleId: string,
  originPersonId: string,
  requestingUserId: string
) {
  // Verify requesting user owns the role
  const role = await prisma.role.findFirst({
    where: {
      id: originRoleId,
      userId: requestingUserId
    }
  });

  if (!role) {
    throw new Error('Permission denied');
  }

  const connections = await prisma.personConnection.findMany({
    where: {
      originRoleId,
      originPersonId,
      status: 'ACTIVE'
    },
    include: {
      targetPerson: true,
      targetRole: {
        include: { user: { select: { name: true, email: true } } }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return connections.map(conn => ({
    id: conn.id,
    targetPerson: {
      id: conn.targetPerson.id,
      name: conn.targetPerson.name,
      avatar: conn.targetPerson.avatar,
      isAccountOwner: conn.targetPerson.isAccountOwner
    },
    targetOwner: {
      name: conn.targetRole.user.name,
      email: conn.targetRole.user.email
    },
    scopeMode: conn.scopeMode,
    visibleRoutineIds: conn.visibleRoutineIds,
    visibleGoalIds: conn.visibleGoalIds,
    createdAt: conn.createdAt
  }));
}

/**
 * Get connections where person is the target (observer)
 */
export async function getConnectionsAsTarget(
  targetRoleId: string,
  targetPersonId: string,
  requestingUserId: string
) {
  // Verify requesting user owns the role
  const role = await prisma.role.findFirst({
    where: {
      id: targetRoleId,
      userId: requestingUserId
    }
  });

  if (!role) {
    throw new Error('Permission denied');
  }

  const connections = await prisma.personConnection.findMany({
    where: {
      targetRoleId,
      targetPersonId,
      status: 'ACTIVE'
    },
    include: {
      originPerson: true,
      originRole: {
        include: { user: { select: { name: true, email: true } } }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return connections.map(conn => ({
    id: conn.id,
    originPerson: {
      id: conn.originPerson.id,
      name: conn.originPerson.name,
      avatar: conn.originPerson.avatar,
      isAccountOwner: conn.originPerson.isAccountOwner
    },
    originOwner: {
      name: conn.originRole.user.name,
      email: conn.originRole.user.email
    },
    scopeMode: conn.scopeMode,
    createdAt: conn.createdAt
  }));
}

/**
 * Update connection scope (origin owner only)
 *
 * @param connectionId - The connection to update
 * @param requestingUserId - The user requesting the change
 * @param scopeMode - 'ALL' or 'SELECTED'
 * @param visibleRoutineIds - Array of routine IDs (when scopeMode is 'SELECTED')
 * @param visibleGoalIds - Array of goal IDs (when scopeMode is 'SELECTED')
 */
export async function updateConnectionScope(
  connectionId: string,
  requestingUserId: string,
  scopeMode: 'ALL' | 'SELECTED',
  visibleRoutineIds?: string[],
  visibleGoalIds?: string[]
): Promise<void> {
  const connection = await prisma.personConnection.findUnique({
    where: { id: connectionId },
    include: {
      originRole: { include: { user: true } }
    }
  });

  if (!connection) {
    throw new Error('Connection not found');
  }

  // Only origin owner can modify scope
  if (connection.originRole.userId !== requestingUserId) {
    throw new Error('Only the origin account owner can modify connection scope');
  }

  if (connection.status !== 'ACTIVE') {
    throw new Error('Cannot modify an inactive connection');
  }

  // Validate that routines/goals belong to the origin role
  if (scopeMode === 'SELECTED') {
    if (visibleRoutineIds && visibleRoutineIds.length > 0) {
      const validRoutines = await prisma.routine.count({
        where: {
          id: { in: visibleRoutineIds },
          roleId: connection.originRoleId,
          status: 'ACTIVE'
        }
      });

      if (validRoutines !== visibleRoutineIds.length) {
        throw new Error('Some routines do not belong to this role or are not active');
      }
    }

    if (visibleGoalIds && visibleGoalIds.length > 0) {
      const validGoals = await prisma.goal.count({
        where: {
          id: { in: visibleGoalIds },
          roleId: connection.originRoleId,
          status: 'ACTIVE'
        }
      });

      if (validGoals !== visibleGoalIds.length) {
        throw new Error('Some goals do not belong to this role or are not active');
      }
    }
  }

  await prisma.personConnection.update({
    where: { id: connectionId },
    data: {
      scopeMode,
      visibleRoutineIds: scopeMode === 'SELECTED' ? (visibleRoutineIds || []) : [],
      visibleGoalIds: scopeMode === 'SELECTED' ? (visibleGoalIds || []) : []
    }
  });
}

/**
 * Remove a connection (either origin or target owner can do this)
 */
export async function removeConnection(
  connectionId: string,
  requestingUserId: string
): Promise<void> {
  const connection = await prisma.personConnection.findUnique({
    where: { id: connectionId },
    include: {
      originRole: { include: { user: true } },
      targetRole: { include: { user: true } }
    }
  });

  if (!connection) {
    throw new Error('Connection not found');
  }

  // Both origin and target owners can remove
  const isOriginOwner = connection.originRole.userId === requestingUserId;
  const isTargetOwner = connection.targetRole.userId === requestingUserId;

  if (!isOriginOwner && !isTargetOwner) {
    throw new Error('Permission denied');
  }

  await prisma.personConnection.update({
    where: { id: connectionId },
    data: {
      status: 'DISCONNECTED',
      disconnectedAt: new Date(),
      disconnectedBy: requestingUserId
    }
  });
}

/**
 * Get connected person's data for dashboard display
 * Returns routines, goals, and task completions based on connection scope
 */
export async function getConnectedPersonData(
  connectionId: string,
  requestingUserId: string
) {
  const connection = await prisma.personConnection.findUnique({
    where: { id: connectionId },
    include: {
      originPerson: true,
      originRole: { include: { user: true } },
      targetRole: { include: { user: true } }
    }
  });

  if (!connection) {
    throw new Error('Connection not found');
  }

  // Only target owner can view connected person data
  if (connection.targetRole.userId !== requestingUserId) {
    throw new Error('Permission denied');
  }

  if (connection.status !== 'ACTIVE') {
    throw new Error('Connection is not active');
  }

  // Get routines with tasks and completions
  // Filter at database level for routines assigned to the origin person
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build the where clause with assignment filter at database level
  const routineWhereClause: Record<string, unknown> = {
    roleId: connection.originRoleId,
    status: 'ACTIVE',
    isTeacherOnly: false, // Don't show teacher-only routines to connected persons
    // Filter for routines assigned to the origin person (at DB level for performance)
    assignments: {
      some: {
        OR: [
          { personId: connection.originPersonId },
          {
            group: {
              members: {
                some: { personId: connection.originPersonId }
              }
            }
          }
        ]
      }
    }
  };

  // Add scope filter if in SELECTED mode
  if (connection.scopeMode === 'SELECTED' && connection.visibleRoutineIds.length > 0) {
    routineWhereClause.id = { in: connection.visibleRoutineIds };
  }

  const routines = await prisma.routine.findMany({
    where: routineWhereClause,
    include: {
      tasks: {
        where: { status: 'ACTIVE' },
        orderBy: { order: 'asc' },
        include: {
          completions: {
            where: {
              personId: connection.originPersonId,
              completedAt: { gte: today }
            },
            orderBy: { completedAt: 'desc' }
          }
        }
      }
    }
  });

  // Get goals with progress
  // Build goal where clause based on scope mode
  const goalIdFilter = connection.scopeMode === 'SELECTED' && connection.visibleGoalIds.length > 0
    ? { in: connection.visibleGoalIds }
    : undefined;

  const goals = await prisma.goal.findMany({
    where: {
      roleId: connection.originRoleId,
      status: 'ACTIVE',
      ...(goalIdFilter && { id: goalIdFilter }),
      OR: [
        { personIds: { has: connection.originPersonId } },
        { personIds: { isEmpty: true } } // Goals with no specific person filter
      ]
    },
    include: {
      progress: {
        where: {
          personId: connection.originPersonId
        },
        orderBy: { periodStart: 'desc' },
        take: 1
      }
    }
  });

  return {
    originPerson: {
      id: connection.originPerson.id,
      name: connection.originPerson.name,
      avatar: connection.originPerson.avatar
    },
    originOwnerName: connection.originRole.user.name,
    routines: routines.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      color: r.color,
      tasks: r.tasks.map(t => ({
        id: t.id,
        name: t.name,
        type: t.type,
        emoji: t.emoji,
        isCompleted: t.completions.length > 0,
        completions: t.completions.map(c => ({
          id: c.id,
          completedAt: c.completedAt,
          value: c.value,
          entryNumber: c.entryNumber
        }))
      }))
    })),
    goals: goals.map(g => ({
      id: g.id,
      name: g.name,
      description: g.description,
      icon: g.icon,
      color: g.color,
      target: g.target,
      unit: g.unit,
      currentProgress: g.progress[0]?.currentValue || 0,
      isAchieved: g.progress[0]?.achieved || false
    })),
    scopeMode: connection.scopeMode,
    connectionCreatedAt: connection.createdAt
  };
}

/**
 * Get all connected persons for a target person's dashboard
 */
export async function getConnectedPersonsForDashboard(
  targetRoleId: string,
  targetPersonId: string,
  requestingUserId: string
) {
  // Verify requesting user owns the role
  const role = await prisma.role.findFirst({
    where: {
      id: targetRoleId,
      userId: requestingUserId
    }
  });

  if (!role) {
    throw new Error('Permission denied');
  }

  const connections = await prisma.personConnection.findMany({
    where: {
      targetRoleId,
      targetPersonId,
      status: 'ACTIVE'
    },
    include: {
      originPerson: true,
      originRole: {
        include: { user: { select: { name: true } } }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return connections.map(conn => ({
    connectionId: conn.id,
    originPerson: {
      id: conn.originPerson.id,
      name: conn.originPerson.name,
      avatar: conn.originPerson.avatar,
      isAccountOwner: conn.originPerson.isAccountOwner
    },
    originOwnerName: conn.originRole.user.name,
    originRoleType: conn.originRole.type,
    createdAt: conn.createdAt
  }));
}

/**
 * Get active connection codes for a person
 */
export async function getActiveConnectionCodes(
  originRoleId: string,
  originPersonId: string,
  requestingUserId: string
) {
  // Verify requesting user owns the role
  const role = await prisma.role.findFirst({
    where: {
      id: originRoleId,
      userId: requestingUserId
    }
  });

  if (!role) {
    throw new Error('Permission denied');
  }

  const codes = await prisma.personConnectionCode.findMany({
    where: {
      originRoleId,
      originPersonId,
      status: 'ACTIVE',
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: 'desc' }
  });

  return codes.map(c => ({
    id: c.id,
    code: c.code,
    allowedTargetType: c.allowedTargetType,
    expiresAt: c.expiresAt,
    createdAt: c.createdAt
  }));
}

/**
 * Revoke a connection code
 */
export async function revokeConnectionCode(
  codeId: string,
  requestingUserId: string
): Promise<void> {
  const code = await prisma.personConnectionCode.findUnique({
    where: { id: codeId },
    include: {
      originRole: { include: { user: true } }
    }
  });

  if (!code) {
    throw new Error('Connection code not found');
  }

  if (code.originRole.userId !== requestingUserId) {
    throw new Error('Permission denied');
  }

  await prisma.personConnectionCode.update({
    where: { id: codeId },
    data: { status: 'REVOKED' }
  });
}
