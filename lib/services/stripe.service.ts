import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { TRPCError } from '@trpc/server';
import { Tier } from '@/lib/types/prisma-enums';
import { checkTierLimit as checkLimit, getTierLimit } from './tier-limits';

// Allow development without Stripe configured
let stripe: Stripe | null = null;

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-02-24.acacia',
  });
} else if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
  // Only throw error in production runtime (not during build)
  console.warn('Warning: STRIPE_SECRET_KEY not configured. Stripe features will be disabled.');
}

function requireStripe(): Stripe {
  if (!stripe) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.',
    });
  }
  return stripe;
}

// Tier pricing (in cents) - different for parent and teacher modes
// Teacher tiers: FREE (3 students), TINY (7), SMALL (15), MEDIUM (23), LARGE (24+)
export const TIER_PRICES = {
  [Tier.TINY]: {
    PARENT: 199, // $1.99
    TEACHER: 299, // $2.99
  },
  [Tier.SMALL]: {
    PARENT: 399, // $3.99
    TEACHER: 599, // $5.99
  },
  [Tier.MEDIUM]: {
    PARENT: 799, // $7.99
    TEACHER: 999, // $9.99
  },
  [Tier.LARGE]: {
    PARENT: 1299, // $12.99
    TEACHER: 999, // $9.99 base (+ per-student pricing for teachers)
  },
};

// Tier limits (re-exported for convenience)
export { getTierLimit };
export const checkTierLimit = checkLimit;

interface CreateCheckoutSessionParams {
  roleId: string;
  tier: Tier;
  successUrl: string;
  cancelUrl: string;
}

interface CreateBillingPortalSessionParams {
  roleId: string;
  returnUrl: string;
}

/**
 * Create a Stripe checkout session for tier upgrade
 */
export async function createCheckoutSession(params: CreateCheckoutSessionParams) {
  const { roleId, tier, successUrl, cancelUrl } = params;

  if (tier === Tier.FREE) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Cannot create checkout session for FREE tier',
    });
  }

  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: {
      user: true,
    },
  });

  if (!role) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Role not found' });
  }

  // Get price based on role type (parent or teacher)
  const tierPrices = TIER_PRICES[tier];

  if (!tierPrices) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Invalid tier: ${tier}`,
    });
  }

  const priceInCents = tierPrices[role.type as 'PARENT' | 'TEACHER'] || tierPrices.PARENT;

  if (!priceInCents) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Invalid price for tier ${tier} and role type ${role.type}`,
    });
  }

  // Create or retrieve customer
  let customerId = role.stripeCustomerId;

  if (!customerId) {
    const customer = await requireStripe().customers.create({
      email: role.user.email,
      metadata: {
        roleId: role.id,
        userId: role.userId,
      },
    });
    customerId = customer.id;

    await prisma.role.update({
      where: { id: roleId },
      data: { stripeCustomerId: customerId },
    });
  }

  // Create checkout session
  const session = await requireStripe().checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Ruby Routines ${tier} Plan`,
            description: `${tier} tier subscription`,
          },
          recurring: {
            interval: 'month',
          },
          unit_amount: priceInCents,
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      roleId: role.id,
      tier,
    },
  });

  return {
    sessionId: session.id,
    url: session.url,
  };
}

/**
 * Create a Stripe billing portal session for subscription management
 */
export async function createBillingPortalSession(params: CreateBillingPortalSessionParams) {
  const { roleId, returnUrl } = params;

  const role = await prisma.role.findUnique({
    where: { id: roleId },
  });

  if (!role) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Role not found' });
  }

  if (!role.stripeCustomerId) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'No Stripe customer found for this role',
    });
  }

  const session = await requireStripe().billingPortal.sessions.create({
    customer: role.stripeCustomerId,
    return_url: returnUrl,
  });

  return {
    url: session.url,
  };
}

/**
 * Handle Stripe webhook events
 */
export async function handleWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
      break;

    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
      break;

    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;

    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
      break;

    default:
      // Unhandled event type
      break;
  }
}

/**
 * Handle checkout session completed
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const roleId = session.metadata?.roleId;
  const tier = session.metadata?.tier as Tier;

  if (!roleId || !tier) {
    console.error('Missing roleId or tier in checkout session metadata');
    return;
  }

  const subscriptionId = session.subscription as string;

  await prisma.role.update({
    where: { id: roleId },
    data: {
      tier,
      stripeSubscriptionId: subscriptionId,
      subscriptionStatus: 'ACTIVE',
    },
  });
}

/**
 * Handle subscription created
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const role = await prisma.role.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!role) {
    console.error(`No role found for Stripe customer ${customerId}`);
    return;
  }

  await prisma.role.update({
    where: { id: role.id },
    data: {
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status.toUpperCase(),
    },
  });
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const role = await prisma.role.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!role) {
    console.error(`No role found for Stripe customer ${customerId}`);
    return;
  }

  await prisma.role.update({
    where: { id: role.id },
    data: {
      subscriptionStatus: subscription.status.toUpperCase(),
    },
  });
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const role = await prisma.role.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!role) {
    console.error(`No role found for Stripe customer ${customerId}`);
    return;
  }

  // Downgrade to FREE tier
  await prisma.role.update({
    where: { id: role.id },
    data: {
      tier: Tier.FREE,
      stripeSubscriptionId: null,
      subscriptionStatus: 'CANCELED',
    },
  });
}

/**
 * Handle payment failed
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const role = await prisma.role.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!role) {
    console.error(`No role found for Stripe customer ${customerId}`);
    return;
  }

  await prisma.role.update({
    where: { id: role.id },
    data: {
      subscriptionStatus: 'PAYMENT_FAILED',
    },
  });
}

/**
 * Get current tier for a role
 */
export async function getCurrentTier(roleId: string) {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    select: {
      tier: true,
      subscriptionStatus: true,
    },
  });

  if (!role) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Role not found' });
  }

  return {
    tier: role.tier,
    subscriptionStatus: role.subscriptionStatus,
  };
}
