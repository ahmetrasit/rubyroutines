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

// Tier names: FREE (3 students), TINY (7), SMALL (15), MEDIUM (23), LARGE (24+)
const TIER_FEATURES: Record<string, TierFeatures> = {
  FREE: {
    persons: 3,
    groups: 1,
    routines: 10,
    tasks: 10,
    goals: 3,
    smartRoutines: false,
    analytics: false,
    marketplace: false,
    coparentAccess: false,
    coteacherAccess: false,
    support: 'Community',
  },
  TINY: {
    persons: 10,
    groups: 5,
    routines: 50,
    tasks: 20,
    goals: 10,
    smartRoutines: true,
    analytics: true,
    marketplace: true,
    coparentAccess: true,
    coteacherAccess: true,
    support: 'Email',
  },
  SMALL: {
    persons: 50,
    groups: 20,
    routines: 200,
    tasks: 50,
    goals: 50,
    smartRoutines: true,
    analytics: true,
    marketplace: true,
    coparentAccess: true,
    coteacherAccess: true,
    support: 'Email',
  },
  MEDIUM: {
    persons: 100,
    groups: 50,
    routines: 500,
    tasks: 100,
    goals: 200,
    smartRoutines: true,
    analytics: true,
    marketplace: true,
    coparentAccess: true,
    coteacherAccess: true,
    support: 'Priority Email',
  },
  LARGE: {
    persons: 999, // unlimited
    groups: 999, // unlimited
    routines: 1000,
    tasks: 100,
    goals: 200,
    smartRoutines: true,
    analytics: true,
    marketplace: true,
    coparentAccess: true,
    coteacherAccess: true,
    support: 'Priority + Phone',
  },
};

const TIER_PRICES: Record<string, { parent: number; teacher: number }> = {
  FREE: { parent: 0, teacher: 0 },
  TINY: { parent: 1.99, teacher: 2.99 },
  SMALL: { parent: 3.99, teacher: 5.99 },
  MEDIUM: { parent: 7.99, teacher: 9.99 },
  LARGE: { parent: 12.99, teacher: 9.99 }, // Teacher: $9.99 base + per-student
};

// Teacher tier descriptions based on max students
const TIER_DESCRIPTIONS: Record<string, string> = {
  FREE: 'Up to 3 students',
  TINY: 'Up to 7 students',
  SMALL: 'Up to 15 students',
  MEDIUM: 'Up to 23 students',
  LARGE: '24+ students',
};

interface PricingTableProps {
  currentTier: string;
  onUpgrade: (tier: string) => void;
  isLoading?: boolean;
  roleType?: 'PARENT' | 'TEACHER'; // Role type to determine pricing
}

export function PricingTable({ currentTier, onUpgrade, isLoading, roleType = 'PARENT' }: PricingTableProps) {
  const tiers = ['FREE', 'TINY', 'SMALL', 'MEDIUM', 'LARGE'];

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
        const features = TIER_FEATURES[tier]!;
        const tierPrices = TIER_PRICES[tier]!;
        const price = roleType === 'TEACHER' ? tierPrices.teacher : tierPrices.parent;
        const isCurrent = currentTier === tier;
        const isUpgrade = tiers.indexOf(tier) > tiers.indexOf(currentTier);

        return (
          <Card
            key={tier}
            className={`p-6 ${
              isCurrent ? 'ring-2 ring-blue-500 shadow-lg' : ''
            } ${tier === 'SMALL' ? 'border-blue-300' : ''}`}
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="text-center pb-4 border-b">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h3 className="text-xl font-bold text-gray-900 capitalize">{tier.toLowerCase()}</h3>
                  {isCurrent && <Badge variant="default">Current</Badge>}
                  {tier === 'SMALL' && !isCurrent && (
                    <Badge variant="outline">Popular</Badge>
                  )}
                </div>
                {roleType === 'TEACHER' && (
                  <p className="text-sm text-gray-500 mb-2">{TIER_DESCRIPTIONS[tier]}</p>
                )}
                <div className="text-3xl font-bold text-gray-900">
                  ${price}
                  {price > 0 && <span className="text-lg text-gray-600">/month</span>}
                  {tier === 'LARGE' && roleType === 'TEACHER' && (
                    <span className="block text-sm text-gray-500 font-normal">+ per-student</span>
                  )}
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
