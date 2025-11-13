import { prisma } from '@/lib/db';
import crypto from 'crypto';
import { addDays } from 'date-fns';

export enum InvitationType {
  CO_PARENT = 'CO_PARENT',
  CO_TEACHER = 'CO_TEACHER',
  SCHOOL_TEACHER = 'SCHOOL_TEACHER',
  SCHOOL_SUPPORT = 'SCHOOL_SUPPORT'
}

export enum CoParentPermission {
  READ_ONLY = 'READ_ONLY',
  TASK_COMPLETION = 'TASK_COMPLETION',
  FULL_EDIT = 'FULL_EDIT'
}

export interface SendInvitationOptions {
  inviterUserId: string;
  inviterRoleId: string;
  inviteeEmail: string;
  type: InvitationType;
  permissions?: string;
  personIds?: string[];
  groupIds?: string[];
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
      permissions: permissions || 'READ_ONLY',
      personIds: personIds || [],
      groupIds: groupIds || [],
      expiresAt,
      status: 'PENDING'
    }
  });

  // TODO: Send email using Resend
  // const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  // const acceptUrl = `${appUrl}/invitations/accept?token=${token}`;

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
    case InvitationType.SCHOOL_SUPPORT:
      // TODO: Implement school mode
      throw new Error('School mode not yet implemented');
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

/**
 * Revoke co-teacher access
 */
export async function revokeCoTeacherAccess(
  coTeacherId: string,
  revokingUserId: string
): Promise<void> {
  const coTeacher = await prisma.coTeacher.findUnique({
    where: { id: coTeacherId },
    include: { primaryTeacherRole: true }
  });

  if (!coTeacher) {
    throw new Error('Co-teacher relationship not found');
  }

  // Verify revoking user is the primary teacher
  if (coTeacher.primaryTeacherRole.userId !== revokingUserId) {
    throw new Error('Only primary teacher can revoke access');
  }

  await prisma.coTeacher.update({
    where: { id: coTeacherId },
    data: { status: 'REVOKED' }
  });
}
