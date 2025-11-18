'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
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
  Loader2
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
  const [recipientEmail, setRecipientEmail] = useState('');
  const [selectedRoutines, setSelectedRoutines] = useState<string[]>([]);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const { toast } = useToast();

  // Get person details with routines
  const { data: personDetails, isLoading } = trpc.person.getById.useQuery({ id: person.id });

  const generateInviteMutation = trpc.personSharing.generateInvite.useMutation({
    onSuccess: (data) => {
      setGeneratedCode(data.code);
      toast({
        title: 'Success!',
        description: data.emailSent
          ? 'Share code generated and email sent!'
          : 'Share code generated!',
        variant: 'default',
      });
    },
    onError: (error) => {
      console.error('Generate invite error:', error);
      console.error('Error data:', (error as any).data);
      toast({
        title: 'Error generating share code',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });

  const handleGenerateCode = () => {
    if (selectedRoutines.length === 0) {
      toast({
        title: 'No routines selected',
        description: 'Please select at least one routine to share',
        variant: 'destructive',
      });
      return;
    }

    const payload: any = {
      ownerRoleId: roleId,
      ownerPersonId: person.id,
      shareType: 'ROUTINE_ACCESS',
      permissions: 'VIEW',
      contextData: {
        routineIds: selectedRoutines,
        personName: person.name,
      },
    };

    // Only include recipientEmail if it's actually filled in
    if (recipientEmail && recipientEmail.trim()) {
      payload.recipientEmail = recipientEmail.trim();
    }

    console.log('Generating invite with payload:', payload);
    console.log('roleId value:', roleId);
    console.log('person.id value:', person.id);
    console.log('selectedRoutines:', selectedRoutines);

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

    generateInviteMutation.mutate(payload);
  };

  const handleCopyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      toast({
        title: 'Copied!',
        description: 'Share code copied to clipboard',
        variant: 'default',
      });
    }
  };

  const handleSelectAll = () => {
    if (!personDetails?.assignments) return;

    const allRoutineIds = personDetails.assignments.map((a: any) => a.routineId);
    setSelectedRoutines(allRoutineIds);
  };

  const handleDeselectAll = () => {
    setSelectedRoutines([]);
  };

  const toggleRoutine = (routineId: string) => {
    setSelectedRoutines(prev =>
      prev.includes(routineId)
        ? prev.filter(id => id !== routineId)
        : [...prev, routineId]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const routines = personDetails?.assignments || [];

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          Share {person.name}'s task completion status with another {roleType === 'PARENT' ? 'parent (co-parent)' : 'teacher (co-teacher)'}.
          They'll receive read-only access to view progress and analytics.
        </p>
      </div>

      {/* Routine Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Select Routines to Share</Label>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleSelectAll}
              disabled={routines.length === 0}
            >
              Select All
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDeselectAll}
              disabled={selectedRoutines.length === 0}
            >
              Deselect All
            </Button>
          </div>
        </div>

        {routines.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No routines assigned to {person.name}</p>
            <p className="text-sm mt-1">Assign some routines first to share them</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3">
            {routines.map((assignment: any) => (
              <label
                key={assignment.routineId}
                className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedRoutines.includes(assignment.routineId)}
                  onChange={() => toggleRoutine(assignment.routineId)}
                  className="h-4 w-4 cursor-pointer rounded border border-gray-300 bg-white checked:border-blue-600 checked:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                />
                <div className="flex-1">
                  <p className="font-medium">{assignment.routine.name}</p>
                  <p className="text-sm text-gray-500">
                    {assignment.routine.tasks?.length || 0} tasks
                  </p>
                </div>
              </label>
            ))}
          </div>
        )}

        <p className="text-sm text-gray-600">
          {selectedRoutines.length} routine{selectedRoutines.length !== 1 ? 's' : ''} selected
        </p>
      </div>

      {/* Optional Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Recipient Email (Optional)</Label>
        <Input
          id="email"
          type="email"
          placeholder="friend@example.com"
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
        />
        <p className="text-xs text-gray-500">
          If provided, we'll send them an email with the share code
        </p>
      </div>

      {/* Generate Button */}
      <Button
        onClick={handleGenerateCode}
        disabled={generateInviteMutation.isPending || selectedRoutines.length === 0}
        className="w-full"
      >
        {generateInviteMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Share2 className="h-4 w-4 mr-2" />
            Generate Share Code
          </>
        )}
      </Button>

      {/* Generated Code Display */}
      {generatedCode && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            <span className="font-semibold">Share Code Generated!</span>
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
            Share this code with the other {roleType === 'PARENT' ? 'parent' : 'teacher'}.
            They can claim it in the "Claim" tab.
          </p>
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
  const [inviteDetails, setInviteDetails] = useState<any>(null);
  const { toast } = useToast();

  const validateMutation = trpc.personSharing.validateInvite.useMutation({
    onSuccess: (data) => {
      setInviteDetails(data);
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

  const claimMutation = trpc.personSharing.claimInvite.useMutation({
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
        description: 'Please enter a share code',
        variant: 'destructive',
      });
      return;
    }

    validateMutation.mutate(claimCode.trim().toLowerCase());
  };

  const handleClaim = () => {
    claimMutation.mutate({
      inviteCode: claimCode.trim().toLowerCase(),
      claimingRoleId: roleId,
      claimingUserId: userId,
      contextData: {
        matchedPersonId: person.id,
        matchedPersonName: person.name,
      },
    });
  };

  const handleReset = () => {
    setStep('enter_code');
    setClaimCode('');
    setInviteDetails(null);
  };

  if (step === 'enter_code') {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Enter a share code you received to connect {person.name} to another person's shared data.
            This will give you read-only access to their task completion status.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="claim-code">Share Code</Label>
          <Input
            id="claim-code"
            placeholder="word1-word2-word3"
            value={claimCode}
            onChange={(e) => setClaimCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
          />
          <p className="text-xs text-gray-500">
            Format: three words separated by hyphens (e.g., apple-banana-cherry)
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

  if (step === 'confirm' && inviteDetails) {
    const [matchingOption, setMatchingOption] = React.useState<'existing' | 'new'>('new');
    const [selectedPersonId, setSelectedPersonId] = React.useState<string>('');

    // Get list of persons for matching
    const { data: myPersons } = trpc.person.list.useQuery({ roleId });

    const handleClaimWithMatching = () => {
      claimMutation.mutate({
        inviteCode: claimCode.trim().toLowerCase(),
        claimingRoleId: roleId,
        claimingUserId: userId,
        contextData: {
          matchingOption,
          matchedPersonId: matchingOption === 'existing' ? selectedPersonId : undefined,
          createNew: matchingOption === 'new',
        },
      });
    };

    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800 mb-2">
            <CheckCircle className="h-5 w-5" />
            <span className="font-semibold">Valid Share Code!</span>
          </div>
          <p className="text-sm text-green-700">
            Review the details below and choose how to connect.
          </p>
        </div>

        <div className="space-y-4 border rounded-lg p-4">
          <div>
            <Label className="text-xs text-gray-500">Shared By</Label>
            <p className="font-medium">
              {inviteDetails.ownerRole?.user?.name || 'Unknown User'}
            </p>
          </div>

          {inviteDetails.ownerPerson && (
            <div>
              <Label className="text-xs text-gray-500">Person</Label>
              <p className="font-medium">{inviteDetails.ownerPerson.name}</p>
            </div>
          )}

          <div>
            <Label className="text-xs text-gray-500">Access Level</Label>
            <Badge variant="secondary" className="mt-1">
              <Shield className="h-3 w-3 mr-1" />
              {inviteDetails.permissions} (Read-Only)
            </Badge>
          </div>

          {inviteDetails.contextData?.routineIds && (
            <div>
              <Label className="text-xs text-gray-500">Shared Routines</Label>
              <p className="text-sm">
                {inviteDetails.contextData.routineIds.length} routine{inviteDetails.contextData.routineIds.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>

        {/* Matching Options */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">How would you like to connect this person?</Label>

          <div className="space-y-2">
            <div
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                matchingOption === 'new'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setMatchingOption('new')}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  checked={matchingOption === 'new'}
                  onChange={() => setMatchingOption('new')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-medium">Create New Member</p>
                  <p className="text-sm text-gray-600">
                    Add {inviteDetails.ownerPerson?.name || 'this person'} as a new member to view their shared routines
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                matchingOption === 'existing'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setMatchingOption('existing')}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  checked={matchingOption === 'existing'}
                  onChange={() => setMatchingOption('existing')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-medium">Match to Existing Member</p>
                  <p className="text-sm text-gray-600">
                    Connect to an existing member in your account
                  </p>
                </div>
              </div>

              {matchingOption === 'existing' && (
                <div className="mt-3 ml-6">
                  <Label htmlFor="match-person" className="text-sm">Select Member</Label>
                  <select
                    id="match-person"
                    value={selectedPersonId}
                    onChange={(e) => setSelectedPersonId(e.target.value)}
                    className="mt-1 w-full border rounded-md p-2"
                  >
                    <option value="">-- Select a member --</option>
                    {myPersons?.filter((p: any) => !p.isAccountOwner).map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
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
            onClick={handleClaimWithMatching}
            disabled={
              claimMutation.isPending ||
              (matchingOption === 'existing' && !selectedPersonId)
            }
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
            {person.name} is now connected to the shared data. You can view shared task completion
            status and analytics in the person's detail page.
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

  // Get connections where this person is the owner (sent)
  const { data: ownedConnections, refetch: refetchOwned } = trpc.personSharing.getConnections.useQuery(
    { roleId, type: 'owned' },
    { enabled: !!roleId }
  );

  // Get connections where this person is shared with me (received)
  const { data: sharedConnections, refetch: refetchShared } = trpc.personSharing.getConnections.useQuery(
    { roleId, type: 'shared_with_me' },
    { enabled: !!roleId }
  );

  const revokeMutation = trpc.personSharing.revokeConnection.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Connection revoked successfully',
        variant: 'default',
      });
      refetchOwned();
      refetchShared();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleRevoke = (connectionId: string) => {
    if (confirm('Are you sure you want to revoke this connection?')) {
      revokeMutation.mutate({ connectionId });
    }
  };

  // Filter connections for this specific person
  const personOwnedConnections = ownedConnections?.filter(
    (c: any) => c.ownerPersonId === person.id
  ) || [];

  const personSharedConnections = sharedConnections?.filter(
    (c: any) => c.contextData?.matchedPersonId === person.id
  ) || [];

  return (
    <div className="space-y-6">
      {/* Sent Connections */}
      <div className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          Shared with Others ({personOwnedConnections.length})
        </h3>

        {personOwnedConnections.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border rounded-lg">
            <Users className="h-10 w-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No active connections</p>
          </div>
        ) : (
          <div className="space-y-2">
            {personOwnedConnections.map((connection: any) => (
              <div
                key={connection.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  {connection.sharedWithRole?.user?.image ? (
                    <img
                      src={connection.sharedWithRole.user.image}
                      alt={connection.sharedWithRole.user.name || 'User'}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <UserCheck className="h-5 w-5 text-gray-500" />
                    </div>
                  )}

                  <div>
                    <p className="font-medium">
                      {connection.sharedWithRole?.user?.name || 'Unknown User'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        {connection.permissions}
                      </Badge>
                      {connection.contextData?.routineIds && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {connection.contextData.routineIds.length} routines
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRevoke(connection.id)}
                  disabled={revokeMutation.isPending}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Received Connections */}
      <div className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Shared by Others ({personSharedConnections.length})
        </h3>

        {personSharedConnections.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border rounded-lg">
            <UserPlus className="h-10 w-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No shared connections</p>
          </div>
        ) : (
          <div className="space-y-2">
            {personSharedConnections.map((connection: any) => (
              <div
                key={connection.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-blue-50 border-blue-200"
              >
                <div className="flex items-center gap-3">
                  {connection.ownerRole?.user?.image ? (
                    <img
                      src={connection.ownerRole.user.image}
                      alt={connection.ownerRole.user.name || 'User'}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center">
                      <UserPlus className="h-5 w-5 text-blue-600" />
                    </div>
                  )}

                  <div>
                    <p className="font-medium">
                      Shared by {connection.ownerRole?.user?.name || 'Unknown User'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        {connection.permissions} (Read-Only)
                      </Badge>
                      {connection.ownerPerson && (
                        <Badge variant="outline" className="text-xs text-blue-600">
                          {connection.ownerPerson.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <Badge variant="outline" className="text-blue-600 border-blue-600 text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(connection.createdAt).toLocaleDateString()}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
