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
        className="group relative rounded-lg border bg-white p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => onSelect?.(person)}
      >
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <div
              className="h-14 w-14 rounded-full flex items-center justify-center text-2xl shadow-sm"
              style={{ backgroundColor: avatarColor }}
            >
              {avatarEmoji}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{person.name}</h3>
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
