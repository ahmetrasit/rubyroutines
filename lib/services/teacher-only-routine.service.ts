import { prisma } from '@/lib/prisma';
import { EntityStatus } from '@/lib/types/prisma-enums';
import { ROLE_COLORS } from '@/lib/constants/theme';

/**
 * Create default teacher-only routine for a student
 *
 * Teacher-only routines are:
 * - Visible only to teacher and co-teachers
 * - NOT visible to students, parents, or in kiosk mode
 * - Used for organizational purposes and private tracking
 * - Auto-created when student is created, added to classroom, or restored
 *
 * @param roleId - Teacher's role ID
 * @param personId - Student's person ID
 * @param roleType - Role type (must be 'TEACHER')
 * @returns Created routine or null if not applicable
 */
export async function createDefaultTeacherOnlyRoutine(
  roleId: string,
  personId: string,
  roleType: string
) {
  // Only create for TEACHER roles
  if (roleType !== 'TEACHER') {
    return null;
  }

  // Check if person already has a teacher-only routine
  const existing = await prisma.routine.findFirst({
    where: {
      roleId,
      isTeacherOnly: true,
      assignments: {
        some: { personId }
      },
      status: EntityStatus.ACTIVE
    }
  });

  if (existing) {
    return existing; // Already exists, don't duplicate
  }

  // Create default teacher-only routine
  const routine = await prisma.routine.create({
    data: {
      roleId,
      name: '📋 Teacher Notes',
      description: 'Private routine for teacher notes and tracking. Only visible to teachers.',
      type: 'REGULAR',
      resetPeriod: 'DAILY',
      color: ROLE_COLORS.TEACHER_ONLY, // Purple color to distinguish from regular routines
      isTeacherOnly: true,
      status: EntityStatus.ACTIVE,
      assignments: {
        create: {
          personId
        }
      }
    }
  });

  return routine;
}

/**
 * Check if a user has access to a teacher-only routine
 *
 * Access is granted to:
 * - The teacher who owns the routine (via role)
 * - Co-teachers of the classroom
 *
 * @param routineId - Routine ID to check
 * @param userId - User ID requesting access
 * @returns True if user has access, false otherwise
 */
export async function canAccessTeacherOnlyRoutine(
  routineId: string,
  userId: string
): Promise<boolean> {
  const routine = await prisma.routine.findUnique({
    where: { id: routineId },
    include: {
      role: {
        select: { userId: true, id: true }
      }
    }
  });

  if (!routine || !routine.isTeacherOnly) {
    return true; // Not a teacher-only routine, allow access
  }

  // Check if user is the owner
  if (routine.role.userId === userId) {
    return true;
  }

  // Check if user is a co-teacher
  const isCoTeacher = await prisma.coTeacher.findFirst({
    where: {
      teacherRoleId: routine.roleId,
      coTeacherRole: {
        userId
      },
      status: EntityStatus.ACTIVE
    }
  });

  return !!isCoTeacher;
}
