'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, GraduationCap, UserPlus, MoreVertical, UserMinus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function TeachersListPage() {
  const params = useParams();
  const schoolId = params?.schoolId as string;
  const [removingId, setRemovingId] = useState<string | null>(null);

  const { data: session } = trpc.auth.getSession.useQuery();
  const utils = trpc.useUtils();

  // Get school membership for this school
  const user = session?.user as any;
  const membership = user?.schoolMemberships?.find(
    (m: any) => m.schoolId === schoolId && m.role === 'PRINCIPAL'
  );

  // Fetch school members
  const { data: schoolMembers, refetch: refetchMembers } = trpc.school.getMembers.useQuery(
    { schoolId, roleId: membership?.roleId || '' },
    { enabled: !!schoolId && !!membership?.roleId }
  );

  const removeMemberMutation = trpc.school.removeMember.useMutation({
    onSuccess: () => {
      setRemovingId(null);
      refetchMembers();
    },
    onError: () => {
      setRemovingId(null);
    },
  });

  const teachers = schoolMembers?.filter((m: any) => m.role === 'TEACHER') || [];

  const handleRemoveMember = (memberRoleId: string) => {
    if (!membership?.roleId) return;
    setRemovingId(memberRoleId);
    removeMemberMutation.mutate({
      roleId: membership.roleId,
      schoolId,
      memberRoleId,
    });
  };

  if (!membership) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/principal">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <Link href={`/principal/${schoolId}/invite`}>
            <Button size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Teacher
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle>Teachers</CardTitle>
                <CardDescription>
                  {teachers.length} teacher{teachers.length !== 1 ? 's' : ''} in your school
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {teachers.length === 0 ? (
              <div className="text-center py-12">
                <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No teachers in your school yet</p>
                <Link href={`/principal/${schoolId}/invite`}>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Your First Teacher
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {teachers.map((teacher: any) => (
                  <div
                    key={teacher.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <GraduationCap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-lg">
                          {teacher.userRole?.user?.name || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {teacher.userRole?.user?.email}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Joined {new Date(teacher.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          {removingId === teacher.roleId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreVertical className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleRemoveMember(teacher.roleId)}
                        >
                          <UserMinus className="h-4 w-4 mr-2" />
                          Remove from School
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
