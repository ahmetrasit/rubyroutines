'use client';

import { TaskType } from '@/lib/types/prisma-enums';
type Task = any;
type TaskCompletion = any;
type Person = any;
import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Trash2, Check, Plus, Undo2, GripVertical } from 'lucide-react';
import { TaskForm } from './task-form';
import { TaskDeletionWarning } from './task-deletion-warning';
import { LinkToGoalButton } from '@/components/goal/link-to-goal-button';
import { SmartTaskIndicator } from '@/components/smart-routine/smart-task-indicator';
import { canUndoCompletion, getRemainingUndoTime } from '@/lib/services/task-completion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

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

export function TaskCard({
  task,
  personId,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
}: TaskCardProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [progressValue, setProgressValue] = useState('');
  const [undoTimer, setUndoTimer] = useState(0);
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const recentCompletion = task.completions.find(
    (c: TaskCompletion & { person: Pick<Person, 'id' | 'name' | 'avatar'> }) => c.personId === personId
  );

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
          <div className="flex flex-col gap-2 w-full">
            {task.isComplete && undoTimer > 0 ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleUndo}
                disabled={undoMutation.isPending}
                className="w-full"
              >
                <Undo2 className="h-3 w-3 mr-1" />
                Undo ({Math.floor(undoTimer / 60)}:{(undoTimer % 60).toString().padStart(2, '0')})
              </Button>
            ) : (
              <Button
                size="sm"
                variant={task.isComplete ? 'default' : 'outline'}
                onClick={handleComplete}
                disabled={task.isComplete || completeMutation.isPending}
                className="w-full"
              >
                <Check className="h-3 w-3 mr-1" />
                {task.isComplete ? 'Done' : 'Mark Done'}
              </Button>
            )}
          </div>
        );

      case TaskType.MULTIPLE_CHECKIN:
        return (
          <div className="flex flex-col gap-2 w-full">
            <div className="text-center mb-1">
              <span className="text-2xl font-bold text-blue-600">{task.completionCount}</span>
              <span className="text-xs text-gray-500 ml-1">check-ins</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleComplete}
              disabled={completeMutation.isPending}
              className="w-full"
            >
              <Plus className="h-3 w-3 mr-1" />
              Check In
            </Button>
          </div>
        );

      case TaskType.PROGRESS:
        return (
          <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center gap-1">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={progressValue}
                onChange={(e) => setProgressValue(e.target.value)}
                placeholder="0"
                className="flex-1 h-8 text-sm"
              />
              <span className="text-xs text-gray-600">{task.unit}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleComplete}
              disabled={completeMutation.isPending}
              className="w-full"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
            <div className="flex items-center gap-1">
              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${Math.min(100, task.progress || 0)}%` }}
                />
              </div>
            </div>
            <div className="text-xs text-center text-gray-600">
              {task.totalValue || 0} / {task.targetValue} {task.unit}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Card className="group hover:shadow-lg transition-all h-full flex flex-col">
        <CardHeader className="p-3 pb-2">
          <div className="flex items-start gap-2">
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
          {renderCompletionUI()}

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
}
