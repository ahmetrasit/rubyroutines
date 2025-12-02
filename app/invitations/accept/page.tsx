'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Check, X, Mail, UserPlus, Users, Loader2, Plus, User } from 'lucide-react';

// Type for person linking state
type PersonLinking = {
  primaryPersonId: string;  // Inviter's kid/student (from invitation)
  linkedPersonId: string | null;  // Accepting user's kid/student (selected)
  createNew: boolean;  // Whether to create a new person
  newPersonName: string;  // Name for new person if createNew is true
};

export default function AcceptInvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');
  const { toast } = useToast();

  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [personLinkings, setPersonLinkings] = useState<PersonLinking[]>([]);

  const { data: session, isLoading: sessionLoading } = trpc.auth.getSession.useQuery();
  const { data: invitation, isLoading: invitationLoading, error } = trpc.invitation.getByToken.useQuery(
    { token: token || '' },
    { enabled: !!token }
  );

  // Get the accepting user's parent role (for CO_PARENT)
  const parentRole = useMemo(() => {
    if (!session?.user?.roles) return null;
    return session.user.roles.find((r: { type: string }) => r.type === 'PARENT');
  }, [session]);

  // Get the accepting user's teacher role (for CO_TEACHER)
  const teacherRole = useMemo(() => {
    if (!session?.user?.roles) return null;
    return session.user.roles.find((r: { type: string }) => r.type === 'TEACHER');
  }, [session]);

  // Determine which role to use based on invitation type
  const activeRole = useMemo(() => {
    if (invitation?.type === 'CO_PARENT') return parentRole;
    if (invitation?.type === 'CO_TEACHER') return teacherRole;
    return null;
  }, [invitation?.type, parentRole, teacherRole]);

  // Check if this invitation needs linking
  const needsLinking = useMemo(() => {
    return (invitation?.type === 'CO_PARENT' || invitation?.type === 'CO_TEACHER')
      && invitation?.sharedPersons
      && invitation.sharedPersons.length > 0;
  }, [invitation]);

  // Fetch accepting user's existing persons (kids for parent, students for teacher)
  const { data: myPersons, isLoading: personsLoading } = trpc.person.list.useQuery(
    { roleId: activeRole?.id || '' },
    { enabled: !!activeRole?.id && needsLinking }
  );

  // Filter to only non-account-owner, non-teacher persons (actual kids/students)
  const availablePersons = useMemo(() => {
    if (!myPersons) return [];
    return myPersons.filter((p: { isAccountOwner?: boolean; isTeacher?: boolean }) =>
      !p.isAccountOwner && !p.isTeacher
    );
  }, [myPersons]);

  // Initialize personLinkings when invitation loads
  useEffect(() => {
    if (needsLinking && invitation?.sharedPersons && invitation.sharedPersons.length > 0) {
      setPersonLinkings(
        invitation.sharedPersons.map((sp) => ({
          primaryPersonId: sp.personId,
          linkedPersonId: null,
          createNew: false,
          newPersonName: sp.personName, // Pre-fill with inviter's person name
        }))
      );
    }
  }, [invitation, needsLinking]);

  const acceptMutation = trpc.invitation.accept.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Invitation accepted successfully',
        variant: 'success',
      });
      // Redirect based on invitation type
      if (invitation?.type === 'CO_PARENT') {
        router.push('/parent/connections');
      } else if (invitation?.type === 'CO_TEACHER') {
        router.push('/teacher/sharing');
      } else {
        router.push('/parent');
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      setIsAccepting(false);
    },
  });

  const rejectMutation = trpc.invitation.reject.useMutation({
    onSuccess: () => {
      toast({
        title: 'Invitation Rejected',
        description: 'You have declined this invitation',
        variant: 'success',
      });
      router.push('/parent');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      setIsRejecting(false);
    },
  });

  useEffect(() => {
    if (!sessionLoading && !session?.user) {
      // Redirect to login with return URL
      router.push(`/login?redirect=/invitations/accept?token=${token}`);
    }
  }, [sessionLoading, session, router, token]);

  // Update a specific person linking
  const updateLinking = (index: number, updates: Partial<PersonLinking>) => {
    setPersonLinkings(prev => {
      const newLinkings = [...prev];
      const existing = newLinkings[index];
      if (existing) {
        newLinkings[index] = {
          primaryPersonId: updates.primaryPersonId ?? existing.primaryPersonId,
          linkedPersonId: updates.linkedPersonId !== undefined ? updates.linkedPersonId : existing.linkedPersonId,
          createNew: updates.createNew ?? existing.createNew,
          newPersonName: updates.newPersonName ?? existing.newPersonName,
        };
      }
      return newLinkings;
    });
  };

  // Check if all shared persons are properly linked
  const allPersonsLinked = useMemo(() => {
    if (!invitation?.sharedPersons || invitation.sharedPersons.length === 0) {
      return true; // No linking required
    }
    return personLinkings.every(l =>
      (l.createNew && l.newPersonName.trim()) || (!l.createNew && l.linkedPersonId)
    );
  }, [invitation?.sharedPersons, personLinkings]);

  const handleAccept = () => {
    if (!token) return;

    // Validate linkings for invitations with sharedPersons
    if (needsLinking && !allPersonsLinked) {
      const personLabel = invitation?.type === 'CO_TEACHER' ? 'students' : 'children';
      toast({
        title: 'Incomplete Linking',
        description: `Please link all shared ${personLabel} before accepting`,
        variant: 'destructive',
      });
      return;
    }

    setIsAccepting(true);

    // Prepare personLinkings for the mutation
    const linkingsForMutation = needsLinking
      ? personLinkings.map(l => ({
          primaryPersonId: l.primaryPersonId,
          linkedPersonId: l.createNew ? null : l.linkedPersonId,
          createNew: l.createNew,
          newPersonName: l.createNew ? l.newPersonName : undefined,
        }))
      : undefined;

    acceptMutation.mutate({ token, personLinkings: linkingsForMutation });
  };

  const handleReject = () => {
    if (!token) return;
    if (confirm('Are you sure you want to decline this invitation?')) {
      setIsRejecting(true);
      rejectMutation.mutate({ token });
    }
  };

  if (sessionLoading || invitationLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  if (!token || error || !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full">
          <CardContent className="py-8">
            <div className="text-center">
              <X className="h-16 w-16 mx-auto text-red-500 mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h1>
              <p className="text-gray-600 mb-6">
                {error?.message || 'This invitation link is invalid or has expired.'}
              </p>
              <Button onClick={() => router.push('/parent')}>
                Go to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if logged-in user's email matches invitation
  const emailMatches = session.user.email === invitation.inviteeEmail;

  // Get labels based on invitation type
  const personLabel = invitation.type === 'CO_TEACHER' ? 'Students' : 'Children';
  const personLabelSingular = invitation.type === 'CO_TEACHER' ? 'student' : 'child';

  const getInvitationIcon = (type: string) => {
    switch (type) {
      case 'CO_PARENT':
        return <UserPlus className="h-12 w-12 text-blue-600" />;
      case 'CO_TEACHER':
        return <Users className="h-12 w-12 text-purple-600" />;
      default:
        return <Mail className="h-12 w-12 text-gray-600" />;
    }
  };

  const getInvitationTitle = (type: string) => {
    switch (type) {
      case 'CO_PARENT':
        return 'Co-Parent Invitation';
      case 'CO_TEACHER':
        return 'Co-Teacher Invitation';
      default:
        return 'Invitation';
    }
  };

  const getInvitationDescription = (type: string) => {
    switch (type) {
      case 'CO_PARENT':
        return 'You have been invited to share access to children and their routines';
      case 'CO_TEACHER':
        return 'You have been invited to collaborate on students and their routines';
      default:
        return 'You have been invited to collaborate';
    }
  };

  const getPermissionBadge = (permission: string, type: string) => {
    if (type === 'CO_PARENT') {
      const variants: Record<string, { label: string; className: string }> = {
        READ_ONLY: { label: 'Read Only', className: 'bg-gray-100 text-gray-800' },
        TASK_COMPLETION: { label: 'Task Completion', className: 'bg-blue-100 text-blue-800' },
        FULL_EDIT: { label: 'Full Edit', className: 'bg-green-100 text-green-800' },
      };
      const variant = variants[permission] ?? variants.READ_ONLY;
      return <Badge className={variant!.className}>{variant!.label}</Badge>;
    } else if (type === 'CO_TEACHER') {
      const variants: Record<string, { label: string; className: string }> = {
        VIEW: { label: 'View Only', className: 'bg-gray-100 text-gray-800' },
        EDIT_TASKS: { label: 'Edit Tasks', className: 'bg-blue-100 text-blue-800' },
        FULL_EDIT: { label: 'Full Edit', className: 'bg-green-100 text-green-800' },
      };
      const variant = variants[permission] ?? variants.VIEW;
      return <Badge className={variant!.className}>{variant!.label}</Badge>;
    }
    return <Badge>{permission}</Badge>;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            {getInvitationIcon(invitation.type)}
          </div>
          <CardTitle className="text-center text-2xl">
            {getInvitationTitle(invitation.type)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Warning */}
          {!emailMatches && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> This invitation was sent to{' '}
                <strong>{invitation.inviteeEmail}</strong>, but you&apos;re logged in as{' '}
                <strong>{session.user.email}</strong>. You may need to log in with the correct account.
              </p>
            </div>
          )}

          {/* Invitation Details */}
          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">From</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{invitation.inviterName}</p>
                  <p className="text-sm text-gray-600">{invitation.inviterEmail}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">To</p>
              <p className="font-medium text-gray-900">{invitation.inviteeEmail}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">Permission Level</p>
              {getPermissionBadge(invitation.permissions, invitation.type)}
            </div>

            <div>
              <p className="text-sm text-gray-600">
                {getInvitationDescription(invitation.type)}
              </p>
            </div>
          </div>

          {/* Person Linking UI for CO_PARENT and CO_TEACHER invitations */}
          {needsLinking && (
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Link {personLabel}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {invitation.inviterName} wants to share the following {personLabel.toLowerCase()} with you.
                Link each one to your existing {personLabelSingular} or create a new one.
              </p>

              {personsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <span className="ml-2 text-sm text-gray-600">Loading your {personLabel.toLowerCase()}...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {invitation.sharedPersons?.map((sharedPerson, index) => {
                    const linking = personLinkings[index];
                    if (!linking) return null;

                    return (
                      <div key={sharedPerson.personId} className="bg-white rounded-lg p-4 border border-gray-200">
                        {/* Shared person info */}
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="h-5 w-5 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{sharedPerson.personName}</p>
                            <p className="text-xs text-gray-500">
                              Routines: {sharedPerson.routineNames.join(', ')}
                            </p>
                          </div>
                        </div>

                        {/* Linking options */}
                        <div className="ml-13 space-y-2">
                          <label className="text-sm font-medium text-gray-700">Link to:</label>

                          {/* Toggle between select existing and create new */}
                          <div className="flex gap-2 mb-2">
                            <button
                              type="button"
                              onClick={() => updateLinking(index, { createNew: false, linkedPersonId: null })}
                              className={`flex-1 px-3 py-2 text-sm rounded-md border ${
                                !linking.createNew
                                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              Select Existing
                            </button>
                            <button
                              type="button"
                              onClick={() => updateLinking(index, { createNew: true, linkedPersonId: null })}
                              className={`flex-1 px-3 py-2 text-sm rounded-md border ${
                                linking.createNew
                                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <Plus className="h-4 w-4 inline mr-1" />
                              Create New
                            </button>
                          </div>

                          {linking.createNew ? (
                            // Create new person input
                            <Input
                              placeholder={`Enter ${personLabelSingular}'s name`}
                              value={linking.newPersonName}
                              onChange={(e) => updateLinking(index, { newPersonName: e.target.value })}
                              className="w-full"
                            />
                          ) : (
                            // Select existing person
                            <Select
                              value={linking.linkedPersonId || ''}
                              onValueChange={(value) => updateLinking(index, { linkedPersonId: value })}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder={`Select your ${personLabelSingular}`} />
                              </SelectTrigger>
                              <SelectContent>
                                {availablePersons.length === 0 ? (
                                  <div className="px-2 py-3 text-sm text-gray-500 text-center">
                                    No {personLabel.toLowerCase()} found. Click &quot;Create New&quot; to add one.
                                  </div>
                                ) : (
                                  availablePersons.map((person: { id: string; name: string }) => (
                                    <SelectItem key={person.id} value={person.id}>
                                      {person.name}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          )}

                          {/* Validation indicator */}
                          {((linking.createNew && linking.newPersonName.trim()) ||
                            (!linking.createNew && linking.linkedPersonId)) && (
                            <div className="flex items-center gap-1 text-green-600 text-xs">
                              <Check className="h-3 w-3" />
                              <span>Ready</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Validation message */}
              {!allPersonsLinked && personLinkings.length > 0 && (
                <p className="text-sm text-amber-600 mt-3">
                  Please link all {personLabel.toLowerCase()} before accepting the invitation.
                </p>
              )}
            </div>
          )}

          {/* Expiry Info */}
          <div className="text-center text-sm text-gray-500">
            Invitation expires on {new Date(invitation.expiresAt).toLocaleDateString()} at{' '}
            {new Date(invitation.expiresAt).toLocaleTimeString()}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleReject}
              disabled={isRejecting || isAccepting}
            >
              {isRejecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Declining...
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Decline
                </>
              )}
            </Button>
            <Button
              className="flex-1"
              onClick={handleAccept}
              disabled={isAccepting || isRejecting || !emailMatches || (needsLinking && !allPersonsLinked)}
            >
              {isAccepting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Accept Invitation
                </>
              )}
            </Button>
          </div>

          {!emailMatches && (
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/logout')}
              >
                Log out and sign in with correct account
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
