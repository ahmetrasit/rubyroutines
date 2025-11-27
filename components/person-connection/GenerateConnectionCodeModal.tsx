'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { trpc } from '@/lib/trpc/client';
import {
  Link2,
  Copy,
  CheckCircle,
  Clock,
  Loader2,
  Users,
  Info,
  RefreshCw,
} from 'lucide-react';
import type { Person } from '@/lib/types/database';

interface GenerateConnectionCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person;
  roleId: string;
  roleType: 'PARENT' | 'TEACHER';
}

/**
 * Modal for generating connection codes to allow other users to connect to this person.
 * The generated code can be shared with another account owner who can then connect
 * one of their persons to observe this person's task completion status.
 */
export function GenerateConnectionCodeModal({
  isOpen,
  onClose,
  person,
  roleId,
  roleType,
}: GenerateConnectionCodeModalProps) {
  const [generatedCode, setGeneratedCode] = useState<{
    code: string;
    expiresAt: Date;
    allowedTargetType: string;
  } | null>(null);
  const { toast } = useToast();

  // Get existing active codes for this person
  const {
    data: activeCodes,
    isLoading: isLoadingCodes,
    refetch: refetchCodes,
  } = trpc.personConnection.getActiveCodes.useQuery(
    { roleId, originPersonId: person.id },
    { enabled: isOpen }
  );

  // Generate code mutation
  const generateMutation = trpc.personConnection.generateCode.useMutation({
    onSuccess: (data) => {
      setGeneratedCode(data);
      refetchCodes();
      toast({
        title: 'Connection code generated!',
        description: 'Share this code with the other account owner.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error generating code',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Revoke code mutation
  const revokeMutation = trpc.personConnection.revokeCode.useMutation({
    onSuccess: () => {
      refetchCodes();
      toast({
        title: 'Code revoked',
        description: 'The connection code has been revoked.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error revoking code',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleGenerateCode = () => {
    generateMutation.mutate({
      roleId,
      originPersonId: person.id,
    });
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Copied!',
      description: 'Connection code copied to clipboard',
      variant: 'default',
    });
  };

  const handleRevokeCode = (codeId: string) => {
    if (confirm('Are you sure you want to revoke this code? It will no longer be usable.')) {
      revokeMutation.mutate({ codeId });
    }
  };

  // Determine what the recipient will see based on role type and person type
  const getTargetTypeDescription = (allowedTargetType: string) => {
    switch (allowedTargetType) {
      case 'KID':
        return 'Can be used by a parent to connect to one of their kids';
      case 'STUDENT':
        return 'Can be used by a teacher to connect to one of their students';
      case 'PARENT_OR_KID':
        return 'Can be used by a parent to connect themselves or one of their kids';
      default:
        return 'Can be used to establish a connection';
    }
  };

  // Get description for who this person can connect to
  const getConnectionDescription = () => {
    if (roleType === 'TEACHER') {
      if (person.isAccountOwner) {
        return 'This teacher can be connected to a parent or their kids. The connected person will be able to see this teacher\'s task completion status.';
      } else {
        return 'This student can be connected to a kid in a parent account. The kid will be able to see this student\'s task completion status.';
      }
    } else {
      if (person.isAccountOwner) {
        return 'This parent can be connected to a student in a classroom. The student will be able to see this parent\'s task completion status.';
      } else {
        return 'This kid can be connected to a student in a classroom. The student will be able to see this kid\'s task completion status.';
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Generate Connection Code for {person.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                {getConnectionDescription()}
              </p>
            </div>
          </div>

          {/* Generate New Code Button */}
          <Button
            onClick={handleGenerateCode}
            disabled={generateMutation.isPending}
            className="w-full"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Link2 className="h-4 w-4 mr-2" />
                Generate New Connection Code
              </>
            )}
          </Button>

          {/* Newly Generated Code */}
          {generatedCode && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">Connection Code Generated!</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white px-4 py-3 rounded border font-mono text-lg text-center">
                  {generatedCode.code}
                </code>
                <Button
                  onClick={() => handleCopyCode(generatedCode.code)}
                  size="sm"
                  variant="outline"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between text-sm text-green-700">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Expires: {new Date(generatedCode.expiresAt).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-green-700">
                {getTargetTypeDescription(generatedCode.allowedTargetType)}
              </p>
            </div>
          )}

          {/* Active Codes Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Active Codes
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetchCodes()}
                disabled={isLoadingCodes}
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingCodes ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {isLoadingCodes ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : activeCodes && activeCodes.length > 0 ? (
              <div className="space-y-2">
                {activeCodes.map((code) => (
                  <div
                    key={code.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                  >
                    <div className="flex-1">
                      <code className="font-mono text-sm">{code.code}</code>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {code.allowedTargetType}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Expires: {new Date(code.expiresAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyCode(code.code)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeCode(code.id)}
                        disabled={revokeMutation.isPending}
                        className="text-red-600 hover:text-red-700"
                      >
                        Revoke
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 border rounded-lg">
                <Link2 className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No active codes</p>
                <p className="text-xs mt-1">Generate a code to share with others</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
