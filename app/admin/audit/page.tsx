'use client';

import { useState } from 'react';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { ModeSwitcher } from '@/components/mode-switcher';
import { trpc } from '@/lib/trpc/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export default function AdminAuditPage() {
  return (
    <AdminGuard>
      <ModeSwitcher currentMode="admin" />
      <AuditContent />
    </AdminGuard>
  );
}

function AuditContent() {
  const [actionFilter, setActionFilter] = useState<string>('');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('');

  const { data: logs, isLoading } = trpc.adminAudit.getLogs.useQuery({
    action: (actionFilter || undefined) as any,
    entityType: (entityTypeFilter || undefined) as any,
    limit: 100,
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Audit Log</h1>
            <p className="text-muted-foreground">Track all administrative actions</p>
          </div>
          <Link href="/admin">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
                  <SelectItem value="USER_ADMIN_GRANTED">Admin Granted</SelectItem>
                  <SelectItem value="USER_ADMIN_REVOKED">Admin Revoked</SelectItem>
                  <SelectItem value="TIER_CHANGED">Tier Changed</SelectItem>
                  <SelectItem value="TIER_OVERRIDE_SET">Tier Override Set</SelectItem>
                  <SelectItem value="SETTINGS_CHANGED">Settings Changed</SelectItem>
                  <SelectItem value="USER_DELETED">User Deleted</SelectItem>
                </SelectContent>
              </Select>

              <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by entity type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="User">User</SelectItem>
                  <SelectItem value="Role">Role</SelectItem>
                  <SelectItem value="SystemSettings">System Settings</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setActionFilter('');
                  setEntityTypeFilter('');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Audit Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Audit Logs ({logs?.total || 0})
            </CardTitle>
            <CardDescription>
              Showing {logs?.logs.length || 0} of {logs?.total || 0} entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : logs && logs.logs.length > 0 ? (
              <div className="space-y-3">
                {logs.logs.map((log: any) => (
                  <div
                    key={log.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                            {log.action.replace(/_/g, ' ')}
                          </span>
                          {log.entityType && (
                            <span className="text-xs text-muted-foreground">
                              {log.entityType}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{log.user.email}</span>
                          <span>•</span>
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(log.createdAt), 'PPpp')}</span>
                        </div>
                      </div>
                    </div>
                    {log.changes && (
                      <div className="mt-3 bg-muted p-3 rounded text-xs font-mono">
                        <pre className="overflow-x-auto">
                          {JSON.stringify(log.changes, null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.ipAddress && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        IP: {log.ipAddress}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No audit logs found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
