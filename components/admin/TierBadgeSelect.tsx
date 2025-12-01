'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tier } from '@/lib/types/prisma-enums';
import { Check, ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TierBadgeSelectProps {
  roleId: string;
  roleType: string;
  currentTier: Tier;
  onTierChange: (roleId: string, newTier: Tier) => Promise<void>;
  disabled?: boolean;
}

// Teacher tiers: FREE (3 students), TINY (7), SMALL (15), MEDIUM (23), LARGE (24+)
const TIER_LABELS: Record<Tier, string> = {
  [Tier.FREE]: 'Free',
  [Tier.TINY]: 'Tiny',
  [Tier.SMALL]: 'Small',
  [Tier.MEDIUM]: 'Medium',
  [Tier.LARGE]: 'Large',
};

const TIER_COLORS: Record<Tier, string> = {
  [Tier.FREE]: 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300',
  [Tier.TINY]: 'bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300',
  [Tier.SMALL]: 'bg-green-100 hover:bg-green-200 text-green-800 border-green-300',
  [Tier.MEDIUM]: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-300',
  [Tier.LARGE]: 'bg-purple-100 hover:bg-purple-200 text-purple-800 border-purple-300',
};

export function TierBadgeSelect({
  roleId,
  roleType,
  currentTier,
  onTierChange,
  disabled = false,
}: TierBadgeSelectProps) {
  const [isChanging, setIsChanging] = useState(false);
  const [open, setOpen] = useState(false);

  const handleTierSelect = async (newTier: Tier) => {
    if (newTier === currentTier || disabled) return;

    setIsChanging(true);
    try {
      await onTierChange(roleId, newTier);
      setOpen(false);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger disabled={disabled || isChanging} asChild>
        <Badge
          variant="secondary"
          className={cn(
            'cursor-pointer transition-all hover:shadow-sm border',
            TIER_COLORS[currentTier],
            (disabled || isChanging) && 'opacity-60 cursor-not-allowed',
            'gap-1.5 pr-1.5'
          )}
        >
          <span className="font-medium">{roleType}</span>
          <span className="text-muted-foreground">({TIER_LABELS[currentTier]})</span>
          {isChanging ? (
            <Loader2 className="h-3 w-3 animate-spin ml-0.5" />
          ) : (
            <ChevronDown className="h-3 w-3 ml-0.5" />
          )}
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        {Object.values(Tier).map((tier) => (
          <DropdownMenuItem
            key={tier}
            onClick={() => handleTierSelect(tier)}
            className="cursor-pointer justify-between"
            disabled={tier === currentTier}
          >
            <span>{TIER_LABELS[tier]}</span>
            {tier === currentTier && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
