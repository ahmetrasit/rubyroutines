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
      orderBy: { createdAt: 'asc' },
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
    // Check for duplicate classroom name within the same role
    const existingGroup = await ctx.prisma.group.findFirst({
      where: {
        roleId: input.roleId,
        name: input.name,
        status: EntityStatus.ACTIVE,
      },
    });

    if (existingGroup) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'A classroom with this name already exists',
      });
    }

    // For classrooms, ensure a "Me" person exists
    let mePerson = null;
    if (input.type === 'CLASSROOM') {
      // Find or create "Me" person for this role
      mePerson = await ctx.prisma.person.findFirst({
        where: {
          roleId: input.roleId,
          name: 'Me',
        },
      });

      if (!mePerson) {
        // Create "Me" person with default avatar
        const defaultAvatar = JSON.stringify({
          color: '#FFB3BA',
          emoji: '👤',
        });

        mePerson = await ctx.prisma.person.create({
          data: {
            roleId: input.roleId,
            name: 'Me',
            avatar: defaultAvatar,
            status: EntityStatus.ACTIVE,
            isProtected: true,
          },
        });
      }
    }

    // Create group and update role timestamp for kiosk polling
    const [group] = await ctx.prisma.$transaction([
      ctx.prisma.group.create({
        data: {
          roleId: input.roleId,
          name: input.name,
          type: input.type,
          description: input.description,
          status: EntityStatus.ACTIVE,
          // Add "Me" person as member if this is a classroom
          members: mePerson ? {
            create: {
              personId: mePerson.id,
              role: 'member',
            },
          } : undefined,
        },
        include: {
          members: {
            include: {
              person: true,
            },
          },
        },
      }),
      ctx.prisma.role.update({
        where: { id: input.roleId },
        data: { kioskLastUpdatedAt: new Date() }
      })
    ]);

    return group;
  }),

  update: protectedProcedure.input(updateGroupSchema).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input;

    // Check if this is the protected default classroom
    const existingGroup = await ctx.prisma.group.findUnique({
      where: { id },
      include: { role: true }
    });

    if (existingGroup && existingGroup.name === 'Teacher-Only') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'The default Teacher-Only classroom cannot be modified',
      });
    }

    // Update group and role timestamp for kiosk polling
    const [group] = await ctx.prisma.$transaction([
      ctx.prisma.group.update({
        where: { id },
        data,
        include: {
          members: {
            include: {
              person: true,
            },
          },
        },
      }),
      ctx.prisma.role.update({
        where: { id: existingGroup!.roleId },
        data: { kioskLastUpdatedAt: new Date() }
      })
    ]);

    return group;
  }),

  delete: protectedProcedure.input(deleteGroupSchema).mutation(async ({ ctx, input }) => {
    // Check if this is the protected default classroom
    const existingGroup = await ctx.prisma.group.findUnique({
      where: { id: input.id },
    });

    if (existingGroup && existingGroup.name === 'Teacher-Only') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'The default Teacher-Only classroom cannot be removed',
      });
    }

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

    // Get group to access roleId
    const group = await ctx.prisma.group.findUnique({
      where: { id: input.groupId },
      select: { roleId: true }
    });

    if (!group) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Group not found',
      });
    }

    // Add member and update role timestamp for kiosk polling
    const [member] = await ctx.prisma.$transaction([
      ctx.prisma.groupMember.create({
        data: {
          groupId: input.groupId,
          personId: input.personId,
        },
        include: {
          person: true,
          group: true,
        },
      }),
      ctx.prisma.role.update({
        where: { id: group.roleId },
        data: { kioskLastUpdatedAt: new Date() }
      })
    ]);

    return member;
  }),

  removeMember: protectedProcedure.input(removeMemberSchema).mutation(async ({ ctx, input }) => {
    // Get group to access roleId
    const group = await ctx.prisma.group.findUnique({
      where: { id: input.groupId },
      select: { roleId: true }
    });

    if (!group) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Group not found',
      });
    }

    // Remove member and update role timestamp for kiosk polling
    const [member] = await ctx.prisma.$transaction([
      ctx.prisma.groupMember.delete({
        where: {
          groupId_personId: {
            groupId: input.groupId,
            personId: input.personId,
          },
        },
      }),
      ctx.prisma.role.update({
        where: { id: group.roleId },
        data: { kioskLastUpdatedAt: new Date() }
      })
    ]);

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
