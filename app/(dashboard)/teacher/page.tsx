'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { GroupList } from '@/components/group/group-list';
import { ModeSwitcher } from '@/components/mode-switcher';
import { Button } from '@/components/ui/button';
import { Download, BarChart3, Settings } from 'lucide-react';
import { GetRoutinesModal } from '@/components/routine/GetRoutinesModal';
import Link from 'next/link';

export default function TeacherDashboard() {
  const router = useRouter();
  const { data: session, isLoading } = trpc.auth.getSession.useQuery();
  const [showGetRoutines, setShowGetRoutines] = useState(false);

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
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <ModeSwitcher currentMode="teacher" />

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with title and action buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Teacher Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your classrooms and students</p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGetRoutines(true)}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Get Routines</span>
            </Button>
            <Link href="/analytics">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Classroom list */}
        <GroupList roleId={teacherRole.id} roleType="TEACHER" onSelectGroup={handleSelectGroup} />
      </div>

      {/* Get Routines Modal */}
      <GetRoutinesModal
        isOpen={showGetRoutines}
        onClose={() => setShowGetRoutines(false)}
        roleId={teacherRole.id}
        roleType="TEACHER"
      />
    </div>
  );
}
