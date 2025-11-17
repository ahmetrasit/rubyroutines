import { initTRPC, TRPCError } from '@trpc/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import superjson from 'superjson';

export async function createTRPCContext(opts?: {
  req?: Request;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Extract request metadata if available
  let ipAddress: string | undefined;
  let userAgent: string | undefined;

  if (opts?.req) {
    // Try to get IP address from various headers (common proxy headers)
    ipAddress = opts.req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
                opts.req.headers.get('x-real-ip') ||
                opts.req.headers.get('x-client-ip') ||
                undefined;

    // Get user agent
    userAgent = opts.req.headers.get('user-agent') || undefined;
  }

  return {
    prisma,
    supabase,
    user,
    ipAddress,
    userAgent,
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

// Import authorization helper functions from middleware
import {
  verifyRoleOwnership,
  verifyPersonOwnership,
  verifyRoutineOwnership,
  verifyTaskOwnership,
  verifyGoalOwnership,
  verifyAdminStatus,
  verifyTaskAccess,
} from './middleware/auth';

/**
 * Middleware that automatically checks role ownership
 * Usage: .input(z.object({ roleId: z.string().cuid(), ... }))
 */
export const authorizedProcedure = protectedProcedure.use(async (opts) => {
  const { ctx, input } = opts;

  // Check if input has roleId
  if (input && typeof input === 'object' && 'roleId' in input) {
    await verifyRoleOwnership(ctx.user.id, (input as any).roleId, ctx.prisma);
  }

  return opts.next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

/**
 * Admin-only procedure
 * Only allows requests from users with isAdmin = true
 */
export const adminProcedure = protectedProcedure.use(async (opts) => {
  const { ctx } = opts;

  await verifyAdminStatus(ctx.user.id, ctx.prisma);

  return opts.next({
    ctx: {
      ...ctx,
      user: ctx.user,
      isAdmin: true,
    },
  });
});

// Re-export authorization helper functions
export {
  verifyRoleOwnership,
  verifyPersonOwnership,
  verifyRoutineOwnership,
  verifyTaskOwnership,
  verifyGoalOwnership,
  verifyTaskAccess,
};
