'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import { Clock, X } from 'lucide-react';

interface VisibilityOverrideBadgeProps {
  routineId: string;
}

export function VisibilityOverrideBadge({ routineId }: VisibilityOverrideBadgeProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const { data: override } = trpc.routine.getVisibilityOverride.useQuery(
    { routineId },
    {
      refetchInterval: 30000, // Refresh every 30 seconds (optimized from 5s)
    }
  );

  const cancelMutation = trpc.routine.cancelVisibilityOverride.useMutation({
    onSuccess: () => {
      toast({
        title: 'Override Cancelled',
        description: 'Visibility override has been removed',
        variant: 'success',
      });
      utils.routine.list.invalidate();
      utils.routine.getById.invalidate({ id: routineId });
      utils.routine.getVisibilityOverride.invalidate({ routineId });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    if (!override?.expiresAt) {
      setTimeLeft(null);
      return;
    }

    const updateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(override.expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft(null);
        utils.routine.getVisibilityOverride.invalidate({ routineId });
      } else {
        setTimeLeft(Math.ceil(diff / 1000)); // seconds
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [override, routineId, utils]);

  if (!override || timeLeft === null || timeLeft <= 0) {
    return null;
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Cancel visibility override?')) {
      cancelMutation.mutate({ routineId });
    }
  };

  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs">
      <Clock className="h-3 w-3" />
      <span>
        Visible for {minutes}:{seconds.toString().padStart(2, '0')}
      </span>
      <Button
        size="sm"
        variant="ghost"
        className="h-4 w-4 p-0 ml-1 hover:bg-amber-200"
        onClick={handleCancel}
        disabled={cancelMutation.isPending}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
