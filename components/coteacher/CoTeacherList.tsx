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
import { Select } from '@/components/ui/select';
import { UserX, Edit, Mail } from 'lucide-react';

interface CoTeacherListProps {
  groupId: string;
}

export function CoTeacherList({ groupId }: CoTeacherListProps) {
  const [editingCoTeacher, setEditingCoTeacher] = useState<any>(null);
  const [permissions, setPermissions] = useState<'VIEW' | 'EDIT_TASKS' | 'FULL_EDIT'>('EDIT_TASKS');

  const { toast } = useToast();
  const utils = trpc.useUtils();

  const { data: coTeachers, isLoading } = trpc.coTeacher.list.useQuery({ groupId });

  const updateMutation = trpc.coTeacher.updatePermissions.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Permissions updated successfully',
        variant: 'success',
      });
      utils.coTeacher.list.invalidate();
      setEditingCoTeacher(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const revokeMutation = trpc.coTeacher.revoke.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Co-teacher access revoked',
        variant: 'success',
      });
      utils.coTeacher.list.invalidate();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleEdit = (coTeacher: any) => {
    setEditingCoTeacher(coTeacher);
    setPermissions(coTeacher.permissions);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    updateMutation.mutate({
      coTeacherId: editingCoTeacher.id,
      permissions,
    });
  };

  const handleRevoke = (coTeacherId: string, name: string) => {
    if (confirm(`Are you sure you want to revoke ${name}'s access?`)) {
      revokeMutation.mutate({ coTeacherId });
    }
  };

  const getPermissionBadge = (permission: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      VIEW: { label: 'View Only', className: 'bg-gray-100 text-gray-800' },
      EDIT_TASKS: { label: 'Edit Tasks', className: 'bg-blue-100 text-blue-800' },
      FULL_EDIT: { label: 'Full Edit', className: 'bg-green-100 text-green-800' },
    };
    const variant = variants[permission] || variants.VIEW;
    return (
      <Badge className={variant.className}>
        {variant.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">Loading co-teachers...</div>
        </CardContent>
      </Card>
    );
  }

  if (!coTeachers || coTeachers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Co-Teachers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-gray-500 mb-2">No co-teachers yet</p>
            <p className="text-sm text-gray-400">
              Share this classroom with another teacher to collaborate
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
          <CardTitle>Co-Teachers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {coTeachers.map((coTeacher: any) => (
              <div
                key={coTeacher.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Mail className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {coTeacher.coTeacherRole.user.name || 'Unnamed User'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {coTeacher.coTeacherRole.user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(coTeacher)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        handleRevoke(coTeacher.id, coTeacher.coTeacherRole.user.name)
                      }
                    >
                      <UserX className="h-4 w-4 mr-1" />
                      Revoke
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Permissions:</span>
                  {getPermissionBadge(coTeacher.permissions)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Permissions Dialog */}
      {editingCoTeacher && (
        <Dialog open onOpenChange={() => setEditingCoTeacher(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Co-Teacher Permissions</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleUpdateSubmit} className="space-y-6">
              <div>
                <Label>Co-Teacher</Label>
                <div className="mt-2 flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Mail className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {editingCoTeacher.coTeacherRole.user.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {editingCoTeacher.coTeacherRole.user.email}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-permissions">Permission Level *</Label>
                <Select
                  id="edit-permissions"
                  value={permissions}
                  onChange={(e) => setPermissions(e.target.value as any)}
                  className="mt-1"
                >
                  <option value="VIEW">View Only - View students and tasks</option>
                  <option value="EDIT_TASKS">Edit Tasks - View and complete tasks</option>
                  <option value="FULL_EDIT">Full Edit - Manage students, routines, and tasks</option>
                </Select>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingCoTeacher(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
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
