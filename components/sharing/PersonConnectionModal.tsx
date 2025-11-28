'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/toast';
import { trpc } from '@/lib/trpc/client';
import {
  Share2,
  UserPlus,
  Settings,
  Copy,
  Trash2,
  Users,
  CheckCircle,
  Clock,
  Shield,
  Calendar,
  UserCheck,
  Loader2,
  Eye
} from 'lucide-react';
import type { Person } from '@/lib/types/database';

interface PersonConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person;
  roleId: string;
  roleType: 'PARENT' | 'TEACHER';
  userId: string;
}

export function PersonConnectionModal({
  isOpen,
  onClose,
  person,
  roleId,
  roleType,
  userId,
}: PersonConnectionModalProps) {
  const [activeTab, setActiveTab] = useState<'share' | 'claim' | 'manage'>('share');
  const { toast } = useToast();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Connection Settings for {person.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="share" className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </TabsTrigger>
            <TabsTrigger value="claim" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Claim
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Manage
            </TabsTrigger>
          </TabsList>

          <TabsContent value="share" className="space-y-4">
            <ShareTab
              person={person}
              roleId={roleId}
              roleType={roleType}
            />
          </TabsContent>

          <TabsContent value="claim" className="space-y-4">
            <ClaimTab
              person={person}
              roleId={roleId}
              userId={userId}
            />
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            <ManageTab
              person={person}
              roleId={roleId}
              roleType={roleType}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Share Tab Component
function ShareTab({
  person,
  roleId,
  roleType
}: {
  person: Person;
  roleId: string;
  roleType: 'PARENT' | 'TEACHER';
}) {
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const { toast } = useToast();

  const generateCodeMutation = trpc.personConnection.generateCode.useMutation({
    onSuccess: (data) => {
      setGeneratedCode(data.code);
      toast({
        title: 'Success!',
        description: 'Connection code generated!',
        variant: 'default',
      });
    },
    onError: (error) => {
      console.error('Generate code error:', error);
      console.error('Error data:', (error as any).data);
      toast({
        title: 'Error generating connection code',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });

  const handleGenerateCode = () => {
    // Validate roleId
    if (!roleId) {
      console.error('roleId is missing!');
      toast({
        title: 'Configuration Error',
        description: 'Role ID is missing. Please refresh the page.',
        variant: 'destructive',
      });
      return;
    }

    // Generate code for the person
    generateCodeMutation.mutate({
      roleId: roleId,
      originPersonId: person.id,
    });
  };

  const handleCopyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      toast({
        title: 'Copied!',
        description: 'Connection code copied to clipboard',
        variant: 'default',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          Generate a connection code for {person.name}. Others can use this code to observe {person.name}'s task completion status in their dashboard.
        </p>
      </div>

      {!generatedCode ? (
        <>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">How it works</h3>
            <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
              <li>A unique connection code will be generated for {person.name}</li>
              <li>Share the code with another {roleType === 'PARENT' ? 'parent' : 'teacher'}</li>
              <li>They can claim the code with one of their persons (kid or student)</li>
              <li>That person will then be able to see {person.name}'s tasks in their dashboard</li>
            </ul>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerateCode}
            disabled={generateCodeMutation.isPending}
            className="w-full"
          >
            {generateCodeMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4 mr-2" />
                Generate Connection Code
              </>
            )}
          </Button>
        </>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            <span className="font-semibold">Connection Code Generated!</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white px-4 py-2 rounded border font-mono text-lg">
              {generatedCode}
            </code>
            <Button onClick={handleCopyCode} size="sm" variant="outline">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-green-700">
            Share this code with another {roleType === 'PARENT' ? 'parent' : 'teacher'}.
            They can claim it in the "Claim" tab to connect one of their persons to observe {person.name}.
          </p>
          <Button
            onClick={() => setGeneratedCode(null)}
            variant="outline"
            className="w-full mt-2"
          >
            Generate Another Code
          </Button>
        </div>
      )}
    </div>
  );
}

// Claim Tab Component
function ClaimTab({
  person,
  roleId,
  userId,
}: {
  person: Person;
  roleId: string;
  userId: string;
}) {
  const [claimCode, setClaimCode] = useState('');
  const [step, setStep] = useState<'enter_code' | 'confirm' | 'success'>('enter_code');
  const [codeDetails, setCodeDetails] = useState<any>(null);
  const { toast } = useToast();

  const validateMutation = trpc.personConnection.validateCode.useMutation({
    onSuccess: (data) => {
      setCodeDetails(data);
      setStep('confirm');
    },
    onError: (error) => {
      toast({
        title: 'Invalid Code',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const claimMutation = trpc.personConnection.claimCode.useMutation({
    onSuccess: () => {
      setStep('success');
      toast({
        title: 'Success!',
        description: 'Connection established successfully!',
        variant: 'default',
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

  const handleValidate = () => {
    if (!claimCode.trim()) {
      toast({
        title: 'Empty Code',
        description: 'Please enter a connection code',
        variant: 'destructive',
      });
      return;
    }

    validateMutation.mutate({ code: claimCode.trim().toLowerCase() });
  };

  const handleClaim = () => {
    claimMutation.mutate({
      code: claimCode.trim().toLowerCase(),
      roleId: roleId,
      targetPersonId: person.id,
    });
  };

  const handleReset = () => {
    setStep('enter_code');
    setClaimCode('');
    setCodeDetails(null);
  };

  if (step === 'enter_code') {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Enter a connection code you received. {person.name} will be able to observe the other person's task completion status.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="claim-code">Connection Code</Label>
          <Input
            id="claim-code"
            placeholder="word-word-word-word"
            value={claimCode}
            onChange={(e) => setClaimCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
          />
          <p className="text-xs text-gray-500">
            Format: four words separated by hyphens (e.g., apple-banana-cherry-grape)
          </p>
        </div>

        <Button
          onClick={handleValidate}
          disabled={validateMutation.isPending || !claimCode.trim()}
          className="w-full"
        >
          {validateMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Validating...
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-2" />
              Validate Code
            </>
          )}
        </Button>
      </div>
    );
  }

  if (step === 'confirm' && codeDetails) {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800 mb-2">
            <CheckCircle className="h-5 w-5" />
            <span className="font-semibold">Valid Connection Code!</span>
          </div>
          <p className="text-sm text-green-700">
            Review the details below and confirm the connection.
          </p>
        </div>

        <div className="space-y-4 border rounded-lg p-4">
          <div>
            <Label className="text-xs text-gray-500">Person to Observe</Label>
            <p className="font-medium">
              {codeDetails.originPerson?.name || 'Unknown Person'}
            </p>
          </div>

          <div>
            <Label className="text-xs text-gray-500">From Account</Label>
            <p className="font-medium">
              {codeDetails.originOwner?.name || 'Unknown User'}
            </p>
          </div>

          <div>
            <Label className="text-xs text-gray-500">Observer</Label>
            <p className="font-medium">{person.name}</p>
            <p className="text-xs text-gray-500 mt-1">
              {person.name} will be able to see {codeDetails.originPerson?.name}'s tasks in their dashboard
            </p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> {person.name} will observe {codeDetails.originPerson?.name}'s tasks. The scope can be adjusted later in the Manage tab.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleReset}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleClaim}
            disabled={claimMutation.isPending}
            className="flex-1"
          >
            {claimMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Claiming...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm Connection
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-600" />
          <h3 className="font-semibold text-lg text-green-800 mb-2">
            Connection Established!
          </h3>
          <p className="text-sm text-green-700">
            {person.name} can now observe the connected person's tasks in their dashboard.
            You can manage this connection in the "Manage" tab.
          </p>
        </div>

        <Button onClick={handleReset} variant="outline" className="w-full">
          Claim Another Code
        </Button>
      </div>
    );
  }

  return null;
}

// Manage Tab Component
function ManageTab({
  person,
  roleId,
  roleType,
}: {
  person: Person;
  roleId: string;
  roleType: 'PARENT' | 'TEACHER';
}) {
  const { toast } = useToast();

  // Get connections where this person is the origin (their tasks are shared with others)
  const { data: outboundConnections, refetch: refetchOutbound } = trpc.personConnection.listAsOrigin.useQuery(
    { roleId, originPersonId: person.id },
    { enabled: !!roleId && !!person.id }
  );

  // Get connections where this person is the target (can observe others)
  const { data: inboundConnections, refetch: refetchInbound } = trpc.personConnection.listAsTarget.useQuery(
    { roleId, targetPersonId: person.id },
    { enabled: !!roleId && !!person.id }
  );

  const removeMutation = trpc.personConnection.remove.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Connection removed successfully',
        variant: 'default',
      });
      refetchOutbound();
      refetchInbound();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleRemove = (connectionId: string) => {
    if (confirm('Are you sure you want to remove this connection?')) {
      removeMutation.mutate({ connectionId });
    }
  };

  const personOutboundConnections = outboundConnections || [];
  const personInboundConnections = inboundConnections || [];

  return (
    <div className="space-y-6">
      {/* Outbound Connections - This person's tasks are shared with others */}
      <div className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          Who Can See {person.name}&apos;s Tasks ({personOutboundConnections.length})
        </h3>

        {personOutboundConnections.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border rounded-lg">
            <Users className="h-10 w-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No one is observing {person.name}&apos;s tasks yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {personOutboundConnections.map((connection: any) => (
              <div
                key={connection.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  {connection.targetPerson?.avatar ? (
                    <div className="text-3xl">
                      {(() => {
                        try {
                          const parsed = JSON.parse(connection.targetPerson.avatar);
                          return parsed.emoji || connection.targetPerson.name.charAt(0);
                        } catch {
                          return connection.targetPerson.name.charAt(0);
                        }
                      })()}
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <UserCheck className="h-5 w-5 text-gray-500" />
                    </div>
                  )}

                  <div>
                    <p className="font-medium">
                      {connection.targetPerson?.name || 'Unknown Person'}
                    </p>
                    <p className="text-xs text-gray-500">
                      from {connection.targetOwner?.name || 'Unknown User'}&apos;s account
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        {connection.scopeMode === 'ALL' ? 'All tasks' : 'Selected tasks'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(connection.createdAt).toLocaleDateString()}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(connection.id)}
                  disabled={removeMutation.isPending}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inbound Connections - This person can observe others */}
      <div className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Who {person.name} Can Observe ({personInboundConnections.length})
        </h3>

        {personInboundConnections.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border rounded-lg">
            <UserPlus className="h-10 w-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">{person.name} isn&apos;t observing anyone yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {personInboundConnections.map((connection: any) => (
              <div
                key={connection.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-blue-50 border-blue-200"
              >
                <div className="flex items-center gap-3">
                  {connection.originPerson?.avatar ? (
                    <div className="text-3xl">
                      {(() => {
                        try {
                          const parsed = JSON.parse(connection.originPerson.avatar);
                          return parsed.emoji || connection.originPerson.name.charAt(0);
                        } catch {
                          return connection.originPerson.name.charAt(0);
                        }
                      })()}
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center">
                      <UserPlus className="h-5 w-5 text-blue-600" />
                    </div>
                  )}

                  <div>
                    <p className="font-medium">
                      {connection.originPerson?.name || 'Unknown Person'}
                    </p>
                    <p className="text-xs text-gray-500">
                      from {connection.originOwner?.name || 'Unknown User'}&apos;s account
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        {connection.scopeMode === 'ALL' ? 'All tasks' : 'Selected tasks'}
                      </Badge>
                      <Badge variant="outline" className="text-xs text-blue-600">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(connection.createdAt).toLocaleDateString()}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(connection.id)}
                  disabled={removeMutation.isPending}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
