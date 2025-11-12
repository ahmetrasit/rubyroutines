'use client';

import { Person } from '@prisma/client';
import { Card } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { PersonForm } from './person-form';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';

interface PersonCardProps {
  person: Person;
  onSelect?: (person: Person) => void;
}

export function PersonCard({ person, onSelect }: PersonCardProps) {
  const [showEdit, setShowEdit] = useState(false);
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const deleteMutation = trpc.person.delete.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: `${person.name} has been archived`,
        variant: 'success',
      });
      utils.person.list.invalidate();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleDelete = () => {
    if (confirm(`Are you sure you want to archive ${person.name}?`)) {
      deleteMutation.mutate({ id: person.id });
    }
  };

  return (
    <>
      <div
        className="group relative rounded-lg border bg-white p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => onSelect?.(person)}
      >
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            {person.avatar ? (
              <img
                src={person.avatar}
                alt={person.name}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-xl font-semibold text-gray-600">
                {person.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{person.name}</h3>
            {person.birthDate && (
              <p className="text-sm text-gray-500">
                {new Date(person.birthDate).toLocaleDateString()}
              </p>
            )}
          </div>

          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setShowEdit(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
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
          </div>
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
}
