'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Community Routines page
 * Redirects to marketplace for now - will be expanded later
 */
export default function CommunityRoutinesPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to marketplace which hosts community routines
    router.replace('/marketplace');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Redirecting to Community Routines...</p>
    </div>
  );
}
