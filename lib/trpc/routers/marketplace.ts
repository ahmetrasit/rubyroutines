import { router, authorizedProcedure, verifiedProcedure, verifyRoleOwnership } from '../init';
import { z } from 'zod';
import {
  publishToMarketplace,
  updateMarketplaceItem,
  forkMarketplaceItem,
  searchMarketplace,
  rateMarketplaceItem,
  addComment,
  flagComment,
} from '@/lib/services/marketplace.service';

export const marketplaceRouter = router({
  /**
   * Publish a routine or goal to the marketplace
   * Requires email verification
   */
  publish: verifiedProcedure
    .input(
      z.object({
        type: z.enum(['ROUTINE', 'GOAL']),
        sourceId: z.string().cuid(),
        authorRoleId: z.string().cuid(),
        name: z.string().min(1).max(100),
        description: z.string().max(1000).default(''),
        visibility: z.string().default('PUBLIC'),
        category: z.string().optional(),
        ageGroup: z.string().optional(),
        tags: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ input }) => {
      const item = await publishToMarketplace(input);
      return item;
    }),

  /**
   * Update an existing marketplace item
   */
  update: authorizedProcedure
    .input(
      z.object({
        itemId: z.string().cuid(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(1000).optional(),
        category: z.string().optional(),
        ageGroup: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const item = await updateMarketplaceItem(input);
      return item;
    }),

  /**
   * Fork (import & customize) a marketplace item
   */
  fork: authorizedProcedure
    .input(
      z.object({
        itemId: z.string().cuid(),
        roleId: z.string().cuid(),
      })
    )
    .mutation(async ({ input }) => {
      const entity = await forkMarketplaceItem(input);
      return entity;
    }),

  /**
   * Search marketplace items
   */
  search: authorizedProcedure
    .input(
      z.object({
        keyword: z.string().optional(),
        category: z.string().optional(),
        ageGroup: z.string().optional(),
        tags: z.array(z.string()).optional(),
        type: z.enum(['ROUTINE', 'GOAL']).optional(),
        sortBy: z.enum(['rating', 'forkCount', 'recent']).default('rating'),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const result = await searchMarketplace(input);
      return result;
    }),

  /**
   * Rate a marketplace item (1-5 stars)
   */
  rate: authorizedProcedure
    .input(
      z.object({
        itemId: z.string().cuid(),
        rating: z.number().min(1).max(5),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new Error('User not found');
      }

      const result = await rateMarketplaceItem({
        itemId: input.itemId,
        userId: ctx.user.id,
        rating: input.rating,
      });

      return result;
    }),

  /**
   * Add a comment to a marketplace item
   */
  comment: authorizedProcedure
    .input(
      z.object({
        itemId: z.string().cuid(),
        text: z.string().min(1).max(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new Error('User not found');
      }

      const comment = await addComment({
        itemId: input.itemId,
        userId: ctx.user.id,
        text: input.text,
      });

      return comment;
    }),

  /**
   * Flag a comment for review
   */
  flag: authorizedProcedure
    .input(
      z.object({
        commentId: z.string().cuid(),
        reason: z.string().min(1).max(200),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new Error('User not found');
      }

      const result = await flagComment({
        commentId: input.commentId,
        userId: ctx.user.id,
        reason: input.reason,
      });

      return result;
    }),

  /**
   * Get marketplace item by ID
   */
  getById: authorizedProcedure
    .input(z.object({ itemId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const item = await ctx.prisma.marketplaceItem.findUnique({
        where: { id: input.itemId },
        include: {
          authorRole: {
            include: {
              user: {
                select: {
                  name: true,
                  image: true,
                },
              },
            },
          },
          ratings: {
            where: {
              userId: ctx.user?.id,
            },
          },
          comments: {
            where: {
              status: 'ACTIVE',
            },
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
            take: 20,
          },
        },
      });

      return item;
    }),

  /**
   * Get comments for a marketplace item
   */
  getComments: authorizedProcedure
    .input(
      z.object({
        itemId: z.string().cuid(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const comments = await ctx.prisma.marketplaceComment.findMany({
        where: {
          marketplaceItemId: input.itemId,
          status: 'ACTIVE',
        },
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
        take: input.limit,
        skip: input.offset,
      });

      const total = await ctx.prisma.marketplaceComment.count({
        where: {
          marketplaceItemId: input.itemId,
          status: 'ACTIVE',
        },
      });

      return {
        comments,
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),
});
