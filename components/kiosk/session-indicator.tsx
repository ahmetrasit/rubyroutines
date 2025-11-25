'use client';

import { Badge } from '@/components/ui/badge';
import { Wifi } from 'lucide-react';

interface SessionIndicatorProps {
  count: number;
  variant?: 'default' | 'success' | 'warning';
}

export function SessionIndicator({ count, variant = 'success' }: SessionIndicatorProps) {
  if (count === 0) {
    return null;
  }

  return (
    <Badge variant={variant} className="ml-2 flex items-center gap-1">
      <Wifi className="h-3 w-3" />
      <span>{count} active</span>
    </Badge>
  );
}
