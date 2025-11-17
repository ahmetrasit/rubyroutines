import { router, adminProcedure } from '../init';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { TRPCError } from '@trpc/server';

export const adminMarketplaceRouter = router({
  /**
   * Get all flagged comments with their flags
   */
  getFlaggedComments: adminProcedure.query(async () => {
    const comments = await prisma.marketplaceComment.findMany({
      where: {
        OR: [
          { status: 'FLAGGED' },
          { status: 'HIDDEN' },
          {
            flags: {
              some: {},
            },
          },
        ],
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
        marketplaceItem: {
          select: {
            id: true,
            name: true,
          },
        },
        flags: {
          include: {
            user: {
              select: {
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            flags: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return comments;
  }),

  /**
   * Get marketplace statistics
   */
  getStatistics: adminProcedure.query(async () => {
    const [totalItems, totalComments, flaggedComments, hiddenComments, totalRatings, totalForks] =
      await Promise.all([
        prisma.marketplaceItem.count(),
        prisma.marketplaceComment.count(),
        prisma.marketplaceComment.count({
          where: { status: 'FLAGGED' },
        }),
        prisma.marketplaceComment.count({
          where: { status: 'HIDDEN' },
        }),
        prisma.marketplaceRating.count(),
        prisma.marketplaceItem.aggregate({
          _sum: {
            forkCount: true,
          },
        }),
      ]);

    return {
      totalItems,
      totalComments,
      flaggedComments,
      hiddenComments,
      totalRatings,
      totalForks: totalForks._sum.forkCount || 0,
    };
  }),

  /**
   * Hide a comment (remove from public view)
   */
  hideComment: adminProcedure
    .input(
      z.object({
        commentId: z.string().cuid(),
      })
    )
    .mutation(async ({ input }) => {
      const comment = await prisma.marketplaceComment.findUnique({
        where: { id: input.commentId },
      });

      if (!comment) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Comment not found' });
      }

      const updatedComment = await prisma.marketplaceComment.update({
        where: { id: input.commentId },
        data: {
          status: 'HIDDEN',
        },
      });

      return updatedComment;
    }),

  /**
   * Unhide a comment (restore to public view)
   */
  unhideComment: adminProcedure
    .input(
      z.object({
        commentId: z.string().cuid(),
      })
    )
    .mutation(async ({ input }) => {
      const comment = await prisma.marketplaceComment.findUnique({
        where: { id: input.commentId },
      });

      if (!comment) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Comment not found' });
      }

      const updatedComment = await prisma.marketplaceComment.update({
        where: { id: input.commentId },
        data: {
          status: 'ACTIVE',
        },
      });

      return updatedComment;
    }),

  /**
   * Delete a marketplace item (admin only)
   */
  deleteItem: adminProcedure
    .input(
      z.object({
        itemId: z.string().cuid(),
      })
    )
    .mutation(async ({ input }) => {
      const item = await prisma.marketplaceItem.findUnique({
        where: { id: input.itemId },
      });

      if (!item) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Item not found' });
      }

      await prisma.marketplaceItem.delete({
        where: { id: input.itemId },
      });

      return { success: true };
    }),

  /**
   * Get all marketplace items (admin view)
   */
  getAllItems: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        visibility: z.enum(['PUBLIC', 'UNLISTED', 'PRIVATE']).optional(),
      })
    )
    .query(async ({ input }) => {
      const where = input.visibility ? { visibility: input.visibility } : {};

      const [items, total] = await Promise.all([
        prisma.marketplaceItem.findMany({
          where,
          include: {
            authorRole: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                    image: true,
                  },
                },
              },
            },
            _count: {
              select: {
                ratings: true,
                comments: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: input.limit,
          skip: input.offset,
        }),
        prisma.marketplaceItem.count({ where }),
      ]);

      return {
        items,
        total,
      };
    }),
});
