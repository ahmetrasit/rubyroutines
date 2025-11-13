'use client';

import { useState } from 'react';
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
import { Select } from '@/components/ui/select';
import { Share2 } from 'lucide-react';

interface ShareModalProps {
  roleId: string;
  groupId?: string;
  onClose: () => void;
}

export function ShareModal({ roleId, groupId: initialGroupId, onClose }: ShareModalProps) {
  const [email, setEmail] = useState('');
  const [permissions, setPermissions] = useState<'VIEW' | 'EDIT_TASKS' | 'FULL_EDIT'>('EDIT_TASKS');
  const [selectedGroupId, setSelectedGroupId] = useState(initialGroupId || '');

  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Get list of groups (classrooms)
  const { data: groups, isLoading: groupsLoading } = trpc.group.list.useQuery({ roleId });

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

    shareMutation.mutate({
      roleId,
      groupId: selectedGroupId,
      email,
      permissions,
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
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
              <Select
                id="classroom"
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="mt-1"
                required
              >
                <option value="">Select a classroom...</option>
                {groups.map((group: any) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </Select>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg mt-1">
                <p className="text-gray-500">No classrooms available</p>
                <p className="text-sm text-gray-400 mt-1">Create a classroom first</p>
              </div>
            )}
          </div>

          {/* Permissions Selector */}
          <div>
            <Label htmlFor="permissions">Permission Level *</Label>
            <Select
              id="permissions"
              value={permissions}
              onChange={(e) => setPermissions(e.target.value as any)}
              className="mt-1"
            >
              <option value="VIEW">View Only - View students and tasks</option>
              <option value="EDIT_TASKS">Edit Tasks - View and complete tasks</option>
              <option value="FULL_EDIT">Full Edit - Manage students, routines, and tasks</option>
            </Select>
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
              disabled={shareMutation.isPending || !selectedGroupId}
            >
              {shareMutation.isPending ? (
                <>Sending...</>
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
