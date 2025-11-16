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
        <CardHeader className="p-1.5 pb-0.5">
          <div className="flex items-start gap-1.5">
            {task.emoji && (
              <div className="flex-shrink-0">
                <RenderIconEmoji value={task.emoji} className="h-5 w-5" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-xs text-gray-900 line-clamp-1 mb-0.5">
                {task.name}
              </h4>
              <div className="flex flex-wrap gap-0.5">
                {task.isComplete && task.type === TaskType.SIMPLE && (
                  <span className="text-[10px] px-1 py-0.5 bg-green-100 text-green-700 rounded-full">
                    ✓
                  </span>
                )}
                {task.type === TaskType.MULTIPLE_CHECKIN && (
                  <span className="text-[10px] px-1 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                    Multi
                  </span>
                )}
                {task.type === TaskType.PROGRESS && (
                  <span className="text-[10px] px-1 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                    Progress
                  </span>
                )}
                {task.isSmart && (
                  <span className="text-[10px] px-1 py-0.5 bg-amber-100 text-amber-700 rounded-full">
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
                className="h-5 w-5 p-0"
              >
                <Pencil className="h-2.5 w-2.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                className="h-5 w-5 p-0"
              >
                <Trash2 className="h-2.5 w-2.5" />
              </Button>
            </div>
          </div>

          {task.description && (
            <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{task.description}</p>
          )}
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
