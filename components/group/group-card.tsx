'use client';

import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Users } from 'lucide-react';
import { useState, memo } from 'react';
import { GroupForm } from './group-form';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import { RenderIconEmoji } from '@/components/ui/icon-emoji-picker';

interface GroupCardProps {
  group: any;
  onSelect?: (group: any) => void;
  hideSubtitle?: boolean;
}

export const GroupCard = memo(function GroupCard({ group, onSelect, hideSubtitle = false }: GroupCardProps) {
  const [showEdit, setShowEdit] = useState(false);
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const deleteMutation = trpc.group.delete.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: `${group.name} has been archived`,
        variant: 'success',
      });
      utils.group.list.invalidate();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleDelete = () => {
    if (confirm(`Are you sure you want to archive "${group.name}"?`)) {
      deleteMutation.mutate({ id: group.id });
    }
  };

  // Count only students/kids (exclude teachers/parents who are account owners)
  const memberCount = group.members
    ? group.members.filter((m: any) => !m.person?.isAccountOwner).length
    : (group._count?.members || 0);

  // Check if this is the protected Teacher-Only classroom
  const isTeacherOnlyClassroom = group.name === 'Teacher-Only';

  return (
    <>
      <div
        className="group relative rounded-xl bg-white p-6 shadow-md hover:shadow-lg transition-all cursor-pointer border-4"
        style={{ borderColor: group.color || '#3B82F6' }}
        onClick={() => onSelect?.(group)}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-xl text-gray-900 truncate flex items-center gap-2">
              {group.emoji && <RenderIconEmoji value={group.emoji} className="h-6 w-6" />}
              {group.name}
            </h3>
            {!hideSubtitle && (
              <p className="text-sm text-gray-600 mt-1">
                {group.type.charAt(0) + group.type.slice(1).toLowerCase()}
              </p>
            )}
          </div>

          {/* Hide edit/delete buttons for Teacher-Only classroom */}
          {!isTeacherOnlyClassroom && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEdit(true);
                }}
                className="h-8 w-8 p-0"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className="h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {group.description && group.name !== 'Teacher-Only' && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{group.description}</p>
        )}

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Users className="h-4 w-4" />
          <span>
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </span>
        </div>
      </div>

      {showEdit && <GroupForm group={group} onClose={() => setShowEdit(false)} />}
    </>
  );
});
