/**
 * Two-Factor Authentication tRPC Router
 * Handles 2FA setup, verification, and management
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../init';
import {
  generateTwoFactorSecret,
  generateQRCode,
  verifyTwoFactorToken,
  generateBackupCodes,
  hashBackupCode,
  verifyBackupCode,
  encryptTwoFactorData,
  decryptTwoFactorData,
  areTwoFactorPackagesInstalled,
} from '@/lib/services/two-factor';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/services/audit-log';
import { TRPCError } from '@trpc/server';

export const twoFactorRouter = router({
  /**
   * Check if 2FA packages are installed
   */
  checkPackages: protectedProcedure.query(() => {
    return { installed: areTwoFactorPackagesInstalled() };
  }),

  /**
   * Get current 2FA status
   */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: {
        twoFactorEnabled: true,
      },
    });

    return {
      enabled: user?.twoFactorEnabled || false,
    };
  }),

  /**
   * Setup 2FA - Generate secret and QR code
   */
  setup: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: { email: true, twoFactorEnabled: true },
    });

    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
    }

    if (user.twoFactorEnabled) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: '2FA is already enabled. Disable it first to set up again.',
      });
    }

    // Generate new secret
    const { secret, otpauthUrl } = await generateTwoFactorSecret(user.email);

    // Generate QR code
    const qrCode = await generateQRCode(otpauthUrl);

    // Store encrypted secret temporarily (will be confirmed later)
    // Note: In production, consider storing this in Redis with TTL instead
    const encryptedSecret = encryptTwoFactorData(secret);

    await ctx.prisma.user.update({
      where: { id: ctx.user.id },
      data: {
        twoFactorSecret: encryptedSecret,
      },
    });

    return {
      secret,
      qrCode,
      manualEntryKey: secret,
    };
  }),

  /**
   * Verify and enable 2FA
   */
  enable: protectedProcedure
    .input(
      z.object({
        token: z.string().length(6),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: {
          twoFactorSecret: true,
          twoFactorEnabled: true,
        },
      });

      if (!user?.twoFactorSecret) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No 2FA secret found. Run setup first.',
        });
      }

      if (user.twoFactorEnabled) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '2FA is already enabled',
        });
      }

      // Decrypt secret
      const secret = decryptTwoFactorData(user.twoFactorSecret);

      // Verify token
      const isValid = verifyTwoFactorToken(secret, input.token);

      if (!isValid) {
        await createAuditLog({
          userId: ctx.user.id,
          action: AUDIT_ACTIONS.AUTH_2FA_VERIFY_FAILED,
          changes: { reason: 'Invalid token' },
        });

        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid verification code',
        });
      }

      // Generate backup codes
      const backupCodes = generateBackupCodes(10);
      const hashedBackupCodes = backupCodes.map(hashBackupCode);

      // Encrypt and store backup codes
      const encryptedBackupCodes = encryptTwoFactorData(JSON.stringify(hashedBackupCodes));

      // Enable 2FA
      await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: {
          twoFactorEnabled: true,
          twoFactorBackupCodes: [encryptedBackupCodes],
        },
      });

      await createAuditLog({
        userId: ctx.user.id,
        action: AUDIT_ACTIONS.AUTH_2FA_ENABLED,
        changes: { backupCodesCount: backupCodes.length },
      });

      return {
        success: true,
        backupCodes,
      };
    }),

  /**
   * Disable 2FA
   */
  disable: protectedProcedure
    .input(
      z.object({
        token: z.string().min(6),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: {
          twoFactorSecret: true,
          twoFactorEnabled: true,
          twoFactorBackupCodes: true,
        },
      });

      if (!user?.twoFactorEnabled) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '2FA is not enabled',
        });
      }

      // Verify with token or backup code
      let isValid = false;

      if (user.twoFactorSecret) {
        const secret = decryptTwoFactorData(user.twoFactorSecret);
        isValid = verifyTwoFactorToken(secret, input.token);
      }

      // If token verification failed, try backup code
      if (!isValid && user.twoFactorBackupCodes && user.twoFactorBackupCodes.length > 0) {
        const encryptedCodes = user.twoFactorBackupCodes[0];
        if (encryptedCodes) {
          const hashedCodes = JSON.parse(decryptTwoFactorData(encryptedCodes));

          isValid = hashedCodes.some((hashedCode: string) =>
            verifyBackupCode(input.token, hashedCode)
          );
        }
      }

      if (!isValid) {
        await createAuditLog({
          userId: ctx.user.id,
          action: AUDIT_ACTIONS.AUTH_2FA_DISABLED,
          changes: { reason: 'Invalid token' },
        });

        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid verification code or backup code',
        });
      }

      // Disable 2FA
      await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorBackupCodes: [],
        },
      });

      await createAuditLog({
        userId: ctx.user.id,
        action: AUDIT_ACTIONS.AUTH_2FA_DISABLED,
      });

      return { success: true };
    }),

  /**
   * Verify 2FA token during login
   */
  verify: protectedProcedure
    .input(
      z.object({
        token: z.string().min(6),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: {
          twoFactorSecret: true,
          twoFactorEnabled: true,
          twoFactorBackupCodes: true,
        },
      });

      if (!user?.twoFactorEnabled) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '2FA is not enabled for this user',
        });
      }

      // Try token verification first
      let isValid = false;
      let usedBackupCode = false;

      if (user.twoFactorSecret) {
        const secret = decryptTwoFactorData(user.twoFactorSecret);
        isValid = verifyTwoFactorToken(secret, input.token);
      }

      // If token verification failed, try backup code
      if (!isValid && user.twoFactorBackupCodes && user.twoFactorBackupCodes.length > 0) {
        const encryptedCodes = user.twoFactorBackupCodes[0];
        if (encryptedCodes) {
          const hashedCodes: string[] = JSON.parse(decryptTwoFactorData(encryptedCodes));

          const matchIndex = hashedCodes.findIndex((hashedCode) =>
            verifyBackupCode(input.token, hashedCode)
          );

          if (matchIndex !== -1) {
            isValid = true;
            usedBackupCode = true;

            // Remove used backup code
            hashedCodes.splice(matchIndex, 1);
            const updatedEncryptedCodes = encryptTwoFactorData(JSON.stringify(hashedCodes));

            await ctx.prisma.user.update({
              where: { id: ctx.user.id },
              data: {
                twoFactorBackupCodes: [updatedEncryptedCodes],
              },
            });
          }
        }
      }

      if (!isValid) {
        await createAuditLog({
          userId: ctx.user.id,
          action: AUDIT_ACTIONS.AUTH_2FA_VERIFY_FAILED,
          changes: { reason: 'Invalid token' },
        });

        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid verification code',
        });
      }

      await createAuditLog({
        userId: ctx.user.id,
        action: AUDIT_ACTIONS.AUTH_2FA_VERIFIED,
        changes: { usedBackupCode },
      });

      return {
        success: true,
        usedBackupCode,
      };
    }),

  /**
   * Generate new backup codes (requires current token)
   */
  regenerateBackupCodes: protectedProcedure
    .input(
      z.object({
        token: z.string().length(6),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: {
          twoFactorSecret: true,
          twoFactorEnabled: true,
        },
      });

      if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '2FA is not enabled',
        });
      }

      // Verify token
      const secret = decryptTwoFactorData(user.twoFactorSecret);
      const isValid = verifyTwoFactorToken(secret, input.token);

      if (!isValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid verification code',
        });
      }

      // Generate new backup codes
      const backupCodes = generateBackupCodes(10);
      const hashedBackupCodes = backupCodes.map(hashBackupCode);
      const encryptedBackupCodes = encryptTwoFactorData(JSON.stringify(hashedBackupCodes));

      await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: {
          twoFactorBackupCodes: [encryptedBackupCodes],
        },
      });

      await createAuditLog({
        userId: ctx.user.id,
        action: AUDIT_ACTIONS.SECURITY_2FA_CODES_REGENERATED,
        changes: { backupCodesCount: backupCodes.length },
      });

      return {
        success: true,
        backupCodes,
      };
    }),
});
