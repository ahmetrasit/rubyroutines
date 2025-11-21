'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { PricingTable } from '@/components/billing/PricingTable';
import { BillingPortal } from '@/components/billing/BillingPortal';
import { CheckoutButton } from '@/components/billing/CheckoutButton';
import { useToast } from '@/components/ui/toast';

export default function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { data: session, isLoading: sessionLoading } = trpc.auth.getSession.useQuery();

  // Handle success/cancel from Stripe
  useEffect(() => {
    if (searchParams?.get('success') === 'true') {
      toast({
        title: 'Success',
        description: 'Your subscription has been activated!',
        variant: 'success',
      });
      router.replace('/billing');
    } else if (searchParams?.get('canceled') === 'true') {
      toast({
        title: 'Canceled',
        description: 'Checkout was canceled',
        variant: 'default',
      });
      router.replace('/billing');
    }
  }, [searchParams, toast]); // router removed - it's stable and doesn't need to be a dependency

  useEffect(() => {
    if (!sessionLoading && !session?.user) {
      router.push('/login');
    }
  }, [sessionLoading, session]); // router removed - it's stable and doesn't need to be a dependency

  if (sessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const parentRole = session.user.roles?.find((role: any) => role.type === 'PARENT');
  const teacherRole = session.user.roles?.find((role: any) => role.type === 'TEACHER');
  const activeRole = parentRole || teacherRole;

  if (!activeRole) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">No Role Found</h1>
          <p className="text-gray-600">Please contact support.</p>
        </div>
      </div>
    );
  }

  return <BillingPageContent roleId={activeRole.id} />;
}

interface BillingPageContentProps {
  roleId: string;
}

function BillingPageContent({ roleId }: BillingPageContentProps) {
  const { data: tierData, isLoading: tierLoading } = trpc.billing.getCurrentTier.useQuery(
    {
      roleId,
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes - billing data rarely changes
      cacheTime: 10 * 60 * 1000, // 10 minutes cache
      refetchOnWindowFocus: false,
    }
  );

  const handleUpgrade = (tier: string) => {
    // The CheckoutButton component will handle the actual upgrade
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-gray-600 mt-2">
            Manage your subscription and view available plans
          </p>
        </div>

        {/* Current Subscription */}
        <div className="mb-8">
          <BillingPortal roleId={roleId} />
        </div>

        {/* Pricing Table */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Plans</h2>
          {tierLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading plans...</p>
            </div>
          ) : (
            <PricingTable
              currentTier={tierData?.tier || 'FREE'}
              onUpgrade={handleUpgrade}
              isLoading={false}
            />
          )}
        </div>

        {/* Info Panels */}
        <div className="space-y-6">
          {/* FAQ */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="font-semibold text-lg text-gray-900 mb-4">
              Frequently Asked Questions
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">
                  Can I cancel my subscription anytime?
                </h4>
                <p className="text-sm text-gray-600">
                  Yes, you can cancel your subscription at any time through the billing portal.
                  Your plan will remain active until the end of your current billing period.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">
                  What happens to my data if I downgrade?
                </h4>
                <p className="text-sm text-gray-600">
                  Your data is always safe. If you exceed the limits of a lower tier, you'll be
                  prompted to remove excess items before downgrading.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">
                  Do you offer educational discounts?
                </h4>
                <p className="text-sm text-gray-600">
                  Yes! The SCHOOL tier is designed specifically for educators and institutions.
                  Contact us for bulk pricing options.
                </p>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="font-semibold text-green-900 mb-2">Secure Payments</h3>
            <p className="text-sm text-green-700">
              All payments are processed securely through Stripe. We never store your credit card
              information on our servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
