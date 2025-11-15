'use client';

import { TaskType } from '@/lib/types/prisma-enums';
type Task = any;
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
  personId?: string;
  onClose: () => void;
}

const TASK_ICONS = [
  '✅', '📝', '🎯', '⏰', '📚', '🏃', '🍎', '💪', '🧘', '🎨',
  '🎵', '🎮', '📱', '💻', '📖', '✏️', '🖍️', '🖊️', '📄', '📋',
  '🗓️', '⏱️', '⏲️', '⌛', '🔔', '📣', '🎯', '🏆', '🥇', '⭐',
  '💡', '🔍', '🔧', '🔨', '🎪', '🎭', '🎬', '🎤', '🎧', '🎸',
];

export function TaskForm({ task, routineId, personId, onClose }: TaskFormProps) {
  const [name, setName] = useState(task?.name || '');
  const [description, setDescription] = useState(task?.description || '');
  const [type, setType] = useState<TaskType>(task?.type || TaskType.SIMPLE);
  const [unit, setUnit] = useState(task?.unit || '');
  const [isSmart, setIsSmart] = useState(task?.isSmart || false);
  const [selectedIcon, setSelectedIcon] = useState('✅');

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

    const taskData = {
      name,
      description: description || undefined,
      type,
      unit: type === TaskType.PROGRESS && unit ? unit : undefined,
      isSmart,
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="name">Task Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={200}
              placeholder="Brush teeth"
              className="mt-1"
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
              className="w-full rounded-lg border border-gray-300 px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Brush for at least 2 minutes..."
            />
          </div>

          <div>
            <Label>Choose Icon</Label>
            <div className="grid grid-cols-10 gap-2 mt-2 max-h-32 overflow-y-auto p-2 border border-gray-200 rounded-lg">
              {TASK_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`text-2xl p-2 rounded-lg transition-all ${
                    selectedIcon === icon
                      ? 'bg-primary-100 ring-2 ring-primary-500 scale-110'
                      : 'hover:bg-gray-100'
                  }`}
                  title={icon}
                >
                  {icon}
                </button>
              ))}
            </div>
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

          {type === TaskType.SIMPLE && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Simple tasks can be checked off once per reset period and can be undone within 5 minutes.
              </p>
            </div>
          )}

          {type === TaskType.MULTIPLE_CHECKIN && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-800">
                Multiple check-in tasks can be completed multiple times per reset period.
              </p>
            </div>
          )}

          {type === TaskType.PROGRESS && (
            <div>
              <Label htmlFor="unit">Unit (e.g., pages, minutes) *</Label>
              <Input
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                required
                maxLength={50}
                placeholder="pages"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                What unit are you tracking? (e.g., pages, minutes, cups)
              </p>
            </div>
          )}

          <div className="border-t pt-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="isSmart"
                checked={isSmart}
                onChange={(e) => setIsSmart(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-500 rounded"
              />
              <div className="flex-1">
                <Label htmlFor="isSmart" className="cursor-pointer">
                  Make this a Smart Task
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  {task && isSmart
                    ? 'Smart tasks only appear when conditions are met. Set conditions below.'
                    : 'Smart tasks only appear when conditions are met. You can set conditions after creating the task.'}
                </p>
              </div>
            </div>

            {task && isSmart && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Condition Management</strong>
                </p>
                <p className="text-xs text-blue-700 mb-3">
                  Define when this task should appear. Task will be visible when conditions are met.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-blue-700 border-blue-300 hover:bg-blue-100"
                  onClick={() => {
                    // TODO: Open condition builder dialog
                    toast({
                      title: 'Coming Soon',
                      description: 'Condition builder UI will be available soon',
                    });
                  }}
                >
                  {task.conditionId ? 'Edit Conditions' : 'Set Conditions'}
                </Button>
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <Label className="mb-3 block">Preview</Label>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{selectedIcon}</div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {name || 'Task name'}
                  </p>
                  {description && (
                    <p className="text-sm text-gray-500 mt-1">
                      {description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
