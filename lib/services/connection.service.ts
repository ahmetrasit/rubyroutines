import { prisma } from '@/lib/prisma';
import { addHours } from 'date-fns';
import { getRandomSafeWords } from './safe-words';
import { checkRateLimit, recordFailedAttempt, RATE_LIMIT_CONFIGS } from './rate-limit.service';

/**
 * Generate 4-word connection code
 *
 * Rate limiting: 5 codes per teacher per hour
 */
export async function generateConnectionCode(
  teacherRoleId: string,
  studentPersonId: string
): Promise<{ code: string; expiresAt: Date }> {
  // Check rate limit
  const rateLimit = await checkRateLimit(
    teacherRoleId,
    RATE_LIMIT_CONFIGS.CONNECTION_CODE_GENERATION
  );

  if (!rateLimit.allowed) {
    const resetTime = new Date(rateLimit.resetAt).toLocaleTimeString();
    throw new Error(
      `Rate limit exceeded. You can generate more codes after ${resetTime}. Limit: 5 codes per hour.`
    );
  }

  // Verify student belongs to teacher
  const student = await prisma.person.findFirst({
    where: {
      id: studentPersonId,
      roleId: teacherRoleId,
      role: { type: 'TEACHER' }
    }
  });

  if (!student) {
    throw new Error('Student not found or does not belong to teacher');
  }

  // Generate 4-word code and ensure uniqueness
  let code: string | undefined;
  let attempts = 0;
  const maxAttempts = 50;

  while (attempts < maxAttempts) {
    const words = getRandomSafeWords(4);
    const candidate = words.join('-').toLowerCase();

    // Check if code already exists
    const existing = await prisma.connectionCode.findFirst({
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
  await prisma.connectionCode.create({
    data: {
      code,
      teacherRoleId,
      studentPersonId,
      expiresAt,
      status: 'ACTIVE'
    }
  });

  return { code, expiresAt };
}

/**
 * Connect parent to student using code
 *
 * Rate limiting: 5 failed attempts per parent per hour
 */
export async function connectParentToStudent(
  code: string,
  parentRoleId: string,
  parentPersonId: string
): Promise<void> {
  // Check rate limit for failed attempts
  const rateLimit = await checkRateLimit(
    parentRoleId,
    RATE_LIMIT_CONFIGS.CONNECTION_CODE_CLAIM
  );

  if (!rateLimit.allowed) {
    const resetTime = new Date(rateLimit.resetAt).toLocaleTimeString();
    throw new Error(
      `Too many failed attempts. Please try again after ${resetTime}.`
    );
  }

  // Find connection code
  const connectionCode = await prisma.connectionCode.findFirst({
    where: {
      code,
      status: 'ACTIVE',
      expiresAt: { gt: new Date() }
    },
    include: {
      teacherRole: true,
      studentPerson: true
    }
  });

  if (!connectionCode) {
    // Record failed attempt
    await recordFailedAttempt(
      parentRoleId,
      RATE_LIMIT_CONFIGS.CONNECTION_CODE_CLAIM
    );
    throw new Error('Invalid or expired code');
  }

  // Verify parent person belongs to parent role
  const parentPerson = await prisma.person.findFirst({
    where: {
      id: parentPersonId,
      roleId: parentRoleId,
      role: { type: 'PARENT' }
    }
  });

  if (!parentPerson) {
    throw new Error('Parent person not found');
  }

  // Check if connection already exists
  const existing = await prisma.studentParentConnection.findFirst({
    where: {
      studentPersonId: connectionCode.studentPersonId,
      parentPersonId
    }
  });

  if (existing) {
    throw new Error('Connection already exists');
  }

  // Use transaction to ensure atomicity: create connection and mark code as used together
  await prisma.$transaction(async (tx) => {
    // Create connection
    await tx.studentParentConnection.create({
      data: {
        teacherRoleId: connectionCode.teacherRoleId,
        studentPersonId: connectionCode.studentPersonId,
        parentRoleId,
        parentPersonId,
        permissions: 'READ_ONLY', // Read-only permission - parents can view tasks only
        status: 'ACTIVE'
      }
    });

    // Mark code as used
    await tx.connectionCode.update({
      where: { id: connectionCode.id },
      data: { status: 'USED', usedAt: new Date() }
    });
  });
}

/**
 * Get parent's connected students
 */
export async function getConnectedStudents(parentRoleId: string) {
  const connections = await prisma.studentParentConnection.findMany({
    where: {
      parentRoleId,
      status: 'ACTIVE'
    },
    include: {
      studentPerson: {
        include: {
          assignments: {
            include: {
              routine: {
                include: {
                  tasks: {
                    where: { status: 'ACTIVE' },
                    include: {
                      completions: {
                        where: {
                          completedAt: {
                            gte: new Date(new Date().setHours(0, 0, 0, 0))
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      teacherRole: {
        include: { user: true }
      }
    }
  });

  return connections;
}

/**
 * Disconnect parent from student
 */
export async function disconnectParentFromStudent(
  connectionId: string,
  requestingUserId: string
): Promise<void> {
  const connection = await prisma.studentParentConnection.findUnique({
    where: { id: connectionId },
    include: {
      teacherRole: { include: { user: true } },
      parentRole: { include: { user: true } }
    }
  });

  if (!connection) {
    throw new Error('Connection not found');
  }

  // Only teacher or parent can disconnect
  const isTeacher = connection.teacherRole.userId === requestingUserId;
  const isParent = connection.parentRole.userId === requestingUserId;

  if (!isTeacher && !isParent) {
    throw new Error('Permission denied');
  }

  await prisma.studentParentConnection.update({
    where: { id: connectionId },
    data: { status: 'DISCONNECTED' }
  });
}
