'use client';

import { Task, TaskType } from '@prisma/client';
import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TaskFormProps {
  task?: Task;
  routineId?: string;
  onClose: () => void;
}

export function TaskForm({ task, routineId, onClose }: TaskFormProps) {
  const [name, setName] = useState(task?.name || '');
  const [description, setDescription] = useState(task?.description || '');
  const [type, setType] = useState<TaskType>(task?.type || TaskType.SIMPLE);
  const [targetValue, setTargetValue] = useState<string>(
    task?.targetValue?.toString() || ''
  );
  const [unit, setUnit] = useState(task?.unit || '');

  const { toast } = useToast();
  const utils = trpc.useUtils();

  const createMutation = trpc.task.create.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Task created successfully',
        variant: 'success',
      });
      utils.task.list.invalidate();
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = trpc.task.update.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Task updated successfully',
        variant: 'success',
      });
      utils.task.list.invalidate();
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate PROGRESS task requirements
    if (type === TaskType.PROGRESS && (!targetValue || !unit)) {
      toast({
        title: 'Validation Error',
        description: 'Progress tasks must have a target value and unit',
        variant: 'destructive',
      });
      return;
    }

    const taskData = {
      name,
      description: description || undefined,
      type,
      targetValue: type === TaskType.PROGRESS ? parseFloat(targetValue) : undefined,
      unit: type === TaskType.PROGRESS ? unit : undefined,
    };

    if (task) {
      updateMutation.mutate({
        id: task.id,
        ...taskData,
      });
    } else if (routineId) {
      createMutation.mutate({
        routineId,
        ...taskData,
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Create New Task'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Task Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={200}
              placeholder="Brush teeth"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="Brush for at least 2 minutes..."
            />
          </div>

          <div>
            <Label htmlFor="type">Task Type *</Label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as TaskType)}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value={TaskType.SIMPLE}>Simple (Once per period)</option>
              <option value={TaskType.MULTIPLE_CHECKIN}>
                Multiple Check-in (Track count)
              </option>
              <option value={TaskType.PROGRESS}>Progress (Track value)</option>
            </select>
          </div>

          {type === TaskType.PROGRESS && (
            <>
              <div>
                <Label htmlFor="targetValue">Target Value *</Label>
                <Input
                  id="targetValue"
                  type="number"
                  step="0.01"
                  min="0"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  required={type === TaskType.PROGRESS}
                  placeholder="10"
                />
              </div>

              <div>
                <Label htmlFor="unit">Unit *</Label>
                <Input
                  id="unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  required={type === TaskType.PROGRESS}
                  maxLength={50}
                  placeholder="pages, minutes, cups, etc."
                />
              </div>
            </>
          )}

          {type === TaskType.SIMPLE && (
            <p className="text-xs text-gray-500">
              Simple tasks can be checked off once per reset period and can be undone
              within 5 minutes.
            </p>
          )}

          {type === TaskType.MULTIPLE_CHECKIN && (
            <p className="text-xs text-gray-500">
              Multiple check-in tasks can be completed multiple times per reset period.
            </p>
          )}

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : task ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
