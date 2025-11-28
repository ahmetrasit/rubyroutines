'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { PersonKioskCodeManager } from '@/components/kiosk/person-kiosk-code-manager';
import { PersonDetailSections } from '@/components/person/person-detail-sections';
import { PersonConnectionsManager, ConnectedPersonsSection } from '@/components/person-connection';

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const classroomId = params?.classroomId as string;
  const studentId = params?.studentId as string;

  const { data: session, isLoading: sessionLoading } = trpc.auth.getSession.useQuery();
  const { data: student, isLoading: studentLoading } = trpc.person.getById.useQuery(
    { id: studentId },
    { enabled: !!studentId }
  );

  // Get teacher role ID for fetching all persons
  const teacherRoleId = session?.user?.roles?.find((role: any) => role.type === 'TEACHER')?.id;

  // Fetch all persons for this role (needed for connection claiming)
  const { data: allPersons } = trpc.person.list.useQuery(
    { roleId: teacherRoleId! },
    { enabled: !!teacherRoleId }
  );

  useEffect(() => {
    if (!sessionLoading && !session?.user) {
      router.push('/login');
    }
  }, [sessionLoading, session, router]);

  if (sessionLoading || studentLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session?.user || !student) {
    return null;
  }

  // Cast to include effectiveLimits which is added by auth router
  const teacherRole = session.user.roles?.find((role: any) => role.type === 'TEACHER') as (typeof session.user.roles)[0] & { effectiveLimits?: any } | undefined;

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

  const handleSelectRoutine = (routine: any) => {
    router.push(`/teacher/${classroomId}/${studentId}/${routine.id}`);
  };

  // Parse avatar data
  let avatarColor = '#FFB3BA';
  let avatarEmoji = student.name.charAt(0).toUpperCase();

  if (student.avatar) {
    try {
      const parsed = JSON.parse(student.avatar);
      avatarColor = parsed.color || avatarColor;
      avatarEmoji = parsed.emoji || avatarEmoji;
    } catch {
      // Ignore parse errors
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/teacher/${classroomId}`)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Classroom
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
              <h1 className="text-3xl font-bold text-gray-900">{student.name}</h1>
              {student.birthDate && (
                <p className="text-gray-600 mt-1">
                  Born {new Date(student.birthDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {student.notes && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">{student.notes}</p>
            </div>
          )}

          {/* Individual Kiosk Code Section */}
          <div className="mt-6">
            <PersonKioskCodeManager
              roleId={teacherRole.id}
              personId={studentId}
              personName={student.name}
            />
          </div>
        </div>

        <PersonDetailSections
          roleId={teacherRole.id}
          personId={studentId}
          effectiveLimits={teacherRole.effectiveLimits}
          onSelectRoutine={handleSelectRoutine}
        />

        {/* Person Connections Section */}
        <div className="mt-6 space-y-6">
          {/* Show connected persons (who this student can observe) */}
          <ConnectedPersonsSection
            roleId={teacherRole.id}
            targetPersonId={studentId}
            roleType="TEACHER"
          />

          {/* Connection management (generate codes, see who observes this student) */}
          {allPersons && (
            <PersonConnectionsManager
              person={student}
              roleId={teacherRole.id}
              roleType="TEACHER"
              allPersons={allPersons}
            />
          )}
        </div>
      </div>
    </div>
  );
}
