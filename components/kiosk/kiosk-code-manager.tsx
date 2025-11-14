'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';

interface KioskCodeManagerProps {
  roleId: string;
}

export function KioskCodeManager({ roleId }: KioskCodeManagerProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const hasAttemptedGeneration = useRef(false);
  const currentRoleId = useRef(roleId);

  const { data: codes, isLoading, error, refetch } = trpc.kiosk.listCodes.useQuery(
    { roleId },
    {
      enabled: !!roleId && roleId.length > 0,
      retry: false,
    }
  );

  const generateMutation = trpc.kiosk.generateCode.useMutation({
    onSuccess: async (data) => {
      // Refetch immediately to update UI
      await refetch();
      toast({
        title: 'Success',
        description: 'New kiosk code generated',
        variant: 'success',
      });
      setIsRevealed(true);
    },
    onError: (error) => {
      console.error('Failed to generate kiosk code:', error.message);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate kiosk code',
        variant: 'destructive',
      });
      hasAttemptedGeneration.current = false; // Reset on error to allow retry
    },
  });

  // Reset generation flag when roleId changes
  useEffect(() => {
    if (currentRoleId.current !== roleId) {
      currentRoleId.current = roleId;
      hasAttemptedGeneration.current = false;
    }
  }, [roleId]);

  // Auto-generate default code if none exists
  useEffect(() => {
    if (
      !isLoading &&
      !error &&
      roleId &&
      roleId.length > 0 &&
      codes &&
      codes.length === 0 &&
      !hasAttemptedGeneration.current &&
      !generateMutation.isPending
    ) {
      hasAttemptedGeneration.current = true;
      generateMutation.mutate({ roleId, expiresInHours: 168 }); // 1 week expiration (max allowed)
    }
  }, [isLoading, error, roleId, codes?.length, generateMutation.isPending]);

  const handleGenerateNew = () => {
    if (confirm('Are you sure you want to generate a new code? The current code will be revoked.')) {
      // Revoke existing code first if it exists
      if (currentCode) {
        revokeMutation.mutate({ codeId: currentCode.id });
      }
      // Generate new code with 1 week expiration (max allowed)
      generateMutation.mutate({ roleId, expiresInHours: 168 });
    }
  };

  const revokeMutation = trpc.kiosk.revokeCode.useMutation({
    onSuccess: async () => {
      await refetch();
    },
  });

  // getActiveCodesForRole already filters for ACTIVE codes server-side
  // The returned KioskCode objects have isActive: boolean, not status field
  const currentCode = codes?.[0]; // Take the first code (most recent)

  if (!roleId || roleId.length === 0) {
    return <div className="text-center py-4 text-gray-500">Loading role...</div>;
  }

  if (isLoading) {
    return <div className="text-center py-4 text-gray-500">Loading...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-500">
        Error loading kiosk codes: {error.message}
      </div>
    );
  }

  return (
    <div className="py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-700 mb-2">Current Code</div>
          <div className="font-mono text-2xl font-bold text-gray-900">
            {currentCode ? (isRevealed ? currentCode.code : '••••••') : 'Generating...'}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsRevealed(!isRevealed)}
            disabled={!currentCode}
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
            disabled={generateMutation.isPending || !currentCode}
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
