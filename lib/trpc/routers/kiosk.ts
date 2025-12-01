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
  createKioskSession,
  terminateSession,
  terminateAllSessionsForCode,
  getActiveSessionsForRole,
  updateSessionActivity,
  validateSession,
  getActiveSessionCountForCode,
  canCreateMoreSessions
} from '@/lib/services/kiosk-session';
import { getResetPeriodStart } from '@/lib/services/reset-period';
import { completeTaskCoordinated } from '@/lib/services/task-completion-coordinated';
import { canUndoCompletion } from '@/lib/services/task-completion';
import { TRPCError } from '@trpc/server';
import { kioskSessionRateLimitedProcedure } from '../middleware/ratelimit';

export const kioskRouter = router({
  /**
   * Get kiosk settings (public - no auth required)
   * Rate limited by IP address (fallback)
   */
  getSettings: kioskSessionRateLimitedProcedure.query(async ({ ctx }) => {
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
      expiresInMinutes: z.number().min(1).max(10080).optional(), // Max 1 week (10080 minutes)
      sessionDurationDays: z.number().min(1).max(365).optional() // Max 1 year
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
        expiresInMinutes: input.expiresInMinutes,
        sessionDurationDays: input.sessionDurationDays
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
   * Rate limited by kiosk code
   */
  validateCode: kioskSessionRateLimitedProcedure
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
   * Rate limited by kiosk code
   *
   * CoParent Task Merging:
   * When a person checks in, we show:
   * 1. Their OWN routines/tasks
   * 2. Tasks from LINKED CoParent persons (bidirectional)
   *    - If this person is linkedPerson: show primaryPerson's shared routines
   *    - If this person is primaryPerson: show linkedPerson's shared routines
   *
   * CoTeacher Task Merging:
   * When a student checks in, we also show:
   * 3. Tasks from LINKED CoTeacher students (bidirectional)
   *    - If this person is linkedStudent: show primaryStudent's shared routines
   *    - If this person is primaryStudent: show linkedStudent's shared routines
   */
  getPersonTasks: kioskSessionRateLimitedProcedure
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
      // REQUIREMENT #4: Exclude teacher-only routines from kiosk mode
      const person = await ctx.prisma.person.findUnique({
        where: { id: input.personId },
        include: {
          assignments: {
            where: {
              routine: {
                status: 'ACTIVE',
                isTeacherOnly: false // CRITICAL: Never show teacher-only routines in kiosk
              }
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

      // Flatten own tasks with completion status
      const ownTasks = person.assignments.flatMap((assignment: any) =>
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
            routine: assignment.routine,
            routineName: assignment.routine.name,
            isComplete,
            isCompleted: periodCompletions.length > 0,
            completionCount: periodCompletions.length,
            lastCompletedAt: lastCompletion?.completedAt,
            entryNumber: lastCompletion?.entryNumber,
            summedValue: lastCompletion?.summedValue,
            totalValue: lastCompletion?.summedValue,
            isFromCoParent: false,
            isFromCoTeacher: false,
            coParentPersonId: null,
            coTeacherPersonId: null
          };
        })
      );

      // ========================================
      // CoParent Task Merging (Bidirectional)
      // ========================================

      // Direction 1: This person is the linkedPerson (e.g., Mom's Emma)
      // -> Get tasks from primaryPerson (e.g., Dad's Kid A)
      const linksAsLinked = await ctx.prisma.coParentPersonLink.findMany({
        where: {
          linkedPersonId: input.personId,
          status: 'ACTIVE'
        },
        include: {
          primaryPerson: {
            include: {
              assignments: {
                where: {
                  routine: {
                    status: 'ACTIVE',
                    isTeacherOnly: false
                  }
                },
                include: {
                  routine: {
                    include: {
                      tasks: {
                        where: { status: 'ACTIVE' },
                        include: {
                          completions: {
                            orderBy: { completedAt: 'desc' },
                            take: 10
                          }
                        },
                        orderBy: { order: 'asc' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      // Direction 2: This person is the primaryPerson (e.g., Dad's Kid A)
      // -> Get tasks from linkedPerson (e.g., Mom's Emma)
      const linksAsPrimary = await ctx.prisma.coParentPersonLink.findMany({
        where: {
          primaryPersonId: input.personId,
          status: 'ACTIVE'
        },
        include: {
          linkedPerson: {
            include: {
              assignments: {
                where: {
                  routine: {
                    status: 'ACTIVE',
                    isTeacherOnly: false
                  }
                },
                include: {
                  routine: {
                    include: {
                      tasks: {
                        where: { status: 'ACTIVE' },
                        include: {
                          completions: {
                            orderBy: { completedAt: 'desc' },
                            take: 10
                          }
                        },
                        orderBy: { order: 'asc' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      // Process linked tasks from Direction 1 (primaryPerson's tasks)
      const linkedTasksFromPrimary = linksAsLinked.flatMap((link: any) => {
        const routineIdSet = new Set(link.routineIds || []);

        return link.primaryPerson.assignments
          .filter((assignment: any) => routineIdSet.size === 0 || routineIdSet.has(assignment.routine.id))
          .flatMap((assignment: any) =>
            assignment.routine.tasks.map((task: any) => {
              const resetPeriodStart = getResetPeriodStart(
                assignment.routine.resetPeriod,
                assignment.routine.resetDay
              );

              // Filter completions by reset period (for EITHER person - completions are shared)
              const periodCompletions = task.completions.filter((c: any) =>
                new Date(c.completedAt) >= resetPeriodStart &&
                (c.personId === input.personId || c.personId === link.primaryPersonId)
              );

              const lastCompletion = periodCompletions[0];
              const isComplete = task.type === 'SIMPLE' && periodCompletions.length > 0;

              return {
                ...task,
                routine: assignment.routine,
                routineName: assignment.routine.name,
                isComplete,
                isCompleted: periodCompletions.length > 0,
                completionCount: periodCompletions.length,
                lastCompletedAt: lastCompletion?.completedAt,
                entryNumber: lastCompletion?.entryNumber,
                summedValue: lastCompletion?.summedValue,
                totalValue: lastCompletion?.summedValue,
                isFromCoParent: true,
                isFromCoTeacher: false,
                coParentPersonId: link.primaryPersonId,
                coTeacherPersonId: null
              };
            })
          );
      });

      // Process linked tasks from Direction 2 (linkedPerson's tasks)
      const linkedTasksFromLinked = linksAsPrimary.flatMap((link: any) => {
        if (!link.linkedPerson) return []; // linkedPerson might be null if not yet linked

        const routineIdSet = new Set(link.routineIds || []);

        return link.linkedPerson.assignments
          .filter((assignment: any) => routineIdSet.size === 0 || routineIdSet.has(assignment.routine.id))
          .flatMap((assignment: any) =>
            assignment.routine.tasks.map((task: any) => {
              const resetPeriodStart = getResetPeriodStart(
                assignment.routine.resetPeriod,
                assignment.routine.resetDay
              );

              // Filter completions by reset period (for EITHER person - completions are shared)
              const periodCompletions = task.completions.filter((c: any) =>
                new Date(c.completedAt) >= resetPeriodStart &&
                (c.personId === input.personId || c.personId === link.linkedPersonId)
              );

              const lastCompletion = periodCompletions[0];
              const isComplete = task.type === 'SIMPLE' && periodCompletions.length > 0;

              return {
                ...task,
                routine: assignment.routine,
                routineName: assignment.routine.name,
                isComplete,
                isCompleted: periodCompletions.length > 0,
                completionCount: periodCompletions.length,
                lastCompletedAt: lastCompletion?.completedAt,
                entryNumber: lastCompletion?.entryNumber,
                summedValue: lastCompletion?.summedValue,
                totalValue: lastCompletion?.summedValue,
                isFromCoParent: true,
                isFromCoTeacher: false,
                coParentPersonId: link.linkedPersonId,
                coTeacherPersonId: null
              };
            })
          );
      });

      // ========================================
      // CoTeacher Task Merging (Bidirectional)
      // ========================================

      // Direction 1: This person is the linkedStudent (e.g., Co-teacher's student)
      // -> Get tasks from primaryStudent (e.g., Lead teacher's student)
      const coTeacherLinksAsLinked = await ctx.prisma.coTeacherStudentLink.findMany({
        where: {
          linkedStudentId: input.personId,
          status: 'ACTIVE'
        },
        include: {
          primaryStudent: {
            include: {
              assignments: {
                where: {
                  routine: {
                    status: 'ACTIVE',
                    isTeacherOnly: false
                  }
                },
                include: {
                  routine: {
                    include: {
                      tasks: {
                        where: { status: 'ACTIVE' },
                        include: {
                          completions: {
                            orderBy: { completedAt: 'desc' },
                            take: 10
                          }
                        },
                        orderBy: { order: 'asc' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      // Direction 2: This person is the primaryStudent (e.g., Lead teacher's student)
      // -> Get tasks from linkedStudent (e.g., Co-teacher's student)
      const coTeacherLinksAsPrimary = await ctx.prisma.coTeacherStudentLink.findMany({
        where: {
          primaryStudentId: input.personId,
          status: 'ACTIVE'
        },
        include: {
          linkedStudent: {
            include: {
              assignments: {
                where: {
                  routine: {
                    status: 'ACTIVE',
                    isTeacherOnly: false
                  }
                },
                include: {
                  routine: {
                    include: {
                      tasks: {
                        where: { status: 'ACTIVE' },
                        include: {
                          completions: {
                            orderBy: { completedAt: 'desc' },
                            take: 10
                          }
                        },
                        orderBy: { order: 'asc' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      // Process CoTeacher linked tasks from Direction 1 (primaryStudent's tasks)
      const coTeacherTasksFromPrimary = coTeacherLinksAsLinked.flatMap((link: any) => {
        const routineIdSet = new Set(link.routineIds || []);

        return link.primaryStudent.assignments
          .filter((assignment: any) => routineIdSet.size === 0 || routineIdSet.has(assignment.routine.id))
          .flatMap((assignment: any) =>
            assignment.routine.tasks.map((task: any) => {
              const resetPeriodStart = getResetPeriodStart(
                assignment.routine.resetPeriod,
                assignment.routine.resetDay
              );

              // Filter completions by reset period (for EITHER person - completions are shared)
              const periodCompletions = task.completions.filter((c: any) =>
                new Date(c.completedAt) >= resetPeriodStart &&
                (c.personId === input.personId || c.personId === link.primaryStudentId)
              );

              const lastCompletion = periodCompletions[0];
              const isComplete = task.type === 'SIMPLE' && periodCompletions.length > 0;

              return {
                ...task,
                routine: assignment.routine,
                routineName: assignment.routine.name,
                isComplete,
                isCompleted: periodCompletions.length > 0,
                completionCount: periodCompletions.length,
                lastCompletedAt: lastCompletion?.completedAt,
                entryNumber: lastCompletion?.entryNumber,
                summedValue: lastCompletion?.summedValue,
                totalValue: lastCompletion?.summedValue,
                isFromCoParent: false,
                isFromCoTeacher: true,
                coParentPersonId: null,
                coTeacherPersonId: link.primaryStudentId
              };
            })
          );
      });

      // Process CoTeacher linked tasks from Direction 2 (linkedStudent's tasks)
      const coTeacherTasksFromLinked = coTeacherLinksAsPrimary.flatMap((link: any) => {
        if (!link.linkedStudent) return []; // linkedStudent might be null if not yet linked

        const routineIdSet = new Set(link.routineIds || []);

        return link.linkedStudent.assignments
          .filter((assignment: any) => routineIdSet.size === 0 || routineIdSet.has(assignment.routine.id))
          .flatMap((assignment: any) =>
            assignment.routine.tasks.map((task: any) => {
              const resetPeriodStart = getResetPeriodStart(
                assignment.routine.resetPeriod,
                assignment.routine.resetDay
              );

              // Filter completions by reset period (for EITHER person - completions are shared)
              const periodCompletions = task.completions.filter((c: any) =>
                new Date(c.completedAt) >= resetPeriodStart &&
                (c.personId === input.personId || c.personId === link.linkedStudentId)
              );

              const lastCompletion = periodCompletions[0];
              const isComplete = task.type === 'SIMPLE' && periodCompletions.length > 0;

              return {
                ...task,
                routine: assignment.routine,
                routineName: assignment.routine.name,
                isComplete,
                isCompleted: periodCompletions.length > 0,
                completionCount: periodCompletions.length,
                lastCompletedAt: lastCompletion?.completedAt,
                entryNumber: lastCompletion?.entryNumber,
                summedValue: lastCompletion?.summedValue,
                totalValue: lastCompletion?.summedValue,
                isFromCoParent: false,
                isFromCoTeacher: true,
                coParentPersonId: null,
                coTeacherPersonId: link.linkedStudentId
              };
            })
          );
      });

      // Merge all tasks and deduplicate by task ID (own tasks take priority)
      const ownTaskIds = new Set(ownTasks.map((t: any) => t.id));
      const allCoParentLinkedTasks = [...linkedTasksFromPrimary, ...linkedTasksFromLinked]
        .filter((t: any) => !ownTaskIds.has(t.id)); // Don't duplicate if task is already in own tasks

      const coParentTaskIds = new Set(allCoParentLinkedTasks.map((t: any) => t.id));
      const allCoTeacherLinkedTasks = [...coTeacherTasksFromPrimary, ...coTeacherTasksFromLinked]
        .filter((t: any) => !ownTaskIds.has(t.id) && !coParentTaskIds.has(t.id)); // Don't duplicate

      const allTasks = [...ownTasks, ...allCoParentLinkedTasks, ...allCoTeacherLinkedTasks];

      return {
        person,
        tasks: allTasks.sort((a: any, b: any) => a.order - b.order)
      };
    }),

  /**
   * Get goals for person in kiosk mode (public)
   * Rate limited by kiosk code
   */
  getPersonGoals: kioskSessionRateLimitedProcedure
    .input(z.object({
      kioskCodeId: z.string().cuid(),
      personId: z.string().cuid(),
      roleId: z.string().uuid()
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

      // Fetch goals for this person
      const goals = await ctx.prisma.goal.findMany({
        where: {
          roleId: input.roleId,
          status: 'ACTIVE',
          personIds: { has: input.personId }
        },
        include: {
          taskLinks: {
            include: {
              task: {
                include: {
                  routine: true
                }
              }
            }
          },
          routineLinks: {
            include: {
              routine: true
            }
          },
          progress: true
        },
        orderBy: { createdAt: 'desc' }
      });

      // Calculate progress for all goals
      const { calculateGoalProgressBatchEnhanced } = await import('@/lib/services/goal-progress-enhanced');
      const goalIds = goals.map((g) => g.id);
      const progressMap = await calculateGoalProgressBatchEnhanced(goalIds);

      const goalsWithProgress = goals.map((goal) => ({
        ...goal,
        progress: progressMap.get(goal.id) || { current: 0, target: goal.target, percentage: 0, achieved: false },
      }));

      return goalsWithProgress;
    }),

  /**
   * Complete task in kiosk mode (public)
   * Rate limited by kiosk code
   */
  completeTask: kioskSessionRateLimitedProcedure
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

      // Get task to calculate reset date
      const task = await ctx.prisma.task.findUniqueOrThrow({
        where: { id: input.taskId },
        include: {
          routine: {
            select: { resetPeriod: true, resetDay: true }
          }
        }
      });

      // Calculate reset date for current period
      const resetDate = getResetPeriodStart(task.routine.resetPeriod, task.routine.resetDay);

      // Get session info for tracking
      const session = await ctx.prisma.kioskSession.findFirst({
        where: {
          code: { id: input.kioskCodeId },
          endedAt: null
        },
        select: { id: true, deviceId: true }
      });

      // Use coordinated service to prevent race conditions
      const result = await completeTaskCoordinated(ctx.prisma, {
        taskId: input.taskId,
        personId: input.personId,
        value: input.value,
        notes: input.notes,
        resetDate,
        deviceId: session?.deviceId,
        sessionId: session?.id
      });

      return {
        ...result.completion,
        wasCached: result.wasCached
      };
    }),

  /**
   * Undo task completion (if completed within 10 seconds and is SIMPLE task) (public)
   * Rate limited by kiosk code
   */
  undoCompletion: kioskSessionRateLimitedProcedure
    .input(z.object({
      kioskCodeId: z.string().cuid(),
      completionId: z.string().cuid()
    }))
    .mutation(async ({ ctx, input }) => {
      const completion = await ctx.prisma.taskCompletion.findUnique({
        where: { id: input.completionId },
        include: {
          task: {
            select: { type: true }
          }
        }
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

      // Check if undo is allowed (SIMPLE tasks only, within 10 second window)
      if (!canUndoCompletion(completion.completedAt, completion.task.type)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Can only undo SIMPLE task completions within 10 seconds'
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
   * Rate limited by kiosk code
   */
  markCodeUsed: kioskSessionRateLimitedProcedure
    .input(z.object({
      codeId: z.string().cuid()
    }))
    .mutation(async ({ ctx, input }) => {
      await markCodeAsUsed(input.codeId);
      return { success: true };
    }),

  /**
   * Check if role/group/person has updates since a given timestamp (public - for optimized kiosk polling)
   * Rate limited by kiosk code
   */
  checkRoleUpdates: kioskSessionRateLimitedProcedure
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
    }),

  /**
   * Create kiosk session when code is used (public)
   * Rate limited by kiosk code
   */
  createSession: kioskSessionRateLimitedProcedure
    .input(z.object({
      codeId: z.string().cuid(),
      deviceId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      // Validate code first
      const code = await ctx.prisma.code.findUnique({
        where: { id: input.codeId },
        select: {
          id: true,
          status: true,
          expiresAt: true,
          sessionDurationDays: true
        }
      });

      if (!code || code.status !== 'ACTIVE') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid or inactive code'
        });
      }

      if (code.expiresAt < new Date()) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Code has expired'
        });
      }

      // Create session
      const session = await createKioskSession({
        codeId: input.codeId,
        deviceId: input.deviceId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        durationDays: code.sessionDurationDays
      });

      return session;
    }),

  /**
   * Update session activity (heartbeat) (public)
   * Rate limited by session ID
   */
  updateSessionActivity: kioskSessionRateLimitedProcedure
    .input(z.object({
      sessionId: z.string().cuid()
    }))
    .mutation(async ({ ctx, input }) => {
      await updateSessionActivity(input.sessionId);
      return { success: true };
    }),

  /**
   * Validate session (public)
   * Rate limited by session ID
   */
  validateSession: kioskSessionRateLimitedProcedure
    .input(z.object({
      sessionId: z.string().cuid()
    }))
    .query(async ({ ctx, input }) => {
      const result = await validateSession(input.sessionId);

      if (!result.valid) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: result.error || 'Invalid session'
        });
      }

      return {
        isValid: true,
        session: result.session
      };
    }),

  /**
   * Get active sessions for a role (protected)
   */
  getActiveSessions: authorizedProcedure
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

      const sessions = await getActiveSessionsForRole(input.roleId);
      return sessions;
    }),

  /**
   * Get active session count for a code (protected)
   */
  getSessionCount: authorizedProcedure
    .input(z.object({
      codeId: z.string().cuid()
    }))
    .query(async ({ ctx, input }) => {
      // Verify user owns this code's role
      const code = await ctx.prisma.code.findUnique({
        where: { id: input.codeId },
        include: { role: true }
      });

      if (!code || code.role.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const count = await getActiveSessionCountForCode(input.codeId);
      return { count };
    }),

  /**
   * Terminate a specific session (protected)
   */
  terminateSession: authorizedProcedure
    .input(z.object({
      sessionId: z.string().cuid(),
      reason: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify user owns the session's code
      const session = await ctx.prisma.kioskSession.findUnique({
        where: { id: input.sessionId },
        include: {
          code: {
            include: { role: true }
          }
        }
      });

      if (!session || session.code.role.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      await terminateSession(input.sessionId, ctx.user.id, input.reason);
      return { success: true };
    }),

  /**
   * Terminate all sessions for a code (protected)
   */
  terminateAllSessions: authorizedProcedure
    .input(z.object({
      codeId: z.string().cuid(),
      reason: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify user owns this code's role
      const code = await ctx.prisma.code.findUnique({
        where: { id: input.codeId },
        include: { role: true }
      });

      if (!code || code.role.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const count = await terminateAllSessionsForCode(input.codeId, ctx.user.id, input.reason);
      return { count };
    })
});
