import { router, publicProcedure, protectedProcedure, adminProcedure } from '../init';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

/**
 * Blog Router
 * - Public: read published posts
 * - Protected: like/unlike posts (logged in users only)
 * - Admin: CRUD operations
 */
export const blogRouter = router({
  /**
   * Get all published blog posts (public)
   */
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;
      const offset = input?.offset ?? 0;

      const [posts, total] = await Promise.all([
        ctx.prisma.blogPost.findMany({
          where: { published: true },
          orderBy: { publishedAt: 'desc' },
          take: limit,
          skip: offset,
          include: {
            _count: {
              select: { likes: true },
            },
          },
        }),
        ctx.prisma.blogPost.count({
          where: { published: true },
        }),
      ]);

      return {
        posts: posts.map((post) => ({
          ...post,
          likeCount: post._count.likes,
        })),
        total,
        hasMore: offset + posts.length < total,
      };
    }),

  /**
   * Get a single blog post by slug (public)
   */
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const post = await ctx.prisma.blogPost.findUnique({
        where: { slug: input.slug },
        include: {
          _count: {
            select: { likes: true },
          },
        },
      });

      if (!post) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Blog post not found',
        });
      }

      // Only allow viewing published posts (unless admin)
      if (!post.published) {
        // Check if user is admin
        const user = ctx.user;
        if (!user) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Blog post not found',
          });
        }

        const dbUser = await ctx.prisma.user.findUnique({
          where: { id: user.id },
          select: { isAdmin: true },
        });

        if (!dbUser?.isAdmin) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Blog post not found',
          });
        }
      }

      // Check if current user has liked
      let userHasLiked = false;
      if (ctx.user) {
        const like = await ctx.prisma.blogLike.findUnique({
          where: {
            postId_userId: {
              postId: post.id,
              userId: ctx.user.id,
            },
          },
        });
        userHasLiked = !!like;
      }

      return {
        ...post,
        likeCount: post._count.likes,
        userHasLiked,
      };
    }),

  /**
   * Toggle like on a post (protected - logged in users only)
   */
  toggleLike: protectedProcedure
    .input(z.object({ postId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      // Check post exists and is published
      const post = await ctx.prisma.blogPost.findUnique({
        where: { id: input.postId },
        select: { id: true, published: true },
      });

      if (!post || !post.published) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Blog post not found',
        });
      }

      // Check if already liked
      const existingLike = await ctx.prisma.blogLike.findUnique({
        where: {
          postId_userId: {
            postId: input.postId,
            userId: ctx.user.id,
          },
        },
      });

      if (existingLike) {
        // Unlike
        await ctx.prisma.blogLike.delete({
          where: { id: existingLike.id },
        });
        return { liked: false };
      } else {
        // Like
        await ctx.prisma.blogLike.create({
          data: {
            postId: input.postId,
            userId: ctx.user.id,
          },
        });
        return { liked: true };
      }
    }),

  /**
   * Get like count for a post (public)
   */
  getLikeCount: publicProcedure
    .input(z.object({ postId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const count = await ctx.prisma.blogLike.count({
        where: { postId: input.postId },
      });

      let userHasLiked = false;
      if (ctx.user) {
        const like = await ctx.prisma.blogLike.findUnique({
          where: {
            postId_userId: {
              postId: input.postId,
              userId: ctx.user.id,
            },
          },
        });
        userHasLiked = !!like;
      }

      return { count, userHasLiked };
    }),

  // ============================================================================
  // ADMIN OPERATIONS
  // ============================================================================

  /**
   * Get all posts (admin only - includes drafts)
   */
  adminList: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
        includeUnpublished: z.boolean().default(true),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;
      const offset = input?.offset ?? 0;
      const includeUnpublished = input?.includeUnpublished ?? true;

      const where = includeUnpublished ? {} : { published: true };

      const [posts, total] = await Promise.all([
        ctx.prisma.blogPost.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
          include: {
            _count: {
              select: { likes: true },
            },
          },
        }),
        ctx.prisma.blogPost.count({ where }),
      ]);

      return {
        posts: posts.map((post) => ({
          ...post,
          likeCount: post._count.likes,
        })),
        total,
      };
    }),

  /**
   * Create a new blog post (admin only)
   */
  create: adminProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
        content: z.string().min(1),
        excerpt: z.string().max(500).optional(),
        published: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check slug uniqueness
      const existing = await ctx.prisma.blogPost.findUnique({
        where: { slug: input.slug },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A post with this slug already exists',
        });
      }

      const post = await ctx.prisma.blogPost.create({
        data: {
          title: input.title,
          slug: input.slug,
          content: input.content,
          excerpt: input.excerpt,
          published: input.published,
          publishedAt: input.published ? new Date() : null,
        },
      });

      return post;
    }),

  /**
   * Update a blog post (admin only)
   */
  update: adminProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        title: z.string().min(1).max(200).optional(),
        slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
        content: z.string().min(1).optional(),
        excerpt: z.string().max(500).optional().nullable(),
        published: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // Check post exists
      const existing = await ctx.prisma.blogPost.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Blog post not found',
        });
      }

      // If changing slug, check uniqueness
      if (updateData.slug && updateData.slug !== existing.slug) {
        const slugExists = await ctx.prisma.blogPost.findUnique({
          where: { slug: updateData.slug },
        });

        if (slugExists) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'A post with this slug already exists',
          });
        }
      }

      // Handle publishedAt when publishing/unpublishing
      let publishedAt = existing.publishedAt;
      if (updateData.published !== undefined) {
        if (updateData.published && !existing.published) {
          // Publishing for the first time or re-publishing
          publishedAt = new Date();
        } else if (!updateData.published) {
          // Unpublishing - keep original publishedAt for reference
        }
      }

      const post = await ctx.prisma.blogPost.update({
        where: { id },
        data: {
          ...updateData,
          publishedAt,
        },
      });

      return post;
    }),

  /**
   * Delete a blog post (admin only)
   */
  delete: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.blogPost.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Blog post not found',
        });
      }

      await ctx.prisma.blogPost.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Get a single post by ID (admin only - for editing)
   */
  adminGetById: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const post = await ctx.prisma.blogPost.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: { likes: true },
          },
        },
      });

      if (!post) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Blog post not found',
        });
      }

      return {
        ...post,
        likeCount: post._count.likes,
      };
    }),
});
