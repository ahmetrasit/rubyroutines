import { prisma } from '@/lib/prisma';
import { CodeType, CodeStatus } from '@/lib/types/prisma-enums';

/**
 * Generate a random 6-digit verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash a verification code (simple hash for codes, not passwords)
 */
export function hashCode(code: string): string {
  // For production, use a proper hashing library like bcrypt
  // For now, we'll store codes in plain text for simplicity
  return code;
}

/**
 * Create a verification code in the database
 */
export async function createVerificationCode(
  userId: string,
  email: string,
  type: CodeType
): Promise<string> {
  // Invalidate any existing codes of this type
  await prisma.verificationCode.updateMany({
    where: {
      userId,
      type,
      status: CodeStatus.PENDING,
    },
    data: {
      status: CodeStatus.EXPIRED,
    },
  });

  // Generate new code
  const code = generateVerificationCode();
  const hashedCode = hashCode(code);

  // Create code record
  await prisma.verificationCode.create({
    data: {
      userId,
      email,
      code: hashedCode,
      type,
      status: CodeStatus.PENDING,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      attemptsLeft: 3,
      resendCount: 0,
    },
  });

  return code;
}

/**
 * Verify a code
 */
export async function verifyCode(
  userId: string,
  code: string,
  type: CodeType
): Promise<{ success: boolean; error?: string }> {
  const hashedCode = hashCode(code);

  const record = await prisma.verificationCode.findFirst({
    where: {
      userId,
      type,
      status: CodeStatus.PENDING,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!record) {
    return { success: false, error: 'No verification code found' };
  }

  if (record.expiresAt < new Date()) {
    await prisma.verificationCode.update({
      where: { id: record.id },
      data: { status: CodeStatus.EXPIRED },
    });
    return { success: false, error: 'Code has expired' };
  }

  if (record.attemptsLeft <= 0) {
    await prisma.verificationCode.update({
      where: { id: record.id },
      data: { status: CodeStatus.EXPIRED },
    });
    return { success: false, error: 'Too many failed attempts' };
  }

  if (record.code !== hashedCode) {
    await prisma.verificationCode.update({
      where: { id: record.id },
      data: { attemptsLeft: record.attemptsLeft - 1 },
    });
    return { success: false, error: 'Invalid code' };
  }

  // Success! Mark as used
  await prisma.verificationCode.update({
    where: { id: record.id },
    data: { status: CodeStatus.USED },
  });

  return { success: true };
}

/**
 * Check if user can resend verification code
 */
export async function canResendCode(
  userId: string,
  type: CodeType
): Promise<{ canResend: boolean; error?: string }> {
  const record = await prisma.verificationCode.findFirst({
    where: {
      userId,
      type,
      status: CodeStatus.PENDING,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!record) {
    return { canResend: true };
  }

  // Check resend limit
  if (record.resendCount >= 3) {
    return { canResend: false, error: 'Maximum resend limit reached' };
  }

  // Check cooldown (60 seconds)
  const cooldownPeriod = 60 * 1000; // 60 seconds
  const timeSinceLastCode = Date.now() - record.createdAt.getTime();

  if (timeSinceLastCode < cooldownPeriod) {
    const secondsLeft = Math.ceil((cooldownPeriod - timeSinceLastCode) / 1000);
    return { canResend: false, error: `Please wait ${secondsLeft} seconds before resending` };
  }

  return { canResend: true };
}

/**
 * Increment resend count
 */
export async function incrementResendCount(userId: string, type: CodeType): Promise<void> {
  const record = await prisma.verificationCode.findFirst({
    where: {
      userId,
      type,
      status: CodeStatus.PENDING,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (record) {
    await prisma.verificationCode.update({
      where: { id: record.id },
      data: { resendCount: record.resendCount + 1 },
    });
  }
}

/**
 * Check rate limiting for failed login attempts
 */
export async function checkLoginRateLimit(
  email: string
): Promise<{ allowed: boolean; error?: string; lockedUntil?: Date }> {
  // For simplicity, we'll store this in the VerificationCode table with a special type
  // In production, you might want a separate RateLimit table

  const lockoutRecord = await prisma.verificationCode.findFirst({
    where: {
      email,
      type: CodeType.LOGIN_ATTEMPT,
      status: CodeStatus.PENDING,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (lockoutRecord) {
    const attemptsUsed = 5 - lockoutRecord.attemptsLeft;

    if (attemptsUsed >= 5) {
      return {
        allowed: false,
        error: 'Account temporarily locked due to too many failed attempts',
        lockedUntil: lockoutRecord.expiresAt,
      };
    }
  }

  return { allowed: true };
}

/**
 * Record failed login attempt
 */
export async function recordFailedLogin(email: string): Promise<void> {
  const existingRecord = await prisma.verificationCode.findFirst({
    where: {
      email,
      type: CodeType.LOGIN_ATTEMPT,
      status: CodeStatus.PENDING,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (existingRecord) {
    const newAttemptsLeft = existingRecord.attemptsLeft - 1;

    await prisma.verificationCode.update({
      where: { id: existingRecord.id },
      data: {
        attemptsLeft: newAttemptsLeft,
        // If all attempts used, extend lockout period
        ...(newAttemptsLeft <= 0 && {
          expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes lockout
        }),
      },
    });
  } else {
    // Create new tracking record
    await prisma.verificationCode.create({
      data: {
        userId: '', // Not tied to a user yet
        email,
        code: '',
        type: CodeType.LOGIN_ATTEMPT,
        status: CodeStatus.PENDING,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour window
        attemptsLeft: 4, // 5 attempts total, 1 already used
        resendCount: 0,
      },
    });
  }
}

/**
 * Clear failed login attempts after successful login
 */
export async function clearFailedLogins(email: string): Promise<void> {
  await prisma.verificationCode.updateMany({
    where: {
      email,
      type: CodeType.LOGIN_ATTEMPT,
      status: CodeStatus.PENDING,
    },
    data: {
      status: CodeStatus.USED,
    },
  });
}
