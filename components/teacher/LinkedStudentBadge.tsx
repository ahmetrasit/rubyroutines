'use client';

import { Badge } from '@/components/ui/badge';
import { Link2 } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';

interface LinkedStudentBadgeProps {
  personId: string;
  roleId: string;
  onClick?: () => void;
}

export function LinkedStudentBadge({ personId, roleId, onClick }: LinkedStudentBadgeProps) {
  const { data: links } = trpc.teacherStudentLink.getForStudent.useQuery(
    { roleId, personId },
    { enabled: !!roleId && !!personId }
  );

  if (!links || links.length === 0) {
    return null;
  }

  // Get linked student names for title
  const linkedStudentNames = links.map((link) => {
    if (link.primaryStudentId === personId) {
      return link.linkedStudent?.name;
    }
    return link.primaryStudent?.name;
  }).filter(Boolean);

  const titleText = `Linked with: ${linkedStudentNames.join(', ')}`;

  return (
    <Badge
      variant="secondary"
      className="cursor-pointer bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300 gap-1"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      title={titleText}
    >
      <Link2 className="h-3 w-3" />
      <span>{links.length}</span>
    </Badge>
  );
}
