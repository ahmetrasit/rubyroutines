import { router, publicProcedure, protectedProcedure } from '../init';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
  createVerificationCode,
  verifyCode,
  canResendCode,
  incrementResendCount,
  checkLoginRateLimit,
  recordFailedLogin,
  clearFailedLogins,
} from '@/lib/auth/verification';
import { CodeType } from '@/lib/types/prisma-enums';
import { logger } from '@/lib/utils/logger';
import {
  authRateLimitedProcedure,
  verificationRateLimitedProcedure,
} from '../middleware/ratelimit';
import {
  logAuthEvent,
  AUDIT_ACTIONS,
} from '@/lib/services/audit-log';
import { createDefaultRoles, ensureUserHasRoles } from '@/lib/services/user-initialization.service';
import {
  verifyTwoFactorToken,
  verifyBackupCode,
  decryptTwoFactorData,
} from '@/lib/services/two-factor';
import { createAuditLog } from '@/lib/services/audit-log';

export const authRouter = router({
  signUp: authRateLimitedProcedure
    .input(z.object({
      email: z.string().email('Please enter a valid email address'),
      password: z.string().min(6, 'Password must be at least 6 characters'),
      name: z.string().min(2, 'Name must be at least 2 characters'),
    }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            name: input.name,
          },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        },
      });

      if (error) {
        // Provide user-friendly error messages
        let message = error.message;
        if (error.message.includes('already registered') || error.message.includes('User already registered')) {
          message = 'This email is already registered. Please log in instead.';
        } else if (error.message.includes('password')) {
          message = 'Password is too weak. Please use at least 6 characters.';
        } else if (error.message.includes('invalid') && error.message.includes('email')) {
          message = 'This email format is not accepted. Please use a real email address from a common provider (Gmail, Outlook, Yahoo, etc.). Test/temporary email addresses are not allowed.';
        } else if (error.message.includes('email')) {
          message = 'Invalid email address. Please use a valid email from a real email provider.';
        }

        throw new TRPCError({
          code: 'BAD_REQUEST',
          message,
        });
      }

      if (!data.user) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create account. Please try again.',
        });
      }

      // Check for existing user with different ID (seed data migration)
      const existingUserByEmail = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existingUserByEmail && existingUserByEmail.id !== data.user.id) {
        logger.debug('User exists with different ID, migrating to new Supabase ID', {
          oldId: existingUserByEmail.id,
          newId: data.user.id,
          email: input.email,
        });

        await ctx.prisma.user.delete({
          where: { id: existingUserByEmail.id },
        });
      }

      // Create user with default roles, persons, and routines in a transaction
      const userId = data.user.id;
      try {
        await ctx.prisma.$transaction(async (tx) => {
          // Create the user
          await tx.user.create({
            data: {
              id: userId,
              email: input.email,
              name: input.name,
            },
          });

          // Create default roles, persons, and routines
          await createDefaultRoles({
            userId: userId,
            name: input.name,
            prisma: tx, // Pass transaction context
          });
        });

        logger.info('Successfully created user with default data', {
          userId: userId,
          email: input.email
        });
      } catch (dbError) {
        // User might already exist - ensure they have roles
        logger.debug('User creation failed, checking if user exists', {
          userId: data.user.id,
          error: dbError
        });

        // Check if user exists
        const existingUser = await ctx.prisma.user.findUnique({
          where: { id: data.user.id }
        });

        if (existingUser) {
          // User exists, ensure they have roles
          await ensureUserHasRoles(data.user.id, existingUser.name || input.name, ctx.prisma);
        } else {
          // Something went wrong, re-throw the error
          logger.error('Failed to create user and default data', {
            userId: data.user.id,
            error: dbError
          });
          throw dbError;
        }
      }

      // Log successful signup
      await logAuthEvent(AUDIT_ACTIONS.AUTH_SIGNUP, data.user.id, true, {
        email: input.email,
      });

      return { success: true, userId: data.user.id };
    }),

  signIn: authRateLimitedProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check rate limiting for failed login attempts
      const rateLimitCheck = await checkLoginRateLimit(input.email);
      if (!rateLimitCheck.allowed) {
        logger.warn('Login blocked due to rate limit', { email: input.email });

        await logAuthEvent(AUDIT_ACTIONS.AUTH_FAILED_LOGIN, 'anonymous', false, {
          email: input.email,
          errorMessage: 'Account temporarily locked',
        });

        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: rateLimitCheck.error || 'Account temporarily locked due to too many failed attempts. Please try again later.',
        });
      }

      const { data, error } = await ctx.supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

      if (error) {
        logger.warn('Failed login attempt', { email: input.email, error: error.message });

        // Record failed login attempt
        await recordFailedLogin(input.email);

        await logAuthEvent(AUDIT_ACTIONS.AUTH_FAILED_LOGIN, 'anonymous', false, {
          email: input.email,
          errorMessage: error.message,
        });

        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }

      // Clear failed login attempts on successful authentication
      await clearFailedLogins(input.email);

      // Check if user has 2FA enabled or is banned
      const dbUserFor2FA = await ctx.prisma.user.findUnique({
        where: { id: data.user.id },
        select: { twoFactorEnabled: true, bannedAt: true },
      });

      // Check if user is banned
      if (dbUserFor2FA?.bannedAt) {
        await ctx.supabase.auth.signOut();
        logger.warn('Banned user attempted to login', { email: input.email });

        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Your account has been suspended. Please contact support.',
        });
      }

      if (dbUserFor2FA?.twoFactorEnabled) {
        // User has 2FA enabled - sign them out and require 2FA verification
        await ctx.supabase.auth.signOut();

        logger.info('2FA required for login', { email: input.email });

        return {
          success: false,
          requiresTwoFactor: true,
          userId: data.user.id,
        };
      }

      // Check for seed data migration
      const existingUserByEmail = await ctx.prisma.user.findUnique({
        where: { email: data.user.email! },
        include: { roles: true },
      });

      if (existingUserByEmail && existingUserByEmail.id !== data.user.id) {
        // Migrate from seed data ID to Supabase Auth ID
        const existingRoles = existingUserByEmail.roles;

        await ctx.prisma.user.delete({
          where: { id: existingUserByEmail.id },
        });

        // Create user with migrated roles
        await ctx.prisma.user.create({
          data: {
            id: data.user.id,
            email: data.user.email!,
            name: existingUserByEmail.name,
            emailVerified: data.user.email_confirmed_at ? new Date(data.user.email_confirmed_at) : null,
            roles: {
              create: existingRoles.map((role) => ({
                type: role.type,
                tier: role.tier,
                color: role.color || (
                  role.type === 'PARENT' ? '#9333ea' :
                  role.type === 'TEACHER' ? '#3b82f6' :
                  role.type === 'PRINCIPAL' ? '#f59e0b' : '#10b981'
                ),
              })),
            },
          },
        });

        // Ensure migrated user has default persons, routines, and groups for their roles
        await ensureUserHasRoles(data.user.id, existingUserByEmail.name || data.user.user_metadata?.name || data.user.email!.split('@')[0], ctx.prisma);
      } else {
        // Normal flow - upsert user
        const user = await ctx.prisma.user.upsert({
          where: { id: data.user.id },
          update: {
            email: data.user.email!,
            emailVerified: data.user.email_confirmed_at ? new Date(data.user.email_confirmed_at) : null,
          },
          create: {
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.name || data.user.email!.split('@')[0],
            emailVerified: data.user.email_confirmed_at ? new Date(data.user.email_confirmed_at) : null,
          },
        });

        // Ensure user has both PARENT and TEACHER roles with default data
        await ensureUserHasRoles(user.id, user.name || data.user.user_metadata?.name || data.user.email!.split('@')[0], ctx.prisma);
      }

      // Log successful login
      await logAuthEvent(AUDIT_ACTIONS.AUTH_LOGIN, data.user.id, true, {
        email: input.email,
      });

      return { success: true, userId: data.user.id };
    }),

  signOut: protectedProcedure
    .mutation(async ({ ctx }) => {
      await logAuthEvent(AUDIT_ACTIONS.AUTH_LOGOUT, ctx.user.id, true);
      await ctx.supabase.auth.signOut();
      return { success: true };
    }),

  getSession: publicProcedure
    .query(async ({ ctx }) => {
      const { data: { user } } = await ctx.supabase.auth.getUser();

      if (!user) {
        return { user: null };
      }

      const dbUser = await ctx.prisma.user.findUnique({
        where: { id: user.id },
        include: {
          roles: {
            where: {
              deletedAt: null, // Only include active roles
            },
          },
        },
      });

      // Fetch effective tier limits for each role
      if (dbUser && dbUser.roles) {
        const { getEffectiveTierLimits } = await import('@/lib/services/admin/system-settings.service');
        const { mapDatabaseLimitsToComponentFormat } = await import('@/lib/services/tier-limits');

        const rolesWithLimits = await Promise.all(
          dbUser.roles.map(async (role) => {
            try {
              const dbLimits = await getEffectiveTierLimits(role.id);
              const effectiveLimits = mapDatabaseLimitsToComponentFormat(dbLimits as any, role.type as any);
              return {
                ...role,
                effectiveLimits,
              };
            } catch (error) {
              logger.warn(`Failed to fetch tier limits for role ${role.id}:`, error as any);
              return {
                ...role,
                effectiveLimits: null,
              };
            }
          })
        );

        return {
          user: {
            ...dbUser,
            roles: rolesWithLimits,
          },
        };
      }

      return { user: dbUser };
    }),

  sendVerificationCode: publicProcedure
    .input(z.object({
      userId: z.string(),
      email: z.string().email(),
    }))
    .mutation(async ({ ctx, input }) => {
      const code = await createVerificationCode(
        input.userId,
        input.email,
        CodeType.EMAIL_VERIFICATION
      );

      // Send verification email
      const { sendVerificationEmail } = await import('@/lib/email/email.service');
      const emailSent = await sendVerificationEmail(input.email, code);

      if (!emailSent) {
        // Log the code in development mode for testing
        if (process.env.NODE_ENV === 'development') {
          logger.debug('Verification code generated (email not sent)', { email: input.email, code });
        }
      }

      return { success: true };
    }),

  verifyEmailCode: verificationRateLimitedProcedure
    .input(z.object({
      userId: z.string(),
      code: z.string().length(6),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await verifyCode(
        input.userId,
        input.code,
        CodeType.EMAIL_VERIFICATION
      );

      if (!result.success) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: result.error || 'Invalid code',
        });
      }

      // Update user's emailVerified status
      await ctx.prisma.user.update({
        where: { id: input.userId },
        data: { emailVerified: new Date() },
      });

      // Update Supabase user metadata
      await ctx.supabase.auth.updateUser({
        data: {
          emailVerified: true,
        },
      });

      await logAuthEvent(AUDIT_ACTIONS.EMAIL_VERIFY, input.userId, true);

      return { success: true };
    }),

  resendVerificationCode: verificationRateLimitedProcedure
    .input(z.object({
      userId: z.string(),
      email: z.string().email(),
    }))
    .mutation(async ({ ctx, input }) => {
      const canResend = await canResendCode(
        input.userId,
        CodeType.EMAIL_VERIFICATION
      );

      if (!canResend.canResend) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: canResend.error || 'Cannot resend code at this time',
        });
      }

      await incrementResendCount(input.userId, CodeType.EMAIL_VERIFICATION);

      const code = await createVerificationCode(
        input.userId,
        input.email,
        CodeType.EMAIL_VERIFICATION
      );

      // Send verification email
      const { sendVerificationEmail } = await import('@/lib/email/email.service');
      const emailSent = await sendVerificationEmail(input.email, code);

      if (!emailSent) {
        // Log the code in development mode for testing
        if (process.env.NODE_ENV === 'development') {
          logger.debug('Verification code resent (email not sent)', { email: input.email, code });
        }
      }

      return { success: true };
    }),

  // Complete login with 2FA verification
  verifyTwoFactorLogin: authRateLimitedProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
      token: z.string().min(6),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check rate limiting for failed login attempts
      const rateLimitCheck = await checkLoginRateLimit(input.email);
      if (!rateLimitCheck.allowed) {
        logger.warn('Login blocked due to rate limit', { email: input.email });

        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: rateLimitCheck.error || 'Account temporarily locked due to too many failed attempts. Please try again later.',
        });
      }

      // First authenticate with password
      const { data, error } = await ctx.supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

      if (error) {
        logger.warn('Failed 2FA login attempt - invalid password', { email: input.email });
        await recordFailedLogin(input.email);

        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }

      // Verify user has 2FA enabled and get their secret
      const user = await ctx.prisma.user.findUnique({
        where: { id: data.user.id },
        select: {
          twoFactorEnabled: true,
          twoFactorSecret: true,
          twoFactorBackupCodes: true,
        },
      });

      if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
        // 2FA not actually enabled, complete login normally
        await clearFailedLogins(input.email);
        await logAuthEvent(AUDIT_ACTIONS.AUTH_LOGIN, data.user.id, true, {
          email: input.email,
        });
        return { success: true, userId: data.user.id };
      }

      // Verify the TOTP token
      let isValid = false;
      let usedBackupCode = false;

      try {
        const secret = decryptTwoFactorData(user.twoFactorSecret);
        isValid = verifyTwoFactorToken(secret, input.token);
      } catch (err) {
        logger.error('Failed to verify 2FA token', { error: err });
      }

      // If token verification failed, try backup code
      if (!isValid && user.twoFactorBackupCodes && user.twoFactorBackupCodes.length > 0) {
        const encryptedCodes = user.twoFactorBackupCodes[0];
        if (encryptedCodes) {
          try {
            const hashedCodes: string[] = JSON.parse(decryptTwoFactorData(encryptedCodes));

            const matchIndex = hashedCodes.findIndex((hashedCode) =>
              verifyBackupCode(input.token, hashedCode)
            );

            if (matchIndex !== -1) {
              isValid = true;
              usedBackupCode = true;

              // Remove used backup code
              hashedCodes.splice(matchIndex, 1);
              const { encryptTwoFactorData } = await import('@/lib/services/two-factor');
              const updatedEncryptedCodes = encryptTwoFactorData(JSON.stringify(hashedCodes));

              await ctx.prisma.user.update({
                where: { id: data.user.id },
                data: {
                  twoFactorBackupCodes: [updatedEncryptedCodes],
                },
              });
            }
          } catch (err) {
            logger.error('Failed to verify backup code', { error: err });
          }
        }
      }

      if (!isValid) {
        // Invalid 2FA token - sign out and record failed attempt
        await ctx.supabase.auth.signOut();
        await recordFailedLogin(input.email);

        await createAuditLog({
          userId: data.user.id,
          action: AUDIT_ACTIONS.AUTH_2FA_VERIFY_FAILED,
          changes: { reason: 'Invalid token during login' },
        });

        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid verification code',
        });
      }

      // Clear failed login attempts on successful 2FA verification
      await clearFailedLogins(input.email);

      // Log successful 2FA verification
      await createAuditLog({
        userId: data.user.id,
        action: AUDIT_ACTIONS.AUTH_2FA_VERIFIED,
        changes: { usedBackupCode, context: 'login' },
      });

      // Complete the login flow - handle user sync
      const existingUserByEmail = await ctx.prisma.user.findUnique({
        where: { email: data.user.email! },
        include: { roles: true },
      });

      if (existingUserByEmail && existingUserByEmail.id !== data.user.id) {
        // Migrate from seed data ID to Supabase Auth ID
        const existingRoles = existingUserByEmail.roles;

        await ctx.prisma.user.delete({
          where: { id: existingUserByEmail.id },
        });

        await ctx.prisma.user.create({
          data: {
            id: data.user.id,
            email: data.user.email!,
            name: existingUserByEmail.name,
            emailVerified: data.user.email_confirmed_at ? new Date(data.user.email_confirmed_at) : null,
            roles: {
              create: existingRoles.map((role) => ({
                type: role.type,
                tier: role.tier,
                color: role.color || (
                  role.type === 'PARENT' ? '#9333ea' :
                  role.type === 'TEACHER' ? '#3b82f6' :
                  role.type === 'PRINCIPAL' ? '#f59e0b' : '#10b981'
                ),
              })),
            },
          },
        });

        await ensureUserHasRoles(data.user.id, existingUserByEmail.name || data.user.user_metadata?.name || data.user.email!.split('@')[0], ctx.prisma);
      } else {
        const syncedUser = await ctx.prisma.user.upsert({
          where: { id: data.user.id },
          update: {
            email: data.user.email!,
            emailVerified: data.user.email_confirmed_at ? new Date(data.user.email_confirmed_at) : null,
          },
          create: {
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.name || data.user.email!.split('@')[0],
            emailVerified: data.user.email_confirmed_at ? new Date(data.user.email_confirmed_at) : null,
          },
        });

        await ensureUserHasRoles(syncedUser.id, syncedUser.name || data.user.user_metadata?.name || data.user.email!.split('@')[0], ctx.prisma);
      }

      await logAuthEvent(AUDIT_ACTIONS.AUTH_LOGIN, data.user.id, true, {
        email: input.email,
      });

      return { success: true, userId: data.user.id, usedBackupCode };
    }),

  // Request password reset email
  requestPasswordReset: authRateLimitedProcedure
    .input(z.object({
      email: z.string().email(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase.auth.resetPasswordForEmail(input.email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password/confirm`,
      });

      if (error) {
        logger.warn('Password reset request failed', { email: input.email, error: error.message });
        // Don't reveal if email exists or not for security
      }

      // Always return success to prevent email enumeration
      logger.info('Password reset requested', { email: input.email });

      return { success: true };
    }),
});
