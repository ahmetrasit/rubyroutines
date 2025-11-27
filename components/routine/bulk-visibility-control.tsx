'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import { Eye, Loader2, Check, Clock } from 'lucide-react';
import { isRoutineVisible } from '@/lib/services/visibility-rules';
import { getResetDescription } from '@/lib/services/reset-period';

interface BulkVisibilityControlProps {
  isOpen: boolean;
  onClose: () => void;
  roleId: string;
}

export function BulkVisibilityControl({ isOpen, onClose, roleId }: BulkVisibilityControlProps) {
  const [selectedRoutineIds, setSelectedRoutineIds] = useState<string[]>([]);
  const [selectedDuration, setSelectedDuration] = useState('30');
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Get all routines for the role
  const { data: routines } = trpc.routine.list.useQuery({ roleId });

  // Filter to show only hidden routines (out of schedule)
  const hiddenRoutines = useMemo(() => {
    if (!routines) return [];
    return routines.filter(routine => !isRoutineVisible(routine as any));
  }, [routines]);

  const createOverrideMutation = trpc.routine.createVisibilityOverride.useMutation({
    onSuccess: () => {
      utils.routine.list.invalidate();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const toggleRoutineSelection = (routineId: string) => {
    setSelectedRoutineIds(prev =>
      prev.includes(routineId)
        ? prev.filter(id => id !== routineId)
        : [...prev, routineId]
    );
  };

  const selectAll = () => {
    setSelectedRoutineIds(hiddenRoutines.map(r => r.id));
  };

  const clearAll = () => {
    setSelectedRoutineIds([]);
  };

  const handleApply = async () => {
    if (selectedRoutineIds.length === 0) {
      return;
    }

    const duration = parseInt(selectedDuration);

    try {
      await Promise.all(
        selectedRoutineIds.map(routineId =>
          createOverrideMutation.mutateAsync({
            routineId,
            duration,
          })
        )
      );

      setIsSuccess(true);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleClose = () => {
    setSelectedRoutineIds([]);
    setSelectedDuration('30');
    setIsSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Show Hidden Routines Temporarily</DialogTitle>
        </DialogHeader>

        {!isSuccess ? (
          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> Make routines that are currently out of their schedule visible for a limited time.
                Perfect for showing a &quot;Morning Routine&quot; in the afternoon.
              </p>
            </div>

            {/* Duration selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Show for how long?</label>
              <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="20">20 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="40">40 minutes</SelectItem>
                  <SelectItem value="50">50 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Routine selection */}
            <div className="flex-1 overflow-hidden flex flex-col border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Hidden Routines ({hiddenRoutines.length})</h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={selectAll}
                    className="text-xs"
                  >
                    Select All
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearAll}
                    className="text-xs"
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2">
                {hiddenRoutines.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">All routines are currently visible!</p>
                    <p className="text-xs mt-1">Hidden routines will appear here when they&apos;re out of their scheduled time.</p>
                  </div>
                ) : (
                  hiddenRoutines.map((routine) => (
                    <button
                      key={routine.id}
                      onClick={() => toggleRoutineSelection(routine.id)}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                        selectedRoutineIds.includes(routine.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">
                            {routine.name}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {(routine as any)._count?.tasks || (routine as any).tasks?.length || 0} tasks • {getResetDescription(routine.resetPeriod as any, routine.resetDay)}
                          </div>
                        </div>
                        {selectedRoutineIds.includes(routine.id) && (
                          <Check className="h-5 w-5 text-blue-600 flex-shrink-0 ml-2" />
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>

              {selectedRoutineIds.length > 0 && (
                <div className="mt-3 pt-3 border-t text-xs text-gray-600">
                  {selectedRoutineIds.length} routine{selectedRoutineIds.length !== 1 ? 's' : ''} selected
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleApply}
                disabled={selectedRoutineIds.length === 0 || createOverrideMutation.isPending}
              >
                {createOverrideMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    Show for {selectedDuration} minutes
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* Success state */
          <div className="py-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-3">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  Visibility Updated!
                </h3>
              </div>
              <div className="text-sm text-green-800 text-center">
                <p>
                  <strong>{selectedRoutineIds.length}</strong> routine{selectedRoutineIds.length !== 1 ? 's' : ''} will be visible for{' '}
                  <strong>{selectedDuration} minutes</strong>
                </p>
                <p className="text-xs mt-2">
                  A countdown badge will appear on each routine card.
                </p>
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <Button onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
