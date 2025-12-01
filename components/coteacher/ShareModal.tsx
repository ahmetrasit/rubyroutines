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
import { Share2, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';

// Type for per-student routine sharing
type SharedPerson = {
  personId: string;
  routineIds: string[];
};

interface ShareModalProps {
  roleId: string;
  groupId?: string;
  onClose: () => void;
}

export function ShareModal({ roleId, groupId: initialGroupId, onClose }: ShareModalProps) {
  const [email, setEmail] = useState('');
  const [permissions, setPermissions] = useState<'VIEW' | 'EDIT_TASKS' | 'FULL_EDIT'>('EDIT_TASKS');
  const [selectedGroupId, setSelectedGroupId] = useState(initialGroupId || '');
  const [sharedPersons, setSharedPersons] = useState<SharedPerson[]>([]);
  const [expandedPersonIds, setExpandedPersonIds] = useState<string[]>([]);

  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Get list of groups (classrooms)
  const { data: groups, isLoading: groupsLoading } = trpc.group.list.useQuery({ roleId });

  // Get the selected group with members
  const { data: selectedGroup, isLoading: groupLoading } = trpc.group.getById.useQuery(
    { id: selectedGroupId },
    { enabled: !!selectedGroupId }
  );

  // Get routines for the role
  const { data: allRoutines, isLoading: routinesLoading } = trpc.routine.list.useQuery(
    { roleId },
    { enabled: !!selectedGroupId }
  );

  // Get students from the selected group (filter out teachers)
  const students = useMemo(() => {
    if (!selectedGroup?.members) return [];
    return selectedGroup.members
      .filter((m: any) => !m.person.isTeacher && !m.person.isAccountOwner)
      .map((m: any) => m.person);
  }, [selectedGroup]);

  // Build a map of studentId -> their routines (routines assigned to this student)
  const routinesByStudent = useMemo(() => {
    const map: Record<string, Array<{ id: string; name: string }>> = {};

    if (allRoutines && students) {
      for (const student of students) {
        map[student.id] = [];
      }

      for (const routine of allRoutines) {
        // Check if routine is assigned to each student
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
  }, [allRoutines, students]);

  const shareMutation = trpc.coTeacher.share.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Invitation sent successfully',
        variant: 'success',
      });
      utils.coTeacher.list.invalidate();
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

  // Validation: at least one student with at least one routine must be selected
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
      const personRoutines = routinesByStudent[personId] || [];
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

  // When group changes, reset selections
  const handleGroupChange = (groupId: string) => {
    setSelectedGroupId(groupId);
    setSharedPersons([]);
    setExpandedPersonIds([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedGroupId) {
      toast({
        title: 'Error',
        description: 'Please select a classroom',
        variant: 'destructive',
      });
      return;
    }

    if (!isValid) {
      toast({
        title: 'Error',
        description: 'Please select at least one student with at least one routine',
        variant: 'destructive',
      });
      return;
    }

    shareMutation.mutate({
      roleId,
      groupId: selectedGroupId,
      email,
      permissions,
      sharedPersons,
    });
  };

  const selectAll = () => {
    if (students) {
      const newSharedPersons: SharedPerson[] = students.map((s: any) => ({
        personId: s.id,
        routineIds: (routinesByStudent[s.id] || []).map(r => r.id),
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
      return { emoji: '', color: '#FFB3BA' };
    }
  };

  // Count total selected routines
  const totalSelectedRoutines = sharedPersons.reduce((sum, sp) => sum + sp.routineIds.length, 0);

  const isLoading = groupLoading || routinesLoading;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share Classroom</DialogTitle>
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
              placeholder="coteacher@example.com"
              className="mt-1"
            />
            <p className="text-sm text-gray-500 mt-1">
              They will receive an invitation to access this classroom
            </p>
          </div>

          {/* Classroom/Group Selector */}
          <div>
            <Label htmlFor="classroom">Classroom *</Label>
            {groupsLoading ? (
              <div className="text-center py-4 text-gray-500">Loading classrooms...</div>
            ) : groups && groups.length > 0 ? (
              <select
                id="classroom"
                value={selectedGroupId}
                onChange={(e) => handleGroupChange(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="">Select a classroom...</option>
                {groups.map((group: any) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg mt-1">
                <p className="text-gray-500">No classrooms available</p>
                <p className="text-sm text-gray-400 mt-1">Create a classroom first</p>
              </div>
            )}
          </div>

          {/* Students and Routines Selection (only show when group is selected) */}
          {selectedGroupId && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Select Students & Routines to Share *</Label>
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
                  Loading students and routines...
                </div>
              ) : students && students.length > 0 ? (
                <div className="border rounded-lg p-4 space-y-2 max-h-80 overflow-y-auto">
                  {students.map((student: any) => {
                    const avatar = parseAvatar(student.avatar || '{}');
                    const studentRoutines = routinesByStudent[student.id] || [];
                    const isSelected = isPersonSelected(student.id);
                    const isExpanded = expandedPersonIds.includes(student.id);
                    const selectedRoutineIds = getSelectedRoutineIds(student.id);

                    return (
                      <Collapsible
                        key={student.id}
                        open={isExpanded && isSelected}
                        onOpenChange={() => isSelected && toggleExpanded(student.id)}
                      >
                        <div className="rounded-lg border border-gray-200 overflow-hidden">
                          {/* Student Row */}
                          <div
                            className={`flex items-center gap-3 p-3 transition-colors ${
                              isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                            }`}
                          >
                            <Checkbox
                              id={`student-${student.id}`}
                              checked={isSelected}
                              onChange={() => togglePerson(student.id)}
                            />
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                              style={{ backgroundColor: (avatar.color || '#FFB3BA') + '20' }}
                            >
                              {avatar.emoji || ''}
                            </div>
                            <label
                              htmlFor={`student-${student.id}`}
                              className="flex-1 cursor-pointer font-medium text-gray-900"
                            >
                              {student.name}
                            </label>

                            {/* Routine count badge */}
                            {studentRoutines.length > 0 && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                {selectedRoutineIds.length}/{studentRoutines.length} routines
                              </span>
                            )}

                            {/* Expand/collapse button - only visible when selected */}
                            {isSelected && studentRoutines.length > 0 && (
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
                            {studentRoutines.length > 0 ? (
                              <div className="bg-gray-50 border-t border-gray-200 p-3 pl-14 space-y-2">
                                {studentRoutines.map((routine) => {
                                  const isRoutineSelected = selectedRoutineIds.includes(routine.id);
                                  return (
                                    <div
                                      key={routine.id}
                                      className="flex items-center gap-2"
                                    >
                                      <div className="text-gray-400 text-sm">|--</div>
                                      <Checkbox
                                        id={`routine-${student.id}-${routine.id}`}
                                        checked={isRoutineSelected}
                                        onChange={() => toggleRoutine(student.id, routine.id)}
                                      />
                                      <label
                                        htmlFor={`routine-${student.id}-${routine.id}`}
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
                                  No routines assigned to this student
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
                  <p className="text-gray-500">No students in this classroom</p>
                  <p className="text-sm text-gray-400 mt-1">Add students first to share with co-teacher</p>
                </div>
              )}
            </div>
          )}

          {/* Selected Summary */}
          {sharedPersons.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>{sharedPersons.length}</strong> {sharedPersons.length === 1 ? 'student' : 'students'} selected
                {' with '}
                <strong>{totalSelectedRoutines}</strong> {totalSelectedRoutines === 1 ? 'routine' : 'routines'} to share
              </p>
            </div>
          )}

          {/* Permissions Selector */}
          <div>
            <Label htmlFor="permissions">Permission Level *</Label>
            <select
              id="permissions"
              value={permissions}
              onChange={(e) => setPermissions(e.target.value as any)}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="VIEW">View Only - View students and tasks</option>
              <option value="EDIT_TASKS">Edit Tasks - View and complete tasks</option>
              <option value="FULL_EDIT">Full Edit - Manage students, routines, and tasks</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              {permissions === 'VIEW' && 'Can view but not modify anything'}
              {permissions === 'EDIT_TASKS' && 'Can complete tasks but not edit routines'}
              {permissions === 'FULL_EDIT' && 'Can create, edit, and delete students, routines, and tasks'}
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> The co-teacher will receive an email invitation to accept access to your classroom.
            </p>
          </div>

          {/* Buttons */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={shareMutation.isPending || !selectedGroupId || !isValid}
            >
              {shareMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-2" />
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
