'use client';

import { useRouter, usePathname } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { RealtimeStatus } from '@/components/realtime-status';

interface ModeSwitcherProps {
  currentMode: 'parent' | 'teacher' | 'admin';
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

  const roles = session?.user?.roles || [];
  const parentRole = roles.find((role: any) => role.type === 'PARENT');
  const teacherRole = roles.find((role: any) => role.type === 'TEACHER');
  const isAdmin = session?.user?.isAdmin || false;

  // Default colors if not set
  const parentColor = parentRole?.color || '#9333ea'; // purple-600
  const teacherColor = teacherRole?.color || '#3b82f6'; // blue-500
  const adminColor = '#dc2626'; // red-600

  const handleModeSwitch = (mode: 'parent' | 'teacher' | 'admin') => {
    if (mode === 'parent') {
      router.push('/parent');
    } else if (mode === 'teacher') {
      router.push('/teacher');
    } else {
      router.push('/admin');
    }
  };

  // Don't show switcher if user doesn't have both roles
  if (!parentRole || !teacherRole) {
    return null;
  }

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <nav className="flex space-x-8" aria-label="Mode switcher">
            <button
              onClick={() => handleModeSwitch('parent')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  currentMode === 'parent'
                    ? 'border-current text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
              style={
                currentMode === 'parent'
                  ? { borderColor: parentColor, color: parentColor }
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
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  currentMode === 'teacher'
                    ? 'border-current text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
              style={
                currentMode === 'teacher'
                  ? { borderColor: teacherColor, color: teacherColor }
                  : undefined
              }
              aria-label="Switch to teacher mode"
              aria-current={currentMode === 'teacher' ? 'page' : undefined}
            >
              Teacher Mode
            </button>
            {isAdmin && (
              <button
                onClick={() => handleModeSwitch('admin')}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${
                    currentMode === 'admin'
                      ? 'border-current text-gray-900 dark:text-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
                style={
                  currentMode === 'admin'
                    ? { borderColor: adminColor, color: adminColor }
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
