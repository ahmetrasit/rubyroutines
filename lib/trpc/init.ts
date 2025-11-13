import { initTRPC, TRPCError } from '@trpc/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import superjson from 'superjson';

export async function createTRPCContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return {
    prisma,
    supabase,
    user,
  };
}

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async (opts) => {
  const { ctx } = opts;
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return opts.next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

/**
 * Procedure that requires email verification for sensitive operations
 * Use this for: billing, sharing/invitations, marketplace publishing
 */
export const verifiedProcedure = protectedProcedure.use(async (opts) => {
  const { ctx } = opts;

  // Get user from database to check email verification status
  const user = await ctx.prisma.user.findUnique({
    where: { id: ctx.user.id },
    select: { emailVerified: true },
  });

  if (!user?.emailVerified) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Email verification required for this operation. Please verify your email address.',
    });
  }

  return opts.next({
    ctx,
  });
});

// Re-export authorization utilities from middleware
export { authorizedProcedure } from './middleware/auth';
export {
  verifyRoleOwnership,
  verifyPersonOwnership,
  verifyRoutineOwnership,
  verifyTaskOwnership,
  verifyGoalOwnership,
} from './middleware/auth';
