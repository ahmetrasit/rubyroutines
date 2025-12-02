'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight, Users, Eye, Unlink, Loader2, RefreshCw, Check, Circle, Hash, TrendingUp } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { subscribeToTaskCompletions, unsubscribe } from '@/lib/realtime/supabase-realtime';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface ConnectedPersonsSectionProps {
  roleId: string;
  targetPersonId: string;
  roleType: 'PARENT' | 'TEACHER';
}

/**
 * Section component that displays connected persons' routines and task completion status.
 * This is shown in the target person's dashboard to view origin persons they're connected to.
 */
export function ConnectedPersonsSection({
  roleId,
  targetPersonId,
  roleType,
}: ConnectedPersonsSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Fetch connected persons for this target
  const {
    data: connections,
    isLoading,
    refetch,
  } = trpc.personConnection.getConnectedPersonsForDashboard.useQuery(
    { roleId, targetPersonId },
    { enabled: !!roleId && !!targetPersonId }
  );

  // Fetch detailed data for selected connection
  const { data: connectionData, isLoading: isLoadingData, refetch: refetchConnectionData } =
    trpc.personConnection.getConnectedPersonData.useQuery(
      { connectionId: selectedConnectionId! },
      { enabled: !!selectedConnectionId }
    );

  // Real-time subscription for the selected connected person
  useEffect(() => {
    if (!selectedConnectionId || !connectionData?.originPerson?.id) {
      return;
    }

    const originPersonId = connectionData.originPerson.id;
    let channel: RealtimeChannel | null = null;

    // Subscribe to task completions for the connected person
    channel = subscribeToTaskCompletions(
      originPersonId,
      () => {
        // Refetch connection data when a task completion occurs
        refetchConnectionData();
      },
      (error) => {
        console.error('[ConnectedPersonsSection] Realtime error:', error);
      }
    );

    return () => {
      if (channel) {
        unsubscribe(channel);
      }
    };
  }, [selectedConnectionId, connectionData?.originPerson?.id, refetchConnectionData]);

  // Remove connection mutation
  const removeMutation = trpc.personConnection.remove.useMutation({
    onSuccess: () => {
      toast({
        title: 'Connection removed',
        description: 'You are no longer connected to this person.',
        variant: 'default',
      });
      setSelectedConnectionId(null);
      utils.personConnection.getConnectedPersonsForDashboard.invalidate();
    },
    onError: (error) => {
      toast({
        title: 'Error removing connection',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleRemoveConnection = (connectionId: string, personName: string) => {
    if (confirm(`Are you sure you want to disconnect from ${personName}? You will no longer see their task completion status.`)) {
      removeMutation.mutate({ connectionId });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-500" />
          )}
          <Users className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900">Connected Persons</h2>
          <span className="text-sm text-gray-500">({connections?.length || 0})</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            refetch();
          }}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {expanded && (
        <div className="px-6 pb-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : !connections || connections.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border rounded-lg">
              <Users className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm font-medium mb-1">No Connected Persons</p>
              <p className="text-xs">This person is not connected to anyone yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Connection list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {connections.map((conn) => (
                  <div
                    key={conn.connectionId}
                    onClick={() => setSelectedConnectionId(
                      selectedConnectionId === conn.connectionId ? null : conn.connectionId
                    )}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedConnectionId === conn.connectionId
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {conn.originPerson.avatar ? (
                        <div className="text-3xl">
                          {(() => {
                            try {
                              const parsed = JSON.parse(conn.originPerson.avatar);
                              return parsed.emoji || conn.originPerson.name.charAt(0);
                            } catch {
                              return conn.originPerson.name.charAt(0);
                            }
                          })()}
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-purple-600 font-semibold">
                            {conn.originPerson.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {conn.originPerson.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          from {conn.originOwnerName}&apos;s account
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <Badge variant="secondary" className="text-xs">
                        {conn.originPerson.isAccountOwner
                          ? roleType === 'PARENT'
                            ? 'Teacher'
                            : 'Parent'
                          : roleType === 'PARENT'
                          ? 'Student'
                          : 'Kid'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveConnection(conn.connectionId, conn.originPerson.name);
                        }}
                        disabled={removeMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Unlink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Selected connection details */}
              {selectedConnectionId && (
                <div className="mt-6 border-t pt-6">
                  {isLoadingData ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  ) : connectionData ? (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <Eye className="h-5 w-5 text-purple-600" />
                        <h3 className="font-semibold text-lg">
                          {connectionData.originPerson.name}&apos;s Progress Today
                        </h3>
                        {connectionData.scopeMode === 'SELECTED' && (
                          <Badge variant="outline" className="text-xs">
                            Limited visibility
                          </Badge>
                        )}
                      </div>

                      {/* Routines with tasks */}
                      {connectionData.routines.length > 0 ? (
                        <div className="space-y-4">
                          {connectionData.routines.map((routine) => (
                            <div
                              key={routine.id}
                              className="border rounded-lg overflow-hidden"
                            >
                              <div
                                className="px-4 py-3 flex items-center gap-3"
                                style={{ backgroundColor: routine.color ? `${routine.color}20` : '#f3f4f6' }}
                              >
                                <span className="font-medium">{routine.name}</span>
                                <span className="text-sm text-gray-500">
                                  ({routine.tasks.filter((t) => t.isCompleted).length}/
                                  {routine.tasks.length} completed)
                                </span>
                              </div>
                              <div className="p-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                  {routine.tasks.map((task) => (
                                    <div
                                      key={task.id}
                                      className={`p-3 rounded-lg border transition-all ${
                                        task.isCompleted
                                          ? 'bg-green-50 border-green-200'
                                          : 'bg-gray-50 border-gray-200'
                                      }`}
                                    >
                                      <div className="flex items-start gap-3">
                                        {/* Task type indicator / checkbox */}
                                        <div className="flex-shrink-0 mt-0.5">
                                          {task.type === 'SIMPLE' ? (
                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                              task.isCompleted
                                                ? 'bg-green-500 border-green-500'
                                                : 'border-gray-300 bg-white'
                                            }`}>
                                              {task.isCompleted && <Check className="h-3 w-3 text-white" />}
                                            </div>
                                          ) : task.type === 'MULTIPLE_CHECKIN' ? (
                                            <div className={`w-5 h-5 rounded flex items-center justify-center ${
                                              task.isCompleted ? 'bg-blue-500' : 'bg-gray-200'
                                            }`}>
                                              <Hash className="h-3 w-3 text-white" />
                                            </div>
                                          ) : (
                                            <div className={`w-5 h-5 rounded flex items-center justify-center ${
                                              task.isCompleted ? 'bg-purple-500' : 'bg-gray-200'
                                            }`}>
                                              <TrendingUp className="h-3 w-3 text-white" />
                                            </div>
                                          )}
                                        </div>

                                        {/* Task content */}
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            {task.emoji && <span className="text-lg">{task.emoji}</span>}
                                            <span className={`text-sm font-medium truncate ${
                                              task.isCompleted ? 'text-green-700' : 'text-gray-700'
                                            }`}>
                                              {task.name}
                                            </span>
                                          </div>

                                          {/* Progress/completion display based on task type */}
                                          <div className="mt-2">
                                            {task.type === 'SIMPLE' ? (
                                              // Simple task: show completion time
                                              task.isCompleted && task.completions[0] ? (
                                                <p className="text-xs text-green-600">
                                                  ✓ Completed at {new Date(task.completions[0].completedAt).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                  })}
                                                </p>
                                              ) : (
                                                <p className="text-xs text-gray-400">Not completed</p>
                                              )
                                            ) : task.type === 'MULTIPLE_CHECKIN' ? (
                                              // Multiple check-in: show count with 9 circles
                                              <div className="flex items-center gap-2">
                                                <div className="flex gap-0.5">
                                                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                                                    <div
                                                      key={i}
                                                      className={`w-3 h-3 rounded-full ${
                                                        i <= (task.completionCount || 0)
                                                          ? 'bg-blue-500'
                                                          : 'bg-gray-200'
                                                      }`}
                                                    />
                                                  ))}
                                                </div>
                                                <span className="text-xs font-medium text-blue-600">
                                                  {task.completionCount || 0}x
                                                </span>
                                              </div>
                                            ) : (
                                              // Progress task: show total value
                                              <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                  <span className="text-xs font-semibold text-purple-600">
                                                    {task.totalValue || 0} {task.unit || 'units'}
                                                  </span>
                                                </div>
                                                {/* Progress bar visualization */}
                                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                  <div
                                                    className="h-full bg-purple-500 rounded-full transition-all"
                                                    style={{
                                                      width: `${Math.min(100, ((task.totalValue || 0) / 100) * 100)}%`
                                                    }}
                                                  />
                                                </div>
                                              </div>
                                            )}
                                          </div>

                                          {/* Show individual entries for progress tasks only */}
                                          {task.type === 'PROGRESS' && task.completions.length > 0 && (
                                            <div className="mt-2 pt-2 border-t border-gray-200">
                                              <p className="text-xs text-gray-500 mb-1">Recent entries:</p>
                                              <div className="flex flex-wrap gap-1">
                                                {task.completions.slice(0, 5).map((completion) => (
                                                  <span
                                                    key={completion.id}
                                                    className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700"
                                                    title={new Date(completion.completedAt).toLocaleString()}
                                                  >
                                                    +{completion.value || 0}
                                                  </span>
                                                ))}
                                                {task.completions.length > 5 && (
                                                  <span className="text-xs text-gray-400">
                                                    +{task.completions.length - 5} more
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500 border rounded-lg">
                          <p>No routines visible for this connection</p>
                          <p className="text-sm mt-1">
                            The account owner may have limited what you can see
                          </p>
                        </div>
                      )}

                      {/* Goals */}
                      {connectionData.goals.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-900">Goals</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {connectionData.goals.map((goal) => (
                              <div
                                key={goal.id}
                                className="p-4 rounded-lg border"
                                style={{ borderColor: goal.color || '#e5e7eb' }}
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xl">{goal.icon || '🎯'}</span>
                                  <span className="font-medium">{goal.name}</span>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-sm text-gray-600">
                                    <span>
                                      {goal.currentProgress} / {goal.target} {goal.unit}
                                    </span>
                                    <span>
                                      {Math.round((goal.currentProgress / goal.target) * 100)}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="h-2 rounded-full transition-all"
                                      style={{
                                        width: `${Math.min(100, (goal.currentProgress / goal.target) * 100)}%`,
                                        backgroundColor: goal.color || '#3b82f6',
                                      }}
                                    />
                                  </div>
                                  {goal.isAchieved && (
                                    <Badge variant="default" className="mt-2 bg-green-600">
                                      Achieved!
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>Unable to load connection data</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
