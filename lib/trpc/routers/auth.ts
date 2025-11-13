import { router, publicProcedure, protectedProcedure } from '../init';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
  createVerificationCode,
  verifyCode,
  canResendCode,
  incrementResendCount
} from '@/lib/auth/verification';
import { CodeType } from '@prisma/client';

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
          emailRedirectTo: undefined, // Disable email confirmation for local development
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

      // Create user in database
      try {
        const newUser = await ctx.prisma.user.create({
          data: {
            id: data.user.id,
            email: input.email,
            name: input.name,
            roles: {
              create: {
                type: 'PARENT',
                tier: 'FREE',
              },
            },
          },
          include: {
            roles: true,
          },
        });

        // Auto-create "Me" person for the parent role
        if (newUser.roles.length > 0) {
          const parentRole = newUser.roles[0];
          await ctx.prisma.person.create({
            data: {
              roleId: parentRole.id,
              name: 'Me',
              avatar: JSON.stringify({
                color: '#BAE1FF', // Light blue
                emoji: '👤',
              }),
              status: 'ACTIVE',
            },
          });
        }
      } catch (dbError) {
        // User already exists in DB, ensure they have a role
        console.error('User already exists in database:', dbError);

        // Check if user has any roles, create PARENT role if not
        const existingUser = await ctx.prisma.user.findUnique({
          where: { id: data.user.id },
          include: { roles: true },
        });

        if (existingUser && existingUser.roles.length === 0) {
          const newRole = await ctx.prisma.role.create({
            data: {
              userId: data.user.id,
              type: 'PARENT',
              tier: 'FREE',
            },
          });

          // Auto-create "Me" person
          await ctx.prisma.person.create({
            data: {
              roleId: newRole.id,
              name: 'Me',
              avatar: JSON.stringify({
                color: '#BAE1FF',
                emoji: '👤',
              }),
              status: 'ACTIVE',
            },
          });
        }
      }

      return { success: true, userId: data.user.id };
    }),

  signIn: publicProcedure
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
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }

      // Check if user exists by email with different ID (seed data scenario)
      const existingUserByEmail = await ctx.prisma.user.findUnique({
        where: { email: data.user.email! },
        include: { roles: true },
      });

      let user;

      if (existingUserByEmail && existingUserByEmail.id !== data.user.id) {
        // User exists from seed data with different ID
        // Migrate roles to new Supabase Auth ID
        const existingRoles = existingUserByEmail.roles;

        // Delete old user (cascade will delete associated records)
        await ctx.prisma.user.delete({
          where: { id: existingUserByEmail.id },
        });

        // Create new user with Supabase Auth ID, preserving data and roles
        user = await ctx.prisma.user.create({
          data: {
            id: data.user.id,
            email: data.user.email!,
            name: existingUserByEmail.name,
            emailVerified: data.user.email_confirmed_at ? new Date(data.user.email_confirmed_at) : null,
            roles: {
              create: existingRoles.map((role) => ({
                type: role.type,
                tier: role.tier,
              })),
            },
          },
          include: { roles: true },
        });
      } else {
        // Normal upsert - user doesn't exist or has matching ID
        user = await ctx.prisma.user.upsert({
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
          include: {
            roles: true,
          },
        });
      }

      // Auto-create PARENT role for first-time users
      if (user.roles.length === 0) {
        const newRole = await ctx.prisma.role.create({
          data: {
            userId: user.id,
            type: 'PARENT',
            tier: 'FREE',
          },
        });

        // Auto-create "Me" person for new role
        await ctx.prisma.person.create({
          data: {
            roleId: newRole.id,
            name: 'Me',
            avatar: JSON.stringify({
              color: '#BAE1FF',
              emoji: '👤',
            }),
            status: 'ACTIVE',
          },
        });
      } else {
        // Check if "Me" person exists for this role
        const parentRole = user.roles.find((role: any) => role.type === 'PARENT');
        if (parentRole) {
          const mePersonExists = await ctx.prisma.person.findFirst({
            where: {
              roleId: parentRole.id,
              name: 'Me',
            },
          });

          // Create "Me" person if it doesn't exist
          if (!mePersonExists) {
            await ctx.prisma.person.create({
              data: {
                roleId: parentRole.id,
                name: 'Me',
                avatar: JSON.stringify({
                  color: '#BAE1FF',
                  emoji: '👤',
                }),
                status: 'ACTIVE',
              },
            });
          }
        }
      }

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

      // TODO: Send email with code using Resend
      // For development, log the code
      console.log(`Verification code for ${input.email}: ${code}`);

      return { success: true };
    }),

  verifyEmailCode: publicProcedure
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

      return { success: true };
    }),

  resendVerificationCode: publicProcedure
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

      // TODO: Send email with code using Resend
      console.log(`Resent verification code for ${input.email}: ${code}`);

      return { success: true };
    }),
});
