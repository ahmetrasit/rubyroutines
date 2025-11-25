'use client';

import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc/client';
import { format, formatDistanceStrict, formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { Wifi, WifiOff, XCircle, Power, Clock, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function MyKioskSessions() {
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());

  const { data: sessions, isLoading, refetch } = trpc.kiosk.getActiveSessions.useQuery(
    undefined,
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  const terminateSessionMutation = trpc.kiosk.terminateSession.useMutation({
    onSuccess: () => {
      toast({
        title: 'Session Ended',
        description: 'The kiosk has been disconnected'
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const terminateAllMutation = trpc.kiosk.terminateAllSessionsForCode.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'All Sessions Ended',
        description: `${data.count} session(s) disconnected`
      });
      refetch();
    }
  });

  // Update current time every second for duration display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-3 text-gray-600">Loading sessions...</span>
        </div>
      </Card>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <Card className="p-6 text-center text-gray-500">
        <WifiOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">No Active Kiosk Sessions</p>
        <p className="text-sm mt-2">Generate a kiosk code to start a session</p>
      </Card>
    );
  }

  // Group sessions by code
  const sessionsByCode = sessions.reduce((acc, session) => {
    const codeId = session.code.id;
    if (!acc[codeId]) {
      acc[codeId] = {
        code: session.code,
        sessions: []
      };
    }
    acc[codeId].sessions.push(session);
    return acc;
  }, {} as Record<string, {code: any, sessions: any[]}>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Active Kiosk Sessions</h2>
          <p className="text-gray-600">
            {sessions.length} active session{sessions.length > 1 ? 's' : ''} across{' '}
            {Object.keys(sessionsByCode).length} code{Object.keys(sessionsByCode).length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {Object.values(sessionsByCode).map(({ code, sessions: codeSessions }) => (
        <Card key={code.id} className="p-6">
          {/* Code Header */}
          <div className="flex justify-between items-start mb-4 pb-4 border-b">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold font-mono">{code.code}</h3>
                <div className="px-2 py-1 rounded text-sm bg-green-100 text-green-800">
                  {codeSessions.length} active
                </div>
              </div>

              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Code expires: {formatDistanceToNow(new Date(code.expiresAt), { addSuffix: true })}
                </div>

                {code.group && (
                  <div className="text-gray-500">
                    Group: {code.group.name}
                  </div>
                )}
                {code.person && (
                  <div className="text-gray-500">
                    Person: {code.person.name}
                  </div>
                )}
              </div>
            </div>

            {codeSessions.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm(`End all ${codeSessions.length} active session(s) for this code?`)) {
                    terminateAllMutation.mutate({ codeId: code.id });
                  }
                }}
                disabled={terminateAllMutation.isPending}
              >
                <Power className="h-4 w-4 mr-2" />
                End All
              </Button>
            )}
          </div>

          {/* Sessions Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Started</TableHead>
                <TableHead>Active Duration</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codeSessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">
                    {format(new Date(session.startedAt), 'PPp')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      {formatDistanceStrict(new Date(session.startedAt), currentTime)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(session.expiresAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {session.ipAddress || 'N/A'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                    {session.userAgent || 'Unknown device'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDistanceToNow(new Date(session.lastActiveAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm('Disconnect this kiosk? It will be logged out immediately.')) {
                          terminateSessionMutation.mutate({
                            sessionId: session.id,
                            reason: 'user_ended'
                          });
                        }
                      }}
                      disabled={terminateSessionMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Disconnect
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ))}
    </div>
  );
}
