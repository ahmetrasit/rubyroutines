'use client';

import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Check } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';

interface ForkModalProps {
  isOpen: boolean;
  onClose: () => void;
  marketplaceItem: {
    id: string;
    name: string;
    type: 'ROUTINE' | 'GOAL';
  };
  roleId: string;
}

export function ForkModal({ isOpen, onClose, marketplaceItem, roleId }: ForkModalProps) {
  const [selectedPersons, setSelectedPersons] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [importSuccess, setImportSuccess] = useState(false);
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const { data: persons } = trpc.person.list.useQuery(
    { roleId },
    { enabled: isOpen }
  );

  const { data: groups } = trpc.group.list.useQuery(
    { roleId },
    { enabled: isOpen }
  );

  const forkMutation = trpc.marketplace.fork.useMutation({
    onSuccess: () => {
      setImportSuccess(true);
      toast({
        title: 'Success',
        description: `${marketplaceItem.type === 'ROUTINE' ? 'Routine' : 'Goal'} imported successfully`,
        variant: 'success',
      });
      utils.routine.list.invalidate();
      utils.goal.list.invalidate();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleClose = () => {
    setSelectedPersons([]);
    setSelectedGroups([]);
    setImportSuccess(false);
    onClose();
  };

  const handleTogglePerson = (personId: string) => {
    setSelectedPersons((prev) =>
      prev.includes(personId)
        ? prev.filter((id) => id !== personId)
        : [...prev, personId]
    );
  };

  const handleToggleGroup = (groupId: string) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleImport = async () => {
    const targets = [
      ...selectedPersons.map((id) => ({ id, type: 'PERSON' as const })),
      ...selectedGroups.map((id) => ({ id, type: 'GROUP' as const })),
    ];

    if (targets.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one person or group',
        variant: 'destructive',
      });
      return;
    }

    // Import to each selected target
    for (const target of targets) {
      await forkMutation.mutateAsync({
        itemId: marketplaceItem.id,
        roleId,
        targetId: target.id,
        targetType: target.type,
      });
    }
  };

  const totalSelected = selectedPersons.length + selectedGroups.length;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {importSuccess ? 'Import Successful!' : 'Import to'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {importSuccess
                    ? `${marketplaceItem.name} has been added`
                    : `Select who should get "${marketplaceItem.name}"`}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {!importSuccess ? (
              <>
                {/* Persons Section */}
                {persons && persons.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Individuals ({persons.length})
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                      {persons.map((person: any) => (
                        <label
                          key={person.id}
                          className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedPersons.includes(person.id)}
                            onChange={() => handleTogglePerson(person.id)}
                          />
                          <div className="flex items-center gap-2">
                            {person.avatarUrl && (
                              <img
                                src={person.avatarUrl}
                                alt={person.name}
                                className="w-6 h-6 rounded-full"
                              />
                            )}
                            <span className="text-sm font-medium text-gray-900">
                              {person.name}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Groups Section */}
                {groups && groups.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Groups ({groups.length})
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                      {groups.map((group: any) => (
                        <label
                          key={group.id}
                          className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedGroups.includes(group.id)}
                            onChange={() => handleToggleGroup(group.id)}
                          />
                          <div className="flex items-center gap-2">
                            {group.icon && (
                              <span className="text-lg">{group.icon}</span>
                            )}
                            <div>
                              <span className="text-sm font-medium text-gray-900">
                                {group.name}
                              </span>
                              <span className="text-xs text-gray-500 ml-2">
                                ({group._count?.members || 0} members)
                              </span>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* No persons or groups message */}
                {(!persons || persons.length === 0) &&
                  (!groups || groups.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No individuals or groups found.</p>
                      <p className="text-sm mt-2">
                        Please create a person or group first.
                      </p>
                    </div>
                  )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button onClick={handleClose} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={totalSelected === 0 || forkMutation.isPending}
                    className="flex-1"
                  >
                    {forkMutation.isPending
                      ? 'Importing...'
                      : `Import to ${totalSelected} ${totalSelected === 1 ? 'target' : 'targets'}`}
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Success State */}
                <div className="py-8 text-center">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-gray-600 mb-6">
                    The {marketplaceItem.type.toLowerCase()} has been added to{' '}
                    {totalSelected} {totalSelected === 1 ? 'target' : 'targets'}.
                  </p>
                </div>

                {/* Done Button */}
                <div className="flex justify-center pt-4 border-t">
                  <Button onClick={handleClose} className="px-8">
                    Done
                  </Button>
                </div>
              </>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
