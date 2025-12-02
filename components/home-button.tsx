'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { useLastMode } from '@/lib/hooks/useLastMode';

interface HomeButtonProps {
  className?: string;
}

/**
 * Home button that navigates to the last used mode dashboard (parent or teacher)
 * Always uses localStorage to determine the last used mode.
 */
export function HomeButton({ className }: HomeButtonProps) {
  const { lastMode, isLoaded } = useLastMode();

  // Don't render until localStorage is loaded to prevent hydration mismatch
  if (!isLoaded) {
    return (
      <Button variant="outline" size="sm" className={className} disabled>
        <Home className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Link href={`/${lastMode}`}>
      <Button variant="outline" size="sm" className={className}>
        <Home className="h-4 w-4" />
      </Button>
    </Link>
  );
}
