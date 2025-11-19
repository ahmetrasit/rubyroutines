'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  GitBranch, Plus, Trash2, Clock, Calendar, Target,
  CheckCircle, Hash, Percent, TrendingUp
} from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import { ConditionOperator, TimeOperator, ConditionLogic } from '@/lib/types/prisma-enums';

interface ConditionFormProps {
  routineId: string;
  condition?: any;
  onClose: () => void;
}

interface ConditionCheck {
  id?: string;
  negate: boolean;
  operator: ConditionOperator;
  value?: string;
  value2?: string;
  targetTaskId?: string;
  targetRoutineId?: string;
  targetGoalId?: string;
  timeOperator?: TimeOperator;
  timeValue?: string;
  dayOfWeek?: number[];
}

export function ConditionForm({ routineId, condition, onClose }: ConditionFormProps) {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Form state
  const [name, setName] = useState(condition?.name || '');
  const [description, setDescription] = useState(condition?.description || '');
  const [controlsRoutine, setControlsRoutine] = useState(condition?.controlsRoutine || true);
  const [logic, setLogic] = useState<ConditionLogic>(condition?.logic || ConditionLogic.AND);
  const [checks, setChecks] = useState<ConditionCheck[]>(
    condition?.checks || [
      {
        negate: false,
        operator: ConditionOperator.TASK_COMPLETED,
      },
    ]
  );

  // Fetch tasks, routines, and goals for selection
  const { data: routine } = trpc.routine.getById.useQuery(
    { id: routineId },
    { enabled: !!routineId }
  );

  const { data: routines } = trpc.routine.list.useQuery(
    { roleId: routine?.roleId },
    { enabled: !!routine?.roleId }
  );

  const { data: goals } = trpc.goal.list.useQuery(
    { roleId: routine?.roleId },
    { enabled: !!routine?.roleId }
  );

  // Create/Update mutations
  const createMutation = trpc.condition.create.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Condition created successfully',
        variant: 'success',
      });
      utils.condition.list.invalidate();
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

  const updateMutation = trpc.condition.update.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Condition updated successfully',
        variant: 'success',
      });
      utils.condition.list.invalidate();
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

  const handleSubmit = () => {
    // Validate checks
    if (checks.length === 0) {
      toast({
        title: 'Error',
        description: 'At least one condition check is required',
        variant: 'destructive',
      });
      return;
    }

    const data = {
      routineId,
      name: name || undefined,
      description: description || undefined,
      controlsRoutine,
      logic,
      checks: checks.map(check => ({
        negate: check.negate,
        operator: check.operator,
        value: check.value,
        value2: check.value2,
        targetTaskId: check.targetTaskId,
        targetRoutineId: check.targetRoutineId,
        targetGoalId: check.targetGoalId,
        timeOperator: check.timeOperator,
        timeValue: check.timeValue,
        dayOfWeek: check.dayOfWeek,
      })),
    };

    if (condition) {
      updateMutation.mutate({ id: condition.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const addCheck = () => {
    setChecks([
      ...checks,
      {
        negate: false,
        operator: ConditionOperator.TASK_COMPLETED,
      },
    ]);
  };

  const removeCheck = (index: number) => {
    setChecks(checks.filter((_, i) => i !== index));
  };

  const updateCheck = (index: number, updates: Partial<ConditionCheck>) => {
    const newChecks = [...checks];
    newChecks[index] = { ...newChecks[index], ...updates };
    setChecks(newChecks);
  };

  // Get operator options based on target type
  const getOperatorOptions = (check: ConditionCheck) => {
    if (check.targetTaskId) {
      return [
        { value: ConditionOperator.TASK_COMPLETED, label: 'Is Completed' },
        { value: ConditionOperator.TASK_NOT_COMPLETED, label: 'Is Not Completed' },
        { value: ConditionOperator.TASK_COUNT_GT, label: 'Count Greater Than' },
        { value: ConditionOperator.TASK_COUNT_LT, label: 'Count Less Than' },
        { value: ConditionOperator.TASK_STREAK_GT, label: 'Streak Greater Than' },
      ];
    }
    if (check.targetRoutineId) {
      return [
        { value: ConditionOperator.ROUTINE_COMPLETED, label: 'Is Completed' },
        { value: ConditionOperator.ROUTINE_PERCENT_GT, label: 'Completion % Greater Than' },
        { value: ConditionOperator.ROUTINE_PERCENT_LT, label: 'Completion % Less Than' },
      ];
    }
    if (check.targetGoalId) {
      return [
        { value: ConditionOperator.GOAL_ACHIEVED, label: 'Is Achieved' },
        { value: ConditionOperator.GOAL_NOT_ACHIEVED, label: 'Is Not Achieved' },
        { value: ConditionOperator.GOAL_PROGRESS_GT, label: 'Progress Greater Than' },
        { value: ConditionOperator.GOAL_PROGRESS_LT, label: 'Progress Less Than' },
      ];
    }
    return [];
  };

  const needsValue = (operator: ConditionOperator) => {
    return [
      ConditionOperator.TASK_COUNT_GT,
      ConditionOperator.TASK_COUNT_LT,
      ConditionOperator.TASK_STREAK_GT,
      ConditionOperator.TASK_STREAK_LT,
      ConditionOperator.ROUTINE_PERCENT_GT,
      ConditionOperator.ROUTINE_PERCENT_LT,
      ConditionOperator.GOAL_PROGRESS_GT,
      ConditionOperator.GOAL_PROGRESS_LT,
    ].includes(operator);
  };

  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            {condition ? 'Edit Condition' : 'Create Condition'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Condition Name (Optional)</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Morning Only"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logic">Logic Operator</Label>
              <Select value={logic} onValueChange={(v) => setLogic(v as ConditionLogic)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ConditionLogic.AND}>AND (All conditions must be true)</SelectItem>
                  <SelectItem value={ConditionLogic.OR}>OR (Any condition must be true)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe when this condition applies..."
              rows={2}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="controls-routine"
              checked={controlsRoutine}
              onCheckedChange={setControlsRoutine}
            />
            <Label htmlFor="controls-routine">
              Controls routine visibility
            </Label>
          </div>

          {/* Condition Checks */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Condition Checks</Label>
              <Button size="sm" variant="outline" onClick={addCheck}>
                <Plus className="h-4 w-4 mr-1" />
                Add Check
              </Button>
            </div>

            <div className="space-y-3">
              {checks.map((check, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">
                      Check {index + 1}
                      {index > 0 && (
                        <Badge variant="outline" className="ml-2">
                          {logic}
                        </Badge>
                      )}
                    </h4>
                    {checks.length > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeCheck(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <Tabs defaultValue="target" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="target">Target</TabsTrigger>
                      <TabsTrigger value="time">Time</TabsTrigger>
                      <TabsTrigger value="advanced">Advanced</TabsTrigger>
                    </TabsList>

                    <TabsContent value="target" className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Target Type</Label>
                          <Select
                            value={
                              check.targetTaskId ? 'task' :
                              check.targetRoutineId ? 'routine' :
                              check.targetGoalId ? 'goal' : ''
                            }
                            onValueChange={(type) => {
                              updateCheck(index, {
                                targetTaskId: undefined,
                                targetRoutineId: undefined,
                                targetGoalId: undefined,
                                operator: ConditionOperator.TASK_COMPLETED,
                              });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select target" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="task">Task</SelectItem>
                              <SelectItem value="routine">Routine</SelectItem>
                              <SelectItem value="goal">Goal</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Target Selection */}
                        {check.targetTaskId !== undefined && routine?.tasks && (
                          <div className="space-y-2">
                            <Label>Select Task</Label>
                            <Select
                              value={check.targetTaskId}
                              onValueChange={(v) => updateCheck(index, { targetTaskId: v })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select task" />
                              </SelectTrigger>
                              <SelectContent>
                                {routine.tasks.map((task: any) => (
                                  <SelectItem key={task.id} value={task.id}>
                                    {task.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {check.targetRoutineId !== undefined && routines && (
                          <div className="space-y-2">
                            <Label>Select Routine</Label>
                            <Select
                              value={check.targetRoutineId}
                              onValueChange={(v) => updateCheck(index, { targetRoutineId: v })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select routine" />
                              </SelectTrigger>
                              <SelectContent>
                                {routines.map((r: any) => (
                                  <SelectItem key={r.id} value={r.id}>
                                    {r.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {check.targetGoalId !== undefined && goals && (
                          <div className="space-y-2">
                            <Label>Select Goal</Label>
                            <Select
                              value={check.targetGoalId}
                              onValueChange={(v) => updateCheck(index, { targetGoalId: v })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select goal" />
                              </SelectTrigger>
                              <SelectContent>
                                {goals.map((g: any) => (
                                  <SelectItem key={g.id} value={g.id}>
                                    {g.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>

                      {/* Operator Selection */}
                      {(check.targetTaskId || check.targetRoutineId || check.targetGoalId) && (
                        <div className="space-y-2">
                          <Label>Condition</Label>
                          <Select
                            value={check.operator}
                            onValueChange={(v) => updateCheck(index, { operator: v as ConditionOperator })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {getOperatorOptions(check).map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Value Input */}
                      {needsValue(check.operator) && (
                        <div className="space-y-2">
                          <Label>Value</Label>
                          <Input
                            type="number"
                            value={check.value || ''}
                            onChange={(e) => updateCheck(index, { value: e.target.value })}
                            placeholder="Enter value"
                          />
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="time" className="space-y-3">
                      <div className="space-y-2">
                        <Label>Time Condition</Label>
                        <Select
                          value={check.timeOperator || ''}
                          onValueChange={(v) => updateCheck(index, { timeOperator: v as TimeOperator })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select time condition" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={TimeOperator.BEFORE}>Before</SelectItem>
                            <SelectItem value={TimeOperator.AFTER}>After</SelectItem>
                            <SelectItem value={TimeOperator.BETWEEN}>Between</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {check.timeOperator && (
                        <div className="space-y-2">
                          <Label>Time</Label>
                          <Input
                            type="time"
                            value={check.timeValue || ''}
                            onChange={(e) => updateCheck(index, { timeValue: e.target.value })}
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Days of Week</Label>
                        <div className="flex flex-wrap gap-2">
                          {daysOfWeek.map((day) => (
                            <label key={day.value} className="flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={check.dayOfWeek?.includes(day.value) || false}
                                onChange={(e) => {
                                  const days = check.dayOfWeek || [];
                                  if (e.target.checked) {
                                    updateCheck(index, { dayOfWeek: [...days, day.value] });
                                  } else {
                                    updateCheck(index, {
                                      dayOfWeek: days.filter((d) => d !== day.value),
                                    });
                                  }
                                }}
                              />
                              <span className="text-sm">{day.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="advanced" className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={check.negate}
                          onCheckedChange={(v) => updateCheck(index, { negate: v })}
                        />
                        <Label>Negate condition (NOT)</Label>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {condition ? 'Update Condition' : 'Create Condition'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}