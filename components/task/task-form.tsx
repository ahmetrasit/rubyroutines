'use client';

import { TaskType } from '@/lib/types/prisma-enums';
import type { Task } from "@/lib/types/task";
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
import { IconEmojiPicker, RenderIconEmoji } from '@/components/ui/icon-emoji-picker';
import { ColorPicker } from '@/components/ui/color-picker';
import { usePickerState } from '@/hooks/use-picker-state';

interface TaskFormProps {
  task?: Task;
  routineId?: string;
  personId?: string;
  onClose: () => void;
}

export function TaskForm({ task, routineId, personId, onClose }: TaskFormProps) {
  const [name, setName] = useState(task?.name || '');
  const [description, setDescription] = useState(task?.description || '');
  const [type, setType] = useState<TaskType>(task?.type || TaskType.SIMPLE);
  const [unit, setUnit] = useState(task?.unit || '');
  const [isSmart, setIsSmart] = useState(task?.isSmart || false);
  const [emoji, setEmoji] = useState(task?.emoji || '✅');
  const [color, setColor] = useState<string>(task?.color || '#3B82F6');

  const { pickerRef, togglePicker, closePicker, isPickerOpen } = usePickerState();

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

    if (task) {
      // When editing, allow changing emoji, color, and description
      updateMutation.mutate({
        id: task.id,
        emoji,
        color,
        description: description || undefined,
      });
    } else if (routineId) {
      // When creating, all fields are available
      const taskData = {
        name,
        description: description || undefined,
        type,
        unit: type === TaskType.PROGRESS && unit ? unit : undefined,
        isSmart,
        emoji,
        color,
      };

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
          {/* Emoji Picker - Always editable */}
          <div className="relative">
            <Label htmlFor="emoji">Icon</Label>
            <button
              type="button"
              onClick={() => togglePicker('emoji')}
              className="mt-2 w-full h-12 rounded-md border border-gray-300 flex items-center justify-center text-2xl hover:bg-gray-50 transition-colors"
            >
              <RenderIconEmoji value={emoji || '✅'} className="h-8 w-8" />
            </button>
            {isPickerOpen('emoji') && (
              <div ref={pickerRef} className="absolute z-50 top-full mt-2 left-0">
                <IconEmojiPicker
                  selectedValue={emoji || '✅'}
                  onSelect={setEmoji}
                  onClose={closePicker}
                />
              </div>
            )}
          </div>

          {/* Show name and type as read-only when editing, but allow description editing */}
          {task ? (
            <>
              <div className="p-4 bg-gray-50 rounded-lg border">
                <div className="mb-3">
                  <Label className="text-xs text-gray-500">Task Name (cannot be changed)</Label>
                  <p className="text-base font-semibold text-gray-900 mt-1">{name}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Task Type (cannot be changed)</Label>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {type === TaskType.SIMPLE && 'Simple (Once per period)'}
                    {type === TaskType.MULTIPLE_CHECKIN && 'Multiple Check-in (Track count)'}
                    {type === TaskType.PROGRESS && `Progress (Track ${unit})`}
                  </p>
                </div>
              </div>

              {/* Description - Editable when editing */}
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={25}
                  placeholder="Add a brief description..."
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">{description.length}/25 characters</p>
              </div>
            </>
          ) : (
            <>
              {/* Name - Only when creating */}
              <div>
                <Label htmlFor="name">Task Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={25}
                  placeholder="Brush teeth"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">{name.length}/25 characters</p>
              </div>

              {/* Description - Only when creating */}
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={25}
                  placeholder="2 minutes, twice daily"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">{description.length}/25 characters</p>
              </div>
            </>
          )}

          {/* Color Picker */}
          <div className="relative">
            <Label>Color</Label>
            <button
              type="button"
              onClick={() => togglePicker('color')}
              className="mt-2 w-full h-10 rounded-md border border-gray-300 flex items-center gap-3 px-3 hover:bg-gray-50 transition-colors"
            >
              <div
                className="w-6 h-6 rounded-full border-2 border-gray-300"
                style={{ backgroundColor: color }}
              />
              <span className="text-sm text-gray-700">{color}</span>
            </button>
            {isPickerOpen('color') && (
              <div ref={pickerRef} className="absolute z-50 top-full mt-2">
                <ColorPicker
                  color={color}
                  onChange={setColor}
                  onClose={closePicker}
                />
              </div>
            )}
          </div>

          {/* Task Type and related fields - Only shown when creating */}
          {!task && (
            <>
              <div className="flex items-center gap-3">
                <Label htmlFor="type" className="whitespace-nowrap">Task Type:</Label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value as TaskType)}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2"
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

              {/* Smart Task Checkbox - Only when creating */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isSmart"
                    checked={isSmart}
                    onChange={(e) => setIsSmart(e.target.checked)}
                    className="w-4 h-4 text-blue-500 rounded"
                  />
                  <Label htmlFor="isSmart" className="cursor-pointer">
                    Make this a Smart Task
                  </Label>
                </div>
              </div>
            </>
          )}

          {/* Preview */}
          <div className="border-t pt-4">
            <Label className="mb-3 block">Preview</Label>
            <div className="bg-gray-50 rounded-xl p-4 border-4" style={{ borderColor: color }}>
              <div className="flex items-center gap-3">
                <div className="text-3xl">
                  <RenderIconEmoji value={emoji} className="h-8 w-8" />
                </div>
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
