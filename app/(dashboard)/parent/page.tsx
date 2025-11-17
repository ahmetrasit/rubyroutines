'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { PersonList } from '@/components/person/person-list';
import { ModeSwitcher } from '@/components/mode-switcher';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, BarChart3, CreditCard, Settings, Download } from 'lucide-react';
import { ImportFromCodeModal } from '@/components/marketplace/ImportFromCodeModal';
import Link from 'next/link';

export default function ParentDashboard() {
  const router = useRouter();
  const { data: session, isLoading } = trpc.auth.getSession.useQuery();
  const [showImportModal, setShowImportModal] = useState(false);

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
    return result && result[1] && result[2] && result[3]
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

            {/* Quick Navigation */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <Link href="/marketplace" className="block">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Marketplace</CardTitle>
                    <Store className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground">Discover routines</div>
                  </CardContent>
                </Card>
              </Link>

              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer h-full"
                onClick={() => setShowImportModal(true)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Import Code</CardTitle>
                  <Download className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground">Import shared item</div>
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

              <Link href="/billing" className="block">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Billing</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground">Manage plan</div>
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
                    <div className="text-xs text-muted-foreground">Configure app</div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            <div className="mb-8">
              <PersonList
                roleId={parentRole.id}
                userName={session.user.name || 'User'}
                effectiveLimits={parentRole.effectiveLimits}
                onSelectPerson={handleSelectPerson}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Import from Code Modal */}
      <ImportFromCodeModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        roleId={parentRole.id}
      />
    </div>
  );
}
