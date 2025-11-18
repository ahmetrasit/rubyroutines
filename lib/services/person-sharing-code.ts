import { prisma } from '@/lib/prisma';
import { getRandomSafeWords } from './safe-words';
import { TRPCError } from '@trpc/server';
import { checkRateLimit, recordFailedAttempt, RATE_LIMIT_CONFIGS } from './rate-limit.service';

interface GenerateInviteParams {
  ownerRoleId: string;
  ownerPersonId?: string;
  shareType: 'PERSON' | 'ROUTINE_ACCESS' | 'FULL_ROLE';
  permissions: 'VIEW' | 'EDIT' | 'MANAGE';
  contextData?: any;
  expiresInDays?: number;
  maxUses?: number;
}

/**
 * Generate unique person sharing invite code
 * Format: word1-word2-word3-word4 (lowercase, 4 words)
 * Checks uniqueness across ALL code systems
 *
 * Rate limiting: 20 codes per user per hour
 */
export async function generatePersonSharingInvite(params: GenerateInviteParams): Promise<string> {
  const {
    ownerRoleId,
    ownerPersonId,
    shareType,
    permissions,
    contextData,
    expiresInDays = 90,
    maxUses,
  } = params;

  // Check rate limit
  const rateLimit = await checkRateLimit(
    ownerRoleId,
    RATE_LIMIT_CONFIGS.PERSON_SHARING_CODE_GENERATION
  );

  if (!rateLimit.allowed) {
    const resetTime = new Date(rateLimit.resetAt).toLocaleTimeString();
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `Rate limit exceeded. You can generate more codes after ${resetTime}. Limit: 20 codes per hour.`,
    });
  }

  let attempts = 0;
  const maxAttempts = 50;

  while (attempts < maxAttempts) {
    // Generate 4-word code
    const words = getRandomSafeWords(4);
    const code = words.join('-').toLowerCase();

    // Check uniqueness across all code systems
    const isUnique = await isCodeUnique(code);

    if (isUnique) {
      // Calculate expiration date
      const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

      // Create invite
      await prisma.personSharingInvite.create({
        data: {
          inviteCode: code,
          ownerRoleId,
          ownerPersonId,
          shareType,
          permissions,
          contextData,
          expiresAt,
          maxUses,
          status: 'ACTIVE',
        },
      });

      return code;
    }
    attempts++;
  }

  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Failed to generate unique invite code after 50 attempts',
  });
}

/**
 * Check if code is unique across all code systems
 */
async function isCodeUnique(code: string): Promise<boolean> {
  // Check person sharing invites
  const sharingInvite = await prisma.personSharingInvite.findUnique({
    where: { inviteCode: code },
  });
  if (sharingInvite) return false;

  // Check marketplace share codes
  const marketplaceCode = await prisma.marketplaceShareCode.findUnique({
    where: { shareCode: code },
  });
  if (marketplaceCode) return false;

  // Check routine share codes
  const routineCode = await prisma.routineShareCode.findUnique({
    where: { shareCode: code },
  });
  if (routineCode) return false;

  // Check kiosk codes (normalized)
  const normalizedKioskCode = code.toUpperCase();
  const kioskCode = await prisma.code.findFirst({
    where: {
      code: normalizedKioskCode,
      OR: [
        { expiresAt: { gt: new Date() } },
        { status: 'ACTIVE' },
      ],
    },
  });
  if (kioskCode) return false;

  // Check legacy connection codes
  const connectionCode = await prisma.connectionCode.findFirst({
    where: {
      code: code,
      status: 'ACTIVE',
    },
  });
  if (connectionCode) return false;

  return true;
}

/**
 * Validate person sharing invite code
 */
export async function validatePersonSharingInvite(code: string) {
  const normalizedCode = code.toLowerCase().trim();

  const invite = await prisma.personSharingInvite.findUnique({
    where: { inviteCode: normalizedCode },
    include: {
      ownerRole: {
        include: {
          user: {
            select: { name: true, image: true },
          },
        },
      },
      ownerPerson: {
        select: { name: true, avatar: true },
      },
    },
  });

  if (!invite) {
    return { valid: false, error: 'Invalid invite code' };
  }

  // Check status
  if (invite.status !== 'ACTIVE') {
    return { valid: false, error: 'Invite code has been revoked or expired' };
  }

  // Check expiration
  if (invite.expiresAt < new Date()) {
    await prisma.personSharingInvite.update({
      where: { id: invite.id },
      data: { status: 'EXPIRED' },
    });
    return { valid: false, error: 'Invite code has expired' };
  }

  // Check usage limit
  if (invite.maxUses && invite.useCount >= invite.maxUses) {
    return { valid: false, error: 'Invite code has reached maximum uses' };
  }

  return {
    valid: true,
    invite: {
      id: invite.id,
      ownerRole: invite.ownerRole,
      ownerPerson: invite.ownerPerson,
      shareType: invite.shareType,
      permissions: invite.permissions,
      contextData: invite.contextData,
      expiresAt: invite.expiresAt,
    },
  };
}

/**
 * Claim person sharing invite
 */
interface ClaimInviteParams {
  inviteCode: string;
  claimingRoleId: string;
  claimingUserId: string;
  contextData?: any;
}

/**
 * Claim a person sharing invite using a code
 *
 * Rate limiting: 10 failed attempts per user per hour
 */
export async function claimPersonSharingInvite(params: ClaimInviteParams) {
  const { inviteCode, claimingRoleId, claimingUserId, contextData } = params;

  // Check rate limit
  const rateLimit = await checkRateLimit(
    claimingRoleId,
    RATE_LIMIT_CONFIGS.PERSON_SHARING_CODE_CLAIM
  );

  if (!rateLimit.allowed) {
    const resetTime = new Date(rateLimit.resetAt).toLocaleTimeString();
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `Too many failed attempts. Please try again after ${resetTime}.`,
    });
  }

  // Validate invite
  const validation = await validatePersonSharingInvite(inviteCode);
  if (!validation.valid || !validation.invite) {
    // Record failed attempt
    await recordFailedAttempt(
      claimingRoleId,
      RATE_LIMIT_CONFIGS.PERSON_SHARING_CODE_CLAIM
    );
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: validation.error || 'Invalid invite code',
    });
  }

  const invite = validation.invite;

  // Check if already claimed by this user
  const existingConnection = await prisma.personSharingConnection.findFirst({
    where: {
      ownerRoleId: invite.ownerRole.id,
      ownerPersonId: invite.ownerPerson?.id || null,
      sharedWithRoleId: claimingRoleId,
      shareType: invite.shareType,
      status: 'ACTIVE',
    },
  });

  if (existingConnection) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'You have already claimed this invite',
    });
  }

  // Use transaction to ensure atomicity: create connection and update invite together
  const connection = await prisma.$transaction(async (tx) => {
    // Create connection
    const newConnection = await tx.personSharingConnection.create({
      data: {
        ownerRoleId: invite.ownerRole.id,
        ownerPersonId: invite.ownerPerson?.id || null,
        sharedWithRoleId: claimingRoleId,
        sharedWithUserId: claimingUserId,
        shareType: invite.shareType,
        permissions: invite.permissions,
        contextData: {
          ...invite.contextData,
          ...contextData,
        },
        inviteCodeId: invite.id,
        status: 'ACTIVE',
      },
    });

    // Get current invite to check maxUses
    const currentInvite = await tx.personSharingInvite.findUnique({
      where: { id: invite.id },
    });

    if (currentInvite) {
      // Increment use count and update status if max uses reached
      await tx.personSharingInvite.update({
        where: { id: invite.id },
        data: {
          useCount: { increment: 1 },
          status:
            currentInvite.maxUses && currentInvite.useCount + 1 >= currentInvite.maxUses
              ? 'USED'
              : 'ACTIVE',
        },
      });
    }

    return newConnection;
  });

  return connection;
}

/**
 * Revoke person sharing connection
 */
export async function revokePersonSharingConnection(
  connectionId: string,
  requestingUserId: string
) {
  const connection = await prisma.personSharingConnection.findUnique({
    where: { id: connectionId },
    include: {
      ownerRole: true,
    },
  });

  if (!connection) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Connection not found',
    });
  }

  // Only owner can revoke
  if (connection.ownerRole.userId !== requestingUserId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Only the owner can revoke this connection',
    });
  }

  await prisma.personSharingConnection.update({
    where: { id: connectionId },
    data: { status: 'REVOKED' },
  });

  return { success: true };
}

/**
 * Get all connections for a user
 */
export async function getPersonSharingConnections(
  roleId: string,
  type: 'owned' | 'shared_with_me'
) {
  if (type === 'owned') {
    // Get connections where this role is the owner
    return await prisma.personSharingConnection.findMany({
      where: {
        ownerRoleId: roleId,
        status: 'ACTIVE',
      },
      include: {
        ownerPerson: true,
        sharedWithRole: {
          include: {
            user: {
              select: { name: true, image: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  } else {
    // Get connections where this role is the recipient
    return await prisma.personSharingConnection.findMany({
      where: {
        sharedWithRoleId: roleId,
        status: 'ACTIVE',
      },
      include: {
        ownerRole: {
          include: {
            user: {
              select: { name: true, image: true },
            },
          },
        },
        ownerPerson: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
