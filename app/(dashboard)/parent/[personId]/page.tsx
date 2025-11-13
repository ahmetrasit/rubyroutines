'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { RoutineList } from '@/components/routine/routine-list';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PersonDetailPage() {
  const router = useRouter();
  const params = useParams();
  const personId = params.personId as string;

  const { data: session, isLoading: sessionLoading } = trpc.auth.getSession.useQuery();
  const { data: person, isLoading: personLoading } = trpc.person.getById.useQuery(
    { id: personId },
    { enabled: !!personId }
  );

  useEffect(() => {
    if (!sessionLoading && !session?.user) {
      router.push('/login');
    }
  }, [sessionLoading, session, router]);

  if (sessionLoading || personLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session?.user || !person) {
    return null;
  }

  // Find parent role
  const parentRole = session.user.roles?.find((role) => role.type === 'PARENT');

  if (!parentRole) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">No Parent Role</h1>
          <p className="text-gray-600">You don't have a parent role.</p>
        </div>
      </div>
    );
  }

  const handleSelectRoutine = (routine: any) => {
    router.push(`/parent/${personId}/${routine.id}`);
  };

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/parent')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex items-center gap-4">
          {person.avatar ? (
            <img
              src={person.avatar}
              alt={person.name}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-semibold text-gray-600">
              {person.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <h1 className="text-3xl font-bold">{person.name}</h1>
            {person.birthDate && (
              <p className="text-gray-600">
                Born {new Date(person.birthDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {person.notes && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700">{person.notes}</p>
          </div>
        )}
      </div>

      <RoutineList
        roleId={parentRole.id}
        personId={personId}
        onSelectRoutine={handleSelectRoutine}
      />
    </div>
  );
}
