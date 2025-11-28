'use client';

import { TaskType } from '@/lib/types/prisma-enums';
import type { Task } from "@/lib/types/task";
type TaskCompletion = any;
type Person = any;
import { useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { TaskForm } from './task-form';
import { TaskDeletionWarning } from './task-deletion-warning';
import { Card, CardHeader } from '@/components/ui/card';
import { RenderIconEmoji } from '@/components/ui/icon-emoji-picker';
import { trpc } from '@/lib/trpc/client';
import { GoalProgressIndicator } from '@/components/goal/goal-progress-indicator';

type TaskWithAggregation = Task & {
  isComplete: boolean;
  completionCount: number;
  progress?: number;
  totalValue?: number;
  completions: Array<TaskCompletion & { person: Pick<Person, 'id' | 'name' | 'avatar'> }>;
};

interface TaskCardProps {
  task: TaskWithAggregation;
  personId: string;
}

export const TaskCard = memo(function TaskCard({
  task,
  personId,
}: TaskCardProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);

  // Fetch goals for this task
  const { data: goals } = trpc.goal.getGoalsForTask.useQuery(
    { taskId: task.id },
    {
      // Only fetch if in authenticated context
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 2 * 60 * 1000, // 2 minutes - goals update moderately
      gcTime: 10 * 60 * 1000, // 10 minutes cache
    }
  );

  const handleDelete = () => {
    setShowDeleteWarning(true);
  };

  // Get task type label
  const getTaskTypeLabel = () => {
    if (task.type === TaskType.SIMPLE) return 'Simple';
    if (task.type === TaskType.MULTIPLE_CHECKIN) return 'Multiple';
    if (task.type === TaskType.PROGRESS) return 'Progress';
    return 'Simple';
  };

  return (
    <>
      <Card
        className="hover:shadow-md transition-all h-full flex flex-col border-4 p-3"
        style={{ borderColor: task.color || '#E5E7EB' }}
      >
        {/* Row 1: Emoji + Task Name */}
        <div className="flex items-center gap-2 mb-2">
          {task.emoji && (
            <RenderIconEmoji value={task.emoji} className="h-5 w-5" />
          )}
          <h4 className="font-semibold text-sm text-gray-900 flex-1 line-clamp-1">
            {task.name}
          </h4>
        </div>

        {/* Row 2: Description */}
        {task.description && (
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{task.description}</p>
        )}

        {/* Goal Progress Bars */}
        {goals && goals.length > 0 && (
          <div className="mb-2">
            <GoalProgressIndicator goals={goals} compact={true} />
          </div>
        )}

        {/* Row 3: Task Type Badge + Edit & Delete Buttons */}
        <div className="flex items-center gap-2 mt-auto">
          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
            {getTaskTypeLabel()}
          </span>
          {task.isSmart && (
            <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">
              Smart
            </span>
          )}
          <div className="flex gap-1 ml-auto">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowEdit(true)}
              className="h-7 w-7 p-0 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              className="h-7 w-7 p-0 text-gray-600 hover:text-red-600 hover:bg-red-50"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      {showEdit && <TaskForm task={task} onClose={() => setShowEdit(false)} />}

      <TaskDeletionWarning
        isOpen={showDeleteWarning}
        onClose={() => setShowDeleteWarning(false)}
        taskId={task.id}
        taskName={task.name}
        onDeleted={() => setShowDeleteWarning(false)}
      />
    </>
  );
});
