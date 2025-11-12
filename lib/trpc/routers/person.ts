import { router, protectedProcedure } from '../init';
import { TRPCError } from '@trpc/server';
import { EntityStatus } from '@prisma/client';
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
  list: protectedProcedure
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

  getById: protectedProcedure
    .input(getPersonSchema)
    .query(async ({ ctx, input }) => {
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

  create: protectedProcedure
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

      return person;
    }),

  update: protectedProcedure
    .input(updatePersonSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const person = await ctx.prisma.person.update({
        where: { id },
        data,
      });

      return person;
    }),

  delete: protectedProcedure
    .input(deletePersonSchema)
    .mutation(async ({ ctx, input }) => {
      // Soft delete by setting status to INACTIVE
      const person = await ctx.prisma.person.update({
        where: { id: input.id },
        data: {
          status: EntityStatus.INACTIVE,
          archivedAt: new Date(),
        },
      });

      return person;
    }),

  restore: protectedProcedure
    .input(restorePersonSchema)
    .mutation(async ({ ctx, input }) => {
      const person = await ctx.prisma.person.update({
        where: { id: input.id },
        data: {
          status: EntityStatus.ACTIVE,
          archivedAt: null,
        },
      });

      return person;
    }),
});
