'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Zap } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import { RoutineType } from '@/lib/types/prisma-enums';

interface UpgradeToSmartButtonProps {
  routineId: string;
  routineName: string;
  currentType: RoutineType;
  onUpgraded?: () => void;
}

export function UpgradeToSmartButton({
  routineId,
  routineName,
  currentType,
  onUpgraded,
}: UpgradeToSmartButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const upgradeMutation = trpc.routine.update.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: `${routineName} has been upgraded to a Smart Routine`,
        variant: 'success',
      });
      utils.routine.list.invalidate();
      onUpgraded?.();
      setShowDialog(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (currentType === RoutineType.SMART) {
    return null;
  }

  const handleUpgrade = () => {
    // TODO: Implement routine.upgradeToSmart mutation in backend
    toast({
      title: 'Coming Soon',
      description: 'Smart routine upgrade is coming soon!',
      variant: 'default',
    });
    setShowDialog(false);
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setShowDialog(true)}
        className="flex items-center gap-2"
      >
        <Zap className="h-4 w-4" />
        Upgrade to Smart
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade to Smart Routine?</DialogTitle>
            <DialogDescription>
              Smart Routines can have conditions that control their visibility and behavior.
              You&apos;ll be able to add conditions after upgrading.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Smart Routine Features:</h4>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• Show/hide based on task completions</li>
                <li>• Show/hide based on goal achievements</li>
                <li>• Show/hide based on other routine completions</li>
                <li>• Combine multiple conditions with AND logic</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpgrade} disabled={upgradeMutation.isPending}>
              <Zap className="h-4 w-4 mr-2" />
              Upgrade to Smart
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
