import { prisma } from '@/lib/prisma';
import { addDays, addMinutes } from 'date-fns';

export interface CreateKioskSessionOptions {
  codeId: string;
  deviceId: string;
  ipAddress?: string;
  userAgent?: string;
  durationDays?: number;
}

export interface KioskSessionData {
  id: string;
  codeId: string;
  deviceId: string;
  startedAt: Date;
  lastActiveAt: Date;
  expiresAt: Date;
  endedAt: Date | null;
  ipAddress: string | null;
  userAgent: string | null;
}

/**
 * Create a new kiosk session
 * @param options - Session creation options
 * @returns Created session data
 */
export async function createKioskSession(
  options: CreateKioskSessionOptions
): Promise<KioskSessionData> {
  const { codeId, deviceId, ipAddress, userAgent, durationDays = 90 } = options;

  // Check if code exists and get session duration
  const code = await prisma.code.findUnique({
    where: { id: codeId },
    select: { sessionDurationDays: true }
  });

  if (!code) {
    throw new Error('Kiosk code not found');
  }

  const expiresAt = addDays(new Date(), durationDays || code.sessionDurationDays);

  // Create session and mark code as USED in a transaction
  // This prevents the code from expiring after its 10-minute window
  const session = await prisma.$transaction(async (tx) => {
    // Create the session
    const newSession = await tx.kioskSession.create({
      data: {
        codeId,
        deviceId,
        expiresAt,
        ipAddress,
        userAgent
      }
    });

    // Mark code as USED so it doesn't expire after 10 minutes
    // The session itself has its own expiration (90 days by default)
    await tx.code.update({
      where: { id: codeId },
      data: {
        status: 'USED',
        usedAt: new Date()
      }
    });

    return newSession;
  });

  return {
    id: session.id,
    codeId: session.codeId,
    deviceId: session.deviceId,
    startedAt: session.startedAt,
    lastActiveAt: session.lastActiveAt,
    expiresAt: session.expiresAt,
    endedAt: session.endedAt,
    ipAddress: session.ipAddress,
    userAgent: session.userAgent
  };
}

/**
 * Terminate a specific session
 * @param sessionId - Session ID to terminate
 * @param userId - User ID who is terminating the session
 * @param reason - Reason for termination
 */
export async function terminateSession(
  sessionId: string,
  userId: string,
  reason?: string
): Promise<void> {
  await prisma.kioskSession.update({
    where: { id: sessionId },
    data: {
      endedAt: new Date(),
      terminatedBy: userId,
      terminatedAt: new Date(),
      terminationReason: reason || 'Manually terminated by user'
    }
  });
}

/**
 * Terminate all active sessions for a specific code
 * @param codeId - Code ID
 * @param userId - User ID who is terminating the sessions
 * @param reason - Reason for termination
 */
export async function terminateAllSessionsForCode(
  codeId: string,
  userId: string,
  reason?: string
): Promise<number> {
  const result = await prisma.kioskSession.updateMany({
    where: {
      codeId,
      endedAt: null // Only terminate active sessions
    },
    data: {
      endedAt: new Date(),
      terminatedBy: userId,
      terminatedAt: new Date(),
      terminationReason: reason || 'All sessions terminated by code owner'
    }
  });

  return result.count;
}

/**
 * Get all active sessions for a specific code
 * @param codeId - Code ID
 * @returns Array of active sessions
 */
export async function getActiveSessionsForCode(codeId: string): Promise<KioskSessionData[]> {
  const sessions = await prisma.kioskSession.findMany({
    where: {
      codeId,
      endedAt: null,
      expiresAt: { gt: new Date() }
    },
    orderBy: { startedAt: 'desc' }
  });

  return sessions.map(s => ({
    id: s.id,
    codeId: s.codeId,
    deviceId: s.deviceId,
    startedAt: s.startedAt,
    lastActiveAt: s.lastActiveAt,
    expiresAt: s.expiresAt,
    endedAt: s.endedAt,
    ipAddress: s.ipAddress,
    userAgent: s.userAgent
  }));
}

/**
 * Get all active sessions for a role (across all codes)
 * @param roleId - Role ID
 * @returns Array of active sessions with code info
 */
export async function getActiveSessionsForRole(roleId: string) {
  const sessions = await prisma.kioskSession.findMany({
    where: {
      code: {
        roleId
      },
      endedAt: null,
      expiresAt: { gt: new Date() }
    },
    include: {
      code: {
        include: {
          person: true,
          group: true
        }
      }
    },
    orderBy: { startedAt: 'desc' }
  });

  return sessions;
}

/**
 * Update session activity (heartbeat)
 * @param sessionId - Session ID
 */
export async function updateSessionActivity(sessionId: string): Promise<void> {
  await prisma.kioskSession.update({
    where: { id: sessionId },
    data: {
      lastActiveAt: new Date()
    }
  });
}

/**
 * Validate session - check if session exists and is active
 * @param sessionId - Session ID
 * @returns Validation result
 */
export async function validateSession(sessionId: string): Promise<{
  valid: boolean;
  session?: KioskSessionData;
  error?: string;
}> {
  const session = await prisma.kioskSession.findUnique({
    where: { id: sessionId }
  });

  if (!session) {
    return { valid: false, error: 'Session not found' };
  }

  // Check if session was terminated
  if (session.endedAt) {
    return { valid: false, error: 'Session has been terminated' };
  }

  // Check if session expired
  if (session.expiresAt < new Date()) {
    // Auto-terminate expired session
    await terminateSession(sessionId, 'system', 'Session expired');
    return { valid: false, error: 'Session has expired' };
  }

  return {
    valid: true,
    session: {
      id: session.id,
      codeId: session.codeId,
      deviceId: session.deviceId,
      startedAt: session.startedAt,
      lastActiveAt: session.lastActiveAt,
      expiresAt: session.expiresAt,
      endedAt: session.endedAt,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent
    }
  };
}

/**
 * Get active session count for a code
 * @param codeId - Code ID
 * @returns Number of active sessions
 */
export async function getActiveSessionCountForCode(codeId: string): Promise<number> {
  return await prisma.kioskSession.count({
    where: {
      codeId,
      endedAt: null,
      expiresAt: { gt: new Date() }
    }
  });
}

/**
 * Get active session count for all codes of a role
 * @param roleId - Role ID
 * @returns Object mapping code IDs to session counts
 */
export async function getActiveSessionCountsForRole(roleId: string): Promise<Record<string, number>> {
  const codes = await prisma.code.findMany({
    where: {
      roleId,
      type: 'KIOSK',
      status: 'ACTIVE'
    },
    select: { id: true }
  });

  const counts: Record<string, number> = {};

  for (const code of codes) {
    counts[code.id] = await getActiveSessionCountForCode(code.id);
  }

  return counts;
}

/**
 * Cleanup expired sessions (should be run periodically)
 * @returns Number of sessions cleaned up
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await prisma.kioskSession.updateMany({
    where: {
      endedAt: null,
      expiresAt: { lt: new Date() }
    },
    data: {
      endedAt: new Date(),
      terminationReason: 'Session expired (automatic cleanup)'
    }
  });

  return result.count;
}

/**
 * Check if a code can create more sessions based on tier limits
 * @param roleId - Role ID
 * @param tier - User's tier
 * @param tierLimits - Tier limits object
 * @returns Whether more sessions can be created
 */
export async function canCreateMoreSessions(
  roleId: string,
  kioskCodeLimit: number
): Promise<{ canCreate: boolean; currentCount: number; limit: number; error?: string }> {
  // Count active codes (codes that haven't expired and aren't revoked)
  const activeCodesCount = await prisma.code.count({
    where: {
      roleId,
      type: 'KIOSK',
      status: 'ACTIVE',
      expiresAt: { gt: new Date() }
    }
  });

  if (activeCodesCount >= kioskCodeLimit) {
    return {
      canCreate: false,
      currentCount: activeCodesCount,
      limit: kioskCodeLimit,
      error: `Tier limit reached: ${activeCodesCount}/${kioskCodeLimit} active kiosk codes`
    };
  }

  return {
    canCreate: true,
    currentCount: activeCodesCount,
    limit: kioskCodeLimit
  };
}
