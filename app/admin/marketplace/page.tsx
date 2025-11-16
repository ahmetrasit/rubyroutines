'use client';

import { AdminGuard } from '@/components/admin/AdminGuard';
import { ModeSwitcher } from '@/components/mode-switcher';
import { trpc } from '@/lib/trpc/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Eye, EyeOff, BarChart3, MessageSquare, Flag } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useToast } from '@/components/ui/toast';

export default function AdminMarketplacePage() {
  return (
    <AdminGuard>
      <ModeSwitcher currentMode="admin" />
      <MarketplaceModeration />
    </AdminGuard>
  );
}

function MarketplaceModeration() {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Fetch flagged comments
  const { data: flaggedComments, isLoading: flaggedLoading } =
    trpc.adminMarketplace.getFlaggedComments.useQuery();

  // Fetch marketplace stats
  const { data: stats, isLoading: statsLoading } =
    trpc.adminMarketplace.getStatistics.useQuery();

  // Hide/unhide comment mutation
  const hideCommentMutation = trpc.adminMarketplace.hideComment.useMutation({
    onSuccess: () => {
      toast({ title: 'Success', description: 'Comment status updated', variant: 'success' });
      utils.adminMarketplace.getFlaggedComments.invalidate();
      utils.adminMarketplace.getStatistics.invalidate();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const unhideCommentMutation = trpc.adminMarketplace.unhideComment.useMutation({
    onSuccess: () => {
      toast({ title: 'Success', description: 'Comment restored', variant: 'success' });
      utils.adminMarketplace.getFlaggedComments.invalidate();
      utils.adminMarketplace.getStatistics.invalidate();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Marketplace Moderation</h1>
          <p className="text-muted-foreground">Manage marketplace content and review flagged comments</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalItems || 0}</div>
              <p className="text-xs text-muted-foreground">Published to marketplace</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalComments || 0}</div>
              <p className="text-xs text-muted-foreground">All comments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Flagged Comments</CardTitle>
              <Flag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats?.flaggedComments || 0}
              </div>
              <p className="text-xs text-muted-foreground">Needs review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hidden Comments</CardTitle>
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.hiddenComments || 0}</div>
              <p className="text-xs text-muted-foreground">Moderated</p>
            </CardContent>
          </Card>
        </div>

        {/* Flagged Comments */}
        <Card>
          <CardHeader>
            <CardTitle>Flagged Comments</CardTitle>
          </CardHeader>
          <CardContent>
            {flaggedLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading flagged comments...</p>
              </div>
            ) : !flaggedComments || flaggedComments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No flagged comments to review</p>
              </div>
            ) : (
              <div className="space-y-4">
                {flaggedComments.map((comment: any) => (
                  <Card key={comment.id} className="border-l-4 border-l-orange-500">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {/* Comment Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold">
                                {comment.user?.name || 'Unknown User'}
                              </span>
                              <Badge variant={comment.status === 'HIDDEN' ? 'destructive' : 'default'}>
                                {comment.status}
                              </Badge>
                              {comment._count?.flags > 0 && (
                                <Badge variant="outline" className="gap-1">
                                  <Flag className="h-3 w-3" />
                                  {comment._count.flags} flag{comment._count.flags !== 1 ? 's' : ''}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              on {comment.marketplaceItem?.name || 'Unknown Item'}
                            </p>
                            <p className="text-sm mb-2">{comment.text}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(comment.createdAt), 'PPpp')}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {comment.status === 'HIDDEN' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => unhideCommentMutation.mutate({ commentId: comment.id })}
                                disabled={unhideCommentMutation.isPending}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Unhide
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => hideCommentMutation.mutate({ commentId: comment.id })}
                                disabled={hideCommentMutation.isPending}
                              >
                                <EyeOff className="h-4 w-4 mr-2" />
                                Hide
                              </Button>
                            )}
                            <Link href={`/marketplace/${comment.marketplaceItemId}`}>
                              <Button size="sm" variant="ghost">
                                View Item
                              </Button>
                            </Link>
                          </div>
                        </div>

                        {/* Flags */}
                        {comment.flags && comment.flags.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-sm font-semibold mb-2">Reports:</p>
                            <div className="space-y-2">
                              {comment.flags.map((flag: any) => (
                                <div key={flag.id} className="text-sm bg-orange-50 p-3 rounded">
                                  <div className="flex items-center gap-2 mb-1">
                                    <AlertCircle className="h-4 w-4 text-orange-600" />
                                    <span className="font-medium">
                                      {flag.user?.name || 'Anonymous'}
                                    </span>
                                    <span className="text-muted-foreground">
                                      {format(new Date(flag.createdAt), 'PP')}
                                    </span>
                                  </div>
                                  <p className="text-muted-foreground ml-6">{flag.reason}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
