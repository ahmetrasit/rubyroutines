'use client';

import { trpc } from '@/lib/trpc/client';
import { PersonCard } from './person-card';
import { SharedPersonCard } from './SharedPersonCard';
import { CoParentCard } from '@/components/coparent/CoParentCard';
import { Button } from '@/components/ui/button';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useCallback, useMemo, memo } from 'react';
import { PersonForm } from './person-form';
import { SharePersonModal } from '@/components/sharing/SharePersonModal';
import { KioskCodeManager } from '@/components/kiosk/kiosk-code-manager';
import { CoParentDetailModal } from '@/components/coparent/CoParentDetailModal';
import type { Person } from '@/lib/types/database';
import { getTierLimit, type ComponentTierLimits } from '@/lib/services/tier-limits';
import { CacheInspector } from '@/components/debug/cache-inspector';

interface PersonListProps {
  roleId: string;
  userName: string;
  effectiveLimits?: ComponentTierLimits | null;
  onSelectPerson?: (person: Person) => void;
  userId?: string;
  roleType?: 'PARENT' | 'TEACHER';
}

export const PersonList = memo(function PersonList({
  roleId,
  userName,
  effectiveLimits = null,
  onSelectPerson,
  userId,
  roleType
}: PersonListProps) {
  const [showForm, setShowForm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [kioskCollapsed, setKioskCollapsed] = useState(true); // Collapsed by default
  const [selectedCoParent, setSelectedCoParent] = useState<any>(null);

  // Event handlers with useCallback
  const handleOpenForm = useCallback(() => setShowForm(true), []);
  const handleCloseForm = useCallback(() => setShowForm(false), []);
  const handleOpenShareModal = useCallback(() => setShowShareModal(true), []);
  const handleCloseShareModal = useCallback(() => setShowShareModal(false), []);
  const handleToggleKiosk = useCallback(() => setKioskCollapsed(prev => !prev), []);
  const handleSelectCoParent = useCallback((coParent: any) => setSelectedCoParent(coParent), []);
  const handleCloseCoParentModal = useCallback(() => setSelectedCoParent(null), []);

  const { data: persons, isLoading } = trpc.person.list.useQuery(
    { roleId },
    {
      enabled: !!roleId,
      staleTime: 5 * 60 * 1000, // 5 minutes - person data rarely changes
      gcTime: 10 * 60 * 1000, // 10 minutes cache
    }
  );

  const { data: coParents, error: coParentsError } = trpc.coParent.list.useQuery(
    { roleId },
    {
      enabled: !!roleId,
      retry: false,
    }
  );

  // Log co-parent errors if they occur (but don't break the UI)
  if (coParentsError) {
    console.warn('Co-parent feature not available:', coParentsError.message);
  }

  // Get shared persons using the personSharing API
  const { data: accessiblePersons, isLoading: isLoadingAccessible, error: accessiblePersonsError } = trpc.personSharing.getAccessiblePersons.useQuery(
    { roleId },
    {
      enabled: !!roleId,
      retry: false,
    }
  );

  // Log person sharing errors if they occur (but don't break the UI)
  if (accessiblePersonsError) {
    console.warn('Person sharing feature not available:', accessiblePersonsError.message);
  }

  // IMPORTANT: All useMemo hooks MUST be called before any conditional returns
  // to maintain consistent hook order between renders

  // Combine owned and shared persons with useMemo
  const allAccessiblePersons = useMemo(() => [
    ...(accessiblePersons?.ownedPersons || []),
    ...(accessiblePersons?.sharedPersons || [])
  ], [accessiblePersons]);

  // Separate adults (Me) from children with useMemo
  const adults = useMemo(() =>
    accessiblePersons?.ownedPersons?.filter((person) => person.isAccountOwner) || [],
    [accessiblePersons]
  );

  const ownedChildren = useMemo(() =>
    accessiblePersons?.ownedPersons?.filter((person) => !person.isAccountOwner) || [],
    [accessiblePersons]
  );

  // Get shared children separately with useMemo
  const sharedChildren = useMemo(() =>
    accessiblePersons?.sharedPersons?.filter((person) => !person.isAccountOwner) || [],
    [accessiblePersons]
  );

  // Early return for loading state - AFTER all hooks
  if (isLoading || isLoadingAccessible) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  // Check tier limits using effective limits from database
  const childLimit = getTierLimit(effectiveLimits, 'children_per_family');
  const currentChildCount = ownedChildren.length;
  const canAddChild = currentChildCount < childLimit;

  const coParentLimit = getTierLimit(effectiveLimits, 'co_parents');
  const currentCoParentCount = coParents?.length || 0;
  const canAddCoParent = currentCoParentCount < coParentLimit;

  return (
    <div className="space-y-8">
      <CacheInspector roleId={roleId} />
      {/* Row 1: Family Group Kiosk Code - Collapsible */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={handleToggleKiosk}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Me person card */}
          {adults.map((person) => (
            <PersonCard
              key={person.id}
              person={person}
              onSelect={onSelectPerson}
              roleId={roleId}
              roleType={roleType}
              userId={userId}
            />
          ))}

          {/* Co-Parent cards */}
          {coParents && coParents.map((coParent: any) => (
            <CoParentCard
              key={coParent.id}
              coParent={coParent}
              roleId={roleId}
              onSelect={() => handleSelectCoParent(coParent)}
            />
          ))}

          {/* Add Co-Parent placeholder card */}
          <button
            onClick={canAddCoParent ? handleOpenShareModal : undefined}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Owned child cards */}
          {ownedChildren.map((person) => (
            <PersonCard
              key={person.id}
              person={person}
              onSelect={onSelectPerson}
              roleId={roleId}
              roleType={roleType}
              userId={userId}
            />
          ))}

          {/* Shared child cards */}
          {sharedChildren.map((person) => (
            <SharedPersonCard
              key={person.id}
              person={{
                id: person.id,
                name: person.name,
                avatar: person.avatar ?? undefined,
                isShared: person.isShared,
                sharedBy: person.sharedBy ?? undefined,
                sharedByImage: person.sharedByImage ?? undefined,
                permissions: person.permissions,
              }}
              onClick={() => onSelectPerson?.(person as Person)}
            />
          ))}

          {/* Add Member placeholder card */}
          <button
            onClick={canAddChild ? handleOpenForm : undefined}
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

      {showForm && <PersonForm roleId={roleId} onClose={handleCloseForm} />}

      {showShareModal && (
        <SharePersonModal
          isOpen={showShareModal}
          onClose={handleCloseShareModal}
          roleId={roleId}
          roleType="PARENT"
          persons={ownedChildren.map(p => ({
            id: p.id,
            name: p.name,
            avatar: p.avatar ?? undefined,
          }))}
        />
      )}

      {selectedCoParent && (
        <CoParentDetailModal
          isOpen={!!selectedCoParent}
          onClose={handleCloseCoParentModal}
          coParent={selectedCoParent}
          roleId={roleId}
        />
      )}
    </div>
  );
});
