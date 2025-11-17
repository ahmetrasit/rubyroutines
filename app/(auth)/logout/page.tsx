'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';

export default function LogoutPage() {
  const router = useRouter();
  const signOutMutation = trpc.auth.signOut.useMutation({
    onSuccess: () => {
      router.push('/login');
    },
    onError: () => {
      // Even if there's an error, redirect to login
      router.push('/login');
    },
  });

  useEffect(() => {
    // Trigger sign out immediately when the page loads
    signOutMutation.mutate();
  }, []);

  return (
    <div className="text-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
      <p className="mt-4 text-gray-600">Signing out...</p>
    </div>
  );
}
