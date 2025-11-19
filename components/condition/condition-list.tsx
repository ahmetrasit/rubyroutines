'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  GitBranch, Plus, MoreVertical, Pencil, Trash2,
  Clock, Calendar, Target, CheckCircle, XCircle, Eye
} from 'lucide-react';
import { ConditionForm } from './condition-form';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import { ConditionOperator, TimeOperator } from '@/lib/types/prisma-enums';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ConditionListProps {
  routineId: string;
}

interface SortableConditionProps {
  condition: any;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (enabled: boolean) => void;
}

function SortableCondition({ condition, onEdit, onDelete, onToggle }: SortableConditionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: condition.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Format condition check for display
  const formatCheck = (check: any) => {
    let text = '';

    if (check.targetTaskId) {
      text = `Task "${check.targetTask?.name || 'Unknown'}"`;
    } else if (check.targetRoutineId) {
      text = `Routine "${check.targetRoutine?.name || 'Unknown'}"`;
    } else if (check.targetGoalId) {
      text = `Goal "${check.targetGoal?.name || 'Unknown'}"`;
    } else if (check.timeOperator) {
      text = `Time ${check.timeOperator.toLowerCase()} ${check.timeValue}`;
    }

    switch (check.operator) {
      case ConditionOperator.TASK_COMPLETED:
        text += ' is completed';
        break;
      case ConditionOperator.TASK_NOT_COMPLETED:
        text += ' is not completed';
        break;
      case ConditionOperator.TASK_COUNT_GT:
        text += ` count > ${check.value}`;
        break;
      case ConditionOperator.ROUTINE_PERCENT_GT:
        text += ` completion > ${check.value}%`;
        break;
      case ConditionOperator.GOAL_ACHIEVED:
        text += ' is achieved';
        break;
      default:
        text += ` ${check.operator}`;
    }

    return check.negate ? `NOT (${text})` : text;
  };

  // Get icon for condition type
  const getCheckIcon = (check: any) => {
    if (check.timeOperator) return Clock;
    if (check.dayOfWeek && check.dayOfWeek.length > 0) return Calendar;
    if (check.targetGoalId) return Target;
    return CheckCircle;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border rounded-lg p-4 space-y-3"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div
            {...attributes}
            {...listeners}
            className="cursor-move p-1 hover:bg-gray-100 rounded"
          >
            <svg
              className="h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8h16M4 16h16"
              />
            </svg>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">
                {condition.name || `Condition ${condition.id.slice(0, 8)}`}
              </h4>
              <Badge variant={condition.controlsRoutine ? 'default' : 'secondary'}>
                {condition.controlsRoutine ? 'Controls Visibility' : 'Task Control'}
              </Badge>
              <Badge variant="outline">
                {condition.logic}
              </Badge>
            </div>

            {condition.description && (
              <p className="text-sm text-muted-foreground">{condition.description}</p>
            )}

            {/* Condition Checks */}
            <div className="space-y-1">
              {condition.checks?.map((check: any, index: number) => {
                const Icon = getCheckIcon(check);
                return (
                  <div key={check.id} className="flex items-center gap-2 text-sm">
                    <Icon className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {index > 0 && <span className="font-medium mr-1">{condition.logic}</span>}
                      {formatCheck(check)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={condition.enabled !== false}
            onCheckedChange={onToggle}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

export function ConditionList({ routineId }: ConditionListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingCondition, setEditingCondition] = useState<any>(null);
  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Fetch conditions for the routine
  const { data: conditions, isLoading } = trpc.condition.list.useQuery(
    { routineId },
    { enabled: !!routineId }
  );

  // Delete mutation
  const deleteMutation = trpc.condition.delete.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Condition deleted successfully',
        variant: 'success',
      });
      utils.condition.list.invalidate();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update mutation for toggling enabled status
  const updateMutation = trpc.condition.update.useMutation({
    onSuccess: () => {
      utils.condition.list.invalidate();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleEdit = (condition: any) => {
    setEditingCondition(condition);
    setShowForm(true);
  };

  const handleDelete = (condition: any) => {
    if (confirm('Are you sure you want to delete this condition?')) {
      deleteMutation.mutate({ id: condition.id });
    }
  };

  const handleToggle = (condition: any, enabled: boolean) => {
    updateMutation.mutate({
      id: condition.id,
      enabled,
    });
  };

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id && conditions) {
      const oldIndex = conditions.findIndex((c) => c.id === active.id);
      const newIndex = conditions.findIndex((c) => c.id === over.id);

      // Update order locally (you would need to implement a backend endpoint for this)
      const newOrder = arrayMove(conditions, oldIndex, newIndex);
      // TODO: Call API to persist new order
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Loading conditions...</p>
        </CardContent>
      </Card>
    );
  }

  const hasConditions = conditions && conditions.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Conditions
          </CardTitle>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Condition
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {hasConditions ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={conditions.map(c => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {conditions.map((condition) => (
                  <SortableCondition
                    key={condition.id}
                    condition={condition}
                    onEdit={() => handleEdit(condition)}
                    onDelete={() => handleDelete(condition)}
                    onToggle={(enabled) => handleToggle(condition, enabled)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
            <GitBranch className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">No conditions yet</p>
            <p className="text-sm text-gray-400 mb-4">
              Add conditions to control when this routine is visible
            </p>
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Condition
            </Button>
          </div>
        )}

        {/* Condition Form Dialog */}
        {showForm && (
          <ConditionForm
            routineId={routineId}
            condition={editingCondition}
            onClose={() => {
              setShowForm(false);
              setEditingCondition(null);
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}