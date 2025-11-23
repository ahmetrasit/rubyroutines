'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import { Loader2 } from 'lucide-react';
import { ResetPeriod, GoalType } from '@/lib/types/prisma-enums';
import { IconEmojiPicker, RenderIconEmoji } from '@/components/ui/icon-emoji-picker';
import { HexColorPicker } from 'react-colorful';
import { AVATAR_COLORS } from '@/lib/constants/theme';

interface GoalFormProps {
  roleId: string;
  goal?: any;
  personId?: string;
  onClose: () => void;
}

export function GoalForm({ roleId, goal, personId, onClose }: GoalFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<GoalType>(GoalType.COMPLETION_COUNT);
  const [target, setTarget] = useState('');
  const [period, setPeriod] = useState<ResetPeriod>(ResetPeriod.WEEKLY);
  const [resetDay, setResetDay] = useState<number | undefined>();
  const [icon, setIcon] = useState<string>('🎯');
  const [color, setColor] = useState<string>(AVATAR_COLORS.DEFAULT);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Goal type selection
  const [goalType, setGoalType] = useState<'simple' | 'complex'>('simple');

  // Simple goal fields
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [simpleCondition, setSimpleCondition] = useState<'complete' | 'not_complete'>('complete');
  const [comparisonOperator, setComparisonOperator] = useState<'lte' | 'gte'>('gte');
  const [targetValue, setTargetValue] = useState<string>('');

  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  // Fetch routines to get tasks for linking
  const { data: routines, isLoading: routinesLoading } = trpc.routine.list.useQuery(
    { roleId, personId, includeTasks: true },
    { enabled: !!roleId }
  );

  // Extract all tasks from routines
  const availableTasks = routines?.flatMap(routine =>
    routine.tasks?.map((task: any) => ({
      ...task,
      routineName: routine.name
    })) || []
  ) || [];

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

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // First useEffect: Set basic goal data immediately when goal changes
  useEffect(() => {
    if (goal) {
      setName(goal.name || '');
      setDescription(goal.description || '');
      setType(goal.type || GoalType.COMPLETION_COUNT);
      setTarget(goal.target?.toString() || '');
      setPeriod(goal.period || ResetPeriod.WEEKLY);
      setResetDay(goal.resetDay);
      if (goal.icon) setIcon(goal.icon);
      if (goal.color) setColor(goal.color);

      // Handle simple goal configuration
      if (goal.simpleCondition !== undefined) {
        setGoalType('simple');
        setSimpleCondition(goal.simpleCondition);
      }
      if (goal.comparisonOperator !== undefined) {
        setComparisonOperator(goal.comparisonOperator);
      }

      // Set comparison value immediately if available (don't wait for tasks to load)
      if (goal.comparisonValue !== undefined) {
        setTargetValue(goal.comparisonValue.toString());
      }

      // Handle task links
      if (goal.taskLinks && goal.taskLinks.length > 0) {
        if (goal.taskLinks.length === 1 && (goal.simpleCondition !== undefined || goal.comparisonOperator !== undefined)) {
          // Simple goal with single task
          setGoalType('simple');
          setSelectedTaskId(goal.taskLinks[0].taskId);
        } else {
          // Complex goal with multiple tasks
          setGoalType('complex');
          setSelectedTaskIds(goal.taskLinks.map((link: any) => link.taskId));
        }
      }
    }
  }, [goal]);

  const createMutation = trpc.goal.create.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Goal created successfully',
        variant: 'success',
      });
      utils.goal.list.invalidate();
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

  const updateMutation = trpc.goal.update.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Goal updated successfully',
        variant: 'success',
      });
      utils.goal.list.invalidate();
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

  // Fetch existing goals for duplicate name check
  const { data: existingGoals } = trpc.goal.list.useQuery(
    { roleId },
    { enabled: !!roleId }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a goal name',
        variant: 'destructive',
      });
      return;
    }

    // Check for duplicate names
    const duplicateGoal = existingGoals?.find(
      (g) => g.name === name.trim() && (!goal || g.id !== goal.id)
    );
    if (duplicateGoal) {
      toast({
        title: 'Error',
        description: 'A goal with this name already exists',
        variant: 'destructive',
      });
      return;
    }

    // For simple goals
    if (goalType === 'simple') {
      // Must have a task selected
      if (!selectedTaskId) {
        toast({
          title: 'Error',
          description: 'Please select a task for this goal',
          variant: 'destructive',
        });
        return;
      }

      // Find the selected task to check its type
      const selectedTask = availableTasks.find((t: any) => t.id === selectedTaskId);

      // For SIMPLE tasks, we don't need a comparison value
      // For MULTIPLE_CHECKIN or PROGRESS tasks, we need a comparison value (not a target for the goal)
      if (selectedTask && selectedTask.type !== 'SIMPLE') {
        if (!targetValue || parseFloat(targetValue) <= 0) {
          toast({
            title: 'Error',
            description: 'Please enter a valid comparison value',
            variant: 'destructive',
          });
          return;
        }
      }
    } else {
      // For complex goals, always need a target value
      if (!target || parseFloat(target) <= 0) {
        toast({
          title: 'Error',
          description: 'Please enter a valid target value',
          variant: 'destructive',
        });
        return;
      }

      // Complex goals need at least one task
      if (selectedTaskIds.length === 0) {
        toast({
          title: 'Error',
          description: 'Please select at least one task for this goal',
          variant: 'destructive',
        });
        return;
      }
    }

    if (!roleId) {
      toast({
        title: 'Error',
        description: 'No role found',
        variant: 'destructive',
      });
      return;
    }

    // Build the data object based on goal type
    let data: any = {
      name: name.trim(),
      roleId,
      description: description.trim() || undefined,
      icon,
      color,
      personIds: personId ? [personId] : [],
    };

    if (goalType === 'simple') {
      const selectedTask = availableTasks.find((t: any) => t.id === selectedTaskId);

      // For simple goals, we use different data structure
      data.taskIds = [selectedTaskId];

      if (selectedTask && selectedTask.type === 'SIMPLE') {
        // For SIMPLE tasks with simple condition
        // IMPORTANT: Target must always be positive (backend validation requirement)
        // The simpleCondition field determines the actual logic:
        // - "complete": Goal is met when task IS completed
        // - "not_complete": Goal is met when task IS NOT completed
        // The target value is just a placeholder to pass validation
        data.type = GoalType.COMPLETION_COUNT;
        data.target = 1; // Always use positive value to pass backend validation
        data.period = period; // Use user-selected period
        data.resetDay = resetDay; // Include reset day if applicable
        data.simpleCondition = simpleCondition; // Backend uses this to determine the actual logic
      } else {
        // For MULTIPLE_CHECKIN or PROGRESS tasks
        // The goal is binary (met or not met) based on comparison
        // Store the comparison value as metadata, not as the goal's target
        data.type = GoalType.VALUE_BASED;
        data.target = 1; // Goal is binary: 1 when condition is met, 0 when not
        data.period = period; // Use user-selected period
        data.resetDay = resetDay; // Include reset day if applicable
        data.comparisonOperator = comparisonOperator; // Store the comparison operator (gte/lte)
        data.comparisonValue = parseFloat(targetValue); // Store the value to compare against
      }
    } else {
      // Complex goal data
      data.type = type;
      data.target = parseFloat(target);
      data.period = period;
      data.resetDay = resetDay;
      data.taskIds = selectedTaskIds;
    }

    if (goal) {
      updateMutation.mutate({ id: goal.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{goal ? 'Edit Goal' : 'Create Goal'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Icon, Color, and Name - First row */}
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-2 relative">
                <Label htmlFor="emoji">Icon</Label>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="w-full h-10 rounded-md border border-gray-300 flex items-center justify-center text-2xl hover:bg-gray-50 transition-colors"
                  disabled={isPending}
                >
                  <RenderIconEmoji value={icon || '🎯'} className="h-6 w-6" />
                </button>
                {showEmojiPicker && (
                  <div ref={emojiPickerRef} className="absolute z-50 top-full mt-2 left-0">
                    <IconEmojiPicker
                      selectedValue={icon || '🎯'}
                      onSelect={setIcon}
                      onClose={() => setShowEmojiPicker(false)}
                    />
                  </div>
                )}
              </div>
              <div className="col-span-2 relative">
                <Label>Color</Label>
                <button
                  type="button"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="w-full h-10 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  disabled={isPending}
                >
                  <div
                    className="w-6 h-6 rounded-full border-2 border-gray-300"
                    style={{ backgroundColor: color }}
                  />
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
              <div className="col-span-8">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={100}
                  placeholder="Complete 50 tasks this week"
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Optional description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isPending}
              />
            </div>

            {/* Row 3: Goal Type Selection */}
            <div className="space-y-2">
              <Label>Goal Configuration *</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setGoalType('simple')}
                  className={`flex-1 py-2 px-4 rounded-md border-2 font-medium transition-colors ${
                    goalType === 'simple'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                  disabled={isPending}
                >
                  Simple Goal
                </button>
                <button
                  type="button"
                  onClick={() => setGoalType('complex')}
                  className={`flex-1 py-2 px-4 rounded-md border-2 font-medium transition-colors ${
                    goalType === 'complex'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                  disabled={isPending}
                >
                  Complex Goal
                </button>
              </div>
            </div>

            {/* Row 4: Simple Goal Configuration */}
            {goalType === 'simple' && (
              <div className="space-y-3 border-t pt-4">
                {/* Period Selection for Simple Goals */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="simple-period">Period *</Label>
                    <Select
                      value={period}
                      onValueChange={(value) => setPeriod(value as ResetPeriod)}
                    >
                      <SelectTrigger disabled={isPending}>
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ResetPeriod.DAILY}>Daily</SelectItem>
                        <SelectItem value={ResetPeriod.WEEKLY}>Weekly</SelectItem>
                        <SelectItem value={ResetPeriod.MONTHLY}>Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Reset Day for Weekly Period */}
                  {period === ResetPeriod.WEEKLY && (
                    <div className="space-y-2">
                      <Label htmlFor="resetDay">Reset Day</Label>
                      <Select
                        value={resetDay?.toString() || '0'}
                        onValueChange={(value) => setResetDay(parseInt(value))}
                      >
                        <SelectTrigger disabled={isPending}>
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Sunday</SelectItem>
                          <SelectItem value="1">Monday</SelectItem>
                          <SelectItem value="2">Tuesday</SelectItem>
                          <SelectItem value="3">Wednesday</SelectItem>
                          <SelectItem value="4">Thursday</SelectItem>
                          <SelectItem value="5">Friday</SelectItem>
                          <SelectItem value="6">Saturday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Reset Day for Monthly Period */}
                  {period === ResetPeriod.MONTHLY && (
                    <div className="space-y-2">
                      <Label htmlFor="resetDay">Reset Day of Month</Label>
                      <Input
                        id="resetDay"
                        type="number"
                        min="1"
                        max="31"
                        placeholder="1-31"
                        value={resetDay?.toString() || '1'}
                        onChange={(e) => setResetDay(parseInt(e.target.value))}
                        disabled={isPending}
                      />
                    </div>
                  )}
                </div>

                {/* Task Selection and Condition/Operator/Value - All on same row */}
                {selectedTaskId && (() => {
                  const selectedTask = availableTasks.find((t: any) => t.id === selectedTaskId);
                  if (!selectedTask) return null;

                  if (selectedTask.type === 'SIMPLE') {
                    // SIMPLE task: Task selection | Condition (2 columns)
                    return (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="task">Select Task *</Label>
                          <Select
                            value={selectedTaskId}
                            onValueChange={(value) => {
                              setSelectedTaskId(value);
                              // Clear target value when switching tasks
                              // This ensures we don't carry over values between different task types
                              const newTask = availableTasks.find((t: any) => t.id === value);
                              if (newTask) {
                                if (newTask.type === 'SIMPLE') {
                                  setTargetValue(''); // Clear target value for SIMPLE tasks
                                  // Set intelligent default period for SIMPLE tasks
                                  if (!goal) setPeriod(ResetPeriod.DAILY);
                                } else {
                                  // Set intelligent default period for MULTI/PROGRESS tasks
                                  if (!goal) setPeriod(ResetPeriod.WEEKLY);
                                }
                              }
                            }}
                          >
                            <SelectTrigger disabled={isPending}>
                              {selectedTaskId ? (
                                selectedTask ? (
                                  <div className="flex flex-col items-start flex-1 text-left">
                                    <div className="flex items-center gap-2">
                                      {selectedTask.icon && <RenderIconEmoji value={selectedTask.icon} className="h-4 w-4" />}
                                      <span className="text-sm">{selectedTask.name}</span>
                                      <span
                                        className="px-1.5 py-0.5 text-[10px] font-medium rounded uppercase"
                                        style={{
                                          backgroundColor:
                                            selectedTask.type === 'SIMPLE' ? '#E0F2FE' :
                                            selectedTask.type === 'MULTIPLE_CHECKIN' ? '#FCE7F3' :
                                            '#FEF3C7',
                                          color:
                                            selectedTask.type === 'SIMPLE' ? '#0369A1' :
                                            selectedTask.type === 'MULTIPLE_CHECKIN' ? '#BE185D' :
                                            '#B45309'
                                        }}
                                      >
                                        {selectedTask.type === 'SIMPLE' ? 'Simple' :
                                         selectedTask.type === 'MULTIPLE_CHECKIN' ? 'Multi' :
                                         'Progress'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-gray-500 ml-6">
                                      <span>📋</span>
                                      <span>{selectedTask.routineName}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-500">Loading task...</span>
                                )
                              ) : (
                                <span className="text-sm text-gray-500">Choose a task</span>
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              {availableTasks.map((task: any) => (
                                <SelectItem key={task.id} value={task.id}>
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                      {task.icon && <RenderIconEmoji value={task.icon} className="h-4 w-4" />}
                                      <span>{task.name}</span>
                                      <span
                                        className="px-1.5 py-0.5 text-[10px] font-medium rounded uppercase"
                                        style={{
                                          backgroundColor:
                                            task.type === 'SIMPLE' ? '#E0F2FE' :
                                            task.type === 'MULTIPLE_CHECKIN' ? '#FCE7F3' :
                                            '#FEF3C7',
                                          color:
                                            task.type === 'SIMPLE' ? '#0369A1' :
                                            task.type === 'MULTIPLE_CHECKIN' ? '#BE185D' :
                                            '#B45309'
                                        }}
                                      >
                                        {task.type === 'SIMPLE' ? 'Simple' :
                                         task.type === 'MULTIPLE_CHECKIN' ? 'Multi' :
                                         'Progress'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-gray-500 ml-6">
                                      <span>📋</span>
                                      <span>{task.routineName}</span>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="condition">Condition *</Label>
                          <Select
                            value={simpleCondition}
                            onValueChange={(value: 'complete' | 'not_complete') => setSimpleCondition(value)}
                          >
                            <SelectTrigger disabled={isPending}>
                              <span className="text-sm">
                                {simpleCondition === 'complete' ? 'is complete' :
                                 simpleCondition === 'not_complete' ? 'is not complete' :
                                 'Select condition'}
                              </span>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="complete">is complete</SelectItem>
                              <SelectItem value="not_complete">is not complete</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    );
                  } else {
                    // MULTIPLE_CHECKIN or PROGRESS: Task selection | Operator | Value (3 columns)
                    return (
                      <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-6 space-y-2">
                          <Label htmlFor="task">Select Task *</Label>
                          <Select
                            value={selectedTaskId}
                            onValueChange={(value) => {
                              setSelectedTaskId(value);
                              // Clear target value when switching tasks
                              // This ensures we don't carry over values between different task types
                              const newTask = availableTasks.find((t: any) => t.id === value);
                              if (newTask) {
                                if (newTask.type === 'SIMPLE') {
                                  setTargetValue(''); // Clear target value for SIMPLE tasks
                                  // Set intelligent default period for SIMPLE tasks
                                  if (!goal) setPeriod(ResetPeriod.DAILY);
                                } else {
                                  // Set intelligent default period for MULTI/PROGRESS tasks
                                  if (!goal) setPeriod(ResetPeriod.WEEKLY);
                                }
                              }
                            }}
                          >
                            <SelectTrigger disabled={isPending}>
                              {selectedTaskId ? (
                                selectedTask ? (
                                  <div className="flex flex-col items-start flex-1 text-left">
                                    <div className="flex items-center gap-2">
                                      {selectedTask.icon && <RenderIconEmoji value={selectedTask.icon} className="h-4 w-4" />}
                                      <span className="text-sm">{selectedTask.name}</span>
                                      <span
                                        className="px-1.5 py-0.5 text-[10px] font-medium rounded uppercase"
                                        style={{
                                          backgroundColor:
                                            selectedTask.type === 'SIMPLE' ? '#E0F2FE' :
                                            selectedTask.type === 'MULTIPLE_CHECKIN' ? '#FCE7F3' :
                                            '#FEF3C7',
                                          color:
                                            selectedTask.type === 'SIMPLE' ? '#0369A1' :
                                            selectedTask.type === 'MULTIPLE_CHECKIN' ? '#BE185D' :
                                            '#B45309'
                                        }}
                                      >
                                        {selectedTask.type === 'SIMPLE' ? 'Simple' :
                                         selectedTask.type === 'MULTIPLE_CHECKIN' ? 'Multi' :
                                         'Progress'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-gray-500 ml-6">
                                      <span>📋</span>
                                      <span>{selectedTask.routineName}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-500">Loading task...</span>
                                )
                              ) : (
                                <span className="text-sm text-gray-500">Choose a task</span>
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              {availableTasks.map((task: any) => (
                                <SelectItem key={task.id} value={task.id}>
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                      {task.icon && <RenderIconEmoji value={task.icon} className="h-4 w-4" />}
                                      <span>{task.name}</span>
                                      <span
                                        className="px-1.5 py-0.5 text-[10px] font-medium rounded uppercase"
                                        style={{
                                          backgroundColor:
                                            task.type === 'SIMPLE' ? '#E0F2FE' :
                                            task.type === 'MULTIPLE_CHECKIN' ? '#FCE7F3' :
                                            '#FEF3C7',
                                          color:
                                            task.type === 'SIMPLE' ? '#0369A1' :
                                            task.type === 'MULTIPLE_CHECKIN' ? '#BE185D' :
                                            '#B45309'
                                        }}
                                      >
                                        {task.type === 'SIMPLE' ? 'Simple' :
                                         task.type === 'MULTIPLE_CHECKIN' ? 'Multi' :
                                         'Progress'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-gray-500 ml-6">
                                      <span>📋</span>
                                      <span>{task.routineName}</span>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-3 space-y-2">
                          <Label htmlFor="operator">Operator *</Label>
                          <Select
                            value={comparisonOperator}
                            onValueChange={(value: 'lte' | 'gte') => setComparisonOperator(value)}
                          >
                            <SelectTrigger disabled={isPending}>
                              <span className="text-sm font-mono">
                                {comparisonOperator === 'gte' ? '≥' :
                                 comparisonOperator === 'lte' ? '≤' :
                                 'Select operator'}
                              </span>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="gte">≥</SelectItem>
                              <SelectItem value="lte">≤</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-3 space-y-2">
                          <Label htmlFor="value">Value *</Label>
                          <Input
                            id="value"
                            type="number"
                            min="0"
                            max="99"
                            value={targetValue}
                            onChange={(e) => setTargetValue(e.target.value)}
                            placeholder="0-99"
                            disabled={isPending}
                          />
                        </div>
                      </div>
                    );
                  }
                })()}

                {/* Initial task selection when no task is selected */}
                {!selectedTaskId && (
                  <div className="space-y-2">
                    <Label htmlFor="task">Select Task *</Label>
                    {routinesLoading ? (
                      <div className="flex items-center justify-center py-8 text-sm text-gray-500">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading tasks...
                      </div>
                    ) : availableTasks.length === 0 ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <p className="text-sm text-gray-500 mb-2">No tasks available</p>
                        <p className="text-xs text-gray-400">Create a routine with tasks first</p>
                      </div>
                    ) : (
                      <Select
                        value={selectedTaskId}
                        onValueChange={(value) => {
                          setSelectedTaskId(value);
                          // Clear target value when switching tasks
                          // This ensures we don't carry over values between different task types
                          const newTask = availableTasks.find((t: any) => t.id === value);
                          if (newTask) {
                            if (newTask.type === 'SIMPLE') {
                              setTargetValue(''); // Clear target value for SIMPLE tasks
                              // Set intelligent default period for SIMPLE tasks
                              if (!goal) setPeriod(ResetPeriod.DAILY);
                            } else {
                              // Set intelligent default period for MULTI/PROGRESS tasks
                              if (!goal) setPeriod(ResetPeriod.WEEKLY);
                            }
                          }
                        }}
                      >
                        <SelectTrigger disabled={isPending}>
                          <SelectValue placeholder="Choose a task" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTasks.map((task: any) => (
                            <SelectItem key={task.id} value={task.id}>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  {task.icon && <RenderIconEmoji value={task.icon} className="h-4 w-4" />}
                                  <span>{task.name}</span>
                                  <span
                                    className="px-1.5 py-0.5 text-[10px] font-medium rounded uppercase"
                                    style={{
                                      backgroundColor:
                                        task.type === 'SIMPLE' ? '#E0F2FE' :
                                        task.type === 'MULTIPLE_CHECKIN' ? '#FCE7F3' :
                                        '#FEF3C7',
                                      color:
                                        task.type === 'SIMPLE' ? '#0369A1' :
                                        task.type === 'MULTIPLE_CHECKIN' ? '#BE185D' :
                                        '#B45309'
                                    }}
                                  >
                                    {task.type === 'SIMPLE' ? 'Simple' :
                                     task.type === 'MULTIPLE_CHECKIN' ? 'Multi' :
                                     'Progress'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-gray-500 ml-6">
                                  <span>📋</span>
                                  <span>{task.routineName}</span>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Complex Goal Configuration */}
            {goalType === 'complex' && (
              <>
                <div className="space-y-2 border-t pt-4">
                  <Label htmlFor="type">Goal Type *</Label>
                  <Select
                    value={type}
                    onValueChange={(value) => setType(value as GoalType)}
                  >
                    <SelectTrigger disabled={isPending}>
                      <SelectValue placeholder="Select goal type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={GoalType.COMPLETION_COUNT}>Completion Count</SelectItem>
                      <SelectItem value={GoalType.STREAK}>Streak</SelectItem>
                      <SelectItem value={GoalType.TIME_BASED}>Time-based</SelectItem>
                      <SelectItem value={GoalType.VALUE_BASED}>Value-based</SelectItem>
                      <SelectItem value={GoalType.PERCENTAGE}>Percentage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="target">
                      Target Value *
                    </Label>
                    <Input
                      id="target"
                      type="number"
                      min="1"
                      step={type === GoalType.PERCENTAGE ? "0.1" : "1"}
                      placeholder={
                        type === GoalType.COMPLETION_COUNT ? "e.g., 50 completions" :
                        type === GoalType.PERCENTAGE ? "e.g., 80 for 80%" :
                        type === GoalType.TIME_BASED ? "e.g., 120 for 2 hours" :
                        type === GoalType.STREAK ? "e.g., 7 days" :
                        "e.g., 100"
                      }
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      disabled={isPending}
                    />
                    <p className="text-xs text-muted-foreground">
                      {type === GoalType.COMPLETION_COUNT && "Number of times to complete"}
                      {type === GoalType.PERCENTAGE && "Target percentage to achieve (0-100)"}
                      {type === GoalType.TIME_BASED && "Minutes to spend"}
                      {type === GoalType.STREAK && "Consecutive days to maintain"}
                      {type === GoalType.VALUE_BASED && "Target value to reach"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="period">Period *</Label>
                    <Select
                      value={period}
                      onValueChange={(value) => setPeriod(value as ResetPeriod)}
                    >
                      <SelectTrigger disabled={isPending}>
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ResetPeriod.DAILY}>Daily</SelectItem>
                        <SelectItem value={ResetPeriod.WEEKLY}>Weekly</SelectItem>
                        <SelectItem value={ResetPeriod.MONTHLY}>Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {period === ResetPeriod.WEEKLY && (
                  <div className="space-y-2">
                    <Label htmlFor="resetDay">Reset Day</Label>
                    <Select
                      value={resetDay?.toString() || '0'}
                      onValueChange={(value) => setResetDay(parseInt(value))}
                    >
                      <SelectTrigger disabled={isPending}>
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Sunday</SelectItem>
                        <SelectItem value="1">Monday</SelectItem>
                        <SelectItem value="2">Tuesday</SelectItem>
                        <SelectItem value="3">Wednesday</SelectItem>
                        <SelectItem value="4">Thursday</SelectItem>
                        <SelectItem value="5">Friday</SelectItem>
                        <SelectItem value="6">Saturday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {period === ResetPeriod.MONTHLY && (
                  <div className="space-y-2">
                    <Label htmlFor="resetDay">Reset Day of Month</Label>
                    <Input
                      id="resetDay"
                      type="number"
                      min="1"
                      max="31"
                      placeholder="1-31"
                      value={resetDay?.toString() || '1'}
                      onChange={(e) => setResetDay(parseInt(e.target.value))}
                      disabled={isPending}
                    />
                  </div>
                )}

                {/* Linked Tasks */}
                {availableTasks.length > 0 && (
                  <div className="space-y-2 border-t pt-4">
                    <Label>Link Tasks *</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Select at least one task that contributes to this goal
                    </p>
                    <div className="max-h-40 overflow-y-auto space-y-2 border rounded-md p-2">
                      {availableTasks.map((task: any) => (
                        <label
                          key={task.id}
                          className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTaskIds.includes(task.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTaskIds([...selectedTaskIds, task.id]);
                              } else {
                                setSelectedTaskIds(selectedTaskIds.filter(id => id !== task.id));
                              }
                            }}
                            disabled={isPending}
                            className="rounded"
                          />
                          <div className="flex-1 flex items-center gap-2">
                            <span className="text-sm">
                              {task.name}
                            </span>
                            <span
                              className="px-1.5 py-0.5 text-[10px] font-medium rounded uppercase"
                              style={{
                                backgroundColor:
                                  task.type === 'SIMPLE' ? '#E0F2FE' :
                                  task.type === 'MULTIPLE_CHECKIN' ? '#FCE7F3' :
                                  '#FEF3C7',
                                color:
                                  task.type === 'SIMPLE' ? '#0369A1' :
                                  task.type === 'MULTIPLE_CHECKIN' ? '#BE185D' :
                                  '#B45309'
                              }}
                            >
                              {task.type === 'SIMPLE' ? 'Simple' :
                               task.type === 'MULTIPLE_CHECKIN' ? 'Multi' :
                               'Progress'}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({task.routineName})
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                    {selectedTaskIds.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {selectedTaskIds.length} task{selectedTaskIds.length > 1 ? 's' : ''} selected
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {goal ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                goal ? 'Update Goal' : 'Create Goal'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
