import { router, adminProcedure } from '../init';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { TRPCError } from '@trpc/server';
import {
  logModerationAction,
  logBulkModerationAction,
  ModerationAction,
  EntityType
} from '@/lib/services/audit-log.service';

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
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
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

      // Log the moderation action
      await logModerationAction({
        adminUserId: ctx.user.id,
        entityType: EntityType.COMMENT,
        entityId: input.commentId,
        action: ModerationAction.HIDE_COMMENT,
        reason: input.reason,
        metadata: {
          previousStatus: comment.status,
          marketplaceItemId: comment.marketplaceItemId,
        },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
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
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
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

      // Log the moderation action
      await logModerationAction({
        adminUserId: ctx.user.id,
        entityType: EntityType.COMMENT,
        entityId: input.commentId,
        action: ModerationAction.UNHIDE_COMMENT,
        reason: input.reason,
        metadata: {
          previousStatus: comment.status,
          marketplaceItemId: comment.marketplaceItemId,
        },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
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
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const item = await prisma.marketplaceItem.findUnique({
        where: { id: input.itemId },
      });

      if (!item) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Item not found' });
      }

      // Log the moderation action before deletion (so we have the item data)
      await logModerationAction({
        adminUserId: ctx.user.id,
        entityType: EntityType.MARKETPLACE_ITEM,
        entityId: input.itemId,
        action: ModerationAction.DELETE_ITEM,
        reason: input.reason,
        metadata: {
          itemName: item.name,
          authorRoleId: item.authorRoleId,
          type: item.type,
          visibility: item.visibility,
          category: item.category,
        },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

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
        visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
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

  /**
   * Hide a marketplace item
   */
  hideItem: adminProcedure
    .input(
      z.object({
        itemId: z.string().cuid(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const item = await prisma.marketplaceItem.findUnique({
        where: { id: input.itemId },
      });

      if (!item) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Item not found' });
      }

      const updatedItem = await prisma.marketplaceItem.update({
        where: { id: input.itemId },
        data: {
          hidden: true,
          hiddenAt: new Date(),
          hiddenBy: ctx.user.id,
        },
      });

      // Log the moderation action
      await logModerationAction({
        adminUserId: ctx.user.id,
        entityType: EntityType.MARKETPLACE_ITEM,
        entityId: input.itemId,
        action: ModerationAction.HIDE_ITEM,
        reason: input.reason,
        metadata: {
          itemName: item.name,
          authorRoleId: item.authorRoleId,
          type: item.type,
          visibility: item.visibility,
          wasHidden: item.hidden,
        },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return updatedItem;
    }),

  /**
   * Unhide a marketplace item
   */
  unhideItem: adminProcedure
    .input(
      z.object({
        itemId: z.string().cuid(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const item = await prisma.marketplaceItem.findUnique({
        where: { id: input.itemId },
      });

      if (!item) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Item not found' });
      }

      const updatedItem = await prisma.marketplaceItem.update({
        where: { id: input.itemId },
        data: {
          hidden: false,
          hiddenAt: null,
          hiddenBy: null,
        },
      });

      // Log the moderation action
      await logModerationAction({
        adminUserId: ctx.user.id,
        entityType: EntityType.MARKETPLACE_ITEM,
        entityId: input.itemId,
        action: ModerationAction.UNHIDE_ITEM,
        reason: input.reason,
        metadata: {
          itemName: item.name,
          authorRoleId: item.authorRoleId,
          type: item.type,
          visibility: item.visibility,
          wasHidden: item.hidden,
        },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return updatedItem;
    }),

  /**
   * Bulk hide marketplace items
   */
  bulkHideItems: adminProcedure
    .input(
      z.object({
        itemIds: z.array(z.string().cuid()).min(1),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await prisma.marketplaceItem.updateMany({
        where: {
          id: {
            in: input.itemIds,
          },
        },
        data: {
          hidden: true,
          hiddenAt: new Date(),
          hiddenBy: ctx.user.id,
        },
      });

      // Log the bulk moderation action
      await logBulkModerationAction({
        adminUserId: ctx.user.id,
        entityType: EntityType.MARKETPLACE_ITEM,
        entityIds: input.itemIds,
        action: ModerationAction.BULK_HIDE_ITEMS,
        reason: input.reason,
        metadata: {
          affectedCount: result.count,
        },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return { count: result.count };
    }),

  /**
   * Bulk unhide marketplace items
   */
  bulkUnhideItems: adminProcedure
    .input(
      z.object({
        itemIds: z.array(z.string().cuid()).min(1),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await prisma.marketplaceItem.updateMany({
        where: {
          id: {
            in: input.itemIds,
          },
        },
        data: {
          hidden: false,
          hiddenAt: null,
          hiddenBy: null,
        },
      });

      // Log the bulk moderation action
      await logBulkModerationAction({
        adminUserId: ctx.user.id,
        entityType: EntityType.MARKETPLACE_ITEM,
        entityIds: input.itemIds,
        action: ModerationAction.BULK_UNHIDE_ITEMS,
        reason: input.reason,
        metadata: {
          affectedCount: result.count,
        },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return { count: result.count };
    }),
});
