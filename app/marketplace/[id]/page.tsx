'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RatingStars } from '@/components/marketplace/RatingStars';
import { CommentSection } from '@/components/marketplace/CommentSection';
import { GitFork, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import Link from 'next/link';

export default function MarketplaceItemPage() {
  const router = useRouter();
  const params = useParams();
  const itemId = params?.id as string;
  const { toast } = useToast();

  const { data: session, isLoading: sessionLoading } = trpc.auth.getSession.useQuery();

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

  if (!session?.user || !itemId) {
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
    <MarketplaceItemContent
      itemId={itemId}
      roleId={activeRole.id}
      toast={toast}
      router={router}
    />
  );
}

interface MarketplaceItemContentProps {
  itemId: string;
  roleId: string;
  toast: any;
  router: any;
}

function MarketplaceItemContent({ itemId, roleId, toast, router }: MarketplaceItemContentProps) {
  const utils = trpc.useUtils();
  const { data: item, isLoading } = trpc.marketplace.getById.useQuery({ itemId });

  const forkMutation = trpc.marketplace.fork.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Item forked successfully to your collection',
        variant: 'success',
      });
      utils.marketplace.getById.invalidate({ itemId });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleFork = () => {
    if (confirm(`Fork "${item?.name}" to your collection?`)) {
      forkMutation.mutate({ itemId, roleId });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading item...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Item Not Found</h1>
            <p className="text-gray-600 mb-6">
              The marketplace item you're looking for doesn't exist.
            </p>
            <Link href="/marketplace">
              <Button>Back to Marketplace</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const userRating = item.ratings?.[0]?.rating;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link href="/marketplace">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Button>
        </Link>

        {/* Item Details */}
        <Card className="p-8 mb-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{item.name}</h1>
                  <Badge variant={item.type === 'ROUTINE' ? 'default' : 'outline'}>
                    {item.type}
                  </Badge>
                </div>
                <p className="text-gray-600">
                  by {item.authorRole?.user?.name || 'Anonymous'}
                </p>
              </div>
              <Button onClick={handleFork} disabled={forkMutation.isPending}>
                <GitFork className="h-4 w-4 mr-2" />
                {forkMutation.isPending ? 'Forking...' : 'Fork'}
              </Button>
            </div>

            {/* Description */}
            {item.description && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{item.description}</p>
              </div>
            )}

            {/* Metadata */}
            <div className="flex flex-wrap gap-4">
              {item.category && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Category: </span>
                  <Badge variant="outline">{item.category}</Badge>
                </div>
              )}
              {item.ageGroup && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Age Group: </span>
                  <Badge variant="outline">{item.ageGroup}</Badge>
                </div>
              )}
            </div>

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="text-sm bg-gray-100 px-3 py-1 rounded-full text-gray-700"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="pt-6 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Rating</h3>
                  <RatingStars
                    itemId={itemId}
                    averageRating={item.averageRating || 0}
                    ratingCount={item.ratingCount || 0}
                    userRating={userRating}
                    interactive={true}
                  />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{item.forkCount}</div>
                  <div className="text-sm text-gray-600">Forks</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Comments */}
        <CommentSection itemId={itemId} />

        {/* Additional Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">How to Use</h3>
          <p className="text-sm text-blue-700">
            Click the "Fork" button above to add this {item.type.toLowerCase()} to your
            collection. You can then customize it to fit your needs. Don't forget to rate and
            comment if you find it helpful!
          </p>
        </div>
      </div>
    </div>
  );
}
