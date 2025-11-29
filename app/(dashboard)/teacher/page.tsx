'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { GroupList } from '@/components/group/group-list';
import { ModeSwitcher } from '@/components/mode-switcher';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  // Get role color (default to blue if not set)
  const roleColor = teacherRole.color || '#3b82f6';

  // Convert hex to RGB for opacity
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result && result[1] && result[2] && result[3]
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '59, 130, 246'; // Default blue RGB
  };

  const rgbColor = hexToRgb(roleColor);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <ModeSwitcher currentMode="teacher" />

      {/* Top section with colored background */}
      <div className="bg-white dark:bg-gray-900">
        <div
          className="max-w-7xl mx-auto border-t-2 border-x-2 rounded-t-md"
          style={{
            borderColor: roleColor,
            backgroundColor: `rgba(${rgbColor}, 0.05)`
          }}
        >
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Teacher Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your classrooms and students</p>
            </div>

            {/* Quick Navigation */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl">
              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer h-full"
                onClick={() => setShowGetRoutines(true)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Get Routines</CardTitle>
                  <Download className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground">Import & save</div>
                </CardContent>
              </Card>

              <Link href="/analytics" className="block">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Analytics</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground">View insights</div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/settings" className="block">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Settings</CardTitle>
                    <Settings className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground">Account & billing</div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Classroom cards section with white background */}
      <div className="bg-white dark:bg-gray-900">
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-x-2 border-b-2 rounded-b-md"
          style={{ borderColor: roleColor }}
        >
          <GroupList roleId={teacherRole.id} roleType="TEACHER" onSelectGroup={handleSelectGroup} />
        </div>
      </div>

      {/* Get Routines Modal */}
      <GetRoutinesModal
        isOpen={showGetRoutines}
        onClose={() => setShowGetRoutines(false)}
        roleId={teacherRole.id}
      />
    </div>
  );
}
