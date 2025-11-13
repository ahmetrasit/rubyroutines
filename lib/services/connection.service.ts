import { prisma } from '@/lib/db';
import crypto from 'crypto';
import { addHours } from 'date-fns';

/**
 * Generate 6-digit connection code
 */
export async function generateConnectionCode(
  teacherRoleId: string,
  studentPersonId: string
): Promise<{ code: string; expiresAt: Date }> {
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

  // Generate 6-digit code
  const code = crypto.randomInt(100000, 999999).toString();
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
 */
export async function connectParentToStudent(
  code: string,
  parentRoleId: string,
  parentPersonId: string
): Promise<void> {
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

  // Create connection
  await prisma.studentParentConnection.create({
    data: {
      teacherRoleId: connectionCode.teacherRoleId,
      studentPersonId: connectionCode.studentPersonId,
      parentRoleId,
      parentPersonId,
      permissions: 'TASK_COMPLETION', // Default permission
      status: 'ACTIVE'
    }
  });

  // Mark code as used
  await prisma.connectionCode.update({
    where: { id: connectionCode.id },
    data: { status: 'USED', usedAt: new Date() }
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
