import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { addDays } from 'date-fns';
import { getRandomSafeWords } from './safe-words';
import { checkRateLimit, RATE_LIMIT_CONFIGS } from './rate-limit.service';

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
 * Generate unique 4-word invitation code
 */
async function generateInvitationCode(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 50;

  while (attempts < maxAttempts) {
    const words = getRandomSafeWords(4);
    const code = words.join('-').toLowerCase();

    // Check if code already exists in invitations
    const existing = await prisma.invitation.findFirst({
      where: { inviteCode: code }
    });

    if (!existing) {
      return code;
    }
    attempts++;
  }

  throw new Error('Failed to generate unique invitation code after 50 attempts');
}

/**
 * Send invitation via email
 *
 * Rate limiting: 10 invitations per user per day (24 hours)
 */
export async function sendInvitation(
  options: SendInvitationOptions
): Promise<{ invitationId: string; token: string; inviteCode: string }> {
  const {
    inviterUserId,
    inviterRoleId,
    inviteeEmail,
    type,
    permissions,
    personIds,
    groupIds
  } = options;

  // Check rate limit
  const rateLimit = await checkRateLimit(
    inviterUserId,
    RATE_LIMIT_CONFIGS.INVITATION_SEND
  );

  if (!rateLimit.allowed) {
    const resetTime = new Date(rateLimit.resetAt).toLocaleString();
    throw new Error(
      `Rate limit exceeded. You can send more invitations after ${resetTime}. Limit: 10 invitations per day.`
    );
  }

  // Generate secure token
  const token = crypto.randomBytes(32).toString('hex');

  // Generate 4-word invite code
  const inviteCode = await generateInvitationCode();

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

  // Force READ_ONLY permissions for co-parent and co-teacher
  const finalPermissions = (type === InvitationType.CO_PARENT || type === InvitationType.CO_TEACHER)
    ? 'READ_ONLY'
    : (permissions || 'READ_ONLY');

  // Create invitation
  const invitation = await prisma.invitation.create({
    data: {
      token,
      inviteCode,
      inviterUserId,
      inviterRoleId,
      inviteeEmail,
      type,
      permissions: finalPermissions,
      personIds: personIds || [],
      groupIds: groupIds || [],
      expiresAt,
      status: 'PENDING'
    }
  });

  // FEATURE: Email service integration - configure RESEND_API_KEY in environment
  // const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  // const acceptUrl = `${appUrl}/invitations/accept?token=${token}`;
  // Email should include: inviteCode for easy reference

  return {
    invitationId: invitation.id,
    token,
    inviteCode
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

  // Use transaction to ensure atomicity: create relationship and mark invitation as accepted together
  await prisma.$transaction(async (tx) => {
    // Handle different invitation types
    switch (invitation.type) {
      case InvitationType.CO_PARENT:
        await acceptCoParentInvitationTx(tx, invitation, acceptingUserId);
        break;
      case InvitationType.CO_TEACHER:
        await acceptCoTeacherInvitationTx(tx, invitation, acceptingUserId);
        break;
      case InvitationType.SCHOOL_TEACHER:
      case InvitationType.SCHOOL_SUPPORT:
        // FEATURE: School mode invite support planned for future release
        throw new Error('School mode not yet implemented');
    }

    // Mark invitation as accepted
    await tx.invitation.update({
      where: { id: invitation.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        acceptedByUserId: acceptingUserId
      }
    });
  });
}

/**
 * Accept co-parent invitation (transaction version)
 */
async function acceptCoParentInvitationTx(
  tx: any,
  invitation: any,
  acceptingUserId: string
): Promise<void> {
  // Get or create accepting user's parent role
  let acceptingRole = await tx.role.findFirst({
    where: {
      userId: acceptingUserId,
      type: 'PARENT'
    }
  });

  if (!acceptingRole) {
    acceptingRole = await tx.role.create({
      data: {
        userId: acceptingUserId,
        type: 'PARENT',
        tier: 'FREE'
      }
    });
  }

  // Create co-parent relationship
  await tx.coParent.create({
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
 * Accept co-teacher invitation (transaction version)
 */
async function acceptCoTeacherInvitationTx(
  tx: any,
  invitation: any,
  acceptingUserId: string
): Promise<void> {
  // Get or create accepting user's teacher role
  let acceptingRole = await tx.role.findFirst({
    where: {
      userId: acceptingUserId,
      type: 'TEACHER'
    }
  });

  if (!acceptingRole) {
    acceptingRole = await tx.role.create({
      data: {
        userId: acceptingUserId,
        type: 'TEACHER',
        tier: 'FREE'
      }
    });
  }

  // Create co-teacher relationship for each shared group
  for (const groupId of invitation.groupIds) {
    await tx.coTeacher.create({
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
