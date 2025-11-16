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

  const handleDelete = () => {
    setShowDeleteWarning(true);
  };

  return (
    <>
      <Card
        className="group hover:shadow-md transition-all h-full flex flex-col border-2"
        style={{ borderColor: task.color || '#E5E7EB' }}
      >
        <CardHeader className="p-1">
          <div className="flex items-start gap-1">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                {task.emoji && (
                  <div className="flex-shrink-0">
                    <RenderIconEmoji value={task.emoji} className="h-4 w-4" />
                  </div>
                )}
                <h4 className="font-semibold text-sm text-gray-900 truncate">
                  {task.name}
                </h4>
                {task.isComplete && task.type === TaskType.SIMPLE && (
                  <span className="text-[9px] px-1 py-0.5 bg-green-100 text-green-700 rounded-full flex-shrink-0">
                    ✓
                  </span>
                )}
                {task.type === TaskType.MULTIPLE_CHECKIN && (
                  <span className="text-[9px] px-1 py-0.5 bg-blue-100 text-blue-700 rounded-full flex-shrink-0">
                    M
                  </span>
                )}
                {task.type === TaskType.PROGRESS && (
                  <span className="text-[9px] px-1 py-0.5 bg-purple-100 text-purple-700 rounded-full flex-shrink-0">
                    P
                  </span>
                )}
                {task.isSmart && (
                  <span className="text-[9px] px-1 py-0.5 bg-amber-100 text-amber-700 rounded-full flex-shrink-0">
                    S
                  </span>
                )}
              </div>
              {task.description && (
                <p className="text-xs text-gray-500 mt-0.5 truncate">{task.description}</p>
              )}
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowEdit(true)}
                className="h-7 w-7 p-0"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                className="h-7 w-7 p-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
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
