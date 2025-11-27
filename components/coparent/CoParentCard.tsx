'use client';

import { Button } from '@/components/ui/button';
import { Users, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/use-toast';
import { useDeleteMutation } from '@/lib/hooks';

interface CoParentCardProps {
  coParent: any;
  onSelect?: () => void;
  roleId: string;
}

export function CoParentCard({ coParent, onSelect, roleId }: CoParentCardProps) {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const revokeMutation = trpc.coParent.revoke.useMutation();
  const { mutate: revokeAccess, isLoading: isRevoking } = useDeleteMutation(
    revokeMutation as any,
    {
      entityName: coParent.coParentUser?.name || 'co-parent',
      invalidateQueries: [
        () => utils.coParent.list.invalidate(),
        () => utils.person.list.invalidate(),
      ],
    }
  );

  const handleRevoke = () => {
    if (confirm(`Revoke ${coParent.coParentUser?.name || 'co-parent'}'s access?`)) {
      revokeAccess({ coParentId: coParent.id });
    }
  };

  // Count shared children
  const sharedChildrenCount = coParent.personIds?.length || 0;

  // Co-parent specific color (purple/lavender theme)
  const coParentColor = '#9333ea'; // purple-600
  const backgroundColor = '#f3e8ff'; // purple-100

  return (
    <div
      className="group relative rounded-xl bg-white p-4 shadow-md hover:shadow-lg transition-all cursor-pointer border border-gray-200 border-t-4"
      style={{ borderTopColor: coParentColor }}
      onClick={onSelect}
    >
      {/* Avatar and Name */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-shrink-0">
          <div
            className="h-14 w-14 rounded-full flex items-center justify-center text-2xl border-4"
            style={{ backgroundColor, borderColor: coParentColor }}
          >
            <Users className="h-7 w-7" style={{ color: coParentColor }} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 truncate">
            {coParent.coParentUser?.name || 'Co-Parent'}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 truncate font-medium">
            Co-Parent
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-around text-center">
          <div className="flex-1">
            <div className="text-2xl font-bold text-gray-900">{sharedChildrenCount}</div>
            <div className="text-xs text-gray-500">Shared Children</div>
          </div>
          <div className="flex-1">
            <div className="text-2xl font-bold text-gray-900">
              {coParent.permissions === 'FULL_EDIT' ? 'Full' : coParent.permissions === 'TASK_COMPLETION' ? 'Tasks' : 'View'}
            </div>
            <div className="text-xs text-gray-500">Access</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 relative z-10">
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.();
          }}
          className="flex-1 text-white hover:opacity-90 transition-opacity"
          style={{ backgroundColor: coParentColor }}
        >
          <Users className="h-4 w-4 mr-1" />
          View Shared
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            handleRevoke();
          }}
          disabled={isRevoking}
          className="px-3 text-red-600 hover:text-red-700 hover:bg-red-50 border-gray-300 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
