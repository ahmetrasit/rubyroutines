'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { trpc } from '@/lib/trpc/client';
import {
  Target,
  Users,
  Trophy,
  Flame,
  Filter,
  ChevronRight,
  Award,
  TrendingUp,
  Clock
} from 'lucide-react';
import { GoalType, GoalScope } from '@/lib/types/prisma-enums';

interface ClassroomGoalOverviewProps {
  roleId: string;
  persons: Array<{ id: string; name: string; status: string }>;
}

export function ClassroomGoalOverview({ roleId, persons }: ClassroomGoalOverviewProps) {
  const [filterType, setFilterType] = useState<GoalType | 'ALL'>('ALL');
  const [filterScope, setFilterScope] = useState<GoalScope | 'ALL'>('ALL');
  const [selectedPersonId, setSelectedPersonId] = useState<string>('ALL');

  // Fetch goals with progress
  const { data: goals, isLoading } = trpc.goal.list.useQuery(
    { roleId },
    { enabled: !!roleId }
  );

  // Filter goals based on selections
  const filteredGoals = goals?.filter(goal => {
    if (filterType !== 'ALL' && goal.type !== filterType) return false;
    if (filterScope !== 'ALL' && goal.scope !== filterScope) return false;
    if (selectedPersonId !== 'ALL' && !goal.personIds?.includes(selectedPersonId)) return false;
    return true;
  }) || [];

  // Group goals by scope
  const groupGoals = filteredGoals.filter(g => g.scope === 'GROUP');
  const individualGoals = filteredGoals.filter(g => g.scope === 'INDIVIDUAL');
  const roleGoals = filteredGoals.filter(g => g.scope === 'ROLE');

  const getGoalIcon = (type: GoalType) => {
    switch (type) {
      case 'STREAK':
        return <Flame className="h-4 w-4 text-orange-500" />;
      case 'COMPLETION_COUNT':
        return <Target className="h-4 w-4 text-blue-500" />;
      case 'TIME_BASED':
        return <Clock className="h-4 w-4 text-purple-500" />;
      case 'PERCENTAGE':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      default:
        return <Trophy className="h-4 w-4 text-gray-500" />;
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const GoalCard = ({ goal }: { goal: any }) => {
    const progress = goal.progress || 0;
    const percentage = Math.min(100, Math.round((progress / goal.target) * 100));

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {getGoalIcon(goal.type)}
              <CardTitle className="text-base">{goal.name}</CardTitle>
            </div>
            <Badge variant={percentage >= 100 ? 'success' : 'outline'}>
              {percentage >= 100 ? 'Achieved!' : `${percentage}%`}
            </Badge>
          </div>
          {goal.description && (
            <CardDescription className="mt-1 text-sm">
              {goal.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium">
                  {progress} / {goal.target} {goal.unit || ''}
                </span>
              </div>
              <Progress value={percentage} className={getProgressColor(percentage)} />
            </div>

            {goal.scope === 'INDIVIDUAL' && goal.personIds?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {goal.personIds.slice(0, 3).map((personId: string) => {
                  const person = persons.find(p => p.id === personId);
                  return person ? (
                    <Badge key={personId} variant="secondary" className="text-xs">
                      {person.name}
                    </Badge>
                  ) : null;
                })}
                {goal.personIds.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{goal.personIds.length - 3} more
                  </Badge>
                )}
              </div>
            )}

            {goal.streakEnabled && goal.currentStreak > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="font-medium">{goal.currentStreak} day streak</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">
                  {goal.type.replace('_', ' ')}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {goal.period}
                </Badge>
              </div>
              <Button variant="ghost" size="sm">
                View Details
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
            <p className="mt-2 text-gray-500">Loading classroom goals...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Goal Type</label>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
              >
                <option value="ALL">All Types</option>
                <option value="COMPLETION_COUNT">Completion Count</option>
                <option value="STREAK">Streak</option>
                <option value="TIME_BASED">Time Based</option>
                <option value="PERCENTAGE">Percentage</option>
                <option value="VALUE_BASED">Value Based</option>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Scope</label>
              <Select
                value={filterScope}
                onChange={(e) => setFilterScope(e.target.value as any)}
              >
                <option value="ALL">All Scopes</option>
                <option value="INDIVIDUAL">Individual</option>
                <option value="GROUP">Group</option>
                <option value="ROLE">Entire Class</option>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Student</label>
              <Select
                value={selectedPersonId}
                onChange={(e) => setSelectedPersonId(e.target.value)}
              >
                <option value="ALL">All Students</option>
                {persons.map(person => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Group Goals */}
      {groupGoals.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-blue-500" />
            <h2 className="text-xl font-semibold">Classroom Goals</h2>
            <Badge variant="secondary">{groupGoals.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupGoals.map(goal => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        </div>
      )}

      {/* Individual Goals */}
      {individualGoals.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-green-500" />
            <h2 className="text-xl font-semibold">Individual Student Goals</h2>
            <Badge variant="secondary">{individualGoals.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {individualGoals.map(goal => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        </div>
      )}

      {/* Role Goals */}
      {roleGoals.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Award className="h-5 w-5 text-purple-500" />
            <h2 className="text-xl font-semibold">All Students Goals</h2>
            <Badge variant="secondary">{roleGoals.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roleGoals.map(goal => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredGoals.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg mb-2">No goals found</p>
            <p className="text-gray-400 text-sm">
              {filterType !== 'ALL' || filterScope !== 'ALL' || selectedPersonId !== 'ALL'
                ? 'Try adjusting your filters'
                : 'Create your first classroom goal to get started'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}