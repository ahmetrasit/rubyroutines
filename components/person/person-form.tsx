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
import { Search } from 'lucide-react';
import { PASTEL_COLORS, COMMON_EMOJIS, parseAvatar, serializeAvatar } from '@/lib/utils/avatar';
import { useCreateMutation, useUpdateMutation } from '@/lib/hooks';
import type { Person } from '@/lib/types/database';

interface PersonFormProps {
  person?: Person;
  roleId?: string;
  onClose: () => void;
}

export function PersonForm({ person, roleId, onClose }: PersonFormProps) {
  // Parse existing avatar data if editing
  const initialAvatar = parseAvatar(person?.avatar, person?.name);
  const initialColor = initialAvatar.color;
  const initialEmoji = initialAvatar.emoji;

  const [name, setName] = useState(person?.name || '');
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [selectedEmoji, setSelectedEmoji] = useState(initialEmoji);
  const [emojiSearch, setEmojiSearch] = useState('');

  const utils = trpc.useUtils();

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

  const createMutationBase = trpc.person.create.useMutation();
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
          <DialogTitle>{person ? 'Edit Person' : 'Add New Child'}</DialogTitle>
        </DialogHeader>

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
      </DialogContent>
    </Dialog>
  );
}
