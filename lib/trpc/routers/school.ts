import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, verifiedProcedure, authorizedProcedure } from '../init';
import { prisma } from '@/lib/prisma';

/**
 * School Router
 * Handles school management and cross-teacher student linking (Level 3)
 */
export const schoolRouter = router({
  /**
   * Create a new school with the caller as principal
   */
  create: verifiedProcedure
    .input(
      z.object({
        roleId: z.string().uuid(),
        name: z.string().min(2).max(100),
        address: z.string().max(500).optional(),
        website: z.string().url().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Create school with principal membership in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Verify the role exists inside transaction to prevent race conditions
        const role = await tx.role.findUnique({
          where: { id: input.roleId },
          select: { id: true, type: true },
        });

        if (!role) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Role not found',
          });
        }

        // Create the school
        const school = await tx.school.create({
          data: {
            name: input.name,
            address: input.address,
            website: input.website,
            status: 'ACTIVE',
          },
        });

        // Create principal membership
        await tx.schoolMember.create({
          data: {
            schoolId: school.id,
            roleId: input.roleId,
            role: 'PRINCIPAL',
            status: 'ACTIVE',
          },
        });

        return school;
      });

      return result;
    }),

  /**
   * Update school details (principal only)
   */
  update: verifiedProcedure
    .input(
      z.object({
        roleId: z.string().uuid(),
        schoolId: z.string().cuid(),
        name: z.string().min(2).max(100).optional(),
        address: z.string().max(500).optional().nullable(),
        website: z.string().url().optional().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      // Verify principal
      const membership = await prisma.schoolMember.findFirst({
        where: {
          schoolId: input.schoolId,
          roleId: input.roleId,
          role: 'PRINCIPAL',
          status: 'ACTIVE',
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only principals can update school details',
        });
      }

      return prisma.school.update({
        where: { id: input.schoolId },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.address !== undefined && { address: input.address }),
          ...(input.website !== undefined && { website: input.website }),
        },
      });
    }),

  /**
   * List schools for a user (as principal or member)
   */
  list: authorizedProcedure
    .input(z.object({ roleId: z.string().uuid() }))
    .query(async ({ input }) => {
      const memberships = await prisma.schoolMember.findMany({
        where: {
          roleId: input.roleId,
          status: 'ACTIVE',
        },
        include: {
          school: {
            include: {
              _count: {
                select: {
                  members: { where: { status: 'ACTIVE' } },
                  groups: true,
                },
              },
            },
          },
        },
      });

      return memberships.map((m) => ({
        ...m.school,
        memberRole: m.role,
        membershipId: m.id,
      }));
    }),

  /**
   * Get school members (teachers and support staff)
   */
  getMembers: authorizedProcedure
    .input(z.object({ roleId: z.string().uuid(), schoolId: z.string().cuid() }))
    .query(async ({ input }) => {
      // Verify membership in school
      const membership = await prisma.schoolMember.findFirst({
        where: {
          schoolId: input.schoolId,
          roleId: input.roleId,
          status: 'ACTIVE',
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You must be a member of this school',
        });
      }

      return prisma.schoolMember.findMany({
        where: {
          schoolId: input.schoolId,
          status: 'ACTIVE',
        },
        include: {
          userRole: {
            include: {
              user: { select: { id: true, name: true, email: true } },
              _count: {
                select: {
                  groups: { where: { isClassroom: true, status: 'ACTIVE' } },
                  persons: { where: { status: 'ACTIVE' } },
                },
              },
            },
          },
        },
        orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
      });
    }),

  /**
   * Remove a member from the school (principal only)
   */
  removeMember: verifiedProcedure
    .input(
      z.object({
        roleId: z.string().uuid(),
        schoolId: z.string().cuid(),
        memberRoleId: z.string().uuid(),
      })
    )
    .mutation(async ({ input }) => {
      // Verify caller is principal
      const callerMembership = await prisma.schoolMember.findFirst({
        where: {
          schoolId: input.schoolId,
          roleId: input.roleId,
          role: 'PRINCIPAL',
          status: 'ACTIVE',
        },
      });

      if (!callerMembership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only principals can remove members',
        });
      }

      // Cannot remove yourself as principal
      if (input.memberRoleId === input.roleId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot remove yourself as principal',
        });
      }

      // Find the member
      const member = await prisma.schoolMember.findFirst({
        where: {
          schoolId: input.schoolId,
          roleId: input.memberRoleId,
          status: 'ACTIVE',
        },
      });

      if (!member) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Member not found',
        });
      }

      // Soft-delete the membership
      return prisma.schoolMember.update({
        where: { id: member.id },
        data: { status: 'REMOVED' },
      });
    }),

  /**
   * Connect a classroom to the school (for billing)
   */
  connectClassroom: verifiedProcedure
    .input(
      z.object({
        roleId: z.string().uuid(),
        schoolId: z.string().cuid(),
        groupId: z.string().cuid(),
      })
    )
    .mutation(async ({ input }) => {
      // Verify caller is principal or the classroom owner is a member
      const [callerMembership, group] = await Promise.all([
        prisma.schoolMember.findFirst({
          where: {
            schoolId: input.schoolId,
            roleId: input.roleId,
            status: 'ACTIVE',
          },
        }),
        prisma.group.findUnique({
          where: { id: input.groupId },
          select: { id: true, roleId: true, isClassroom: true, schoolId: true },
        }),
      ]);

      if (!callerMembership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You must be a member of this school',
        });
      }

      if (!group) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Classroom not found',
        });
      }

      if (!group.isClassroom) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only classrooms can be connected to schools',
        });
      }

      // Verify the classroom owner is a member of the school
      const ownerMembership = await prisma.schoolMember.findFirst({
        where: {
          schoolId: input.schoolId,
          roleId: group.roleId,
          status: 'ACTIVE',
        },
      });

      if (!ownerMembership) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'The classroom owner must be a member of this school',
        });
      }

      return prisma.group.update({
        where: { id: input.groupId },
        data: { schoolId: input.schoolId },
      });
    }),

  /**
   * Disconnect a classroom from the school
   */
  disconnectClassroom: verifiedProcedure
    .input(
      z.object({
        roleId: z.string().uuid(),
        schoolId: z.string().cuid(),
        groupId: z.string().cuid(),
      })
    )
    .mutation(async ({ input }) => {
      // Verify caller is principal
      const membership = await prisma.schoolMember.findFirst({
        where: {
          schoolId: input.schoolId,
          roleId: input.roleId,
          role: 'PRINCIPAL',
          status: 'ACTIVE',
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only principals can disconnect classrooms',
        });
      }

      const group = await prisma.group.findUnique({
        where: { id: input.groupId },
        select: { id: true, schoolId: true },
      });

      if (!group || group.schoolId !== input.schoolId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Classroom not found in this school',
        });
      }

      return prisma.group.update({
        where: { id: input.groupId },
        data: { schoolId: null },
      });
    }),

  /**
   * Get classrooms connected to the school
   */
  getClassrooms: authorizedProcedure
    .input(z.object({ roleId: z.string().uuid(), schoolId: z.string().cuid() }))
    .query(async ({ input }) => {
      // Verify membership
      const membership = await prisma.schoolMember.findFirst({
        where: {
          schoolId: input.schoolId,
          roleId: input.roleId,
          status: 'ACTIVE',
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You must be a member of this school',
        });
      }

      return prisma.group.findMany({
        where: {
          schoolId: input.schoolId,
          isClassroom: true,
          status: 'ACTIVE',
        },
        include: {
          role: {
            include: {
              user: { select: { name: true } },
            },
          },
          _count: {
            select: {
              members: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });
    }),

  /**
   * Get school details for a principal
   */
  get: authorizedProcedure
    .input(z.object({ roleId: z.string().uuid(), schoolId: z.string().cuid() }))
    .query(async ({ input }) => {
      // Verify principal membership
      const membership = await prisma.schoolMember.findFirst({
        where: {
          schoolId: input.schoolId,
          roleId: input.roleId,
          role: 'PRINCIPAL',
          status: 'ACTIVE',
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only principals can access school details',
        });
      }

      return prisma.school.findUnique({
        where: { id: input.schoolId },
        include: {
          members: {
            where: { status: 'ACTIVE' },
            include: {
              userRole: {
                include: {
                  user: { select: { id: true, name: true, email: true } },
                },
              },
            },
          },
          _count: {
            select: {
              groups: true,
              studentLinks: true,
            },
          },
        },
      });
    }),

  /**
   * Link students across teachers within the school (Level 3 linking)
   */
  linkStudents: verifiedProcedure
    .input(
      z.object({
        roleId: z.string().uuid(),
        schoolId: z.string().cuid(),
        primaryPersonId: z.string().cuid(),
        linkedPersonId: z.string().cuid(),
      })
    )
    .mutation(async ({ input }) => {
      // Verify caller is principal of this school
      const membership = await prisma.schoolMember.findFirst({
        where: {
          schoolId: input.schoolId,
          roleId: input.roleId,
          role: 'PRINCIPAL',
          status: 'ACTIVE',
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the principal can link students across teachers',
        });
      }

      // Prevent linking same student to itself
      if (input.primaryPersonId === input.linkedPersonId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot link a student to itself',
        });
      }

      // Verify both persons belong to teachers in the school
      const schoolTeacherRoleIds = await prisma.schoolMember.findMany({
        where: {
          schoolId: input.schoolId,
          status: 'ACTIVE',
          role: { in: ['TEACHER', 'PRINCIPAL'] },
        },
        select: { roleId: true },
      });

      const teacherRoleIds = schoolTeacherRoleIds.map((m) => m.roleId);

      const [primary, linked] = await Promise.all([
        prisma.person.findFirst({
          where: {
            id: input.primaryPersonId,
            roleId: { in: teacherRoleIds },
            status: 'ACTIVE',
          },
        }),
        prisma.person.findFirst({
          where: {
            id: input.linkedPersonId,
            roleId: { in: teacherRoleIds },
            status: 'ACTIVE',
          },
        }),
      ]);

      if (!primary || !linked) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Both students must belong to teachers in this school',
        });
      }

      // Check if link already exists (in either direction)
      const existingLink = await prisma.schoolStudentLink.findFirst({
        where: {
          schoolId: input.schoolId,
          status: 'ACTIVE',
          OR: [
            {
              primaryPersonId: input.primaryPersonId,
              linkedPersonId: input.linkedPersonId,
            },
            {
              primaryPersonId: input.linkedPersonId,
              linkedPersonId: input.primaryPersonId,
            },
          ],
        },
      });

      if (existingLink) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'These students are already linked in this school',
        });
      }

      return prisma.schoolStudentLink.create({
        data: {
          schoolId: input.schoolId,
          primaryPersonId: input.primaryPersonId,
          linkedPersonId: input.linkedPersonId,
          createdById: input.roleId,
          status: 'ACTIVE',
        },
        include: {
          primaryPerson: {
            select: {
              id: true,
              name: true,
              avatar: true,
              role: { select: { user: { select: { name: true } } } },
            },
          },
          linkedPerson: {
            select: {
              id: true,
              name: true,
              avatar: true,
              role: { select: { user: { select: { name: true } } } },
            },
          },
        },
      });
    }),

  /**
   * Bulk link students (same physical student across multiple teachers)
   */
  bulkLinkStudents: verifiedProcedure
    .input(
      z.object({
        roleId: z.string().uuid(),
        schoolId: z.string().cuid(),
        personIds: z.array(z.string().cuid()).min(2).max(10),
      })
    )
    .mutation(async ({ input }) => {
      // Verify principal
      const membership = await prisma.schoolMember.findFirst({
        where: {
          schoolId: input.schoolId,
          roleId: input.roleId,
          role: 'PRINCIPAL',
          status: 'ACTIVE',
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the principal can link students across teachers',
        });
      }

      // Verify all persons belong to school teachers
      const schoolTeacherRoleIds = await prisma.schoolMember.findMany({
        where: {
          schoolId: input.schoolId,
          status: 'ACTIVE',
          role: { in: ['TEACHER', 'PRINCIPAL'] },
        },
        select: { roleId: true },
      });

      const teacherRoleIds = schoolTeacherRoleIds.map((m) => m.roleId);

      const persons = await prisma.person.findMany({
        where: {
          id: { in: input.personIds },
          roleId: { in: teacherRoleIds },
          status: 'ACTIVE',
        },
      });

      if (persons.length !== input.personIds.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'All students must belong to teachers in this school',
        });
      }

      // First person becomes primary, link to all others
      // Zod validates min(2), so we're guaranteed at least 2 elements
      const primaryId = input.personIds[0] as string;
      const linkedIds = input.personIds.slice(1) as string[];

      // Check for existing links in either direction to avoid duplicates
      const existingLinks = await prisma.schoolStudentLink.findMany({
        where: {
          schoolId: input.schoolId,
          status: 'ACTIVE',
          OR: linkedIds.flatMap((linkedId) => [
            { primaryPersonId: primaryId, linkedPersonId: linkedId },
            { primaryPersonId: linkedId, linkedPersonId: primaryId },
          ]),
        },
        select: { primaryPersonId: true, linkedPersonId: true },
      });

      // Build a set of already-linked pairs (both directions)
      const linkedPairs = new Set<string>();
      for (const link of existingLinks) {
        linkedPairs.add(`${link.primaryPersonId}-${link.linkedPersonId}`);
        linkedPairs.add(`${link.linkedPersonId}-${link.primaryPersonId}`);
      }

      // Filter out already linked students
      const newLinkedIds = linkedIds.filter(
        (linkedId) => !linkedPairs.has(`${primaryId}-${linkedId}`)
      );

      if (newLinkedIds.length === 0) {
        return { count: 0, links: [], skipped: linkedIds.length };
      }

      // Create links using transaction
      const links = await prisma.$transaction(
        newLinkedIds.map((linkedId) =>
          prisma.schoolStudentLink.create({
            data: {
              schoolId: input.schoolId,
              primaryPersonId: primaryId,
              linkedPersonId: linkedId,
              createdById: input.roleId,
              status: 'ACTIVE',
            },
          })
        )
      );

      return { count: links.length, links, skipped: linkedIds.length - newLinkedIds.length };
    }),

  /**
   * Get all school-level student links
   */
  getStudentLinks: authorizedProcedure
    .input(z.object({ roleId: z.string().uuid(), schoolId: z.string().cuid() }))
    .query(async ({ input }) => {
      // Verify principal access
      const membership = await prisma.schoolMember.findFirst({
        where: {
          schoolId: input.schoolId,
          roleId: input.roleId,
          role: 'PRINCIPAL',
          status: 'ACTIVE',
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only principals can view school student links',
        });
      }

      return prisma.schoolStudentLink.findMany({
        where: { schoolId: input.schoolId, status: 'ACTIVE' },
        include: {
          primaryPerson: {
            select: {
              id: true,
              name: true,
              avatar: true,
              role: { select: { user: { select: { name: true } } } },
            },
          },
          linkedPerson: {
            select: {
              id: true,
              name: true,
              avatar: true,
              role: { select: { user: { select: { name: true } } } },
            },
          },
          createdBy: {
            select: { user: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }),

  /**
   * Remove (revoke) a school-level student link
   */
  unlinkStudents: verifiedProcedure
    .input(
      z.object({
        roleId: z.string().uuid(),
        schoolId: z.string().cuid(),
        linkId: z.string().cuid(),
      })
    )
    .mutation(async ({ input }) => {
      // Verify principal
      const membership = await prisma.schoolMember.findFirst({
        where: {
          schoolId: input.schoolId,
          roleId: input.roleId,
          role: 'PRINCIPAL',
          status: 'ACTIVE',
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the principal can manage student links',
        });
      }

      const link = await prisma.schoolStudentLink.findUnique({
        where: { id: input.linkId },
      });

      if (!link || link.schoolId !== input.schoolId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Link not found',
        });
      }

      return prisma.schoolStudentLink.update({
        where: { id: input.linkId },
        data: { status: 'REVOKED' },
      });
    }),

  /**
   * Get all students across teachers in the school (for linking UI)
   */
  getAllStudents: authorizedProcedure
    .input(z.object({ roleId: z.string().uuid(), schoolId: z.string().cuid() }))
    .query(async ({ input }) => {
      // Verify principal access
      const membership = await prisma.schoolMember.findFirst({
        where: {
          schoolId: input.schoolId,
          roleId: input.roleId,
          role: 'PRINCIPAL',
          status: 'ACTIVE',
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only principals can view all students',
        });
      }

      // Get all teacher role IDs in the school
      const schoolMembers = await prisma.schoolMember.findMany({
        where: {
          schoolId: input.schoolId,
          status: 'ACTIVE',
          role: { in: ['TEACHER', 'PRINCIPAL'] },
        },
        select: { roleId: true, role: true },
      });

      const teacherRoleIds = schoolMembers.map((m) => m.roleId);

      // Get all students under these teachers
      return prisma.person.findMany({
        where: {
          roleId: { in: teacherRoleIds },
          status: 'ACTIVE',
        },
        select: {
          id: true,
          name: true,
          avatar: true,
          roleId: true,
          role: {
            select: {
              user: { select: { name: true } },
            },
          },
        },
        orderBy: { name: 'asc' },
      });
    }),

  /**
   * Invite a teacher to join the school
   */
  inviteTeacher: verifiedProcedure
    .input(
      z.object({
        roleId: z.string().uuid(),
        schoolId: z.string().cuid(),
        email: z.string().email(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify caller is principal
      const membership = await prisma.schoolMember.findFirst({
        where: {
          schoolId: input.schoolId,
          roleId: input.roleId,
          role: 'PRINCIPAL',
          status: 'ACTIVE',
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only principals can invite teachers',
        });
      }

      // Get the school for the invitation
      const school = await prisma.school.findUnique({
        where: { id: input.schoolId },
        select: { id: true, name: true },
      });

      if (!school) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'School not found',
        });
      }

      // Get the inviter's user ID
      const role = await prisma.role.findUnique({
        where: { id: input.roleId },
        select: { userId: true },
      });

      if (!role) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Role not found',
        });
      }

      // Import invitation service dynamically to avoid circular deps
      const { sendInvitation, InvitationType } = await import('@/lib/services/invitation.service');

      const result = await sendInvitation({
        inviterUserId: role.userId,
        inviterRoleId: input.roleId,
        inviteeEmail: input.email,
        type: InvitationType.SCHOOL_TEACHER,
      });

      // Update the invitation with schoolId - wrap in try-catch to clean up on failure
      try {
        await prisma.invitation.update({
          where: { id: result.invitationId },
          data: {
            schoolId: input.schoolId,
            schoolRole: 'TEACHER',
          },
        });
      } catch (updateError) {
        // Clean up the invitation if update fails
        await prisma.invitation.delete({ where: { id: result.invitationId } }).catch(() => {});
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create invitation. Please try again.',
        });
      }

      return {
        invitationId: result.invitationId,
        inviteCode: result.inviteCode,
        schoolName: school.name,
      };
    }),

  /**
   * Invite support staff to join the school
   */
  inviteSupport: verifiedProcedure
    .input(
      z.object({
        roleId: z.string().uuid(),
        schoolId: z.string().cuid(),
        email: z.string().email(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify caller is principal
      const membership = await prisma.schoolMember.findFirst({
        where: {
          schoolId: input.schoolId,
          roleId: input.roleId,
          role: 'PRINCIPAL',
          status: 'ACTIVE',
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only principals can invite support staff',
        });
      }

      // Get the school
      const school = await prisma.school.findUnique({
        where: { id: input.schoolId },
        select: { id: true, name: true },
      });

      if (!school) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'School not found',
        });
      }

      // Get the inviter's user ID
      const role = await prisma.role.findUnique({
        where: { id: input.roleId },
        select: { userId: true },
      });

      if (!role) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Role not found',
        });
      }

      // Import invitation service
      const { sendInvitation, InvitationType } = await import('@/lib/services/invitation.service');

      const result = await sendInvitation({
        inviterUserId: role.userId,
        inviterRoleId: input.roleId,
        inviteeEmail: input.email,
        type: InvitationType.SCHOOL_SUPPORT,
      });

      // Update the invitation with schoolId - wrap in try-catch to clean up on failure
      try {
        await prisma.invitation.update({
          where: { id: result.invitationId },
          data: {
            schoolId: input.schoolId,
            schoolRole: 'SUPPORT',
          },
        });
      } catch (updateError) {
        // Clean up the invitation if update fails
        await prisma.invitation.delete({ where: { id: result.invitationId } }).catch(() => {});
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create invitation. Please try again.',
        });
      }

      return {
        invitationId: result.invitationId,
        inviteCode: result.inviteCode,
        schoolName: school.name,
      };
    }),

  /**
   * Get pending invitations for the school
   */
  getPendingInvitations: authorizedProcedure
    .input(z.object({ roleId: z.string().uuid(), schoolId: z.string().cuid() }))
    .query(async ({ input }) => {
      // Verify principal
      const membership = await prisma.schoolMember.findFirst({
        where: {
          schoolId: input.schoolId,
          roleId: input.roleId,
          role: 'PRINCIPAL',
          status: 'ACTIVE',
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only principals can view invitations',
        });
      }

      return prisma.invitation.findMany({
        where: {
          schoolId: input.schoolId,
          status: 'PENDING',
        },
        select: {
          id: true,
          inviteeEmail: true,
          schoolRole: true,
          inviteCode: true,
          createdAt: true,
          expiresAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }),

  /**
   * Cancel a pending invitation
   */
  cancelInvitation: verifiedProcedure
    .input(
      z.object({
        roleId: z.string().uuid(),
        schoolId: z.string().cuid(),
        invitationId: z.string().cuid(),
      })
    )
    .mutation(async ({ input }) => {
      // Verify principal
      const membership = await prisma.schoolMember.findFirst({
        where: {
          schoolId: input.schoolId,
          roleId: input.roleId,
          role: 'PRINCIPAL',
          status: 'ACTIVE',
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only principals can cancel invitations',
        });
      }

      const invitation = await prisma.invitation.findUnique({
        where: { id: input.invitationId },
      });

      if (!invitation || invitation.schoolId !== input.schoolId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invitation not found',
        });
      }

      if (invitation.status !== 'PENDING') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Can only cancel pending invitations',
        });
      }

      return prisma.invitation.update({
        where: { id: input.invitationId },
        data: { status: 'CANCELLED' },
      });
    }),
});
