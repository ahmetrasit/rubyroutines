'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Flag, Send } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  text: string;
  createdAt: Date;
  user: {
    name: string | null;
    image: string | null;
  };
}

interface CommentSectionProps {
  itemId: string;
}

export function CommentSection({ itemId }: CommentSectionProps) {
  const [commentText, setCommentText] = useState('');
  const [flaggingId, setFlaggingId] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState('');
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.marketplace.getComments.useQuery({
    itemId,
    limit: 20,
  });

  const commentMutation = trpc.marketplace.comment.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Comment posted successfully',
        variant: 'success',
      });
      setCommentText('');
      utils.marketplace.getComments.invalidate({ itemId });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const flagMutation = trpc.marketplace.flag.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Comment has been flagged for review',
        variant: 'success',
      });
      setFlaggingId(null);
      setFlagReason('');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    if (commentText.length > 500) {
      toast({
        title: 'Error',
        description: 'Comment must be 500 characters or less',
        variant: 'destructive',
      });
      return;
    }
    commentMutation.mutate({ itemId, text: commentText.trim() });
  };

  const handleFlag = (commentId: string) => {
    if (!flagReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for flagging',
        variant: 'destructive',
      });
      return;
    }
    flagMutation.mutate({ commentId, reason: flagReason });
  };

  return (
    <div className="space-y-6">
      {/* Add Comment Form */}
      <Card className="p-4">
        <h3 className="font-semibold text-lg mb-3">Add a Comment</h3>
        <div className="space-y-3">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Share your thoughts about this item..."
            maxLength={500}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {commentText.length}/500 characters
            </span>
            <Button
              onClick={handleSubmitComment}
              disabled={!commentText.trim() || commentMutation.isPending}
              size="sm"
            >
              <Send className="h-4 w-4 mr-2" />
              {commentMutation.isPending ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Comments List */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">
          Comments {data?.total ? `(${data.total})` : ''}
        </h3>

        {isLoading && (
          <div className="text-center py-8 text-gray-500">Loading comments...</div>
        )}

        {!isLoading && (!data?.comments || data.comments.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            No comments yet. Be the first to comment!
          </div>
        )}

        {data?.comments.map((comment) => (
          <Card key={comment.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-900">
                    {comment.user.name || 'Anonymous'}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-gray-700">{comment.text}</p>
              </div>

              {/* Flag Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setFlaggingId(flaggingId === comment.id ? null : comment.id)
                }
                className="flex-shrink-0"
              >
                <Flag className="h-4 w-4" />
              </Button>
            </div>

            {/* Flag Form */}
            {flaggingId === comment.id && (
              <div className="mt-3 pt-3 border-t space-y-2">
                <input
                  type="text"
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  placeholder="Reason for flagging (required)"
                  maxLength={200}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <div className="flex gap-2">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleFlag(comment.id)}
                    disabled={!flagReason.trim() || flagMutation.isPending}
                  >
                    {flagMutation.isPending ? 'Flagging...' : 'Submit Flag'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFlaggingId(null);
                      setFlagReason('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}

        {data?.hasMore && (
          <div className="text-center">
            <Button variant="outline" size="sm">
              Load More Comments
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
