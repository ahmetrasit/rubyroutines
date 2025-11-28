'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { PersonKioskCodeManager } from '@/components/kiosk/person-kiosk-code-manager';
import { PersonDetailSections } from '@/components/person/person-detail-sections';
import { PersonConnectionsManager, ConnectedPersonsSection } from '@/components/person-connection';

export default function PersonDetailPage() {
  const router = useRouter();
  const params = useParams();
  const personId = params?.personId as string;

  const { data: session, isLoading: sessionLoading } = trpc.auth.getSession.useQuery();
  const { data: person, isLoading: personLoading } = trpc.person.getById.useQuery(
    { id: personId },
    { enabled: !!personId }
  );

  // Get parent role ID for fetching all persons
  const parentRoleId = session?.user?.roles?.find((role: any) => role.type === 'PARENT')?.id;

  // Fetch all persons for this role (needed for connection claiming)
  const { data: allPersons } = trpc.person.list.useQuery(
    { roleId: parentRoleId! },
    { enabled: !!parentRoleId }
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

  // Find parent role (cast to include effectiveLimits which is added by auth router)
  const parentRole = session.user.roles?.find((role: any) => role.type === 'PARENT') as (typeof session.user.roles)[0] & { effectiveLimits?: any } | undefined;

  if (!parentRole) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">No Parent Role</h1>
          <p className="text-gray-600">You don&apos;t have a parent role.</p>
        </div>
      </div>
    );
  }

  const handleSelectRoutine = (routine: any) => {
    router.push(`/parent/${personId}/${routine.id}`);
  };

  // Parse avatar data
  let avatarColor = '#FFB3BA'; // Default pastel pink
  let avatarEmoji = person.name.charAt(0).toUpperCase(); // Fallback

  if (person.avatar) {
    try {
      const parsed = JSON.parse(person.avatar);
      avatarColor = parsed.color || avatarColor;
      avatarEmoji = parsed.emoji || avatarEmoji;
    } catch {
      // If not JSON, might be old URL format or initials - ignore
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/parent')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center gap-6">
            <div
              className="h-24 w-24 rounded-full flex items-center justify-center text-5xl"
              style={{ backgroundColor: avatarColor + '20' }}
            >
              {avatarEmoji}
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900">{person.name}</h1>
              {person.birthDate && (
                <p className="text-gray-600 mt-1">
                  Born {new Date(person.birthDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {person.notes && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">{person.notes}</p>
            </div>
          )}

          {/* Individual Kiosk Code Section */}
          <div className="mt-6">
            <PersonKioskCodeManager
              roleId={parentRole.id}
              personId={personId}
              personName={person.name}
            />
          </div>
        </div>

        <PersonDetailSections
          roleId={parentRole.id}
          personId={personId}
          effectiveLimits={parentRole.effectiveLimits}
          onSelectRoutine={handleSelectRoutine}
        />

        {/* Person Connections Section */}
        <div className="mt-6 space-y-6">
          {/* Show connected persons (who this person can observe) */}
          <ConnectedPersonsSection
            roleId={parentRole.id}
            targetPersonId={personId}
            roleType="PARENT"
          />

          {/* Connection management (generate codes, see who observes this person) */}
          {allPersons && (
            <PersonConnectionsManager
              person={person}
              roleId={parentRole.id}
              roleType="PARENT"
              allPersons={allPersons}
            />
          )}
        </div>
      </div>
    </div>
  );
}
