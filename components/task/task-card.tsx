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
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { RenderIconEmoji } from '@/components/ui/icon-emoji-picker';

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
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

export const TaskCard = memo(function TaskCard({
  task,
  personId,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
}: TaskCardProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);

  const handleDelete = () => {
    setShowDeleteWarning(true);
  };

  return (
    <>
      <Card
        className="group hover:shadow-lg transition-all h-full flex flex-col border-4"
        style={{ borderColor: task.color || '#E5E7EB' }}
      >
        <CardHeader className="p-3 pb-2">
          <div className="flex items-start gap-2">
            {task.emoji && (
              <div className="flex-shrink-0">
                <RenderIconEmoji value={task.emoji} className="h-6 w-6" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1">
                {task.name}
              </h4>
              <div className="flex flex-wrap gap-1">
                {task.isComplete && task.type === TaskType.SIMPLE && (
                  <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full">
                    ✓ Done
                  </span>
                )}
                {task.type === TaskType.MULTIPLE_CHECKIN && (
                  <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                    Multi
                  </span>
                )}
                {task.type === TaskType.PROGRESS && (
                  <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                    Progress
                  </span>
                )}
                {task.isSmart && (
                  <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                    Smart
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowEdit(true)}
                className="h-6 w-6 p-0"
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                className="h-6 w-6 p-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {task.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
          )}
        </CardHeader>

        <CardContent className="p-3 pt-0 mt-auto">
          {(canMoveUp || canMoveDown) && (
            <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                onClick={onMoveUp}
                disabled={!canMoveUp}
                className="flex-1 h-7 text-xs"
              >
                ↑
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onMoveDown}
                disabled={!canMoveDown}
                className="flex-1 h-7 text-xs"
              >
                ↓
              </Button>
            </div>
          )}
        </CardContent>
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
