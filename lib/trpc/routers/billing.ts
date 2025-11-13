import { router, authorizedProcedure, verifiedProcedure } from '../init';
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
        roleId: z.string().cuid(),
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
        roleId: z.string().cuid(),
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
    .input(z.object({ roleId: z.string().cuid() }))
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
        [Tier.FREE]: 0,
        [Tier.BASIC]: TIER_PRICES[Tier.BASIC] / 100, // Convert cents to dollars
        [Tier.PREMIUM]: TIER_PRICES[Tier.PREMIUM] / 100,
        [Tier.SCHOOL]: TIER_PRICES[Tier.SCHOOL] / 100,
      },
    };
  }),

  /**
   * Get subscription status for a role
   */
  getSubscriptionStatus: authorizedProcedure
    .input(z.object({ roleId: z.string().cuid() }))
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
        throw new Error('Role not found');
      }

      return {
        tier: role.tier,
        subscriptionStatus: role.subscriptionStatus,
        hasActiveSubscription: !!role.stripeSubscriptionId,
      };
    }),
});
