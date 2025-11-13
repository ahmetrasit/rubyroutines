import { z } from 'zod';
import { router, protectedProcedure } from '../init';
import {
  generateConnectionCode,
  connectParentToStudent,
  getConnectedStudents,
  disconnectParentFromStudent
} from '@/lib/services/connection.service';

export const connectionRouter = router({
  // Teacher generates code for student
  generateCode: protectedProcedure
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
  connect: protectedProcedure
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
  listConnections: protectedProcedure
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
  disconnect: protectedProcedure
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
