'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';

export function KioskCodeManager() {
  const [isRevealed, setIsRevealed] = useState(false);
  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Get current role ID
  const { data: session } = trpc.auth.getSession.useQuery();
  const roleId = session?.user?.roles?.[0]?.id || '';

  const { data: codes, isLoading } = trpc.kiosk.listCodes.useQuery(
    { roleId },
    { enabled: !!roleId }
  );

  const generateMutation = trpc.kiosk.generateCode.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: 'New kiosk code generated',
        variant: 'success',
      });
      utils.kiosk.listCodes.invalidate();
      setIsRevealed(true);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Auto-generate default code if none exists
  useEffect(() => {
    if (!isLoading && roleId && codes && codes.length === 0) {
      generateMutation.mutate({ roleId, expiresInHours: 24 * 365 }); // 1 year expiration
    }
  }, [isLoading, roleId, codes]);

  const handleGenerateNew = () => {
    if (confirm('Are you sure you want to generate a new code? The current code will be revoked.')) {
      // Revoke all existing codes first
      const activeCode = activeCodes[0];
      if (activeCode) {
        revokeMutation.mutate({ codeId: activeCode.id });
      }
      // Generate new code with 1 year expiration
      generateMutation.mutate({ roleId, expiresInHours: 24 * 365 });
    }
  };

  const revokeMutation = trpc.kiosk.revokeCode.useMutation({
    onSuccess: () => {
      utils.kiosk.listCodes.invalidate();
    },
  });

  const activeCodes = codes?.filter((c: any) => c.status === 'ACTIVE') || [];
  const currentCode = activeCodes[0];

  if (isLoading) {
    return <div className="text-center py-4 text-gray-500">Loading...</div>;
  }

  return (
    <div className="py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-700 mb-2">Current Code</div>
          <div className="font-mono text-2xl font-bold text-gray-900">
            {isRevealed && currentCode ? currentCode.code : '••••••'}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsRevealed(!isRevealed)}
          >
            {isRevealed ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Hide
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Reveal
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerateNew}
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate New
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-800">
          <strong>Note:</strong> This code allows access to task completion for all family members in kiosk mode.
        </p>
      </div>
    </div>
  );
}
