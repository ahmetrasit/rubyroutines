/**
 * useAuthGuard Hook
 *
 * Handles authentication checking and automatic redirection.
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import type { RoleType } from '@/lib/types/prisma-enums';

interface UseAuthGuardOptions {
  /**
   * Redirect to this path if not authenticated
   */
  redirectTo?: string;
  /**
   * Required role type (optional)
   */
  requireRole?: RoleType;
  /**
   * Redirect to this path if role requirement not met
   */
  roleRedirectTo?: string;
}

interface UseAuthGuardReturn {
  user: any | null;
  session: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasRequiredRole: boolean;
}

/**
 * Custom hook to guard routes with authentication
 *
 * @param options - Guard options
 * @returns Authentication state
 *
 * @example
 * ```tsx
 * const { user, isLoading, isAuthenticated } = useAuthGuard({
 *   redirectTo: '/login',
 *   requireRole: 'PARENT',
 *   roleRedirectTo: '/dashboard',
 * });
 * ```
 */
export function useAuthGuard(
  options: UseAuthGuardOptions = {}
): UseAuthGuardReturn {
  const {
    redirectTo = '/login',
    requireRole,
    roleRedirectTo = '/dashboard',
  } = options;

  const router = useRouter();
  const { data: session, isLoading } = trpc.auth.getSession.useQuery();

  const isAuthenticated = !!session?.user;
  const user = session?.user || null;

  // Check if user has required role
  const hasRequiredRole = requireRole
    ? session?.user?.roles?.some((role: any) => role.type === requireRole)
    : true;

  useEffect(() => {
    if (isLoading) return;

    // Not authenticated - redirect to login
    if (!isAuthenticated && redirectTo) {
      router.push(redirectTo);
      return;
    }

    // Authenticated but missing required role - redirect to dashboard
    if (isAuthenticated && !hasRequiredRole && roleRedirectTo) {
      router.push(roleRedirectTo);
    }
  }, [isLoading, isAuthenticated, hasRequiredRole, redirectTo, roleRedirectTo, router]);

  return {
    user,
    session,
    isLoading,
    isAuthenticated,
    hasRequiredRole,
  };
}

/**
 * Hook to check if user has a specific role
 *
 * @param roleType - Role type to check
 * @returns True if user has the role
 */
export function useHasRole(roleType: RoleType): boolean {
  const { data: session } = trpc.auth.getSession.useQuery();

  return (
    session?.user?.roles?.some((role: any) => role.type === roleType) ?? false
  );
}

/**
 * Hook to get all user roles
 *
 * @returns Array of user roles
 */
export function useUserRoles(): any[] {
  const { data: session } = trpc.auth.getSession.useQuery();

  return session?.user?.roles ?? [];
}

/**
 * Hook to get a specific role by type
 *
 * @param roleType - Role type to get
 * @returns Role object or undefined
 */
export function useRole(roleType: RoleType): any | undefined {
  const { data: session } = trpc.auth.getSession.useQuery();

  return session?.user?.roles?.find((role: any) => role.type === roleType);
}
