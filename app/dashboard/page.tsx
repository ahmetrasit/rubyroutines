'use client';

import { useEffect } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isLoading } = trpc.auth.getSession.useQuery();
  const signOutMutation = trpc.auth.signOut.useMutation({
    onSuccess: () => {
      router.push('/login');
    },
  });

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

  // Check user roles for navigation
  const hasParentRole = session.user.roles?.some((role: any) => role.type === 'PARENT');
  const hasTeacherRole = session.user.roles?.some((role: any) => role.type === 'TEACHER');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-xl bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-1 text-gray-600">
                Welcome, {session.user.name || session.user.email}!
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => signOutMutation.mutate()}
              disabled={signOutMutation.isPending}
            >
              {signOutMutation.isPending ? 'Logging out...' : 'Log out'}
            </Button>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold">Your Roles</h2>
            {session.user.roles && session.user.roles.length > 0 ? (
              <ul className="mt-2 space-y-2">
                {session.user.roles.map((role: { id: string; type: string; tier: string }) => (
                  <li
                    key={role.id}
                    className="rounded-lg bg-gray-50 px-4 py-2"
                  >
                    <span className="font-medium">{role.type}</span>
                    <span className="ml-2 text-sm text-gray-600">
                      ({role.tier} tier)
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-gray-600">No roles yet</p>
            )}
          </div>

          <div className="mt-8 border-t pt-6">
            <h2 className="text-lg font-semibold mb-4">Quick Access</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {hasParentRole && (
                <Button
                  onClick={() => router.push('/parent')}
                  className="w-full h-24 text-lg"
                >
                  Parent Mode
                  <span className="block text-sm font-normal mt-1">
                    Manage your children and routines
                  </span>
                </Button>
              )}
              {hasTeacherRole && (
                <Button
                  onClick={() => router.push('/teacher')}
                  className="w-full h-24 text-lg"
                >
                  Teacher Mode
                  <span className="block text-sm font-normal mt-1">
                    Manage students and classrooms
                  </span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
