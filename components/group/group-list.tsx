'use client';

import { trpc } from '@/lib/trpc/client';
import { GroupCard } from './group-card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { GroupForm } from './group-form';

interface GroupListProps {
  roleId: string;
  roleType: 'PARENT' | 'TEACHER';
  onSelectGroup?: (group: any) => void;
}

export function GroupList({ roleId, roleType, onSelectGroup }: GroupListProps) {
  const [showForm, setShowForm] = useState(false);

  const { data: groups, isLoading } = trpc.group.list.useQuery({ roleId });

  const isTeacherMode = roleType === 'TEACHER';
  const entityName = isTeacherMode ? 'Classroom' : 'Group';
  const entityNamePlural = isTeacherMode ? 'Classrooms' : 'Groups';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Existing classroom cards */}
        {groups && groups.map((group: any) => (
          <GroupCard key={group.id} group={group} onSelect={onSelectGroup} />
        ))}

        {/* Add Classroom placeholder card */}
        <button
          onClick={() => setShowForm(true)}
          className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-blue-400 hover:bg-blue-50/50 transition-all flex flex-col items-center justify-center min-h-[200px] group"
        >
          <div className="w-16 h-16 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center mb-3 transition-colors">
            <Plus className="h-8 w-8 text-gray-400 group-hover:text-blue-600 transition-colors" />
          </div>
          <span className="text-gray-600 group-hover:text-blue-600 font-medium transition-colors">
            Add {entityName}
          </span>
          <span className="text-sm text-gray-400 mt-1">
            {isTeacherMode ? 'create a new classroom' : 'create a new group'}
          </span>
        </button>
      </div>

      {showForm && <GroupForm roleId={roleId} roleType={roleType} onClose={() => setShowForm(false)} />}
    </div>
  );
}
