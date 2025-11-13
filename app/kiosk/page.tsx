'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CodeEntry } from '@/components/kiosk/code-entry';
import { trpc } from '@/lib/trpc/client';

export default function KioskPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const router = useRouter();

  const { refetch: validateCode } = trpc.kiosk.validateCode.useQuery(
    { code: inputCode },
    { enabled: false }
  );

  const handleSubmit = async (code: string) => {
    setError('');
    setIsLoading(true);
    setInputCode(code);

    try {
      const { data } = await validateCode();
      if (data) {
        // Store session in localStorage
        const sessionData = {
          code,
          codeId: data.codeId,
          roleId: data.roleId,
          expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
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
