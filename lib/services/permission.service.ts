import { prisma } from '@/lib/db';

export interface PermissionContext {
  userId: string;
  roleId: string;
  personId?: string;
  taskId?: string;
  routineId?: string;
}

export enum Action {
  VIEW = 'VIEW',
  COMPLETE_TASK = 'COMPLETE_TASK',
  EDIT_TASK = 'EDIT_TASK',
  CREATE_TASK = 'CREATE_TASK',
  DELETE_TASK = 'DELETE_TASK',
  EDIT_ROUTINE = 'EDIT_ROUTINE',
  CREATE_ROUTINE = 'CREATE_ROUTINE',
  DELETE_ROUTINE = 'DELETE_ROUTINE'
}

/**
 * Check if user has permission to perform action
 */
export async function hasPermission(
  context: PermissionContext,
  action: Action
): Promise<boolean> {
  const { userId, roleId, personId } = context;

  // Check if user owns the role (primary parent/teacher)
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: { user: true }
  });

  if (!role) return false;

  // Owner has full permissions
  if (role.userId === userId) {
    return true;
  }

  // Check co-parent permissions
  if (role.type === 'PARENT') {
    const coParent = await prisma.coParent.findFirst({
      where: {
        primaryRoleId: roleId,
        coParentRole: { userId },
        status: 'ACTIVE'
      }
    });

    if (coParent) {
      return checkCoParentPermission(
        coParent.permissions,
        action,
        personId,
        coParent.personIds
      );
    }
  }

  // Check co-teacher permissions
  if (role.type === 'TEACHER' && context.routineId) {
    const routine = await prisma.routine.findUnique({
      where: { id: context.routineId },
      include: {
        group: {
          include: {
            coTeachers: {
              where: {
                coTeacherRole: { userId },
                status: 'ACTIVE'
              }
            }
          }
        }
      }
    });

    const coTeacher = routine?.group?.coTeachers[0];
    if (coTeacher) {
      return checkCoTeacherPermission(coTeacher.permissions, action);
    }
  }

  return false;
}

/**
 * Check co-parent permission level
 */
function checkCoParentPermission(
  permission: string,
  action: Action,
  personId: string | undefined,
  allowedPersonIds: string[]
): boolean {
  // Verify person access
  if (personId && !allowedPersonIds.includes(personId)) {
    return false;
  }

  switch (permission) {
    case 'READ_ONLY':
      return action === Action.VIEW;

    case 'TASK_COMPLETION':
      return [Action.VIEW, Action.COMPLETE_TASK].includes(action);

    case 'FULL_EDIT':
      return true; // All actions allowed

    default:
      return false;
  }
}

/**
 * Check co-teacher permission level
 */
function checkCoTeacherPermission(
  permission: string,
  action: Action
): boolean {
  switch (permission) {
    case 'VIEW':
      return action === Action.VIEW;

    case 'EDIT_TASKS':
      return [
        Action.VIEW,
        Action.COMPLETE_TASK,
        Action.EDIT_TASK,
        Action.CREATE_TASK
      ].includes(action);

    case 'FULL_EDIT':
      return true; // All actions allowed

    default:
      return false;
  }
}

/**
 * Enforce permission (throw error if not allowed)
 */
export async function enforcePermission(
  context: PermissionContext,
  action: Action
): Promise<void> {
  const allowed = await hasPermission(context, action);
  if (!allowed) {
    throw new Error(`Permission denied: ${action}`);
  }
}
