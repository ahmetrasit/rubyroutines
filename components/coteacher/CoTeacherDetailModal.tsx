'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc/client';
import { SharedPersonCard } from '@/components/person/SharedPersonCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Mail } from 'lucide-react';
import type { Person } from '@/lib/types/database';

interface CoTeacherDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  coTeacher: any;
  groupId: string;
}

export function CoTeacherDetailModal({
  isOpen,
  onClose,
  coTeacher,
  groupId,
}: CoTeacherDetailModalProps) {
  // Get classroom details
  const { data: classroom, isLoading: isLoadingClassroom } = trpc.group.getById.useQuery(
    { id: groupId },
    { enabled: !!groupId && isOpen }
  );

  // Get all persons for the co-teacher's role to see what they can access
  const { data: persons, isLoading: isLoadingPersons } = trpc.person.list.useQuery(
    { roleId: coTeacher.ownerRoleId },
    { enabled: !!coTeacher.ownerRoleId && isOpen }
  );

  const isLoading = isLoadingClassroom || isLoadingPersons;

  // Get member IDs from the shared classroom
  const memberMap = new Map(classroom?.members?.map((m: any) => [m.personId, true]) || []);

  // Filter persons who are members of this shared classroom
  const sharedStudents = persons?.filter((p: Person) =>
    memberMap.has(p.id) && !p.isAccountOwner
  ) || [];

  const getPermissionLabel = (permission: string) => {
    switch (permission) {
      case 'FULL_EDIT':
        return 'Full Edit Access';
      case 'EDIT_TASKS':
        return 'Task Edit Access';
      case 'VIEW':
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
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-xl font-bold">
                {coTeacher.coTeacherRole?.user?.name || 'Co-Teacher'}
              </div>
              <div className="text-sm text-gray-600 font-normal">
                {coTeacher.coTeacherRole?.user?.email}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Access Level */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">Access Level</p>
                <p className="text-lg font-semibold text-blue-700">
                  {getPermissionLabel(coTeacher.permissions)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-blue-900">Shared Classroom</p>
                <p className="text-lg font-semibold text-blue-700">
                  {classroom?.name || 'Loading...'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-blue-900">Shared Students</p>
                <p className="text-lg font-semibold text-blue-700">
                  {sharedStudents.length}
                </p>
              </div>
            </div>
          </div>

          {/* Shared Students Grid */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Shared Students</h3>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-64" />
                ))}
              </div>
            ) : sharedStudents.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">No students shared with this co-teacher</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sharedStudents.map((person: Person) => (
                  <SharedPersonCard
                    key={person.id}
                    person={person}
                    onClick={() => {
                      // Read-only view - could navigate to person detail in read-only mode
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> These are read-only views of students shared with{' '}
              {coTeacher.coTeacherRole?.user?.name || 'this co-teacher'}. They can view task
              completion status and analytics based on their access level.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
