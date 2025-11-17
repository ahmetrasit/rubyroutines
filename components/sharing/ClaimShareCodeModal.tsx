'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Check } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/use-toast';

interface ClaimShareCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleId: string;
  userId: string;
  initialCode?: string;
}

export function ClaimShareCodeModal({
  isOpen,
  onClose,
  roleId,
  userId,
  initialCode,
}: ClaimShareCodeModalProps) {
  const [step, setStep] = useState<'enter_code' | 'confirm' | 'success'>(
    'enter_code'
  );
  const [shareCode, setShareCode] = useState(initialCode || '');
  const [validatedInvite, setValidatedInvite] = useState<any>(null);
  const { toast } = useToast();

  const validateMutation = trpc.personSharing.validateInvite.useMutation({
    onSuccess: (data) => {
      if (data.valid && data.invite) {
        setValidatedInvite(data.invite);
        setStep('confirm');
      } else {
        toast({
          title: 'Invalid Code',
          description: data.error || 'This share code is not valid',
          variant: 'destructive',
        });
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

  const claimMutation = trpc.personSharing.claimInvite.useMutation({
    onSuccess: () => {
      setStep('success');
      toast({
        title: 'Success',
        description: 'Connection established successfully',
        variant: 'default',
      });
      // Refresh the page to show the new connection
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Auto-validate if initialCode is provided when modal opens
  useEffect(() => {
    if (isOpen && initialCode && initialCode.trim() && step === 'enter_code') {
      setShareCode(initialCode);
      validateMutation.mutate(initialCode.trim());
    }
  }, [isOpen, initialCode]);

  const handleValidate = () => {
    if (!shareCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a share code',
        variant: 'destructive',
      });
      return;
    }

    validateMutation.mutate(shareCode.trim());
  };

  const handleClaim = () => {
    claimMutation.mutate({
      inviteCode: shareCode,
      claimingRoleId: roleId,
      claimingUserId: userId,
    });
  };

  const handleClose = () => {
    setStep('enter_code');
    setShareCode(initialCode || '');
    setValidatedInvite(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">
              {step === 'enter_code' && 'Enter Share Code'}
              {step === 'confirm' && 'Confirm Connection'}
              {step === 'success' && 'Connection Established!'}
            </DialogTitle>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 -mt-2 -mr-2"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </DialogHeader>

        {/* Step 1: Enter Code */}
        {step === 'enter_code' && (
          <>
            <div className="py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Share Code
                </label>
                <Input
                  type="text"
                  value={shareCode}
                  onChange={(e) => setShareCode(e.target.value)}
                  placeholder="e.g., happy-turtle-jump"
                  className="font-mono"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleValidate();
                    }
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the 3-word code you received
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={handleClose}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleValidate}
                disabled={validateMutation.isPending}
              >
                {validateMutation.isPending ? 'Validating...' : 'Continue'}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 2: Confirm */}
        {step === 'confirm' && validatedInvite && (
          <>
            <div className="py-4 space-y-4">
              <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                {validatedInvite.ownerRole?.user?.image && (
                  <img
                    src={validatedInvite.ownerRole.user.image}
                    alt={validatedInvite.ownerRole.user.name || 'User'}
                    className="w-12 h-12 rounded-full"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {validatedInvite.ownerRole?.user?.name || 'Someone'}
                  </p>
                  <p className="text-sm text-gray-600">
                    wants to share{' '}
                    {validatedInvite.shareType === 'FULL_ROLE'
                      ? 'full access'
                      : validatedInvite.ownerPerson?.name || 'a person'}
                  </p>
                </div>
              </div>

              <div className="space-y-2 px-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Permission Level:</span>
                  <span className="font-medium capitalize">
                    {validatedInvite.permissions?.toLowerCase() || 'view'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Expires:</span>
                  <span className="font-medium">
                    {validatedInvite.expiresAt
                      ? new Date(validatedInvite.expiresAt).toLocaleDateString()
                      : 'Never'}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={() => setStep('enter_code')}
                variant="outline"
              >
                Back
              </Button>
              <Button
                onClick={handleClaim}
                disabled={claimMutation.isPending}
              >
                {claimMutation.isPending ? 'Connecting...' : 'Accept'}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 3: Success */}
        {step === 'success' && (
          <>
            <div className="py-8 text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-gray-600">
                You are now connected! Shared data will appear in your
                dashboard.
              </p>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="mx-auto">
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}