'use client';

import { Badge } from '@/components/ui/badge';
import { Crown, Star, Building, Gift } from 'lucide-react';

interface TierBadgeProps {
  tier: string;
  showIcon?: boolean;
  className?: string;
}

const TIER_CONFIG = {
  FREE: {
    label: 'Free',
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    icon: Gift,
  },
  BRONZE: {
    label: 'Basic',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: Star,
  },
  GOLD: {
    label: 'Premium',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    icon: Crown,
  },
  PRO: {
    label: 'School',
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: Building,
  },
};

export function TierBadge({ tier, showIcon = true, className = '' }: TierBadgeProps) {
  const config = TIER_CONFIG[tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.FREE;
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.color} border ${className}`}>
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {config.label}
    </Badge>
  );
}
