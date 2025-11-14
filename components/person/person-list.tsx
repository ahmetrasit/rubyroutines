'use client';

import { trpc } from '@/lib/trpc/client';
import { PersonCard } from './person-card';
import { Button } from '@/components/ui/button';
import { Plus, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { PersonForm } from './person-form';
import { RestorePersonDialog } from './restore-person-dialog';
import type { Person } from '@/lib/types/database';

interface PersonListProps {
  roleId: string;
  onSelectPerson?: (person: Person) => void;
}

export function PersonList({ roleId, onSelectPerson }: PersonListProps) {
  const [showForm, setShowForm] = useState(false);
  const [showRestore, setShowRestore] = useState(false);

  const { data: persons, isLoading } = trpc.person.list.useQuery(
    { roleId },
    { enabled: !!roleId }
  );
  const { data: allPersons } = trpc.person.list.useQuery(
    { roleId, includeInactive: true },
    { enabled: !!roleId }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const hasInactive = (allPersons?.length ?? 0) > (persons?.length ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">People</h2>
        <div className="flex gap-2">
          {hasInactive && (
            <Button variant="outline" size="sm" onClick={() => setShowRestore(true)}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restore
            </Button>
          )}
          <Button size="md" onClick={() => setShowForm(true)}>
            <Plus className="h-5 w-5 mr-2" />
            Add Child
          </Button>
        </div>
      </div>

      {persons && persons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {persons.map((person) => (
            <PersonCard key={person.id} person={person} onSelect={onSelectPerson} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
          <p className="text-gray-600 mb-4 text-lg">No children yet</p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Child
          </Button>
        </div>
      )}

      {showForm && <PersonForm roleId={roleId} onClose={() => setShowForm(false)} />}

      {showRestore && (
        <RestorePersonDialog roleId={roleId} onClose={() => setShowRestore(false)} />
      )}
    </div>
  );
}
