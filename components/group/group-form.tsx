'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';

import { GroupType } from '@/lib/types/prisma-enums';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface GroupFormProps {
  group?: any;
  roleId?: string;
  roleType?: 'PARENT' | 'TEACHER';
  onClose: () => void;
}

export function GroupForm({ group, roleId, roleType, onClose }: GroupFormProps) {
  const isTeacherMode = roleType === 'TEACHER';
  const defaultType = isTeacherMode ? GroupType.CLASSROOM : GroupType.FAMILY;

  const [name, setName] = useState(group?.name || '');
  const [type, setType] = useState<GroupType>(group?.type || defaultType);
  const [description, setDescription] = useState(group?.description || '');

  const { toast } = useToast();
  const utils = trpc.useUtils();

  const createMutation = trpc.group.create.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Group created successfully',
        variant: 'success',
      });
      utils.group.list.invalidate();
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

  const updateMutation = trpc.group.update.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Group updated successfully',
        variant: 'success',
      });
      utils.group.list.invalidate();
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

    if (group) {
      updateMutation.mutate({
        id: group.id,
        name,
        description: description || undefined,
      });
    } else if (roleId) {
      createMutation.mutate({
        roleId,
        name,
        type,
        description: description || undefined,
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {group
              ? isTeacherMode ? 'Edit Classroom' : 'Edit Group'
              : isTeacherMode ? 'Create New Classroom' : 'Create New Group'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="name">{isTeacherMode ? 'Classroom Name' : 'Group Name'} *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              placeholder=""
              className="mt-1"
            />
          </div>

          {!group && !isTeacherMode && (
            <div>
              <Label htmlFor="type">Type *</Label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as GroupType)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value={GroupType.FAMILY}>Family</option>
                <option value={GroupType.CLASSROOM}>Classroom</option>
                <option value={GroupType.CUSTOM}>Custom</option>
              </select>
            </div>
          )}

          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Optional description..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name}>
              {isLoading ? 'Saving...' : group ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
