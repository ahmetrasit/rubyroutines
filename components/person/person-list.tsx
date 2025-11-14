'use client';

import { trpc } from '@/lib/trpc/client';
import { PersonCard } from './person-card';
import { Button } from '@/components/ui/button';
import { Plus, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { PersonForm } from './person-form';
import { RestorePersonDialog } from './restore-person-dialog';
import { KioskCodeManager } from '@/components/kiosk/kiosk-code-manager';
import type { Person } from '@/lib/types/database';

interface PersonListProps {
  roleId: string;
  onSelectPerson?: (person: Person) => void;
}

export function PersonList({ roleId, onSelectPerson }: PersonListProps) {
  const [showForm, setShowForm] = useState(false);
  const [showRestore, setShowRestore] = useState(false);
  const [kioskCollapsed, setKioskCollapsed] = useState(true); // Collapsed by default

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

  // Separate adults (Me) from children
  const adults = persons?.filter((person) => person.name === 'Me') || [];
  const children = persons?.filter((person) => person.name !== 'Me') || [];

  return (
    <div className="space-y-8">
      {/* Row 1: Family Group Kiosk Code - Collapsible */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setKioskCollapsed(!kioskCollapsed)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏠</span>
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">Family Kiosk Code</h3>
              <p className="text-sm text-gray-500">for all members in one screen</p>
            </div>
          </div>
          {kioskCollapsed ? (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {!kioskCollapsed && (
          <div className="px-6 pb-6 border-t border-gray-100">
            <KioskCodeManager roleId={roleId} />
          </div>
        )}
      </div>

      {/* Row 2: Adults (Parent and Co-Parent) */}
      <div className="space-y-4">
        {hasInactive && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowRestore(true)}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restore
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Me person card */}
          {adults.map((person) => (
            <PersonCard key={person.id} person={person} onSelect={onSelectPerson} />
          ))}

          {/* Add Co-Parent placeholder card */}
          <button
            onClick={() => {
              // TODO: Open co-parent invitation dialog
              alert('Co-parent invitation feature coming soon!');
            }}
            className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-purple-400 hover:bg-purple-50/50 transition-all flex flex-col items-center justify-center min-h-[200px] group"
          >
            <div className="w-16 h-16 rounded-full bg-gray-100 group-hover:bg-purple-100 flex items-center justify-center mb-3 transition-colors">
              <Plus className="h-8 w-8 text-gray-400 group-hover:text-purple-600 transition-colors" />
            </div>
            <span className="text-gray-600 group-hover:text-purple-600 font-medium transition-colors">
              Add Co-Parent
            </span>
            <span className="text-sm text-gray-400 mt-1">Invite a co-parent to collaborate</span>
          </button>
        </div>
      </div>

      {/* Row 3: Children */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Child cards */}
          {children.map((person) => (
            <PersonCard key={person.id} person={person} onSelect={onSelectPerson} />
          ))}

          {/* Add Member placeholder card */}
          <button
            onClick={() => setShowForm(true)}
            className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-purple-400 hover:bg-purple-50/50 transition-all flex flex-col items-center justify-center min-h-[200px] group"
          >
            <div className="w-16 h-16 rounded-full bg-gray-100 group-hover:bg-purple-100 flex items-center justify-center mb-3 transition-colors">
              <Plus className="h-8 w-8 text-gray-400 group-hover:text-purple-600 transition-colors" />
            </div>
            <span className="text-gray-600 group-hover:text-purple-600 font-medium transition-colors">
              Add Member
            </span>
            <span className="text-sm text-gray-400 mt-1">add a family member</span>
          </button>
        </div>
      </div>

      {showForm && <PersonForm roleId={roleId} onClose={() => setShowForm(false)} />}

      {showRestore && (
        <RestorePersonDialog roleId={roleId} onClose={() => setShowRestore(false)} />
      )}
    </div>
  );
}
