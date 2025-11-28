'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, Target, Trophy, Filter, TrendingUp, Clock, Percent, Hash } from 'lucide-react';
import { GoalForm } from './goal-form';
import { GoalProgressCard } from './goal-progress-card';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import { getTierLimit, ComponentTierLimits } from '@/lib/services/tier-limits';
import { EntityStatus, GoalType } from '@/lib/types/prisma-enums';
import { Skeleton } from '@/components/ui/skeleton';

interface GoalListProps {
  roleId: string;
  personId?: string;
  groupId?: string;
  effectiveLimits?: ComponentTierLimits | null;
}

export const GoalList = memo(function GoalList({ roleId, personId, groupId, effectiveLimits = null }: GoalListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'archived'>('active');
  const [typeFilter, setTypeFilter] = useState<GoalType | 'all'>('all');
  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Event handlers with useCallback
  const handleOpenForm = useCallback(() => setShowForm(true), []);
  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setEditingGoal(null);
  }, []);
  const handleEditGoal = useCallback((goal: any) => {
    setEditingGoal(goal);
    setShowForm(true);
  }, []);

  // Fetch goals with progress
  const { data: goals, isLoading } = trpc.goal.list.useQuery(
    {
      roleId,
      personId,
      groupId,
      includeInactive: statusFilter === 'all' || statusFilter === 'archived'
    },
    {
      enabled: !!roleId,
      staleTime: 2 * 60 * 1000, // 2 minutes - goals update moderately
      gcTime: 10 * 60 * 1000, // 10 minutes cache
    }
  );

  // Filter goals based on status and type
  const filteredGoals = useMemo(() => {
    if (!goals) return [];

    return goals.filter(goal => {
      // Status filter
      if (statusFilter === 'active' && goal.status !== EntityStatus.ACTIVE) return false;
      if (statusFilter === 'completed' && goal.progress?.achieved) return true;
      if (statusFilter === 'archived' && goal.status === EntityStatus.INACTIVE) return true;

      // Type filter
      if (typeFilter !== 'all' && goal.type !== typeFilter) return false;

      return true;
    });
  }, [goals, statusFilter, typeFilter]);

  // Group goals by type
  const groupedGoals = useMemo(() => {
    const grouped: Record<GoalType, typeof filteredGoals> = {
      [GoalType.COMPLETION_COUNT]: [],
      [GoalType.STREAK]: [],
      [GoalType.TIME_BASED]: [],
      [GoalType.VALUE_BASED]: [],
      [GoalType.PERCENTAGE]: [],
    };

    filteredGoals.forEach(goal => {
      if (grouped[goal.type]) {
        grouped[goal.type].push(goal);
      }
    });

    return grouped;
  }, [filteredGoals]);

  const deleteMutation = trpc.goal.archive.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Goal archived successfully',
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

  const handleDelete = (goal: any) => {
    if (confirm(`Are you sure you want to archive "${goal.name}"?`)) {
      deleteMutation.mutate({ id: goal.id });
    }
  };

  const handleEdit = (goal: any) => {
    setEditingGoal(goal);
    setShowForm(true);
  };

  const activeGoals = filteredGoals.filter((g) => g.status === EntityStatus.ACTIVE);

  // Check tier limits
  const goalLimit = getTierLimit(effectiveLimits, 'goals');
  const currentGoalCount = activeGoals.length;
  const canAddGoal = currentGoalCount < goalLimit;

  const hasGoals = goals && goals.length > 0;

  // Get icon for goal type
  const getGoalIcon = (type: GoalType) => {
    switch (type) {
      case GoalType.COMPLETION_COUNT:
        return Hash;
      case GoalType.STREAK:
        return TrendingUp;
      case GoalType.TIME_BASED:
        return Clock;
      case GoalType.PERCENTAGE:
        return Percent;
      default:
        return Target;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Goals</h2>
          {hasGoals && (
            <span className="text-sm text-muted-foreground">
              ({filteredGoals.length} {filteredGoals.length === 1 ? 'goal' : 'goals'})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasGoals && (
            <>
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>

              {/* Type Filter */}
              <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value={GoalType.COMPLETION_COUNT}>Completion</SelectItem>
                  <SelectItem value={GoalType.STREAK}>Streak</SelectItem>
                  <SelectItem value={GoalType.TIME_BASED}>Time-based</SelectItem>
                  <SelectItem value={GoalType.VALUE_BASED}>Value-based</SelectItem>
                  <SelectItem value={GoalType.PERCENTAGE}>Percentage</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}

          {canAddGoal ? (
            <Button onClick={() => setShowForm(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Goal
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled>
              Upgrade to add goals
            </Button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      ) : hasGoals ? (
        typeFilter === 'all' ? (
          // Show grouped by type
          Object.entries(groupedGoals).map(([type, typeGoals]) => {
            if (typeGoals.length === 0) return null;
            const Icon = getGoalIcon(type as GoalType);

            return (
              <div key={type} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-muted-foreground capitalize">
                    {type.replace(/_/g, ' ').toLowerCase()}
                  </h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {typeGoals.map(goal => (
                    <GoalProgressCard
                      key={goal.id}
                      goal={goal}
                      onEdit={() => handleEdit(goal)}
                      onDelete={() => handleDelete(goal)}
                    />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          // Show filtered goals
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredGoals.map(goal => (
              <GoalProgressCard
                key={goal.id}
                goal={goal}
                onEdit={() => handleEdit(goal)}
                onDelete={() => handleDelete(goal)}
              />
            ))}
          </div>
        )
      ) : (
        // Empty state
        <Card className="p-12">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-primary/10 p-4">
                <Trophy className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold">No goals yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first goal to start tracking progress
              </p>
            </div>
            {canAddGoal ? (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Goal
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Upgrade your plan to add goals
              </p>
            )}
          </div>
        </Card>
      )}

      {showForm && (
        <GoalForm
          roleId={roleId}
          goal={editingGoal}
          personId={personId}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
});
