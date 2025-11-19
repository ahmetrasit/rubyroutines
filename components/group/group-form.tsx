'use client';

import { useState, useEffect, useRef } from 'react';
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
import { IconEmojiPicker, RenderIconEmoji } from '@/components/ui/icon-emoji-picker';
import { HexColorPicker } from 'react-colorful';
import { AVATAR_COLORS } from '@/lib/constants/theme';

interface GroupFormProps {
  group?: any;
  roleId?: string;
  roleType?: 'PARENT' | 'TEACHER';
  onClose: () => void;
}

export function GroupForm({ group, roleId, roleType, onClose }: GroupFormProps) {
  // Determine if teacher mode: from roleType or from group.type
  const isTeacherMode = roleType === 'TEACHER' || group?.type === GroupType.CLASSROOM;
  const defaultType = isTeacherMode ? GroupType.CLASSROOM : GroupType.FAMILY;

  const [name, setName] = useState(group?.name || '');
  const [type, setType] = useState<GroupType>(group?.type || defaultType);
  const [description, setDescription] = useState(group?.description || '');
  const [emoji, setEmoji] = useState<string>(group?.emoji || '🏫');
  const [color, setColor] = useState<string>(group?.color || '#3B82F6');
  const [showIconEmojiPicker, setShowIconEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const iconEmojiPickerRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Close pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (iconEmojiPickerRef.current && !iconEmojiPickerRef.current.contains(event.target as Node)) {
        setShowIconEmojiPicker(false);
      }
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
    };

    if (showIconEmojiPicker || showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showIconEmojiPicker, showColorPicker]);

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
        emoji: emoji || undefined,
        color: color || undefined,
      });
    } else if (roleId) {
      createMutation.mutate({
        roleId,
        name,
        type,
        description: description || undefined,
        emoji: emoji || undefined,
        color: color || undefined,
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
          {/* Emoji and Color Row */}
          <div className="grid grid-cols-12 gap-3">
            {/* Emoji/Icon Picker */}
            <div className="col-span-3 relative">
              <Label>Icon</Label>
              <button
                type="button"
                onClick={() => setShowIconEmojiPicker(!showIconEmojiPicker)}
                className="w-full h-10 rounded-md border border-gray-300 flex items-center justify-center text-2xl hover:bg-gray-50 transition-colors mt-1"
              >
                <RenderIconEmoji value={emoji} className="h-6 w-6" />
              </button>
              {showIconEmojiPicker && (
                <div ref={iconEmojiPickerRef} className="absolute z-50 top-full mt-2 left-0">
                  <IconEmojiPicker
                    selectedValue={emoji}
                    onSelect={setEmoji}
                    onClose={() => setShowIconEmojiPicker(false)}
                  />
                </div>
              )}
            </div>

            {/* Name Field */}
            <div className="col-span-9">
              <Label htmlFor="name">{isTeacherMode ? 'Class Name' : 'Group Name'} *</Label>
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
          </div>

          {/* Color Picker */}
          <div className="relative">
            <Label>Border Color</Label>
            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="mt-1 w-full h-10 rounded-md border border-gray-300 flex items-center gap-3 px-3 hover:bg-gray-50 transition-colors"
            >
              <div
                className="w-6 h-6 rounded-full border-2 border-gray-300"
                style={{ backgroundColor: color }}
              />
              <span className="text-sm text-gray-700">{color}</span>
            </button>
            {showColorPicker && (
              <div ref={colorPickerRef} className="absolute z-50 top-full mt-2 p-3 bg-white rounded-lg shadow-lg border max-h-[500px] overflow-y-auto">
                <HexColorPicker color={color} onChange={setColor} />
                <div className="mt-3 pt-3 border-t space-y-1">
                  {AVATAR_COLORS.GROUPS.map((group) => (
                    <div key={group.label} className="grid grid-cols-9 gap-0.5">
                      {group.colors.map((presetColor) => (
                        <button
                          key={presetColor}
                          type="button"
                          onClick={() => {
                            setColor(presetColor);
                            setShowColorPicker(false);
                          }}
                          className="w-7 h-7 rounded-md border-2 hover:scale-110 transition-transform"
                          style={{
                            backgroundColor: presetColor,
                            borderColor: color === presetColor ? '#000' : '#e5e7eb'
                          }}
                          title={presetColor}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
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
