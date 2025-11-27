'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';

interface CheckoutButtonProps {
  roleId: string;
  tier: 'BRONZE' | 'GOLD' | 'PRO';
  label?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function CheckoutButton({
  roleId,
  tier,
  label = 'Upgrade',
  className,
  variant = 'default',
  size = 'md',
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const checkoutMutation = trpc.billing.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create checkout session',
        variant: 'destructive',
      });
      setIsLoading(false);
    },
  });

  const handleCheckout = () => {
    setIsLoading(true);
    const baseUrl = window.location.origin;
    checkoutMutation.mutate({
      roleId,
      tier: tier as any,
      successUrl: `${baseUrl}/billing?success=true`,
      cancelUrl: `${baseUrl}/billing?canceled=true`,
    });
  };

  return (
    <Button
      onClick={handleCheckout}
      disabled={isLoading}
      className={className}
      variant={variant}
      size={size}
    >
      <CreditCard className="h-4 w-4 mr-2" />
      {isLoading ? 'Processing...' : label}
    </Button>
  );
}
