'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { trpc } from '@/lib/trpc/client';
import {
  UserPlus,
  CheckCircle,
  Loader2,
  Users,
  Info,
  AlertCircle,
  Clock,
} from 'lucide-react';
import type { Person } from '@/lib/types/database';

interface ClaimConnectionCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleId: string;
  roleType: 'PARENT' | 'TEACHER';
  persons: Person[]; // Available persons to connect
  onSuccess?: () => void;
}

/**
 * Modal for claiming a connection code and establishing a connection.
 * The user enters a code received from another account owner and selects
 * which of their persons should observe the origin person's tasks.
 */
export function ClaimConnectionCodeModal({
  isOpen,
  onClose,
  roleId,
  roleType,
  persons,
  onSuccess,
}: ClaimConnectionCodeModalProps) {
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'enter_code' | 'select_person' | 'success'>('enter_code');
  const [codeDetails, setCodeDetails] = useState<{
    codeId: string;
    originPerson: { id: string; name: string; avatar: string | null; isAccountOwner: boolean };
    originRole: { id: string; type: string };
    allowedTargetType: string;
    expiresAt: Date;
  } | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string>('');
  const { toast } = useToast();

  const utils = trpc.useUtils();

  // Validate code mutation
  const validateMutation = trpc.personConnection.validateCode.useMutation({
    onSuccess: (data) => {
      if (data.valid && data.codeDetails) {
        setCodeDetails(data.codeDetails);
        setStep('select_person');
      } else {
        toast({
          title: 'Invalid code',
          description: data.error || 'The code is invalid or expired',
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Error validating code',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Claim code mutation
  const claimMutation = trpc.personConnection.claimCode.useMutation({
    onSuccess: (data) => {
      setStep('success');
      toast({
        title: 'Connection established!',
        description: `You can now view ${data.originPersonName}'s task completion status.`,
        variant: 'default',
      });
      utils.personConnection.invalidate();
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: 'Error claiming code',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleValidate = () => {
    const trimmedCode = code.trim().toLowerCase();
    if (!trimmedCode) {
      toast({
        title: 'Empty code',
        description: 'Please enter a connection code',
        variant: 'destructive',
      });
      return;
    }

    // Validate code format (4 words separated by hyphens)
    if (!/^[a-z]+-[a-z]+-[a-z]+-[a-z]+$/.test(trimmedCode)) {
      toast({
        title: 'Invalid format',
        description: 'Code should be 4 words separated by hyphens (e.g., apple-banana-cherry-date)',
        variant: 'destructive',
      });
      return;
    }

    validateMutation.mutate({ code: trimmedCode });
  };

  const handleClaim = () => {
    if (!selectedPersonId) {
      toast({
        title: 'No person selected',
        description: 'Please select a person to connect',
        variant: 'destructive',
      });
      return;
    }

    claimMutation.mutate({
      code: code.trim().toLowerCase(),
      roleId,
      targetPersonId: selectedPersonId,
    });
  };

  const handleReset = () => {
    setStep('enter_code');
    setCode('');
    setCodeDetails(null);
    setSelectedPersonId('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // Filter persons based on allowed target type
  const getEligiblePersons = () => {
    if (!codeDetails) return [];

    const { allowedTargetType } = codeDetails;

    return persons.filter((p) => {
      if (allowedTargetType === 'KID') {
        // Only kids (non-account-owners in parent mode)
        return !p.isAccountOwner && roleType === 'PARENT';
      } else if (allowedTargetType === 'STUDENT') {
        // Only students (non-account-owners in teacher mode)
        return !p.isAccountOwner && roleType === 'TEACHER';
      } else if (allowedTargetType === 'PARENT_OR_KID') {
        // Parent account owner or their kids
        return roleType === 'PARENT';
      }
      return false;
    });
  };

  // Get description of what type of person can be connected
  const getEligibilityDescription = () => {
    if (!codeDetails) return '';

    const { allowedTargetType } = codeDetails;

    switch (allowedTargetType) {
      case 'KID':
        return 'Select one of your kids to connect to this student.';
      case 'STUDENT':
        return 'Select one of your students to connect to this kid.';
      case 'PARENT_OR_KID':
        return 'Select yourself or one of your kids to connect to this teacher.';
      default:
        return 'Select a person to connect.';
    }
  };

  const eligiblePersons = getEligiblePersons();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Claim Connection Code
          </DialogTitle>
        </DialogHeader>

        {step === 'enter_code' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  Enter a connection code you received from another account owner.
                  This will allow one of your {roleType === 'PARENT' ? 'kids' : 'students'} to
                  see their task completion status.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="connection-code">Connection Code</Label>
              <Input
                id="connection-code"
                placeholder="word-word-word-word"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
                className="font-mono"
              />
              <p className="text-xs text-gray-500">
                Format: four words separated by hyphens (e.g., apple-banana-cherry-date)
              </p>
            </div>

            <Button
              onClick={handleValidate}
              disabled={validateMutation.isPending || !code.trim()}
              className="w-full"
            >
              {validateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Validate Code
                </>
              )}
            </Button>
          </div>
        )}

        {step === 'select_person' && codeDetails && (
          <div className="space-y-6">
            {/* Code Details */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">Valid Code!</span>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-sm text-green-700">Origin Person: </span>
                  <span className="font-medium text-green-800">
                    {codeDetails.originPerson.name}
                    {codeDetails.originPerson.isAccountOwner && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Account Owner
                      </Badge>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm text-green-700">
                  <Clock className="h-4 w-4" />
                  Expires: {new Date(codeDetails.expiresAt).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Person Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                {getEligibilityDescription()}
              </Label>

              {eligiblePersons.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-yellow-800 font-medium">
                        No eligible persons found
                      </p>
                      <p className="text-sm text-yellow-700 mt-1">
                        {codeDetails.allowedTargetType === 'KID'
                          ? 'You need to add kids to your account first.'
                          : codeDetails.allowedTargetType === 'STUDENT'
                          ? 'You need to add students to your classroom first.'
                          : 'You don\'t have any eligible persons for this connection.'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                  {eligiblePersons.map((p) => (
                    <label
                      key={p.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedPersonId === p.id
                          ? 'bg-blue-50 border-2 border-blue-500'
                          : 'hover:bg-gray-50 border-2 border-transparent'
                      }`}
                    >
                      <input
                        type="radio"
                        name="person-select"
                        checked={selectedPersonId === p.id}
                        onChange={() => setSelectedPersonId(p.id)}
                        className="h-4 w-4"
                      />
                      <div className="flex items-center gap-3 flex-1">
                        {p.avatar ? (
                          <img
                            src={p.avatar}
                            alt={p.name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <Users className="h-5 w-5 text-gray-500" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{p.name}</p>
                          {p.isAccountOwner && (
                            <Badge variant="secondary" className="text-xs">
                              Account Owner
                            </Badge>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleReset} variant="outline" className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleClaim}
                disabled={claimMutation.isPending || !selectedPersonId}
                className="flex-1"
              >
                {claimMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Connect
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-600" />
              <h3 className="font-semibold text-lg text-green-800 mb-2">
                Connection Established!
              </h3>
              <p className="text-sm text-green-700">
                The connection has been set up. You can now view the connected person's
                task completion status in the dashboard.
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleReset} variant="outline" className="flex-1">
                Connect Another
              </Button>
              <Button onClick={handleClose} className="flex-1">
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
