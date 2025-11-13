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
