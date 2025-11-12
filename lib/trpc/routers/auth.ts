import { router, publicProcedure, protectedProcedure } from '../init';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { CodeType } from '@prisma/client';
import {
  createVerificationCode,
  verifyCode,
  canResendCode,
  incrementResendCount,
  checkLoginRateLimit,
  recordFailedLogin,
  clearFailedLogins,
} from '@/lib/auth/verification';

export const authRouter = router({
  signUp: publicProcedure
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
        },
      });

      if (error) {
        // Provide user-friendly error messages
        let message = error.message;
        if (error.message.includes('already registered')) {
          message = 'This email is already registered. Please log in instead.';
        } else if (error.message.includes('password')) {
          message = 'Password is too weak. Please use at least 6 characters.';
        } else if (error.message.includes('email')) {
          message = 'Please enter a valid email address.';
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

      // Create user in database
      try {
        await ctx.prisma.user.create({
          data: {
            id: data.user.id,
            email: input.email,
            name: input.name,
          },
        });
      } catch (dbError) {
        // User already exists in DB, that's okay
        console.error('User already exists in database:', dbError);
      }

      return { success: true, userId: data.user.id };
    }),

  signIn: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check rate limiting
      const rateLimit = await checkLoginRateLimit(input.email);
      if (!rateLimit.allowed) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: rateLimit.error || 'Too many failed attempts',
        });
      }

      const { data, error } = await ctx.supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

      if (error) {
        // Record failed attempt
        await recordFailedLogin(input.email);

        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }

      // Clear failed login attempts on successful login
      await clearFailedLogins(input.email);

      return { success: true, userId: data.user.id };
    }),

  signOut: protectedProcedure
    .mutation(async ({ ctx }) => {
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
          roles: true,
        },
      });

      return { user: dbUser };
    }),

  // Email verification endpoints
  sendVerificationCode: publicProcedure
    .input(z.object({
      email: z.string().email(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Find user by email
      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Check if can resend
      const { canResend, error } = await canResendCode(user.id, CodeType.EMAIL_VERIFICATION);
      if (!canResend) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: error || 'Cannot resend yet',
        });
      }

      // Create verification code
      const code = await createVerificationCode(user.id, input.email, CodeType.EMAIL_VERIFICATION);

      // In production, send this via email
      // For now, we'll log it (and return it for development)
      console.log(`Verification code for ${input.email}: ${code}`);

      return { success: true, code }; // Remove 'code' in production
    }),

  verifyEmail: publicProcedure
    .input(z.object({
      email: z.string().email(),
      code: z.string().length(6),
    }))
    .mutation(async ({ ctx, input }) => {
      // Find user by email
      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Verify code
      const result = await verifyCode(user.id, input.code, CodeType.EMAIL_VERIFICATION);

      if (!result.success) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: result.error || 'Invalid code',
        });
      }

      // Update user email verified status
      await ctx.prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });

      return { success: true };
    }),

  resendVerificationCode: publicProcedure
    .input(z.object({
      email: z.string().email(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Find user by email
      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Check if can resend
      const { canResend, error } = await canResendCode(user.id, CodeType.EMAIL_VERIFICATION);
      if (!canResend) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: error || 'Cannot resend yet',
        });
      }

      // Increment resend count
      await incrementResendCount(user.id, CodeType.EMAIL_VERIFICATION);

      // Create new verification code
      const code = await createVerificationCode(user.id, input.email, CodeType.EMAIL_VERIFICATION);

      // In production, send this via email
      console.log(`Verification code for ${input.email}: ${code}`);

      return { success: true, code }; // Remove 'code' in production
    }),

  // Password reset endpoints
  requestPasswordReset: publicProcedure
    .input(z.object({
      email: z.string().email(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Find user by email
      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (!user) {
        // Don't reveal if user exists
        return { success: true };
      }

      // Check if can resend
      const { canResend, error } = await canResendCode(user.id, CodeType.PASSWORD_RESET);
      if (!canResend) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: error || 'Cannot request reset yet',
        });
      }

      // Create reset code
      const code = await createVerificationCode(user.id, input.email, CodeType.PASSWORD_RESET);

      // In production, send this via email
      console.log(`Password reset code for ${input.email}: ${code}`);

      return { success: true, code }; // Remove 'code' in production
    }),

  verifyPasswordResetCode: publicProcedure
    .input(z.object({
      email: z.string().email(),
      code: z.string().length(6),
    }))
    .mutation(async ({ ctx, input }) => {
      // Find user by email
      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Verify code (but don't mark as used yet)
      const record = await ctx.prisma.verificationCode.findFirst({
        where: {
          userId: user.id,
          type: CodeType.PASSWORD_RESET,
          status: 'PENDING',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (!record || record.code !== input.code) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid code',
        });
      }

      if (record.expiresAt < new Date()) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Code has expired',
        });
      }

      return { success: true, userId: user.id };
    }),

  resetPassword: publicProcedure
    .input(z.object({
      email: z.string().email(),
      code: z.string().length(6),
      newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    }))
    .mutation(async ({ ctx, input }) => {
      // Find user by email
      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Verify code
      const result = await verifyCode(user.id, input.code, CodeType.PASSWORD_RESET);

      if (!result.success) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: result.error || 'Invalid code',
        });
      }

      // Update password in Supabase (requires admin client)
      // For now, we'll use the user's session
      const { error } = await ctx.supabase.auth.updateUser({
        password: input.newPassword,
      });

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to reset password',
        });
      }

      return { success: true };
    }),
});
