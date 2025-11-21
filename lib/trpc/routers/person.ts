import { router, authorizedProcedure, verifyPersonOwnership } from '../init';
import { TRPCError } from '@trpc/server';
import { EntityStatus } from '@/lib/types/prisma-enums';
import { checkTierLimit, mapDatabaseLimitsToComponentFormat } from '@/lib/services/tier-limits';
import { getEffectiveTierLimits } from '@/lib/services/admin/system-settings.service';
import { createDefaultTeacherOnlyRoutine } from '@/lib/services/teacher-only-routine.service';
import {
  createPersonSchema,
  updatePersonSchema,
  deletePersonSchema,
  restorePersonSchema,
  listPersonsSchema,
  getPersonSchema,
  getBatchPersonsSchema,
} from '@/lib/validation/person';

export const personRouter = router({
  list: authorizedProcedure
    .input(listPersonsSchema)
    .query(async ({ ctx, input }) => {
      // Get owned persons (directly created by this role)
      const ownedPersons = await ctx.prisma.person.findMany({
        where: {
          roleId: input.roleId,
          status: input.includeInactive ? undefined : EntityStatus.ACTIVE,
        },
        orderBy: { name: 'asc' },
      });

      // Get shared persons from co-parent relationships
      const coParentPersons = await ctx.prisma.person.findMany({
        where: {
          status: input.includeInactive ? undefined : EntityStatus.ACTIVE,
          role: {
            primaryCoParents: {
              some: {
                coParentRoleId: input.roleId,
                status: EntityStatus.ACTIVE,
              },
            },
          },
        },
        include: {
          role: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      // Get connected students from teacher connections (for parent roles)
      const role = await ctx.prisma.role.findUnique({
        where: { id: input.roleId },
        select: { type: true },
      });

      let connectedStudents: any[] = [];
      if (role?.type === 'PARENT') {
        connectedStudents = await ctx.prisma.person.findMany({
          where: {
            status: input.includeInactive ? undefined : EntityStatus.ACTIVE,
            studentConnections: {
              some: {
                parentRoleId: input.roleId,
                status: EntityStatus.ACTIVE,
              },
            },
          },
          include: {
            role: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: { name: 'asc' },
        });
      }

      // Combine all persons and mark their access type
      const allPersons = [
        ...ownedPersons.map(p => ({ ...p, accessType: 'owned' as const })),
        ...coParentPersons.map(p => ({ ...p, accessType: 'coparent' as const })),
        ...connectedStudents.map(p => ({ ...p, accessType: 'connected' as const })),
      ];

      // Sort combined list by name
      allPersons.sort((a, b) => a.name.localeCompare(b.name));

      return allPersons;
    }),

  getById: authorizedProcedure
    .input(getPersonSchema)
    .query(async ({ ctx, input }) => {
      // Verify person ownership
      await verifyPersonOwnership(ctx.user.id, input.id, ctx.prisma);

      // Get requesting user's role to determine if they should see teacher-only routines
      // REQUIREMENT #4: Only teachers/co-teachers can see teacher-only routines
      const requestingRole = await ctx.prisma.role.findFirst({
        where: { userId: ctx.user.id },
        select: { type: true },
      });

      const isTeacher = requestingRole?.type === 'TEACHER';

      const person = await ctx.prisma.person.findUnique({
        where: { id: input.id },
        include: {
          groupMembers: {
            include: {
              group: true,
            },
          },
          assignments: {
            where: {
              routine: {
                status: EntityStatus.ACTIVE,
                // Hide teacher-only routines from non-teachers
                ...(isTeacher ? {} : { isTeacherOnly: false }),
              },
            },
            include: {
              routine: {
                include: {
                  tasks: {
                    where: { status: EntityStatus.ACTIVE },
                    include: {
                      // Only include count for efficiency
                      _count: {
                        select: { completions: true }
                      },
                      // Get all completions for this person to filter by reset period on the frontend
                      completions: {
                        where: {
                          personId: input.id,
                        },
                        orderBy: { completedAt: 'desc' },
                        select: {
                          id: true,
                          completedAt: true,
                          value: true,
                          summedValue: true,
                          entryNumber: true,
                          personId: true,
                        },
                      },
                    },
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

  getBatch: authorizedProcedure
    .input(getBatchPersonsSchema)
    .query(async ({ ctx, input }) => {
      // Batch verify ownership for all persons at once
      const persons = await ctx.prisma.person.findMany({
        where: { id: { in: input.ids } },
        include: {
          role: {
            select: { userId: true, id: true },
          },
        },
      });

      // Get all roleIds and personIds for batch checking
      const roleIds = persons.map(p => p.roleId);
      const personIds = persons.map(p => p.id);

      // Batch fetch all co-parent relationships
      const coParentRelationships = await ctx.prisma.coParentRelationship.findMany({
        where: {
          primaryRoleId: { in: roleIds },
          coParentRole: {
            userId: ctx.user.id,
          },
          status: EntityStatus.ACTIVE,
        },
        select: {
          primaryRoleId: true,
        },
      });

      // Create a Set of roleIds with co-parent access
      const coParentRoleIds = new Set(coParentRelationships.map(r => r.primaryRoleId));

      // Batch fetch all teacher connections
      const teacherConnections = await ctx.prisma.teacherConnection.findMany({
        where: {
          personId: { in: personIds },
          parentRole: {
            userId: ctx.user.id,
          },
          status: EntityStatus.ACTIVE,
        },
        select: {
          personId: true,
        },
      });

      // Create a Set of personIds with teacher connection access
      const teacherConnectedPersonIds = new Set(teacherConnections.map(c => c.personId));

      // Check that user has access to all requested persons
      for (const person of persons) {
        if (!person || person.role.userId !== ctx.user.id) {
          // Check for co-parent or teacher connection access using pre-fetched data
          const hasCoParentAccess = coParentRoleIds.has(person.roleId);
          const hasTeacherAccess = teacherConnectedPersonIds.has(person.id);

          if (!hasCoParentAccess && !hasTeacherAccess) {
            throw new TRPCError({ code: 'FORBIDDEN' });
          }
        }
      }

      // Get requesting user's role to determine if they should see teacher-only routines
      const requestingRole = await ctx.prisma.role.findFirst({
        where: { userId: ctx.user.id },
        select: { type: true },
      });

      const isTeacher = requestingRole?.type === 'TEACHER';

      // Fetch all persons with their assignments and teacher tasks in a single query
      const batchPersons = await ctx.prisma.person.findMany({
        where: { id: { in: input.ids } },
        include: {
          groupMembers: {
            include: {
              group: true,
            },
          },
          assignments: {
            where: {
              routine: {
                status: EntityStatus.ACTIVE,
                // Only fetch teacher-only routines for teachers
                ...(isTeacher ? {} : { isTeacherOnly: false }),
              },
            },
            include: {
              routine: {
                include: {
                  tasks: {
                    where: { status: EntityStatus.ACTIVE },
                    include: {
                      // Only include count for efficiency
                      _count: {
                        select: { completions: true }
                      },
                    },
                    orderBy: { order: 'asc' },
                  },
                },
              },
            },
          },
        },
      });

      // If needed, fetch only the most recent completion per person per task
      // This is much more efficient than fetching all completions
      const taskIds = batchPersons.flatMap(p =>
        p.assignments.flatMap(a =>
          a.routine.tasks.map(t => t.id)
        )
      );

      const recentCompletions = await ctx.prisma.taskCompletion.findMany({
        where: {
          taskId: { in: taskIds },
          personId: { in: input.ids },
        },
        select: {
          id: true,
          taskId: true,
          personId: true,
          completedAt: true,
          value: true,
        },
        orderBy: { completedAt: 'desc' },
        // Limit to reasonable number of most recent completions
        take: taskIds.length * input.ids.length,
      });

      // Group completions by personId and taskId for efficient lookup
      const completionMap = new Map<string, typeof recentCompletions[0]>();
      recentCompletions.forEach(completion => {
        const key = `${completion.personId}-${completion.taskId}`;
        // Only keep the most recent completion per person per task
        if (!completionMap.has(key)) {
          completionMap.set(key, completion);
        }
      });

      // Map completions back to the correct person and task
      const personsWithCorrectCompletions = batchPersons.map(person => ({
        ...person,
        assignments: person.assignments.map(assignment => ({
          ...assignment,
          routine: {
            ...assignment.routine,
            tasks: assignment.routine.tasks.map(task => ({
              ...task,
              // Add the most recent completion if it exists
              completions: completionMap.has(`${person.id}-${task.id}`)
                ? [completionMap.get(`${person.id}-${task.id}`)]
                : [],
            })),
          },
        })),
      }));

      return personsWithCorrectCompletions;
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

      // Get effective tier limits from database
      const dbLimits = await getEffectiveTierLimits(role.id);
      const effectiveLimits = mapDatabaseLimitsToComponentFormat(dbLimits as any, role.type);

      // Check tier limit based on role type (only counting ACTIVE persons)
      const limitKey =
        role.type === 'PARENT' ? 'children_per_family' : 'students_per_classroom';
      checkTierLimit(effectiveLimits, limitKey, role.persons.length);

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

      // Auto-create teacher-only routine if this is a TEACHER role and not account owner
      if (role.type === 'TEACHER' && !person.isAccountOwner) {
        await createDefaultTeacherOnlyRoutine(input.roleId, person.id, role.type);
      }

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
        select: { roleId: true, groupMembers: { select: { groupId: true } }, isAccountOwner: true }
      });

      if (!existingPerson) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Person not found',
        });
      }

      // Prevent deleting the account owner
      if (existingPerson.isAccountOwner) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot delete the account owner. This person is required for your account.',
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

      // Get role type to check if teacher
      const role = await ctx.prisma.role.findUnique({
        where: { id: existingPerson.roleId },
        select: { type: true }
      });

      // Re-create teacher-only routine if this is a TEACHER role and person is not account owner
      if (role?.type === 'TEACHER') {
        const restoredPerson = await ctx.prisma.person.findUnique({
          where: { id: input.id },
          select: { isAccountOwner: true }
        });

        if (!restoredPerson?.isAccountOwner) {
          await createDefaultTeacherOnlyRoutine(existingPerson.roleId, input.id, role.type);
        }
      }

      return person;
    }),
});
