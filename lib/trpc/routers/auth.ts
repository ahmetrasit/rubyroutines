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
