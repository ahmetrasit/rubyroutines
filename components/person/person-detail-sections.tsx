'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Pencil, Share2, Trash2, Eye, Clock } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { isRoutineVisible } from '@/lib/services/visibility-rules';
import { RoutineForm } from '@/components/routine/routine-form';
import { GoalForm } from '@/components/goal/goal-form';
import { GoalDetailModal } from '@/components/goal/goal-detail-modal';
import { Button } from '@/components/ui/button';
import { getTierLimit, type ComponentTierLimits } from '@/lib/services/tier-limits';
import { RoutineActionsModal } from '@/components/routine/RoutineActionsModal';
import { CopyRoutineModal } from '@/components/routine/copy-routine-modal';
import { useToast } from '@/components/ui/toast';

interface PersonDetailSectionsProps {
  roleId: string;
  personId: string;
  effectiveLimits?: ComponentTierLimits | null;
  onSelectRoutine?: (routine: any) => void;
}

export function PersonDetailSections({ roleId, personId, effectiveLimits = null, onSelectRoutine }: PersonDetailSectionsProps) {
  const [routinesExpanded, setRoutinesExpanded] = useState(false);
  const [goalsExpanded, setGoalsExpanded] = useState(false);
  const [tasksExpanded, setTasksExpanded] = useState(false);
  const [showRoutineForm, setShowRoutineForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<any>(null);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [actionsRoutine, setActionsRoutine] = useState<any>(null);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const { data: routines, isLoading: routinesLoading } = trpc.routine.list.useQuery({
    roleId,
    personId,
    includeTasks: true,
  });

  const { data: goals, isLoading: goalsLoading } = trpc.goal.list.useQuery(
    { roleId },
    { enabled: !!roleId }
  );

  const deleteGoalMutation = trpc.goal.archive.useMutation({
    onSuccess: (data, variables) => {
      const goal = goals?.find((g) => g.id === variables.id);
      toast({
        title: 'Success',
        description: `${goal?.name || 'Goal'} has been archived`,
        variant: 'success',
      });
      utils.goal.list.invalidate();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = trpc.routine.delete.useMutation({
    onSuccess: (data, variables) => {
      const routine = routines?.find((r) => r.id === variables.id);
      toast({
        title: 'Success',
        description: `${routine?.name || 'Routine'} has been archived`,
        variant: 'success',
      });
      utils.routine.list.invalidate();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Visibility override mutation
  const visibilityOverrideMutation = trpc.routine.createVisibilityOverride.useMutation({
    onSuccess: (data, variables) => {
      const routine = routines?.find((r) => r.id === variables.routineId);
      toast({
        title: 'Routine visible',
        description: `${routine?.name || 'Routine'} is now temporarily visible`,
        variant: 'success',
      });
      utils.routine.list.invalidate();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleShowTemporarily = (routineId: string, minutes: number) => {
    visibilityOverrideMutation.mutate({ routineId, duration: minutes });
  };

  // Filter goals for this person
  const filteredGoals = goals?.filter((goal) => goal.personIds.includes(personId)) || [];

  // Separate visible and hidden routines
  const visibleRoutines = routines?.filter((r: any) => isRoutineVisible(r)) || [];
  const hiddenRoutines = routines?.filter((r: any) => !isRoutineVisible(r)) || [];

  // Check tier limits using effective limits from database
  const routineLimit = getTierLimit(effectiveLimits, 'routines_per_person');
  const currentRoutineCount = routines?.length || 0;
  const canAddRoutine = currentRoutineCount < routineLimit;

  const goalLimit = getTierLimit(effectiveLimits, 'goals');
  const currentGoalCount = goals?.length || 0;
  const canAddGoal = currentGoalCount < goalLimit;

  // Extract tasks from routines and group by routine
  const tasksByRoutine = routines?.reduce((acc: any, routine: any) => {
    if (routine.tasks && routine.tasks.length > 0) {
      acc[routine.name] = routine.tasks;
    }
    return acc;
  }, {}) || {};

  // Count total tasks
  const totalTasks = Object.values(tasksByRoutine).reduce(
    (sum: number, tasks: any) => sum + tasks.length,
    0
  );

  const handleDelete = (routine: any) => {
    if (confirm(`Are you sure you want to archive "${routine.name}"?`)) {
      deleteMutation.mutate({ id: routine.id });
    }
  };

  const handleDeleteGoal = (goal: any) => {
    if (confirm(`Are you sure you want to archive "${goal.name}"?`)) {
      deleteGoalMutation.mutate({ id: goal.id });
    }
  };

  return (
    <div className="space-y-6">
      {/* Routines Section */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <button
          onClick={() => setRoutinesExpanded(!routinesExpanded)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            {routinesExpanded ? (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-500" />
            )}
            <h2 className="text-xl font-semibold text-gray-900">Routines</h2>
            <span className="text-sm text-gray-500">
              ({routines?.length || 0})
            </span>
          </div>
        </button>

        {routinesExpanded && (
          <div className="px-6 pb-6">
            {routinesLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : routines && routines.length > 0 ? (
              <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...visibleRoutines]
                  .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                  .map((routine: any) => {
                  const visible = true; // These are already filtered as visible

                  // Extract emoji from name
                  const emojiMatch = routine.name.match(/^(\p{Emoji}+)\s*(.*)$/u);
                  const emoji = emojiMatch ? emojiMatch[1] : '📋';
                  const displayName = emojiMatch ? emojiMatch[2] : routine.name;

                  // Count tasks by type
                  const simpleTasks = routine.tasks?.filter((t: any) => t.type === 'SIMPLE').length || 0;
                  const multipleTasks = routine.tasks?.filter((t: any) => t.type === 'MULTIPLE_CHECKIN').length || 0;
                  const progressTasks = routine.tasks?.filter((t: any) => t.type === 'PROGRESS').length || 0;
                  const totalTasks = simpleTasks + multipleTasks + progressTasks;

                  // Check if showing weekly with specific days
                  const isWeeklyWithDays = (routine.resetPeriod === 'DAYS_OF_WEEK' || routine.resetPeriod === 'WEEKLY') && routine.visibleDays?.length > 0;

                  // Format time info
                  const formatTimeInfo = () => {
                    if (routine.startTime && routine.endTime) {
                      return `${routine.startTime.slice(0, 5)}-${routine.endTime.slice(0, 5)}`;
                    }
                    return '';
                  };

                  // Format visibility info for simple display
                  const formatVisibility = () => {
                    const timeInfo = formatTimeInfo();

                    // Weekly without specific days
                    if (routine.resetPeriod === 'WEEKLY') {
                      return timeInfo ? `Weekly ${timeInfo}` : 'Weekly';
                    }

                    // Daily with time
                    if (routine.resetPeriod === 'DAILY') {
                      return timeInfo || 'Daily';
                    }

                    // Default
                    return routine.resetPeriod || 'Custom';
                  };

                  return (
                    <div
                      key={routine.id}
                      onClick={() => onSelectRoutine?.(routine)}
                      className={`bg-white rounded-lg border-4 p-3 transition-all hover:shadow-md cursor-pointer ${
                        visible ? '' : 'opacity-50'
                      }`}
                      style={{
                        borderColor: routine.color || '#E5E7EB',
                      }}
                    >
                      {/* Row 1: Emoji and Name */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{emoji}</span>
                        <h3 className="font-semibold text-gray-900 text-sm flex-1 line-clamp-1">
                          {displayName}
                        </h3>
                      </div>

                      {/* Row 2: Task counts by type */}
                      <div className="flex items-center gap-2 mb-2 text-xs text-gray-600">
                        {totalTasks > 0 ? (
                          <span>
                            {totalTasks} {totalTasks === 1 ? 'task' : 'tasks'} (
                            {[
                              simpleTasks > 0 && `${simpleTasks}S`,
                              multipleTasks > 0 && `${multipleTasks}M`,
                              progressTasks > 0 && `${progressTasks}P`
                            ].filter(Boolean).join(', ')}
                            )
                          </span>
                        ) : (
                          <span>0 tasks</span>
                        )}
                      </div>

                      {/* Row 3: Visibility period */}
                      <div className="mb-2 text-xs">
                        {isWeeklyWithDays ? (
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center gap-0.5">
                              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, idx) => {
                                const isSelected = routine.visibleDays.includes(idx);
                                return (
                                  <span
                                    key={day}
                                    className={`px-1 py-0.5 text-[10px] font-medium rounded ${
                                      isSelected
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-gray-100 text-gray-400'
                                    }`}
                                  >
                                    {day}
                                  </span>
                                );
                              })}
                            </div>
                            {formatTimeInfo() && (
                              <span className="text-gray-600 text-[10px]">{formatTimeInfo()}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-600">{formatVisibility()}</span>
                        )}
                      </div>

                      {/* Row 4: Action buttons */}
                      <div className="flex items-center gap-1 relative z-10">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActionsRoutine(routine);
                          }}
                          title="Share/Copy"
                          className="h-7 px-2 text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                        >
                          <Share2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingRoutine(routine);
                          }}
                          title="Edit"
                          className="h-7 px-2 text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        {!routine.name?.includes('Daily Routine') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(routine);
                            }}
                            title="Delete"
                            className="h-7 px-2 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Add Routine Card */}
                <button
                  onClick={canAddRoutine ? () => setShowRoutineForm(true) : undefined}
                  className={`rounded-lg border-2 border-dashed p-4 transition-all flex items-center justify-center ${
                    canAddRoutine
                      ? 'border-gray-300 cursor-pointer hover:border-primary-400 hover:bg-gray-50'
                      : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                  }`}
                >
                  {canAddRoutine ? (
                    <div className="flex flex-col items-center text-center gap-2 text-gray-400">
                      <Plus className="h-8 w-8" />
                      <span className="text-sm font-medium">Add Routine</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="text-2xl">🔒</div>
                      <span className="text-xs font-medium text-gray-500">Upgrade to add</span>
                      <span className="text-xs text-gray-400">new routines</span>
                      <span className="text-xs text-gray-400 mt-1">({currentRoutineCount}/{routineLimit})</span>
                    </div>
                  )}
                </button>
              </div>

              {/* Hidden Routines Section */}
              {hiddenRoutines.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Eye className="h-4 w-4 text-gray-500" />
                    <h3 className="font-medium text-gray-700">
                      Hidden Routines ({hiddenRoutines.length})
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    These routines are currently hidden based on their schedule. You can temporarily show them.
                  </p>
                  <div className="space-y-3">
                    {hiddenRoutines.map((routine: any) => {
                      const emojiMatch = routine.name.match(/^(\p{Emoji}+)\s*(.*)$/u);
                      const emoji = emojiMatch ? emojiMatch[1] : '📋';
                      const displayName = emojiMatch ? emojiMatch[2] : routine.name;
                      const taskCount = routine.tasks?.length || routine._count?.tasks || 0;

                      return (
                        <div
                          key={routine.id}
                          className="flex items-center justify-between p-3 bg-white rounded-lg border"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{emoji}</span>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{displayName}</p>
                              <p className="text-xs text-gray-500">
                                {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 mr-2">Show for:</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleShowTemporarily(routine.id, 10)}
                              disabled={visibilityOverrideMutation.isPending}
                              className="h-7 px-2 text-xs"
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              10m
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleShowTemporarily(routine.id, 30)}
                              disabled={visibilityOverrideMutation.isPending}
                              className="h-7 px-2 text-xs"
                            >
                              30m
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleShowTemporarily(routine.id, 90)}
                              disabled={visibilityOverrideMutation.isPending}
                              className="h-7 px-2 text-xs"
                            >
                              90m
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              </>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-gray-500 mb-4">No routines yet</p>
                <button
                  onClick={() => setShowRoutineForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Create Your First Routine
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Goals Section */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <button
          onClick={() => setGoalsExpanded(!goalsExpanded)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            {goalsExpanded ? (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-500" />
            )}
            <h2 className="text-xl font-semibold text-gray-900">Goals</h2>
            <span className="text-sm text-gray-500">
              ({filteredGoals.length})
            </span>
          </div>
        </button>

        {goalsExpanded && (
          <div className="px-6 pb-6">
            {goalsLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : filteredGoals.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredGoals.map((goal: any) => {
                  // Use the dedicated icon field if available, otherwise extract from name
                  let emoji = goal.icon || '🎯';
                  let displayName = goal.name;

                  // If no icon field, try extracting from name (backward compatibility)
                  if (!goal.icon) {
                    const emojiMatch = goal.name.match(/^(\p{Emoji}+)\s*/u);
                    if (emojiMatch) {
                      emoji = emojiMatch[1];
                      displayName = goal.name.substring(emoji.length).trim();
                    }
                  }

                  // Calculate progress
                  const progress = goal.progress || { current: 0, target: goal.target, percentage: 0 };
                  const progressPercentage = Math.min(100, (progress.current / progress.target) * 100);

                  return (
                    <div
                      key={goal.id}
                      onClick={() => setSelectedGoal(goal)}
                      className="bg-white rounded-lg border-4 p-3 transition-all hover:shadow-md cursor-pointer"
                      style={{
                        borderColor: goal.color || '#E5E7EB',
                      }}
                    >
                      {/* Row 1: Emoji and Name */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{emoji}</span>
                        <h3 className="font-semibold text-gray-900 text-sm flex-1 line-clamp-1">
                          {displayName}
                        </h3>
                      </div>

                      {/* Row 2: Progress info */}
                      <div className="mb-2 text-xs text-gray-600">
                        <div className="flex items-center justify-between mb-1">
                          <span>{progress.current} / {progress.target}</span>
                          <span>{progressPercentage.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full transition-all"
                            style={{
                              width: `${progressPercentage}%`,
                              backgroundColor: goal.color || '#3B82F6'
                            }}
                          />
                        </div>
                      </div>

                      {/* Row 3: Period and Linked Tasks */}
                      <div className="mb-2 text-xs text-gray-600 flex items-center justify-between">
                        <span>{goal.period?.toLowerCase() || 'Custom'}</span>
                        {goal.taskLinks && goal.taskLinks.length > 0 && (
                          <span className="text-gray-500">
                            {goal.taskLinks.length} {goal.taskLinks.length === 1 ? 'task' : 'tasks'}
                          </span>
                        )}
                      </div>

                      {/* Row 4: Action buttons */}
                      <div className="flex items-center gap-1 relative z-10">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingGoal(goal);
                            setShowGoalForm(true);
                          }}
                          title="Edit"
                          className="h-7 px-2 text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGoal(goal);
                          }}
                          title="Delete"
                          className="h-7 px-2 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {/* Add Goal Card */}
                <button
                  onClick={canAddGoal ? () => setShowGoalForm(true) : undefined}
                  className={`rounded-lg border-2 border-dashed p-4 transition-all flex items-center justify-center ${
                    canAddGoal
                      ? 'border-gray-300 cursor-pointer hover:border-primary-400 hover:bg-gray-50'
                      : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                  }`}
                >
                  {canAddGoal ? (
                    <div className="flex flex-col items-center text-center gap-2 text-gray-400">
                      <Plus className="h-8 w-8" />
                      <span className="text-sm font-medium">Add Goal</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="text-2xl">🔒</div>
                      <span className="text-xs font-medium text-gray-500">Upgrade to add</span>
                      <span className="text-xs text-gray-400">new goals</span>
                      <span className="text-xs text-gray-400 mt-1">({currentGoalCount}/{goalLimit})</span>
                    </div>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-gray-500 mb-4">No goals yet</p>
                <button
                  onClick={() => setShowGoalForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Create Your First Goal
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tasks Section */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <button
          onClick={() => setTasksExpanded(!tasksExpanded)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            {tasksExpanded ? (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-500" />
            )}
            <h2 className="text-xl font-semibold text-gray-900">Tasks</h2>
            <span className="text-sm text-gray-500">
              ({totalTasks})
            </span>
          </div>
        </button>

        {tasksExpanded && (
          <div className="px-6 pb-6">
            {routinesLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : Object.keys(tasksByRoutine).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(tasksByRoutine).map(([routineName, routineTasks]: [string, any]) => (
                  <div key={routineName}>
                    <h3 className="font-semibold text-gray-700 mb-3">{routineName}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {routineTasks.map((task: any) => {
                        // Use the dedicated emoji field from the task
                        const taskEmoji = task.emoji || '✅';
                        const taskDisplayName = task.name;

                        return (
                        <div
                          key={task.id}
                          className="flex flex-col gap-2 p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start gap-2">
                            <div className="text-xl">{taskEmoji}</div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 text-sm line-clamp-2">{taskDisplayName}</p>
                            </div>
                          </div>
                          {task.description && (
                            <p className="text-xs text-gray-600 line-clamp-2">{task.description}</p>
                          )}
                          <div className="flex flex-wrap gap-1 mt-auto">
                            <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded">
                              {task.type === 'SIMPLE' ? 'Simple' :
                               task.type === 'MULTIPLE_CHECKIN' ? 'Multi' :
                               task.type === 'PROGRESS' ? 'Progress' :
                               task.type.toLowerCase().replace('_', ' ')}
                            </span>
                            {task.isSmart && (
                              <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">
                                Smart
                              </span>
                            )}
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-gray-500">No tasks yet</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Forms */}
      {showRoutineForm && (
        <RoutineForm
          roleId={roleId}
          personIds={[personId]}
          onClose={() => setShowRoutineForm(false)}
        />
      )}

      {editingRoutine && (
        <RoutineForm
          routine={editingRoutine}
          roleId={roleId}
          personIds={[personId]}
          onClose={() => setEditingRoutine(null)}
        />
      )}

      {showGoalForm && (
        <GoalForm
          roleId={roleId}
          personId={personId}
          goal={editingGoal}
          onClose={() => {
            setShowGoalForm(false);
            setEditingGoal(null);
          }}
        />
      )}

      {selectedGoal && (
        <GoalDetailModal
          goal={selectedGoal}
          onClose={() => setSelectedGoal(null)}
        />
      )}

      {/* Routine Actions Modal (Share/Copy) */}
      {actionsRoutine && (
        <RoutineActionsModal
          isOpen={!!actionsRoutine}
          onClose={() => setActionsRoutine(null)}
          routine={{
            id: actionsRoutine.id,
            name: actionsRoutine.name,
          }}
          roleId={roleId}
          onCopyClick={() => setShowCopyModal(true)}
        />
      )}

      {/* Copy Routine Modal */}
      <CopyRoutineModal
        isOpen={showCopyModal}
        onClose={() => setShowCopyModal(false)}
        roleId={roleId}
        sourcePersonId={personId}
        preselectedRoutineId={actionsRoutine?.id}
      />
    </div>
  );
}
