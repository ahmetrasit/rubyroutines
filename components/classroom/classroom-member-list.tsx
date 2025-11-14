'use client';

import { trpc } from '@/lib/trpc/client';
import { PersonCard } from '@/components/person/person-card';
import { Button } from '@/components/ui/button';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { PersonForm } from '@/components/person/person-form';
import { KioskCodeManager } from '@/components/kiosk/kiosk-code-manager';
import type { Person } from '@/lib/types/database';

interface ClassroomMemberListProps {
  classroomId: string;
  roleId: string;
  onSelectPerson?: (person: Person) => void;
}

export function ClassroomMemberList({ classroomId, roleId, onSelectPerson }: ClassroomMemberListProps) {
  const [showForm, setShowForm] = useState(false);
  const [invisibleRoutineCollapsed, setInvisibleRoutineCollapsed] = useState(true);
  const [kioskCollapsed, setKioskCollapsed] = useState(true);

  // Get classroom members
  const { data: classroom, isLoading } = trpc.group.getById.useQuery(
    { id: classroomId },
    { enabled: !!classroomId }
  );

  // Get all persons for this role
  const { data: persons } = trpc.person.list.useQuery(
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

  // Get member IDs from classroom
  const memberIds = classroom?.members?.map((m: any) => m.personId) || [];

  // Filter persons who are members of this classroom
  const members = persons?.filter(p => memberIds.includes(p.id)) || [];

  // Separate teachers (Me) from students
  const teachers = members.filter((person) => person.name === 'Me');
  const students = members.filter((person) => person.name !== 'Me');

  // Check if this is the Teacher-Only classroom (should not allow adding students)
  const isTeacherOnlyClassroom = classroom?.name === 'Teacher-Only';

  return (
    <div className="space-y-8">
      {/* Row 1: Invisible Routine List - Collapsible */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setInvisibleRoutineCollapsed(!invisibleRoutineCollapsed)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👻</span>
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">Invisible Routines</h3>
              <p className="text-sm text-gray-500">hidden routines for this classroom</p>
            </div>
          </div>
          {invisibleRoutineCollapsed ? (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {!invisibleRoutineCollapsed && (
          <div className="px-6 pb-6 border-t border-gray-100">
            <div className="py-4 text-center text-gray-500 text-sm">
              No invisible routines yet
            </div>
          </div>
        )}
      </div>

      {/* Row 2: Classroom Kiosk Code - Collapsible */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setKioskCollapsed(!kioskCollapsed)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🔐</span>
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">Classroom Kiosk Code</h3>
              <p className="text-sm text-gray-500">for all students in one screen</p>
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
            <KioskCodeManager />
          </div>
        )}
      </div>

      {/* Row 3: Teachers and Co-Teachers */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Teacher cards */}
          {teachers.map((person) => (
            <PersonCard key={person.id} person={person} onSelect={onSelectPerson} />
          ))}

          {/* Add Co-Teacher placeholder card */}
          <button
            onClick={() => {
              // TODO: Open co-teacher invitation dialog
              alert('Co-teacher invitation feature coming soon!');
            }}
            className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-blue-400 hover:bg-blue-50/50 transition-all flex flex-col items-center justify-center min-h-[200px] group"
          >
            <div className="w-16 h-16 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center mb-3 transition-colors">
              <Plus className="h-8 w-8 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
            <span className="text-gray-600 group-hover:text-blue-600 font-medium transition-colors">
              Add Co-Teacher
            </span>
            <span className="text-sm text-gray-400 mt-1">invite a co-teacher to collaborate</span>
          </button>
        </div>
      </div>

      {/* Row 4+: Students */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Student cards */}
          {students.map((person) => (
            <PersonCard key={person.id} person={person} onSelect={onSelectPerson} />
          ))}

          {/* Add Student placeholder card - only show if not Teacher-Only classroom */}
          {!isTeacherOnlyClassroom && (
            <button
              onClick={() => setShowForm(true)}
              className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-blue-400 hover:bg-blue-50/50 transition-all flex flex-col items-center justify-center min-h-[200px] group"
            >
              <div className="w-16 h-16 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center mb-3 transition-colors">
                <Plus className="h-8 w-8 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
              <span className="text-gray-600 group-hover:text-blue-600 font-medium transition-colors">
                Add Student
              </span>
              <span className="text-sm text-gray-400 mt-1">add a student to this classroom</span>
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <PersonForm
          roleId={roleId}
          classroomId={classroomId}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
