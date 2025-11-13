'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, GitFork, Eye } from 'lucide-react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';

interface MarketplaceItem {
  id: string;
  type: 'ROUTINE' | 'GOAL';
  name: string;
  description: string;
  category?: string;
  ageGroup?: string;
  tags: string[];
  averageRating: number;
  ratingCount: number;
  forkCount: number;
  authorRole: {
    user: {
      name: string | null;
    };
  };
}

interface ItemCardProps {
  item: MarketplaceItem;
  roleId: string;
}

export function ItemCard({ item, roleId }: ItemCardProps) {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const forkMutation = trpc.marketplace.fork.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: `${item.name} has been forked to your collection`,
        variant: 'success',
      });
      utils.marketplace.search.invalidate();
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
    if (confirm(`Fork "${item.name}" to your collection?`)) {
      forkMutation.mutate({ itemId: item.id, roleId });
    }
  };

  return (
    <Card className="p-5 hover:shadow-lg transition-shadow">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 truncate">{item.name}</h3>
            <p className="text-sm text-gray-600 mt-1">
              by {item.authorRole.user.name || 'Anonymous'}
            </p>
          </div>
          <Badge variant={item.type === 'ROUTINE' ? 'default' : 'outline'}>
            {item.type}
          </Badge>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-700 line-clamp-2 min-h-[2.5rem]">
          {item.description || 'No description provided'}
        </p>

        {/* Metadata */}
        <div className="flex flex-wrap gap-2">
          {item.category && (
            <Badge variant="outline" className="text-xs">
              {item.category}
            </Badge>
          )}
          {item.ageGroup && (
            <Badge variant="outline" className="text-xs">
              {item.ageGroup}
            </Badge>
          )}
        </div>

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                #{tag}
              </span>
            ))}
            {item.tags.length > 3 && (
              <span className="text-xs text-gray-500 px-2 py-1">+{item.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span className="font-medium">
              {item.averageRating > 0 ? item.averageRating.toFixed(1) : 'N/A'}
            </span>
            {item.ratingCount > 0 && <span className="text-gray-400">({item.ratingCount})</span>}
          </div>
          <div className="flex items-center gap-1">
            <GitFork className="h-4 w-4" />
            <span>{item.forkCount}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Link href={`/marketplace/${item.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={handleFork}
            disabled={forkMutation.isPending}
            className="flex-1"
          >
            <GitFork className="h-4 w-4 mr-2" />
            {forkMutation.isPending ? 'Forking...' : 'Fork'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
