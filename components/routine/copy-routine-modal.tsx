'use client';

import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import { Check, Loader2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useAvatar } from '@/lib/hooks';
import { RenderIconEmoji } from '@/components/ui/icon-emoji-picker';
import { getResetDescription } from '@/lib/services/reset-period';

type ConflictResolution = 'merge' | 'rename';
type Step = 'select' | 'resolve-conflicts' | 'success';

// Separate component to safely use hooks
interface PersonCardProps {
  person: { id: string; name: string; avatar: string | null };
  isSelected: boolean;
  onToggle: () => void;
}

function PersonCard({ person, isSelected, onToggle }: PersonCardProps) {
  const { color, emoji, backgroundColor } = useAvatar({
    avatarString: person.avatar,
    fallbackName: person.name,
  });

  return (
    <button
      onClick={onToggle}
      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
        isSelected
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
        {isSelected && (
          <Check className="h-5 w-5 text-blue-600 flex-shrink-0" />
        )}
      </div>
    </button>
  );
}

interface CopyRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleId: string;
  sourcePersonId?: string; // Optional: if copying from a specific person
  preselectedRoutineId?: string; // Optional: if a specific routine is already selected
}

export function CopyRoutineModal({ isOpen, onClose, roleId, sourcePersonId, preselectedRoutineId }: CopyRoutineModalProps) {
  const [selectedRoutineIds, setSelectedRoutineIds] = useState<string[]>([]);
  const [selectedTargetIds, setSelectedTargetIds] = useState<string[]>([]);
  const [step, setStep] = useState<Step>('select');
  const [copiedCount, setCopiedCount] = useState({ routines: 0, targets: 0, merged: 0, renamed: 0 });
  const [conflicts, setConflicts] = useState<{ routineId: string; routineName: string; personId: string; personName: string }[]>([]);
  const [conflictResolutions, setConflictResolutions] = useState<Record<string, ConflictResolution>>({});
  const [renamedNames, setRenamedNames] = useState<Record<string, string>>({});
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);
  const { toast } = useToast();

  // Update selected routine when preselectedRoutineId changes
  useEffect(() => {
    if (isOpen && preselectedRoutineId) {
      setSelectedRoutineIds([preselectedRoutineId]);
    } else if (!isOpen) {
      // Reset when modal closes
      setSelectedRoutineIds([]);
      setSelectedTargetIds([]);
      setStep('select');
      setConflicts([]);
      setConflictResolutions({});
      setRenamedNames({});
    }
  }, [isOpen, preselectedRoutineId]);
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
    // Exclude only the source person (can't copy to yourself)
    return persons.filter(p =>
      !sourcePersonId || p.id !== sourcePersonId
    );
  }, [persons, sourcePersonId]);

  const copyMutation = trpc.routine.copy.useMutation({
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

  // Check for conflicts before copying
  const handleCheckConflicts = async () => {
    if (selectedRoutineIds.length === 0 || selectedTargetIds.length === 0) {
      return;
    }

    setIsCheckingConflicts(true);
    try {
      // Check conflicts for each selected routine
      const allConflicts: { routineId: string; routineName: string; personId: string; personName: string }[] = [];

      for (const routineId of selectedRoutineIds) {
        const result = await utils.client.routine.checkCopyConflicts.query({
          routineId,
          targetPersonIds: selectedTargetIds,
        });

        if (result.hasConflicts) {
          result.conflicts.forEach((conflict: any) => {
            allConflicts.push({
              routineId,
              routineName: result.routineName,
              personId: conflict.personId,
              personName: conflict.personName,
            });
          });
        }
      }

      if (allConflicts.length > 0) {
        setConflicts(allConflicts);
        // Initialize all resolutions to 'merge' by default
        const initialResolutions: Record<string, ConflictResolution> = {};
        const initialNames: Record<string, string> = {};
        allConflicts.forEach(conflict => {
          const key = `${conflict.routineId}::${conflict.personId}`;
          initialResolutions[key] = 'merge';
          initialNames[key] = `${conflict.routineName} (Copy)`;
        });
        setConflictResolutions(initialResolutions);
        setRenamedNames(initialNames);
        setStep('resolve-conflicts');
      } else {
        // No conflicts, proceed with copy
        await handleCopyWithResolutions({});
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to check for conflicts',
        variant: 'destructive',
      });
    } finally {
      setIsCheckingConflicts(false);
    }
  };

  // Perform the actual copy with conflict resolutions
  const handleCopyWithResolutions = async (resolutions: Record<string, ConflictResolution>) => {
    let totalMerged = 0;
    let totalRenamed = 0;

    // Copy each routine to each target
    const allResults = await Promise.all(
      selectedRoutineIds.map(async routineId => {
        // Build conflict resolutions map for this routine (personId -> resolution)
        const routineConflictResolutions: Record<string, 'merge' | 'rename'> = {};
        // Build per-person renamed names map (personId -> new name)
        const perPersonRenamedNames: Record<string, string> = {};

        for (const [key, resolution] of Object.entries(resolutions)) {
          const [rId, personId] = key.split('::');
          if (rId === routineId && personId) {
            routineConflictResolutions[personId] = resolution;
            if (resolution === 'rename' && renamedNames[key]) {
              perPersonRenamedNames[personId] = renamedNames[key];
            }
          }
        }

        const result = await copyMutation.mutateAsync({
          routineId,
          targetPersonIds: selectedTargetIds,
          conflictResolutions: Object.keys(routineConflictResolutions).length > 0 ? routineConflictResolutions : undefined,
          renamedNames: Object.keys(perPersonRenamedNames).length > 0 ? perPersonRenamedNames : undefined,
        });

        return result;
      })
    );

    // Count results
    allResults.forEach(results => {
      results.forEach((r: any) => {
        if (r.merged) totalMerged++;
        if (r.renamed) totalRenamed++;
      });
    });

    setCopiedCount({
      routines: selectedRoutineIds.length,
      targets: selectedTargetIds.length,
      merged: totalMerged,
      renamed: totalRenamed,
    });
    setStep('success');
    utils.routine.list.invalidate();
  };

  const handleCopy = async () => {
    if (step === 'resolve-conflicts') {
      await handleCopyWithResolutions(conflictResolutions);
    } else {
      await handleCheckConflicts();
    }
  };

  const handleClose = () => {
    setSelectedRoutineIds([]);
    setSelectedTargetIds([]);
    setStep('select');
    setCopiedCount({ routines: 0, targets: 0, merged: 0, renamed: 0 });
    setConflicts([]);
    setConflictResolutions({});
    setRenamedNames({});
    onClose();
  };

  const handleBack = () => {
    setStep('select');
    setConflicts([]);
    setConflictResolutions({});
    setRenamedNames({});
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

        {step === 'select' && (
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
                    targetPersons.map((person) => (
                      <PersonCard
                        key={person.id}
                        person={person}
                        isSelected={selectedTargetIds.includes(person.id)}
                        onToggle={() => toggleTargetSelection(person.id)}
                      />
                    ))
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
                  Daily Routine tasks will be merged into existing Daily Routines (not duplicated)
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
                  copyMutation.isPending ||
                  isCheckingConflicts
                }
              >
                {isCheckingConflicts ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : copyMutation.isPending ? (
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
        )}

        {step === 'resolve-conflicts' && (
          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            {/* Warning banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-900">Naming Conflicts Found</h3>
                  <p className="text-sm text-amber-800 mt-1">
                    Some target persons already have routines with the same name. Choose how to handle each conflict:
                  </p>
                </div>
              </div>
            </div>

            {/* Conflict list */}
            <div className="flex-1 overflow-y-auto space-y-4">
              {conflicts.map((conflict) => {
                const key = `${conflict.routineId}::${conflict.personId}`;
                const resolution = conflictResolutions[key] || 'merge';
                return (
                  <div key={key} className="border rounded-lg p-4">
                    <div className="mb-3">
                      <p className="font-medium text-sm">
                        &quot;{conflict.routineName}&quot; → {conflict.personName}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {conflict.personName} already has a routine named &quot;{conflict.routineName}&quot;
                      </p>
                    </div>

                    <RadioGroup
                      value={resolution}
                      onValueChange={(value: ConflictResolution) => {
                        setConflictResolutions(prev => ({
                          ...prev,
                          [key]: value,
                        }));
                      }}
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="merge" id={`${key}-merge`} />
                        <Label htmlFor={`${key}-merge`} className="text-sm font-normal cursor-pointer">
                          Merge tasks into existing routine
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="rename" id={`${key}-rename`} />
                        <Label htmlFor={`${key}-rename`} className="text-sm font-normal cursor-pointer">
                          Create new routine with different name
                        </Label>
                      </div>
                    </RadioGroup>

                    {resolution === 'rename' && (
                      <div className="mt-3 pl-6">
                        <Label htmlFor={`${key}-name`} className="text-xs text-gray-600">
                          New routine name:
                        </Label>
                        <Input
                          id={`${key}-name`}
                          value={renamedNames[key] || ''}
                          onChange={(e) => {
                            setRenamedNames(prev => ({
                              ...prev,
                              [key]: e.target.value,
                            }));
                          }}
                          placeholder="Enter new name"
                          className="mt-1"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-2 border-t">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCopy}
                  disabled={copyMutation.isPending || conflicts.some(c => {
                    const key = `${c.routineId}::${c.personId}`;
                    return conflictResolutions[key] === 'rename' && !renamedNames[key]?.trim();
                  })}
                >
                  {copyMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Copying...
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 'success' && (
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
                {(copiedCount.merged > 0 || copiedCount.renamed > 0) && (
                  <p className="text-center text-xs mt-2">
                    ({copiedCount.merged > 0 && `${copiedCount.merged} merged`}
                    {copiedCount.merged > 0 && copiedCount.renamed > 0 && ', '}
                    {copiedCount.renamed > 0 && `${copiedCount.renamed} renamed`})
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
