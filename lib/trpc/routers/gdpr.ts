import { router, protectedProcedure } from '../init';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { logDataChange, AUDIT_ACTIONS } from '@/lib/services/audit-log';
import { logger } from '@/lib/utils/logger';

export const gdprRouter = router({
  /**
   * Export all user data (GDPR Article 15 - Right to Access)
   */
  exportData: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = ctx.user.id;

      // Fetch all user data
      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        include: {
          roles: {
            include: {
              persons: {
                include: {
                  assignments: {
                    include: {
                      routine: {
                        include: {
                          tasks: {
                            include: {
                              completions: true,
                              conditions: true,
                            },
                          },
                        },
                      },
                    },
                  },
                  taskCompletions: true,
                },
              },
              goals: {
                include: {
                  taskLinks: {
                    include: {
                      task: true,
                    },
                  },
                },
              },
              routines: {
                include: {
                  tasks: {
                    include: {
                      completions: true,
                      conditions: true,
                    },
                  },
                  assignments: true,
                },
              },
              codes: true,
              coParents: true,
              coParentConnections: true,
            },
          },
          verificationCodes: true,
          invitations: true,
          acceptedInvitations: true,
          marketplaceRatings: true,
          marketplaceComments: true,
          auditLogs: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1000, // Limit to last 1000 audit logs
          },
        },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Log data export
      await logDataChange(
        userId,
        AUDIT_ACTIONS.DATA_EXPORT,
        'User',
        userId,
        {
          after: {
            exportDate: new Date().toISOString(),
            includesRoles: user.roles.length,
            includesPersons: user.roles.reduce(
              (sum, role) => sum + role.persons.length,
              0
            ),
          },
        }
      );

      return {
        format: 'json',
        version: '1.0',
        exportDate: new Date().toISOString(),
        data: user,
      };
    } catch (error) {
      logger.error('Failed to export user data', { error, userId: ctx.user.id });
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to export data. Please try again later.',
      });
    }
  }),

  /**
   * Delete user account and all associated data (GDPR Article 17 - Right to Erasure)
   */
  deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const userId = ctx.user.id;

      // Get user email for logging before deletion
      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, roles: true },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Log account deletion BEFORE deleting
      await logDataChange(
        userId,
        AUDIT_ACTIONS.DATA_DELETE,
        'User',
        userId,
        {
          before: {
            email: user.email,
            rolesCount: user.roles.length,
            deletedAt: new Date().toISOString(),
          },
        }
      );

      // Get all role IDs for this user
      const roleIds = user.roles.map((role) => role.id);

      // Delete all associated data in transaction
      // Prisma will handle cascading deletes based on schema
      await ctx.prisma.$transaction([
        // Delete task completions (no cascade from person)
        ctx.prisma.taskCompletion.deleteMany({
          where: {
            person: {
              role: {
                userId,
              },
            },
          },
        }),

        // Delete conditions
        ctx.prisma.condition.deleteMany({
          where: {
            task: {
              routine: {
                roleId: {
                  in: roleIds,
                },
              },
            },
          },
        }),

        // Delete goal task links
        ctx.prisma.goalTaskLink.deleteMany({
          where: {
            goal: {
              roleId: {
                in: roleIds,
              },
            },
          },
        }),

        // Delete goals
        ctx.prisma.goal.deleteMany({
          where: {
            roleId: {
              in: roleIds,
            },
          },
        }),

        // Delete tasks
        ctx.prisma.task.deleteMany({
          where: {
            routine: {
              roleId: {
                in: roleIds,
              },
            },
          },
        }),

        // Delete routine assignments
        ctx.prisma.routineAssignment.deleteMany({
          where: {
            routine: {
              roleId: {
                in: roleIds,
              },
            },
          },
        }),

        // Delete routines
        ctx.prisma.routine.deleteMany({
          where: {
            roleId: {
              in: roleIds,
            },
          },
        }),

        // Delete persons
        ctx.prisma.person.deleteMany({
          where: {
            roleId: {
              in: roleIds,
            },
          },
        }),

        // Delete codes
        ctx.prisma.code.deleteMany({
          where: {
            roleId: {
              in: roleIds,
            },
          },
        }),

        // Delete co-parent connections
        ctx.prisma.coParent.deleteMany({
          where: {
            OR: [
              { parentRoleId: { in: roleIds } },
              { coParentRoleId: { in: roleIds } },
            ],
          },
        }),

        // Delete invitations
        ctx.prisma.invitation.deleteMany({
          where: {
            OR: [{ inviterUserId: userId }, { acceptedUserId: userId }],
          },
        }),

        // Delete marketplace ratings
        ctx.prisma.marketplaceRating.deleteMany({
          where: { userId },
        }),

        // Delete marketplace comments
        ctx.prisma.marketplaceComment.deleteMany({
          where: { userId },
        }),

        // Delete verification codes
        ctx.prisma.verificationCode.deleteMany({
          where: { userId },
        }),

        // Delete roles (will cascade delete related data)
        ctx.prisma.role.deleteMany({
          where: { userId },
        }),

        // Finally, delete the user (audit logs will cascade delete)
        ctx.prisma.user.delete({
          where: { id: userId },
        }),
      ]);

      // Sign out user from Supabase
      await ctx.supabase.auth.signOut();

      logger.info('User account deleted', {
        userId,
        email: user.email,
        rolesCount: user.roles.length,
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to delete user account', {
        error,
        userId: ctx.user.id,
      });
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete account. Please try again later.',
      });
    }
  }),

  /**
   * Check if user has given data processing consent
   */
  getConsent: protectedProcedure.query(async ({ ctx }) => {
    // For now, return true as consent is implied by account creation
    // In a full implementation, you'd track this in the database
    return {
      dataProcessing: true,
      marketing: false,
      analytics: false,
    };
  }),

  /**
   * Update user consent preferences
   */
  updateConsent: protectedProcedure
    .input(
      z.object({
        dataProcessing: z.boolean(),
        marketing: z.boolean().optional(),
        analytics: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Log consent change
      await logDataChange(
        ctx.user.id,
        input.dataProcessing
          ? AUDIT_ACTIONS.DATA_CONSENT_GIVEN
          : AUDIT_ACTIONS.DATA_CONSENT_WITHDRAWN,
        'User',
        ctx.user.id,
        {
          after: input,
        }
      );

      // In a full implementation, you'd store this in a consent table
      return { success: true };
    }),
});
