'use client';

import { TaskType, EntityStatus } from '@/lib/types/prisma-enums';
import type { Task } from "@/lib/types/task";
import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import { useOptimisticCreate, useOptimisticUpdate } from '@/lib/hooks';
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
import { getTierLimit, ComponentTierLimits } from '@/lib/services/tier-limits';

interface TaskFormProps {
  task?: Task;
  routineId?: string;
  personId?: string;
  onClose: () => void;
  effectiveLimits?: ComponentTierLimits | null;
}

export function TaskForm({ task, routineId, personId, onClose, effectiveLimits = null }: TaskFormProps) {
  const [name, setName] = useState(task?.name || '');
  const [description, setDescription] = useState(task?.description || '');
  const [type, setType] = useState<TaskType>(task?.type || TaskType.SIMPLE);
  const [unit, setUnit] = useState(task?.unit || '');
  const [isSmart, setIsSmart] = useState(task?.isSmart || false);
  const [emoji, setEmoji] = useState(task?.emoji || '😊');
  const [color, setColor] = useState<string>(task?.color || '#3B82F6');

  const { pickerRef, togglePicker, closePicker, isPickerOpen } = usePickerState();

  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Fetch tasks to check smart task count (only when creating a new task)
  const { data: tasks } = trpc.task.list.useQuery(
    { routineId: routineId || '' },
    { enabled: !!routineId && !task }
  );

  // Calculate smart task limits
  const smartTaskLimit = getTierLimit(effectiveLimits, 'smart_tasks_per_routine');
  const currentSmartTaskCount = tasks?.filter((t: any) => t.isSmart).length || 0;
  const canAddSmartTask = currentSmartTaskCount < smartTaskLimit;

  const createMutationBase = trpc.task.create.useMutation();
  const createMutation = useOptimisticCreate(createMutationBase, {
    entityName: 'Task',
    // tRPC v11 format: [procedurePath, { input, type }]
    listKey: [['task', 'list'], { input: { routineId: routineId! }, type: 'query' }],
    createItem: (input, tempId) => ({
      id: tempId,
      name: input.name,
      description: input.description || null,
      type: input.type,
      unit: input.unit || null,
      targetValue: null,
      isSmart: input.isSmart || false,
      emoji: input.emoji || '😊',
      color: input.color || '#3B82F6',
      order: tasks?.length || 0,
      status: EntityStatus.ACTIVE,
      routineId: input.routineId,
      createdAt: new Date(),
      updatedAt: new Date(),
      completions: [],
    }),
    closeDialog: onClose,
    invalidateKeys: [
      [['person', 'getById'], { type: 'query' }],
    ],
  });

  const updateMutationBase = trpc.task.update.useMutation();
  const updateMutation = useOptimisticUpdate(updateMutationBase, {
    entityName: 'Task',
    // tRPC v11 format: [procedurePath, { input, type }]
    listKey: [['task', 'list'], { input: { routineId: task?.routineId! }, type: 'query' }],
    getId: (input) => input.id,
    updateItem: (item, input) => ({
      ...item,
      emoji: input.emoji ?? item.emoji,
      color: input.color ?? item.color,
      updatedAt: new Date(),
    }),
    closeDialog: onClose,
    invalidateKeys: [
      [['person', 'getById'], { type: 'query' }],
    ],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (task) {
      // When editing, allow changing emoji and color
      updateMutation.mutate({
        id: task.id,
        emoji,
        color,
      });
    } else if (routineId) {
      // When creating, all fields are available
      console.log('🚀 CREATE TASK TRIGGERED');
      console.log('  routineId:', routineId);
      console.log('  name:', name);
      console.log('  type:', type);

      const taskData = {
        name,
        description: '-', // Set to '-' to disable descriptions
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
          {/* Show name and type as read-only when editing, but allow description editing */}
          {task ? (
            <>
              {/* Icon and Name in same row - Editing mode */}
              <div>
                <Label>Task Name (cannot be changed)</Label>
                <div className="flex items-center gap-2 mt-1">
                  {/* Emoji Picker */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => togglePicker('emoji')}
                      className="h-10 w-10 rounded-md border border-gray-300 flex items-center justify-center text-xl hover:bg-gray-50 transition-colors"
                    >
                      <RenderIconEmoji value={emoji || '😊'} className="h-6 w-6" />
                    </button>
                    {isPickerOpen('emoji') && (
                      <div ref={pickerRef} className="absolute z-50 top-full mt-2 left-0">
                        <IconEmojiPicker
                          selectedValue={emoji || '😊'}
                          onSelect={setEmoji}
                          onClose={closePicker}
                        />
                      </div>
                    )}
                  </div>
                  {/* Task Name - Read Only */}
                  <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                    <p className="text-sm font-semibold text-gray-900">{name}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border">
                <div>
                  <Label className="text-xs text-gray-500">Task Type (cannot be changed)</Label>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {type === TaskType.SIMPLE && 'Simple'}
                    {type === TaskType.MULTIPLE_CHECKIN && 'Multiple Check-in'}
                    {type === TaskType.PROGRESS && 'Progress'}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Icon and Name in same row - Only when creating */}
              <div>
                <Label>Task Name *</Label>
                <div className="flex items-center gap-2 mt-1">
                  {/* Emoji Picker */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => togglePicker('emoji')}
                      className="h-10 w-10 rounded-md border border-gray-300 flex items-center justify-center text-xl hover:bg-gray-50 transition-colors"
                    >
                      <RenderIconEmoji value={emoji || '😊'} className="h-6 w-6" />
                    </button>
                    {isPickerOpen('emoji') && (
                      <div ref={pickerRef} className="absolute z-50 top-full mt-2 left-0">
                        <IconEmojiPicker
                          selectedValue={emoji || '😊'}
                          onSelect={setEmoji}
                          onClose={closePicker}
                        />
                      </div>
                    )}
                  </div>
                  {/* Task Name */}
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={30}
                    placeholder="Brush teeth"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{name.length}/30 characters</p>
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
                    disabled={!canAddSmartTask && !isSmart}
                    className="w-4 h-4 text-blue-500 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <Label htmlFor="isSmart" className={canAddSmartTask || isSmart ? "cursor-pointer" : "cursor-not-allowed opacity-50"}>
                    Make this a Smart Task
                  </Label>
                </div>
                {!canAddSmartTask && !isSmart && (
                  <p className="text-xs text-amber-600 mt-2">
                    Smart task limit reached ({currentSmartTaskCount}/{smartTaskLimit})
                  </p>
                )}
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
