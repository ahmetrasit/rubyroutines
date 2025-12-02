'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, UserPlus, GraduationCap, Users, Loader2, Check, X } from 'lucide-react';
import Link from 'next/link';

export default function InviteStaffPage() {
  const params = useParams();
  const router = useRouter();
  const schoolId = params?.schoolId as string;

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'TEACHER' | 'SUPPORT'>('TEACHER');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { data: session } = trpc.auth.getSession.useQuery();
  const utils = trpc.useUtils();

  // Get school membership for this school
  const user = session?.user as any;
  const membership = user?.schoolMemberships?.find(
    (m: any) => m.schoolId === schoolId && m.role === 'PRINCIPAL'
  );

  // Fetch pending invitations
  const { data: pendingInvitations, refetch: refetchInvitations } = trpc.school.getPendingInvitations.useQuery(
    { schoolId, roleId: membership?.roleId || '' },
    { enabled: !!schoolId && !!membership?.roleId }
  );

  const inviteTeacherMutation = trpc.school.inviteTeacher.useMutation({
    onSuccess: () => {
      setSuccess(`Invitation sent to ${email}`);
      setEmail('');
      refetchInvitations();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const inviteSupportMutation = trpc.school.inviteSupport.useMutation({
    onSuccess: () => {
      setSuccess(`Invitation sent to ${email}`);
      setEmail('');
      refetchInvitations();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const cancelInvitationMutation = trpc.school.cancelInvitation.useMutation({
    onSuccess: () => {
      refetchInvitations();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!membership?.roleId) {
      setError('You do not have permission to invite staff');
      return;
    }

    if (role === 'TEACHER') {
      inviteTeacherMutation.mutate({
        roleId: membership.roleId,
        schoolId,
        email: email.trim(),
      });
    } else {
      inviteSupportMutation.mutate({
        roleId: membership.roleId,
        schoolId,
        email: email.trim(),
      });
    }
  };

  const isPending = inviteTeacherMutation.isPending || inviteSupportMutation.isPending;

  if (!membership) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-gray-600 dark:text-gray-400">
              You don&apos;t have principal access to this school.
            </p>
            <Link href="/principal">
              <Button className="mt-4">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/principal">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle>Invite Staff</CardTitle>
                <CardDescription>
                  Invite teachers or support staff to join your school
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Role Selection */}
              <div className="space-y-3">
                <Label>Staff Role</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRole('TEACHER')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      role === 'TEACHER'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <GraduationCap className={`h-8 w-8 mx-auto mb-2 ${
                      role === 'TEACHER' ? 'text-blue-500' : 'text-gray-400'
                    }`} />
                    <p className="font-medium">Teacher</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Can manage classrooms and students
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('SUPPORT')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      role === 'SUPPORT'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Users className={`h-8 w-8 mx-auto mb-2 ${
                      role === 'SUPPORT' ? 'text-purple-500' : 'text-gray-400'
                    }`} />
                    <p className="font-medium">Support Staff</p>
                    <p className="text-xs text-gray-500 mt-1">
                      View access to school data
                    </p>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="teacher@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isPending}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  {success}
                </div>
              )}

              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending Invitation...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Pending Invitations */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>
              Invitations that haven&apos;t been accepted yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!pendingInvitations || pendingInvitations.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                No pending invitations
              </p>
            ) : (
              <div className="space-y-3">
                {pendingInvitations.map((inv: any) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {inv.schoolRole === 'TEACHER' ? (
                        <GraduationCap className="h-5 w-5 text-blue-500" />
                      ) : (
                        <Users className="h-5 w-5 text-purple-500" />
                      )}
                      <div>
                        <p className="font-medium">{inv.email}</p>
                        <p className="text-xs text-gray-500">
                          {inv.schoolRole === 'TEACHER' ? 'Teacher' : 'Support Staff'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cancelInvitationMutation.mutate({
                        invitationId: inv.id,
                        roleId: membership.roleId,
                        schoolId,
                      })}
                      disabled={cancelInvitationMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
