'use client';

import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Link2, Plus } from 'lucide-react';

interface CodeEntryProps {
  parentRoleId: string;
}

export function CodeEntry({ parentRoleId }: CodeEntryProps) {
  const [code, setCode] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newChildName, setNewChildName] = useState('');

  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Get list of parent's children
  const { data: persons, isLoading: personsLoading } = trpc.person.list.useQuery({
    roleId: parentRoleId
  });

  // Auto-select "create new" if there are no existing persons
  useEffect(() => {
    if (!personsLoading && persons && persons.length === 0) {
      setIsCreatingNew(true);
    }
  }, [persons, personsLoading]);

  const createPersonMutation = trpc.person.create.useMutation({
    onSuccess: () => {
      utils.person.list.invalidate();
      // Also invalidate the query that PersonList actually uses
      utils.personSharing.getAccessiblePersons.invalidate();
    },
    onError: (error) => {
      toast({
        title: 'Error creating child',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const connectMutation = trpc.connection.connect.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Connected to student successfully',
        variant: 'success',
      });
      utils.connection.listConnections.invalidate();
      setCode('');
      setSelectedPersonId('');
      setIsCreatingNew(false);
      setNewChildName('');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate 4-word code format (word-word-word-word)
    const codePattern = /^[a-z]+-[a-z]+-[a-z]+-[a-z]+$/;
    if (!code.trim() || !codePattern.test(code.trim())) {
      toast({
        title: 'Error',
        description: 'Connection code must be in format: word-word-word-word',
        variant: 'destructive',
      });
      return;
    }

    // If creating a new child, validate name
    if (isCreatingNew) {
      if (!newChildName.trim()) {
        toast({
          title: 'Error',
          description: 'Please enter a name for the new child',
          variant: 'destructive',
        });
        return;
      }

      // Create the new person first
      try {
        const newPerson = await createPersonMutation.mutateAsync({
          roleId: parentRoleId,
          name: newChildName.trim(),
          avatar: JSON.stringify({ emoji: '👤', color: '#FFB3BA' }),
        });

        // Verify person was created with an ID
        if (!newPerson || !newPerson.id) {
          toast({
            title: 'Error',
            description: 'Failed to create child. Please try again.',
            variant: 'destructive',
          });
          return;
        }

        // Then connect using the new person's ID
        connectMutation.mutate({
          code: code.trim(),
          parentRoleId,
          parentPersonId: newPerson.id,
        });
      } catch (error) {
        // Error already handled in mutation onError callback
        console.error('Failed to create person:', error);
        return;
      }
    } else {
      // Using existing child
      if (!selectedPersonId) {
        toast({
          title: 'Error',
          description: 'Please select which child this student represents',
          variant: 'destructive',
        });
        return;
      }

      connectMutation.mutate({
        code: code.trim(),
        parentRoleId,
        parentPersonId: selectedPersonId,
      });
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow lowercase letters and hyphens only
    const value = e.target.value.toLowerCase().replace(/[^a-z-]/g, '');
    setCode(value);
  };

  const parseAvatar = (avatar: string) => {
    try {
      return JSON.parse(avatar);
    } catch {
      return { emoji: '👤', color: '#FFB3BA' };
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Connect to Teacher&apos;s Student
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Connect your child to their teacher:</strong> Enter the 4-word code from your
              child&apos;s teacher to receive their classroom tasks at home.
            </p>
          </div>

          {/* Code Input */}
          <div>
            <Label htmlFor="code">Connection Code (4 words) *</Label>
            <Input
              id="code"
              type="text"
              value={code}
              onChange={handleCodeChange}
              placeholder="happy-turtle-jump-blue"
              className="mt-1 text-center text-lg font-mono"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Format: word-word-word-word (ask your child&apos;s teacher)
            </p>
          </div>

          {/* Child Selector */}
          <div>
            <Label>Which child is this for? *</Label>
            {personsLoading ? (
              <div className="text-center py-4 text-gray-500">Loading children...</div>
            ) : (
              <div className="mt-3 space-y-4">
                {/* Radio buttons to choose between existing or new */}
                <div className="space-y-3">
                  {persons && persons.length > 0 && (
                    <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="childOption"
                        checked={!isCreatingNew}
                        onChange={() => {
                          setIsCreatingNew(false);
                          setNewChildName('');
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">Match to existing child</div>
                        <p className="text-sm text-gray-500">Select a child you've already added</p>
                      </div>
                    </label>
                  )}

                  <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="childOption"
                      checked={isCreatingNew}
                      onChange={() => {
                        setIsCreatingNew(true);
                        setSelectedPersonId('');
                      }}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Create new child
                      </div>
                      <p className="text-sm text-gray-500">Add a new child and connect them</p>
                    </div>
                  </label>
                </div>

                {/* Show appropriate input based on selection */}
                {!isCreatingNew && persons && persons.length > 0 ? (
                  <div className="pl-7">
                    <Select
                      id="child"
                      value={selectedPersonId}
                      onChange={(e) => setSelectedPersonId(e.target.value)}
                      required
                    >
                      <option value="">Select a child...</option>
                      {persons.map((person: any) => {
                        const avatar = parseAvatar(person.avatar);
                        return (
                          <option key={person.id} value={person.id}>
                            {avatar.emoji} {person.name}
                          </option>
                        );
                      })}
                    </Select>
                  </div>
                ) : isCreatingNew ? (
                  <div className="pl-7">
                    <Input
                      type="text"
                      value={newChildName}
                      onChange={(e) => setNewChildName(e.target.value)}
                      placeholder="Enter child's name"
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      A new child will be created and connected
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={
              createPersonMutation.isPending ||
              connectMutation.isPending ||
              !code ||
              (!isCreatingNew && !selectedPersonId) ||
              (isCreatingNew && !newChildName.trim())
            }
          >
            {createPersonMutation.isPending ? (
              <>Creating child...</>
            ) : connectMutation.isPending ? (
              <>Connecting...</>
            ) : (
              <>
                <Link2 className="h-4 w-4 mr-2" />
                {isCreatingNew ? 'Create & Connect' : 'Connect to Teacher'}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
