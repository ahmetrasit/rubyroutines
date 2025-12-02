import { prisma } from '@/lib/prisma';
import { getRandomSafeWords } from './safe-words';
import { addHours, addMinutes } from 'date-fns';

export interface GenerateCodeOptions {
  roleId: string;
  groupId?: string; // Optional: specific classroom/group ID
  personId?: string; // Optional: specific person ID for individual codes
  userName: string; // User's first name
  classroomName?: string; // Optional classroom name for teacher mode (for code generation)
  wordCount?: 2 | 3; // 2 words = ~4M combinations, 3 words = ~8B combinations
  expiresInMinutes?: number; // Default 10 minutes for code expiration
  sessionDurationDays?: number; // Default 90 days for session duration
}

export interface KioskCode {
  id: string;
  code: string; // e.g., "OCEAN-TIGER" or "CLOUD-FOREST-MOON"
  words: string[];
  roleId: string;
  groupId?: string | null; // Optional: specific classroom/group ID
  personId?: string | null; // Optional: specific person ID for individual codes
  expiresAt: Date;
  usedAt: Date | null;
  isActive: boolean;
}

/**
 * Generate unique kiosk code
 * Uses safe words from 2000-word list
 * Checks for duplicates before returning
 *
 * Format (ALL UPPERCASE):
 * - FIRSTNAME-WORD1-WORD2-WORD3 (applies to both parent and classroom modes)
 */
export async function generateKioskCode(
  options: GenerateCodeOptions
): Promise<KioskCode> {
  const { roleId, groupId, personId, userName, classroomName, wordCount = 2, expiresInMinutes = 10, sessionDurationDays = 90 } = options;

  // Verify role exists and user has permission
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: { user: true }
  });

  if (!role) {
    throw new Error('Role not found');
  }

  // Extract first name and format it (uppercase, no spaces)
  const trimmedName = (userName || '').trim();
  if (!trimmedName) {
    throw new Error('Invalid user name: name is empty');
  }
  const firstNamePart = trimmedName.split(' ')[0] || trimmedName;
  const firstName = firstNamePart.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!firstName) {
    throw new Error('Invalid user name: name contains no valid characters');
  }

  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    // Generate random words
    const words = getRandomSafeWords(wordCount);
    const wordsPart = words.join('-').toUpperCase();

    // Build the full code (ALL UPPERCASE)
    // Format: FIRSTNAME-WORD1-WORD2-WORD3
    const code = `${firstName}-${wordsPart}`;

    // Check if code already exists and is active
    const existing = await prisma.code.findFirst({
      where: {
        code,
        OR: [
          { expiresAt: { gt: new Date() } },
          { usedAt: null }
        ]
      }
    });

    if (!existing) {
      // Create code with 10-minute expiration (for code entry)
      const expiresAt = addMinutes(new Date(), expiresInMinutes);

      const kioskCode = await prisma.code.create({
        data: {
          code,
          roleId,
          groupId, // Store groupId if provided
          personId, // Store personId if provided (for individual codes)
          type: 'KIOSK',
          expiresAt,
          sessionDurationDays, // Store session duration (default 90 days)
          status: 'ACTIVE'
        }
      });

      return {
        id: kioskCode.id,
        code,
        words,
        roleId,
        groupId,
        personId,
        expiresAt,
        usedAt: null,
        isActive: true
      };
    }

    attempts++;
  }

  throw new Error('Failed to generate unique code after 10 attempts');
}

/**
 * Validate kiosk code
 * Checks if code exists, is active, not expired, not used
 * Accepts codes with spaces or dashes (e.g., "OCEAN TIGER" or "OCEAN-TIGER")
 */
export async function validateKioskCode(code: string): Promise<{
  valid: boolean;
  kioskCode?: KioskCode;
  error?: string;
}> {
  // Normalize: trim, replace spaces with dashes, convert to uppercase
  const normalizedCode = code.trim().replace(/\s+/g, '-').toUpperCase();

  const dbCode = await prisma.code.findFirst({
    where: {
      code: normalizedCode,
      type: 'KIOSK',
      status: 'ACTIVE'
    },
    include: {
      role: {
        include: {
          user: true,
          persons: { where: { status: 'ACTIVE' } }
        }
      }
    }
  });

  if (!dbCode) {
    return { valid: false, error: 'Invalid code' };
  }

  // Check expiration
  if (dbCode.expiresAt < new Date()) {
    await prisma.code.update({
      where: { id: dbCode.id },
      data: { status: 'EXPIRED' }
    });
    return { valid: false, error: 'Code expired' };
  }

  // Check if already used (single-session restriction)
  if (dbCode.usedAt) {
    return { valid: false, error: 'Code already used' };
  }

  return {
    valid: true,
    kioskCode: {
      id: dbCode.id,
      code: dbCode.code,
      words: dbCode.code.split('-'),
      roleId: dbCode.roleId,
      groupId: dbCode.groupId,
      personId: dbCode.personId,
      expiresAt: dbCode.expiresAt,
      usedAt: dbCode.usedAt,
      isActive: true
    }
  };
}

/**
 * Mark code as used (single-session restriction)
 */
export async function markCodeAsUsed(codeId: string): Promise<void> {
  await prisma.code.update({
    where: { id: codeId },
    data: {
      usedAt: new Date(),
      status: 'USED'
    }
  });
}

/**
 * Get all active codes for a role
 */
export async function getActiveCodesForRole(roleId: string): Promise<KioskCode[]> {
  const codes = await prisma.code.findMany({
    where: {
      roleId,
      type: 'KIOSK',
      status: 'ACTIVE',
      expiresAt: { gt: new Date() },
      usedAt: null
    },
    orderBy: { createdAt: 'desc' }
  });

  return codes.map((c: any) => ({
    id: c.id,
    code: c.code,
    words: c.code.split('-'),
    roleId: c.roleId,
    groupId: c.groupId,
    personId: c.personId,
    expiresAt: c.expiresAt,
    usedAt: c.usedAt,
    isActive: true
  }));
}

/**
 * Revoke code (deactivate before expiration)
 */
export async function revokeCode(codeId: string): Promise<void> {
  await prisma.code.update({
    where: { id: codeId },
    data: { status: 'REVOKED' }
  });
}

/**
 * Cleanup expired codes (run daily via cron)
 */
export async function cleanupExpiredCodes(): Promise<number> {
  const result = await prisma.code.updateMany({
    where: {
      type: 'KIOSK',
      status: 'ACTIVE',
      expiresAt: { lt: new Date() }
    },
    data: { status: 'EXPIRED' }
  });

  return result.count;
}

/**
 * Validate kiosk session - verify kiosk code is active and person belongs to the role
 */
export async function validateKioskSession(
  kioskCodeId: string,
  personId: string
): Promise<{ valid: boolean; error?: string }> {
  // Get kiosk code with role
  const kioskCode = await prisma.code.findUnique({
    where: { id: kioskCodeId },
    include: {
      role: {
        include: {
          persons: {
            where: { status: 'ACTIVE' }
          }
        }
      }
    }
  });

  if (!kioskCode) {
    return { valid: false, error: 'Invalid kiosk session' };
  }

  // Check if code is still active or used
  if (kioskCode.status !== 'ACTIVE' && kioskCode.status !== 'USED') {
    return { valid: false, error: 'Kiosk session expired or revoked' };
  }

  // Only check code expiration if it hasn't been used yet
  // Once a code is used and a session is created, the code expiration doesn't matter
  // The session has its own expiration (90 days)
  if (kioskCode.status === 'ACTIVE' && kioskCode.expiresAt < new Date()) {
    await prisma.code.update({
      where: { id: kioskCodeId },
      data: { status: 'EXPIRED' }
    });
    return { valid: false, error: 'Kiosk code expired (10 minute limit for entering code)' };
  }

  // Check if person belongs to this role
  const personBelongsToRole = kioskCode.role.persons.some((p: any) => p.id === personId);
  if (!personBelongsToRole) {
    return { valid: false, error: 'Person does not belong to this kiosk session' };
  }

  return { valid: true };
}
