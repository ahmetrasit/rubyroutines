'use client';


import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { PersonForm } from './person-form';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';

interface PersonCardProps {
  person: any;
  onSelect?: (person: any) => void;
}

export function PersonCard({ person, onSelect }: PersonCardProps) {
  const [showEdit, setShowEdit] = useState(false);
  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Parse avatar data
  let avatarColor = '#FFB3BA'; // Default pastel pink
  let avatarEmoji = person.name.charAt(0).toUpperCase(); // Fallback to first letter

  if (person.avatar) {
    try {
      const parsed = JSON.parse(person.avatar);
      avatarColor = parsed.color || avatarColor;
      avatarEmoji = parsed.emoji || avatarEmoji;
    } catch {
      // If not JSON, it might be an old URL format - ignore
    }
  }

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
        className="group relative rounded-xl bg-white p-6 shadow-md hover:shadow-lg transition-all cursor-pointer border-t-4"
        style={{ borderTopColor: avatarColor }}
        onClick={() => onSelect?.(person)}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-shrink-0">
            <div
              className="h-16 w-16 rounded-full flex items-center justify-center text-3xl"
              style={{ backgroundColor: avatarColor + '20' }}
            >
              {avatarEmoji}
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
}
