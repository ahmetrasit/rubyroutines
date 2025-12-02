import { router, protectedProcedure } from '../init';
import { TRPCError } from '@trpc/server';
import { EntityStatus } from '@/lib/types/prisma-enums';
import { createDefaultTeacherOnlyRoutine } from '@/lib/services/teacher-only-routine.service';
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
    // Verify role ownership
    const role = await ctx.prisma.role.findUnique({
      where: { id: input.roleId }
    });

    if (!role || role.userId !== ctx.user.id) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have access to this role' });
    }

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

    // Verify role ownership
    if (group.role.userId !== ctx.user.id) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have access to this group' });
    }

    return group;
  }),

  create: protectedProcedure.input(createGroupSchema).mutation(async ({ ctx, input }) => {
    // Verify role ownership
    const role = await ctx.prisma.role.findUnique({
      where: { id: input.roleId }
    });

    if (!role || role.userId !== ctx.user.id) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have access to this role' });
    }

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

    // For classrooms, ALWAYS create a new "Me" person specific to this classroom
    // Each classroom should have its own separate teacher/account owner person
    let mePerson = null;
    if (input.type === 'CLASSROOM') {
      // Get user's name for the person
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: { name: true },
      });

      const defaultAvatar = JSON.stringify({
        color: '#3b82f6',
        emoji: '👤',
      });

      // Always create a new person for each classroom
      // isAccountOwner is false because each classroom has its own "Me"
      // (only the original "Me" in the default Teacher-Only classroom is the true account owner)
      // isTeacher is true to identify this person as a teacher (not a student)
      mePerson = await ctx.prisma.person.create({
        data: {
          roleId: input.roleId,
          name: user?.name || 'Me',
          avatar: defaultAvatar,
          status: EntityStatus.ACTIVE,
          isAccountOwner: false,
          isTeacher: true,
        },
      });
    }

    // Create group and update role timestamp for kiosk polling
    const [group] = await ctx.prisma.$transaction([
      ctx.prisma.group.create({
        data: {
          roleId: input.roleId,
          name: input.name,
          type: input.type,
          description: input.description,
          emoji: input.emoji,
          color: input.color,
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

    if (!existingGroup) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Group not found' });
    }

    // Verify role ownership
    if (existingGroup.role.userId !== ctx.user.id) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have access to this group' });
    }

    if (existingGroup.name === 'Teacher-Only') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'The default Teacher-Only classroom cannot be modified',
      });
    }

    // Update group and role + group timestamps for kiosk polling
    const now = new Date();
    const [group] = await ctx.prisma.$transaction([
      ctx.prisma.group.update({
        where: { id },
        data: {
          ...data,
          kioskLastUpdatedAt: now
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
        where: { id: existingGroup.roleId },
        data: { kioskLastUpdatedAt: now }
      })
    ]);

    return group;
  }),

  delete: protectedProcedure.input(deleteGroupSchema).mutation(async ({ ctx, input }) => {
    // Check if this is the protected default classroom
    const existingGroup = await ctx.prisma.group.findUnique({
      where: { id: input.id },
      include: { role: true }
    });

    if (!existingGroup) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Group not found' });
    }

    // Verify role ownership
    if (existingGroup.role.userId !== ctx.user.id) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have access to this group' });
    }

    if (existingGroup.name === 'Teacher-Only') {
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

    // Get group to access roleId and verify ownership
    const group = await ctx.prisma.group.findUnique({
      where: { id: input.groupId },
      include: { role: true }
    });

    if (!group) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Group not found',
      });
    }

    // Verify role ownership
    if (group.role.userId !== ctx.user.id) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have access to this group' });
    }

    // Add member and update role + group timestamps for kiosk polling
    const now = new Date();
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
        data: { kioskLastUpdatedAt: now }
      }),
      ctx.prisma.group.update({
        where: { id: input.groupId },
        data: { kioskLastUpdatedAt: now }
      })
    ]);

    // Get person details to determine if teacher-only routine should be created
    const addedPerson = await ctx.prisma.person.findUnique({
      where: { id: input.personId },
      select: { isAccountOwner: true, isTeacher: true }
    });

    // Create teacher-only routine if adding student to classroom
    // Only create for students (not teachers or account owners)
    if (group.role.type === 'TEACHER' && !addedPerson?.isAccountOwner && !addedPerson?.isTeacher) {
      await createDefaultTeacherOnlyRoutine(group.roleId, input.personId, group.role.type);
    }

    return member;
  }),

  removeMember: protectedProcedure.input(removeMemberSchema).mutation(async ({ ctx, input }) => {
    // Get group to access roleId and verify ownership
    const group = await ctx.prisma.group.findUnique({
      where: { id: input.groupId },
      include: { role: true }
    });

    if (!group) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Group not found',
      });
    }

    // Verify role ownership
    if (group.role.userId !== ctx.user.id) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have access to this group' });
    }

    // Remove member and update role + group timestamps for kiosk polling
    const now = new Date();
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
        data: { kioskLastUpdatedAt: now }
      }),
      ctx.prisma.group.update({
        where: { id: input.groupId },
        data: { kioskLastUpdatedAt: now }
      })
    ]);

    return member;
  }),

  restore: protectedProcedure.input(getGroupByIdSchema).mutation(async ({ ctx, input }) => {
    // Verify ownership before restoring
    const existingGroup = await ctx.prisma.group.findUnique({
      where: { id: input.id },
      include: { role: true }
    });

    if (!existingGroup) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Group not found' });
    }

    // Verify role ownership
    if (existingGroup.role.userId !== ctx.user.id) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have access to this group' });
    }

    const group = await ctx.prisma.group.update({
      where: { id: input.id },
      data: {
        status: EntityStatus.ACTIVE,
      },
    });

    return group;
  }),
});
