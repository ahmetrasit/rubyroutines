'use client';

import { Button } from '@/components/ui/button';
import { Pencil, Trash2, CheckCircle, Link2, Users, Target, TrendingUp } from 'lucide-react';
import { useState, memo } from 'react';
import { PersonForm } from './person-form';
import { PersonCheckinModal } from './person-checkin-modal';
import { PersonConnectionModal } from '@/components/sharing/PersonConnectionModal';
import { TeacherBulkCheckin } from '@/components/classroom/teacher-bulk-checkin';
import { trpc } from '@/lib/trpc/client';
import { useAvatar } from '@/lib/hooks';
import { useDeleteMutation } from '@/lib/hooks';
import type { Person } from '@/lib/types/database';
import { RenderIconEmoji } from '@/components/ui/icon-emoji-picker';

interface PersonCardProps {
  person: Person;
  onSelect?: (person: Person) => void;
  classroomId?: string; // Optional: for teacher mode to handle classroom-specific removal
  roleId?: string; // Required for connection functionality
  roleType?: 'PARENT' | 'TEACHER'; // Required for connection functionality
  userId?: string; // Required for connection functionality
}

export const PersonCard = memo(function PersonCard({
  person,
  onSelect,
  classroomId,
  roleId,
  roleType,
  userId
}: PersonCardProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);
  const [showConnection, setShowConnection] = useState(false);
  const [showBulkCheckin, setShowBulkCheckin] = useState(false);
  const utils = trpc.useUtils();

  // Parse avatar data using custom hook
  const { color, emoji, backgroundColor } = useAvatar({
    avatarString: person.avatar,
    fallbackName: person.name,
  });

  // Darken color by reducing brightness
  const darkenColor = (hex: string, amount: number = 40) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - amount);
    const g = Math.max(0, ((num >> 8) & 0x00FF) - amount);
    const b = Math.max(0, (num & 0x0000FF) - amount);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  };

  const darkerColor = darkenColor(color, 40);

  const deleteMutation = trpc.person.delete.useMutation();
  const { mutate: deletePerson, isLoading: isDeleting } = useDeleteMutation(
    deleteMutation as any,
    {
      entityName: person.name,
      invalidateQueries: [
        () => utils.person.list.invalidate(),
      ],
    }
  );

  const removeMemberMutation = trpc.group.removeMember.useMutation();
  const { mutate: removeMember, isLoading: isRemoving } = useDeleteMutation(
    removeMemberMutation as any,
    {
      entityName: person.name,
      invalidateQueries: [
        () => utils.person.list.invalidate(),
        () => utils.group.getById.invalidate(),
      ],
    }
  );

  // Get person details with assignments for stats and group memberships for smart deletion
  const { data: personDetails } = trpc.person.getById.useQuery({ id: person.id });

  // Get goals for this person
  const { data: goals } = trpc.goal.list.useQuery(
    { roleId: roleId!, personId: person.id },
    { enabled: !!roleId && !!person.id }
  );

  // Get person connections to count connections
  const { data: outboundConnections } = trpc.personConnection.listAsOrigin.useQuery(
    { roleId: roleId!, originPersonId: person.id },
    { enabled: !!roleId && !!person.id }
  );

  // Get classroom details for bulk check-in
  const { data: classroom } = trpc.group.getById.useQuery(
    { id: classroomId! },
    { enabled: !!classroomId && person.isAccountOwner && roleType === 'TEACHER' }
  );

  const handleDelete = () => {
    // In teacher mode (classroom context), handle removal intelligently
    if (classroomId) {
      const groupMemberships = personDetails?.groupMembers || [];
      const isInMultipleClassrooms = groupMemberships.length > 1;

      if (isInMultipleClassrooms) {
        // Student is in multiple classrooms - just remove from this one
        if (confirm(`Remove ${person.name} from this classroom?\n\nNote: ${person.name} will remain in other classrooms.`)) {
          removeMember({ groupId: classroomId, personId: person.id });
        }
      } else {
        // Student is only in this classroom - archive them
        if (confirm(`Archive ${person.name}?\n\nThis is the only classroom for ${person.name}. They will be archived.`)) {
          deletePerson({ id: person.id });
        }
      }
    } else {
      // Parent mode or general deletion - archive as before
      if (confirm(`Are you sure you want to archive ${person.name}?`)) {
        deletePerson({ id: person.id });
      }
    }
  };

  const handleCheckIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowCheckin(true);
  };

  // FEATURE: Real-time counts and completion stats to be implemented
  const routineCount = personDetails?.assignments?.length || 0;
  const taskCount = personDetails?.assignments?.flatMap((a: any) => a.routine.tasks).length || 0;

  // Goal statistics - split by period (daily vs weekly)
  const activeGoals = goals?.filter(g => g.status === 'ACTIVE') || [];
  const dailyGoals = activeGoals.filter(g => g.period === 'DAILY');
  const weeklyGoals = activeGoals.filter(g => g.period === 'WEEKLY');

  const dailyAccomplished = dailyGoals.filter(g => g.progress?.achieved).length;
  const weeklyAccomplished = weeklyGoals.filter(g => g.progress?.achieved).length;

  // Calculate connection counts
  const classroomCount = personDetails?.groupMembers?.length || 0;
  const personConnectionCount = outboundConnections?.length || 0;

  // Build connection status text
  const connectionParts = [];
  if (personConnectionCount > 0) {
    connectionParts.push(`${personConnectionCount} connection${personConnectionCount !== 1 ? 's' : ''}`);
  }
  if (classroomCount > 0) {
    connectionParts.push(`${classroomCount} classroom${classroomCount !== 1 ? 's' : ''}`);
  }

  // Always show connection status
  let connectionStatus: string;
  if (connectionParts.length > 0) {
    connectionStatus = connectionParts.join(', ');
  } else {
    connectionStatus = 'No connections';
  }

  return (
    <>
      <div
        className="group relative rounded-xl bg-white p-4 shadow-md hover:shadow-lg transition-all cursor-pointer border border-gray-200 border-t-4"
        style={{ borderTopColor: color }}
        onClick={() => onSelect?.(person)}
      >
        {/* Avatar, Name, and Edit/Delete buttons */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0">
            <div
              className="h-14 w-14 rounded-full flex items-center justify-center text-2xl border-4"
              style={{ backgroundColor, borderColor: color }}
            >
              <RenderIconEmoji value={emoji} className="h-7 w-7" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 truncate">
              {person.name}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate font-medium mt-0.5">
              {connectionStatus}
            </p>
          </div>

          {/* Connection, Edit and Delete buttons */}
          <div className="flex gap-2 flex-shrink-0">
            {roleId && roleType && userId && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowConnection(true);
                }}
                className="px-3"
                title="Manage connections"
              >
                <Link2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setShowEdit(true);
              }}
              className="px-3"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            {!person.isAccountOwner && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                disabled={isDeleting || isRemoving}
                className="px-3 text-red-600 hover:text-red-700 hover:bg-red-50 border-gray-300 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Stats and Progress - Single row: Goals progress (flex-1), Routines (~40px), Tasks (~40px) */}
        <div className="flex items-center gap-2 mb-4">
          {/* Goals progress bars - flex-1 - Two stacked bars (daily and weekly) */}
          <div className="flex-1 flex flex-col gap-1">
            {/* Daily goals progress bar */}
            <div
              className="h-5 bg-gray-100 rounded-full overflow-hidden relative"
              style={{ border: `1px solid ${color}` }}
            >
              {dailyGoals.length > 0 ? (
                <>
                  <div className="h-full flex">
                    {[...dailyGoals]
                      .sort((a, b) => (b.progress?.achieved ? 1 : 0) - (a.progress?.achieved ? 1 : 0))
                      .map((goal, index) => (
                        <div
                          key={goal.id}
                          className="flex-1 transition-all"
                          style={{
                            backgroundColor: goal.progress?.achieved ? `${color}B3` : 'transparent',
                            borderRight: index < dailyGoals.length - 1 ? '1px solid white' : 'none'
                          }}
                        />
                      ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-medium text-gray-700">
                      Daily: {dailyAccomplished}/{dailyGoals.length}
                    </span>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <span className="text-[10px] text-gray-400">no daily goals</span>
                </div>
              )}
            </div>

            {/* Weekly goals progress bar */}
            <div
              className="h-5 bg-gray-100 rounded-full overflow-hidden relative"
              style={{ border: `1px solid ${color}` }}
            >
              {weeklyGoals.length > 0 ? (
                <>
                  <div className="h-full flex">
                    {[...weeklyGoals]
                      .sort((a, b) => (b.progress?.achieved ? 1 : 0) - (a.progress?.achieved ? 1 : 0))
                      .map((goal, index) => (
                        <div
                          key={goal.id}
                          className="flex-1 transition-all"
                          style={{
                            backgroundColor: goal.progress?.achieved ? `${color}B3` : 'transparent',
                            borderRight: index < weeklyGoals.length - 1 ? '1px solid white' : 'none'
                          }}
                        />
                      ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-medium text-gray-700">
                      Weekly: {weeklyAccomplished}/{weeklyGoals.length}
                    </span>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <span className="text-[10px] text-gray-400">no weekly goals</span>
                </div>
              )}
            </div>
          </div>

          {/* Routines count */}
          <div className="ml-2 flex flex-col items-center flex-shrink-0">
            <div className="text-lg font-bold text-gray-900">{routineCount}</div>
            <div className="text-xs text-gray-900">{routineCount === 1 ? 'Routine' : 'Routines'}</div>
          </div>

          {/* Tasks count */}
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="text-lg font-bold text-gray-900">{taskCount}</div>
            <div className="text-xs text-gray-900">{taskCount === 1 ? 'Task' : 'Tasks'}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 relative z-10">
          <Button
            size="sm"
            onClick={handleCheckIn}
            className="flex-1 text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: darkerColor }}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Check-in
          </Button>
          {/* WORKFLOW #2: Bulk check-in button for teachers in classroom context */}
          {person.isAccountOwner && roleType === 'TEACHER' && classroomId && (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowBulkCheckin(true);
              }}
              className="flex-1 text-white bg-purple-600 hover:bg-purple-700"
            >
              <Users className="h-4 w-4 mr-1" />
              Bulk Check-in
            </Button>
          )}
        </div>
      </div>

      {showEdit && (
        <PersonForm
          person={person}
          onClose={() => setShowEdit(false)}
        />
      )}

      {showCheckin && (
        <PersonCheckinModal
          personId={person.id}
          personName={person.name}
          isOpen={showCheckin}
          onClose={() => setShowCheckin(false)}
        />
      )}

      {showConnection && roleId && roleType && userId && (
        <PersonConnectionModal
          isOpen={showConnection}
          onClose={() => setShowConnection(false)}
          person={person}
          roleId={roleId}
          roleType={roleType}
          userId={userId}
        />
      )}

      {showBulkCheckin && classroomId && roleId && classroom && (
        <TeacherBulkCheckin
          classroomId={classroomId}
          classroomName={classroom.name}
          roleId={roleId}
          isOpen={showBulkCheckin}
          onClose={() => setShowBulkCheckin(false)}
        />
      )}
    </>
  );
});
