'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, RefreshCw, ChevronDown } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SessionIndicator } from './session-indicator';

interface PersonKioskCodeManagerProps {
  roleId: string;
  personId: string;
  personName: string; // Person's first name
}

export function PersonKioskCodeManager({ roleId, personId, personName }: PersonKioskCodeManagerProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const hasAttemptedGeneration = useRef(false);
  const currentPersonId = useRef(personId);

  const { data: codes, isLoading, error, refetch } = trpc.kiosk.listCodes.useQuery(
    { roleId },
    {
      enabled: !!roleId && roleId.length > 0,
      retry: false,
    }
  );

  // Filter codes to get only this person's individual code
  const currentCode = codes?.find(c => c.personId === personId);

  // Get session count for this code
  const { data: sessionCount } = trpc.kiosk.getSessionCount.useQuery(
    { codeId: currentCode?.id || '' },
    {
      enabled: !!currentCode?.id,
      refetchInterval: 10000, // Refresh every 10 seconds
    }
  );

  const generateMutation = trpc.kiosk.generateCode.useMutation({
    onSuccess: async (data) => {
      // Refetch immediately to update UI
      await refetch();
      toast({
        title: 'Success',
        description: 'New individual kiosk code generated',
        variant: 'success',
      });
      setIsRevealed(true);
    },
    onError: (error) => {
      console.error('Failed to generate individual kiosk code:', error.message);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate individual kiosk code',
        variant: 'destructive',
      });
      hasAttemptedGeneration.current = false; // Reset on error to allow retry
    },
  });

  // Reset generation flag when personId changes
  useEffect(() => {
    if (currentPersonId.current !== personId) {
      currentPersonId.current = personId;
      hasAttemptedGeneration.current = false;
    }
  }, [personId]);

  // Auto-generate individual code if none exists for this person
  useEffect(() => {
    if (
      !isLoading &&
      !error &&
      roleId &&
      roleId.length > 0 &&
      personId &&
      personId.length > 0 &&
      codes &&
      !codes.some(c => c.personId === personId) &&
      !hasAttemptedGeneration.current &&
      !generateMutation.isPending
    ) {
      hasAttemptedGeneration.current = true;
      generateMutation.mutate({
        roleId,
        personId, // Pass personId for individual code
        userName: personName,
        wordCount: '3',
        expiresInMinutes: 10,
        sessionDurationDays: 90
      });
    }
  }, [isLoading, error, roleId, personId, codes, generateMutation.isPending, personName]);

  const handleGenerateNew = () => {
    if (confirm(`Are you sure you want to generate a new code for ${personName}? The current code will be revoked.`)) {
      // Revoke existing code first if it exists
      if (currentCode) {
        revokeMutation.mutate({ codeId: currentCode.id });
      }
      // Generate new code with 10-minute expiration
      generateMutation.mutate({
        roleId,
        personId, // Pass personId for individual code
        userName: personName,
        wordCount: '3',
        expiresInMinutes: 10,
        sessionDurationDays: 90
      });
    }
  };

  const revokeMutation = trpc.kiosk.revokeCode.useMutation({
    onSuccess: async () => {
      await refetch();
    },
  });

  if (!roleId || roleId.length === 0 || !personId || personId.length === 0) {
    return null;
  }

  if (isLoading) {
    return <div className="text-center py-2 text-gray-500 text-sm">Loading...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-2 text-red-500 text-sm">
        Error loading kiosk code: {error.message}
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border-t border-gray-100 mt-3">
      <CollapsibleTrigger className="w-full flex items-center justify-between py-3 px-0 hover:bg-transparent text-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-600">Individual Kiosk Code</span>
          <SessionIndicator count={sessionCount?.count || 0} />
        </div>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-3 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="font-mono text-lg font-bold text-gray-900">
              {currentCode ? (isRevealed ? currentCode.code : '••••••••••') : 'Generating...'}
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
                  <EyeOff className="h-3 w-3 mr-1" />
                  Hide
                </>
              ) : (
                <>
                  <Eye className="h-3 w-3 mr-1" />
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
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Generate Code and Initiate Session
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-2">
          <p className="text-xs text-purple-800">
            <strong>Note:</strong> This code allows only {personName} to access their tasks in kiosk mode.
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
