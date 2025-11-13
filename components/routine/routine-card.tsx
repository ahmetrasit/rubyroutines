'use client';

import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { RoutineForm } from './routine-form';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import { isRoutineVisible, formatVisibilityDescription } from '@/lib/services/visibility-rules';
import { getResetDescription } from '@/lib/services/reset-period';

type RoutineWithRelations = {
  id: string;
  name: string;
  description?: string;
  resetPeriod: string;
  resetDay?: number;
  tasks: any[];
  assignments: Array<{ person: any }>;
  _count: { tasks: number };
};

interface RoutineCardProps {
  routine: RoutineWithRelations;
  onSelect?: (routine: RoutineWithRelations) => void;
}

export function RoutineCard({ routine, onSelect }: RoutineCardProps) {
  const [showEdit, setShowEdit] = useState(false);
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const deleteMutation = trpc.routine.delete.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: `${routine.name} has been archived`,
        variant: 'success',
      });
      utils.routine.list.invalidate();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleDelete = () => {
    if (confirm(`Are you sure you want to archive "${routine.name}"?`)) {
      deleteMutation.mutate({ id: routine.id });
    }
  };

  const visible = isRoutineVisible(routine);
  const taskCount = routine._count?.tasks || routine.tasks.length;

  return (
    <>
      <div
        className={`group relative rounded-xl border bg-white p-6 shadow-md hover:shadow-lg transition-all cursor-pointer ${
          !visible ? 'opacity-60' : ''
        }`}
        onClick={() => onSelect?.(routine)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg truncate">{routine.name}</h3>
              {!visible && <EyeOff className="h-4 w-4 text-gray-400" />}
            </div>

            {routine.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {routine.description}
              </p>
            )}

            <div className="flex flex-wrap gap-2 mt-3 text-xs text-gray-500">
              <span className="px-2 py-1 bg-gray-100 rounded">
                {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
              </span>
              <span className="px-2 py-1 bg-gray-100 rounded">
                {getResetDescription(routine.resetPeriod, routine.resetDay)}
              </span>
              <span className="px-2 py-1 bg-gray-100 rounded">
                {formatVisibilityDescription(routine)}
              </span>
            </div>

            {routine.assignments.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {routine.assignments.map((assignment) => (
                  <span
                    key={assignment.person.id}
                    className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded"
                  >
                    {assignment.person.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setShowEdit(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {showEdit && <RoutineForm routine={routine} onClose={() => setShowEdit(false)} />}
    </>
  );
}
