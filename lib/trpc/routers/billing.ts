import { router, authorizedProcedure, verifiedProcedure } from '../init';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { Tier } from '@/lib/types/prisma-enums';
import {
  createCheckoutSession,
  createBillingPortalSession,
  getCurrentTier,
  TIER_PRICES,
} from '@/lib/services/stripe.service';

export const billingRouter = router({
  /**
   * Create a Stripe checkout session for tier upgrade
   * Requires email verification
   */
  createCheckout: verifiedProcedure
    .input(
      z.object({
        roleId: z.string().uuid(), // Role IDs are UUIDs, not CUIDs
        tier: z.nativeEnum(Tier),
        successUrl: z.string().url(),
        cancelUrl: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      const session = await createCheckoutSession(input);
      return session;
    }),

  /**
   * Create a Stripe billing portal session
   * Requires email verification
   */
  createPortal: verifiedProcedure
    .input(
      z.object({
        roleId: z.string().uuid(), // Role IDs are UUIDs, not CUIDs
        returnUrl: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      const session = await createBillingPortalSession(input);
      return session;
    }),

  /**
   * Get current tier for a role
   */
  getCurrentTier: authorizedProcedure
    .input(z.object({ roleId: z.string().uuid() })) // Role IDs are UUIDs, not CUIDs
    .query(async ({ input }) => {
      const result = await getCurrentTier(input.roleId);
      return result;
    }),

  /**
   * Get tier pricing information
   */
  getTierPricing: authorizedProcedure.query(async () => {
    return {
      prices: {
        [Tier.FREE]: {
          parent: 0,
          teacher: 0,
        },
        [Tier.TINY]: {
          parent: TIER_PRICES[Tier.TINY].PARENT / 100, // Convert cents to dollars
          teacher: TIER_PRICES[Tier.TINY].TEACHER / 100,
        },
        [Tier.SMALL]: {
          parent: TIER_PRICES[Tier.SMALL].PARENT / 100,
          teacher: TIER_PRICES[Tier.SMALL].TEACHER / 100,
        },
        [Tier.MEDIUM]: {
          parent: TIER_PRICES[Tier.MEDIUM].PARENT / 100,
          teacher: TIER_PRICES[Tier.MEDIUM].TEACHER / 100,
        },
        [Tier.LARGE]: {
          parent: TIER_PRICES[Tier.LARGE].PARENT / 100,
          teacher: TIER_PRICES[Tier.LARGE].TEACHER / 100, // Base price (+ per-student for teachers)
        },
      },
    };
  }),

  /**
   * Get subscription status for a role
   */
  getSubscriptionStatus: authorizedProcedure
    .input(z.object({ roleId: z.string().uuid() })) // Role IDs are UUIDs, not CUIDs
    .query(async ({ ctx, input }) => {
      const role = await ctx.prisma.role.findUnique({
        where: { id: input.roleId },
        select: {
          tier: true,
          subscriptionStatus: true,
          stripeCustomerId: true,
          stripeSubscriptionId: true,
        },
      });

      if (!role) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Role not found' });
      }

      return {
        tier: role.tier,
        subscriptionStatus: role.subscriptionStatus,
        hasActiveSubscription: !!role.stripeSubscriptionId,
      };
    }),
});
