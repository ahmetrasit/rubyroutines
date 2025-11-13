'use client';

import { use } from 'react';
import { trpc } from '@/lib/trpc/client';
import { TaskList } from '@/components/task/task-list';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, RefreshCw, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getResetDescription } from '@/lib/services/reset-period';
import { formatVisibilityDescription, isRoutineVisible } from '@/lib/services/visibility-rules';

interface RoutineDetailPageProps {
  params: Promise<{
    personId: string;
    routineId: string;
  }>;
}

export default function RoutineDetailPage({ params }: RoutineDetailPageProps) {
  const { personId, routineId } = use(params);
  const router = useRouter();

  const { data: routine, isLoading } = trpc.routine.getById.useQuery(
    { id: routineId },
    { enabled: !!routineId }
  );

  const { data: person } = trpc.person.getById.useQuery(
    { id: personId },
    { enabled: !!personId }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!routine) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-gray-500">Routine not found</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const visible = isRoutineVisible(routine);

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="bg-white rounded-lg border p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">{routine.name}</h1>

              {person && (
                <p className="text-sm text-gray-600 mb-2">
                  For: <span className="font-medium">{person.name}</span>
                </p>
              )}

              {routine.description && (
                <p className="text-gray-700 mb-4">{routine.description}</p>
              )}

              <div className="flex flex-wrap gap-2 text-sm">
                <div className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded">
                  <RefreshCw className="h-4 w-4" />
                  <span>{getResetDescription(routine.resetPeriod, routine.resetDay)}</span>
                </div>

                <div className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded">
                  <Eye className="h-4 w-4" />
                  <span>{formatVisibilityDescription(routine)}</span>
                </div>

                <div className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {routine._count?.tasks || 0} {routine._count?.tasks === 1 ? 'task' : 'tasks'}
                  </span>
                </div>
              </div>

              {!visible && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    This routine is currently not visible based on its visibility rules.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6 shadow-sm">
        <TaskList routineId={routineId} personId={personId} />
      </div>
    </div>
  );
}
