'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

interface TierFeatures {
  persons: number;
  groups: number;
  routines: number;
  tasks: number;
  goals: number;
  smartRoutines: boolean;
  analytics: boolean;
  marketplace: boolean;
  coparentAccess: boolean;
  coteacherAccess: boolean;
  support: string;
}

const TIER_FEATURES: Record<string, TierFeatures> = {
  FREE: {
    persons: 3,
    groups: 1,
    routines: 5,
    tasks: 25,
    goals: 3,
    smartRoutines: false,
    analytics: false,
    marketplace: false,
    coparentAccess: false,
    coteacherAccess: false,
    support: 'Community',
  },
  BRONZE: {
    persons: 10,
    groups: 3,
    routines: 20,
    tasks: 100,
    goals: 10,
    smartRoutines: true,
    analytics: true,
    marketplace: true,
    coparentAccess: true,
    coteacherAccess: false,
    support: 'Email',
  },
  GOLD: {
    persons: 25,
    groups: 10,
    routines: 50,
    tasks: 250,
    goals: 25,
    smartRoutines: true,
    analytics: true,
    marketplace: true,
    coparentAccess: true,
    coteacherAccess: true,
    support: 'Priority Email',
  },
  PRO: {
    persons: 100,
    groups: 50,
    routines: 200,
    tasks: 1000,
    goals: 100,
    smartRoutines: true,
    analytics: true,
    marketplace: true,
    coparentAccess: false,
    coteacherAccess: true,
    support: 'Priority + Phone',
  },
};

const TIER_PRICES: Record<string, number> = {
  FREE: 0,
  BRONZE: 5,
  GOLD: 10,
  PRO: 25,
};

interface PricingTableProps {
  currentTier: string;
  onUpgrade: (tier: string) => void;
  isLoading?: boolean;
}

export function PricingTable({ currentTier, onUpgrade, isLoading }: PricingTableProps) {
  const tiers = ['FREE', 'BRONZE', 'GOLD', 'PRO'];

  const renderFeature = (label: string, value: string | number | boolean) => {
    if (typeof value === 'boolean') {
      return (
        <div className="flex items-center gap-2 py-2">
          {value ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <span className="h-4 w-4" />
          )}
          <span className={value ? 'text-gray-700' : 'text-gray-400'}>{label}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 py-2">
        <Check className="h-4 w-4 text-green-500" />
        <span className="text-gray-700">
          {label}: <strong>{value}</strong>
        </span>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {tiers.map((tier) => {
        const features = TIER_FEATURES[tier];
        const price = TIER_PRICES[tier];
        const isCurrent = currentTier === tier;
        const isUpgrade = tiers.indexOf(tier) > tiers.indexOf(currentTier);

        return (
          <Card
            key={tier}
            className={`p-6 ${
              isCurrent ? 'ring-2 ring-blue-500 shadow-lg' : ''
            } ${tier === 'GOLD' ? 'border-blue-300' : ''}`}
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="text-center pb-4 border-b">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{tier}</h3>
                  {isCurrent && <Badge variant="default">Current</Badge>}
                  {tier === 'GOLD' && !isCurrent && (
                    <Badge variant="outline">Popular</Badge>
                  )}
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  ${price}
                  {price > 0 && <span className="text-lg text-gray-600">/month</span>}
                </div>
              </div>

              {/* Features */}
              <div className="space-y-1 text-sm">
                {renderFeature('Persons', features.persons)}
                {renderFeature('Groups', features.groups)}
                {renderFeature('Routines', features.routines)}
                {renderFeature('Tasks per routine', features.tasks)}
                {renderFeature('Goals', features.goals)}
                {renderFeature('Smart Routines', features.smartRoutines)}
                {renderFeature('Analytics', features.analytics)}
                {renderFeature('Marketplace', features.marketplace)}
                {renderFeature('Co-parent Access', features.coparentAccess)}
                {renderFeature('Co-teacher Access', features.coteacherAccess)}
                {renderFeature('Support', features.support)}
              </div>

              {/* Action Button */}
              <div className="pt-4">
                {isCurrent ? (
                  <Button disabled className="w-full" variant="outline">
                    Current Plan
                  </Button>
                ) : isUpgrade ? (
                  <Button
                    onClick={() => onUpgrade(tier)}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Processing...' : 'Upgrade'}
                  </Button>
                ) : (
                  <Button disabled className="w-full" variant="ghost">
                    Lower Tier
                  </Button>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
