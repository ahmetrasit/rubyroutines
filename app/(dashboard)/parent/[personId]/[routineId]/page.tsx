'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { TaskList } from '@/components/task/task-list';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function RoutineDetailPage() {
  const router = useRouter();
  const params = useParams();
  const personId = params?.personId as string;
  const routineId = params?.routineId as string;

  const { data: session, isLoading: sessionLoading } = trpc.auth.getSession.useQuery();
  const { data: person, isLoading: personLoading } = trpc.person.getById.useQuery(
    { id: personId },
    { enabled: !!personId }
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

  if (sessionLoading || personLoading || routineLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session?.user || !person || !routine) {
    return null;
  }

  // Find parent role
  // Cast to include effectiveLimits which is added by auth router
  const parentRole = session.user.roles?.find((role: any) => role.type === 'PARENT') as (typeof session.user.roles)[0] & { effectiveLimits?: any } | undefined;

  if (!parentRole) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">No Parent Role</h1>
            <p className="text-gray-600">You don&apos;t have a parent role.</p>
          </div>
        </div>
      </div>
    );
  }

  // Parse avatar data for person
  let avatarColor = '#FFB3BA';
  let avatarEmoji = person.name.charAt(0).toUpperCase();

  if (person.avatar) {
    try {
      const parsed = JSON.parse(person.avatar);
      avatarColor = parsed.color || avatarColor;
      avatarEmoji = parsed.emoji || avatarEmoji;
    } catch {
      // Fallback to initials
    }
  }

  const isDailyRoutine = routine.name?.includes('Daily Routine');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/parent/${personId}`)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to {person.name}&apos;s Routines
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
              <p className="text-gray-600 text-lg">for {person.name}</p>
            </div>
          </div>

          {routine.description && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-700">{routine.description}</p>
            </div>
          )}

          {isDailyRoutine && (
            <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
              <p className="text-sm text-blue-900 font-medium">
                📌 This is the default Daily Routine that cannot be deleted or renamed.
              </p>
            </div>
          )}
        </div>

        <TaskList
          routineId={routineId}
          personId={personId}
          effectiveLimits={parentRole.effectiveLimits}
        />
      </div>
    </div>
  );
}
