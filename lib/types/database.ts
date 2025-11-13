/**
 * Database Type Definitions
 *
 * This file contains all database types with proper Prisma includes.
 * Use these types throughout the application instead of 'any'.
 */

import { Prisma } from '@prisma/client';

// ============================================================================
// User & Role Types
// ============================================================================

export type User = Prisma.UserGetPayload<object>;
export type UserWithRoles = Prisma.UserGetPayload<{
  include: { roles: true };
}>;

export type Role = Prisma.RoleGetPayload<object>;
export type RoleWithUser = Prisma.RoleGetPayload<{
  include: { user: true };
}>;

// ============================================================================
// Person Types
// ============================================================================

export type Person = Prisma.PersonGetPayload<object>;

export type PersonWithAssignments = Prisma.PersonGetPayload<{
  include: {
    assignments: {
      include: {
        routine: {
          include: {
            tasks: true;
          };
        };
      };
    };
  };
}>;

export type PersonWithCompletions = Prisma.PersonGetPayload<{
  include: {
    taskCompletions: true;
  };
}>;

export type PersonWithRole = Prisma.PersonGetPayload<{
  include: {
    role: true;
  };
}>;

// ============================================================================
// Group Types
// ============================================================================

export type Group = Prisma.GroupGetPayload<object>;

export type GroupWithMembers = Prisma.GroupGetPayload<{
  include: {
    members: {
      include: {
        person: true;
      };
    };
  };
}>;

export type GroupMember = Prisma.GroupMemberGetPayload<object>;

export type GroupMemberWithPerson = Prisma.GroupMemberGetPayload<{
  include: {
    person: true;
  };
}>;

// ============================================================================
// Routine Types
// ============================================================================

export type Routine = Prisma.RoutineGetPayload<object>;

export type RoutineWithTasks = Prisma.RoutineGetPayload<{
  include: {
    tasks: true;
  };
}>;

export type RoutineWithAssignments = Prisma.RoutineGetPayload<{
  include: {
    assignments: {
      include: {
        person: true;
        group: {
          include: {
            members: {
              include: {
                person: true;
              };
            };
          };
        };
      };
    };
  };
}>;

export type RoutineWithTasksAndAssignments = Prisma.RoutineGetPayload<{
  include: {
    tasks: {
      include: {
        completions: true;
      };
    };
    assignments: {
      include: {
        person: true;
        group: true;
      };
    };
  };
}>;

export type RoutineWithConditions = Prisma.RoutineGetPayload<{
  include: {
    conditions: {
      include: {
        targetTask: true;
        targetRoutine: true;
      };
    };
  };
}>;

export type RoutineAssignment = Prisma.RoutineAssignmentGetPayload<object>;

// ============================================================================
// Task Types
// ============================================================================

export type Task = Prisma.TaskGetPayload<object>;

export type TaskWithCompletions = Prisma.TaskGetPayload<{
  include: {
    completions: true;
  };
}>;

export type TaskWithRoutine = Prisma.TaskGetPayload<{
  include: {
    routine: true;
  };
}>;

export type TaskCompletion = Prisma.TaskCompletionGetPayload<object>;

export type TaskCompletionWithTask = Prisma.TaskCompletionGetPayload<{
  include: {
    task: {
      include: {
        routine: true;
      };
    };
  };
}>;

// ============================================================================
// Goal Types
// ============================================================================

export type Goal = Prisma.GoalGetPayload<object>;

export type GoalWithLinks = Prisma.GoalGetPayload<{
  include: {
    taskLinks: {
      include: {
        task: {
          include: {
            completions: true;
            routine: true;
          };
        };
      };
    };
    routineLinks: {
      include: {
        routine: {
          include: {
            tasks: {
              include: {
                completions: true;
              };
            };
          };
        };
      };
    };
  };
}>;

export type GoalTaskLink = Prisma.GoalTaskLinkGetPayload<object>;
export type GoalRoutineLink = Prisma.GoalRoutineLinkGetPayload<object>;

// ============================================================================
// Condition Types
// ============================================================================

export type Condition = Prisma.ConditionGetPayload<object>;

export type ConditionWithTargets = Prisma.ConditionGetPayload<{
  include: {
    targetTask: true;
    targetRoutine: true;
  };
}>;

// ============================================================================
// Code Types
// ============================================================================

export type Code = Prisma.CodeGetPayload<object>;
export type ConnectionCode = Prisma.ConnectionCodeGetPayload<object>;

export type ConnectionCodeWithRelations = Prisma.ConnectionCodeGetPayload<{
  include: {
    teacherRole: {
      include: {
        user: true;
      };
    };
    studentPerson: true;
  };
}>;

// ============================================================================
// Invitation & Sharing Types
// ============================================================================

export type Invitation = Prisma.InvitationGetPayload<object>;

export type InvitationWithRelations = Prisma.InvitationGetPayload<{
  include: {
    inviterUser: true;
    inviterRole: true;
    acceptedByUser: true;
  };
}>;

export type CoParent = Prisma.CoParentGetPayload<object>;

export type CoParentWithRoles = Prisma.CoParentGetPayload<{
  include: {
    primaryRole: {
      include: {
        user: true;
      };
    };
    coParentRole: {
      include: {
        user: true;
      };
    };
  };
}>;

export type CoTeacher = Prisma.CoTeacherGetPayload<object>;

export type CoTeacherWithRelations = Prisma.CoTeacherGetPayload<{
  include: {
    group: true;
    primaryTeacherRole: {
      include: {
        user: true;
      };
    };
    coTeacherRole: {
      include: {
        user: true;
      };
    };
  };
}>;

export type StudentParentConnection = Prisma.StudentParentConnectionGetPayload<object>;

export type StudentParentConnectionWithRelations = Prisma.StudentParentConnectionGetPayload<{
  include: {
    teacherRole: {
      include: {
        user: true;
      };
    };
    studentPerson: true;
    parentRole: {
      include: {
        user: true;
      };
    };
    parentPerson: true;
  };
}>;

// ============================================================================
// School Types
// ============================================================================

export type School = Prisma.SchoolGetPayload<object>;
export type SchoolMember = Prisma.SchoolMemberGetPayload<object>;

export type SchoolWithMembers = Prisma.SchoolGetPayload<{
  include: {
    members: {
      include: {
        userRole: {
          include: {
            user: true;
          };
        };
      };
    };
  };
}>;

// ============================================================================
// Marketplace Types
// ============================================================================

export type MarketplaceItem = Prisma.MarketplaceItemGetPayload<object>;

export type MarketplaceItemWithAuthor = Prisma.MarketplaceItemGetPayload<{
  include: {
    authorRole: {
      include: {
        user: true;
      };
    };
  };
}>;

export type MarketplaceItemWithRatings = Prisma.MarketplaceItemGetPayload<{
  include: {
    ratings: true;
    comments: {
      include: {
        user: true;
      };
    };
  };
}>;

export type MarketplaceRating = Prisma.MarketplaceRatingGetPayload<object>;
export type MarketplaceComment = Prisma.MarketplaceCommentGetPayload<object>;

export type MarketplaceCommentWithUser = Prisma.MarketplaceCommentGetPayload<{
  include: {
    user: true;
    flags: true;
  };
}>;

// ============================================================================
// Authentication Types
// ============================================================================

export type VerificationCode = Prisma.VerificationCodeGetPayload<object>;

// ============================================================================
// Avatar Type
// ============================================================================

export interface AvatarData {
  color: string;
  emoji: string;
}

// ============================================================================
// Progress & Analytics Types
// ============================================================================

export interface GoalProgress {
  current: number;
  target: number;
  percentage: number;
  achieved: boolean;
}

export interface TaskCompletionStats {
  taskId: string;
  taskName: string;
  completionCount: number;
  lastCompleted: Date | null;
}

export interface RoutineCompletionStats {
  routineId: string;
  routineName: string;
  totalTasks: number;
  completedTasks: number;
  percentage: number;
}

// ============================================================================
// Helper Types
// ============================================================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
