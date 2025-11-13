'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, CreditCard } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import { TierBadge } from './TierBadge';

interface BillingPortalProps {
  roleId: string;
}

export function BillingPortal({ roleId }: BillingPortalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const { data: tierData } = trpc.billing.getCurrentTier.useQuery({ roleId });
  const { data: subscriptionData } = trpc.billing.getSubscriptionStatus.useQuery({ roleId });

  const portalMutation = trpc.billing.createPortal.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to open billing portal',
        variant: 'destructive',
      });
      setIsLoading(false);
    },
  });

  const handlePortal = () => {
    setIsLoading(true);
    const baseUrl = window.location.origin;
    portalMutation.mutate({
      roleId,
      returnUrl: `${baseUrl}/billing`,
    });
  };

  if (!tierData || !subscriptionData) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">Loading subscription details...</div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Current Plan */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-900">Current Plan</h3>
          <div className="flex items-center gap-3">
            <TierBadge tier={tierData.tier} />
            {subscriptionData.hasActiveSubscription && (
              <Badge variant="outline" className="border-green-500 text-green-700">
                Active
              </Badge>
            )}
          </div>
        </div>

        {/* Subscription Status */}
        {subscriptionData.hasActiveSubscription && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Subscription Status</h4>
            <div className="text-sm text-gray-600">
              <div className="flex justify-between py-2 border-b">
                <span>Status:</span>
                <span className="font-medium capitalize">
                  {subscriptionData.subscriptionStatus || 'Active'}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span>Billing Cycle:</span>
                <span className="font-medium">Monthly</span>
              </div>
            </div>
          </div>
        )}

        {/* Manage Subscription */}
        {subscriptionData.hasActiveSubscription && (
          <div>
            <Button
              onClick={handlePortal}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              <Settings className="h-4 w-4 mr-2" />
              {isLoading ? 'Opening Portal...' : 'Manage Subscription'}
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              Update payment method, view invoices, or cancel subscription
            </p>
          </div>
        )}

        {/* Free Plan Message */}
        {!subscriptionData.hasActiveSubscription && tierData.tier === 'FREE' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 mb-1">
                  Ready to unlock more features?
                </h4>
                <p className="text-sm text-blue-700">
                  Upgrade to a paid plan to access smart routines, analytics, marketplace, and
                  more.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
