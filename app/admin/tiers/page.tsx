'use client';

import { useState } from 'react';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { ModeSwitcher } from '@/components/mode-switcher';
import { trpc } from '@/lib/trpc/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, DollarSign } from 'lucide-react';
import Link from 'next/link';

export default function AdminTiersPage() {
  return (
    <AdminGuard>
      <ModeSwitcher currentMode="admin" />
      <TiersContent />
    </AdminGuard>
  );
}

function TiersContent() {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const { data: limits, isLoading: limitsLoading } = trpc.adminTiers.getLimits.useQuery();
  const { data: prices, isLoading: pricesLoading } = trpc.adminTiers.getPrices.useQuery();

  const [editedLimits, setEditedLimits] = useState<any>(null);
  const [editedPrices, setEditedPrices] = useState<any>(null);

  const updateLimitsMutation = trpc.adminTiers.updateLimits.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Tier limits updated successfully',
      });
      utils.adminTiers.getLimits.invalidate();
      setEditedLimits(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updatePricesMutation = trpc.adminTiers.updatePrices.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Tier prices updated successfully',
      });
      utils.adminTiers.getPrices.invalidate();
      setEditedPrices(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSaveLimits = () => {
    if (editedLimits) {
      updateLimitsMutation.mutate({ limits: editedLimits });
    }
  };

  const handleSavePrices = () => {
    if (editedPrices) {
      updatePricesMutation.mutate({ prices: editedPrices });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Tier Configuration</h1>
            <p className="text-muted-foreground">Manage system-wide tier limits and pricing</p>
          </div>
          <Link href="/admin">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        {/* Tier Limits */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Tier Limits
            </CardTitle>
            <CardDescription>Configure resource limits for each subscription tier</CardDescription>
          </CardHeader>
          <CardContent>
            {limitsLoading ? (
              <Skeleton className="h-96" />
            ) : limits ? (
              <div className="space-y-6">
                {/* Parent Mode Limits - Purple Box */}
                <div className="border-2 border-purple-300 bg-purple-50 rounded-lg p-6">
                  <h3 className="font-bold mb-6 text-xl text-purple-800 flex items-center gap-2">
                    <span className="w-3 h-3 bg-purple-700 rounded-full"></span>
                    Parent Mode Limits
                  </h3>
                  <div className="space-y-6">
                    {['FREE', 'BRONZE', 'GOLD', 'PRO'].map((tier) => {
                      const tierLimits = limits[tier];
                      if (!tierLimits) return null;
                      return (
                      <div key={`parent-${tier}`} className="bg-white border border-purple-200 rounded-lg p-5">
                        <h4 className="font-semibold mb-4 text-lg text-purple-900 capitalize">{tier.toLowerCase()}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {tierLimits.parent && Object.entries(tierLimits.parent).map(([limitKey, limitValue]: [string, any]) => (
                            <div key={limitKey}>
                              <Label htmlFor={`${tier}-parent-${limitKey}`} className="text-sm">
                                {limitKey.replace(/([A-Z])/g, ' $1').trim()}
                              </Label>
                              <Input
                                id={`${tier}-parent-${limitKey}`}
                                type="number"
                                min="0"
                                value={editedLimits?.[tier]?.parent?.[limitKey] ?? limitValue}
                                onChange={(e) => {
                                  const parsedValue = parseInt(e.target.value);
                                  const value = isNaN(parsedValue) ? 0 : parsedValue;

                                  setEditedLimits((prev: any) => {
                                    const base = prev || JSON.parse(JSON.stringify(limits));
                                    return {
                                      ...base,
                                      [tier]: {
                                        ...base[tier],
                                        parent: {
                                          ...(base[tier]?.parent || {}),
                                          [limitKey]: value,
                                        },
                                        teacher: base[tier]?.teacher || {},
                                      },
                                    };
                                  });
                                }}
                                className="mt-1"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );})}
                  </div>
                </div>

                {/* Teacher Mode Limits - Blue Box */}
                <div className="border-2 border-blue-300 bg-blue-50 rounded-lg p-6">
                  <h3 className="font-bold mb-6 text-xl text-blue-800 flex items-center gap-2">
                    <span className="w-3 h-3 bg-blue-700 rounded-full"></span>
                    Teacher Mode Limits
                  </h3>
                  <div className="space-y-6">
                    {['FREE', 'BRONZE', 'GOLD', 'PRO'].map((tier) => {
                      const tierLimits = limits[tier];
                      if (!tierLimits) return null;
                      return (
                      <div key={`teacher-${tier}`} className="bg-white border border-blue-200 rounded-lg p-5">
                        <h4 className="font-semibold mb-4 text-lg text-blue-900 capitalize">{tier.toLowerCase()}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {tierLimits.teacher && Object.entries(tierLimits.teacher).map(([limitKey, limitValue]: [string, any]) => (
                            <div key={limitKey}>
                              <Label htmlFor={`${tier}-teacher-${limitKey}`} className="text-sm">
                                {limitKey.replace(/([A-Z])/g, ' $1').trim()}
                              </Label>
                              <Input
                                id={`${tier}-teacher-${limitKey}`}
                                type="number"
                                min="0"
                                value={editedLimits?.[tier]?.teacher?.[limitKey] ?? limitValue}
                                onChange={(e) => {
                                  const parsedValue = parseInt(e.target.value);
                                  const value = isNaN(parsedValue) ? 0 : parsedValue;

                                  setEditedLimits((prev: any) => {
                                    const base = prev || JSON.parse(JSON.stringify(limits));
                                    return {
                                      ...base,
                                      [tier]: {
                                        ...base[tier],
                                        parent: base[tier]?.parent || {},
                                        teacher: {
                                          ...(base[tier]?.teacher || {}),
                                          [limitKey]: value,
                                        },
                                      },
                                    };
                                  });
                                }}
                                className="mt-1"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );})}
                  </div>
                </div>

                {editedLimits && (
                  <div className="flex gap-2">
                    <Button onClick={handleSaveLimits} disabled={updateLimitsMutation.isPending}>
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setEditedLimits(null)}>
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Tier Prices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Tier Pricing
            </CardTitle>
            <CardDescription>Configure monthly subscription prices (in cents)</CardDescription>
          </CardHeader>
          <CardContent>
            {pricesLoading ? (
              <Skeleton className="h-48" />
            ) : prices ? (
              <div className="space-y-4">
                {['BRONZE', 'GOLD', 'PRO'].map((tier) => {
                  const price = prices[tier];
                  if (price === undefined) return null;
                  return (
                  <div key={tier} className="flex items-center gap-4">
                    <Label htmlFor={`price-${tier}`} className="w-32 font-semibold capitalize">
                      {tier.toLowerCase()}
                    </Label>
                    <Input
                      id={`price-${tier}`}
                      type="number"
                      min="0"
                      step="100"
                      value={editedPrices?.[tier] ?? price}
                      onChange={(e) => {
                        const parsedValue = parseInt(e.target.value);
                        const value = isNaN(parsedValue) ? 0 : parsedValue;

                        setEditedPrices((prev: any) => ({
                          ...(prev || prices),
                          [tier]: value,
                        }));
                      }}
                      className="w-40"
                    />
                    <span className="text-muted-foreground">
                      = ${((editedPrices?.[tier] ?? price) / 100).toFixed(2)}/month
                    </span>
                  </div>
                );})}
                {editedPrices && (
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSavePrices} disabled={updatePricesMutation.isPending}>
                      Save Prices
                    </Button>
                    <Button variant="outline" onClick={() => setEditedPrices(null)}>
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
