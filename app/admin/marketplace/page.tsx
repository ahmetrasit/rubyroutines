'use client';

import { AdminGuard } from '@/components/admin/AdminGuard';
import { ModeSwitcher } from '@/components/mode-switcher';
import { trpc } from '@/lib/trpc/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Eye, EyeOff, BarChart3, MessageSquare, Flag, Search, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useToast } from '@/components/ui/toast';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { HomeButton } from '@/components/home-button';

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

  // State for marketplace items filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<'PUBLIC' | 'PRIVATE' | undefined>(undefined);
  const [hiddenFilter, setHiddenFilter] = useState<'all' | 'hidden' | 'visible'>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Reset page when filters change (but keep page size)
  useEffect(() => {
    setCurrentPage(1);
    setSelectedItems(new Set());
  }, [searchQuery, visibilityFilter, hiddenFilter]);

  // Fetch flagged comments
  const { data: flaggedComments, isLoading: flaggedLoading } =
    trpc.adminMarketplace.getFlaggedComments.useQuery();

  // Fetch marketplace stats
  const { data: stats, isLoading: statsLoading } =
    trpc.adminMarketplace.getStatistics.useQuery();

  // Calculate offset for pagination
  const offset = (currentPage - 1) * pageSize;

  // Fetch all marketplace items with pagination
  const { data: itemsData, isLoading: itemsLoading, isFetching: itemsFetching } =
    trpc.adminMarketplace.getAllItems.useQuery({
      limit: pageSize,
      offset: offset,
      visibility: visibilityFilter,
    });

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

  // Hide/unhide item mutations
  const hideItemMutation = trpc.adminMarketplace.hideItem.useMutation({
    onSuccess: () => {
      toast({ title: 'Success', description: 'Item hidden', variant: 'success' });
      utils.adminMarketplace.getAllItems.invalidate();
      utils.adminMarketplace.getStatistics.invalidate();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const unhideItemMutation = trpc.adminMarketplace.unhideItem.useMutation({
    onSuccess: () => {
      toast({ title: 'Success', description: 'Item unhidden', variant: 'success' });
      utils.adminMarketplace.getAllItems.invalidate();
      utils.adminMarketplace.getStatistics.invalidate();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const bulkHideItemsMutation = trpc.adminMarketplace.bulkHideItems.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: `${data.count} item(s) hidden`,
        variant: 'success'
      });
      setSelectedItems(new Set());
      utils.adminMarketplace.getAllItems.invalidate();
      utils.adminMarketplace.getStatistics.invalidate();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const bulkUnhideItemsMutation = trpc.adminMarketplace.bulkUnhideItems.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: `${data.count} item(s) unhidden`,
        variant: 'success'
      });
      setSelectedItems(new Set());
      utils.adminMarketplace.getAllItems.invalidate();
      utils.adminMarketplace.getStatistics.invalidate();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Note: With server-side pagination, we apply filters on client side
  // This is a temporary solution - ideally filters should be passed to the API
  const filteredItems = (itemsData?.items || []).filter((item: any) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = item.name?.toLowerCase().includes(query);
      const matchesCategory = item.category?.toLowerCase().includes(query);
      const matchesAuthor = item.authorRole?.user?.name?.toLowerCase().includes(query);
      if (!matchesName && !matchesCategory && !matchesAuthor) {
        return false;
      }
    }

    // Hidden filter
    if (hiddenFilter === 'hidden' && !item.hidden) return false;
    if (hiddenFilter === 'visible' && item.hidden) return false;

    return true;
  });

  // Calculate pagination values
  const totalItems = itemsData?.total || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize)); // Ensure at least 1 page
  const startItem = totalItems === 0 ? 0 : offset + 1;
  const endItem = Math.min(offset + pageSize, totalItems);

  // Pagination handlers
  const handlePageSizeChange = (newSize: string) => {
    const size = parseInt(newSize, 10);
    setPageSize(size);

    // Calculate new current page to maintain approximate position
    const newTotalPages = Math.max(1, Math.ceil(totalItems / size));
    const currentItemIndex = (currentPage - 1) * pageSize;
    const newPage = Math.min(Math.floor(currentItemIndex / size) + 1, newTotalPages);

    setCurrentPage(newPage);
    setSelectedItems(new Set()); // Clear selections when changing page size
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages && !itemsFetching) {
      setCurrentPage(page);
      setSelectedItems(new Set()); // Clear selections when changing pages
      // Scroll table into view on page change
      const tableElement = document.querySelector('[data-table-container]');
      if (tableElement) {
        tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Toggle item selection
  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  // Toggle all items selection
  const toggleAllItems = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map((item: any) => item.id)));
    }
  };

  // Bulk actions
  const handleBulkHide = () => {
    if (selectedItems.size === 0) return;
    bulkHideItemsMutation.mutate({ itemIds: Array.from(selectedItems) });
  };

  const handleBulkUnhide = () => {
    if (selectedItems.size === 0) return;
    bulkUnhideItemsMutation.mutate({ itemIds: Array.from(selectedItems) });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HomeButton />
            <div>
              <h1 className="text-3xl font-bold mb-1">Marketplace Moderation</h1>
              <p className="text-muted-foreground">Manage marketplace content and review flagged comments</p>
            </div>
          </div>
          <Link href="/admin">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
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
        <Card className="mb-8">
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

        {/* Marketplace Items */}
        <Card data-table-container>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Marketplace Items</CardTitle>
              <div className="flex gap-2">
                {selectedItems.size > 0 && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBulkUnhide}
                      disabled={bulkUnhideItemsMutation.isPending}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Unhide Selected ({selectedItems.size})
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={handleBulkHide}
                      disabled={bulkHideItemsMutation.isPending}
                    >
                      <EyeOff className="h-4 w-4 mr-2" />
                      Hide Selected ({selectedItems.size})
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="mb-6 space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search items by name, category, or author..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={visibilityFilter === undefined ? 'default' : 'outline'}
                  onClick={() => setVisibilityFilter(undefined)}
                >
                  All Visibility
                </Button>
                <Button
                  size="sm"
                  variant={visibilityFilter === 'PUBLIC' ? 'default' : 'outline'}
                  onClick={() => setVisibilityFilter('PUBLIC')}
                >
                  Public
                </Button>
                <Button
                  size="sm"
                  variant={visibilityFilter === 'PRIVATE' ? 'default' : 'outline'}
                  onClick={() => setVisibilityFilter('PRIVATE')}
                >
                  Private
                </Button>
                <div className="mx-4 border-l" />
                <Button
                  size="sm"
                  variant={hiddenFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setHiddenFilter('all')}
                >
                  All Items
                </Button>
                <Button
                  size="sm"
                  variant={hiddenFilter === 'visible' ? 'default' : 'outline'}
                  onClick={() => setHiddenFilter('visible')}
                >
                  Visible
                </Button>
                <Button
                  size="sm"
                  variant={hiddenFilter === 'hidden' ? 'default' : 'outline'}
                  onClick={() => setHiddenFilter('hidden')}
                >
                  Hidden
                </Button>
              </div>
            </div>

            {/* Items Table */}
            {itemsLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading marketplace items...</p>
              </div>
            ) : !filteredItems || filteredItems.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No marketplace items found</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 relative">
                  {/* Loading overlay for page changes */}
                  {itemsFetching && !itemsLoading && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10 rounded backdrop-blur-sm">
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <div className="text-sm text-muted-foreground">Loading page {currentPage}...</div>
                      </div>
                    </div>
                  )}
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-100 rounded font-medium text-sm">
                  <div className="col-span-1 flex items-center">
                    <Checkbox
                      checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                      onChange={toggleAllItems}
                    />
                  </div>
                  <div className="col-span-3">Item</div>
                  <div className="col-span-2">Creator</div>
                  <div className="col-span-2">Category</div>
                  <div className="col-span-1">Visibility</div>
                  <div className="col-span-1">Status</div>
                  <div className="col-span-2">Actions</div>
                </div>

                {/* Table Rows */}
                {filteredItems.map((item: any) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 gap-4 px-4 py-3 bg-white rounded border hover:bg-gray-50"
                  >
                    <div className="col-span-1 flex items-center">
                      <Checkbox
                        checked={selectedItems.has(item.id)}
                        onChange={() => toggleItemSelection(item.id)}
                      />
                    </div>
                    <div className="col-span-3 flex items-center gap-2">
                      {item.iconUrl && (
                        <img src={item.iconUrl} alt="" className="w-8 h-8 rounded" />
                      )}
                      <div>
                        <div className="font-medium">{item.name}</div>
                        {item.hidden && (
                          <div className="text-xs text-muted-foreground">
                            Hidden {item.hiddenAt && `on ${format(new Date(item.hiddenAt), 'PP')}`}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center">
                      <div className="text-sm">
                        {item.authorRole?.user?.name || 'Unknown'}
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center">
                      <Badge variant="outline">{item.category || 'Uncategorized'}</Badge>
                    </div>
                    <div className="col-span-1 flex items-center">
                      <Badge variant={item.visibility === 'PUBLIC' ? 'default' : 'secondary'}>
                        {item.visibility}
                      </Badge>
                    </div>
                    <div className="col-span-1 flex items-center">
                      {item.hidden ? (
                        <Badge variant="destructive">Hidden</Badge>
                      ) : (
                        <Badge variant="success">Visible</Badge>
                      )}
                    </div>
                    <div className="col-span-2 flex items-center gap-2">
                      <Link href={`/marketplace/${item.id}`}>
                        <Button size="sm" variant="ghost">
                          View
                        </Button>
                      </Link>
                      {item.hidden ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => unhideItemMutation.mutate({ itemId: item.id })}
                          disabled={unhideItemMutation.isPending}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => hideItemMutation.mutate({ itemId: item.id })}
                          disabled={hideItemMutation.isPending}
                        >
                          <EyeOff className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                </div>

                {/* Pagination Controls */}
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-4">
                  <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                    {/* Page navigation buttons */}
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => goToPage(1)}
                        disabled={currentPage === 1 || itemsFetching || totalItems === 0}
                        aria-label="Go to first page"
                        title="First page"
                      >
                        <ChevronsLeft className="h-4 w-4" />
                        <span className="sr-only">First page</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1 || itemsFetching || totalItems === 0}
                        aria-label="Go to previous page"
                        title="Previous page"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Previous page</span>
                      </Button>
                      <div className="flex items-center gap-1 text-sm" aria-live="polite">
                        <span className="font-medium">Page {currentPage}</span>
                        <span className="text-muted-foreground">of {totalPages || 1}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages || itemsFetching || totalItems === 0}
                        aria-label="Go to next page"
                        title="Next page"
                      >
                        <ChevronRight className="h-4 w-4" />
                        <span className="sr-only">Next page</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => goToPage(totalPages)}
                        disabled={currentPage === totalPages || itemsFetching || totalItems === 0}
                        aria-label="Go to last page"
                        title="Last page"
                      >
                        <ChevronsRight className="h-4 w-4" />
                        <span className="sr-only">Last page</span>
                      </Button>
                    </div>

                    {/* Page size selector */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Show:</span>
                      <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                        <SelectTrigger className="h-8 w-[70px]" disabled={itemsFetching}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-muted-foreground">items per page</span>
                    </div>
                  </div>

                  {/* Total items count */}
                  <div className="text-sm text-muted-foreground text-center sm:text-right">
                    Showing {startItem} to {endItem} of {totalItems} items
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
