'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  Users,
  Copy,
  Trash2,
  RefreshCw,
  Calendar,
  Shield,
  UserPlus,
  UserCheck,
  Clock
} from 'lucide-react';

interface InvitationManagementProps {
  roleId: string;
  roleType: 'PARENT' | 'TEACHER';
}

export function InvitationManagement({ roleId, roleType }: InvitationManagementProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { toast } = useToast();

  // Query for sent connections
  const { data: ownedConnections, refetch: refetchOwned } = trpc.personSharing.getConnections.useQuery(
    { roleId, type: 'owned' },
    { enabled: !!roleId }
  );

  // Query for received connections
  const { data: sharedConnections, refetch: refetchShared } = trpc.personSharing.getConnections.useQuery(
    { roleId, type: 'shared_with_me' },
    { enabled: !!roleId }
  );

  const revokeMutation = trpc.personSharing.revokeConnection.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Connection revoked successfully',
        variant: 'default',
      });
      refetchOwned();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({
      title: 'Copied!',
      description: 'Invite code copied to clipboard',
      variant: 'default',
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleRevoke = (connectionId: string) => {
    if (confirm('Are you sure you want to revoke this connection?')) {
      revokeMutation.mutate({ connectionId });
    }
  };

  const getPermissionBadge = (permission: string) => {
    const variants = {
      VIEW: { variant: 'secondary' as const, icon: Shield },
      EDIT: { variant: 'default' as const, icon: Shield },
      MANAGE: { variant: 'success' as const, icon: Shield },
    };
    const config = variants[permission as keyof typeof variants] || variants.VIEW;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {permission}
      </Badge>
    );
  };

  const getShareTypeBadge = (shareType: string) => {
    const types = {
      PERSON: { label: 'Individual', icon: UserPlus },
      ROUTINE_ACCESS: { label: 'Routines', icon: Clock },
      FULL_ROLE: { label: 'Full Access', icon: Users },
    };
    const config = types[shareType as keyof typeof types] || types.PERSON;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Sent Invitations */}
      <Card>
        <CardHeader>
          <CardTitle>Sent Invitations</CardTitle>
          <CardDescription>
            People you've shared {roleType === 'PARENT' ? 'your kids' : 'your students'} with
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ownedConnections && ownedConnections.length > 0 ? (
            <div className="space-y-4">
              {ownedConnections.map((connection) => (
                <div
                  key={connection.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    {connection.sharedWithRole?.user?.image ? (
                      <img
                        src={connection.sharedWithRole.user.image}
                        alt={connection.sharedWithRole.user.name || 'User'}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <UserCheck className="h-5 w-5 text-gray-500" />
                      </div>
                    )}

                    <div>
                      <p className="font-medium">
                        {connection.sharedWithRole?.user?.name || 'Unknown User'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {getShareTypeBadge(connection.shareType)}
                        {getPermissionBadge(connection.permissions)}
                      </div>
                      {connection.ownerPerson && (
                        <p className="text-sm text-gray-500 mt-1">
                          Sharing: {connection.ownerPerson.name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevoke(connection.id)}
                      disabled={revokeMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No active connections</p>
              <p className="text-sm mt-1">Share your {roleType === 'PARENT' ? 'kids' : 'students'} to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Received Invitations */}
      <Card>
        <CardHeader>
          <CardTitle>Received Connections</CardTitle>
          <CardDescription>
            {roleType === 'PARENT' ? 'Kids' : 'Students'} shared with you
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sharedConnections && sharedConnections.length > 0 ? (
            <div className="space-y-4">
              {sharedConnections.map((connection) => (
                <div
                  key={connection.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-blue-50 border-blue-200"
                >
                  <div className="flex items-center gap-4">
                    {connection.ownerRole?.user?.image ? (
                      <img
                        src={connection.ownerRole.user.image}
                        alt={connection.ownerRole.user.name || 'User'}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center">
                        <UserPlus className="h-5 w-5 text-blue-600" />
                      </div>
                    )}

                    <div>
                      <p className="font-medium">
                        Shared by {connection.ownerRole?.user?.name || 'Unknown User'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {getShareTypeBadge(connection.shareType)}
                        {getPermissionBadge(connection.permissions)}
                      </div>
                      {connection.ownerPerson && (
                        <p className="text-sm text-blue-600 mt-1">
                          {connection.ownerPerson.name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-blue-600 border-blue-600">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(connection.createdAt).toLocaleDateString()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <UserPlus className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No shared connections</p>
              <p className="text-sm mt-1">Accept a share code to see shared {roleType === 'PARENT' ? 'kids' : 'students'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invites (placeholder for future enhancement) */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
          <CardDescription>
            Invitations waiting to be accepted
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No pending invitations</p>
            <p className="text-sm mt-1">Generated codes that haven't been used yet will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}