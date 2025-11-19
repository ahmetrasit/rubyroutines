'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Target, Trophy, TrendingUp, Clock, Calendar, Pencil,
  Archive, CheckCircle2, Users, Link2, BarChart, Flame
} from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { GoalType, EntityStatus } from '@/lib/types/prisma-enums';
import { format, formatDistanceToNow } from 'date-fns';

interface GoalDetailModalProps {
  goal: any;
  onClose: () => void;
  onEdit?: () => void;
}

export function GoalDetailModal({ goal, onClose, onEdit }: GoalDetailModalProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch detailed progress history
  const { data: progressHistory } = trpc.goal.getProgress.useQuery(
    { goalId: goal.id },
    { enabled: !!goal.id && !!goal, retry: false, refetchOnWindowFocus: false }
  );

  // Calculate progress
  const progress = goal.progress || { current: 0, target: goal.target, percentage: 0, achieved: false };
  const progressPercentage = Math.min(100, (progress.current / progress.target) * 100);

  // Format value based on goal type
  const formatValue = (value: number) => {
    if (goal.type === GoalType.TIME_BASED) {
      const hours = Math.floor(value / 60);
      const minutes = value % 60;
      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }
    if (goal.type === GoalType.PERCENTAGE) {
      return `${value}%`;
    }
    return value.toString();
  };

  // Get goal type icon
  const getGoalIcon = () => {
    switch (goal.type) {
      case GoalType.STREAK:
        return TrendingUp;
      case GoalType.TIME_BASED:
        return Clock;
      default:
        return Target;
    }
  };

  const Icon = getGoalIcon();
  const isCompleted = progress.achieved || progressPercentage >= 100;
  const isArchived = goal.status === EntityStatus.INACTIVE;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: `${goal.color || '#3B82F6'}20` }}
              >
                <Icon className="h-6 w-6" style={{ color: goal.color || '#3B82F6' }} />
              </div>
              <div>
                <DialogTitle className="text-xl">{goal.name}</DialogTitle>
                {goal.description && (
                  <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {onEdit && !isArchived && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
              {isCompleted && (
                <Badge variant="success" className="ml-2">
                  <Trophy className="h-3 w-3 mr-1" />
                  Achieved
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="linked">Linked Items</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 p-4">
              {/* Progress Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Current Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {goal.type !== GoalType.STREAK ? (
                      <>
                        <div className="flex justify-between text-2xl font-bold">
                          <span>{formatValue(progress.current)}</span>
                          <span className="text-muted-foreground">/</span>
                          <span>{formatValue(progress.target)}</span>
                        </div>
                        <Progress value={progressPercentage} className="h-3" />
                        <p className="text-sm text-muted-foreground text-center">
                          {progressPercentage.toFixed(1)}% Complete
                        </p>
                      </>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Flame className="h-5 w-5 text-orange-500" />
                            <span className="text-xl font-bold">
                              {goal.currentStreak || 0} day streak
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Best streak: {goal.longestStreak || 0} days
                        </div>
                        {goal.lastAchievedAt && (
                          <div className="text-sm text-muted-foreground">
                            Last achieved: {formatDistanceToNow(new Date(goal.lastAchievedAt), { addSuffix: true })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Goal Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <p className="font-medium capitalize">
                        {goal.type.replace(/_/g, ' ').toLowerCase()}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Period:</span>
                      <p className="font-medium capitalize">{goal.period.toLowerCase()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Target:</span>
                      <p className="font-medium">
                        {goal.target} {goal.unit || 'units'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={isArchived ? 'secondary' : 'default'}>
                        {isArchived ? 'Archived' : 'Active'}
                      </Badge>
                    </div>
                    {goal.resetDay !== undefined && goal.resetDay !== null && (
                      <div>
                        <span className="text-muted-foreground">Reset Day:</span>
                        <p className="font-medium">Day {goal.resetDay}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Created:</span>
                      <p className="font-medium">
                        {format(new Date(goal.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Assigned To */}
              {(goal.personIds?.length > 0 || goal.groupIds?.length > 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Assigned To
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {goal.persons?.map((person: any) => (
                        <Badge key={person.id} variant="outline">
                          {person.name}
                        </Badge>
                      ))}
                      {goal.groups?.map((group: any) => (
                        <Badge key={group.id} variant="secondary">
                          {group.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Progress History Tab */}
            <TabsContent value="progress" className="space-y-4 p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart className="h-4 w-4" />
                    Progress History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {progressHistory && progressHistory.length > 0 ? (
                    <div className="space-y-2">
                      {progressHistory.map((record: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between py-2 border-b last:border-0"
                        >
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(record.date), 'MMM d, yyyy')}
                          </span>
                          <span className="font-medium">
                            {formatValue(record.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No progress history available
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Linked Items Tab */}
            <TabsContent value="linked" className="space-y-4 p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    Linked Routines
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {goal.routineLinks && goal.routineLinks.length > 0 ? (
                    <div className="space-y-2">
                      {goal.routineLinks.map((link: any) => (
                        <div
                          key={link.id}
                          className="flex items-center justify-between py-2 border-b last:border-0"
                        >
                          <span className="font-medium">{link.routine.name}</span>
                          <Badge variant="outline">
                            {link.routine._count?.tasks || 0} tasks
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No linked routines
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    Linked Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {goal.taskLinks && goal.taskLinks.length > 0 ? (
                    <div className="space-y-2">
                      {goal.taskLinks.map((link: any) => (
                        <div
                          key={link.id}
                          className="flex items-center justify-between py-2 border-b last:border-0"
                        >
                          <div>
                            <span className="font-medium">{link.task.name}</span>
                            <p className="text-xs text-muted-foreground">
                              {link.task.routine?.name}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {link.task.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No linked tasks
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Achievements Tab */}
            <TabsContent value="achievements" className="space-y-4 p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {goal.achievements && goal.achievements.length > 0 ? (
                    <div className="space-y-3">
                      {goal.achievements.map((achievement: any) => (
                        <div
                          key={achievement.id}
                          className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                        >
                          <Trophy className="h-5 w-5 text-yellow-600" />
                          <div className="flex-1">
                            <p className="font-medium">Goal Achieved!</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(achievement.achievedAt), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                          <Badge variant="success">
                            {formatValue(achievement.value)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No achievements yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}