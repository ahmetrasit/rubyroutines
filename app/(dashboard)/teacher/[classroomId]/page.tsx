'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { ClassroomMemberList } from '@/components/classroom/classroom-member-list';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function ClassroomDetailPage() {
  const router = useRouter();
  const params = useParams();
  const classroomId = params.classroomId as string;

  const { data: session, isLoading: sessionLoading } = trpc.auth.getSession.useQuery();
  const { data: classroom, isLoading: classroomLoading } = trpc.group.getById.useQuery(
    { id: classroomId },
    { enabled: !!classroomId }
  );

  useEffect(() => {
    if (!sessionLoading && !session?.user) {
      router.push('/login');
    }
  }, [sessionLoading, session, router]);

  if (sessionLoading || classroomLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session?.user || !classroom) {
    return null;
  }

  const teacherRole = session.user.roles?.find((role: any) => role.type === 'TEACHER');

  if (!teacherRole) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">No Teacher Role</h1>
          <p className="text-gray-600">You don&apos;t have a teacher role.</p>
        </div>
      </div>
    );
  }

  const handleSelectStudent = (student: any) => {
    router.push(`/teacher/${classroomId}/${student.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/teacher')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{classroom.name}</h1>
              <p className="text-gray-600 mt-1">
                {classroom.type.charAt(0) + classroom.type.slice(1).toLowerCase()}
              </p>
            </div>
          </div>

          {classroom.description && classroom.name !== 'Teacher-Only' && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">{classroom.description}</p>
            </div>
          )}
        </div>

        <ClassroomMemberList
          classroomId={classroomId}
          roleId={teacherRole.id}
          userName={session.user.name || 'User'}
          effectiveLimits={teacherRole.effectiveLimits}
          onSelectPerson={handleSelectStudent}
          userId={session.user.id}
        />
      </div>
    </div>
  );
}
