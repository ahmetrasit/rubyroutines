import { router, publicProcedure, protectedProcedure } from '../init';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
  createVerificationCode,
  verifyCode,
  canResendCode,
  incrementResendCount
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

      // Create user with default roles, persons, and routines
      try {
        await ctx.prisma.user.create({
          data: {
            id: data.user.id,
            email: input.email,
            name: input.name,
          },
        });

        await createDefaultRoles({
          userId: data.user.id,
          name: input.name,
          prisma: ctx.prisma,
        });
      } catch (dbError) {
        // User might already exist - ensure they have roles
        logger.debug('User already exists, ensuring roles', { userId: data.user.id, error: dbError });
        await ensureUserHasRoles(data.user.id, ctx.prisma);
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
      const { data, error } = await ctx.supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

      if (error) {
        logger.warn('Failed login attempt', { email: input.email, error: error.message });

        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
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
        await ensureUserHasRoles(user.id, ctx.prisma);
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
              const effectiveLimits = mapDatabaseLimitsToComponentFormat(dbLimits as any, role.type);
              return {
                ...role,
                effectiveLimits,
              };
            } catch (error) {
              logger.warn(`Failed to fetch tier limits for role ${role.id}:`, error);
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

      // FEATURE: Email service integration pending
      // Configure RESEND_API_KEY in environment to enable email sending
      // See: lib/services/email.service.ts (to be implemented)
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Verification code generated', { email: input.email, code });
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

      // FEATURE: Email service integration pending
      // Configure RESEND_API_KEY in environment to enable email sending
      // See: lib/services/email.service.ts (to be implemented)
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Verification code resent', { email: input.email, code });
      }

      return { success: true };
    }),
});
