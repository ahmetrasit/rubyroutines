'use client';

import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';

interface SmartTaskIndicatorProps {
  isSmart?: boolean;
  className?: string;
}

export function SmartTaskIndicator({ isSmart, className = '' }: SmartTaskIndicatorProps) {
  if (!isSmart) return null;

  return (
    <Badge variant="default" className={`flex items-center gap-1 ${className}`}>
      <Zap className="h-3 w-3" />
      Smart
    </Badge>
  );
}
