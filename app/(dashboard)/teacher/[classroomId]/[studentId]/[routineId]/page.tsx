'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { TaskList } from '@/components/task/task-list';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function TeacherRoutineDetailPage() {
  const router = useRouter();
  const params = useParams();
  const classroomId = params.classroomId as string;
  const studentId = params.studentId as string;
  const routineId = params.routineId as string;

  const { data: session, isLoading: sessionLoading } = trpc.auth.getSession.useQuery();
  const { data: student, isLoading: studentLoading } = trpc.person.getById.useQuery(
    { id: studentId },
    { enabled: !!studentId }
  );
  const { data: routine, isLoading: routineLoading } = trpc.routine.getById.useQuery(
    { id: routineId },
    { enabled: !!routineId }
  );

  useEffect(() => {
    if (!sessionLoading && !session?.user) {
      router.push('/login');
    }
  }, [sessionLoading, session, router]);

  if (sessionLoading || studentLoading || routineLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session?.user || !student || !routine) {
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

  // Parse avatar data
  let avatarColor = '#FFB3BA';
  let avatarEmoji = student.name.charAt(0).toUpperCase();

  if (student.avatar) {
    try {
      const parsed = JSON.parse(student.avatar);
      avatarColor = parsed.color || avatarColor;
      avatarEmoji = parsed.emoji || avatarEmoji;
    } catch {
      // Ignore
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/teacher/${classroomId}/${studentId}`)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Student
        </Button>

        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <div className="flex items-center gap-6 mb-6">
            <div
              className="h-20 w-20 rounded-full flex items-center justify-center text-4xl shadow-sm"
              style={{ backgroundColor: avatarColor + '20' }}
            >
              {avatarEmoji}
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{routine.name}</h1>
              <p className="text-gray-600 text-lg">for {student.name}</p>
            </div>
          </div>

          {routine.description && (
            <p className="text-gray-600 mb-4">{routine.description}</p>
          )}

          {routine.name === 'Daily Routine' && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <p className="text-sm text-blue-700">
                📌 This is the default Daily Routine. It cannot be deleted or renamed.
              </p>
            </div>
          )}
        </div>

        <TaskList routineId={routineId} personId={studentId} />
      </div>
    </div>
  );
}
