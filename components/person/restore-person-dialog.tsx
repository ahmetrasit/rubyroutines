'use client';

import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { EntityStatus } from '@/lib/types/prisma-enums';

interface RestorePersonDialogProps {
  roleId: string;
  onClose: () => void;
}

export function RestorePersonDialog({ roleId, onClose }: RestorePersonDialogProps) {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const { data: inactivePersons, isLoading } = trpc.person.list.useQuery({
    roleId,
    includeInactive: true,
  });

  const restoreMutation = trpc.person.restore.useMutation({
    onSuccess: (person) => {
      toast({
        title: 'Success',
        description: `${person.name} has been restored`,
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

  const inactive = inactivePersons?.filter((p: any) => p.status === EntityStatus.INACTIVE) || [];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Restore Archived People</DialogTitle>
          <DialogDescription>
            Select a person to restore from the archived list
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="text-center py-4 text-gray-500">Loading...</p>
        ) : inactive.length === 0 ? (
          <p className="text-center py-4 text-gray-500">No archived people</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {inactive.map((person: any) => (
              <div
                key={person.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {person.avatar ? (
                    <img
                      src={person.avatar}
                      alt={person.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center font-semibold text-gray-600">
                      {person.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{person.name}</p>
                    {person.archivedAt && (
                      <p className="text-sm text-gray-500">
                        Archived {new Date(person.archivedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => restoreMutation.mutate({ id: person.id })}
                  disabled={restoreMutation.isPending}
                >
                  Restore
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
