'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface HeartButtonProps {
  postId: string;
  initialLikeCount: number;
  initialUserHasLiked: boolean;
  isLoggedIn: boolean;
}

export function HeartButton({
  postId,
  initialLikeCount,
  initialUserHasLiked,
  isLoggedIn,
}: HeartButtonProps) {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [hasLiked, setHasLiked] = useState(initialUserHasLiked);
  const [isAnimating, setIsAnimating] = useState(false);
  const { toast } = useToast();

  const toggleLikeMutation = trpc.blog.toggleLike.useMutation({
    onMutate: () => {
      // Optimistic update
      setIsAnimating(true);
      setHasLiked((prev) => !prev);
      setLikeCount((prev) => (hasLiked ? prev - 1 : prev + 1));
    },
    onError: () => {
      // Revert on error
      setHasLiked((prev) => !prev);
      setLikeCount((prev) => (hasLiked ? prev + 1 : prev - 1));
      toast({
        title: 'Error',
        description: 'Failed to update like. Please try again.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setTimeout(() => setIsAnimating(false), 300);
    },
  });

  const handleClick = () => {
    if (!isLoggedIn) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to like posts.',
        variant: 'default',
      });
      return;
    }

    toggleLikeMutation.mutate({ postId });
  };

  return (
    <Button
      variant="ghost"
      size="lg"
      onClick={handleClick}
      disabled={toggleLikeMutation.isPending}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-full transition-all',
        hasLiked
          ? 'text-red-500 hover:text-red-600 hover:bg-red-50'
          : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
      )}
    >
      <Heart
        className={cn(
          'h-6 w-6 transition-transform',
          hasLiked && 'fill-current',
          isAnimating && 'scale-125'
        )}
      />
      <span className="font-medium text-lg">{likeCount}</span>
    </Button>
  );
}
