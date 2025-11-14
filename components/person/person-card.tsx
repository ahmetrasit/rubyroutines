'use client';

import { Button } from '@/components/ui/button';
import { Pencil, Trash2, CheckCircle } from 'lucide-react';
import { useState, memo } from 'react';
import { PersonForm } from './person-form';
import { trpc } from '@/lib/trpc/client';
import { useAvatar } from '@/lib/hooks';
import { useDeleteMutation } from '@/lib/hooks';
import type { Person } from '@/lib/types/database';

interface PersonCardProps {
  person: Person;
  onSelect?: (person: Person) => void;
}

export const PersonCard = memo(function PersonCard({ person, onSelect }: PersonCardProps) {
  const [showEdit, setShowEdit] = useState(false);
  const utils = trpc.useUtils();

  // Parse avatar data using custom hook
  const { color, emoji, backgroundColor } = useAvatar({
    avatarString: person.avatar,
    fallbackName: person.name,
  });

  const deleteMutation = trpc.person.delete.useMutation();
  const { mutate: deletePerson, isLoading: isDeleting } = useDeleteMutation(
    deleteMutation,
    {
      entityName: person.name,
      invalidateQueries: [() => utils.person.list.invalidate()],
    }
  );

  const handleDelete = () => {
    if (confirm(`Are you sure you want to archive ${person.name}?`)) {
      deletePerson({ id: person.id });
    }
  };

  const handleCheckIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement check-in functionality
    alert('Check-in feature coming soon!');
  };

  // TODO: Fetch actual task and goal completion data
  const dailyTasksCompleted = 0;
  const dailyTasksTotal = 0;
  const dailyGoalsAccomplished = 0;
  const dailyGoalsTotal = 0;

  const taskProgress = dailyTasksTotal > 0 ? (dailyTasksCompleted / dailyTasksTotal) * 100 : 0;
  const goalProgress = dailyGoalsTotal > 0 ? (dailyGoalsAccomplished / dailyGoalsTotal) * 100 : 0;

  // TODO: Check if person is connected to a classroom
  const isInClassroom = false;

  return (
    <>
      <div
        className="group relative rounded-xl bg-white p-4 shadow-md hover:shadow-lg transition-all cursor-pointer border-t-4"
        style={{ borderTopColor: color }}
        onClick={() => onSelect?.(person)}
      >
        {/* Avatar and Name */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0">
            <div
              className="h-14 w-14 rounded-full flex items-center justify-center text-2xl"
              style={{ backgroundColor }}
            >
              {emoji}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-gray-900 truncate">{person.name}</h3>
            {isInClassroom && (
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                📚 In Classroom
              </span>
            )}
          </div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-2 mb-4">
          {/* Daily Tasks Progress */}
          <div className="h-6 bg-gray-200 rounded-full overflow-hidden relative">
            {dailyTasksTotal > 0 ? (
              <>
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${taskProgress}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-700">
                    Daily Tasks: {dailyTasksCompleted}/{dailyTasksTotal}
                  </span>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center">
                <span className="text-xs text-gray-500">no daily tasks</span>
              </div>
            )}
          </div>

          {/* Daily Goals Progress */}
          <div className="h-6 bg-gray-200 rounded-full overflow-hidden relative">
            {dailyGoalsTotal > 0 ? (
              <>
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${goalProgress}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-700">
                    Daily Goals: {dailyGoalsAccomplished}/{dailyGoalsTotal}
                  </span>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center">
                <span className="text-xs text-gray-500">no daily goals</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleCheckIn}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Check-in
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              setShowEdit(true);
            }}
            className="px-3"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          {person.name !== 'Me' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className="px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {showEdit && (
        <PersonForm
          person={person}
          onClose={() => setShowEdit(false)}
        />
      )}
    </>
  );
});
