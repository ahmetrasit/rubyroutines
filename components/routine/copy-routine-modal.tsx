'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import { Check, Loader2 } from 'lucide-react';
import { useAvatar } from '@/lib/hooks';
import { RenderIconEmoji } from '@/components/ui/icon-emoji-picker';
import { getResetDescription } from '@/lib/services/reset-period';

interface CopyRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleId: string;
  sourcePersonId?: string; // Optional: if copying from a specific person
}

export function CopyRoutineModal({ isOpen, onClose, roleId, sourcePersonId }: CopyRoutineModalProps) {
  const [selectedRoutineIds, setSelectedRoutineIds] = useState<string[]>([]);
  const [selectedTargetIds, setSelectedTargetIds] = useState<string[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [copiedCount, setCopiedCount] = useState({ routines: 0, targets: 0, merged: 0 });
  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Get all persons
  const { data: persons } = trpc.person.list.useQuery({ roleId });

  // Get all routines for the role
  const { data: routines } = trpc.routine.list.useQuery({ roleId });

  // Filter routines to show
  const availableRoutines = useMemo(() => {
    if (!routines) return [];
    // If sourcePersonId is provided, show only that person's routines
    if (sourcePersonId) {
      return routines.filter(r =>
        r.assignments.some(a => a.person?.id === sourcePersonId)
      );
    }
    return routines;
  }, [routines, sourcePersonId]);

  // Filter persons to show as targets
  const targetPersons = useMemo(() => {
    if (!persons) return [];
    // Exclude account owner and optionally the source person
    return persons.filter(p =>
      !p.isAccountOwner &&
      (!sourcePersonId || p.id !== sourcePersonId)
    );
  }, [persons, sourcePersonId]);

  const copyMutation = trpc.routine.copy.useMutation({
    onSuccess: (results) => {
      const mergedCount = results.filter(r => r.merged).length;
      const totalRoutines = selectedRoutineIds.length;
      const totalTargets = selectedTargetIds.length;

      setCopiedCount({
        routines: totalRoutines,
        targets: totalTargets,
        merged: mergedCount
      });
      setIsSuccess(true);
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

  const toggleTargetSelection = (personId: string) => {
    setSelectedTargetIds(prev =>
      prev.includes(personId)
        ? prev.filter(id => id !== personId)
        : [...prev, personId]
    );
  };

  const selectAllRoutines = () => {
    setSelectedRoutineIds(availableRoutines.map(r => r.id));
  };

  const clearAllRoutines = () => {
    setSelectedRoutineIds([]);
  };

  const selectAllTargets = () => {
    setSelectedTargetIds(targetPersons.map(p => p.id));
  };

  const clearAllTargets = () => {
    setSelectedTargetIds([]);
  };

  const handleCopy = async () => {
    if (selectedRoutineIds.length === 0 || selectedTargetIds.length === 0) {
      return;
    }

    // Copy each routine to each target
    await Promise.all(
      selectedRoutineIds.map(routineId =>
        copyMutation.mutateAsync({
          routineId,
          targetPersonIds: selectedTargetIds,
        })
      )
    );
  };

  const handleClose = () => {
    setSelectedRoutineIds([]);
    setSelectedTargetIds([]);
    setIsSuccess(false);
    setCopiedCount({ routines: 0, targets: 0, merged: 0 });
    onClose();
  };

  const hasDailyRoutine = selectedRoutineIds.some(id => {
    const routine = availableRoutines.find(r => r.id === id);
    return routine?.name.includes('Daily Routine');
  });

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Copy Routines</DialogTitle>
        </DialogHeader>

        {!isSuccess ? (
          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            {/* Two-column layout */}
            <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
              {/* Left column: Select routines */}
              <div className="border rounded-lg p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Select Routines</h3>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={selectAllRoutines}
                      className="text-xs"
                    >
                      Select All
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={clearAllRoutines}
                      className="text-xs"
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2">
                  {availableRoutines.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No routines available
                    </p>
                  ) : (
                    availableRoutines.map((routine) => (
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
                              {((count) => `${count} ${count === 1 ? 'task' : 'tasks'}`)((routine as any)._count?.tasks || (routine as any).tasks?.length || 0)} • {getResetDescription(routine.resetPeriod as any, routine.resetDay)}
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

                <div className="mt-3 pt-3 border-t text-xs text-gray-600">
                  {selectedRoutineIds.length} routine{selectedRoutineIds.length !== 1 ? 's' : ''} selected
                </div>
              </div>

              {/* Right column: Select targets */}
              <div className="border rounded-lg p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Copy To</h3>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={selectAllTargets}
                      className="text-xs"
                    >
                      Select All
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={clearAllTargets}
                      className="text-xs"
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2">
                  {targetPersons.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No persons available
                    </p>
                  ) : (
                    targetPersons.map((person) => {
                      const { color, emoji, backgroundColor } = useAvatar({
                        avatarString: person.avatar,
                        fallbackName: person.name,
                      });

                      return (
                        <button
                          key={person.id}
                          onClick={() => toggleTargetSelection(person.id)}
                          className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                            selectedTargetIds.includes(person.id)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="h-10 w-10 rounded-full flex items-center justify-center text-xl border-2 flex-shrink-0"
                              style={{ backgroundColor, borderColor: color }}
                            >
                              <RenderIconEmoji value={emoji} className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm truncate">
                                {person.name}
                              </div>
                            </div>
                            {selectedTargetIds.includes(person.id) && (
                              <Check className="h-5 w-5 text-blue-600 flex-shrink-0" />
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="mt-3 pt-3 border-t text-xs text-gray-600">
                  {selectedTargetIds.length} person{selectedTargetIds.length !== 1 ? 's' : ''} selected
                </div>
              </div>
            </div>

            {/* Info banner */}
            {hasDailyRoutine && selectedTargetIds.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800 font-medium">
                  💡 Daily Routine tasks will be merged into existing Daily Routines (not duplicated)
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleCopy}
                disabled={
                  selectedRoutineIds.length === 0 ||
                  selectedTargetIds.length === 0 ||
                  copyMutation.isPending
                }
              >
                {copyMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Copying...
                  </>
                ) : (
                  <>
                    Copy {selectedRoutineIds.length} routine{selectedRoutineIds.length !== 1 ? 's' : ''} to{' '}
                    {selectedTargetIds.length} person{selectedTargetIds.length !== 1 ? 's' : ''}
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
                  Copy Successful!
                </h3>
              </div>
              <div className="text-sm text-green-800 space-y-1">
                <p className="text-center">
                  Copied <strong>{copiedCount.routines}</strong> routine{copiedCount.routines !== 1 ? 's' : ''} to{' '}
                  <strong>{copiedCount.targets}</strong> person{copiedCount.targets !== 1 ? 's' : ''}
                </p>
                {copiedCount.merged > 0 && (
                  <p className="text-center text-xs mt-2">
                    ({copiedCount.merged} Daily Routine{copiedCount.merged !== 1 ? 's' : ''} merged)
                  </p>
                )}
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
