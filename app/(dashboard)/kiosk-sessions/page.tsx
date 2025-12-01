'use client';

import { MyKioskSessions } from '@/components/kiosk/my-kiosk-sessions';
import { trpc } from '@/lib/trpc/client';
import { HomeButton } from '@/components/home-button';

export default function KioskSessionsPage() {
  const { data: session, isLoading } = trpc.auth.getSession.useQuery();

  // Get any role that can have kiosk sessions (parent or teacher)
  const user = session?.user as any;
  const role = user?.roles?.find(
    (r: any) => r.type === 'PARENT' || r.type === 'TEACHER'
  );
  const roleId = role?.id;

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!roleId) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-gray-500">No role found to view kiosk sessions.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-3 mb-6">
        <HomeButton />
        <h1 className="text-3xl font-bold text-gray-900">Kiosk Sessions</h1>
      </div>
      <MyKioskSessions roleId={roleId} />
    </div>
  );
}
