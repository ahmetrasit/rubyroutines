'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
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
import { RotateCcw } from 'lucide-react';
import { PASTEL_COLORS, parseAvatar, serializeAvatar } from '@/lib/utils/avatar';
import { useCreateMutation, useUpdateMutation } from '@/lib/hooks';
import { EntityStatus } from '@/lib/types/prisma-enums';
import { useToast } from '@/components/ui/toast';
import type { Person } from '@/lib/types/database';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { HexColorPicker } from 'react-colorful';

interface PersonFormProps {
  person?: Person;
  roleId?: string;
  classroomId?: string;
  onClose: () => void;
}

export function PersonForm({ person, roleId, classroomId, onClose }: PersonFormProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'existing' | 'restore'>('create');
  // Parse existing avatar data if editing
  const initialAvatar = parseAvatar(person?.avatar, person?.name);
  const initialColor = initialAvatar.color;
  const initialEmoji = initialAvatar.emoji;

  const [name, setName] = useState(person?.name || '');
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [selectedEmoji, setSelectedEmoji] = useState(initialEmoji);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const utils = trpc.useUtils();
  const { toast } = useToast();

  // Query for all persons (only when roleId is provided and not editing)
  const { data: allPersons } = trpc.person.list.useQuery(
    { roleId: roleId!, includeInactive: true },
    { enabled: !!roleId && !person }
  );

  // Query for classroom members to filter out existing members
  const { data: classroom } = trpc.group.getById.useQuery(
    { id: classroomId! },
    { enabled: !!classroomId && !person }
  );

  const inactivePersons = useMemo(() => {
    return allPersons?.filter((p: any) => p.status === EntityStatus.INACTIVE) || [];
  }, [allPersons]);

  const existingPersons = useMemo(() => {
    if (!allPersons || !classroom) return [];
    const memberIds = classroom.members?.map((m: any) => m.personId) || [];
    return allPersons.filter((p: any) =>
      p.status === EntityStatus.ACTIVE &&
      p.name !== 'Me' &&
      !memberIds.includes(p.id)
    );
  }, [allPersons, classroom]);

  // Close pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
    };

    if (showEmojiPicker || showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker, showColorPicker]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setSelectedEmoji(emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const addMemberMutation = trpc.group.addMember.useMutation({
    onSuccess: async () => {
      toast({
        title: 'Success',
        description: 'Student added to classroom',
        variant: 'success',
      });
      utils.person.list.invalidate();
      utils.group.getById.invalidate();
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

        {/* Tabs - only show when adding new (not editing) and has existing/inactive persons */}
        {!person && (existingPersons.length > 0 || inactivePersons.length > 0) && (
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
            {existingPersons.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('existing')}
                className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'existing'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Add Existing ({existingPersons.length})
              </button>
            )}
            {inactivePersons.length > 0 && (
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
            )}
          </div>
        )}

        {/* Create New Tab */}
        {activeTab === 'create' && (
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Emoji and Name Row */}
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-2 relative">
              <Label htmlFor="emoji">Emoji</Label>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-full h-10 rounded-md border border-gray-300 flex items-center justify-center text-2xl hover:bg-gray-50 transition-colors"
              >
                {selectedEmoji}
              </button>
              {showEmojiPicker && (
                <div ref={emojiPickerRef} className="absolute z-50 top-full mt-2 left-0">
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    searchPlaceHolder="Search emoji..."
                    width={320}
                    height={400}
                  />
                </div>
              )}
            </div>
            <div className="col-span-10">
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
          </div>

          {/* Color Picker */}
          <div className="relative">
            <Label>Color</Label>
            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="mt-2 w-full h-10 rounded-md border border-gray-300 flex items-center gap-3 px-3 hover:bg-gray-50 transition-colors"
            >
              <div
                className="w-6 h-6 rounded-full border-2 border-gray-300"
                style={{ backgroundColor: selectedColor }}
              />
              <span className="text-sm text-gray-700">{selectedColor}</span>
            </button>
            {showColorPicker && (
              <div ref={colorPickerRef} className="absolute z-50 top-full mt-2 p-3 bg-white rounded-lg shadow-lg border">
                <HexColorPicker color={selectedColor} onChange={setSelectedColor} />
                <div className="mt-3 pt-3 border-t">
                  <Label className="text-xs mb-2 block">Quick Colors</Label>
                  <div className="grid grid-cols-6 gap-2">
                    {PASTEL_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          setSelectedColor(color);
                          setShowColorPicker(false);
                        }}
                        className="w-8 h-8 rounded-full border-2 border-gray-200 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Preview Section */}
          <div className="border-t pt-4">
            <Label className="mb-3 block">Preview</Label>
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-4xl border-4"
                  style={{ backgroundColor: selectedColor + '20', borderColor: selectedColor }}
                >
                  {selectedEmoji}
                </div>
                <div>
                  <p className="text-xl font-semibold flex items-center gap-2">
                    <span className="text-2xl">{selectedEmoji}</span>
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

        {/* Add Existing Tab */}
        {activeTab === 'existing' && (
          <div className="space-y-4">
            {existingPersons.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No existing students to add</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {existingPersons.map((existingPerson: any) => {
                  const avatar = parseAvatar(existingPerson.avatar, existingPerson.name);
                  return (
                    <div
                      key={existingPerson.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                          style={{ backgroundColor: avatar.backgroundColor }}
                        >
                          {avatar.emoji}
                        </div>
                        <div>
                          <p className="font-medium">{existingPerson.name}</p>
                          <p className="text-sm text-gray-500">Active student</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (classroomId) {
                            addMemberMutation.mutate({
                              groupId: classroomId,
                              personId: existingPerson.id,
                            });
                          }
                        }}
                        disabled={addMemberMutation.isPending}
                      >
                        Add to Classroom
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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
