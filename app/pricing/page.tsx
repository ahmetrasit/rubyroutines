'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import Link from 'next/link';

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

const TIER_PRICES: Record<string, { parent: number; teacher: number }> = {
  FREE: { parent: 0, teacher: 0 },
  BRONZE: { parent: 1.99, teacher: 4.99 },
  GOLD: { parent: 3.99, teacher: 9.99 },
  PRO: { parent: 12.99, teacher: 29.99 },
};

export default function PricingPage() {
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the plan that's right for you. Start free and upgrade as you grow.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {tiers.map((tier) => {
            const features = TIER_FEATURES[tier]!;
            const price = TIER_PRICES[tier]!;
            const isPopular = tier === 'GOLD';

            return (
              <Card
                key={tier}
                className={`p-6 ${
                  isPopular ? 'ring-2 ring-blue-500 shadow-xl scale-105' : 'shadow-lg'
                } transition-transform hover:scale-105`}
              >
                <div className="space-y-4">
                  {/* Header */}
                  <div className="text-center pb-4 border-b">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{tier}</h3>
                      {isPopular && <Badge variant="default">Popular</Badge>}
                    </div>
                    {price.parent === 0 && price.teacher === 0 ? (
                      <>
                        <div className="text-3xl font-bold text-gray-900">Free</div>
                        <p className="text-sm text-gray-600 mt-1">Forever free</p>
                      </>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-2 text-sm">
                          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                          <span className="text-gray-600">Parent:</span>
                          <span className="font-bold text-gray-900">${price.parent}/mo</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-sm">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          <span className="text-gray-600">Teacher:</span>
                          <span className="font-bold text-gray-900">${price.teacher}/mo</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-1 text-sm min-h-[400px]">
                    {renderFeature('Persons', features.persons)}
                    {renderFeature('Groups', features.groups)}
                    {renderFeature('Routines', features.routines)}
                    {renderFeature('Tasks per routine', features.tasks)}
                    {renderFeature('Goals', features.goals)}
                    {renderFeature('Smart Routines', features.smartRoutines)}
                    {renderFeature('Analytics', features.analytics)}
                    {renderFeature('Community Routines', features.marketplace)}
                    {renderFeature('Co-parent Access', features.coparentAccess)}
                    {renderFeature('Co-teacher Access', features.coteacherAccess)}
                    {renderFeature('Support', features.support)}
                  </div>

                  {/* Action Button */}
                  <div className="pt-4">
                    <Link href="/signup">
                      <Button
                        className="w-full"
                        variant={isPopular ? 'default' : 'outline'}
                      >
                        Get Started
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Feature Comparison */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            All Plans Include
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-2">Easy to Use</h3>
              <p className="text-gray-600">
                Intuitive interface designed for families and educators
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-2">Mobile Friendly</h3>
              <p className="text-gray-600">
                Access your routines from any device, anywhere
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-2">Secure & Private</h3>
              <p className="text-gray-600">Your data is encrypted and always protected</p>
            </Card>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6 max-w-3xl mx-auto">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I switch plans at any time?
              </h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect
                immediately.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Is there a free trial for paid plans?
              </h3>
              <p className="text-gray-600">
                You can start with the Free plan to try out Ruby Routines. When you're ready to
                unlock more features, upgrade to a paid plan.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major credit cards through our secure payment processor, Stripe.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Do you offer discounts for schools?
              </h3>
              <p className="text-gray-600">
                Yes! The SCHOOL tier includes special pricing for educational institutions.
                Contact us for bulk pricing and custom solutions.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to get started?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of families and educators using Ruby Routines
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg">Sign Up Free</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
