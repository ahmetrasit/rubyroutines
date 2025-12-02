'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { CoParentList } from '@/components/coparent/CoParentList';
import { InviteModal } from '@/components/coparent/InviteModal';
import { ConnectionList } from '@/components/connection/ConnectionList';
import { CodeEntry } from '@/components/connection/CodeEntry';
import { UserPlus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ParentConnectionsPage() {
  const router = useRouter();
  const [showInviteModal, setShowInviteModal] = useState(false);
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
  const user = session.user as any;
  const parentRole = user.roles?.find((role: any) => role.type === 'PARENT');

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/parent">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Connections & Sharing</h1>
              <p className="text-gray-600 mt-2">
                Manage co-parents and connect to your children&apos;s teachers
              </p>
            </div>
            <Button onClick={() => setShowInviteModal(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Co-Parent
            </Button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Co-Parents */}
          <div className="space-y-8">
            <CoParentList roleId={parentRole.id} />
          </div>

          {/* Right Column: Teacher Connections */}
          <div className="space-y-8">
            <CodeEntry parentRoleId={parentRole.id} />
            <ConnectionList parentRoleId={parentRole.id} />
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteModal roleId={parentRole.id} onClose={() => setShowInviteModal(false)} />
      )}
    </div>
  );
}
