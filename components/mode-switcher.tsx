'use client';

import { useRouter, usePathname } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';

interface ModeSwitcherProps {
  currentMode: 'parent' | 'teacher';
}

export function ModeSwitcher({ currentMode }: ModeSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = trpc.auth.getSession.useQuery();

  const roles = session?.user?.roles || [];
  const parentRole = roles.find((role: any) => role.type === 'PARENT');
  const teacherRole = roles.find((role: any) => role.type === 'TEACHER');

  // Default colors if not set
  const parentColor = parentRole?.color || '#9333ea'; // purple-600
  const teacherColor = teacherRole?.color || '#3b82f6'; // blue-500

  const handleModeSwitch = (mode: 'parent' | 'teacher') => {
    if (mode === 'parent') {
      router.push('/parent');
    } else {
      router.push('/teacher');
    }
  };

  // Don't show switcher if user doesn't have both roles
  if (!parentRole || !teacherRole) {
    return null;
  }

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Mode switcher">
        <div className="flex space-x-8">
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
        </div>
      </nav>
    </div>
  );
}
