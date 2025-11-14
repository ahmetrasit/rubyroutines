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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">{entityNamePlural}</h2>
        <Button size="md" onClick={() => setShowForm(true)}>
          <Plus className="h-5 w-5 mr-2" />
          Add {entityName}
        </Button>
      </div>

      {groups && groups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group: any) => (
            <GroupCard key={group.id} group={group} onSelect={onSelectGroup} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
          <p className="text-gray-600 mb-4 text-lg">No {entityNamePlural.toLowerCase()} yet</p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First {entityName}
          </Button>
        </div>
      )}

      {showForm && <GroupForm roleId={roleId} roleType={roleType} onClose={() => setShowForm(false)} />}
    </div>
  );
}
