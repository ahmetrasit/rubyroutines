'use client';

import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link2, School, User, Unlink } from 'lucide-react';

interface ConnectionListProps {
  parentRoleId: string;
}

export function ConnectionList({ parentRoleId }: ConnectionListProps) {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const { data: connections, isLoading } = trpc.connection.listConnections.useQuery({
    parentRoleId
  });

  const disconnectMutation = trpc.connection.disconnect.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Disconnected from teacher successfully',
        variant: 'success',
      });
      utils.connection.listConnections.invalidate();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleDisconnect = (connectionId: string, studentName: string) => {
    if (confirm(`Are you sure you want to disconnect from ${studentName}?`)) {
      disconnectMutation.mutate({ connectionId });
    }
  };

  const parseAvatar = (avatar: string) => {
    try {
      return JSON.parse(avatar);
    } catch {
      return { emoji: '👤', color: '#FFB3BA' };
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">Loading connections...</div>
        </CardContent>
      </Card>
    );
  }

  if (!connections || connections.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Connected Students
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
            <Link2 className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 mb-2">No connections yet</p>
            <p className="text-sm text-gray-400">
              Connect to your child&apos;s teacher to see their classroom tasks
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Connected Students ({connections.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {connections.map((connection: any) => {
            const parentPersonAvatar = parseAvatar(connection.parentPerson.avatar);
            const studentPersonAvatar = parseAvatar(connection.studentPerson.avatar);

            return (
              <div
                key={connection.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                {/* Connection Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                      style={{ backgroundColor: parentPersonAvatar.color + '20' }}
                    >
                      {parentPersonAvatar.emoji}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {connection.parentPerson.name}
                      </h3>
                      <p className="text-sm text-gray-600">Your child at home</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      handleDisconnect(connection.id, connection.studentPerson.name)
                    }
                  >
                    <Unlink className="h-4 w-4 mr-1" />
                    Disconnect
                  </Button>
                </div>

                {/* Connection Arrow */}
                <div className="flex items-center justify-center mb-4">
                  <div className="flex items-center gap-2 text-blue-600">
                    <div className="h-px w-16 bg-blue-300"></div>
                    <Link2 className="h-5 w-5" />
                    <div className="h-px w-16 bg-blue-300"></div>
                  </div>
                </div>

                {/* Student Info */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                      style={{ backgroundColor: studentPersonAvatar.color + '20' }}
                    >
                      {studentPersonAvatar.emoji}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {connection.studentPerson.name}
                      </h4>
                      <p className="text-sm text-gray-600">Student in teacher&apos;s classroom</p>
                    </div>
                  </div>

                  {/* Teacher Info */}
                  <div className="flex items-center gap-2 text-sm text-gray-700 bg-white rounded-lg p-2">
                    <User className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">Teacher:</span>
                    <span>{connection.teacherRole.user.name || 'Unknown'}</span>
                  </div>

                  {/* School/Group Info */}
                  {connection.studentPerson.group && (
                    <div className="flex items-center gap-2 text-sm text-gray-700 bg-white rounded-lg p-2 mt-2">
                      <School className="h-4 w-4 text-purple-600" />
                      <span className="font-medium">Classroom:</span>
                      <span>{connection.studentPerson.group.name}</span>
                    </div>
                  )}
                </div>

                {/* Connection Status */}
                <div className="flex items-center justify-between">
                  <Badge className="bg-green-100 text-green-800">
                    Active Connection
                  </Badge>
                  <p className="text-xs text-gray-500">
                    Connected {new Date(connection.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
