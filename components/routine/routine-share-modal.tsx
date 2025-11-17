'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Copy, Check } from 'lucide-react';
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

export function RoutineShareModal({ isOpen, onClose, routine }: RoutineShareModalProps) {
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [maxUses, setMaxUses] = useState<string>('');
  const [expiresInDays, setExpiresInDays] = useState<string>('30');
  const { toast } = useToast();

  const generateShareCodeMutation = trpc.routine.generateShareCode.useMutation({
    onSuccess: (data) => {
      setShareCode(data.code);
      toast({
        title: 'Success',
        description: 'Share code generated',
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

  // Generate share code when modal opens
  useEffect(() => {
    if (isOpen && !shareCode) {
      const maxUsesNum = maxUses ? parseInt(maxUses, 10) : undefined;
      const expiresNum = expiresInDays ? parseInt(expiresInDays, 10) : undefined;

      generateShareCodeMutation.mutate({
        routineId: routine.id,
        maxUses: maxUsesNum,
        expiresInDays: expiresNum,
      });
    }
  }, [isOpen]);

  const handleClose = () => {
    setShareCode(null);
    setCopied(false);
    setMaxUses('');
    setExpiresInDays('30');
    onClose();
  };

  const handleCopyCode = async () => {
    if (shareCode) {
      await navigator.clipboard.writeText(shareCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Copied!',
        description: 'Share code copied to clipboard',
        variant: 'success',
      });
    }
  };

  const handleRegenerate = () => {
    const maxUsesNum = maxUses ? parseInt(maxUses, 10) : undefined;
    const expiresNum = expiresInDays ? parseInt(expiresInDays, 10) : undefined;

    generateShareCodeMutation.mutate({
      routineId: routine.id,
      maxUses: maxUsesNum,
      expiresInDays: expiresNum,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Share Routine
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {routine.name}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Share Code Display */}
          {shareCode ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  Your Share Code:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 bg-white border border-blue-300 rounded text-lg font-mono text-blue-700 text-center">
                    {shareCode}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyCode}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  Share this code with others to give them access to this routine.
                </p>
              </div>

              {/* Settings */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Uses (optional)
                  </label>
                  <Input
                    type="number"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    placeholder="Unlimited"
                    min="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty for unlimited uses
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expires In (days)
                  </label>
                  <Input
                    type="number"
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(e.target.value)}
                    placeholder="30"
                    min="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Code will expire after this many days
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600 mt-4">
                Generating share code...
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={handleClose} variant="outline" className="flex-1">
              Close
            </Button>
            {shareCode && (
              <Button
                onClick={handleRegenerate}
                variant="outline"
                className="flex-1"
                disabled={generateShareCodeMutation.isPending}
              >
                {generateShareCodeMutation.isPending ? 'Regenerating...' : 'Regenerate'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
