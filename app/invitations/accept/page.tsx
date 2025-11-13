'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Mail, UserPlus, Users, Loader2 } from 'lucide-react';

export default function AcceptInvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { toast } = useToast();

  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const { data: session, isLoading: sessionLoading } = trpc.auth.getSession.useQuery();
  const { data: invitation, isLoading: invitationLoading, error } = trpc.invitation.getByToken.useQuery(
    { token: token || '' },
    { enabled: !!token }
  );

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
        router.push('/dashboard');
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
      router.push('/dashboard');
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

  const handleAccept = () => {
    if (!token) return;
    setIsAccepting(true);
    acceptMutation.mutate({ token });
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
              <Button onClick={() => router.push('/dashboard')}>
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if logged-in user's email matches invitation
  const emailMatches = session.user.email === invitation.inviteeEmail;

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
        return 'You have been invited to collaborate on a classroom';
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
      const variant = variants[permission] || variants.READ_ONLY;
      return <Badge className={variant.className}>{variant.label}</Badge>;
    } else if (type === 'CO_TEACHER') {
      const variants: Record<string, { label: string; className: string }> = {
        VIEW: { label: 'View Only', className: 'bg-gray-100 text-gray-800' },
        EDIT_TASKS: { label: 'Edit Tasks', className: 'bg-blue-100 text-blue-800' },
        FULL_EDIT: { label: 'Full Edit', className: 'bg-green-100 text-green-800' },
      };
      const variant = variants[permission] || variants.VIEW;
      return <Badge className={variant.className}>{variant.label}</Badge>;
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
              disabled={isAccepting || isRejecting || !emailMatches}
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
