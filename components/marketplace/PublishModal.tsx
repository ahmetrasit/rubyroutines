'use client';

import { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleId: string;
}

const CATEGORIES = [
  'Morning Routine',
  'Bedtime Routine',
  'Homework',
  'Chores',
  'Self-Care',
  'Exercise',
  'Reading',
  'Other',
];

const AGE_GROUPS = [
  'Toddler (1-3)',
  'Preschool (3-5)',
  'Elementary (6-11)',
  'Teen (12-17)',
  'Adult (18+)',
];

type Visibility = 'PUBLIC' | 'PRIVATE';

export function PublishModal({ isOpen, onClose, roleId }: PublishModalProps) {
  const [type, setType] = useState<'ROUTINE' | 'GOAL'>('ROUTINE');
  const [selectedItem, setSelectedItem] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('PUBLIC');
  const [category, setCategory] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [maxUses, setMaxUses] = useState<number | undefined>(undefined);
  const [expiresInDays, setExpiresInDays] = useState<number | undefined>(undefined);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [publishedItemId, setPublishedItemId] = useState<string | null>(null);
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const { data: routines } = trpc.routine.list.useQuery({ roleId });
  const { data: goals } = trpc.goal.list.useQuery({ roleId });

  const publishMutation = trpc.marketplace.publish.useMutation({
    onSuccess: (data) => {
      if (visibility === 'PRIVATE') {
        setPublishedItemId(data.id);
        // Auto-generate share code for private items
        generateShareCodeMutation.mutate({
          marketplaceItemId: data.id,
          maxUses,
          expiresInDays,
        });
      } else {
        toast({
          title: 'Success',
          description: 'Published to marketplace successfully',
          variant: 'success',
        });
        utils.marketplace.search.invalidate();
        handleClose();
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const generateShareCodeMutation = trpc.marketplace.generateShareCode.useMutation({
    onSuccess: (data) => {
      setGeneratedCode(data.code);
      toast({
        title: 'Success',
        description: 'Published to marketplace and share code generated',
        variant: 'success',
      });
      utils.marketplace.search.invalidate();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Published but failed to generate share code: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleClose = () => {
    setType('ROUTINE');
    setSelectedItem('');
    setVisibility('PUBLIC');
    setCategory('');
    setAgeGroup('');
    setTagInput('');
    setTags([]);
    setMaxUses(undefined);
    setExpiresInDays(undefined);
    setGeneratedCode(null);
    setPublishedItemId(null);
    onClose();
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handlePublish = () => {
    if (!selectedItem) {
      toast({
        title: 'Error',
        description: 'Please select an item to publish',
        variant: 'destructive',
      });
      return;
    }

    const items = type === 'ROUTINE' ? routines : goals;
    const item = items?.find((i: any) => i.id === selectedItem);

    if (!item) return;

    publishMutation.mutate({
      type,
      sourceId: selectedItem,
      authorRoleId: roleId,
      name: item.name,
      description: item.description || '',
      visibility,
      category: category || undefined,
      ageGroup: ageGroup || undefined,
      tags,
    });
  };

  const items = type === 'ROUTINE' ? routines : goals;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Publish to Marketplace</h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What do you want to publish?
              </label>
              <div className="flex gap-3">
                <Button
                  variant={type === 'ROUTINE' ? 'default' : 'outline'}
                  onClick={() => {
                    setType('ROUTINE');
                    setSelectedItem('');
                  }}
                  className="flex-1"
                >
                  Routine
                </Button>
                <Button
                  variant={type === 'GOAL' ? 'default' : 'outline'}
                  onClick={() => {
                    setType('GOAL');
                    setSelectedItem('');
                  }}
                  className="flex-1"
                >
                  Goal
                </Button>
              </div>
            </div>

            {/* Item Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select {type === 'ROUTINE' ? 'Routine' : 'Goal'}
              </label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={selectedItem} onChange={(e) => setSelectedItem(e.target.value)}>
                <option value="">-- Select --</option>
                {items?.map((item: any) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Visibility Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visibility
              </label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant={visibility === 'PUBLIC' ? 'default' : 'outline'}
                  onClick={() => setVisibility('PUBLIC')}
                  className="flex-1"
                >
                  Public
                  <span className="ml-2 text-xs opacity-75">
                    (Anyone can find)
                  </span>
                </Button>
                <Button
                  type="button"
                  variant={visibility === 'PRIVATE' ? 'default' : 'outline'}
                  onClick={() => setVisibility('PRIVATE')}
                  className="flex-1"
                >
                  Private
                  <span className="ml-2 text-xs opacity-75">
                    (Share with code)
                  </span>
                </Button>
              </div>
            </div>

            {/* Public Visibility Options */}
            {visibility === 'PUBLIC' && (
              <>
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category (optional)
                  </label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="">-- None --</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Age Group */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age Group (optional)
                  </label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)}>
                    <option value="">-- None --</option>
                    {AGE_GROUPS.map((age) => (
                      <option key={age} value={age}>
                        {age}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (up to 10)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Add a tag..."
                      disabled={tags.length >= 10}
                    />
                    <Button
                      onClick={handleAddTag}
                      disabled={!tagInput.trim() || tags.length >= 10}
                      variant="outline"
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="default" className="cursor-pointer">
                        {tag}
                        <button onClick={() => handleRemoveTag(tag)} className="ml-2">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Private Visibility Options */}
            {visibility === 'PRIVATE' && (
              <>
                {/* Share Code Options */}
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    A unique share code will be generated that you can share with others.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Uses (optional)
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={maxUses || ''}
                        onChange={(e) => setMaxUses(e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="Unlimited"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expires in (days)
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="365"
                        value={expiresInDays || ''}
                        onChange={(e) => setExpiresInDays(e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="Never"
                      />
                    </div>
                  </div>

                  {/* Generated Code Display */}
                  {generatedCode && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-medium text-green-900 mb-2">
                        Share Code Generated:
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 p-2 bg-white border border-green-300 rounded text-lg font-mono text-green-700">
                          {generatedCode}
                        </code>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(generatedCode);
                            toast({
                              title: 'Copied!',
                              description: 'Share code copied to clipboard',
                              variant: 'success',
                            });
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button onClick={handleClose} variant="outline" className="flex-1">
                {generatedCode ? 'Done' : 'Cancel'}
              </Button>
              {!generatedCode && (
                <Button
                  onClick={handlePublish}
                  disabled={!selectedItem || publishMutation.isPending || generateShareCodeMutation.isPending}
                  className="flex-1"
                >
                  {publishMutation.isPending || generateShareCodeMutation.isPending
                    ? 'Publishing...'
                    : 'Publish'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
