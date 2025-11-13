'use client';

import { useState, useMemo } from 'react';
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
import { Search } from 'lucide-react';

interface PersonFormProps {
  person?: any;
  roleId?: string;
  onClose: () => void;
}

const PASTEL_COLORS = [
  '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF',
  '#E0BBE4', '#FFDFD3', '#FEC8D8', '#D4F1F4', '#C9E4DE',
  '#F7D9C4', '#FAACA8', '#DFE7FD', '#B4F8C8', '#FBE7C6',
  '#A0E7E5', '#FFAEBC', '#FBE4D8', '#D5AAFF', '#85E3FF',
  '#FFDAC1', '#E2F0CB', '#B5EAD7', '#C7CEEA', '#FFDFD3',
  '#E6E6FA', '#FFE5B4', '#F0E68C', '#D8BFD8', '#FFE4E1',
  '#E0FFFF', '#F5DEB3'
];

const COMMON_EMOJIS = [
  { emoji: '😀', name: 'smile', keywords: 'happy smile face' },
  { emoji: '😊', name: 'blush', keywords: 'happy blush smile' },
  { emoji: '😎', name: 'cool', keywords: 'cool sunglasses' },
  { emoji: '🤓', name: 'nerd', keywords: 'nerd glasses smart' },
  { emoji: '🥳', name: 'party', keywords: 'party celebrate happy' },
  { emoji: '😇', name: 'angel', keywords: 'angel halo good' },
  { emoji: '🤗', name: 'hug', keywords: 'hug friendly warm' },
  { emoji: '🤩', name: 'star', keywords: 'star eyes excited' },
  { emoji: '😺', name: 'cat', keywords: 'cat happy smile' },
  { emoji: '🐶', name: 'dog', keywords: 'dog puppy pet' },
  { emoji: '🐱', name: 'kitty', keywords: 'cat kitty pet' },
  { emoji: '🐭', name: 'mouse', keywords: 'mouse small cute' },
  { emoji: '🐹', name: 'hamster', keywords: 'hamster pet cute' },
  { emoji: '🐰', name: 'rabbit', keywords: 'rabbit bunny cute' },
  { emoji: '🦊', name: 'fox', keywords: 'fox animal orange' },
  { emoji: '🐻', name: 'bear', keywords: 'bear animal cute' },
  { emoji: '🐼', name: 'panda', keywords: 'panda bear cute' },
  { emoji: '🐨', name: 'koala', keywords: 'koala bear cute' },
  { emoji: '🐯', name: 'tiger', keywords: 'tiger animal' },
  { emoji: '🦁', name: 'lion', keywords: 'lion animal' },
  { emoji: '🐮', name: 'cow', keywords: 'cow animal farm' },
  { emoji: '🐷', name: 'pig', keywords: 'pig animal farm' },
  { emoji: '🐸', name: 'frog', keywords: 'frog animal green' },
  { emoji: '🐵', name: 'monkey', keywords: 'monkey animal' },
  { emoji: '🦄', name: 'unicorn', keywords: 'unicorn magic rainbow' },
  { emoji: '🐝', name: 'bee', keywords: 'bee insect honey' },
  { emoji: '🦋', name: 'butterfly', keywords: 'butterfly insect pretty' },
  { emoji: '🐙', name: 'octopus', keywords: 'octopus sea animal' },
  { emoji: '🌟', name: 'star', keywords: 'star shine bright' },
  { emoji: '⭐', name: 'gold star', keywords: 'star gold bright' },
  { emoji: '💫', name: 'dizzy', keywords: 'dizzy star sparkle' },
  { emoji: '🌈', name: 'rainbow', keywords: 'rainbow color bright' },
  { emoji: '🎈', name: 'balloon', keywords: 'balloon party celebrate' },
  { emoji: '🎨', name: 'art', keywords: 'art paint color' },
  { emoji: '🎭', name: 'theater', keywords: 'theater drama art' },
  { emoji: '🎪', name: 'circus', keywords: 'circus tent fun' },
  { emoji: '🎡', name: 'wheel', keywords: 'ferris wheel fun' },
  { emoji: '🎢', name: 'coaster', keywords: 'roller coaster fun' },
  { emoji: '🎸', name: 'guitar', keywords: 'guitar music rock' },
  { emoji: '🎹', name: 'piano', keywords: 'piano music keys' },
  { emoji: '🎺', name: 'trumpet', keywords: 'trumpet music brass' },
  { emoji: '🎻', name: 'violin', keywords: 'violin music string' },
  { emoji: '🥁', name: 'drum', keywords: 'drum music beat' },
  { emoji: '🎮', name: 'game', keywords: 'game video controller' },
  { emoji: '🧸', name: 'teddy', keywords: 'teddy bear toy' },
  { emoji: '🚀', name: 'rocket', keywords: 'rocket space ship' },
  { emoji: '🛸', name: 'ufo', keywords: 'ufo alien space' },
  { emoji: '🎯', name: 'target', keywords: 'target bullseye goal' },
  { emoji: '⚽', name: 'soccer', keywords: 'soccer ball sport' },
  { emoji: '🏀', name: 'basketball', keywords: 'basketball ball sport' },
  { emoji: '⚾', name: 'baseball', keywords: 'baseball ball sport' },
  { emoji: '🎾', name: 'tennis', keywords: 'tennis ball sport' },
  { emoji: '🏐', name: 'volleyball', keywords: 'volleyball ball sport' },
  { emoji: '🏈', name: 'football', keywords: 'football ball sport' },
  { emoji: '🥊', name: 'boxing', keywords: 'boxing glove sport' },
  { emoji: '🎓', name: 'graduate', keywords: 'graduate school education' },
  { emoji: '📚', name: 'books', keywords: 'books read study' },
  { emoji: '✏️', name: 'pencil', keywords: 'pencil write draw' },
  { emoji: '🖍️', name: 'crayon', keywords: 'crayon color draw' },
  { emoji: '🎒', name: 'backpack', keywords: 'backpack school bag' },
  { emoji: '👑', name: 'crown', keywords: 'crown king queen royal' },
  { emoji: '💎', name: 'gem', keywords: 'gem diamond jewel' },
  { emoji: '🌸', name: 'flower', keywords: 'flower blossom pink' },
  { emoji: '🌺', name: 'hibiscus', keywords: 'hibiscus flower tropical' },
  { emoji: '🌻', name: 'sunflower', keywords: 'sunflower flower yellow' },
];

export function PersonForm({ person, roleId, onClose }: PersonFormProps) {
  // Parse existing avatar data if editing
  let initialColor = PASTEL_COLORS[0];
  let initialEmoji = '😀';

  if (person?.avatar) {
    try {
      const parsed = JSON.parse(person.avatar);
      initialColor = parsed.color || PASTEL_COLORS[0];
      initialEmoji = parsed.emoji || '😀';
    } catch {
      // If not JSON, ignore
    }
  }

  const [name, setName] = useState(person?.name || '');
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [selectedEmoji, setSelectedEmoji] = useState(initialEmoji);
  const [emojiSearch, setEmojiSearch] = useState('');

  const { toast } = useToast();
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

    const avatarData = JSON.stringify({
      color: selectedColor,
      emoji: selectedEmoji,
    });

    if (person) {
      updateMutation.mutate({
        id: person.id,
        name: name || undefined,
        avatar: avatarData,
      });
    } else if (roleId) {
      createMutation.mutate({
        roleId,
        name,
        avatar: avatarData,
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{person ? 'Edit Person' : 'Add New Person'}</DialogTitle>
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
                      ? 'ring-4 ring-blue-500 ring-offset-2 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
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
                  className={`text-3xl p-2 rounded-lg transition-all hover:bg-gray-100 ${
                    selectedEmoji === item.emoji
                      ? 'bg-blue-100 ring-2 ring-blue-500 scale-110'
                      : ''
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
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center gap-4">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-md"
                  style={{ backgroundColor: selectedColor }}
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
