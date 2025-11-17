import { useMemo } from 'react';
import { trpc } from '@/lib/trpc/client';

interface Role {
  id: string;
  type: 'PARENT' | 'TEACHER' | 'PRINCIPAL';
  tier: string;
  color: string | null;
  effectiveLimits?: any;
}

interface User {
  roles?: Role[];
}

interface Session {
  user?: User;
}

/**
 * Custom hook to get the active role (PARENT or TEACHER) for the current user
 * Prioritizes PARENT role if both exist
 *
 * @returns The active role or null if no suitable role found
 */
export function useActiveRole() {
  const { data: session, isLoading } = trpc.auth.getSession.useQuery();

  const activeRole = useMemo(() => {
    if (!session?.user?.roles) return null;

    const parentRole = session.user.roles.find((role) => role.type === 'PARENT');
    const teacherRole = session.user.roles.find((role) => role.type === 'TEACHER');

    return parentRole || teacherRole || null;
  }, [session]);

  return { activeRole, isLoading, session };
}
