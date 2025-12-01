import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../init';
import { invitationTokenRateLimitedProcedure } from '../middleware/ratelimit';
import { acceptInvitation, rejectInvitation, SharedPerson } from '@/lib/services/invitation.service';
import { prisma } from '@/lib/prisma';

// Type for shared person with names (for UI display)
interface SharedPersonWithNames {
  personId: string;
  personName: string;
  routineIds: string[];
  routineNames: string[];
}

export const invitationRouter = router({
  // Get invitation details by token (public so user can view before accepting)
  // Rate limited to 10 attempts per minute per IP to prevent brute force attacks
  getByToken: invitationTokenRateLimitedProcedure
    .input(
      z.object({
        token: z.string()
      })
    )
    .query(async ({ input }) => {
      const invitation = await prisma.invitation.findUnique({
        where: { token: input.token },
        include: {
          inviterRole: {
            include: { user: true }
          }
        }
      });

      if (!invitation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invalid invitation' });
      }

      if (invitation.status !== 'PENDING') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invitation already processed' });
      }

      if (new Date() > invitation.expiresAt) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invitation expired' });
      }

      // For CO_PARENT and CO_TEACHER invitations, enrich sharedPersons with person and routine names
      let sharedPersonsWithNames: SharedPersonWithNames[] = [];

      if (invitation.type === 'CO_PARENT' || invitation.type === 'CO_TEACHER') {
        const sharedPersons = (invitation.sharedPersons as unknown as SharedPerson[]) || [];

        if (sharedPersons.length > 0) {
          // Get all person IDs and routine IDs
          const personIds = sharedPersons.map(sp => sp.personId);
          const allRoutineIds = sharedPersons.flatMap(sp => sp.routineIds);

          // Fetch person names
          const persons = await prisma.person.findMany({
            where: { id: { in: personIds } },
            select: { id: true, name: true }
          });
          const personMap = new Map(persons.map(p => [p.id, p.name]));

          // Fetch routine names
          const routines = await prisma.routine.findMany({
            where: { id: { in: allRoutineIds } },
            select: { id: true, name: true }
          });
          const routineMap = new Map(routines.map(r => [r.id, r.name]));

          // Build enriched sharedPersons
          sharedPersonsWithNames = sharedPersons.map(sp => ({
            personId: sp.personId,
            personName: personMap.get(sp.personId) || 'Unknown',
            routineIds: sp.routineIds,
            routineNames: sp.routineIds.map(rid => routineMap.get(rid) || 'Unknown Routine')
          }));
        }
      }

      return {
        id: invitation.id,
        type: invitation.type,
        inviterName: invitation.inviterRole.user.name,
        inviterEmail: invitation.inviterRole.user.email,
        inviteeEmail: invitation.inviteeEmail,
        permissions: invitation.permissions,
        expiresAt: invitation.expiresAt,
        sharedPersons: sharedPersonsWithNames
      };
    }),

  // Accept invitation
  accept: protectedProcedure
    .input(
      z.object({
        token: z.string(),
        // For CO_PARENT invitations: how to link each shared kid
        personLinkings: z.array(z.object({
          primaryPersonId: z.string(),  // Inviter's kid (from sharedPersons)
          linkedPersonId: z.string().nullable(),  // Accepting user's kid (selected or created)
          createNew: z.boolean(),  // Whether to create a new person
          newPersonName: z.string().optional()  // Name for new person if createNew is true
        })).optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      await acceptInvitation(input.token, ctx.user.id, input.personLinkings);
      return { success: true };
    }),

  // Reject invitation
  reject: protectedProcedure
    .input(
      z.object({
        token: z.string()
      })
    )
    .mutation(async ({ ctx, input }) => {
      await rejectInvitation(input.token);
      return { success: true };
    })
});
