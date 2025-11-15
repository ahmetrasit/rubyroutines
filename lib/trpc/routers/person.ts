import { router, authorizedProcedure, verifyPersonOwnership } from '../init';
import { TRPCError } from '@trpc/server';
import { EntityStatus } from '@/lib/types/prisma-enums';
import { checkTierLimit } from '@/lib/services/tier-limits';
import {
  createPersonSchema,
  updatePersonSchema,
  deletePersonSchema,
  restorePersonSchema,
  listPersonsSchema,
  getPersonSchema,
} from '@/lib/validation/person';

export const personRouter = router({
  list: authorizedProcedure
    .input(listPersonsSchema)
    .query(async ({ ctx, input }) => {
      const persons = await ctx.prisma.person.findMany({
        where: {
          roleId: input.roleId,
          status: input.includeInactive ? undefined : EntityStatus.ACTIVE,
        },
        orderBy: { name: 'asc' },
      });

      return persons;
    }),

  getById: authorizedProcedure
    .input(getPersonSchema)
    .query(async ({ ctx, input }) => {
      // Verify person ownership
      await verifyPersonOwnership(ctx.user.id, input.id, ctx.prisma);

      const person = await ctx.prisma.person.findUnique({
        where: { id: input.id },
        include: {
          groupMembers: {
            include: {
              group: true,
            },
          },
          assignments: {
            where: { routine: { status: EntityStatus.ACTIVE } },
            include: {
              routine: {
                include: {
                  tasks: {
                    where: { status: EntityStatus.ACTIVE },
                    orderBy: { order: 'asc' },
                  },
                },
              },
            },
          },
        },
      });

      if (!person) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Person not found' });
      }

      return person;
    }),

  create: authorizedProcedure
    .input(createPersonSchema)
    .mutation(async ({ ctx, input }) => {
      // Get role to check tier and type
      const role = await ctx.prisma.role.findUnique({
        where: { id: input.roleId },
        include: {
          persons: {
            where: { status: EntityStatus.ACTIVE },
          },
        },
      });

      if (!role) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Role not found' });
      }

      // Check tier limit based on role type
      const limitKey =
        role.type === 'PARENT' ? 'children_per_family' : 'students_per_classroom';
      checkTierLimit(role.tier, limitKey, role.persons.length);

      // Check for inactive person with same name (suggest restore)
      const existingInactive = await ctx.prisma.person.findFirst({
        where: {
          roleId: input.roleId,
          name: input.name,
          status: EntityStatus.INACTIVE,
        },
      });

      if (existingInactive) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A person with this name exists but is inactive. Would you like to restore them?',
        });
      }

      // Create person
      const person = await ctx.prisma.person.create({
        data: input,
      });

      // Auto-create "Daily Routine" for this person
      const dailyRoutine = await ctx.prisma.routine.create({
        data: {
          roleId: input.roleId,
          name: '☀️ Daily Routine',
          description: 'Default routine for daily tasks',
          resetPeriod: 'DAILY',
          color: '#3B82F6',
          status: EntityStatus.ACTIVE,
          assignments: {
            create: {
              personId: person.id,
            },
          },
        },
      });

      return person;
    }),

  update: authorizedProcedure
    .input(updatePersonSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Verify person ownership
      await verifyPersonOwnership(ctx.user.id, id, ctx.prisma);

      const person = await ctx.prisma.person.update({
        where: { id },
        data,
      });

      return person;
    }),

  delete: authorizedProcedure
    .input(deletePersonSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify person ownership
      await verifyPersonOwnership(ctx.user.id, input.id, ctx.prisma);

      // Get person to access roleId and groups
      const existingPerson = await ctx.prisma.person.findUnique({
        where: { id: input.id },
        select: { roleId: true, groupMembers: { select: { groupId: true } } }
      });

      if (!existingPerson) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Person not found',
        });
      }

      // Soft delete by setting status to INACTIVE and update timestamps for kiosk polling
      const now = new Date();
      const groupUpdates = existingPerson.groupMembers.map(({ groupId }) =>
        ctx.prisma.group.update({
          where: { id: groupId },
          data: { kioskLastUpdatedAt: now }
        })
      );

      const [person] = await ctx.prisma.$transaction([
        ctx.prisma.person.update({
          where: { id: input.id },
          data: {
            status: EntityStatus.INACTIVE,
            archivedAt: now,
            kioskLastUpdatedAt: now,
          },
        }),
        ctx.prisma.role.update({
          where: { id: existingPerson.roleId },
          data: { kioskLastUpdatedAt: now }
        }),
        ...groupUpdates
      ]);

      return person;
    }),

  restore: authorizedProcedure
    .input(restorePersonSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify person ownership
      await verifyPersonOwnership(ctx.user.id, input.id, ctx.prisma);

      // Get person to access roleId and groups
      const existingPerson = await ctx.prisma.person.findUnique({
        where: { id: input.id },
        select: { roleId: true, groupMembers: { select: { groupId: true } } }
      });

      if (!existingPerson) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Person not found',
        });
      }

      // Restore person and update timestamps for kiosk polling
      const now = new Date();
      const groupUpdates = existingPerson.groupMembers.map(({ groupId }) =>
        ctx.prisma.group.update({
          where: { id: groupId },
          data: { kioskLastUpdatedAt: now }
        })
      );

      const [person] = await ctx.prisma.$transaction([
        ctx.prisma.person.update({
          where: { id: input.id },
          data: {
            status: EntityStatus.ACTIVE,
            archivedAt: null,
            kioskLastUpdatedAt: now,
          },
        }),
        ctx.prisma.role.update({
          where: { id: existingPerson.roleId },
          data: { kioskLastUpdatedAt: now }
        }),
        ...groupUpdates
      ]);

      return person;
    }),
});
