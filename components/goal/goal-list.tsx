'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Target } from 'lucide-react';
import { GoalForm } from './goal-form';
import { GoalProgressBar } from './goal-progress-bar';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';

interface GoalListProps {
  roleId: string;
  personId?: string;
}

export function GoalList({ roleId, personId }: GoalListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const { data: goals, isLoading } = trpc.goal.list.useQuery(
    { roleId },
    { enabled: !!roleId }
  );

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

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingGoal(null);
  };

  // Filter goals for specific person if personId provided
  const filteredGoals = goals?.filter((goal) => {
    if (!personId) return true;
    return goal.personIds.includes(personId);
  }) || [];

  const activeGoals = filteredGoals.filter((g) => g.status === 'ACTIVE');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Goals</h2>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Goal
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading goals...</div>
      ) : activeGoals.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
          <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-2">No goals yet</p>
          <p className="text-sm text-gray-400 mb-4">Create goals to track your progress</p>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Goal
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {activeGoals.map((goal) => (
            <div
              key={goal.id}
              className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{goal.name}</h3>
                  {goal.description && (
                    <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                  )}
                  <div className="flex gap-2 mt-2 text-xs text-gray-500">
                    <span className="px-2 py-1 bg-gray-100 rounded capitalize">
                      {goal.period.toLowerCase()}
                    </span>
                    {goal.resetDay !== null && goal.resetDay !== undefined && (
                      <span className="px-2 py-1 bg-gray-100 rounded">
                        Resets: Day {goal.resetDay}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(goal)}
                    className="h-8 w-8 p-0"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(goal)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <GoalProgressBar goal={goal} />
            </div>
          ))}
        </div>
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
}
