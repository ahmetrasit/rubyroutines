import { router, authorizedProcedure } from '../init';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
  calculateRoutineStreak,
  calculatePersonStreak,
  getStreakMilestones,
} from '@/lib/services/streak-tracking';

export const streakRouter = router({
  /**
   * Get streak data for a specific routine
   */
  getRoutineStreak: authorizedProcedure
    .input(
      z.object({
        personId: z.string().cuid(),
        routineId: z.string().cuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify user has access to this person
      const person = await ctx.prisma.person.findUnique({
        where: { id: input.personId },
        include: {
          role: true,
        },
      });

      if (!person || person.role.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this person',
        });
      }

      const streakData = await calculateRoutineStreak(
        input.personId,
        input.routineId
      );

      const milestones = getStreakMilestones(streakData.currentStreak);

      return {
        ...streakData,
        milestones,
      };
    }),

  /**
   * Get streak data for a person across all routines
   */
  getPersonStreak: authorizedProcedure
    .input(
      z.object({
        personId: z.string().cuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify user has access to this person
      const person = await ctx.prisma.person.findUnique({
        where: { id: input.personId },
        include: {
          role: true,
        },
      });

      if (!person || person.role.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this person',
        });
      }

      const streakData = await calculatePersonStreak(input.personId);
      const milestones = getStreakMilestones(streakData.currentStreak);

      return {
        ...streakData,
        milestones,
      };
    }),

  /**
   * Get all streaks for a role (useful for dashboard)
   */
  getRoleStreaks: authorizedProcedure
    .input(
      z.object({
        roleId: z.string().uuid(), // Role IDs are UUIDs, not CUIDs
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify user owns this role
      const role = await ctx.prisma.role.findUnique({
        where: { id: input.roleId },
      });

      if (!role || role.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this role',
        });
      }

      // Get all persons for this role
      const persons = await ctx.prisma.person.findMany({
        where: {
          roleId: input.roleId,
          status: 'ACTIVE',
        },
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      });

      // Calculate streak for each person
      const streaks = await Promise.all(
        persons.map(async (person) => {
          const streakData = await calculatePersonStreak(person.id);
          return {
            personId: person.id,
            personName: person.name,
            personAvatar: person.avatar,
            currentStreak: streakData.currentStreak,
            longestStreak: streakData.longestStreak,
            lastCompletionDate: streakData.lastCompletionDate,
          };
        })
      );

      return streaks;
    }),
});
