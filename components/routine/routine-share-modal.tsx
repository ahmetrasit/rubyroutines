'use client';

import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Copy, Check, Lock, Globe } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';

interface RoutineShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  routine: {
    id: string;
    name: string;
  };
}

type VisibilityType = 'private' | 'public';

const CATEGORIES = [
  'Morning',
  'Bedtime',
  'Homework',
  'Chores',
  'Hygiene',
  'Exercise',
  'Reading',
  'Mealtime',
  'Other',
];

export function RoutineShareModal({ isOpen, onClose, routine }: RoutineShareModalProps) {
  // Form state
  const [visibility, setVisibility] = useState<VisibilityType>('private');
  const [category, setCategory] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [tags, setTags] = useState<string>('');
  const [targetAudience, setTargetAudience] = useState<'PARENT' | 'TEACHER'>('PARENT');
  const [expiresInDays, setExpiresInDays] = useState<number>(30);
  const [maxUses, setMaxUses] = useState<number | undefined>(undefined);

  // Success state
  const [success, setSuccess] = useState(false);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { toast } = useToast();
  const { data: session } = trpc.auth.getSession.useQuery();

  // Get user's role type to pre-fill target audience
  const userRoleType = session?.user?.roles?.[0]?.type;

  const generateShareCodeMutation = trpc.routine.generateShareCode.useMutation({
    onSuccess: (data) => {
      setShareCode(data.code);
      setSuccess(true);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const publishToMarketplaceMutation = trpc.marketplace.publish.useMutation({
    onSuccess: () => {
      setSuccess(true);
      toast({
        title: 'Success',
        description: 'Routine published to Community Routines',
        variant: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleClose = () => {
    // Reset all state
    setVisibility('private');
    setCategory('');
    setDescription('');
    setTags('');
    setTargetAudience('PARENT');
    setExpiresInDays(30);
    setMaxUses(undefined);
    setSuccess(false);
    setShareCode(null);
    setCopied(false);
    onClose();
  };

  const handleShare = () => {
    if (!description.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a description',
        variant: 'destructive',
      });
      return;
    }

    const roleId = session?.user?.roles?.[0]?.id;
    if (!roleId) {
      toast({
        title: 'Error',
        description: 'Role not found',
        variant: 'destructive',
      });
      return;
    }

    if (visibility === 'public') {
      // Publish to marketplace
      const tagsArray = tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      publishToMarketplaceMutation.mutate({
        type: 'ROUTINE',
        sourceId: routine.id,
        authorRoleId: roleId,
        name: routine.name,
        description: description.trim(),
        visibility: 'PUBLIC',
        category: category || undefined,
        tags: tagsArray,
      });
    } else {
      // Generate private share code
      generateShareCodeMutation.mutate({
        routineId: routine.id,
        maxUses: maxUses,
        expiresInDays: expiresInDays,
      });
    }
  };

  const handleCopyCode = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (shareCode) {
      try {
        await navigator.clipboard.writeText(shareCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({
          title: 'Copied!',
          description: 'Share code copied to clipboard',
          variant: 'success',
        });
      } catch (error) {
        // Fallback: try using execCommand
        try {
          const textArea = document.createElement('textarea');
          textArea.value = shareCode;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          toast({
            title: 'Copied!',
            description: 'Share code copied to clipboard',
            variant: 'success',
          });
        } catch (fallbackError) {
          toast({
            title: 'Error',
            description: 'Failed to copy code. Please copy manually.',
            variant: 'destructive',
          });
        }
      }
    }
  };

  const isLoading =
    generateShareCodeMutation.isPending || publishToMarketplaceMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Share Routine</h2>
              <p className="text-sm text-gray-600 mt-1">{routine.name}</p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {!success ? (
            <>
              {/* Info Banner */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Share this routine with other {userRoleType === 'TEACHER' ? 'teachers' : 'parents'}.
                  Choose between private sharing (with a code) or public sharing (Community Routines).
                </p>
              </div>

              {/* Visibility Type Selection */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setVisibility('private')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    visibility === 'private'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex flex-col items-center text-center gap-2">
                    <Lock className="h-6 w-6 text-gray-700" />
                    <div>
                      <div className="font-semibold text-sm text-gray-900">Private</div>
                      <p className="text-xs text-gray-600 mt-1">
                        Share with a code. Only those with the code can access.
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setVisibility('public')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    visibility === 'public'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex flex-col items-center text-center gap-2">
                    <Globe className="h-6 w-6 text-gray-700" />
                    <div>
                      <div className="font-semibold text-sm text-gray-900">Public</div>
                      <p className="text-xs text-gray-600 mt-1">
                        Share publicly. Anyone can discover and import.
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {/* Category */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a category (optional)</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Audience */}
                <div>
                  <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-700 mb-1">
                    Target Audience <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="targetAudience"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value as 'PARENT' | 'TEACHER')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PARENT">For Parents</option>
                    <option value="TEACHER">For Teachers</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Who is this routine designed for?</p>
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe this routine and what makes it useful..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Tags (Public only) */}
                {visibility === 'public' && (
                  <div>
                    <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                      Tags
                    </label>
                    <Input
                      id="tags"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="bedtime, calm, relaxing (comma-separated)"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Separate tags with commas to help others find your routine
                    </p>
                  </div>
                )}

                {/* Private Sharing Options */}
                {visibility === 'private' && (
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-semibold text-gray-900">Share Code Settings</h3>

                    {/* Expiration */}
                    <div>
                      <label htmlFor="expiration" className="block text-sm font-medium text-gray-700 mb-1">
                        Expiration
                      </label>
                      <select
                        id="expiration"
                        value={expiresInDays}
                        onChange={(e) => setExpiresInDays(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="7">7 days</option>
                        <option value="30">30 days</option>
                        <option value="90">90 days</option>
                        <option value="365">Never expires</option>
                      </select>
                    </div>

                    {/* Maximum Uses */}
                    <div>
                      <label htmlFor="maxUses" className="block text-sm font-medium text-gray-700 mb-1">
                        Maximum Uses
                      </label>
                      <select
                        id="maxUses"
                        value={maxUses || 'unlimited'}
                        onChange={(e) =>
                          setMaxUses(e.target.value === 'unlimited' ? undefined : parseInt(e.target.value))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="unlimited">Unlimited</option>
                        <option value="1">1 use</option>
                        <option value="5">5 uses</option>
                        <option value="10">10 uses</option>
                        <option value="25">25 uses</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button onClick={handleClose} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleShare}
                  className="flex-1"
                  disabled={isLoading || !description.trim()}
                >
                  {isLoading ? 'Sharing...' : 'Share Routine'}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="space-y-4">
                {visibility === 'private' && shareCode ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-4">
                    <p className="text-sm font-medium text-green-900">
                      Your routine has been shared! Here&apos;s your share code:
                    </p>

                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-3 bg-white border border-green-300 rounded-lg text-lg font-mono text-green-700 text-center">
                        {shareCode}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => handleCopyCode(e)}
                        className="shrink-0"
                        type="button"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    <p className="text-sm text-green-800">
                      Share this code with other {targetAudience === 'TEACHER' ? 'teachers' : 'parents'} so they can
                      import this routine.
                    </p>

                    <div className="flex gap-4 text-xs text-green-700">
                      <span>Expires in {expiresInDays} days</span>
                      {maxUses && <span>Maximum {maxUses} uses</span>}
                      {!maxUses && <span>Unlimited uses</span>}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-900">
                      Your routine has been published to Community Routines! Other users can now
                      discover and import it.
                    </p>
                  </div>
                )}

                <Button onClick={handleClose} className="w-full">
                  Done
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
