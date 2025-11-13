'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import { Clock } from 'lucide-react';

interface VisibilityOverrideDialogProps {
  routineId: string;
  routineName: string;
  isOpen: boolean;
  onClose: () => void;
}

const DURATION_OPTIONS = [10, 20, 30, 40, 50, 60];

export function VisibilityOverrideDialog({
  routineId,
  routineName,
  isOpen,
  onClose,
}: VisibilityOverrideDialogProps) {
  const [selectedDuration, setSelectedDuration] = useState(30);
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const createOverrideMutation = trpc.routine.createVisibilityOverride.useMutation({
    onSuccess: () => {
      toast({
        title: 'Override Active',
        description: `"${routineName}" is now visible for ${selectedDuration} minutes`,
        variant: 'success',
      });
      utils.routine.list.invalidate();
      utils.routine.getById.invalidate({ id: routineId });
      utils.routine.getVisibilityOverride.invalidate({ routineId });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleCreate = () => {
    createOverrideMutation.mutate({
      routineId,
      duration: selectedDuration,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Show &quot;{routineName}&quot; Temporarily</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Make this routine visible for a limited time, regardless of visibility rules.
          </p>

          <div>
            <label className="text-sm font-medium mb-2 block">Duration</label>
            <div className="grid grid-cols-3 gap-2">
              {DURATION_OPTIONS.map((duration) => (
                <Button
                  key={duration}
                  type="button"
                  variant={selectedDuration === duration ? 'default' : 'outline'}
                  onClick={() => setSelectedDuration(duration)}
                  className="w-full"
                >
                  {duration} min
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreate}
              disabled={createOverrideMutation.isPending}
              className="flex-1"
            >
              {createOverrideMutation.isPending ? 'Activating...' : 'Activate Override'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
