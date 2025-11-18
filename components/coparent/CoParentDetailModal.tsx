'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc/client';
import { SharedPersonCard } from '@/components/person/SharedPersonCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Mail } from 'lucide-react';
import type { Person } from '@/lib/types/database';

interface CoParentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  coParent: any;
  roleId: string;
}

export function CoParentDetailModal({
  isOpen,
  onClose,
  coParent,
  roleId,
}: CoParentDetailModalProps) {
  // Get all persons for this role
  const { data: persons, isLoading } = trpc.person.list.useQuery(
    { roleId },
    { enabled: !!roleId && isOpen }
  );

  // Filter persons that are shared with this co-parent
  const sharedPersons = persons?.filter((person: any) =>
    coParent.personIds?.includes(person.id)
  ) || [];

  const getPermissionLabel = (permission: string) => {
    switch (permission) {
      case 'FULL_EDIT':
        return 'Full Edit Access';
      case 'TASK_COMPLETION':
        return 'Task Completion Access';
      case 'READ_ONLY':
        return 'Read-Only Access';
      default:
        return permission;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <div className="text-xl font-bold">
                {coParent.coParentUser?.name || 'Co-Parent'}
              </div>
              <div className="text-sm text-gray-600 font-normal">
                {coParent.coParentUser?.email}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Access Level */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-900">Access Level</p>
                <p className="text-lg font-semibold text-purple-700">
                  {getPermissionLabel(coParent.permissions)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-purple-900">Shared Members</p>
                <p className="text-lg font-semibold text-purple-700">
                  {sharedPersons.length}
                </p>
              </div>
            </div>
          </div>

          {/* Shared Members Grid */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Shared Members</h3>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-64" />
                ))}
              </div>
            ) : sharedPersons.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">No members shared with this co-parent</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sharedPersons.map((person: Person) => (
                  <SharedPersonCard
                    key={person.id}
                    person={person}
                    onClick={() => {
                      // Read-only view - could navigate to person detail in read-only mode
                      console.log('View shared person details:', person);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> These are read-only views of members shared with{' '}
              {coParent.coParentUser?.name || 'this co-parent'}. They can view task
              completion status and analytics based on their access level.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
