'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';

interface RatingStarsProps {
  itemId: string;
  averageRating: number;
  ratingCount: number;
  userRating?: number;
  interactive?: boolean;
}

export function RatingStars({
  itemId,
  averageRating,
  ratingCount,
  userRating,
  interactive = false,
}: RatingStarsProps) {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [currentRating, setCurrentRating] = useState(userRating || 0);
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const rateMutation = trpc.marketplace.rate.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Your rating has been submitted',
        variant: 'success',
      });
      utils.marketplace.getById.invalidate({ itemId });
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

  const handleClick = (rating: number) => {
    if (!interactive) return;
    setCurrentRating(rating);
    rateMutation.mutate({ itemId, rating });
  };

  const displayRating = hoveredRating || currentRating || averageRating;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleClick(star)}
            onMouseEnter={() => interactive && setHoveredRating(star)}
            onMouseLeave={() => interactive && setHoveredRating(null)}
            disabled={!interactive || rateMutation.isPending}
            className={`transition-all ${
              interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
            } disabled:opacity-50`}
          >
            <Star
              className={`h-5 w-5 ${
                star <= Math.round(displayRating)
                  ? 'text-yellow-500 fill-yellow-500'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
      <div className="text-sm text-gray-600">
        <span className="font-medium">{averageRating.toFixed(1)}</span>
        {ratingCount > 0 && <span className="text-gray-400"> ({ratingCount})</span>}
      </div>
      {interactive && currentRating > 0 && (
        <span className="text-xs text-gray-500">You rated: {currentRating} stars</span>
      )}
    </div>
  );
}
