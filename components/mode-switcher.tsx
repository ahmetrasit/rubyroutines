'use client';

import { useRouter, usePathname } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { RealtimeStatus } from '@/components/realtime-status';
import { ROLE_COLORS } from '@/lib/constants/theme';
import { saveLastModeToStorage } from '@/lib/hooks/useLastMode';

interface ModeSwitcherProps {
  currentMode: 'parent' | 'teacher' | 'principal' | 'admin';
}

export function ModeSwitcher({ currentMode }: ModeSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = trpc.auth.getSession.useQuery();
  const signOutMutation = trpc.auth.signOut.useMutation({
    onSuccess: () => {
      router.push('/login');
    },
  });

  const user = session?.user as any;
  const roles = user?.roles || [];
  const parentRole = roles.find((role: any) => role.type === 'PARENT');
  const teacherRole = roles.find((role: any) => role.type === 'TEACHER');
  const isAdmin = user?.isAdmin || false;

  // Check if user has any school memberships as principal
  const hasPrincipalAccess = user?.schoolMemberships?.some(
    (m: any) => m.role === 'PRINCIPAL' && m.status === 'ACTIVE'
  ) || false;

  // Default colors if not set
  const parentColor = parentRole?.color || ROLE_COLORS.PARENT; // purple-600
  const teacherColor = teacherRole?.color || ROLE_COLORS.TEACHER; // blue-500
  const principalColor = ROLE_COLORS.PRINCIPAL; // amber-500
  const adminColor = ROLE_COLORS.PRINCIPAL; // Using principal color for admin

  const handleModeSwitch = (mode: 'parent' | 'teacher' | 'principal' | 'admin') => {
    // Save the mode to localStorage for home button navigation
    saveLastModeToStorage(mode);

    if (mode === 'parent') {
      router.push('/parent');
    } else if (mode === 'teacher') {
      router.push('/teacher');
    } else if (mode === 'principal') {
      router.push('/principal');
    } else {
      router.push('/admin');
    }
  };

  // Don't show switcher if user doesn't have multiple roles
  const hasMultipleModes = (parentRole && teacherRole) || hasPrincipalAccess || isAdmin;
  if (!hasMultipleModes) {
    return null;
  }

  // Helper function to convert hex to RGB for opacity
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result && result[1] && result[2] && result[3]
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '147, 51, 234'; // Default purple RGB
  };

  const parentRgb = hexToRgb(parentColor);
  const teacherRgb = hexToRgb(teacherColor);
  const principalRgb = hexToRgb(principalColor);
  const adminRgb = hexToRgb(adminColor);

  return (
    <div className="bg-gray-100 dark:bg-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <nav className="flex gap-2 pt-2" aria-label="Mode switcher">
            <button
              onClick={() => handleModeSwitch('parent')}
              className={`
                px-6 py-3 font-semibold text-sm transition-all rounded-t-md
                ${
                  currentMode === 'parent'
                    ? 'border-t-2 border-x-2 -mb-[2px] z-10 relative'
                    : 'bg-white/50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 border-2 border-gray-300 dark:border-gray-600'
                }
              `}
              style={
                currentMode === 'parent'
                  ? {
                      backgroundColor: `rgba(${parentRgb}, 0.15)`,
                      borderTopColor: parentColor,
                      borderLeftColor: parentColor,
                      borderRightColor: parentColor,
                      color: parentColor
                    }
                  : undefined
              }
              aria-label="Switch to parent mode"
              aria-current={currentMode === 'parent' ? 'page' : undefined}
            >
              Parent Mode
            </button>
            <button
              onClick={() => handleModeSwitch('teacher')}
              className={`
                px-6 py-3 font-semibold text-sm transition-all rounded-t-md
                ${
                  currentMode === 'teacher'
                    ? 'border-t-2 border-x-2 -mb-[2px] z-10 relative'
                    : 'bg-white/50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 border-2 border-gray-300 dark:border-gray-600'
                }
              `}
              style={
                currentMode === 'teacher'
                  ? {
                      backgroundColor: `rgba(${teacherRgb}, 0.15)`,
                      borderTopColor: teacherColor,
                      borderLeftColor: teacherColor,
                      borderRightColor: teacherColor,
                      color: teacherColor
                    }
                  : undefined
              }
              aria-label="Switch to teacher mode"
              aria-current={currentMode === 'teacher' ? 'page' : undefined}
            >
              Teacher Mode
            </button>
            {hasPrincipalAccess && (
              <button
                onClick={() => handleModeSwitch('principal')}
                className={`
                  px-6 py-3 font-semibold text-sm transition-all rounded-t-md
                  ${
                    currentMode === 'principal'
                      ? 'border-t-2 border-x-2 -mb-[2px] z-10 relative'
                      : 'bg-white/50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 border-2 border-gray-300 dark:border-gray-600'
                  }
                `}
                style={
                  currentMode === 'principal'
                    ? {
                        backgroundColor: `rgba(${principalRgb}, 0.15)`,
                        borderTopColor: principalColor,
                        borderLeftColor: principalColor,
                        borderRightColor: principalColor,
                        color: principalColor
                      }
                    : undefined
                }
                aria-label="Switch to principal mode"
                aria-current={currentMode === 'principal' ? 'page' : undefined}
              >
                Principal Mode
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => handleModeSwitch('admin')}
                className={`
                  px-6 py-3 font-semibold text-sm transition-all rounded-t-md
                  ${
                    currentMode === 'admin'
                      ? 'border-t-2 border-x-2 -mb-[2px] z-10 relative'
                      : 'bg-white/50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 border-2 border-gray-300 dark:border-gray-600'
                  }
                `}
                style={
                  currentMode === 'admin'
                    ? {
                        backgroundColor: `rgba(${adminRgb}, 0.15)`,
                        borderTopColor: adminColor,
                        borderLeftColor: adminColor,
                        borderRightColor: adminColor,
                        color: adminColor
                      }
                    : undefined
                }
                aria-label="Switch to admin mode"
                aria-current={currentMode === 'admin' ? 'page' : undefined}
              >
                Admin Mode
              </button>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <RealtimeStatus />
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOutMutation.mutate()}
              disabled={signOutMutation.isPending}
              aria-label="Sign out of your account"
            >
              {signOutMutation.isPending ? 'Logging out...' : 'Log out'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
