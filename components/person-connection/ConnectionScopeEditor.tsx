'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { trpc } from '@/lib/trpc/client';
import {
  Settings,
  Loader2,
  CheckCircle,
  Eye,
  EyeOff,
  Users,
} from 'lucide-react';

interface ConnectionScopeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  connectionId: string;
  originPersonName: string;
  targetPersonName: string;
  currentScopeMode: 'ALL' | 'SELECTED';
  currentVisibleRoutineIds: string[];
  currentVisibleGoalIds: string[];
  roleId: string;
  originPersonId: string;
}

/**
 * Modal for origin account owners to control what routines and goals
 * are visible to the connected target person.
 */
export function ConnectionScopeEditor({
  isOpen,
  onClose,
  connectionId,
  originPersonName,
  targetPersonName,
  currentScopeMode,
  currentVisibleRoutineIds,
  currentVisibleGoalIds,
  roleId,
  originPersonId,
}: ConnectionScopeEditorProps) {
  const [scopeMode, setScopeMode] = useState<'ALL' | 'SELECTED'>(currentScopeMode);
  const [selectedRoutineIds, setSelectedRoutineIds] = useState<string[]>(currentVisibleRoutineIds);
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>(currentVisibleGoalIds);
  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Fetch available routines for the origin person
  const { data: routines, isLoading: routinesLoading } = trpc.routine.list.useQuery(
    { roleId, personId: originPersonId },
    { enabled: isOpen }
  );

  // Fetch available goals for the origin person
  const { data: goals, isLoading: goalsLoading } = trpc.goal.list.useQuery(
    { roleId },
    { enabled: isOpen }
  );

  // Filter goals to only those assigned to this person
  const personGoals = goals?.filter(
    (g) => g.personIds.includes(originPersonId) || g.personIds.length === 0
  );

  // Update scope mutation
  const updateMutation = trpc.personConnection.updateScope.useMutation({
    onSuccess: () => {
      toast({
        title: 'Scope updated',
        description: 'Connection visibility settings have been saved.',
        variant: 'default',
      });
      utils.personConnection.listAsOrigin.invalidate();
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error updating scope',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Reset to current values when modal opens
  useEffect(() => {
    if (isOpen) {
      setScopeMode(currentScopeMode);
      setSelectedRoutineIds(currentVisibleRoutineIds);
      setSelectedGoalIds(currentVisibleGoalIds);
    }
  }, [isOpen, currentScopeMode, currentVisibleRoutineIds, currentVisibleGoalIds]);

  const handleSave = () => {
    updateMutation.mutate({
      connectionId,
      scopeMode,
      visibleRoutineIds: scopeMode === 'SELECTED' ? selectedRoutineIds : undefined,
      visibleGoalIds: scopeMode === 'SELECTED' ? selectedGoalIds : undefined,
    });
  };

  const toggleRoutine = (routineId: string) => {
    setSelectedRoutineIds((prev) =>
      prev.includes(routineId)
        ? prev.filter((id) => id !== routineId)
        : [...prev, routineId]
    );
  };

  const toggleGoal = (goalId: string) => {
    setSelectedGoalIds((prev) =>
      prev.includes(goalId)
        ? prev.filter((id) => id !== goalId)
        : [...prev, goalId]
    );
  };

  const selectAllRoutines = () => {
    if (routines) {
      setSelectedRoutineIds(routines.map((r) => r.id));
    }
  };

  const deselectAllRoutines = () => {
    setSelectedRoutineIds([]);
  };

  const selectAllGoals = () => {
    if (personGoals) {
      setSelectedGoalIds(personGoals.map((g) => g.id));
    }
  };

  const deselectAllGoals = () => {
    setSelectedGoalIds([]);
  };

  const isLoading = routinesLoading || goalsLoading;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Connection Visibility Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              Control what <strong>{targetPersonName}</strong> can see about{' '}
              <strong>{originPersonName}</strong>&apos;s progress. You can show all
              routines and goals, or select specific ones.
            </p>
          </div>

          {/* Scope Mode Selection */}
          <div className="space-y-3">
            <label className="font-semibold text-gray-900">Visibility Mode</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setScopeMode('ALL')}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  scopeMode === 'ALL'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Eye className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Show All</span>
                </div>
                <p className="text-sm text-gray-600">
                  All routines and goals are visible
                </p>
              </button>

              <button
                type="button"
                onClick={() => setScopeMode('SELECTED')}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  scopeMode === 'SELECTED'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <EyeOff className="h-5 w-5 text-purple-600" />
                  <span className="font-medium">Select Specific</span>
                </div>
                <p className="text-sm text-gray-600">
                  Only selected items are visible
                </p>
              </button>
            </div>
          </div>

          {/* Selection UI (only shown when SELECTED mode) */}
          {scopeMode === 'SELECTED' && (
            <>
              {/* Routines Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-gray-900 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Visible Routines
                    <Badge variant="secondary">{selectedRoutineIds.length}</Badge>
                  </label>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectAllRoutines}
                      disabled={isLoading}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={deselectAllRoutines}
                      disabled={isLoading}
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : routines && routines.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                    {routines.map((routine) => {
                      const isSelected = selectedRoutineIds.includes(routine.id);
                      return (
                        <label
                          key={routine.id}
                          className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                            isSelected ? 'bg-purple-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRoutine(routine.id)}
                            className="h-4 w-4 rounded"
                          />
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: routine.color || '#6b7280' }}
                          />
                          <span className="text-sm truncate">{routine.name}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 border rounded-lg">
                    No routines available
                  </div>
                )}
              </div>

              {/* Goals Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-gray-900 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Visible Goals
                    <Badge variant="secondary">{selectedGoalIds.length}</Badge>
                  </label>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectAllGoals}
                      disabled={isLoading}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={deselectAllGoals}
                      disabled={isLoading}
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : personGoals && personGoals.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                    {personGoals.map((goal) => {
                      const isSelected = selectedGoalIds.includes(goal.id);
                      return (
                        <label
                          key={goal.id}
                          className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                            isSelected ? 'bg-purple-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleGoal(goal.id)}
                            className="h-4 w-4 rounded"
                          />
                          <span className="text-lg">{goal.icon || '🎯'}</span>
                          <span className="text-sm truncate">{goal.name}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 border rounded-lg">
                    No goals available
                  </div>
                )}
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex-1"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
