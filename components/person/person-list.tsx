'use client';

import { trpc } from '@/lib/trpc/client';
import { PersonCard } from './person-card';
import { SharedPersonCard } from './SharedPersonCard';
import { Button } from '@/components/ui/button';
import { Plus, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { PersonForm } from './person-form';
import { RestorePersonDialog } from './restore-person-dialog';
import { SharePersonModal } from '@/components/sharing/SharePersonModal';
import { KioskCodeManager } from '@/components/kiosk/kiosk-code-manager';
import type { Person } from '@/lib/types/database';
import { getTierLimit, type ComponentTierLimits } from '@/lib/services/tier-limits';

interface PersonListProps {
  roleId: string;
  userName: string;
  effectiveLimits?: ComponentTierLimits | null;
  onSelectPerson?: (person: Person) => void;
}

export function PersonList({ roleId, userName, effectiveLimits = null, onSelectPerson }: PersonListProps) {
  const [showForm, setShowForm] = useState(false);
  const [showRestore, setShowRestore] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [kioskCollapsed, setKioskCollapsed] = useState(true); // Collapsed by default

  const { data: persons, isLoading } = trpc.person.list.useQuery(
    { roleId },
    { enabled: !!roleId }
  );
  const { data: allPersons } = trpc.person.list.useQuery(
    { roleId, includeInactive: true },
    { enabled: !!roleId }
  );

  const { data: coParents } = trpc.coParent.list.useQuery(
    { roleId },
    {
      enabled: !!roleId,
      retry: false,
      onError: (error) => {
        // Silently handle co-parent errors if the feature is not set up yet
        console.warn('Co-parent feature not available:', error.message);
      }
    }
  );

  // Get shared persons using the personSharing API
  const { data: accessiblePersons } = trpc.personSharing.getAccessiblePersons.useQuery(
    { roleId },
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

  // Combine owned and shared persons
  const allAccessiblePersons = [
    ...(accessiblePersons?.ownedPersons || []),
    ...(accessiblePersons?.sharedPersons || [])
  ];

  // Separate adults (Me) from children - for owned persons only
  const adults = persons?.filter((person) => person.name === 'Me') || [];
  const ownedChildren = persons?.filter((person) => person.name !== 'Me') || [];

  // Get shared children separately
  const sharedChildren = accessiblePersons?.sharedPersons?.filter(
    (person) => person.name !== 'Me'
  ) || [];

  // Check tier limits using effective limits from database
  const childLimit = getTierLimit(effectiveLimits, 'children_per_family');
  const currentChildCount = ownedChildren.length;
  const canAddChild = currentChildCount < childLimit;

  const coParentLimit = getTierLimit(effectiveLimits, 'co_parents');
  const currentCoParentCount = coParents?.length || 0;
  const canAddCoParent = currentCoParentCount < coParentLimit;

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
            <KioskCodeManager roleId={roleId} userName={userName} />
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
            onClick={canAddCoParent ? () => setShowShareModal(true) : undefined}
            className={`border-2 border-dashed rounded-xl p-6 transition-all flex flex-col items-center justify-center min-h-[200px] group ${
              canAddCoParent
                ? 'border-gray-300 hover:border-purple-400 hover:bg-purple-50/50 cursor-pointer'
                : 'border-gray-200 bg-gray-50 cursor-not-allowed'
            }`}
          >
            {canAddCoParent ? (
              <>
                <div className="w-16 h-16 rounded-full bg-gray-100 group-hover:bg-purple-100 flex items-center justify-center mb-3 transition-colors">
                  <Plus className="h-8 w-8 text-gray-400 group-hover:text-purple-600 transition-colors" />
                </div>
                <span className="text-gray-600 group-hover:text-purple-600 font-medium transition-colors">
                  Add Co-Parent
                </span>
                <span className="text-sm text-gray-400 mt-1">Invite a co-parent to collaborate</span>
              </>
            ) : (
              <>
                <div className="text-2xl mb-2">🔒</div>
                <span className="text-sm font-medium text-gray-500">Upgrade to add</span>
                <span className="text-sm text-gray-400">new co-parents</span>
                <span className="text-xs text-gray-400 mt-1">({currentCoParentCount}/{coParentLimit})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Row 3: Children */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Owned child cards */}
          {ownedChildren.map((person) => (
            <PersonCard key={person.id} person={person} onSelect={onSelectPerson} />
          ))}

          {/* Shared child cards */}
          {sharedChildren.map((person) => (
            <SharedPersonCard
              key={person.id}
              person={person}
              onClick={() => onSelectPerson?.(person as Person)}
            />
          ))}

          {/* Add Member placeholder card */}
          <button
            onClick={canAddChild ? () => setShowForm(true) : undefined}
            className={`border-2 border-dashed rounded-xl p-6 transition-all flex flex-col items-center justify-center min-h-[200px] group ${
              canAddChild
                ? 'border-gray-300 hover:border-purple-400 hover:bg-purple-50/50 cursor-pointer'
                : 'border-gray-200 bg-gray-50 cursor-not-allowed'
            }`}
          >
            {canAddChild ? (
              <>
                <div className="w-16 h-16 rounded-full bg-gray-100 group-hover:bg-purple-100 flex items-center justify-center mb-3 transition-colors">
                  <Plus className="h-8 w-8 text-gray-400 group-hover:text-purple-600 transition-colors" />
                </div>
                <span className="text-gray-600 group-hover:text-purple-600 font-medium transition-colors">
                  Add Member
                </span>
                <span className="text-sm text-gray-400 mt-1">add a family member</span>
              </>
            ) : (
              <>
                <div className="text-2xl mb-2">🔒</div>
                <span className="text-sm font-medium text-gray-500">Upgrade to add</span>
                <span className="text-sm text-gray-400">new members</span>
                <span className="text-xs text-gray-400 mt-1">({currentChildCount}/{childLimit})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {showForm && <PersonForm roleId={roleId} onClose={() => setShowForm(false)} />}

      {showRestore && (
        <RestorePersonDialog roleId={roleId} onClose={() => setShowRestore(false)} />
      )}

      {showShareModal && (
        <SharePersonModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          roleId={roleId}
          roleType="PARENT"
          persons={ownedChildren}
        />
      )}
    </div>
  );
}
