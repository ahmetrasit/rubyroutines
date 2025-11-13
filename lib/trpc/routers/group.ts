import { router, protectedProcedure } from '../init';
import { TRPCError } from '@trpc/server';
import { EntityStatus } from '@/lib/types/prisma-enums';
import {
  createGroupSchema,
  updateGroupSchema,
  deleteGroupSchema,
  addMemberSchema,
  removeMemberSchema,
  listGroupsSchema,
  getGroupByIdSchema,
} from '@/lib/validation/group';

export const groupRouter = router({
  list: protectedProcedure.input(listGroupsSchema).query(async ({ ctx, input }) => {
    const groups = await ctx.prisma.group.findMany({
      where: {
        roleId: input.roleId,
        status: input.includeInactive ? undefined : EntityStatus.ACTIVE,
      },
      include: {
        members: {
          include: {
            person: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return groups;
  }),

  getById: protectedProcedure.input(getGroupByIdSchema).query(async ({ ctx, input }) => {
    const group = await ctx.prisma.group.findUnique({
      where: { id: input.id },
      include: {
        members: {
          include: {
            person: true,
          },
        },
        role: true,
      },
    });

    if (!group) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Group not found',
      });
    }

    return group;
  }),

  create: protectedProcedure.input(createGroupSchema).mutation(async ({ ctx, input }) => {
    const group = await ctx.prisma.group.create({
      data: {
        roleId: input.roleId,
        name: input.name,
        type: input.type,
        description: input.description,
        status: EntityStatus.ACTIVE,
      },
      include: {
        members: {
          include: {
            person: true,
          },
        },
      },
    });

    return group;
  }),

  update: protectedProcedure.input(updateGroupSchema).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input;

    const group = await ctx.prisma.group.update({
      where: { id },
      data,
      include: {
        members: {
          include: {
            person: true,
          },
        },
      },
    });

    return group;
  }),

  delete: protectedProcedure.input(deleteGroupSchema).mutation(async ({ ctx, input }) => {
    // Soft delete
    const group = await ctx.prisma.group.update({
      where: { id: input.id },
      data: {
        status: EntityStatus.INACTIVE,
      },
    });

    return group;
  }),

  addMember: protectedProcedure.input(addMemberSchema).mutation(async ({ ctx, input }) => {
    // Check if member already exists
    const existing = await ctx.prisma.groupMember.findUnique({
      where: {
        groupId_personId: {
          groupId: input.groupId,
          personId: input.personId,
        },
      },
    });

    if (existing) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Person is already a member of this group',
      });
    }

    const member = await ctx.prisma.groupMember.create({
      data: {
        groupId: input.groupId,
        personId: input.personId,
      },
      include: {
        person: true,
        group: true,
      },
    });

    return member;
  }),

  removeMember: protectedProcedure.input(removeMemberSchema).mutation(async ({ ctx, input }) => {
    const member = await ctx.prisma.groupMember.delete({
      where: {
        groupId_personId: {
          groupId: input.groupId,
          personId: input.personId,
        },
      },
    });

    return member;
  }),

  restore: protectedProcedure.input(getGroupByIdSchema).mutation(async ({ ctx, input }) => {
    const group = await ctx.prisma.group.update({
      where: { id: input.id },
      data: {
        status: EntityStatus.ACTIVE,
      },
    });

    return group;
  }),
});
