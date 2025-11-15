'use client';

import { TaskType } from '@/lib/types/prisma-enums';
type Task = any;
import { useState, useEffect, useRef } from 'react';
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
import { HexColorPicker } from 'react-colorful';
import { PASTEL_COLORS } from '@/lib/utils/avatar';

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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Close pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
    };

    if (showEmojiPicker || showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker, showColorPicker]);

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
      emoji,
      color,
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
          {/* Emoji and Name Row */}
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-2 relative">
              <Label htmlFor="emoji">Icon</Label>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-full h-10 rounded-md border border-gray-300 flex items-center justify-center text-2xl hover:bg-gray-50 transition-colors"
              >
                <RenderIconEmoji value={emoji || '✅'} className="h-6 w-6" />
              </button>
              {showEmojiPicker && (
                <div ref={emojiPickerRef} className="absolute z-50 top-full mt-2 left-0">
                  <IconEmojiPicker
                    selectedValue={emoji || '✅'}
                    onSelect={setEmoji}
                    onClose={() => setShowEmojiPicker(false)}
                  />
                </div>
              )}
            </div>
            <div className="col-span-10">
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
          </div>

          {/* Description - Single Line */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              placeholder="Brush for at least 2 minutes..."
              className="mt-1"
            />
          </div>

          {/* Color Picker */}
          <div className="relative">
            <Label>Color</Label>
            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="mt-2 w-full h-10 rounded-md border border-gray-300 flex items-center gap-3 px-3 hover:bg-gray-50 transition-colors"
            >
              <div
                className="w-6 h-6 rounded-full border-2 border-gray-300"
                style={{ backgroundColor: color }}
              />
              <span className="text-sm text-gray-700">{color}</span>
            </button>
            {showColorPicker && (
              <div ref={colorPickerRef} className="absolute z-50 top-full mt-2 p-3 bg-white rounded-lg shadow-lg border">
                <HexColorPicker color={color} onChange={setColor} />
                <div className="mt-3 pt-3 border-t">
                  <Label className="text-xs mb-2 block">Quick Colors</Label>
                  <div className="grid grid-cols-6 gap-2">
                    {PASTEL_COLORS.map((presetColor) => (
                      <button
                        key={presetColor}
                        type="button"
                        onClick={() => {
                          setColor(presetColor);
                          setShowColorPicker(false);
                        }}
                        className="w-8 h-8 rounded-full border-2 border-gray-200 hover:scale-110 transition-transform"
                        style={{ backgroundColor: presetColor }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Task Type - Label and Select on Same Row */}
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

          {/* Smart Task Checkbox - No Subtitle */}
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
