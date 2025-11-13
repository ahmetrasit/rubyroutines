'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Target, Zap } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import { Loader2 } from 'lucide-react';

interface TaskDeletionWarningProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  taskName: string;
  onDeleted?: () => void;
}

export function TaskDeletionWarning({
  isOpen,
  onClose,
  taskId,
  taskName,
  onDeleted,
}: TaskDeletionWarningProps) {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  // TODO: Implement task.getAffectedByDeletion query in backend
  // For now, just show a simple warning
  const affectedData = { goals: [], conditions: [] };
  const isLoading = false;

  const deleteMutation = trpc.task.delete.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Task archived successfully',
        variant: 'success',
      });
      utils.task.list.invalidate();
      utils.goal.list.invalidate();
      utils.routine.list.invalidate();
      onDeleted?.();
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

  const handleDelete = () => {
    deleteMutation.mutate({ id: taskId });
  };

  const affectedGoals = affectedData?.goals || [];
  const affectedConditions = affectedData?.conditions || [];
  const hasAffectedItems = affectedGoals.length > 0 || affectedConditions.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Archive Task?
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to archive &quot;{taskName}&quot;?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : hasAffectedItems ? (
            <div className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-800 font-medium mb-2">
                  Warning: This task is currently being used
                </p>
                <p className="text-xs text-orange-700">
                  Archiving this task will affect the following:
                </p>
              </div>

              {affectedGoals.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    <h4 className="text-sm font-semibold text-gray-900">
                      Linked Goals ({affectedGoals.length})
                    </h4>
                  </div>
                  <div className="space-y-1">
                    {affectedGoals.map((goal: any) => (
                      <div
                        key={goal.id}
                        className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded border border-gray-200"
                      >
                        {goal.name}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    These goals will no longer track this task&apos;s progress
                  </p>
                </div>
              )}

              {affectedConditions.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-purple-600" />
                    <h4 className="text-sm font-semibold text-gray-900">
                      Smart Routine Conditions ({affectedConditions.length})
                    </h4>
                  </div>
                  <div className="space-y-1">
                    {affectedConditions.map((condition: any) => (
                      <div
                        key={condition.id}
                        className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded border border-gray-200"
                      >
                        {condition.routine?.name || 'Unknown Routine'}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    These smart routine conditions will be automatically removed
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                This task is not linked to any goals or conditions. It can be safely archived.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={deleteMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={deleteMutation.isPending || isLoading}
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Archiving...
              </>
            ) : (
              'Archive Task'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
