'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CodeEntry } from '@/components/kiosk/code-entry';
import { trpc } from '@/lib/trpc/client';

export default function KioskPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const utils = trpc.useUtils();
  const createSessionMutation = trpc.kiosk.createSession.useMutation();

  const handleSubmit = async (code: string) => {
    setError('');
    setIsLoading(true);

    try {
      // Validate the code first
      const data = await utils.kiosk.validateCode.fetch({ code });
      if (data) {
        // Create a kiosk session in the database
        const session = await createSessionMutation.mutateAsync({
          codeId: data.codeId,
          deviceId: `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });

        // Store session info in localStorage
        const sessionData = {
          code,
          codeId: data.codeId,
          roleId: data.roleId,
          sessionId: session.id,
          expiresAt: session.expiresAt
        };
        localStorage.setItem('kiosk_session', JSON.stringify(sessionData));

        // Redirect to person selection
        router.push(`/kiosk/${code}`);
      }
    } catch (error: any) {
      setError(error.message || 'Invalid code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CodeEntry
      onSubmit={handleSubmit}
      isLoading={isLoading}
      error={error}
    />
  );
}
