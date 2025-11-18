'use client';

import { Button } from '@/components/ui/button';
import { Users, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/use-toast';
import { useDeleteMutation } from '@/lib/hooks';

interface CoTeacherCardProps {
  coTeacher: any;
  onSelect?: () => void;
  groupId: string;
}

export function CoTeacherCard({ coTeacher, onSelect, groupId }: CoTeacherCardProps) {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const revokeMutation = trpc.coTeacher.revoke.useMutation();
  const { mutate: revokeAccess, isLoading: isRevoking } = useDeleteMutation(
    revokeMutation,
    {
      entityName: coTeacher.coTeacherRole?.user?.name || 'co-teacher',
      invalidateQueries: [
        () => utils.coTeacher.list.invalidate(),
        () => utils.group.getById.invalidate(),
      ],
    }
  );

  const handleRevoke = () => {
    if (confirm(`Revoke ${coTeacher.coTeacherRole?.user?.name || 'co-teacher'}'s access?`)) {
      revokeAccess({ coTeacherId: coTeacher.id });
    }
  };

  // Co-teacher specific color (blue/indigo theme)
  const coTeacherColor = '#3b82f6'; // blue-500
  const backgroundColor = '#dbeafe'; // blue-100

  return (
    <div
      className="group relative rounded-xl bg-white p-4 shadow-md hover:shadow-lg transition-all cursor-pointer border border-gray-200 border-t-4"
      style={{ borderTopColor: coTeacherColor }}
      onClick={onSelect}
    >
      {/* Avatar and Name */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-shrink-0">
          <div
            className="h-14 w-14 rounded-full flex items-center justify-center text-2xl border-4"
            style={{ backgroundColor, borderColor: coTeacherColor }}
          >
            <Users className="h-7 w-7" style={{ color: coTeacherColor }} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 truncate">
            {coTeacher.coTeacherRole?.user?.name || 'Co-Teacher'}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 truncate font-medium">
            Co-Teacher
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-around text-center">
          <div className="flex-1">
            <div className="text-2xl font-bold text-gray-900">
              {coTeacher.permissions === 'FULL_EDIT' ? 'Full' : coTeacher.permissions === 'EDIT_TASKS' ? 'Tasks' : 'View'}
            </div>
            <div className="text-xs text-gray-500">Access Level</div>
          </div>
          <div className="flex-1">
            <div className="text-2xl font-bold text-gray-900">Shared</div>
            <div className="text-xs text-gray-500">Classroom</div>
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
          style={{ backgroundColor: coTeacherColor }}
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
