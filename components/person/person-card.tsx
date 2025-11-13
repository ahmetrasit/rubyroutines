'use client';

import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { useState, memo } from 'react';
import { PersonForm } from './person-form';
import { trpc } from '@/lib/trpc/client';
import { useAvatar } from '@/lib/hooks';
import { useDeleteMutation } from '@/lib/hooks';
import type { Person } from '@/lib/types/database';

interface PersonCardProps {
  person: Person;
  onSelect?: (person: Person) => void;
}

export const PersonCard = memo(function PersonCard({ person, onSelect }: PersonCardProps) {
  const [showEdit, setShowEdit] = useState(false);
  const utils = trpc.useUtils();

  // Parse avatar data using custom hook
  const { color, emoji, backgroundColor } = useAvatar({
    avatarString: person.avatar,
    fallbackName: person.name,
  });

  const deleteMutation = trpc.person.delete.useMutation();
  const { mutate: deletePerson, isLoading: isDeleting } = useDeleteMutation(
    deleteMutation,
    {
      entityName: person.name,
      invalidateQueries: [() => utils.person.list.invalidate()],
    }
  );

  const handleDelete = () => {
    if (confirm(`Are you sure you want to archive ${person.name}?`)) {
      deletePerson({ id: person.id });
    }
  };

  return (
    <>
      <div
        className="group relative rounded-xl bg-white p-6 shadow-md hover:shadow-lg transition-all cursor-pointer border-t-4"
        style={{ borderTopColor: color }}
        onClick={() => onSelect?.(person)}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-shrink-0">
            <div
              className="h-16 w-16 rounded-full flex items-center justify-center text-3xl"
              style={{ backgroundColor }}
            >
              {emoji}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-xl text-gray-900 truncate">{person.name}</h3>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              setShowEdit(true);
            }}
            className="flex-1"
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
          {person.name !== 'Me' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
            >
              <Trash2 className="h-4 w-4" />
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
    </>
  );
});
