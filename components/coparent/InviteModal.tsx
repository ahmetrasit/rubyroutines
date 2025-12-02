'use client';

import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Send, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';

// Type for per-kid routine sharing
type SharedPerson = {
  personId: string;
  routineIds: string[];
};

interface InviteModalProps {
  roleId: string;
  onClose: () => void;
}

export function InviteModal({ roleId, onClose }: InviteModalProps) {
  const [email, setEmail] = useState('');
  const [permissions, setPermissions] = useState<'READ_ONLY' | 'TASK_COMPLETION' | 'FULL_EDIT'>('TASK_COMPLETION');
  const [sharedPersons, setSharedPersons] = useState<SharedPerson[]>([]);
  const [expandedPersonIds, setExpandedPersonIds] = useState<string[]>([]);

  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Get list of persons (children) to share
  const { data: persons, isLoading: personsLoading } = trpc.person.list.useQuery({ roleId });

  // Get routines for each person - we'll fetch all routines for the role
  // and filter by person assignments client-side for efficiency
  const { data: allRoutines, isLoading: routinesLoading } = trpc.routine.list.useQuery({ roleId });

  // Build a map of personId -> their routines
  const routinesByPerson = useMemo(() => {
    const map: Record<string, Array<{ id: string; name: string }>> = {};

    if (allRoutines && persons) {
      for (const person of persons) {
        map[person.id] = [];
      }

      for (const routine of allRoutines) {
        // Check if routine is assigned to each person
        if (routine.assignments) {
          for (const assignment of routine.assignments) {
            const personId = assignment.person?.id;
            if (personId && map[personId]) {
              map[personId].push({
                id: routine.id,
                name: routine.name,
              });
            }
          }
        }
      }
    }

    return map;
  }, [allRoutines, persons]);

  const inviteMutation = trpc.coParent.invite.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Invitation sent successfully',
        variant: 'success',
      });
      utils.coParent.list.invalidate();
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

  // Validation: at least one kid with at least one routine must be selected
  const isValid = useMemo(() => {
    return sharedPersons.some(sp => sp.routineIds.length > 0);
  }, [sharedPersons]);

  // Helper to check if a person is selected
  const isPersonSelected = (personId: string) => {
    return sharedPersons.some(sp => sp.personId === personId);
  };

  // Helper to get selected routine IDs for a person
  const getSelectedRoutineIds = (personId: string): string[] => {
    const sp = sharedPersons.find(sp => sp.personId === personId);
    return sp?.routineIds || [];
  };

  // Toggle person selection (selects/deselects all their routines)
  const togglePerson = (personId: string) => {
    const isSelected = isPersonSelected(personId);

    if (isSelected) {
      // Deselect person - remove from sharedPersons
      setSharedPersons(prev => prev.filter(sp => sp.personId !== personId));
      // Collapse the section
      setExpandedPersonIds(prev => prev.filter(id => id !== personId));
    } else {
      // Select person - add with all their routines selected by default
      const personRoutines = routinesByPerson[personId] || [];
      setSharedPersons(prev => [
        ...prev,
        {
          personId,
          routineIds: personRoutines.map(r => r.id),
        },
      ]);
      // Expand the section to show routines
      setExpandedPersonIds(prev => [...prev, personId]);
    }
  };

  // Toggle individual routine selection for a person
  const toggleRoutine = (personId: string, routineId: string) => {
    setSharedPersons(prev => {
      const existingIndex = prev.findIndex(sp => sp.personId === personId);
      const existing = prev[existingIndex];

      if (existingIndex === -1 || !existing) {
        // Person not yet in list - should not happen if UI is correct
        return prev;
      }

      const isRoutineSelected = existing.routineIds.includes(routineId);

      let newRoutineIds: string[];
      if (isRoutineSelected) {
        newRoutineIds = existing.routineIds.filter(id => id !== routineId);
      } else {
        newRoutineIds = [...existing.routineIds, routineId];
      }

      // If no routines selected, remove the person entirely
      if (newRoutineIds.length === 0) {
        return prev.filter(sp => sp.personId !== personId);
      }

      const newArray = [...prev];
      newArray[existingIndex] = {
        ...existing,
        routineIds: newRoutineIds,
      };
      return newArray;
    });
  };

  // Toggle expanded state for a person
  const toggleExpanded = (personId: string) => {
    setExpandedPersonIds(prev =>
      prev.includes(personId)
        ? prev.filter(id => id !== personId)
        : [...prev, personId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) {
      toast({
        title: 'Error',
        description: 'Please select at least one child with at least one routine',
        variant: 'destructive',
      });
      return;
    }

    // Extract personIds for backward compatibility
    const personIds = sharedPersons.map(sp => sp.personId);

    inviteMutation.mutate({
      roleId,
      email,
      permissions,
      personIds,
      sharedPersons, // New field with routine selections
    });
  };

  const selectAll = () => {
    if (persons) {
      const newSharedPersons: SharedPerson[] = persons.map((p: any) => ({
        personId: p.id,
        routineIds: (routinesByPerson[p.id] || []).map(r => r.id),
      })).filter(sp => sp.routineIds.length > 0);

      setSharedPersons(newSharedPersons);
      setExpandedPersonIds(newSharedPersons.map(sp => sp.personId));
    }
  };

  const deselectAll = () => {
    setSharedPersons([]);
    setExpandedPersonIds([]);
  };

  const parseAvatar = (avatar: string) => {
    try {
      return JSON.parse(avatar);
    } catch {
      return { emoji: '👤', color: '#FFB3BA' };
    }
  };

  // Count total selected routines
  const totalSelectedRoutines = sharedPersons.reduce((sum, sp) => sum + sp.routineIds.length, 0);

  const isLoading = personsLoading || routinesLoading;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invite Co-Parent</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="coparent@example.com"
              className="mt-1"
            />
            <p className="text-sm text-gray-500 mt-1">
              They will receive an invitation to access your children's routines
            </p>
          </div>

          {/* Permissions Selector */}
          <div>
            <Label htmlFor="permissions">Permission Level *</Label>
            <select
              id="permissions"
              value={permissions}
              onChange={(e) => setPermissions(e.target.value as any)}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="READ_ONLY">Read Only - View routines and tasks</option>
              <option value="TASK_COMPLETION">Task Completion - View and complete tasks</option>
              <option value="FULL_EDIT">Full Edit - Manage routines and tasks</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              {permissions === 'READ_ONLY' && 'Can view but not modify anything'}
              {permissions === 'TASK_COMPLETION' && 'Can complete tasks but not edit routines'}
              {permissions === 'FULL_EDIT' && 'Can create, edit, and delete routines and tasks'}
            </p>
          </div>

          {/* Children and Routines Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Select Children & Routines to Share *</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Select All
                </button>
                <span className="text-gray-400">|</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-4 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading children and routines...
              </div>
            ) : persons && persons.length > 0 ? (
              <div className="border rounded-lg p-4 space-y-2 max-h-80 overflow-y-auto">
                {persons.map((person: any) => {
                  const avatar = parseAvatar(person.avatar);
                  const personRoutines = routinesByPerson[person.id] || [];
                  const isSelected = isPersonSelected(person.id);
                  const isExpanded = expandedPersonIds.includes(person.id);
                  const selectedRoutineIds = getSelectedRoutineIds(person.id);

                  return (
                    <Collapsible
                      key={person.id}
                      open={isExpanded && isSelected}
                      onOpenChange={() => isSelected && toggleExpanded(person.id)}
                    >
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        {/* Person Row */}
                        <div
                          className={`flex items-center gap-3 p-3 transition-colors ${
                            isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <Checkbox
                            id={`person-${person.id}`}
                            checked={isSelected}
                            onChange={() => togglePerson(person.id)}
                          />
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                            style={{ backgroundColor: avatar.color + '20' }}
                          >
                            {avatar.emoji}
                          </div>
                          <label
                            htmlFor={`person-${person.id}`}
                            className="flex-1 cursor-pointer font-medium text-gray-900"
                          >
                            {person.name}
                          </label>

                          {/* Routine count badge */}
                          {personRoutines.length > 0 && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                              {selectedRoutineIds.length}/{personRoutines.length} routines
                            </span>
                          )}

                          {/* Expand/collapse button - only visible when selected */}
                          {isSelected && personRoutines.length > 0 && (
                            <CollapsibleTrigger asChild>
                              <button
                                type="button"
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-gray-500" />
                                )}
                              </button>
                            </CollapsibleTrigger>
                          )}
                        </div>

                        {/* Routines (collapsible) */}
                        <CollapsibleContent>
                          {personRoutines.length > 0 ? (
                            <div className="bg-gray-50 border-t border-gray-200 p-3 pl-14 space-y-2">
                              {personRoutines.map((routine) => {
                                const isRoutineSelected = selectedRoutineIds.includes(routine.id);
                                return (
                                  <div
                                    key={routine.id}
                                    className="flex items-center gap-2"
                                  >
                                    <div className="text-gray-400 text-sm">|--</div>
                                    <Checkbox
                                      id={`routine-${person.id}-${routine.id}`}
                                      checked={isRoutineSelected}
                                      onChange={() => toggleRoutine(person.id, routine.id)}
                                    />
                                    <label
                                      htmlFor={`routine-${person.id}-${routine.id}`}
                                      className="cursor-pointer text-sm text-gray-700"
                                    >
                                      {routine.name}
                                    </label>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="bg-gray-50 border-t border-gray-200 p-3 pl-14">
                              <p className="text-sm text-gray-500 italic">
                                No routines assigned to this child
                              </p>
                            </div>
                          )}
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-gray-500">No children available</p>
                <p className="text-sm text-gray-400 mt-1">Add children first to share with co-parent</p>
              </div>
            )}
          </div>

          {/* Selected Summary */}
          {sharedPersons.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>{sharedPersons.length}</strong> {sharedPersons.length === 1 ? 'child' : 'children'} selected
                {' with '}
                <strong>{totalSelectedRoutines}</strong> {totalSelectedRoutines === 1 ? 'routine' : 'routines'} to share
              </p>
            </div>
          )}

          {/* Buttons */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={inviteMutation.isPending || !isValid}
            >
              {inviteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
