'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { UserX, Edit, Mail } from 'lucide-react';

interface CoParentListProps {
  roleId: string;
}

export function CoParentList({ roleId }: CoParentListProps) {
  const [editingCoParent, setEditingCoParent] = useState<any>(null);
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<'READ_ONLY' | 'TASK_COMPLETION' | 'FULL_EDIT'>('TASK_COMPLETION');

  const { toast } = useToast();
  const utils = trpc.useUtils();

  const { data: coParents, isLoading } = trpc.coParent.list.useQuery({ roleId });
  const { data: persons } = trpc.person.list.useQuery({ roleId });

  const updateMutation = trpc.coParent.updatePermissions.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Permissions updated successfully',
        variant: 'success',
      });
      utils.coParent.list.invalidate();
      setEditingCoParent(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const revokeMutation = trpc.coParent.revoke.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Co-parent access revoked',
        variant: 'success',
      });
      utils.coParent.list.invalidate();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleEdit = (coParent: any) => {
    setEditingCoParent(coParent);
    setPermissions(coParent.permissions);
    setSelectedPersonIds(coParent.personIds || []);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedPersonIds.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one child',
        variant: 'destructive',
      });
      return;
    }

    updateMutation.mutate({
      coParentId: editingCoParent.id,
      permissions,
      personIds: selectedPersonIds,
    });
  };

  const handleRevoke = (coParentId: string, name: string) => {
    if (confirm(`Are you sure you want to revoke ${name}'s access?`)) {
      revokeMutation.mutate({ coParentId });
    }
  };

  const togglePerson = (personId: string) => {
    setSelectedPersonIds(prev =>
      prev.includes(personId)
        ? prev.filter(id => id !== personId)
        : [...prev, personId]
    );
  };

  const getSharedChildren = (personIds: string[]) => {
    if (!persons) return [];
    return persons.filter((p: any) => personIds.includes(p.id));
  };

  const getPermissionBadge = (permission: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      READ_ONLY: { label: 'Read Only', className: 'bg-gray-100 text-gray-800' },
      TASK_COMPLETION: { label: 'Task Completion', className: 'bg-blue-100 text-blue-800' },
      FULL_EDIT: { label: 'Full Edit', className: 'bg-green-100 text-green-800' },
    };
    const variant = variants[permission] ?? variants.READ_ONLY;
    return (
      <Badge className={variant!.className}>
        {variant!.label}
      </Badge>
    );
  };

  const parseAvatar = (avatar: string) => {
    try {
      return JSON.parse(avatar);
    } catch {
      return { emoji: '👤', color: '#FFB3BA' };
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">Loading co-parents...</div>
        </CardContent>
      </Card>
    );
  }

  if (!coParents || coParents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Co-Parents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-gray-500 mb-2">No co-parents yet</p>
            <p className="text-sm text-gray-400">
              Invite a co-parent to share access to your children's routines
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Co-Parents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {coParents.map((coParent: any) => {
              const sharedChildren = getSharedChildren(coParent.personIds);
              return (
                <div
                  key={coParent.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Mail className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {coParent.coParentUser.name || 'Unnamed User'}
                        </h3>
                        <p className="text-sm text-gray-600">{coParent.coParentUser.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(coParent)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRevoke(coParent.id, coParent.coParentUser.name)}
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        Revoke
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Permissions:</span>
                      {getPermissionBadge(coParent.permissions)}
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-2">Shared children:</p>
                      <div className="flex flex-wrap gap-2">
                        {sharedChildren.map((child: any) => {
                          const avatar = parseAvatar(child.avatar);
                          return (
                            <div
                              key={child.id}
                              className="flex items-center gap-2 bg-gray-50 rounded-full pl-1 pr-3 py-1"
                            >
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
                                style={{ backgroundColor: avatar.color + '20' }}
                              >
                                {avatar.emoji}
                              </div>
                              <span className="text-sm font-medium">{child.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Edit Permissions Dialog */}
      {editingCoParent && (
        <Dialog open onOpenChange={() => setEditingCoParent(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Co-Parent Permissions</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleUpdateSubmit} className="space-y-6">
              <div>
                <Label>Co-Parent</Label>
                <div className="mt-2 flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{editingCoParent.coParentUser.name}</p>
                    <p className="text-sm text-gray-600">{editingCoParent.coParentUser.email}</p>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-permissions">Permission Level *</Label>
                <select
                  id="edit-permissions"
                  value={permissions}
                  onChange={(e) => setPermissions(e.target.value as any)}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="READ_ONLY">Read Only - View routines and tasks</option>
                  <option value="TASK_COMPLETION">Task Completion - View and complete tasks</option>
                  <option value="FULL_EDIT">Full Edit - Manage routines and tasks</option>
                </select>
              </div>

              <div>
                <Label>Select Children *</Label>
                {persons && persons.length > 0 ? (
                  <div className="border rounded-lg p-4 space-y-3 max-h-64 overflow-y-auto mt-2">
                    {persons.map((person: any) => {
                      const avatar = parseAvatar(person.avatar);
                      return (
                        <div
                          key={person.id}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Checkbox
                            id={`edit-person-${person.id}`}
                            checked={selectedPersonIds.includes(person.id)}
                            onChange={() => togglePerson(person.id)}
                          />
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                            style={{ backgroundColor: avatar.color + '20' }}
                          >
                            {avatar.emoji}
                          </div>
                          <label
                            htmlFor={`edit-person-${person.id}`}
                            className="flex-1 cursor-pointer font-medium text-gray-900"
                          >
                            {person.name}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">No children available</div>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingCoParent(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending || selectedPersonIds.length === 0}
                >
                  {updateMutation.isPending ? 'Updating...' : 'Update Permissions'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
