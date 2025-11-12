'use client';

import { trpc } from '@/lib/trpc/client';
import { RoutineCard } from './routine-card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { RoutineForm } from './routine-form';
import { Routine, Task, Person } from '@prisma/client';

type RoutineWithRelations = Routine & {
  tasks: Task[];
  assignments: Array<{ person: Person }>;
  _count: { tasks: number };
};

interface RoutineListProps {
  roleId?: string;
  personId?: string;
  onSelectRoutine?: (routine: RoutineWithRelations) => void;
}

export function RoutineList({ roleId, personId, onSelectRoutine }: RoutineListProps) {
  const [showForm, setShowForm] = useState(false);

  const { data: routines, isLoading } = trpc.routine.list.useQuery({
    roleId,
    personId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Routines</h2>
        {roleId && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Routine
          </Button>
        )}
      </div>

      {routines && routines.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {routines.map((routine) => (
            <RoutineCard
              key={routine.id}
              routine={routine}
              onSelect={onSelectRoutine}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-gray-500 mb-4">No routines yet</p>
          {roleId && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Routine
            </Button>
          )}
        </div>
      )}

      {showForm && roleId && (
        <RoutineForm
          roleId={roleId}
          personIds={personId ? [personId] : []}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
