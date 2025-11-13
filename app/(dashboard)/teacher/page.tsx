'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { GroupList } from '@/components/group/group-list';
import { KioskCodeManager } from '@/components/kiosk/kiosk-code-manager';

export default function TeacherDashboard() {
  const router = useRouter();
  const { data: session, isLoading } = trpc.auth.getSession.useQuery();

  useEffect(() => {
    if (!isLoading && !session?.user) {
      router.push('/login');
    }
  }, [isLoading, session, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  // Find teacher role
  const teacherRole = session.user.roles?.find((role: any) => role.type === 'TEACHER');

  if (!teacherRole) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">No Teacher Role</h1>
          <p className="text-gray-600">
            You don&apos;t have a teacher role yet. Please contact support.
          </p>
        </div>
      </div>
    );
  }

  const handleSelectGroup = (group: any) => {
    router.push(`/teacher/${group.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your classrooms and students</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <GroupList roleId={teacherRole.id} onSelectGroup={handleSelectGroup} />
          </div>
          <div>
            <KioskCodeManager />
          </div>
        </div>
      </div>
    </div>
  );
}
