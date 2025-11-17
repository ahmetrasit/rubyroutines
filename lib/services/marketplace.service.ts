import { prisma } from '@/lib/prisma';
import { TRPCError } from '@trpc/server';
import {
  validateMarketplaceShareCode,
  incrementShareCodeUseCount,
  trackMarketplaceImport,
  hasUserImportedItem
} from './marketplace-share-code';

interface PublishToMarketplaceParams {
  type: 'ROUTINE' | 'GOAL';
  sourceId: string;
  authorRoleId: string;
  name: string;
  description: string;
  visibility?: string;
  category?: string;
  ageGroup?: string;
  tags?: string[];
}

interface UpdateMarketplaceItemParams {
  itemId: string;
  name?: string;
  description?: string;
  category?: string;
  ageGroup?: string;
  tags?: string[];
}

interface ForkMarketplaceItemParams {
  itemId: string;
  roleId: string;
  userId: string;
  targetId: string;
  targetType: 'PERSON' | 'GROUP';
}

interface ImportFromShareCodeParams {
  shareCode: string;
  roleId: string;
  userId: string;
  targetId: string;
  targetType: 'PERSON' | 'GROUP';
}

interface SearchMarketplaceParams {
  keyword?: string;
  category?: string;
  ageGroup?: string;
  tags?: string[];
  type?: 'ROUTINE' | 'GOAL';
  sortBy?: 'rating' | 'forkCount' | 'recent';
  limit?: number;
  offset?: number;
  userRoleType?: 'PARENT' | 'TEACHER'; // Filter by target audience
}

interface RateMarketplaceItemParams {
  itemId: string;
  userId: string;
  rating: number; // 1-5
}

interface AddCommentParams {
  itemId: string;
  userId: string;
  text: string;
}

interface FlagCommentParams {
  commentId: string;
  userId: string;
  reason: string;
}

/**
 * Increment semantic version (1.0.0 -> 1.0.1)
 */
function incrementVersion(version: string): string {
  const parts = version.split('.');
  const patch = parseInt(parts[2] || '0');
  return `${parts[0]}.${parts[1]}.${patch + 1}`;
}

/**
 * Serialize routine or goal to JSON content
 */
async function serializeContent(type: 'ROUTINE' | 'GOAL', sourceId: string): Promise<string> {
  if (type === 'ROUTINE') {
    const routine = await prisma.routine.findUnique({
      where: { id: sourceId },
      include: {
        tasks: {
          where: { status: 'ACTIVE' },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!routine) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Routine not found' });
    }

    return JSON.stringify({
      name: routine.name,
      description: routine.description,
      type: routine.type,
      resetPeriod: routine.resetPeriod,
      resetDay: routine.resetDay,
      visibility: routine.visibility,
      visibleDays: routine.visibleDays,
      tasks: routine.tasks.map((task) => ({
        name: task.name,
        description: task.description,
        type: task.type,
        order: task.order,
        targetValue: task.targetValue,
        unit: task.unit,
      })),
    });
  } else {
    const goal = await prisma.goal.findUnique({
      where: { id: sourceId },
      include: {
        taskLinks: {
          include: {
            task: true,
          },
        },
        routineLinks: {
          include: {
            routine: true,
          },
        },
      },
    });

    if (!goal) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Goal not found' });
    }

    return JSON.stringify({
      name: goal.name,
      description: goal.description,
      target: goal.target,
      period: goal.period,
      resetDay: goal.resetDay,
      taskLinks: goal.taskLinks.map((link) => ({
        taskName: link.task.name,
        weight: link.weight,
      })),
      routineLinks: goal.routineLinks.map((link) => ({
        routineName: link.routine.name,
        weight: link.weight,
      })),
    });
  }
}

/**
 * Publish a routine or goal to the marketplace
 */
export async function publishToMarketplace(params: PublishToMarketplaceParams) {
  const {
    type,
    sourceId,
    authorRoleId,
    name,
    description,
    visibility = 'PUBLIC',
    category,
    ageGroup,
    tags = [],
  } = params;

  // Get author role to detect target audience
  const authorRole = await prisma.role.findUnique({
    where: { id: authorRoleId },
    select: { type: true },
  });

  if (!authorRole) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Author role not found' });
  }

  // Auto-detect target audience from author role type
  const targetAudience = authorRole.type as 'PARENT' | 'TEACHER';

  // Serialize the content
  const content = await serializeContent(type, sourceId);

  // Create marketplace item
  const item = await prisma.marketplaceItem.create({
    data: {
      type,
      sourceId,
      authorRoleId,
      name,
      description,
      visibility,
      targetAudience,
      category,
      ageGroup,
      tags,
      version: '1.0.0',
      content,
    },
  });

  return item;
}

/**
 * Update an existing marketplace item with semantic versioning
 */
export async function updateMarketplaceItem(params: UpdateMarketplaceItemParams) {
  const { itemId, name, description, category, ageGroup, tags } = params;

  const existingItem = await prisma.marketplaceItem.findUnique({
    where: { id: itemId },
  });

  if (!existingItem) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Marketplace item not found' });
  }

  // Increment version
  const newVersion = incrementVersion(existingItem.version);

  // Re-serialize content if source still exists
  let content = existingItem.content;
  try {
    content = await serializeContent(
      existingItem.type as 'ROUTINE' | 'GOAL',
      existingItem.sourceId
    );
  } catch (error) {
    // If source is deleted, keep existing content
  }

  const updatedItem = await prisma.marketplaceItem.update({
    where: { id: itemId },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(category !== undefined && { category }),
      ...(ageGroup !== undefined && { ageGroup }),
      ...(tags && { tags }),
      version: newVersion,
      content,
    },
  });

  return updatedItem;
}

/**
 * Fork (import & customize) a marketplace item
 * Supports Daily Routine merging and RoutineAssignment pattern
 */
export async function forkMarketplaceItem(params: ForkMarketplaceItemParams) {
  const { itemId, roleId, userId, targetId, targetType } = params;

  const item = await prisma.marketplaceItem.findUnique({
    where: { id: itemId },
  });

  if (!item) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Marketplace item not found' });
  }

  const contentData = JSON.parse(item.content);

  let createdEntity;
  let assignments = [];

  if (item.type === 'ROUTINE') {
    const routineName = contentData.name;
    const isDailyRoutine = routineName.toLowerCase() === 'daily routine';

    if (isDailyRoutine) {
      // Check if Daily Routine already exists for this role
      const existingDailyRoutine = await prisma.routine.findFirst({
        where: {
          roleId,
          name: 'Daily Routine',
          status: 'ACTIVE',
        },
        include: {
          tasks: {
            where: { status: 'ACTIVE' },
            orderBy: { order: 'asc' },
          },
        },
      });

      if (existingDailyRoutine) {
        // Merge tasks into existing Daily Routine
        const maxOrder = existingDailyRoutine.tasks.length > 0
          ? Math.max(...existingDailyRoutine.tasks.map((t) => t.order))
          : -1;

        // Create new tasks from marketplace item
        const newTasks = (contentData.tasks || []).map((task: any, index: number) => ({
          routineId: existingDailyRoutine.id,
          name: task.name,
          description: task.description,
          type: task.type || 'SIMPLE',
          order: maxOrder + 1 + index,
          targetValue: task.targetValue,
          unit: task.unit,
        }));

        await prisma.task.createMany({
          data: newTasks,
        });

        createdEntity = existingDailyRoutine;
      } else {
        // Create new Daily Routine
        createdEntity = await prisma.routine.create({
          data: {
            roleId,
            name: routineName,
            description: contentData.description,
            type: contentData.type || 'REGULAR',
            resetPeriod: contentData.resetPeriod || 'DAILY',
            resetDay: contentData.resetDay,
            visibility: contentData.visibility || 'ALWAYS',
            visibleDays: contentData.visibleDays || [],
            sourceMarketplaceItemId: itemId,
            tasks: {
              create: (contentData.tasks || []).map((task: any) => ({
                name: task.name,
                description: task.description,
                type: task.type || 'SIMPLE',
                order: task.order || 0,
                targetValue: task.targetValue,
                unit: task.unit,
              })),
            },
          },
        });
      }
    } else {
      // Create regular routine (not Daily Routine)
      createdEntity = await prisma.routine.create({
        data: {
          roleId,
          name: routineName,
          description: contentData.description,
          type: contentData.type || 'REGULAR',
          resetPeriod: contentData.resetPeriod || 'DAILY',
          resetDay: contentData.resetDay,
          visibility: contentData.visibility || 'ALWAYS',
          visibleDays: contentData.visibleDays || [],
          sourceMarketplaceItemId: itemId,
          tasks: {
            create: (contentData.tasks || []).map((task: any) => ({
              name: task.name,
              description: task.description,
              type: task.type || 'SIMPLE',
              order: task.order || 0,
              targetValue: task.targetValue,
              unit: task.unit,
            })),
          },
        },
      });
    }

    // Create RoutineAssignment to link routine to person/group
    const assignment = await prisma.routineAssignment.create({
      data: {
        routineId: createdEntity.id,
        ...(targetType === 'PERSON' ? { personId: targetId } : { groupId: targetId }),
      },
    });

    assignments.push(assignment);
  } else {
    // Create goal from marketplace item
    createdEntity = await prisma.goal.create({
      data: {
        roleId,
        name: contentData.name,
        description: contentData.description,
        target: contentData.target,
        period: contentData.period || 'WEEKLY',
        resetDay: contentData.resetDay,
        sourceMarketplaceItemId: itemId,
      },
    });
  }

  // Track import in MarketplaceImport table
  await trackMarketplaceImport(itemId, userId, targetId, targetType, false);

  // Increment fork count
  await prisma.marketplaceItem.update({
    where: { id: itemId },
    data: {
      forkCount: {
        increment: 1,
      },
    },
  });

  return { entity: createdEntity, assignments };
}

/**
 * Import marketplace item or routine via share code
 * Handles both marketplace share codes and routine share codes
 */
export async function importFromShareCode(params: ImportFromShareCodeParams) {
  const { shareCode, roleId, userId, targetId, targetType } = params;

  // First, try to validate as a routine share code
  const { validateRoutineShareCode, incrementRoutineShareCodeUseCount } = await import('./routine-share-code');
  const routineValidation = await validateRoutineShareCode(shareCode);

  if (routineValidation.valid && routineValidation.shareCode) {
    // This is a routine share code
    const { routineId } = routineValidation.shareCode;

    // Get the original routine
    const routine = await prisma.routine.findUnique({
      where: { id: routineId },
      include: {
        tasks: {
          where: { status: 'ACTIVE' },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!routine) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Routine not found',
      });
    }

    // Create a copy of the routine for the target role
    const newRoutine = await prisma.routine.create({
      data: {
        roleId,
        name: routine.name,
        description: routine.description,
        type: routine.type,
        resetPeriod: routine.resetPeriod,
        resetDay: routine.resetDay,
        visibility: routine.visibility,
        visibleDays: routine.visibleDays,
        startDate: routine.startDate,
        endDate: routine.endDate,
        color: routine.color,
        tasks: {
          create: routine.tasks.map((task: any) => ({
            name: task.name,
            description: task.description,
            type: task.type || 'SIMPLE',
            order: task.order || 0,
            targetValue: task.targetValue,
            unit: task.unit,
          })),
        },
      },
      include: {
        tasks: true,
      },
    });

    // Create RoutineAssignment to link routine to person/group
    const assignment = await prisma.routineAssignment.create({
      data: {
        routineId: newRoutine.id,
        ...(targetType === 'PERSON' ? { personId: targetId } : { groupId: targetId }),
      },
    });

    // Increment share code use count
    await incrementRoutineShareCodeUseCount(routineValidation.shareCode.id);

    return {
      entity: newRoutine,
      type: 'ROUTINE',
      assignments: [assignment],
    };
  }

  // If not a routine code, try marketplace share code
  const marketplaceValidation = await validateMarketplaceShareCode(shareCode);

  if (!marketplaceValidation.valid || !marketplaceValidation.shareCode) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: marketplaceValidation.error || 'Invalid share code',
    });
  }

  const { marketplaceItemId } = marketplaceValidation.shareCode;

  // Import the item using fork logic
  const result = await forkMarketplaceItem({
    itemId: marketplaceItemId,
    roleId,
    userId,
    targetId,
    targetType,
  });

  // Update import record to mark as imported via code
  await trackMarketplaceImport(marketplaceItemId, userId, targetId, targetType, true);

  // Increment share code use count
  await incrementShareCodeUseCount(marketplaceValidation.shareCode.id);

  return result;
}

/**
 * Search marketplace items
 */
export async function searchMarketplace(params: SearchMarketplaceParams) {
  const {
    keyword,
    category,
    ageGroup,
    tags,
    type,
    sortBy = 'rating',
    limit = 20,
    offset = 0,
    userRoleType,
  } = params;

  const where: any = {
    visibility: 'PUBLIC',
  };

  // Filter by target audience based on user's role type
  if (userRoleType) {
    where.targetAudience = userRoleType;
  }

  if (keyword) {
    where.OR = [
      { name: { contains: keyword, mode: 'insensitive' } },
      { description: { contains: keyword, mode: 'insensitive' } },
    ];
  }

  if (category) {
    where.category = category;
  }

  if (ageGroup) {
    where.ageGroup = ageGroup;
  }

  if (tags && tags.length > 0) {
    where.tags = {
      hasSome: tags,
    };
  }

  if (type) {
    where.type = type;
  }

  let orderBy: any = {};
  switch (sortBy) {
    case 'rating':
      orderBy = { rating: 'desc' };
      break;
    case 'forkCount':
      orderBy = { forkCount: 'desc' };
      break;
    case 'recent':
      orderBy = { createdAt: 'desc' };
      break;
    default:
      orderBy = { rating: 'desc' };
  }

  const items = await prisma.marketplaceItem.findMany({
    where,
    orderBy,
    take: limit,
    skip: offset,
    include: {
      authorRole: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  const total = await prisma.marketplaceItem.count({ where });

  return {
    items,
    total,
    hasMore: offset + limit < total,
  };
}

/**
 * Rate a marketplace item (1-5 stars)
 * Restriction: Only users who have imported the item can rate it
 */
export async function rateMarketplaceItem(params: RateMarketplaceItemParams) {
  const { itemId, userId, rating } = params;

  if (rating < 1 || rating > 5) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Rating must be between 1 and 5',
    });
  }

  // Check if user has imported this item
  const hasImported = await hasUserImportedItem(itemId, userId);

  if (!hasImported) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You must import this item before you can rate it',
    });
  }

  // Upsert rating
  const existingRating = await prisma.marketplaceRating.findUnique({
    where: {
      marketplaceItemId_userId: {
        marketplaceItemId: itemId,
        userId,
      },
    },
  });

  if (existingRating) {
    await prisma.marketplaceRating.update({
      where: { id: existingRating.id },
      data: { rating },
    });
  } else {
    await prisma.marketplaceRating.create({
      data: {
        marketplaceItemId: itemId,
        userId,
        rating,
      },
    });
  }

  // Recalculate average rating
  const ratings = await prisma.marketplaceRating.findMany({
    where: { marketplaceItemId: itemId },
  });

  const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = ratings.length > 0 ? totalRating / ratings.length : 0;

  await prisma.marketplaceItem.update({
    where: { id: itemId },
    data: {
      rating: Math.round(averageRating * 100) / 100,
      ratingCount: ratings.length,
    },
  });

  return { success: true, averageRating };
}

/**
 * Add a comment to a marketplace item
 */
export async function addComment(params: AddCommentParams) {
  const { itemId, userId, text } = params;

  if (text.length > 500) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Comment must be 500 characters or less',
    });
  }

  const comment = await prisma.marketplaceComment.create({
    data: {
      marketplaceItemId: itemId,
      userId,
      text,
    },
    include: {
      user: {
        select: {
          name: true,
          image: true,
        },
      },
    },
  });

  return comment;
}

/**
 * Flag a comment for review
 */
export async function flagComment(params: FlagCommentParams) {
  const { commentId, userId, reason } = params;

  // Create flag
  const existingFlag = await prisma.commentFlag.findUnique({
    where: {
      commentId_userId: {
        commentId,
        userId,
      },
    },
  });

  if (existingFlag) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'You have already flagged this comment',
    });
  }

  await prisma.commentFlag.create({
    data: {
      commentId,
      userId,
      reason,
    },
  });

  // Count flags
  const flagCount = await prisma.commentFlag.count({
    where: { commentId },
  });

  // Auto-hide if >= 3 flags
  if (flagCount >= 3) {
    await prisma.marketplaceComment.update({
      where: { id: commentId },
      data: { status: 'HIDDEN' },
    });
  }

  return { success: true, flagCount };
}
