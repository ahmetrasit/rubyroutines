'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { isRoutineVisible } from '@/lib/services/visibility-rules';
import { RoutineForm } from '@/components/routine/routine-form';
import { GoalForm } from '@/components/goal/goal-form';

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

  const { data: routines, isLoading: routinesLoading } = trpc.routine.list.useQuery({
    roleId,
    personId,
  });

  const { data: goals, isLoading: goalsLoading } = trpc.goal.list.useQuery(
    { roleId },
    { enabled: !!roleId }
  );

  const { data: tasks, isLoading: tasksLoading } = trpc.task.list.useQuery(
    { roleId },
    { enabled: !!roleId }
  );

  // Filter goals for this person
  const filteredGoals = goals?.filter((goal) => goal.personIds.includes(personId)) || [];

  // Group tasks by routine
  const tasksByRoutine = tasks?.reduce((acc: any, task: any) => {
    const routineName = task.routine?.name || 'Unknown Routine';
    if (!acc[routineName]) {
      acc[routineName] = [];
    }
    acc[routineName].push(task);
    return acc;
  }, {}) || {};

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
                  // Extract emoji from name if present
                  const emojiMatch = routine.name.match(/^(\p{Emoji}+)\s*/u);
                  const emoji = emojiMatch ? emojiMatch[1] : '';
                  const displayName = emoji
                    ? routine.name.substring(emoji.length).trim()
                    : routine.name;

                  return (
                    <div
                      key={routine.id}
                      onClick={() => onSelectRoutine?.(routine)}
                      className={`bg-white rounded-lg border-2 p-4 cursor-pointer transition-all hover:shadow-md ${
                        visible
                          ? 'border-gray-200 hover:border-primary-300'
                          : 'border-gray-100 opacity-50'
                      }`}
                    >
                      <div className="flex flex-col items-center text-center gap-2">
                        {emoji && <div className="text-3xl">{emoji}</div>}
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {displayName}
                        </h3>
                      </div>
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
              ({tasks?.length || 0})
            </span>
          </div>
        </button>

        {tasksExpanded && (
          <div className="px-6 pb-6">
            {tasksLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : tasks && tasks.length > 0 ? (
              <div className="space-y-6">
                {Object.entries(tasksByRoutine).map(([routineName, routineTasks]: [string, any]) => (
                  <div key={routineName}>
                    <h3 className="font-semibold text-gray-700 mb-3">{routineName}</h3>
                    <div className="space-y-2">
                      {routineTasks.map((task: any) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="text-xl">✅</div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{task.name}</p>
                            {task.description && (
                              <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                            )}
                          </div>
                          <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded capitalize">
                            {task.type.toLowerCase().replace('_', ' ')}
                          </span>
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
