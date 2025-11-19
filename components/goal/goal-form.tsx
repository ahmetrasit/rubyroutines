'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import { Loader2 } from 'lucide-react';
import { ResetPeriod, GoalType } from '@/lib/types/prisma-enums';
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

  const { toast } = useToast();
  const utils = trpc.useUtils();

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
      if (goal.taskLinks) {
        setSelectedTaskIds(goal.taskLinks.map((link: any) => link.taskId));
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

  // Fetch routines to get tasks for linking
  const { data: routines } = trpc.routine.list.useQuery(
    { roleId, personId },
    { enabled: !!roleId }
  );

  // Extract all tasks from routines
  const availableTasks = routines?.flatMap(routine =>
    routine.tasks?.map((task: any) => ({
      ...task,
      routineName: routine.name
    })) || []
  ) || [];

  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

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

    if (!target || parseFloat(target) <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid target value',
        variant: 'destructive',
      });
      return;
    }

    if (!roleId) {
      toast({
        title: 'Error',
        description: 'No role found',
        variant: 'destructive',
      });
      return;
    }

    const data = {
      name: name.trim(),
      roleId,
      description: description.trim() || undefined,
      type,
      target: parseFloat(target),
      period,
      resetDay,
      icon,
      color,
      personIds: personId ? [personId] : [],
      taskIds: selectedTaskIds,
    };

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
            {/* Icon/Emoji and Color Picker */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <Label htmlFor="icon">Icon/Emoji *</Label>
                <Input
                  id="icon"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="🎯"
                  maxLength={2}
                  disabled={isPending}
                  className="mt-2 text-2xl text-center"
                />
                <p className="text-xs text-gray-500 mt-1">Enter an emoji</p>
              </div>
              <div className="flex-1">
                <Label>Color *</Label>
                <div className="mt-2 space-y-2">
                  <HexColorPicker color={color} onChange={setColor} />
                  <div className="flex gap-1 flex-wrap">
                    {AVATAR_COLORS.PALETTE.slice(0, 12).map((c) => (
                      <button
                        key={c}
                        type="button"
                        className="w-6 h-6 rounded-full border-2 border-gray-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: c }}
                        onClick={() => setColor(c)}
                        disabled={isPending}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Goal Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Complete 50 tasks this week"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
              />
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

            <div className="space-y-2">
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
                <Label>Link Tasks (Optional)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Select tasks that contribute to this goal
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
                      <span className="flex-1 text-sm">
                        {task.name}
                        <span className="text-xs text-gray-500 ml-1">
                          ({task.routineName})
                        </span>
                      </span>
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
