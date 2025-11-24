'use client';

import { ResetPeriod, Visibility, EntityStatus } from '@/lib/types/prisma-enums';
type Routine = any;
import { useState, useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useQueryClient } from '@tanstack/react-query';
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
import { HexColorPicker } from 'react-colorful';
import { AVATAR_COLORS } from '@/lib/constants/theme';
import { ConditionForm } from '@/components/condition/condition-form';
import { GitBranch } from 'lucide-react';

interface RoutineFormProps {
  routine?: Routine;
  roleId?: string;
  personIds?: string[];
  onClose: () => void;
}

export function RoutineForm({ routine, roleId, personIds = [], onClose }: RoutineFormProps) {
  // Extract emoji from routine name if editing
  const extractEmoji = (text: string): { emoji: string; name: string } => {
    const emojiRegex = /^([\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}]+)\s*(.*)$/u;
    const match = text.match(emojiRegex);
    if (match) {
      return { emoji: match[1], name: match[2] };
    }
    return { emoji: '', name: text };
  };

  const initialData = routine?.name ? extractEmoji(routine.name) : { emoji: '', name: '' };

  const [name, setName] = useState(initialData.name || routine?.name || '');
  const [emoji, setEmoji] = useState(initialData.emoji);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [description, setDescription] = useState(routine?.description || '');
  const [resetPeriod, setResetPeriod] = useState<ResetPeriod>(
    routine?.resetPeriod || ResetPeriod.DAILY
  );
  const [resetDay, setResetDay] = useState<number | null>(routine?.resetDay || null);
  const [visibility, setVisibility] = useState<Visibility>(
    routine?.visibility || Visibility.ALWAYS
  );
  const [visibleDays, setVisibleDays] = useState<number[]>(routine?.visibleDays || []);
  const [daySelection, setDaySelection] = useState<'everyday' | 'specific'>(
    routine?.visibleDays && routine.visibleDays.length > 0 && routine.visibleDays.length < 7 ? 'specific' : 'everyday'
  );
  const [timeSelection, setTimeSelection] = useState<'allday' | 'limited'>(
    routine?.startTime && routine?.endTime ? 'limited' : 'allday'
  );
  const [startTime, setStartTime] = useState<string>(routine?.startTime || '08:00');
  const [endTime, setEndTime] = useState<string>(routine?.endTime || '17:00');
  const [color, setColor] = useState<string>(routine?.color || '#3B82F6');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isSmart, setIsSmart] = useState(routine?.type === 'SMART' || false);
  const [showConditionsModal, setShowConditionsModal] = useState(false);

  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const queryClient = useQueryClient();

  // Reset visibility if it's invalid for Daily period
  useEffect(() => {
    if (resetPeriod === ResetPeriod.DAILY && visibility === Visibility.DATE_RANGE) {
      setVisibility(Visibility.ALWAYS);
    }
  }, [resetPeriod, visibility]);

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

  // Generate time options in 5-minute increments
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 5) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push(timeString);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  const createMutationBase = trpc.routine.create.useMutation();
  const createMutation = useOptimisticCreate(createMutationBase, {
    entityName: 'Routine',
    listKey: ['routine', 'list', { roleId: roleId! }],
    createItem: (input, tempId) => ({
      id: tempId,
      name: input.name,
      description: input.description || null,
      type: input.type || 'REGULAR',
      resetPeriod: input.resetPeriod,
      resetDay: input.resetDay || null,
      visibility: input.visibility,
      visibleDays: input.visibleDays || [],
      startTime: input.startTime || null,
      endTime: input.endTime || null,
      color: input.color || '#3B82F6',
      status: EntityStatus.ACTIVE,
      roleId: input.roleId,
      isTeacherOnly: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      archivedAt: null,
      kioskLastUpdatedAt: new Date(),
      tasks: [],
      assignments: [],
      conditions: [],
    }),
    closeDialog: onClose,
    invalidateKeys: [
      ['person', 'getById'],
    ],
  });

  const updateMutationBase = trpc.routine.update.useMutation();
  const updateMutation = useOptimisticUpdate(updateMutationBase, {
    entityName: 'Routine',
    listKey: ['routine', 'list', { roleId: routine?.roleId! }],
    itemKey: routine?.id ? ['routine', 'getById', { id: routine.id }] : undefined,
    getId: (input) => input.id,
    updateItem: (item, input) => ({
      ...item,
      name: input.name ?? item.name,
      description: input.description ?? item.description,
      type: input.type ?? item.type,
      resetPeriod: input.resetPeriod ?? item.resetPeriod,
      resetDay: input.resetDay ?? item.resetDay,
      visibility: input.visibility ?? item.visibility,
      visibleDays: input.visibleDays ?? item.visibleDays,
      startTime: input.startTime ?? item.startTime,
      endTime: input.endTime ?? item.endTime,
      color: input.color ?? item.color,
      updatedAt: new Date(),
    }),
    closeDialog: onClose,
    invalidateKeys: [
      ['person', 'getById'],
    ],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalName = emoji ? `${emoji} ${name}` : name;

    // Calculate visibleDays based on selection
    let finalVisibleDays: number[] = [];
    if (resetPeriod === ResetPeriod.WEEKLY) {
      if (daySelection === 'specific') {
        finalVisibleDays = visibleDays;
        if (finalVisibleDays.length === 0) {
          toast({
            title: 'Day Selection Required',
            description: 'Please select at least one day of the week.',
            variant: 'destructive',
          });
          return;
        }
      } else {
        // everyday = all 7 days
        finalVisibleDays = [0, 1, 2, 3, 4, 5, 6];
      }
    }

    // Determine if time restriction should be included
    const shouldIncludeTime = timeSelection === 'limited';

    // Validate time fields
    if (shouldIncludeTime && startTime && endTime) {
      if (startTime >= endTime) {
        toast({
          title: 'Invalid Time Range',
          description: 'End time must be later than start time.',
          variant: 'destructive',
        });
        return;
      }
    }

    if (routine) {
      updateMutation.mutate({
        id: routine.id,
        name: finalName || undefined,
        description: description || null,
        type: isSmart ? 'SMART' : 'REGULAR',
        resetPeriod,
        resetDay,
        visibility,
        visibleDays: finalVisibleDays,
        startTime: shouldIncludeTime ? startTime : null,
        endTime: shouldIncludeTime ? endTime : null,
        color: color || null,
      });
    } else if (roleId) {
      createMutation.mutate({
        roleId,
        name: finalName,
        description: description || undefined,
        type: isSmart ? 'SMART' : 'REGULAR',
        resetPeriod,
        resetDay,
        visibility,
        visibleDays: finalVisibleDays,
        personIds,
        startTime: shouldIncludeTime ? startTime : null,
        endTime: shouldIncludeTime ? endTime : null,
        color: color || null,
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{routine ? 'Edit Routine' : 'Create New Routine'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-2 relative">
              <Label htmlFor="emoji">Icon</Label>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-full h-10 rounded-md border border-gray-300 flex items-center justify-center text-2xl hover:bg-gray-50 transition-colors"
              >
                <RenderIconEmoji value={emoji || '😊'} className="h-6 w-6" />
              </button>
              {showEmojiPicker && (
                <div ref={emojiPickerRef} className="absolute z-50 top-full mt-2 left-0">
                  <IconEmojiPicker
                    selectedValue={emoji || '😊'}
                    onSelect={setEmoji}
                    onClose={() => setShowEmojiPicker(false)}
                  />
                </div>
              )}
            </div>
            <div className="col-span-10">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                placeholder="Morning Routine"
                disabled={routine?.name?.includes('Daily Routine')}
              />
              {routine?.name?.includes('Daily Routine') && (
                <p className="text-xs text-gray-500 mt-1">
                  The Daily Routine name cannot be changed
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              placeholder="Get ready for school..."
            />
          </div>

          {/* Color Picker */}
          <div className="relative">
            <Label>Border Color</Label>
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
              <div ref={colorPickerRef} className="absolute z-50 top-full mt-2 p-3 bg-white rounded-lg shadow-lg border max-h-[500px] overflow-y-auto">
                <HexColorPicker color={color} onChange={setColor} />
                <div className="mt-3 pt-3 border-t space-y-1">
                  {AVATAR_COLORS.GROUPS.map((group) => (
                    <div key={group.label} className="grid grid-cols-9 gap-0.5">
                      {group.colors.map((presetColor) => (
                        <button
                          key={presetColor}
                          type="button"
                          onClick={() => {
                            setColor(presetColor);
                            setShowColorPicker(false);
                          }}
                          className="w-7 h-7 rounded-md border-2 hover:scale-110 transition-transform"
                          style={{
                            backgroundColor: presetColor,
                            borderColor: color === presetColor ? '#000' : '#e5e7eb'
                          }}
                          title={presetColor}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Period Selection - Inline with Reset Day for WEEKLY */}
          <div className="flex items-center gap-3">
            <Label htmlFor="resetPeriod" className="whitespace-nowrap">Period:</Label>
            <select
              id="resetPeriod"
              value={resetPeriod}
              onChange={(e) => setResetPeriod(e.target.value as ResetPeriod)}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2"
            >
              <option value={ResetPeriod.DAILY}>Daily</option>
              <option value={ResetPeriod.WEEKLY}>Weekly</option>
            </select>
            {resetPeriod === ResetPeriod.WEEKLY && (
              <>
                <Label htmlFor="resetDay" className="whitespace-nowrap">Resets on:</Label>
                <select
                  id="resetDay"
                  value={resetDay || 0}
                  onChange={(e) => setResetDay(parseInt(e.target.value))}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value={0}>Sunday</option>
                  <option value={1}>Monday</option>
                  <option value={2}>Tuesday</option>
                  <option value={3}>Wednesday</option>
                  <option value={4}>Thursday</option>
                  <option value={5}>Friday</option>
                  <option value={6}>Saturday</option>
                </select>
              </>
            )}
          </div>

          {/* Visibility Options for WEEKLY Period */}
          {resetPeriod === ResetPeriod.WEEKLY && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
              <div className="text-sm font-medium text-gray-900">Visibility</div>

              {/* Day Selection */}
              <div>
                <Label className="text-xs mb-2 block">Which days?</Label>
                <div className="flex gap-3 mb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="daySelection"
                      value="everyday"
                      checked={daySelection === 'everyday'}
                      onChange={() => setDaySelection('everyday')}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Every day</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="daySelection"
                      value="specific"
                      checked={daySelection === 'specific'}
                      onChange={() => setDaySelection('specific')}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Specific days</span>
                  </label>
                </div>

                {daySelection === 'specific' && (
                  <div className="grid grid-cols-7 gap-2 mt-2">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, index) => (
                      <label
                        key={index}
                        className={`flex items-center justify-center h-10 rounded-md border-2 cursor-pointer transition-colors ${
                          visibleDays.includes(index)
                            ? 'bg-blue-100 border-blue-500 text-blue-900'
                            : 'border-gray-300 text-gray-700 hover:border-blue-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={visibleDays.includes(index)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setVisibleDays([...visibleDays, index].sort());
                            } else {
                              setVisibleDays(visibleDays.filter((d) => d !== index));
                            }
                          }}
                          className="sr-only"
                        />
                        <span className="text-sm font-medium">{day}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Time Selection */}
              <div className="pt-3 border-t">
                <Label className="text-xs mb-2 block">What time?</Label>
                <div className="flex gap-3 mb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="timeSelection"
                      value="allday"
                      checked={timeSelection === 'allday'}
                      onChange={() => setTimeSelection('allday')}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">All day</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="timeSelection"
                      value="limited"
                      checked={timeSelection === 'limited'}
                      onChange={() => setTimeSelection('limited')}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Limited time</span>
                  </label>
                </div>

                {timeSelection === 'limited' && (
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <Label htmlFor="startTime" className="text-xs">Start</Label>
                      <select
                        id="startTime"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      >
                        {timeOptions.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="endTime" className="text-xs">End</Label>
                      <select
                        id="endTime"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      >
                        {timeOptions.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Time Selection for DAILY Period */}
          {resetPeriod === ResetPeriod.DAILY && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
              <Label className="text-xs mb-2 block">What time?</Label>
              <div className="flex gap-3 mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="timeSelection"
                    value="allday"
                    checked={timeSelection === 'allday'}
                    onChange={() => setTimeSelection('allday')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">All day</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="timeSelection"
                    value="limited"
                    checked={timeSelection === 'limited'}
                    onChange={() => setTimeSelection('limited')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Limited time</span>
                </label>
              </div>

              {timeSelection === 'limited' && (
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <Label htmlFor="startTime" className="text-xs">Start</Label>
                    <select
                      id="startTime"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="endTime" className="text-xs">End</Label>
                    <select
                      id="endTime"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Smart Routine Checkbox */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isSmart"
                checked={isSmart}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsSmart(checked);
                  if (checked) {
                    setShowConditionsModal(true);
                  }
                }}
                className="w-4 h-4 text-blue-500 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <Label htmlFor="isSmart" className="cursor-pointer">
                Make this a Smart Routine
              </Label>
            </div>

            {isSmart && (
              <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-800 mb-2">
                  <strong>Smart Routine</strong>
                </p>
                <p className="text-xs text-purple-700 mb-3">
                  This routine will be visible based on specific conditions. Set conditions to control when it appears.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-purple-700 border-purple-300 hover:bg-purple-100"
                  onClick={() => {
                    setShowConditionsModal(true);
                  }}
                >
                  {routine?.type === 'SMART' ? 'Edit Conditions' : 'Set Conditions'}
                </Button>
              </div>
            )}

            {/* Conditions Modal */}
            {showConditionsModal && routine?.id && (
              <ConditionForm
                routineId={routine.id}
                onClose={() => setShowConditionsModal(false)}
              />
            )}

            {/* Show message if creating new routine with conditions */}
            {showConditionsModal && !routine?.id && (
              <Dialog open onOpenChange={() => setShowConditionsModal(false)}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <GitBranch className="h-5 w-5" />
                      Conditions
                    </DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="text-sm text-gray-600">
                      Conditions can be added after creating the routine. Save the routine first, then edit it to add conditions.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setShowConditionsModal(false)}
                    variant="outline"
                    className="w-full"
                  >
                    Got it
                  </Button>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : routine ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
