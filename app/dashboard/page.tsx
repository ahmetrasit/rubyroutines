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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
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
                    className="rounded-md bg-gray-50 px-4 py-2"
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
        </div>
      </div>
    </div>
  );
}
