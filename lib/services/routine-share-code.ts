import { prisma } from '@/lib/prisma';
import { getRandomSafeWords } from './safe-words';
import { TRPCError } from '@trpc/server';

/**
 * Generate unique routine share code
 * Format: word1-word2-word3 (lowercase, 3 words)
 * Checks uniqueness across all code systems
 */
export async function generateRoutineShareCode(
  routineId: string,
  userId: string,
  maxUses?: number,
  expiresInDays?: number
): Promise<string> {
  let attempts = 0;
  const maxAttempts = 50;

  while (attempts < maxAttempts) {
    // Generate 3-word code
    const words = getRandomSafeWords(3);
    const code = words.join('-').toLowerCase();

    // Check uniqueness across all code systems
    const isUnique = await isCodeUnique(code);

    if (isUnique) {
      // Calculate expiration date
      const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : null;

      // Create share code
      await prisma.routineShareCode.create({
        data: {
          routineId,
          shareCode: code,
          createdBy: userId,
          maxUses,
          expiresAt,
        },
      });

      return code;
    }

    attempts++;
  }

  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Failed to generate unique share code after 50 attempts',
  });
}

/**
 * Check if code is unique across all code systems:
 * - Routine share codes
 * - Marketplace share codes
 * - Kiosk codes
 * - Invitation codes (connection codes)
 */
async function isCodeUnique(code: string): Promise<boolean> {
  // Check routine share codes
  const routineCode = await prisma.routineShareCode.findUnique({
    where: { shareCode: code },
  });
  if (routineCode) return false;

  // Check marketplace share codes
  const marketplaceCode = await prisma.marketplaceShareCode.findUnique({
    where: { shareCode: code },
  });
  if (marketplaceCode) return false;

  // Check kiosk codes (case-insensitive, normalized)
  const normalizedKioskCode = code.toUpperCase();
  const kioskCode = await prisma.code.findFirst({
    where: {
      code: normalizedKioskCode,
      type: 'KIOSK',
      OR: [
        { expiresAt: { gt: new Date() } },
        { status: 'ACTIVE' },
      ],
    },
  });
  if (kioskCode) return false;

  return true;
}

/**
 * Validate routine share code
 * Checks expiration, usage limits, and active status
 */
export async function validateRoutineShareCode(
  code: string
): Promise<{
  valid: boolean;
  shareCode?: {
    id: string;
    routineId: string;
    shareCode: string;
    useCount: number;
    maxUses: number | null;
    expiresAt: Date | null;
  };
  error?: string;
}> {
  // Normalize code (lowercase, trim)
  const normalizedCode = code.toLowerCase().trim();

  // Find share code
  const shareCode = await prisma.routineShareCode.findUnique({
    where: { shareCode: normalizedCode },
    include: {
      routine: true,
    },
  });

  if (!shareCode) {
    return { valid: false, error: 'Invalid share code' };
  }

  // Check if active
  if (!shareCode.active) {
    return { valid: false, error: 'Share code has been deactivated' };
  }

  // Check expiration
  if (shareCode.expiresAt && shareCode.expiresAt < new Date()) {
    // Deactivate expired code
    await prisma.routineShareCode.update({
      where: { id: shareCode.id },
      data: { active: false },
    });
    return { valid: false, error: 'Share code has expired' };
  }

  // Check usage limit
  if (shareCode.maxUses && shareCode.useCount >= shareCode.maxUses) {
    return { valid: false, error: 'Share code has reached maximum uses' };
  }

  return {
    valid: true,
    shareCode: {
      id: shareCode.id,
      routineId: shareCode.routineId,
      shareCode: shareCode.shareCode,
      useCount: shareCode.useCount,
      maxUses: shareCode.maxUses,
      expiresAt: shareCode.expiresAt,
    },
  };
}

/**
 * Increment routine share code use count
 */
export async function incrementRoutineShareCodeUseCount(shareCodeId: string): Promise<void> {
  await prisma.routineShareCode.update({
    where: { id: shareCodeId },
    data: {
      useCount: {
        increment: 1,
      },
    },
  });
}

/**
 * Deactivate routine share code
 */
export async function deactivateRoutineShareCode(shareCodeId: string): Promise<void> {
  await prisma.routineShareCode.update({
    where: { id: shareCodeId },
    data: { active: false },
  });
}

/**
 * Get all active share codes for a routine
 */
export async function getShareCodesForRoutine(routineId: string) {
  return prisma.routineShareCode.findMany({
    where: {
      routineId,
      active: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });
}
