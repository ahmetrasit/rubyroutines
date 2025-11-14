'use client';

import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, RotateCcw } from 'lucide-react';
import { PASTEL_COLORS, COMMON_EMOJIS, parseAvatar, serializeAvatar } from '@/lib/utils/avatar';
import { useCreateMutation, useUpdateMutation } from '@/lib/hooks';
import { EntityStatus } from '@/lib/types/prisma-enums';
import { useToast } from '@/components/ui/toast';
import type { Person } from '@/lib/types/database';

interface PersonFormProps {
  person?: Person;
  roleId?: string;
  classroomId?: string;
  onClose: () => void;
}

export function PersonForm({ person, roleId, classroomId, onClose }: PersonFormProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'restore'>('create');
  // Parse existing avatar data if editing
  const initialAvatar = parseAvatar(person?.avatar, person?.name);
  const initialColor = initialAvatar.color;
  const initialEmoji = initialAvatar.emoji;

  const [name, setName] = useState(person?.name || '');
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [selectedEmoji, setSelectedEmoji] = useState(initialEmoji);
  const [emojiSearch, setEmojiSearch] = useState('');

  const utils = trpc.useUtils();
  const { toast } = useToast();

  // Query for inactive persons (only when roleId is provided and not editing)
  const { data: allPersons } = trpc.person.list.useQuery(
    { roleId: roleId!, includeInactive: true },
    { enabled: !!roleId && !person }
  );

  const inactivePersons = useMemo(() => {
    return allPersons?.filter((p: any) => p.status === EntityStatus.INACTIVE) || [];
  }, [allPersons]);

  const filteredEmojis = useMemo(() => {
    if (!emojiSearch) return COMMON_EMOJIS;
    const search = emojiSearch.toLowerCase();
    return COMMON_EMOJIS.filter(
      (item) =>
        item.name.includes(search) ||
        item.keywords.includes(search) ||
        item.emoji.includes(search)
    );
  }, [emojiSearch]);

  const addMemberMutation = trpc.group.addMember.useMutation();

  const restoreMutation = trpc.person.restore.useMutation({
    onSuccess: async (restoredPerson) => {
      // If classroomId is provided, add the person to the classroom
      if (classroomId && restoredPerson?.id) {
        try {
          await addMemberMutation.mutateAsync({
            groupId: classroomId,
            personId: restoredPerson.id,
          });
          utils.group.getById.invalidate();
          utils.group.list.invalidate();
        } catch (error) {
          console.error('Failed to add restored person to classroom:', error);
        }
      }

      toast({
        title: 'Success',
        description: `${restoredPerson.name} has been restored`,
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

  const createMutationBase = trpc.person.create.useMutation({
    onSuccess: async (newPerson) => {
      // If classroomId is provided, add the person to the classroom
      if (classroomId && newPerson?.id) {
        try {
          await addMemberMutation.mutateAsync({
            groupId: classroomId,
            personId: newPerson.id,
          });
          // Invalidate both person list and group queries
          utils.person.list.invalidate();
          utils.group.getById.invalidate();
          utils.group.list.invalidate();
        } catch (error) {
          console.error('Failed to add person to classroom:', error);
        }
      }
    },
  });

  const { mutate: createPerson, isLoading: isCreating } = useCreateMutation(
    createMutationBase,
    {
      entityName: 'Person',
      invalidateQueries: [() => utils.person.list.invalidate()],
      closeDialog: onClose,
    }
  );

  const updateMutationBase = trpc.person.update.useMutation();
  const { mutate: updatePerson, isLoading: isUpdating } = useUpdateMutation(
    updateMutationBase,
    {
      entityName: 'Person',
      invalidateQueries: [() => utils.person.list.invalidate()],
      closeDialog: onClose,
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const avatarData = serializeAvatar({
      color: selectedColor,
      emoji: selectedEmoji,
    });

    if (person) {
      updatePerson({
        id: person.id,
        name: name || undefined,
        avatar: avatarData,
      });
    } else if (roleId) {
      createPerson({
        roleId,
        name,
        avatar: avatarData,
      });
    }
  };

  const isLoading = isCreating || isUpdating;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{person ? 'Edit Person' : 'Add New Member'}</DialogTitle>
        </DialogHeader>

        {/* Tabs - only show when adding new (not editing) and has inactive persons */}
        {!person && inactivePersons.length > 0 && (
          <div className="flex gap-2 border-b">
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'create'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Create New
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('restore')}
              className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'restore'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <RotateCcw className="h-4 w-4" />
              Restore ({inactivePersons.length})
            </button>
          </div>
        )}

        {/* Create New Tab */}
        {activeTab === 'create' && (
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Field */}
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              placeholder="Enter name"
              className="mt-1"
            />
          </div>

          {/* Color Palette */}
          <div>
            <Label>Choose Color</Label>
            <div className="grid grid-cols-8 gap-2 mt-2">
              {PASTEL_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-10 h-10 rounded-full transition-all ${
                    selectedColor === color
                      ? 'ring-4 ring-offset-2 ring-gray-400 scale-105'
                      : 'hover:scale-105 hover:ring-2 hover:ring-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Emoji Picker */}
          <div>
            <Label>Choose Emoji</Label>

            {/* Search */}
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search emoji... (e.g., cat, smile, star)"
                value={emojiSearch}
                onChange={(e) => setEmojiSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Emoji Grid */}
            <div className="grid grid-cols-8 gap-2 mt-3 max-h-48 overflow-y-auto p-2 border rounded-lg">
              {filteredEmojis.map((item) => (
                <button
                  key={item.emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(item.emoji)}
                  className={`text-3xl p-2 rounded-lg transition-all ${
                    selectedEmoji === item.emoji
                      ? 'bg-primary-100 ring-2 ring-primary-500 scale-110'
                      : 'hover:bg-gray-100'
                  }`}
                  title={item.name}
                >
                  {item.emoji}
                </button>
              ))}
            </div>
            {filteredEmojis.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No emojis found. Try a different search term.
              </p>
            )}
          </div>

          {/* Preview Section */}
          <div className="border-t pt-4">
            <Label className="mb-3 block">Preview</Label>
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
                  style={{ backgroundColor: selectedColor + '20' }}
                >
                  {selectedEmoji}
                </div>
                <div>
                  <p className="text-xl font-semibold">
                    {name || 'Enter a name'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    This is how the person card will appear
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name}>
              {isLoading ? 'Saving...' : person ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
        )}

        {/* Restore Tab */}
        {activeTab === 'restore' && (
          <div className="space-y-4">
            {inactivePersons.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No archived persons to restore</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {inactivePersons.map((inactivePerson: any) => {
                  const avatar = parseAvatar(inactivePerson.avatar, inactivePerson.name);
                  return (
                    <div
                      key={inactivePerson.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                          style={{ backgroundColor: avatar.color }}
                        >
                          {avatar.emoji}
                        </div>
                        <div>
                          <p className="font-medium">{inactivePerson.name}</p>
                          {inactivePerson.archivedAt && (
                            <p className="text-sm text-gray-500">
                              Archived {new Date(inactivePerson.archivedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => restoreMutation.mutate({ id: inactivePerson.id })}
                        disabled={restoreMutation.isPending}
                        className="gap-2"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Restore
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
