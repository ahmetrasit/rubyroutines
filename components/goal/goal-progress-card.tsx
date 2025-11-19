'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Target, Trophy, TrendingUp, Clock, Hash, Percent,
  MoreVertical, Pencil, Archive, Eye, CheckCircle2, Flame
} from 'lucide-react';
import { GoalDetailModal } from './goal-detail-modal';
import { GoalType, EntityStatus } from '@/lib/types/prisma-enums';
import { cn } from '@/lib/utils';
import { AVATAR_COLORS } from '@/lib/constants/theme';

interface GoalProgressCardProps {
  goal: any;
  onEdit?: () => void;
  onDelete?: () => void;
  onComplete?: () => void;
}

export function GoalProgressCard({ goal, onEdit, onDelete, onComplete }: GoalProgressCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Get goal color (use first color from AVATAR_COLORS if not set)
  const goalColor = goal.color || AVATAR_COLORS[0];

  // Get icon based on goal type
  const getGoalIcon = () => {
    switch (goal.type) {
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

  const Icon = getGoalIcon();

  // Calculate progress
  const progress = goal.progress || { current: 0, target: goal.target, percentage: 0, achieved: false };
  const progressPercentage = Math.min(100, (progress.current / progress.target) * 100);

  // Format display value based on goal type
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

  // Check if goal is completed
  const isCompleted = progress.achieved || progressPercentage >= 100;
  const isArchived = goal.status === EntityStatus.INACTIVE;

  // Streak indicator for streak-type goals
  const hasStreak = goal.type === GoalType.STREAK && goal.currentStreak > 0;

  return (
    <>
      <Card
        className={cn(
          "relative overflow-hidden transition-all hover:shadow-lg cursor-pointer",
          isArchived && "opacity-60",
          isCompleted && "ring-2 ring-green-500"
        )}
        style={{
          borderTopWidth: '4px',
          borderTopColor: goalColor
        }}
        onClick={() => setShowDetails(true)}
      >
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${goalColor}20` }}
              >
                <Icon className="h-4 w-4" style={{ color: goalColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate">{goal.name}</h3>
                {goal.description && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {goal.description}
                  </p>
                )}
              </div>
            </div>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails(true);
                }}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                {onEdit && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }} className="text-red-600">
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Progress Section */}
          <div className="space-y-2">
            {/* Progress Bar */}
            {goal.type !== GoalType.STREAK ? (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatValue(progress.current)}</span>
                  <span>{formatValue(progress.target)}</span>
                </div>
                <Progress
                  value={progressPercentage}
                  className="h-2"
                  style={{
                    '--progress-background': `${goalColor}20`,
                    '--progress-foreground': goalColor
                  } as any}
                />
              </div>
            ) : (
              // Streak Display
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {hasStreak && (
                    <div className="flex items-center gap-1">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium">{goal.currentStreak} day streak</span>
                    </div>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  Best: {goal.longestStreak || 0} days
                </span>
              </div>
            )}

            {/* Status Badges */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                <Badge variant="outline" className="text-xs">
                  {goal.period.toLowerCase()}
                </Badge>
                {goal.unit && (
                  <Badge variant="outline" className="text-xs">
                    {goal.unit}
                  </Badge>
                )}
              </div>

              {/* Completion Badge */}
              {isCompleted && (
                <Badge className="text-xs" variant="success">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Achieved
                </Badge>
              )}
            </div>

            {/* Quick Complete Button (for applicable goal types) */}
            {!isCompleted && onComplete && goal.type === GoalType.COMPLETION_COUNT && (
              <Button
                size="sm"
                variant="outline"
                className="w-full mt-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onComplete();
                }}
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Mark Progress
              </Button>
            )}
          </div>
        </CardContent>

        {/* Achievement Indicator */}
        {isCompleted && (
          <div className="absolute top-2 right-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
          </div>
        )}
      </Card>

      {/* Detail Modal */}
      {showDetails && (
        <GoalDetailModal
          goal={goal}
          onClose={() => setShowDetails(false)}
          onEdit={onEdit}
        />
      )}
    </>
  );
}