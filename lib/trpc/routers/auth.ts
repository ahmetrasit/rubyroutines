import { router, publicProcedure, protectedProcedure } from '../init';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

export const authRouter = router({
  signUp: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(2),
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
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message,
        });
      }

      if (!data.user) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create user',
        });
      }

      // Create user in database
      await ctx.prisma.user.create({
        data: {
          id: data.user.id,
          email: input.email,
          name: input.name,
        },
      });

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
