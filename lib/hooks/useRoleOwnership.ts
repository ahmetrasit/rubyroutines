/**
 * useRoleOwnership Hook
 *
 * Verifies that a user owns a specific role and has permission to access resources.
 */

'use client';

import { trpc } from '@/lib/trpc/client';
import type { RoleType } from '@/lib/types/prisma-enums';

interface UseRoleOwnershipOptions {
  roleId?: string;
  roleType?: RoleType;
}

interface UseRoleOwnershipReturn {
  ownsRole: boolean;
  role: any | undefined;
  isLoading: boolean;
}

/**
 * Custom hook to verify user owns a specific role
 *
 * @param options - Ownership check options
 * @returns Ownership state
 *
 * @example
 * ```tsx
 * const { ownsRole, role } = useRoleOwnership({ roleId: 'role_123' });
 *
 * if (!ownsRole) {
 *   return <div>Access denied</div>;
 * }
 * ```
 */
export function useRoleOwnership(
  options: UseRoleOwnershipOptions = {}
): UseRoleOwnershipReturn {
  const { roleId, roleType } = options;
  const { data: session, isLoading } = trpc.auth.getSession.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes - auth session rarely changes
    gcTime: 10 * 60 * 1000, // 10 minutes cache (renamed from cacheTime in v5)
    refetchOnWindowFocus: false, // Don't refetch auth on every focus
  });

  const userRoles = session?.user?.roles ?? [];

  // Check ownership by roleId
  if (roleId) {
    const role = userRoles.find((r: any) => r.id === roleId);
    return {
      ownsRole: !!role,
      role,
      isLoading,
    };
  }

  // Check ownership by roleType
  if (roleType) {
    const role = userRoles.find((r: any) => r.type === roleType);
    return {
      ownsRole: !!role,
      role,
      isLoading,
    };
  }

  return {
    ownsRole: false,
    role: undefined,
    isLoading,
  };
}

/**
 * Hook to verify resource belongs to user's role
 *
 * @param resourceRoleId - Role ID of the resource
 * @returns True if user owns the resource
 */
export function useOwnsResource(resourceRoleId: string | undefined): boolean {
  const { data: session } = trpc.auth.getSession.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes - auth session rarely changes
    gcTime: 10 * 60 * 1000, // 10 minutes cache (renamed from cacheTime in v5)
    refetchOnWindowFocus: false, // Don't refetch auth on every focus
  });

  if (!resourceRoleId) return false;

  const userRoles = session?.user?.roles ?? [];
  return userRoles.some((role: any) => role.id === resourceRoleId);
}

/**
 * Hook to check if user can access a resource (owns it or has shared access)
 *
 * This is a simplified version. In production, you'd check:
 * - Direct ownership
 * - Co-parent access
 * - Co-teacher access
 * - Student-parent connections
 *
 * @param resourceRoleId - Role ID of the resource
 * @returns True if user can access the resource
 */
export function useCanAccessResource(resourceRoleId: string | undefined): boolean {
  // For now, just check direct ownership
  // FEATURE: Shared access checking (co-parents, co-teachers) to be implemented
  return useOwnsResource(resourceRoleId);
}

/**
 * Hook to get the current active role based on route
 * Useful for multi-role users who need to switch contexts
 *
 * @param preferredRoleType - Preferred role type
 * @returns Active role
 */
export function useActiveRole(preferredRoleType?: RoleType): any | undefined {
  const { data: session } = trpc.auth.getSession.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes - auth session rarely changes
    gcTime: 10 * 60 * 1000, // 10 minutes cache (renamed from cacheTime in v5)
    refetchOnWindowFocus: false, // Don't refetch auth on every focus
  });
  const userRoles = session?.user?.roles ?? [];

  // If preferred type specified, return that role
  if (preferredRoleType) {
    return userRoles.find((r: any) => r.type === preferredRoleType);
  }

  // Otherwise return first role
  return userRoles[0];
}
