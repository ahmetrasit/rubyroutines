'use client';

import { TaskType } from '@/lib/types/prisma-enums';
import type { Task } from "@/lib/types/task";
type TaskCompletion = any;
type Person = any;
import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Trash2, Check, Plus, Undo2 } from 'lucide-react';
import { TaskForm } from './task-form';
import { TaskDeletionWarning } from './task-deletion-warning';
import { LinkToGoalButton } from '@/components/goal/link-to-goal-button';
import { SmartTaskIndicator } from '@/components/smart-routine/smart-task-indicator';
import { canUndoCompletion, getRemainingUndoTime } from '@/lib/services/task-completion';

type TaskWithAggregation = Task & {
  isComplete: boolean;
  completionCount: number;
  progress?: number;
  totalValue?: number;
  completions: Array<TaskCompletion & { person: Pick<Person, 'id' | 'name' | 'avatar'> }>;
};

interface TaskItemProps {
  task: TaskWithAggregation;
  personId: string;
}

export function TaskItem({ task, personId }: TaskItemProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [progressValue, setProgressValue] = useState('');
  const [undoTimer, setUndoTimer] = useState(0);
  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Get most recent completion for this person
  const recentCompletion = task.completions.find((c: TaskCompletion & { person: Pick<Person, 'id' | 'name' | 'avatar'> }) => c.personId === personId);

  // Update undo timer for simple tasks
  useEffect(() => {
    if (
      task.type === TaskType.SIMPLE &&
      recentCompletion &&
      canUndoCompletion(recentCompletion.completedAt, task.type)
    ) {
      const interval = setInterval(() => {
        const remaining = getRemainingUndoTime(recentCompletion.completedAt);
        setUndoTimer(remaining);
        if (remaining <= 0) {
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
    return undefined;
  }, [recentCompletion, task.type]);

  const completeMutation = trpc.task.complete.useMutation({
    onSuccess: () => {
      utils.task.list.invalidate();
      setProgressValue('');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const undoMutation = trpc.task.undoCompletion.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Task completion undone',
        variant: 'success',
      });
      utils.task.list.invalidate();
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
    setShowDeleteWarning(true);
  };

  const handleComplete = () => {
    if (task.type === TaskType.PROGRESS) {
      if (!progressValue) {
        toast({
          title: 'Error',
          description: 'Please enter a value',
          variant: 'destructive',
        });
        return;
      }
      completeMutation.mutate({
        taskId: task.id,
        personId,
        value: progressValue,
      });
    } else {
      completeMutation.mutate({
        taskId: task.id,
        personId,
      });
    }
  };

  const handleUndo = () => {
    if (recentCompletion) {
      undoMutation.mutate({ completionId: recentCompletion.id });
    }
  };

  const renderCompletionUI = () => {
    switch (task.type) {
      case TaskType.SIMPLE:
        return (
          <div className="flex items-center gap-2">
            {task.isComplete && undoTimer > 0 ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleUndo}
                disabled={undoMutation.isPending}
              >
                <Undo2 className="h-4 w-4 mr-1" />
                Undo ({Math.floor(undoTimer / 60)}:{(undoTimer % 60).toString().padStart(2, '0')})
              </Button>
            ) : (
              <Button
                size="sm"
                variant={task.isComplete ? 'default' : 'outline'}
                onClick={handleComplete}
                disabled={task.isComplete || completeMutation.isPending}
              >
                <Check className="h-4 w-4 mr-1" />
                {task.isComplete ? 'Done' : 'Mark Done'}
              </Button>
            )}
          </div>
        );

      case TaskType.MULTIPLE_CHECKIN:
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{task.completionCount}x</span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleComplete}
              disabled={completeMutation.isPending}
            >
              <Plus className="h-4 w-4 mr-1" />
              Check In
            </Button>
          </div>
        );

      case TaskType.PROGRESS:
        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={progressValue}
                onChange={(e) => setProgressValue(e.target.value)}
                placeholder="0"
                className="w-20 h-8"
              />
              <span className="text-sm text-gray-600">{task.unit}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleComplete}
                disabled={completeMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${Math.min(100, task.progress || 0)}%` }}
                />
              </div>
              <span className="text-xs text-gray-600 whitespace-nowrap">
                {task.totalValue || 0} / {task.targetValue} {task.unit} ({task.progress || 0}%)
              </span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div className="group flex items-start gap-3 p-4 border border-gray-200 rounded-xl bg-white hover:shadow-md transition-all">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-gray-900">{task.name}</h4>
            {task.isComplete && task.type === TaskType.SIMPLE && (
              <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                ✓ Done today
              </span>
            )}
            {task.type === TaskType.MULTIPLE_CHECKIN && (
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                Multi Check-in
              </span>
            )}
            {task.type === TaskType.PROGRESS && (
              <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                Progress Tracking
              </span>
            )}
            <SmartTaskIndicator isSmart={task.type === TaskType.SMART} />
          </div>

          {task.description && (
            <p className="text-sm text-gray-500 mt-2 line-clamp-2">{task.description}</p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <LinkToGoalButton
              entityType="task"
              entityId={task.id}
              entityName={task.name}
            />
          </div>

          <div className="mt-4">{renderCompletionUI()}</div>
        </div>

        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowEdit(true)}
            className="h-8 w-8 p-0"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            className="h-8 w-8 p-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

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
}
