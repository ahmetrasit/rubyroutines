'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { PersonList } from '@/components/person/person-list';
import { ModeSwitcher } from '@/components/mode-switcher';

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

  // Get role color (default to purple if not set)
  const roleColor = parentRole.color || '#9333ea';

  // Convert hex to RGB for opacity
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '147, 51, 234'; // Default purple RGB
  };

  const rgbColor = hexToRgb(roleColor);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <ModeSwitcher currentMode="parent" />
      <div className="bg-white dark:bg-gray-900">
        <div
          className="max-w-7xl mx-auto"
          style={{
            borderLeft: `4px solid ${roleColor}`,
            borderRight: `4px solid ${roleColor}`,
            backgroundColor: `rgba(${rgbColor}, 0.05)`
          }}
        >
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Parent Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Manage people and their routines</p>
            </div>

            <div className="mb-8">
              <PersonList
                roleId={parentRole.id}
                userName={session.user.name || 'User'}
                tier={parentRole.tier}
                onSelectPerson={handleSelectPerson}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
