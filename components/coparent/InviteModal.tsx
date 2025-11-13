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
import { Checkbox } from '@/components/ui/checkbox';
import { Send } from 'lucide-react';

interface InviteModalProps {
  roleId: string;
  onClose: () => void;
}

export function InviteModal({ roleId, onClose }: InviteModalProps) {
  const [email, setEmail] = useState('');
  const [permissions, setPermissions] = useState<'READ_ONLY' | 'TASK_COMPLETION' | 'FULL_EDIT'>('TASK_COMPLETION');
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>([]);

  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Get list of persons (children) to share
  const { data: persons, isLoading: personsLoading } = trpc.person.list.useQuery({ roleId });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedPersonIds.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one child to share',
        variant: 'destructive',
      });
      return;
    }

    inviteMutation.mutate({
      roleId,
      email,
      permissions,
      personIds: selectedPersonIds,
    });
  };

  const togglePerson = (personId: string) => {
    setSelectedPersonIds(prev =>
      prev.includes(personId)
        ? prev.filter(id => id !== personId)
        : [...prev, personId]
    );
  };

  const selectAll = () => {
    if (persons) {
      setSelectedPersonIds(persons.map((p: any) => p.id));
    }
  };

  const deselectAll = () => {
    setSelectedPersonIds([]);
  };

  const parseAvatar = (avatar: string) => {
    try {
      return JSON.parse(avatar);
    } catch {
      return { emoji: '👤', color: '#FFB3BA' };
    }
  };

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
            <Select
              id="permissions"
              value={permissions}
              onChange={(e) => setPermissions(e.target.value as any)}
              className="mt-1"
            >
              <option value="READ_ONLY">Read Only - View routines and tasks</option>
              <option value="TASK_COMPLETION">Task Completion - View and complete tasks</option>
              <option value="FULL_EDIT">Full Edit - Manage routines and tasks</option>
            </Select>
            <p className="text-sm text-gray-500 mt-1">
              {permissions === 'READ_ONLY' && 'Can view but not modify anything'}
              {permissions === 'TASK_COMPLETION' && 'Can complete tasks but not edit routines'}
              {permissions === 'FULL_EDIT' && 'Can create, edit, and delete routines and tasks'}
            </p>
          </div>

          {/* Children Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Select Children to Share *</Label>
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

            {personsLoading ? (
              <div className="text-center py-4 text-gray-500">Loading children...</div>
            ) : persons && persons.length > 0 ? (
              <div className="border rounded-lg p-4 space-y-3 max-h-64 overflow-y-auto">
                {persons.map((person: any) => {
                  const avatar = parseAvatar(person.avatar);
                  return (
                    <div
                      key={person.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Checkbox
                        id={`person-${person.id}`}
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
                        htmlFor={`person-${person.id}`}
                        className="flex-1 cursor-pointer font-medium text-gray-900"
                      >
                        {person.name}
                      </label>
                    </div>
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

          {/* Selected Count */}
          {selectedPersonIds.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>{selectedPersonIds.length}</strong> {selectedPersonIds.length === 1 ? 'child' : 'children'} selected
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
              disabled={inviteMutation.isPending || selectedPersonIds.length === 0}
            >
              {inviteMutation.isPending ? (
                <>Sending...</>
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
