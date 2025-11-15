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
