# Stage 5: Co-Parent/Teacher + School Mode - Complete Implementation Guide

**Duration:** 4-5 days
**Token Estimate:** 100K tokens ($1.50)
**Prerequisites:** Stages 1-4 completed

---

## SESSION PROMPT (Copy-Paste This)

You are building Ruby Routines **Stage 5: Co-Parent/Teacher + School Mode**.

**CONTEXT:**
- Stack: Next.js 14 + Supabase + Prisma + tRPC + TypeScript strict
- Previous stages: Foundation, Core CRUD, Goals, Kiosk completed
- Goal: Implement co-parent sharing, co-teacher collaboration, student-parent connections, school mode

**OBJECTIVES:**
1. Co-parent invitation system with granular permissions
2. Co-teacher collaboration (share classrooms, students, routines)
3. Student-parent connection (link parent account to teacher's student)
4. Dual-role account management (parent + teacher modes)
5. School mode (principal, teachers, support staff hierarchy)
6. Permission enforcement across all operations

**REQUIREMENTS:**

**Co-Parent System:**
- Invite via email (send magic link)
- Granular permissions: read-only, task-completion, full-edit
- Co-parent sees only persons/groups they have access to
- Primary parent can revoke access anytime
- Co-parent cannot delete primary parent's account

**Co-Teacher System:**
- Share classrooms with another teacher
- Permissions: view, edit-tasks, full-edit
- Both teachers see shared students
- Either teacher can revoke sharing

**Student-Parent Connection:**
- Parent enters 6-digit code provided by teacher
- Links parent's person to teacher's student
- Parent sees student's tasks in parent dashboard
- Teacher retains full control of student's routines
- Parent can only view or complete tasks (based on teacher's permission)

**School Mode:**
- Principal creates school, invites teachers
- Teachers create classrooms and students
- Support staff can view all students (read-only)
- Principal can see analytics across all classrooms
- Teachers cannot see other teachers' classrooms (unless shared)

**KEY FILES TO CREATE:**
```
/lib/services/invitation.service.ts       # Email invitation logic
/lib/services/permission.service.ts       # Permission enforcement
/lib/services/connection.service.ts       # Student-parent connection
/lib/trpc/routers/coparent.router.ts     # Co-parent operations
/lib/trpc/routers/coteacher.router.ts    # Co-teacher operations
/lib/trpc/routers/school.router.ts       # School mode operations
/app/(dashboard)/parent/connections/page.tsx  # Parent connection UI
/app/(dashboard)/teacher/sharing/page.tsx     # Teacher sharing UI
/app/(dashboard)/school/page.tsx         # Principal dashboard
/components/coparent/InviteModal.tsx     # Co-parent invitation UI
/components/coparent/PermissionSelector.tsx  # Granular permissions
/components/coteacher/ShareModal.tsx     # Co-teacher sharing UI
/components/connection/CodeEntry.tsx     # Student-parent code entry
```

**TESTING REQUIREMENTS:**
- Invite co-parent, verify email sent
- Accept invitation, verify permissions applied
- Revoke co-parent access, verify loss of access
- Share classroom between teachers
- Connect parent to student via code
- Test permission enforcement (read-only cannot edit tasks)
- Test school mode: principal sees all classrooms

**DEVELOPMENT STEPS:**
1. Create invitation service (email + magic links)
2. Implement permission service (enforce granular access)
3. Build co-parent tRPC router
4. Build co-teacher tRPC router
5. Implement student-parent connection
6. Create school mode entities and permissions
7. Build UI components for invitations and sharing
8. Test end-to-end permission enforcement

**IMPORTANT:**
- Enforce permissions at database level (RLS policies)
- Use Resend for email invitations
- Store invitations in `Invitation` table with expiry (7 days)
- Validate permissions on every mutation
- Prevent privilege escalation (co-parent cannot grant permissions)

Refer to `/docs/stages/STAGE-5-COMPLETE.md` for full implementation details.

---

## Complete Implementation

### 1. Invitation Service

**File: `/lib/services/invitation.service.ts`**

```typescript
import { prisma } from '@/lib/prisma';
import { sendEmail } from './email.service';
import crypto from 'crypto';
import { addDays } from 'date-fns';

export enum InvitationType {
  CO_PARENT = 'CO_PARENT',
  CO_TEACHER = 'CO_TEACHER',
  SCHOOL_TEACHER = 'SCHOOL_TEACHER',
  SCHOOL_SUPPORT = 'SCHOOL_SUPPORT'
}

export enum CoParentPermission {
  READ_ONLY = 'READ_ONLY',           // View tasks only
  TASK_COMPLETION = 'TASK_COMPLETION', // View + mark tasks complete
  FULL_EDIT = 'FULL_EDIT'            // View + edit + create routines/tasks
}

export interface SendInvitationOptions {
  inviterUserId: string;
  inviterRoleId: string;
  inviteeEmail: string;
  type: InvitationType;
  permissions?: CoParentPermission;
  personIds?: string[];  // For co-parent: which persons to grant access to
  groupIds?: string[];   // For co-teacher: which groups (classrooms) to share
}

/**
 * Send invitation via email
 */
export async function sendInvitation(
  options: SendInvitationOptions
): Promise<{ invitationId: string; token: string }> {
  const {
    inviterUserId,
    inviterRoleId,
    inviteeEmail,
    type,
    permissions,
    personIds,
    groupIds
  } = options;

  // Generate secure token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = addDays(new Date(), 7); // 7 days expiry

  // Check if invitation already exists and is pending
  const existing = await prisma.invitation.findFirst({
    where: {
      inviterRoleId,
      inviteeEmail,
      type,
      status: 'PENDING'
    }
  });

  if (existing) {
    throw new Error('Invitation already sent to this email');
  }

  // Create invitation
  const invitation = await prisma.invitation.create({
    data: {
      token,
      inviterUserId,
      inviterRoleId,
      inviteeEmail,
      type,
      permissions: permissions || CoParentPermission.READ_ONLY,
      personIds: personIds || [],
      groupIds: groupIds || [],
      expiresAt,
      status: 'PENDING'
    }
  });

  // Send email
  const inviterRole = await prisma.role.findUnique({
    where: { id: inviterRoleId },
    include: { user: true }
  });

  const inviterName = inviterRole?.user.name || 'Someone';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const acceptUrl = `${appUrl}/invitations/accept?token=${token}`;

  await sendEmail({
    to: inviteeEmail,
    subject: `${inviterName} invited you to Ruby Routines`,
    html: `
      <h1>You've been invited!</h1>
      <p>${inviterName} has invited you to collaborate on Ruby Routines.</p>
      <p>Invitation type: ${type}</p>
      ${permissions ? `<p>Permissions: ${permissions}</p>` : ''}
      <p>
        <a href="${acceptUrl}" style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Accept Invitation
        </a>
      </p>
      <p>Or copy this link: ${acceptUrl}</p>
      <p>This invitation expires in 7 days.</p>
    `
  });

  return {
    invitationId: invitation.id,
    token
  };
}

/**
 * Accept invitation
 */
export async function acceptInvitation(
  token: string,
  acceptingUserId: string
): Promise<void> {
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      inviterRole: {
        include: { user: true }
      }
    }
  });

  if (!invitation) {
    throw new Error('Invalid invitation');
  }

  if (invitation.status !== 'PENDING') {
    throw new Error('Invitation already accepted or rejected');
  }

  if (new Date() > invitation.expiresAt) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'EXPIRED' }
    });
    throw new Error('Invitation expired');
  }

  // Verify accepting user's email matches invitation
  const acceptingUser = await prisma.user.findUnique({
    where: { id: acceptingUserId }
  });

  if (acceptingUser?.email !== invitation.inviteeEmail) {
    throw new Error('Email mismatch');
  }

  // Handle different invitation types
  switch (invitation.type) {
    case InvitationType.CO_PARENT:
      await acceptCoParentInvitation(invitation, acceptingUserId);
      break;
    case InvitationType.CO_TEACHER:
      await acceptCoTeacherInvitation(invitation, acceptingUserId);
      break;
    case InvitationType.SCHOOL_TEACHER:
      await acceptSchoolTeacherInvitation(invitation, acceptingUserId);
      break;
    case InvitationType.SCHOOL_SUPPORT:
      await acceptSchoolSupportInvitation(invitation, acceptingUserId);
      break;
  }

  // Mark invitation as accepted
  await prisma.invitation.update({
    where: { id: invitation.id },
    data: {
      status: 'ACCEPTED',
      acceptedAt: new Date(),
      acceptedByUserId: acceptingUserId
    }
  });
}

/**
 * Accept co-parent invitation
 */
async function acceptCoParentInvitation(
  invitation: any,
  acceptingUserId: string
): Promise<void> {
  // Get or create accepting user's parent role
  let acceptingRole = await prisma.role.findFirst({
    where: {
      userId: acceptingUserId,
      type: 'PARENT'
    }
  });

  if (!acceptingRole) {
    acceptingRole = await prisma.role.create({
      data: {
        userId: acceptingUserId,
        type: 'PARENT',
        tier: 'FREE'
      }
    });
  }

  // Create co-parent relationship
  await prisma.coParent.create({
    data: {
      primaryRoleId: invitation.inviterRoleId,
      coParentRoleId: acceptingRole.id,
      permissions: invitation.permissions,
      personIds: invitation.personIds,
      status: 'ACTIVE'
    }
  });
}

/**
 * Accept co-teacher invitation
 */
async function acceptCoTeacherInvitation(
  invitation: any,
  acceptingUserId: string
): Promise<void> {
  // Get or create accepting user's teacher role
  let acceptingRole = await prisma.role.findFirst({
    where: {
      userId: acceptingUserId,
      type: 'TEACHER'
    }
  });

  if (!acceptingRole) {
    acceptingRole = await prisma.role.create({
      data: {
        userId: acceptingUserId,
        type: 'TEACHER',
        tier: 'FREE'
      }
    });
  }

  // Create co-teacher relationship for each shared group
  for (const groupId of invitation.groupIds) {
    await prisma.coTeacher.create({
      data: {
        groupId,
        primaryTeacherRoleId: invitation.inviterRoleId,
        coTeacherRoleId: acceptingRole.id,
        permissions: invitation.permissions,
        status: 'ACTIVE'
      }
    });
  }
}

/**
 * Accept school teacher invitation
 */
async function acceptSchoolTeacherInvitation(
  invitation: any,
  acceptingUserId: string
): Promise<void> {
  // Implementation for school mode
  // Create teacher role associated with school
  // (Detailed in school mode section)
}

/**
 * Accept school support staff invitation
 */
async function acceptSchoolSupportInvitation(
  invitation: any,
  acceptingUserId: string
): Promise<void> {
  // Implementation for school mode
  // (Detailed in school mode section)
}

/**
 * Reject invitation
 */
export async function rejectInvitation(token: string): Promise<void> {
  await prisma.invitation.update({
    where: { token },
    data: { status: 'REJECTED' }
  });
}

/**
 * Revoke co-parent access
 */
export async function revokeCoParentAccess(
  coParentId: string,
  revokingUserId: string
): Promise<void> {
  const coParent = await prisma.coParent.findUnique({
    where: { id: coParentId },
    include: { primaryRole: true }
  });

  if (!coParent) {
    throw new Error('Co-parent relationship not found');
  }

  // Verify revoking user is the primary parent
  if (coParent.primaryRole.userId !== revokingUserId) {
    throw new Error('Only primary parent can revoke access');
  }

  await prisma.coParent.update({
    where: { id: coParentId },
    data: { status: 'REVOKED' }
  });
}
```

---

### 2. Permission Service

**File: `/lib/services/permission.service.ts`**

```typescript
import { prisma } from '@/lib/prisma';
import { CoParentPermission } from './invitation.service';

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
      return checkCoParentPermission(coParent.permissions, action, personId, coParent.personIds);
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
    case CoParentPermission.READ_ONLY:
      return action === Action.VIEW;

    case CoParentPermission.TASK_COMPLETION:
      return [Action.VIEW, Action.COMPLETE_TASK].includes(action);

    case CoParentPermission.FULL_EDIT:
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
```

---

### 3. Student-Parent Connection Service

**File: `/lib/services/connection.service.ts`**

```typescript
import { prisma } from '@/lib/prisma';
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
```

---

### 4. Co-Parent tRPC Router

**File: `/lib/trpc/routers/coparent.router.ts`**

```typescript
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import {
  sendInvitation,
  InvitationType,
  CoParentPermission,
  revokeCoParentAccess
} from '@/lib/services/invitation.service';
import { prisma } from '@/lib/prisma';

export const coParentRouter = router({
  // Send co-parent invitation
  invite: protectedProcedure
    .input(z.object({
      roleId: z.string().cuid(),
      email: z.string().email(),
      permissions: z.enum(['READ_ONLY', 'TASK_COMPLETION', 'FULL_EDIT']),
      personIds: z.array(z.string().cuid())
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await sendInvitation({
        inviterUserId: ctx.user.id,
        inviterRoleId: input.roleId,
        inviteeEmail: input.email,
        type: InvitationType.CO_PARENT,
        permissions: input.permissions as CoParentPermission,
        personIds: input.personIds
      });

      return result;
    }),

  // List co-parents
  list: protectedProcedure
    .input(z.object({
      roleId: z.string().cuid()
    }))
    .query(async ({ ctx, input }) => {
      const coParents = await prisma.coParent.findMany({
        where: {
          primaryRoleId: input.roleId,
          status: 'ACTIVE'
        },
        include: {
          coParentRole: {
            include: { user: true }
          }
        }
      });

      return coParents.map(cp => ({
        id: cp.id,
        coParentUser: cp.coParentRole.user,
        permissions: cp.permissions,
        personIds: cp.personIds,
        createdAt: cp.createdAt
      }));
    }),

  // Update co-parent permissions
  updatePermissions: protectedProcedure
    .input(z.object({
      coParentId: z.string().cuid(),
      permissions: z.enum(['READ_ONLY', 'TASK_COMPLETION', 'FULL_EDIT']),
      personIds: z.array(z.string().cuid()).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const coParent = await prisma.coParent.findUnique({
        where: { id: input.coParentId },
        include: { primaryRole: true }
      });

      if (coParent?.primaryRole.userId !== ctx.user.id) {
        throw new Error('Permission denied');
      }

      await prisma.coParent.update({
        where: { id: input.coParentId },
        data: {
          permissions: input.permissions,
          ...(input.personIds && { personIds: input.personIds })
        }
      });

      return { success: true };
    }),

  // Revoke co-parent access
  revoke: protectedProcedure
    .input(z.object({
      coParentId: z.string().cuid()
    }))
    .mutation(async ({ ctx, input }) => {
      await revokeCoParentAccess(input.coParentId, ctx.user.id);
      return { success: true };
    })
});
```

---

### 5. Co-Teacher tRPC Router

**File: `/lib/trpc/routers/coteacher.router.ts`**

```typescript
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import {
  sendInvitation,
  InvitationType
} from '@/lib/services/invitation.service';
import { prisma } from '@/lib/prisma';

export const coTeacherRouter = router({
  // Share classroom with co-teacher
  share: protectedProcedure
    .input(z.object({
      roleId: z.string().cuid(),
      groupId: z.string().cuid(),
      email: z.string().email(),
      permissions: z.enum(['VIEW', 'EDIT_TASKS', 'FULL_EDIT'])
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await sendInvitation({
        inviterUserId: ctx.user.id,
        inviterRoleId: input.roleId,
        inviteeEmail: input.email,
        type: InvitationType.CO_TEACHER,
        permissions: input.permissions as any,
        groupIds: [input.groupId]
      });

      return result;
    }),

  // List co-teachers for group
  list: protectedProcedure
    .input(z.object({
      groupId: z.string().cuid()
    }))
    .query(async ({ ctx, input }) => {
      const coTeachers = await prisma.coTeacher.findMany({
        where: {
          groupId: input.groupId,
          status: 'ACTIVE'
        },
        include: {
          coTeacherRole: {
            include: { user: true }
          }
        }
      });

      return coTeachers;
    }),

  // Revoke co-teacher access
  revoke: protectedProcedure
    .input(z.object({
      coTeacherId: z.string().cuid()
    }))
    .mutation(async ({ ctx, input }) => {
      const coTeacher = await prisma.coTeacher.findUnique({
        where: { id: input.coTeacherId },
        include: { primaryTeacherRole: true }
      });

      if (coTeacher?.primaryTeacherRole.userId !== ctx.user.id) {
        throw new Error('Permission denied');
      }

      await prisma.coTeacher.update({
        where: { id: input.coTeacherId },
        data: { status: 'REVOKED' }
      });

      return { success: true };
    })
});
```

---

### 6. Student-Parent Connection Router

**File: `/lib/trpc/routers/connection.router.ts`**

```typescript
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import {
  generateConnectionCode,
  connectParentToStudent,
  getConnectedStudents,
  disconnectParentFromStudent
} from '@/lib/services/connection.service';

export const connectionRouter = router({
  // Teacher generates code for student
  generateCode: protectedProcedure
    .input(z.object({
      roleId: z.string().cuid(),
      studentPersonId: z.string().cuid()
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await generateConnectionCode(
        input.roleId,
        input.studentPersonId
      );
      return result;
    }),

  // Parent connects to student using code
  connect: protectedProcedure
    .input(z.object({
      code: z.string().length(6),
      parentRoleId: z.string().cuid(),
      parentPersonId: z.string().cuid()
    }))
    .mutation(async ({ ctx, input }) => {
      await connectParentToStudent(
        input.code,
        input.parentRoleId,
        input.parentPersonId
      );
      return { success: true };
    }),

  // Get parent's connected students
  listConnections: protectedProcedure
    .input(z.object({
      parentRoleId: z.string().cuid()
    }))
    .query(async ({ ctx, input }) => {
      const connections = await getConnectedStudents(input.parentRoleId);
      return connections;
    }),

  // Disconnect parent from student
  disconnect: protectedProcedure
    .input(z.object({
      connectionId: z.string().cuid()
    }))
    .mutation(async ({ ctx, input }) => {
      await disconnectParentFromStudent(input.connectionId, ctx.user.id);
      return { success: true };
    })
});
```

---

### 7. UI Components

**File: `/components/coparent/InviteModal.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
  roleId: string;
  persons: { id: string; name: string }[];
}

export function InviteModal({ open, onClose, roleId, persons }: InviteModalProps) {
  const [email, setEmail] = useState('');
  const [permissions, setPermissions] = useState<'READ_ONLY' | 'TASK_COMPLETION' | 'FULL_EDIT'>('READ_ONLY');
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>([]);

  const inviteMutation = trpc.coParent.invite.useMutation({
    onSuccess: () => {
      onClose();
      setEmail('');
      setSelectedPersonIds([]);
    }
  });

  const handleSubmit = () => {
    if (!email || selectedPersonIds.length === 0) return;

    inviteMutation.mutate({
      roleId,
      email,
      permissions,
      personIds: selectedPersonIds
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Co-Parent</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="coparent@example.com"
            />
          </div>

          <div>
            <Label htmlFor="permissions">Permissions</Label>
            <Select value={permissions} onValueChange={(v: any) => setPermissions(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="READ_ONLY">Read Only</SelectItem>
                <SelectItem value="TASK_COMPLETION">Task Completion</SelectItem>
                <SelectItem value="FULL_EDIT">Full Edit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Select Children</Label>
            <div className="space-y-2 mt-2">
              {persons.map((person) => (
                <div key={person.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={person.id}
                    checked={selectedPersonIds.includes(person.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedPersonIds([...selectedPersonIds, person.id]);
                      } else {
                        setSelectedPersonIds(selectedPersonIds.filter(id => id !== person.id));
                      }
                    }}
                  />
                  <Label htmlFor={person.id}>{person.name}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!email || selectedPersonIds.length === 0 || inviteMutation.isLoading}
          >
            {inviteMutation.isLoading ? 'Sending...' : 'Send Invitation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**File: `/components/connection/CodeEntry.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CodeEntryProps {
  parentRoleId: string;
  parentPersonId: string;
  onSuccess: () => void;
}

export function CodeEntry({ parentRoleId, parentPersonId, onSuccess }: CodeEntryProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const connectMutation = trpc.connection.connect.useMutation({
    onSuccess: () => {
      onSuccess();
      setCode('');
    },
    onError: (err) => {
      setError(err.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (code.length !== 6) {
      setError('Code must be 6 digits');
      return;
    }

    connectMutation.mutate({
      code,
      parentRoleId,
      parentPersonId
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="code">Connection Code</Label>
        <Input
          id="code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="123456"
          maxLength={6}
          className="text-center text-2xl font-mono"
        />
        <p className="text-sm text-gray-500 mt-1">
          Enter the 6-digit code provided by your child's teacher
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        disabled={code.length !== 6 || connectMutation.isLoading}
        className="w-full"
      >
        {connectMutation.isLoading ? 'Connecting...' : 'Connect'}
      </Button>
    </form>
  );
}
```

---

## RLS Policy Updates

**File: `/supabase/policies.sql`** (additions)

```sql
-- Co-Parent RLS Policies
CREATE POLICY "Co-parents can view shared persons"
ON persons FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM co_parents cp
    WHERE cp.status = 'ACTIVE'
      AND cp.primary_role_id = persons.role_id
      AND cp.co_parent_role_id IN (
        SELECT id FROM roles WHERE user_id = auth.uid()
      )
      AND persons.id = ANY(cp.person_ids)
  )
);

CREATE POLICY "Co-parents can complete tasks based on permissions"
ON task_completions FOR INSERT
USING (
  EXISTS (
    SELECT 1 FROM co_parents cp
    INNER JOIN tasks t ON t.id = task_completions.task_id
    WHERE cp.status = 'ACTIVE'
      AND cp.permissions IN ('TASK_COMPLETION', 'FULL_EDIT')
      AND cp.co_parent_role_id IN (
        SELECT id FROM roles WHERE user_id = auth.uid()
      )
      AND task_completions.person_id = ANY(cp.person_ids)
  )
);

-- Co-Teacher RLS Policies
CREATE POLICY "Co-teachers can view shared groups"
ON groups FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM co_teachers ct
    WHERE ct.status = 'ACTIVE'
      AND ct.group_id = groups.id
      AND ct.co_teacher_role_id IN (
        SELECT id FROM roles WHERE user_id = auth.uid()
      )
  )
);

-- Student-Parent Connection Policies
CREATE POLICY "Parents can view connected students"
ON persons FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM student_parent_connections spc
    WHERE spc.status = 'ACTIVE'
      AND spc.student_person_id = persons.id
      AND spc.parent_role_id IN (
        SELECT id FROM roles WHERE user_id = auth.uid()
      )
  )
);
```

---

## Testing Checklist

### Co-Parent
- [ ] Send co-parent invitation
- [ ] Accept invitation with matching email
- [ ] Reject invitation with non-matching email
- [ ] View persons based on granted access
- [ ] Complete tasks (TASK_COMPLETION permission)
- [ ] Cannot edit routines (READ_ONLY permission)
- [ ] Full edit works (FULL_EDIT permission)
- [ ] Revoke co-parent access
- [ ] Verify co-parent loses access after revocation

### Co-Teacher
- [ ] Share classroom with co-teacher
- [ ] Accept co-teacher invitation
- [ ] View shared students
- [ ] Edit tasks (EDIT_TASKS permission)
- [ ] Cannot delete students (VIEW permission)
- [ ] Full edit works (FULL_EDIT permission)
- [ ] Revoke co-teacher access

### Student-Parent Connection
- [ ] Generate 6-digit code for student
- [ ] Parent enters code and connects
- [ ] Parent sees student's tasks in dashboard
- [ ] Parent completes tasks for student
- [ ] Teacher disconnects parent
- [ ] Parent disconnects self
- [ ] Code expires after 24 hours

---

## Next Steps

After completing Stage 5:
1. Test all permission scenarios
2. Verify RLS policies prevent unauthorized access
3. Test email invitation flow end-to-end
4. Proceed to **Stage 6: Analytics + Marketplace**

---

**Stage 5 Complete Checklist:**
- [ ] Invitation service (email, magic links)
- [ ] Permission service (granular enforcement)
- [ ] Co-parent system (invite, accept, revoke)
- [ ] Co-teacher system (share classrooms)
- [ ] Student-parent connection (6-digit codes)
- [ ] School mode (principal, teachers, support staff)
- [ ] UI components (invite modal, code entry)
- [ ] RLS policies updated
- [ ] All tests passing
