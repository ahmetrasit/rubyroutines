'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Users, Check, Circle, Lock, GraduationCap, Home } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';

interface SharedRoutinesSectionProps {
  personId: string;
}

// Normalized shared routine group type for UI rendering
interface NormalizedSharedGroup {
  sharerName: string;
  primaryPersonName: string;
  primaryPersonId: string;
  source: 'parent' | 'teacher';
  routines: Array<{
    id: string;
    name: string;
    color: string | null;
    resetPeriod: string;
    tasks: Array<{
      id: string;
      name: string;
      emoji: string | null;
      type: string;
      isComplete: boolean;
      lastCompletedAt: Date | null;
    }>;
    completedTasksCount: number;
    totalTasksCount: number;
  }>;
}

export function SharedRoutinesSection({ personId }: SharedRoutinesSectionProps) {
  const [expanded, setExpanded] = useState(false);

  // Fetch shared routines from both CoParent and CoTeacher
  const { data: coParentData, isLoading: isLoadingCoParent } = trpc.coParent.getSharedRoutineStatus.useQuery(
    { personId },
    { enabled: !!personId }
  );

  const { data: coTeacherData, isLoading: isLoadingCoTeacher } = trpc.coTeacher.getSharedRoutineStatus.useQuery(
    { personId },
    { enabled: !!personId }
  );

  const isLoading = isLoadingCoParent || isLoadingCoTeacher;

  // Normalize and combine data from both sources
  const combinedData: NormalizedSharedGroup[] = [];

  // Add CoParent shared routines
  if (coParentData) {
    coParentData.forEach((group: any) => {
      if (group) {
        combinedData.push({
          sharerName: group.coParentName,
          primaryPersonName: group.primaryPersonName,
          primaryPersonId: group.primaryPersonId,
          source: 'parent',
          routines: group.routines
        });
      }
    });
  }

  // Add CoTeacher shared routines
  if (coTeacherData) {
    coTeacherData.forEach((group: any) => {
      if (group) {
        combinedData.push({
          sharerName: group.coTeacherName,
          primaryPersonName: group.primaryStudentName,
          primaryPersonId: group.primaryStudentId,
          source: 'teacher',
          routines: group.routines
        });
      }
    });
  }

  // Don't render anything if there are no shared routines
  if (!isLoading && combinedData.length === 0) {
    return null;
  }

  // Calculate total routines count
  const totalRoutines = combinedData.reduce(
    (sum, group) => sum + (group?.routines?.length || 0),
    0
  );

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border-l-4 border-l-gray-400">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-500" />
          )}
          <Users className="h-5 w-5 text-gray-500" />
          <h2 className="text-xl font-semibold text-gray-900">Shared Routines</h2>
          <span className="text-sm text-gray-500">
            ({totalRoutines})
          </span>
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
            <Lock className="h-3 w-3 mr-1" />
            Read-only
          </span>
        </div>
      </button>

      {expanded && (
        <div className="px-6 pb-6">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading shared routines...</div>
          ) : combinedData.length > 0 ? (
            <div className="space-y-6">
              {combinedData.map((group, groupIndex) => (
                <div key={groupIndex} className="space-y-4">
                  {/* Source Header - Different styling for parent vs teacher */}
                  <div className={`flex items-center gap-2 text-sm border-b pb-2 ${
                    group.source === 'teacher'
                      ? 'text-blue-600 border-blue-200'
                      : 'text-gray-600 border-gray-200'
                  }`}>
                    {group.source === 'teacher' ? (
                      <GraduationCap className="h-4 w-4" />
                    ) : (
                      <Home className="h-4 w-4" />
                    )}
                    <span>
                      Shared from{' '}
                      <span className={`font-medium ${group.source === 'teacher' ? 'text-blue-900' : 'text-gray-900'}`}>
                        {group.sharerName}
                      </span>
                    </span>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                      group.source === 'teacher'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {group.source === 'teacher' ? 'Teacher' : 'Parent'}
                    </span>
                    <span className="text-gray-400">|</span>
                    <span className="text-gray-600">For: <span className="font-medium">{group.primaryPersonName}</span></span>
                  </div>

                  {/* Routines Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {group.routines.map((routine: any) => {
                      // Extract emoji from name
                      const emojiMatch = routine.name.match(/^(\p{Emoji}+)\s*(.*)$/u);
                      const emoji = emojiMatch ? emojiMatch[1] : null;
                      const displayName = emojiMatch ? emojiMatch[2] : routine.name;

                      // Calculate completion percentage
                      const completionPercentage = routine.totalTasksCount > 0
                        ? Math.round((routine.completedTasksCount / routine.totalTasksCount) * 100)
                        : 0;

                      return (
                        <div
                          key={routine.id}
                          className="bg-gray-50 rounded-lg border-4 p-3 opacity-80"
                          style={{
                            borderColor: routine.color || '#9CA3AF',
                          }}
                        >
                          {/* Row 1: Emoji and Name */}
                          <div className="flex items-center gap-2 mb-2">
                            {emoji && <span className="text-2xl">{emoji}</span>}
                            <h3 className="font-semibold text-gray-700 text-sm flex-1 line-clamp-1">
                              {displayName}
                            </h3>
                          </div>

                          {/* Row 2: Completion Progress */}
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                              <span>{routine.completedTasksCount} / {routine.totalTasksCount} tasks</span>
                              <span>{completionPercentage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full transition-all"
                                style={{
                                  width: `${completionPercentage}%`,
                                  backgroundColor: completionPercentage === 100 ? '#22C55E' : (routine.color || '#6B7280')
                                }}
                              />
                            </div>
                          </div>

                          {/* Row 3: Task List */}
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {routine.tasks.map((task: any) => (
                              <div
                                key={task.id}
                                className="flex items-center gap-2 text-xs"
                              >
                                {task.isComplete ? (
                                  <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                                ) : (
                                  <Circle className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
                                )}
                                <span className={`${task.isComplete ? 'text-gray-500 line-through' : 'text-gray-700'} line-clamp-1`}>
                                  {task.emoji && <span className="mr-1">{task.emoji}</span>}
                                  {task.name}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Row 4: Read-only indicator */}
                          <div className="mt-3 pt-2 border-t border-gray-200">
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Lock className="h-3 w-3" />
                              View only
                            </span>
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
              <p className="text-gray-500">No shared routines from co-parents or co-teachers</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
