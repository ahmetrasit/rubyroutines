'use client';

import { useEffect } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { RealtimeStatus } from '@/components/realtime-status';

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-md">
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                Welcome, {session.user.name || session.user.email}!
              </p>
            </div>
            <nav aria-label="User navigation" className="flex items-center gap-3">
              <RealtimeStatus />
              <ThemeToggle />
              <Button
                variant="outline"
                onClick={() => signOutMutation.mutate()}
                disabled={signOutMutation.isPending}
                aria-label="Sign out of your account"
              >
                {signOutMutation.isPending ? 'Logging out...' : 'Log out'}
              </Button>
            </nav>
          </header>

          <main id="main-content" className="mt-6">
            <section aria-labelledby="roles-heading">
              <h2 id="roles-heading" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Your Roles
              </h2>
              {session.user.roles && session.user.roles.length > 0 ? (
                <ul className="mt-2 space-y-2" role="list" aria-label="User roles">
                  {session.user.roles.map((role: { id: string; type: string; tier: string }) => (
                    <li
                      key={role.id}
                      className="rounded-lg bg-gray-50 dark:bg-gray-700 px-4 py-2"
                    >
                      <span className="font-medium text-gray-900 dark:text-gray-100">{role.type}</span>
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                        ({role.tier} tier)
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-gray-600 dark:text-gray-400">No roles yet</p>
              )}
            </section>

            <section aria-labelledby="quick-access-heading" className="mt-8 border-t dark:border-gray-700 pt-6">
              <h2 id="quick-access-heading" className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Quick Access
              </h2>
              <nav aria-label="Quick access navigation" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {hasParentRole && (
                  <Button
                    onClick={() => router.push('/parent')}
                    className="w-full h-24 text-lg"
                    aria-label="Open parent mode to manage children and routines"
                  >
                    <span className="flex flex-col items-center justify-center">
                      Parent Mode
                      <span className="block text-sm font-normal mt-1">
                        Manage your children and routines
                      </span>
                    </span>
                  </Button>
                )}
                {hasTeacherRole && (
                  <Button
                    onClick={() => router.push('/teacher')}
                    className="w-full h-24 text-lg"
                    aria-label="Open teacher mode to manage students and classrooms"
                  >
                    <span className="flex flex-col items-center justify-center">
                      Teacher Mode
                      <span className="block text-sm font-normal mt-1">
                        Manage students and classrooms
                      </span>
                    </span>
                  </Button>
                )}
              </nav>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
