'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { SearchBar } from '@/components/marketplace/SearchBar';
import { ItemCard } from '@/components/marketplace/ItemCard';
import { PublishModal } from '@/components/marketplace/PublishModal';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface SearchFilters {
  keyword?: string;
  category?: string;
  ageGroup?: string;
  tags: string[];
  type?: 'ROUTINE' | 'GOAL';
  sortBy: 'rating' | 'forkCount' | 'recent';
}

export default function MarketplacePage() {
  const router = useRouter();
  const { data: session, isLoading: sessionLoading } = trpc.auth.getSession.useQuery();
  const [filters, setFilters] = useState<SearchFilters>({
    tags: [],
    sortBy: 'rating',
  });
  const [page, setPage] = useState(0);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const limit = 20;

  useEffect(() => {
    if (!sessionLoading && !session?.user) {
      router.push('/login');
    }
  }, [sessionLoading, session, router]);

  if (sessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const parentRole = session.user.roles?.find((role: any) => role.type === 'PARENT');
  const teacherRole = session.user.roles?.find((role: any) => role.type === 'TEACHER');
  const activeRole = parentRole || teacherRole;

  if (!activeRole) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">No Role Found</h1>
          <p className="text-gray-600">Please contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <MarketplacePageContent
      roleId={activeRole.id}
      filters={filters}
      setFilters={setFilters}
      page={page}
      setPage={setPage}
      limit={limit}
      showPublishModal={showPublishModal}
      setShowPublishModal={setShowPublishModal}
    />
  );
}

interface MarketplacePageContentProps {
  roleId: string;
  filters: SearchFilters;
  setFilters: (filters: SearchFilters) => void;
  page: number;
  setPage: (page: number) => void;
  limit: number;
  showPublishModal: boolean;
  setShowPublishModal: (show: boolean) => void;
}

function MarketplacePageContent({
  roleId,
  filters,
  setFilters,
  page,
  setPage,
  limit,
  showPublishModal,
  setShowPublishModal,
}: MarketplacePageContentProps) {
  const { data, isLoading } = trpc.marketplace.search.useQuery({
    keyword: filters.keyword,
    category: filters.category,
    ageGroup: filters.ageGroup,
    tags: filters.tags,
    type: filters.type,
    sortBy: filters.sortBy,
    limit,
    offset: page * limit,
  });

  const handleSearch = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    setPage(0);
  };

  const totalPages = data?.total ? Math.ceil(data.total / limit) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link href="/parent">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Marketplace</h1>
            <p className="text-gray-600 mt-2">
              Discover and share routines and goals with the community
            </p>
          </div>
          <Button onClick={() => setShowPublishModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Publish
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar onSearch={handleSearch} />
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading marketplace items...</p>
          </div>
        ) : data?.items && data.items.length > 0 ? (
          <>
            <div className="mb-4 text-sm text-gray-600">
              Showing {page * limit + 1}-{Math.min((page + 1) * limit, data.total)} of{' '}
              {data.total} results
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {data.items.map((item: any) => (
                <ItemCard key={item.id} item={item} roleId={roleId} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No items found. Try adjusting your filters.</p>
          </div>
        )}

        {/* Info Panel */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">About the Marketplace</h3>
          <p className="text-sm text-blue-700">
            The marketplace is a community-driven space where you can discover routines and goals
            created by other users. Fork items to customize them for your needs, rate and comment
            on items you've tried, and publish your own creations to help others.
          </p>
        </div>
      </div>

      {/* Publish Modal */}
      <PublishModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        roleId={roleId}
      />
    </div>
  );
}
