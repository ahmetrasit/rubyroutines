'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { PersonList } from '@/components/person/person-list';

export default function ParentDashboard() {
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

  // Find parent role
  const parentRole = session.user.roles?.find((role: any) => role.type === 'PARENT');

  if (!parentRole) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">No Parent Role</h1>
          <p className="text-gray-600">
            You don&apos;t have a parent role yet. Please contact support.
          </p>
        </div>
      </div>
    );
  }

  const handleSelectPerson = (person: any) => {
    router.push(`/parent/${person.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Parent Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your children and their routines</p>
        </div>

        <PersonList roleId={parentRole.id} onSelectPerson={handleSelectPerson} />
      </div>
    </div>
  );
}
