'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { GroupList } from '@/components/group/group-list';
import { ModeSwitcher } from '@/components/mode-switcher';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, BarChart3, CreditCard, Settings, Download, Share2, Copy, Clock } from 'lucide-react';
import { ImportFromCodeModal } from '@/components/marketplace/ImportFromCodeModal';
import { ClaimShareCodeModal } from '@/components/sharing/ClaimShareCodeModal';
import { CopyRoutineModal } from '@/components/routine/copy-routine-modal';
import { BulkVisibilityControl } from '@/components/routine/bulk-visibility-control';
import Link from 'next/link';

export default function TeacherDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isLoading } = trpc.auth.getSession.useQuery();
  const [showImportModal, setShowImportModal] = useState(false);
  const [showClaimShareModal, setShowClaimShareModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showBulkVisibility, setShowBulkVisibility] = useState(false);
  const [inviteCodeFromUrl, setInviteCodeFromUrl] = useState<string | null>(null);
  const hasProcessedInviteCode = useRef(false);

  useEffect(() => {
    if (!isLoading && !session?.user) {
      router.push('/login');
    }
  }, [isLoading, session]); // router removed - it's stable and doesn't need to be a dependency

  // Auto-open claim share modal if inviteCode is in URL
  useEffect(() => {
    const inviteCode = searchParams.get('inviteCode');
    if (inviteCode && session?.user && !hasProcessedInviteCode.current) {
      hasProcessedInviteCode.current = true;
      setInviteCodeFromUrl(inviteCode);
      setShowClaimShareModal(true);
      // Clean up URL by removing the query parameter
      router.replace('/teacher');
    }
  }, [searchParams, session]); // router removed - it's stable and doesn't need to be a dependency

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
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
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

              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer h-full"
                onClick={() => setShowClaimShareModal(true)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sharing</CardTitle>
                  <Share2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground">Accept share code</div>
                </CardContent>
              </Card>

              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer h-full"
                onClick={() => setShowCopyModal(true)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Copy Routines</CardTitle>
                  <Copy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground">Copy to students</div>
                </CardContent>
              </Card>

              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer h-full"
                onClick={() => setShowBulkVisibility(true)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Show Hidden</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground">Temp visibility</div>
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

      {/* Import from Code Modal */}
      <ImportFromCodeModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        roleId={teacherRole.id}
      />

      {/* Claim Share Code Modal */}
      <ClaimShareCodeModal
        isOpen={showClaimShareModal}
        onClose={() => {
          setShowClaimShareModal(false);
          setInviteCodeFromUrl(null);
        }}
        roleId={teacherRole.id}
        userId={session.user.id}
        initialCode={inviteCodeFromUrl || undefined}
      />

      {/* Copy Routine Modal */}
      <CopyRoutineModal
        isOpen={showCopyModal}
        onClose={() => setShowCopyModal(false)}
        roleId={teacherRole.id}
      />

      {/* Bulk Visibility Control */}
      <BulkVisibilityControl
        isOpen={showBulkVisibility}
        onClose={() => setShowBulkVisibility(false)}
        roleId={teacherRole.id}
      />
    </div>
  );
}
