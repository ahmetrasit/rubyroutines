'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Pencil } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { isRoutineVisible } from '@/lib/services/visibility-rules';
import { RoutineForm } from '@/components/routine/routine-form';
import { GoalForm } from '@/components/goal/goal-form';
import { Button } from '@/components/ui/button';

interface PersonDetailSectionsProps {
  roleId: string;
  personId: string;
  onSelectRoutine?: (routine: any) => void;
}

export function PersonDetailSections({ roleId, personId, onSelectRoutine }: PersonDetailSectionsProps) {
  const [routinesExpanded, setRoutinesExpanded] = useState(false);
  const [goalsExpanded, setGoalsExpanded] = useState(false);
  const [tasksExpanded, setTasksExpanded] = useState(false);
  const [showRoutineForm, setShowRoutineForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<any>(null);

  const { data: routines, isLoading: routinesLoading } = trpc.routine.list.useQuery({
    roleId,
    personId,
  });

  const { data: goals, isLoading: goalsLoading } = trpc.goal.list.useQuery(
    { roleId },
    { enabled: !!roleId }
  );

  // Filter goals for this person
  const filteredGoals = goals?.filter((goal) => goal.personIds.includes(personId)) || [];

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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {routines.map((routine: any) => {
                  const visible = isRoutineVisible(routine);
                  const totalTasks = routine.tasks?.length || 0;
                  const smartTasks = routine.tasks?.filter((t: any) => t.isSmart).length || 0;

                  // Extract emoji from name if present
                  const emojiMatch = routine.name.match(/^(\p{Emoji}+)\s*/u);
                  const emoji = emojiMatch ? emojiMatch[1] : '';
                  const displayName = emoji
                    ? routine.name.substring(emoji.length).trim()
                    : routine.name;

                  // Add sunshine for daily routines
                  const isDailyRoutine = routine.resetPeriod === 'DAILY';
                  const periodLabel = routine.resetPeriod === 'DAILY' ? 'Daily' :
                                     routine.resetPeriod === 'WEEKLY' ? 'Weekly' :
                                     routine.resetPeriod === 'MONTHLY' ? 'Monthly' :
                                     routine.resetPeriod === 'DAYS_OF_WEEK' ? 'Specific Days' :
                                     routine.resetPeriod === 'CONDITIONAL' ? 'Conditional' : 'Custom';

                  return (
                    <div
                      key={routine.id}
                      className={`group bg-white rounded-lg border-4 p-3 cursor-pointer transition-all hover:shadow-md relative ${
                        visible ? 'hover:shadow-lg' : 'opacity-40'
                      }`}
                      style={{
                        borderColor: routine.color || '#E5E7EB',
                      }}
                    >
                      <div
                        onClick={() => onSelectRoutine?.(routine)}
                        className="flex flex-col gap-2"
                      >
                        {/* Header with emoji */}
                        <div className="flex items-center justify-center gap-1">
                          {isDailyRoutine && <span className="text-2xl">☀️</span>}
                          {emoji && !isDailyRoutine && <div className="text-2xl">{emoji}</div>}
                        </div>

                        {/* Title */}
                        <h3 className="font-semibold text-gray-900 text-sm text-center line-clamp-2">
                          {displayName}
                        </h3>

                        {/* Task counts */}
                        <div className="flex items-center justify-center gap-2 text-xs">
                          <span className="text-gray-600">{totalTasks} tasks</span>
                          {smartTasks > 0 && (
                            <span className="flex items-center gap-1 text-amber-700">
                              (<span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-amber-100 text-[10px] font-bold">S</span>
                              {smartTasks})
                            </span>
                          )}
                        </div>

                        {/* Period and structure */}
                        <div className="flex flex-col gap-1 text-xs text-center">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                            {periodLabel}
                          </span>
                          {routine.visibilityStructure && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[10px]">
                              {routine.visibilityStructure}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Edit Button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingRoutine(routine);
                        }}
                        className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}

                {/* Add Routine Card */}
                <div
                  onClick={() => setShowRoutineForm(true)}
                  className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-4 cursor-pointer transition-all hover:border-primary-400 hover:bg-gray-50 flex items-center justify-center"
                >
                  <div className="flex flex-col items-center text-center gap-2 text-gray-400">
                    <Plus className="h-8 w-8" />
                    <span className="text-sm font-medium">Add Routine</span>
                  </div>
                </div>
              </div>
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
                  // Extract emoji from name if present
                  const emojiMatch = goal.name.match(/^(\p{Emoji}+)\s*/u);
                  const emoji = emojiMatch ? emojiMatch[1] : '🎯';
                  const displayName = emojiMatch
                    ? goal.name.substring(emoji.length).trim()
                    : goal.name;

                  return (
                    <div
                      key={goal.id}
                      className="bg-white rounded-lg border-2 border-gray-200 p-4 cursor-pointer transition-all hover:shadow-md hover:border-primary-300"
                    >
                      <div className="flex flex-col items-center text-center gap-2">
                        <div className="text-3xl">{emoji}</div>
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {displayName}
                        </h3>
                      </div>
                    </div>
                  );
                })}

                {/* Add Goal Card */}
                <div
                  onClick={() => setShowGoalForm(true)}
                  className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-4 cursor-pointer transition-all hover:border-primary-400 hover:bg-gray-50 flex items-center justify-center"
                >
                  <div className="flex flex-col items-center text-center gap-2 text-gray-400">
                    <Plus className="h-8 w-8" />
                    <span className="text-sm font-medium">Add Goal</span>
                  </div>
                </div>
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
                      {routineTasks.map((task: any) => (
                        <div
                          key={task.id}
                          className="flex flex-col gap-2 p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start gap-2">
                            <div className="text-xl">✅</div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 text-sm line-clamp-2">{task.name}</p>
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
                      ))}
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
          onClose={() => setEditingRoutine(null)}
        />
      )}

      {showGoalForm && (
        <GoalForm
          roleId={roleId}
          personId={personId}
          onClose={() => setShowGoalForm(false)}
        />
      )}
    </div>
  );
}
