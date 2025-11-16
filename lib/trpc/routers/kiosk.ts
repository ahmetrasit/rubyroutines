import { z } from 'zod';
import { router, publicProcedure, authorizedProcedure } from '../init';
import {
  generateKioskCode,
  validateKioskCode,
  getActiveCodesForRole,
  revokeCode,
  markCodeAsUsed,
  validateKioskSession
} from '@/lib/services/kiosk-code';
import {
  calculateEntryNumber,
  isWithinEntryLimit,
  calculateSummedValue,
  validateProgressValue
} from '@/lib/services/task-completion';
import { getResetPeriodStart } from '@/lib/services/reset-period';
import { TRPCError } from '@trpc/server';
import { kioskRateLimitedProcedure } from '../middleware/ratelimit';

export const kioskRouter = router({
  /**
   * Get kiosk settings (public - no auth required)
   */
  getSettings: publicProcedure.query(async ({ ctx }) => {
    // Get inactivity timeout from system settings, default to 60 seconds
    const timeoutSetting = await ctx.prisma.systemSettings.findUnique({
      where: { key: 'kiosk_inactivity_timeout' }
    });

    const inactivityTimeout = timeoutSetting?.value
      ? Number(timeoutSetting.value)
      : 60000; // Default 60 seconds

    return {
      inactivityTimeout
    };
  }),

  /**
   * Generate a new kiosk code (protected - requires authentication)
   */
  generateCode: authorizedProcedure
    .input(z.object({
      roleId: z.string().uuid(),
      groupId: z.string().cuid().optional(), // Optional classroom/group ID
      personId: z.string().cuid().optional(), // Optional person ID for individual codes
      userName: z.string(),
      classroomName: z.string().optional(),
      wordCount: z.enum(['2', '3']).optional(),
      expiresInHours: z.number().min(1).max(168).optional() // Max 1 week
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify user owns this role
      const role = await ctx.prisma.role.findUnique({
        where: { id: input.roleId }
      });

      if (!role || role.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      // If personId provided, verify person belongs to this role
      if (input.personId) {
        const person = await ctx.prisma.person.findUnique({
          where: { id: input.personId }
        });

        if (!person || person.roleId !== input.roleId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Person does not belong to this role' });
        }
      }

      const code = await generateKioskCode({
        roleId: input.roleId,
        groupId: input.groupId, // Pass groupId for classroom-specific codes
        personId: input.personId, // Pass personId for individual codes
        userName: input.userName,
        classroomName: input.classroomName,
        wordCount: input.wordCount === '3' ? 3 : 2,
        expiresInHours: input.expiresInHours
      });

      return code;
    }),

  /**
   * Get all active codes for a role (protected)
   */
  listCodes: authorizedProcedure
    .input(z.object({
      roleId: z.string().uuid()
    }))
    .query(async ({ ctx, input }) => {
      // Verify user owns this role
      const role = await ctx.prisma.role.findUnique({
        where: { id: input.roleId }
      });

      if (!role || role.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const codes = await getActiveCodesForRole(input.roleId);
      return codes;
    }),

  /**
   * Revoke a code (protected)
   */
  revokeCode: authorizedProcedure
    .input(z.object({
      codeId: z.string().cuid()
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify user owns this code's role
      const code = await ctx.prisma.code.findUnique({
        where: { id: input.codeId },
        include: { role: true }
      });

      if (!code) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Code not found' });
      }

      if (code.role.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      await revokeCode(input.codeId);

      return { success: true };
    }),

  /**
   * Validate code and get role/persons data (public - no auth required)
   */
  validateCode: kioskRateLimitedProcedure
    .input(z.object({
      code: z.string().min(1)
    }))
    .query(async ({ ctx, input }) => {
      const result = await validateKioskCode(input.code);

      if (!result.valid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: result.error || 'Invalid code'
        });
      }

      const code = await ctx.prisma.code.findUnique({
        where: { id: result.kioskCode!.id },
        include: {
          role: {
            include: {
              persons: {
                where: { status: 'ACTIVE' },
                orderBy: { name: 'asc' }
              },
              groups: {
                where: {
                  status: 'ACTIVE',
                  // If code has groupId, only return that specific group
                  ...(result.kioskCode!.groupId ? { id: result.kioskCode!.groupId } : {})
                },
                include: {
                  members: {
                    where: { person: { status: 'ACTIVE' } },
                    include: { person: true }
                  }
                }
              }
            }
          }
        }
      });

      return {
        codeId: code!.id,
        roleId: code!.roleId,
        groupId: code!.groupId, // Include groupId in response
        personId: code!.personId, // Include personId in response (for individual codes)
        persons: code!.role.persons,
        groups: code!.role.groups
      };
    }),

  /**
   * Get tasks for person in kiosk mode (public)
   */
  getPersonTasks: publicProcedure
    .input(z.object({
      kioskCodeId: z.string().cuid(),
      personId: z.string().cuid(),
      date: z.date().optional()
    }))
    .query(async ({ ctx, input }) => {
      // Validate kiosk session
      const validation = await validateKioskSession(input.kioskCodeId, input.personId);
      if (!validation.valid) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: validation.error || 'Invalid kiosk session'
        });
      }

      // Get person's routines and tasks
      const person = await ctx.prisma.person.findUnique({
        where: { id: input.personId },
        include: {
          assignments: {
            where: {
              routine: { status: 'ACTIVE' }
            },
            include: {
              routine: {
                include: {
                  tasks: {
                    where: { status: 'ACTIVE' },
                    include: {
                      completions: {
                        where: {
                          personId: input.personId
                        },
                        orderBy: { completedAt: 'desc' },
                        take: 10 // Get last 10 completions for filtering by reset period
                      }
                    },
                    orderBy: { order: 'asc' }
                  }
                }
              }
            }
          }
        }
      });

      if (!person) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Person not found'
        });
      }

      // Flatten tasks with completion status
      const tasks = person.assignments.flatMap((assignment: any) =>
        assignment.routine.tasks.map((task: any) => {
          // Calculate reset period start for this routine
          const resetPeriodStart = getResetPeriodStart(
            assignment.routine.resetPeriod,
            assignment.routine.resetDay
          );

          // Filter completions by reset period
          const periodCompletions = task.completions.filter((c: any) =>
            new Date(c.completedAt) >= resetPeriodStart
          );

          const lastCompletion = periodCompletions[0];
          const isComplete = task.type === 'SIMPLE' && periodCompletions.length > 0;
          return {
            ...task,
            routineName: assignment.routine.name,
            isComplete,
            isCompleted: periodCompletions.length > 0,
            completionCount: periodCompletions.length,
            lastCompletedAt: lastCompletion?.completedAt,
            entryNumber: lastCompletion?.entryNumber,
            summedValue: lastCompletion?.summedValue
          };
        })
      );

      return {
        person,
        tasks: tasks.sort((a: any, b: any) => a.order - b.order)
      };
    }),

  /**
   * Complete task in kiosk mode (public)
   */
  completeTask: publicProcedure
    .input(z.object({
      kioskCodeId: z.string().cuid(),
      taskId: z.string().cuid(),
      personId: z.string().cuid(),
      value: z.string().optional(), // For PROGRESS type tasks
      notes: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      // Validate kiosk session
      const validation = await validateKioskSession(input.kioskCodeId, input.personId);
      if (!validation.valid) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: validation.error || 'Invalid kiosk session'
        });
      }
      const task = await ctx.prisma.task.findUnique({
        where: { id: input.taskId },
        include: {
          routine: {
            select: {
              resetPeriod: true,
              resetDay: true
            }
          },
          completions: {
            where: { personId: input.personId },
            orderBy: { completedAt: 'desc' }
          }
        }
      });

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found'
        });
      }

      // Validate value for PROGRESS tasks
      if (task.type === 'PROGRESS') {
        if (!input.value) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Progress value required'
          });
        }

        const validation = validateProgressValue(input.value);
        if (!validation.valid) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: validation.error || 'Invalid progress value'
          });
        }
      }

      // Get person to access roleId for timestamp update
      const person = await ctx.prisma.person.findUnique({
        where: { id: input.personId },
        select: { roleId: true }
      });

      if (!person) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Person not found'
        });
      }

      // Calculate reset date for current period
      const resetDate = getResetPeriodStart(task.routine.resetPeriod, task.routine.resetDay);

      // Calculate entry number for this completion
      const entryNumber = calculateEntryNumber(task.completions, resetDate, task.type as any);

      // Check entry limits
      if (!isWithinEntryLimit(entryNumber, task.type as any)) {
        const maxEntries = task.type === 'MULTIPLE_CHECKIN' ? 9 : 20;
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Maximum ${maxEntries} check-ins reached for this period`
        });
      }

      // For SIMPLE tasks, check if already completed today to prevent race conditions
      if (task.type === 'SIMPLE') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const existingCompletion = await ctx.prisma.taskCompletion.findFirst({
          where: {
            taskId: input.taskId,
            personId: input.personId,
            completedAt: {
              gte: today,
              lt: tomorrow
            }
          }
        });

        if (existingCompletion) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Task already completed today'
          });
        }
      }

      // Calculate summed value for PROGRESS tasks
      let summedValue: number | undefined = undefined;
      if (task.type === 'PROGRESS' && input.value) {
        summedValue = calculateSummedValue(task.completions, resetDate, input.value);
      }

      // Create completion and update role + person timestamps in a transaction
      const now = new Date();
      const [completion] = await ctx.prisma.$transaction([
        ctx.prisma.taskCompletion.create({
          data: {
            taskId: input.taskId,
            personId: input.personId,
            completedAt: now,
            value: input.value,
            notes: input.notes,
            entryNumber,
            summedValue
          }
        }),
        ctx.prisma.role.update({
          where: { id: person.roleId },
          data: { kioskLastUpdatedAt: now }
        }),
        ctx.prisma.person.update({
          where: { id: input.personId },
          data: { kioskLastUpdatedAt: now }
        })
      ]);

      return completion;
    }),

  /**
   * Undo task completion (if completed within last 5 minutes) (public)
   */
  undoCompletion: publicProcedure
    .input(z.object({
      kioskCodeId: z.string().cuid(),
      completionId: z.string().cuid()
    }))
    .mutation(async ({ ctx, input }) => {
      const completion = await ctx.prisma.taskCompletion.findUnique({
        where: { id: input.completionId }
      });

      if (!completion) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Completion not found',
        });
      }

      // Validate kiosk session
      const validation = await validateKioskSession(input.kioskCodeId, completion.personId);
      if (!validation.valid) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: validation.error || 'Invalid kiosk session'
        });
      }

      // Check if within 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (completion.completedAt < fiveMinutesAgo) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Can only undo completions from last 5 minutes'
        });
      }

      // Get person to access roleId for timestamp update
      const person = await ctx.prisma.person.findUnique({
        where: { id: completion.personId },
        select: { roleId: true }
      });

      if (!person) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Person not found'
        });
      }

      // Delete completion and update role + person timestamps in a transaction
      const now = new Date();
      await ctx.prisma.$transaction([
        ctx.prisma.taskCompletion.delete({
          where: { id: input.completionId }
        }),
        ctx.prisma.role.update({
          where: { id: person.roleId },
          data: { kioskLastUpdatedAt: now }
        }),
        ctx.prisma.person.update({
          where: { id: completion.personId },
          data: { kioskLastUpdatedAt: now }
        })
      ]);

      return { success: true };
    }),

  /**
   * Mark kiosk code as used after session starts (public)
   */
  markCodeUsed: publicProcedure
    .input(z.object({
      codeId: z.string().cuid()
    }))
    .mutation(async ({ ctx, input }) => {
      await markCodeAsUsed(input.codeId);
      return { success: true };
    }),

  /**
   * Check if role/group/person has updates since a given timestamp (public - for optimized kiosk polling)
   */
  checkRoleUpdates: publicProcedure
    .input(z.object({
      kioskCodeId: z.string().cuid(),
      lastCheckedAt: z.date()
    }))
    .query(async ({ ctx, input }) => {
      // Get the code with group/person info
      const code = await ctx.prisma.code.findUnique({
        where: { id: input.kioskCodeId },
        select: {
          roleId: true,
          groupId: true,
          personId: true,
          role: {
            select: {
              kioskLastUpdatedAt: true
            }
          }
        }
      });

      if (!code) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Kiosk code not found'
        });
      }

      let mostRecentUpdate = code.role.kioskLastUpdatedAt;

      // For individual codes, also check person-level updates
      if (code.personId) {
        const person = await ctx.prisma.person.findUnique({
          where: { id: code.personId },
          select: { kioskLastUpdatedAt: true }
        });
        if (person && person.kioskLastUpdatedAt > mostRecentUpdate) {
          mostRecentUpdate = person.kioskLastUpdatedAt;
        }
      }

      // For group codes, also check group-level updates (member changes)
      else if (code.groupId) {
        const group = await ctx.prisma.group.findUnique({
          where: { id: code.groupId },
          select: { kioskLastUpdatedAt: true }
        });
        if (group && group.kioskLastUpdatedAt > mostRecentUpdate) {
          mostRecentUpdate = group.kioskLastUpdatedAt;
        }
      }

      // Compare timestamps
      const hasUpdates = mostRecentUpdate > input.lastCheckedAt;

      return {
        hasUpdates,
        lastUpdatedAt: mostRecentUpdate
      };
    })
});
