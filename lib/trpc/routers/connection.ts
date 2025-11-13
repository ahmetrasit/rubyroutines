import { z } from 'zod';
import { router, authorizedProcedure, verifiedProcedure } from '../init';
import {
  generateConnectionCode,
  connectParentToStudent,
  getConnectedStudents,
  disconnectParentFromStudent
} from '@/lib/services/connection.service';

export const connectionRouter = router({
  // Teacher generates code for student
  // Requires email verification
  generateCode: verifiedProcedure
    .input(
      z.object({
        roleId: z.string().cuid(),
        studentPersonId: z.string().cuid()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await generateConnectionCode(
        input.roleId,
        input.studentPersonId
      );
      return result;
    }),

  // Parent connects to student using code
  connect: authorizedProcedure
    .input(
      z.object({
        code: z.string().length(6),
        parentRoleId: z.string().cuid(),
        parentPersonId: z.string().cuid()
      })
    )
    .mutation(async ({ ctx, input }) => {
      await connectParentToStudent(
        input.code,
        input.parentRoleId,
        input.parentPersonId
      );
      return { success: true };
    }),

  // Get parent's connected students
  listConnections: authorizedProcedure
    .input(
      z.object({
        parentRoleId: z.string().cuid()
      })
    )
    .query(async ({ ctx, input }) => {
      const connections = await getConnectedStudents(input.parentRoleId);
      return connections;
    }),

  // Disconnect parent from student
  disconnect: authorizedProcedure
    .input(
      z.object({
        connectionId: z.string().cuid()
      })
    )
    .mutation(async ({ ctx, input }) => {
      await disconnectParentFromStudent(input.connectionId, ctx.user.id);
      return { success: true };
    })
});
