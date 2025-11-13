'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PersonSelector } from '@/components/kiosk/person-selector';
import { SessionTimeout } from '@/components/kiosk/session-timeout';
import { trpc } from '@/lib/trpc/client';
import { Loader2 } from 'lucide-react';

export default function KioskPersonSelectionPage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;
  const [sessionData, setSessionData] = useState<any>(null);

  useEffect(() => {
    // Verify session from localStorage
    const stored = localStorage.getItem('kiosk_session');
    if (!stored) {
      router.push('/kiosk');
      return;
    }

    try {
      const session = JSON.parse(stored);
      if (session.code !== code) {
        router.push('/kiosk');
        return;
      }

      // Check if session expired
      const expiresAt = new Date(session.expiresAt);
      if (expiresAt <= new Date()) {
        localStorage.removeItem('kiosk_session');
        router.push('/kiosk');
        return;
      }

      setSessionData(session);
    } catch (error) {
      router.push('/kiosk');
    }
  }, [code, router]);

  const { data: persons, isLoading } = trpc.person.list.useQuery(
    { roleId: sessionData?.roleId || '' },
    {
      enabled: !!sessionData?.roleId,
    }
  );

  const handlePersonSelect = (personId: string) => {
    router.push(`/kiosk/${code}/tasks?personId=${personId}`);
  };

  const handleExit = () => {
    localStorage.removeItem('kiosk_session');
    router.push('/kiosk');
  };

  const handleTimeout = () => {
    handleExit();
  };

  if (!sessionData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const activePersons = persons?.filter((p: any) => p.status === 'ACTIVE') || [];

  return (
    <>
      <SessionTimeout
        expiresAt={new Date(sessionData.expiresAt)}
        onTimeout={handleTimeout}
      />
      <PersonSelector
        persons={activePersons}
        onSelect={handlePersonSelect}
        onExit={handleExit}
      />
    </>
  );
}
