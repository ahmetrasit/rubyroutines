import { router, publicProcedure, protectedProcedure } from '../init';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

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
            roles: {
              create: {
                type: 'PARENT',
                tier: 'FREE',
              },
            },
          },
        });
      } catch (dbError) {
        // User already exists in DB, ensure they have a role
        console.error('User already exists in database:', dbError);

        // Check if user has any roles, create PARENT role if not
        const existingUser = await ctx.prisma.user.findUnique({
          where: { id: data.user.id },
          include: { roles: true },
        });

        if (existingUser && existingUser.roles.length === 0) {
          await ctx.prisma.role.create({
            data: {
              userId: data.user.id,
              type: 'PARENT',
              tier: 'FREE',
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
        await ctx.prisma.role.create({
          data: {
            userId: user.id,
            type: 'PARENT',
            tier: 'FREE',
          },
        });
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
});
