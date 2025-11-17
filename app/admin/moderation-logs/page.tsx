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
import { Badge } from '@/components/ui/badge';
import { Activity, Calendar, User, Download, Shield, Search } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function AdminModerationLogsPage() {
  return (
    <AdminGuard>
      <ModeSwitcher currentMode="admin" />
      <ModerationLogsContent />
    </AdminGuard>
  );
}

function ModerationLogsContent() {
  const { toast } = useToast();
  const [actionFilter, setActionFilter] = useState<string>('');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('');
  const [entityIdSearch, setEntityIdSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const offset = (currentPage - 1) * pageSize;

  const { data: logsData, isLoading, isFetching } = trpc.adminModerationLogs.getLogs.useQuery({
    action: actionFilter || undefined,
    entityType: entityTypeFilter || undefined,
    entityId: entityIdSearch || undefined,
    limit: pageSize,
    offset: offset,
  });

  const exportMutation = trpc.adminModerationLogs.exportLogs.useMutation({
    onSuccess: (csvContent) => {
      // Create a download link
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `moderation-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Export successful',
        description: 'Moderation logs have been exported to CSV',
      });
    },
    onError: (error) => {
      toast({
        title: 'Export failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleExport = () => {
    exportMutation.mutate({
      action: actionFilter || undefined,
      entityType: entityTypeFilter || undefined,
    });
  };

  const handleClearFilters = () => {
    setActionFilter('');
    setEntityTypeFilter('');
    setEntityIdSearch('');
    setCurrentPage(1);
  };

  const totalPages = logsData ? Math.ceil(logsData.total / pageSize) : 0;

  const getActionBadgeColor = (action: string) => {
    if (action.includes('DELETE')) return 'destructive';
    if (action.includes('HIDE')) return 'secondary';
    if (action.includes('UNHIDE')) return 'default';
    if (action.includes('SUSPEND')) return 'destructive';
    if (action.includes('GRANT')) return 'default';
    return 'outline';
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'MARKETPLACE_ITEM':
        return '📦';
      case 'COMMENT':
        return '💬';
      case 'USER':
        return '👤';
      case 'ROLE':
        return '🎭';
      default:
        return '📋';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Shield className="h-8 w-8" />
              Moderation Logs
            </h1>
            <p className="text-muted-foreground">Track all marketplace moderation actions</p>
          </div>
          <Link href="/admin">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter moderation logs by action, entity type, or entity ID</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
                  <SelectItem value="HIDE_ITEM">Hide Item</SelectItem>
                  <SelectItem value="UNHIDE_ITEM">Unhide Item</SelectItem>
                  <SelectItem value="DELETE_ITEM">Delete Item</SelectItem>
                  <SelectItem value="BULK_HIDE_ITEMS">Bulk Hide Items</SelectItem>
                  <SelectItem value="BULK_UNHIDE_ITEMS">Bulk Unhide Items</SelectItem>
                  <SelectItem value="HIDE_COMMENT">Hide Comment</SelectItem>
                  <SelectItem value="UNHIDE_COMMENT">Unhide Comment</SelectItem>
                  <SelectItem value="DELETE_COMMENT">Delete Comment</SelectItem>
                  <SelectItem value="SUSPEND_USER">Suspend User</SelectItem>
                  <SelectItem value="UNSUSPEND_USER">Unsuspend User</SelectItem>
                  <SelectItem value="GRANT_ADMIN">Grant Admin</SelectItem>
                  <SelectItem value="REVOKE_ADMIN">Revoke Admin</SelectItem>
                </SelectContent>
              </Select>

              <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by entity type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="MARKETPLACE_ITEM">Marketplace Item</SelectItem>
                  <SelectItem value="COMMENT">Comment</SelectItem>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="ROLE">Role</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by entity ID"
                  value={entityIdSearch}
                  onChange={(e) => setEntityIdSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Button variant="outline" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={exportMutation.isPending}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                {exportMutation.isPending ? 'Exporting...' : 'Export to CSV'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Moderation Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Moderation Logs ({logsData?.total || 0})
            </CardTitle>
            <CardDescription>
              Showing {logsData?.logs.length || 0} of {logsData?.total || 0} entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : logsData && logsData.logs.length > 0 ? (
              <>
                <div className="space-y-3">
                  {logsData.logs.map((log) => (
                    <div
                      key={log.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge variant={getActionBadgeColor(log.action)}>
                              {log.action.replace(/_/g, ' ')}
                            </Badge>
                            <span className="text-lg">{getEntityIcon(log.entityType)}</span>
                            <span className="text-xs text-muted-foreground">
                              {log.entityType.replace(/_/g, ' ')}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <User className="h-3 w-3" />
                            <span className="font-medium">{log.adminUser.name || log.adminUser.email}</span>
                            <span>•</span>
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(log.timestamp), 'PPpp')}</span>
                          </div>

                          <div className="text-xs text-muted-foreground mb-2">
                            <span className="font-mono bg-muted px-2 py-1 rounded">
                              Entity ID: {log.entityId}
                            </span>
                          </div>

                          {log.reason && (
                            <div className="mt-2 text-sm">
                              <span className="font-semibold">Reason: </span>
                              <span className="text-muted-foreground">{log.reason}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="mt-3 bg-muted p-3 rounded text-xs">
                          <div className="font-semibold mb-2">Metadata:</div>
                          <div className="space-y-1">
                            {Object.entries(log.metadata as Record<string, any>).map(([key, value]) => (
                              <div key={key} className="flex gap-2">
                                <span className="font-medium text-muted-foreground">{key}:</span>
                                <span className="font-mono">
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {(log.ipAddress || log.userAgent) && (
                        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground space-y-1">
                          {log.ipAddress && (
                            <div>
                              <span className="font-semibold">IP Address:</span> {log.ipAddress}
                            </div>
                          )}
                          {log.userAgent && (
                            <div>
                              <span className="font-semibold">User Agent:</span>{' '}
                              <span className="font-mono text-[10px]">{log.userAgent}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between border-t pt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Rows per page:</span>
                      <Select
                        value={String(pageSize)}
                        onValueChange={(value) => {
                          setPageSize(Number(value));
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1 || isFetching}
                        >
                          First
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1 || isFetching}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages || isFetching}
                        >
                          Next
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages || isFetching}
                        >
                          Last
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No moderation logs found</p>
                {(actionFilter || entityTypeFilter || entityIdSearch) && (
                  <Button variant="link" onClick={handleClearFilters} className="mt-2">
                    Clear filters to see all logs
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
