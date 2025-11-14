'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { GroupList } from '@/components/group/group-list';
import { KioskCodeManager } from '@/components/kiosk/kiosk-code-manager';
import { ModeSwitcher } from '@/components/mode-switcher';

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

  // Get role color (default to blue if not set)
  const roleColor = teacherRole.color || '#3b82f6';

  // Convert hex to RGB for opacity
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '59, 130, 246'; // Default blue RGB
  };

  const rgbColor = hexToRgb(roleColor);

  return (
    <div className="min-h-screen" style={{ backgroundColor: `rgba(${rgbColor}, 0.05)` }}>
      <ModeSwitcher currentMode="teacher" />
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        style={{ borderLeft: `4px solid ${roleColor}`, borderRight: `4px solid ${roleColor}` }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Teacher Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your classrooms and students</p>
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
