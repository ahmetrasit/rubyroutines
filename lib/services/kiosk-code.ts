import { prisma } from '@/lib/prisma';
import { getRandomSafeWords } from './safe-words';
import { addHours } from 'date-fns';

export interface GenerateCodeOptions {
  roleId: string;
  wordCount?: 2 | 3; // 2 words = ~4M combinations, 3 words = ~8B combinations
  expiresInHours?: number; // Default 24 hours
}

export interface KioskCode {
  id: string;
  code: string; // e.g., "OCEAN-TIGER" or "CLOUD-FOREST-MOON"
  words: string[];
  roleId: string;
  expiresAt: Date;
  usedAt: Date | null;
  isActive: boolean;
}

/**
 * Generate unique kiosk code
 * Uses safe words from 2000-word list
 * Checks for duplicates before returning
 */
export async function generateKioskCode(
  options: GenerateCodeOptions
): Promise<KioskCode> {
  const { roleId, wordCount = 2, expiresInHours = 24 } = options;

  // Verify role exists and user has permission
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: { user: true }
  });

  if (!role) {
    throw new Error('Role not found');
  }

  // Check if user tier allows kiosk mode
  if (role.tier === 'FREE') {
    throw new Error('Kiosk mode requires BASIC tier or higher');
  }

  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    // Generate random words
    const words = getRandomSafeWords(wordCount);
    const code = words.join('-').toUpperCase();

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
      // Create code
      const expiresAt = addHours(new Date(), expiresInHours);

      const kioskCode = await prisma.code.create({
        data: {
          code,
          roleId,
          type: 'KIOSK',
          expiresAt,
          status: 'ACTIVE'
        }
      });

      return {
        id: kioskCode.id,
        code,
        words,
        roleId,
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
 */
export async function validateKioskCode(code: string): Promise<{
  valid: boolean;
  kioskCode?: KioskCode;
  error?: string;
}> {
  const normalizedCode = code.trim().toUpperCase();

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
