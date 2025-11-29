'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Key, Globe, Copy, Check, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';

interface RoutineActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  routine: {
    id: string;
    name: string;
  };
  roleId: string;
  onCopyClick?: () => void; // Opens copy routine modal
}

export function RoutineActionsModal({
  isOpen,
  onClose,
  routine,
  roleId,
  onCopyClick,
}: RoutineActionsModalProps) {
  const { toast } = useToast();
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateCodeMutation = trpc.routine.generateShareCode.useMutation({
    onSuccess: (data) => {
      setShareCode(data.code);
      toast({
        title: 'Share code generated',
        description: 'Share this code with others to let them import your routine.',
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

  const handleGenerateCode = () => {
    generateCodeMutation.mutate({
      routineId: routine.id,
      maxUses: 10,
      expiresInDays: 30,
    });
  };

  const handleCopyCode = async () => {
    if (shareCode) {
      await navigator.clipboard.writeText(shareCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Copied!',
        description: 'Share code copied to clipboard.',
        variant: 'success',
      });
    }
  };

  const handleCopyToOthers = () => {
    onClose();
    onCopyClick?.();
  };

  const handlePublish = () => {
    // TODO: Implement publish to community routines
    toast({
      title: 'Coming soon',
      description: 'Publishing to Community Routines will be available soon.',
      variant: 'default',
    });
  };

  const handleClose = () => {
    setShareCode(null);
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">{routine.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Copy Section */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">COPY</h3>
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-300"
              onClick={handleCopyToOthers}
            >
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">Copy to other kids/students</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Duplicate this routine for your other children or students
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Export Section */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">EXPORT</h3>
            <div className="space-y-3">
              {/* Private Share */}
              <Card className="border-2">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Key className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">Share privately (code)</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Generate a code to share with specific people
                  </p>
                  {shareCode ? (
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 bg-gray-100 rounded-lg font-mono text-sm">
                        {shareCode}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
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
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleGenerateCode}
                      disabled={generateCodeMutation.isPending}
                    >
                      {generateCodeMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        'Generate Share Code'
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Public Publish */}
              <Card
                className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-green-300"
                onClick={handlePublish}
              >
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Globe className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">Publish to Community Routines</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Make available for everyone to discover
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
