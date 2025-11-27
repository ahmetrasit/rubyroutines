import { z } from 'zod';
import { router, authorizedProcedure, verifiedProcedure } from '../init';
import {
  generatePersonConnectionCode,
  validatePersonConnectionCode,
  connectPersons,
  getConnectionsAsOrigin,
  getConnectionsAsTarget,
  updateConnectionScope,
  removeConnection,
  getConnectedPersonData,
  getConnectedPersonsForDashboard,
  getActiveConnectionCodes,
  revokeConnectionCode,
} from '@/lib/services/person-connection.service';

/**
 * Person Connection Router
 *
 * Handles cross-account person-to-person connections where:
 * - Origin person = the person being observed (their tasks are shown)
 * - Target person = the observer (sees origin's tasks in their dashboard)
 *
 * Type constraints:
 * - Student (origin) → Kid (target) only
 * - Kid (origin) → Student (target) only
 * - Teacher account owner (origin) → Parent or Kid (target)
 * - Parent account owner (origin) → Student (target) only
 */
export const personConnectionRouter = router({
  /**
   * Generate a connection code for a person
   * Requires email verification
   *
   * @param roleId - The role that owns the origin person
   * @param originPersonId - The person to generate a code for
   */
  generateCode: verifiedProcedure
    .input(
      z.object({
        roleId: z.string().uuid(),
        originPersonId: z.string().cuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await generatePersonConnectionCode(
        input.roleId,
        input.originPersonId,
        ctx.user.id
      );
      return result;
    }),

  /**
   * Validate a connection code before claiming
   * Returns origin person info and allowed target types
   *
   * @param code - The 4-word connection code
   */
  validateCode: authorizedProcedure
    .input(
      z.object({
        code: z.string().min(1, 'Code is required'),
      })
    )
    .mutation(async ({ input }) => {
      const result = await validatePersonConnectionCode(input.code);
      return result;
    }),

  /**
   * Claim a connection code and establish a connection
   *
   * @param code - The 4-word connection code
   * @param targetRoleId - The role that owns the target person
   * @param targetPersonId - The person who will observe the origin
   */
  claimCode: authorizedProcedure
    .input(
      z.object({
        code: z.string().regex(
          /^[a-z]+-[a-z]+-[a-z]+-[a-z]+$/,
          'Code must be in format: word-word-word-word'
        ),
        roleId: z.string().uuid(), // Target role ID - for authorization middleware
        targetPersonId: z.string().cuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await connectPersons(
        input.code,
        input.roleId, // targetRoleId
        input.targetPersonId,
        ctx.user.id
      );
      return result;
    }),

  /**
   * List connections where this person is the origin (being observed)
   * Shows who can see this person's tasks
   *
   * @param roleId - The role that owns the origin person
   * @param originPersonId - The person being observed
   */
  listAsOrigin: authorizedProcedure
    .input(
      z.object({
        roleId: z.string().uuid(),
        originPersonId: z.string().cuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const connections = await getConnectionsAsOrigin(
        input.roleId,
        input.originPersonId,
        ctx.user.id
      );
      return connections;
    }),

  /**
   * List connections where this person is the target (observer)
   * Shows who this person can observe
   *
   * @param roleId - The role that owns the target person
   * @param targetPersonId - The person who is observing
   */
  listAsTarget: authorizedProcedure
    .input(
      z.object({
        roleId: z.string().uuid(),
        targetPersonId: z.string().cuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const connections = await getConnectionsAsTarget(
        input.roleId,
        input.targetPersonId,
        ctx.user.id
      );
      return connections;
    }),

  /**
   * Update the scope of a connection (origin owner only)
   * Controls which routines/goals are visible to the target
   *
   * @param connectionId - The connection to update
   * @param scopeMode - 'ALL' or 'SELECTED'
   * @param visibleRoutineIds - Array of routine IDs (when scopeMode is 'SELECTED')
   * @param visibleGoalIds - Array of goal IDs (when scopeMode is 'SELECTED')
   */
  updateScope: authorizedProcedure
    .input(
      z.object({
        connectionId: z.string().cuid(),
        scopeMode: z.enum(['ALL', 'SELECTED']),
        visibleRoutineIds: z.array(z.string().cuid()).optional(),
        visibleGoalIds: z.array(z.string().uuid()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await updateConnectionScope(
        input.connectionId,
        ctx.user.id,
        input.scopeMode,
        input.visibleRoutineIds,
        input.visibleGoalIds
      );
      return { success: true };
    }),

  /**
   * Remove a connection (both origin and target owners can do this)
   *
   * @param connectionId - The connection to remove
   */
  remove: authorizedProcedure
    .input(
      z.object({
        connectionId: z.string().cuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await removeConnection(input.connectionId, ctx.user.id);
      return { success: true };
    }),

  /**
   * Get connected person's data for dashboard display
   * Only target owner can view this
   *
   * @param connectionId - The connection to get data for
   */
  getConnectedPersonData: authorizedProcedure
    .input(
      z.object({
        connectionId: z.string().cuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const data = await getConnectedPersonData(
        input.connectionId,
        ctx.user.id
      );
      return data;
    }),

  /**
   * Get all connected persons for a target person's dashboard
   *
   * @param roleId - The role that owns the target person
   * @param targetPersonId - The person whose dashboard to populate
   */
  getConnectedPersonsForDashboard: authorizedProcedure
    .input(
      z.object({
        roleId: z.string().uuid(),
        targetPersonId: z.string().cuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const connections = await getConnectedPersonsForDashboard(
        input.roleId,
        input.targetPersonId,
        ctx.user.id
      );
      return connections;
    }),

  /**
   * Get active connection codes for a person
   *
   * @param roleId - The role that owns the origin person
   * @param originPersonId - The person whose codes to list
   */
  getActiveCodes: authorizedProcedure
    .input(
      z.object({
        roleId: z.string().uuid(),
        originPersonId: z.string().cuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const codes = await getActiveConnectionCodes(
        input.roleId,
        input.originPersonId,
        ctx.user.id
      );
      return codes;
    }),

  /**
   * Revoke a connection code
   *
   * @param codeId - The code to revoke
   */
  revokeCode: authorizedProcedure
    .input(
      z.object({
        codeId: z.string().cuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await revokeConnectionCode(input.codeId, ctx.user.id);
      return { success: true };
    }),
});
