'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Users, GraduationCap } from 'lucide-react';

interface ModeSwitcherProps {
  roles: Array<{ type: string }>;
}

export function ModeSwitcher({ roles }: ModeSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();

  const hasParentRole = roles.some((role) => role.type === 'PARENT');
  const hasTeacherRole = roles.some((role) => role.type === 'TEACHER');

  // Only show if user has both roles
  if (!hasParentRole || !hasTeacherRole) {
    return null;
  }

  const isParentMode = pathname?.startsWith('/parent');
  const isTeacherMode = pathname?.startsWith('/teacher');

  return (
    <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm p-1">
      <Button
        size="sm"
        variant={isParentMode ? 'default' : 'ghost'}
        onClick={() => router.push('/parent')}
        className="flex items-center gap-2"
      >
        <Users className="h-4 w-4" />
        Parent
      </Button>
      <Button
        size="sm"
        variant={isTeacherMode ? 'default' : 'ghost'}
        onClick={() => router.push('/teacher')}
        className="flex items-center gap-2"
      >
        <GraduationCap className="h-4 w-4" />
        Teacher
      </Button>
    </div>
  );
}
