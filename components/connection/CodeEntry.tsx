'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Link2 } from 'lucide-react';

interface CodeEntryProps {
  parentRoleId: string;
}

export function CodeEntry({ parentRoleId }: CodeEntryProps) {
  const [code, setCode] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState('');

  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Get list of parent's children
  const { data: persons, isLoading: personsLoading } = trpc.person.list.useQuery({
    roleId: parentRoleId
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
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPersonId) {
      toast({
        title: 'Error',
        description: 'Please select which child this student represents',
        variant: 'destructive',
      });
      return;
    }

    if (code.length !== 6) {
      toast({
        title: 'Error',
        description: 'Connection code must be 6 digits',
        variant: 'destructive',
      });
      return;
    }

    connectMutation.mutate({
      code,
      parentRoleId,
      parentPersonId: selectedPersonId,
    });
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
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
              <strong>Connect your child to their teacher:</strong> Enter the 6-digit code from your
              child&apos;s teacher to receive their classroom tasks at home.
            </p>
          </div>

          {/* Code Input */}
          <div>
            <Label htmlFor="code">6-Digit Connection Code *</Label>
            <Input
              id="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={code}
              onChange={handleCodeChange}
              placeholder="000000"
              maxLength={6}
              className="mt-1 text-center text-2xl font-mono tracking-widest"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Ask your child&apos;s teacher for this code
            </p>
          </div>

          {/* Child Selector */}
          <div>
            <Label htmlFor="child">Which child is this for? *</Label>
            {personsLoading ? (
              <div className="text-center py-4 text-gray-500">Loading children...</div>
            ) : persons && persons.length > 0 ? (
              <div className="mt-2 space-y-2">
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
                <p className="text-sm text-gray-500">
                  This links your child at home to the teacher&apos;s student record
                </p>
              </div>
            ) : (
              <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg mt-2">
                <p className="text-gray-500 text-sm">
                  Add a child first before connecting to a teacher
                </p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={connectMutation.isPending || !code || !selectedPersonId}
          >
            {connectMutation.isPending ? (
              <>Connecting...</>
            ) : (
              <>
                <Link2 className="h-4 w-4 mr-2" />
                Connect to Teacher
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
