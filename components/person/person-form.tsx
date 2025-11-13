'use client';


import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PersonFormProps {
  person?: any;
  roleId?: string;
  onClose: () => void;
}

export function PersonForm({ person, roleId, onClose }: PersonFormProps) {
  const [name, setName] = useState(person?.name || '');
  const [birthDate, setBirthDate] = useState(
    person?.birthDate ? new Date(person.birthDate).toISOString().split('T')[0] : ''
  );
  const [avatar, setAvatar] = useState(person?.avatar || '');
  const [notes, setNotes] = useState(person?.notes || '');

  const { toast } = useToast();
  const utils = trpc.useUtils();

  const createMutation = trpc.person.create.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Person created successfully',
        variant: 'success',
      });
      utils.person.list.invalidate();
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

  const updateMutation = trpc.person.update.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Person updated successfully',
        variant: 'success',
      });
      utils.person.list.invalidate();
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

    if (person) {
      updateMutation.mutate({
        id: person.id,
        name: name || undefined,
        birthDate: birthDate ? new Date(birthDate) : null,
        avatar: avatar || null,
        notes: notes || null,
      });
    } else if (roleId) {
      createMutation.mutate({
        roleId,
        name,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        avatar: avatar || undefined,
        notes: notes || undefined,
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{person ? 'Edit Person' : 'Add New Person'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              placeholder="Enter name"
            />
          </div>

          <div>
            <Label htmlFor="birthDate">Birth Date</Label>
            <Input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="avatar">Avatar URL</Label>
            <Input
              id="avatar"
              type="url"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="Add notes..."
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : person ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
