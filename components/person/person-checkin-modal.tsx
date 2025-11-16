'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Loader2 } from 'lucide-react';
import { TaskColumn } from '@/components/kiosk/task-column';
import { TaskType } from '@/lib/types/prisma-enums';
import { useToast } from '@/components/ui/toast';

interface Task {
  id: string;
  name: string;
  description?: string | null;
  type: TaskType;
  unit?: string | null;
  targetValue?: number | null;
  isComplete?: boolean;
  completionCount?: number;
  progress?: number;
  totalValue?: number;
  entryNumber?: number;
  summedValue?: number;
  completions?: Array<{
    id: string;
    completedAt: Date;
    personId: string;
  }>;
}

interface PersonCheckinModalProps {
  personId: string;
  personName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PersonCheckinModal({ personId, personName, isOpen, onClose }: PersonCheckinModalProps) {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Fetch person details with routines and tasks
  const { data: person, isLoading: tasksLoading } = trpc.person.getById.useQuery(
    { id: personId },
    { enabled: isOpen && !!personId }
  );

  // Flatten all tasks from all routines assigned to this person
  const tasks: Task[] = person?.assignments?.flatMap((assignment: any) =>
    assignment.routine.tasks.map((task: any) => ({
      ...task,
      routineName: assignment.routine.name,
      // Add aggregation data that would normally come from kiosk query
      isComplete: false, // TODO: calculate from completions
      completionCount: 0, // TODO: calculate from completions
      entryNumber: 0,
      summedValue: 0
    }))
  ) || [];

  const completeMutation = trpc.task.complete.useMutation({
    onSuccess: () => {
      utils.person.getById.invalidate();
      toast({
        title: 'Success',
        description: 'Task completed!',
        variant: 'success',
      });
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
      utils.person.getById.invalidate();
      toast({
        title: 'Success',
        description: 'Task undone',
        variant: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleComplete = (taskId: string, value?: string) => {
    completeMutation.mutate({
      taskId,
      personId,
      value,
    });
  };

  const handleUndo = (completionId: string) => {
    undoMutation.mutate({ completionId });
  };

  // Group tasks by type
  const simpleTasks = tasks.filter((t) => t.type === TaskType.SIMPLE);
  const multiTasks = tasks.filter((t) => t.type === TaskType.MULTIPLE_CHECKIN);
  const progressTasks = tasks.filter((t) => t.type === TaskType.PROGRESS);

  const columns = [
    simpleTasks.length > 0 && { title: 'Simple Tasks', tasks: simpleTasks, type: 'SIMPLE' },
    multiTasks.length > 0 && { title: 'Check-ins', tasks: multiTasks, type: 'MULTI' },
    progressTasks.length > 0 && { title: 'Progress', tasks: progressTasks, type: 'PROGRESS' }
  ].filter(Boolean);

  const columnCount = columns.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] h-[90vh] p-0 gap-0">
        {/* Header */}
        <div className="border-b p-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">{personName}'s Check-in</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-4">
          {tasksLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-gray-900">All done!</h2>
              </div>
            </div>
          ) : (
            <div
              className={`h-full grid gap-4 grid-cols-1 ${
                columnCount === 3 ? 'min-[480px]:grid-cols-3' :
                columnCount === 2 ? 'min-[480px]:grid-cols-2' :
                'min-[480px]:grid-cols-1'
              }`}
            >
              {columns.map((column: any) => (
                <TaskColumn
                  key={column.type}
                  title={column.title}
                  tasks={column.tasks}
                  personId={personId}
                  onComplete={handleComplete}
                  onUndo={handleUndo}
                  isPending={completeMutation.isPending || undoMutation.isPending}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
