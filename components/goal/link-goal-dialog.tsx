'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import { Loader2 } from 'lucide-react';

interface LinkGoalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'task' | 'routine';
  entityId: string;
  entityName: string;
  currentGoalIds?: string[];
  onLinked?: () => void;
}

export function LinkGoalDialog({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityName,
  currentGoalIds = [],
  onLinked,
}: LinkGoalDialogProps) {
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>(currentGoalIds);
  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Reset selection when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedGoalIds(currentGoalIds);
    }
  }, [isOpen, currentGoalIds]);

  // Get current user's role
  const { data: session } = trpc.auth.getSession.useQuery();
  const roleId = session?.user?.roles?.[0]?.id || '';

  const { data: goals, isLoading } = trpc.goal.list.useQuery(
    { roleId },
    {
      enabled: isOpen && !!roleId,
    }
  );

  const linkMutation = trpc.goal[entityType === 'task' ? 'linkTasks' : 'linkRoutines'].useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Goals linked successfully',
        variant: 'success',
      });
      utils.goal.list.invalidate();
      utils.task.list.invalidate();
      utils.routine.list.invalidate();
      onLinked?.();
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

  const handleToggleGoal = (goalId: string) => {
    setSelectedGoalIds((prev) =>
      prev.includes(goalId)
        ? prev.filter((id) => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handleSave = () => {
    // For each selected goal, link the entity
    selectedGoalIds.forEach((goalId) => {
      linkMutation.mutate({
        goalId,
        [entityType === 'task' ? 'taskIds' : 'routineIds']: [entityId],
      } as any);
    });
  };

  const activeGoals = goals?.filter((g) => g.status === 'ACTIVE') || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link {entityName} to Goals</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : activeGoals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No goals available.</p>
              <p className="text-sm mt-2">Create a goal first to link it here.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activeGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleToggleGoal(goal.id)}
                >
                  <Checkbox
                    checked={selectedGoalIds.includes(goal.id)}
                    onChange={() => handleToggleGoal(goal.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-gray-900">{goal.name}</h4>
                    {goal.description && (
                      <p className="text-xs text-gray-500 mt-1">{goal.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                      <span>Target: {goal.target}</span>
                      <span>•</span>
                      <span className="capitalize">{goal.period.toLowerCase()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={linkMutation.isPending || isLoading}
          >
            {linkMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
