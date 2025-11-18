import { prismaMock, setupCommonMocks } from './utils/prisma-mock';
import { generatePersonSharingInvite, claimPersonSharingInvite } from '@/lib/services/person-sharing-code';
import { TRPCError } from '@trpc/server';

describe('Person Sharing Restrictions', () => {
  beforeEach(() => {
    setupCommonMocks();
  });

  describe('Account Owner Sharing Prevention', () => {
    it('should prevent generating invite for account owner person', async () => {
      const parentRoleId = 'parent-role-1';
      const accountOwnerPersonId = 'account-owner-person-1';

      // Mock person lookup - account owner
      prismaMock.person.findUnique.mockResolvedValue({
        id: accountOwnerPersonId,
        roleId: parentRoleId,
        name: 'Me',
        isAccountOwner: true,
        avatar: null,
        birthdate: null,
        notes: null,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      await expect(
        generatePersonSharingInvite({
          ownerRoleId: parentRoleId,
          ownerPersonId: accountOwnerPersonId,
          shareType: 'PERSON',
          permissions: 'VIEW',
        })
      ).rejects.toThrow('Account owner persons cannot be shared via person sharing codes');
    });

    it('should allow generating invite for family member (child)', async () => {
      const parentRoleId = 'parent-role-1';
      const childPersonId = 'child-person-1';

      // Mock person lookup - child (not account owner)
      prismaMock.person.findUnique.mockResolvedValue({
        id: childPersonId,
        roleId: parentRoleId,
        name: 'Child',
        isAccountOwner: false,
        avatar: null,
        birthdate: null,
        notes: null,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      // Mock code uniqueness checks to return true (unique)
      prismaMock.personSharingInvite.findUnique.mockResolvedValue(null);
      prismaMock.marketplaceShareCode.findUnique.mockResolvedValue(null);
      prismaMock.routineShareCode.findUnique.mockResolvedValue(null);
      prismaMock.code.findFirst.mockResolvedValue(null);
      prismaMock.connectionCode.findFirst.mockResolvedValue(null);

      // Mock invite creation
      prismaMock.personSharingInvite.create.mockResolvedValue({
        id: 'invite-1',
        inviteCode: 'test-code-here-now',
        ownerRoleId: parentRoleId,
        ownerPersonId: childPersonId,
        shareType: 'PERSON',
        permissions: 'VIEW',
        contextData: null,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        maxUses: null,
        useCount: 0,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const code = await generatePersonSharingInvite({
        ownerRoleId: parentRoleId,
        ownerPersonId: childPersonId,
        shareType: 'PERSON',
        permissions: 'VIEW',
      });

      expect(code).toBeDefined();
      expect(typeof code).toBe('string');
    });
  });

  describe('Family Member Sharing Role Restrictions', () => {
    it('should allow parent to share child with teacher (student connection)', async () => {
      const parentRoleId = 'parent-role-1';
      const teacherRoleId = 'teacher-role-1';
      const childPersonId = 'child-person-1';
      const inviteCode = 'test-invite-code';

      // Mock invite validation
      prismaMock.personSharingInvite.findUnique.mockResolvedValue({
        id: 'invite-1',
        inviteCode: inviteCode,
        ownerRoleId: parentRoleId,
        ownerPersonId: childPersonId,
        shareType: 'PERSON',
        permissions: 'VIEW',
        contextData: null,
        expiresAt: new Date(Date.now() + 1000000),
        maxUses: null,
        useCount: 0,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        ownerRole: {
          id: parentRoleId,
          userId: 'user-1',
          type: 'PARENT',
          color: null,
          tierLimitOverride: null,
          stripeSubscriptionId: null,
          stripeCustomerId: null,
          tier: 'FREE',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          user: { name: 'Parent User', image: null },
        } as any,
        ownerPerson: {
          id: childPersonId,
          name: 'Child',
          avatar: null,
        },
      });

      // Mock person lookup - child
      prismaMock.person.findUnique.mockResolvedValue({
        id: childPersonId,
        roleId: parentRoleId,
        name: 'Child',
        isAccountOwner: false,
        avatar: null,
        birthdate: null,
        notes: null,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      // Mock teacher role lookup
      prismaMock.role.findUnique.mockResolvedValue({
        id: teacherRoleId,
        userId: 'teacher-user-1',
        type: 'TEACHER',
        color: null,
        tierLimitOverride: null,
        stripeSubscriptionId: null,
        stripeCustomerId: null,
        tier: 'FREE',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      // Mock no existing connection
      prismaMock.personSharingConnection.findFirst.mockResolvedValue(null);

      // Mock transaction
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        return await callback(prismaMock);
      });

      // Mock connection creation
      prismaMock.personSharingConnection.create.mockResolvedValue({
        id: 'connection-1',
        ownerRoleId: parentRoleId,
        ownerPersonId: childPersonId,
        sharedWithRoleId: teacherRoleId,
        sharedWithUserId: 'teacher-user-1',
        shareType: 'PERSON',
        permissions: 'VIEW',
        contextData: null,
        inviteCodeId: 'invite-1',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        revokedAt: null,
      });

      // Mock invite update
      prismaMock.personSharingInvite.update.mockResolvedValue({} as any);

      const connection = await claimPersonSharingInvite({
        inviteCode,
        claimingRoleId: teacherRoleId,
        claimingUserId: 'teacher-user-1',
      });

      expect(connection).toBeDefined();
      expect(connection.sharedWithRoleId).toBe(teacherRoleId);
    });

    it('should PREVENT parent from sharing child with another parent (must use co-parent system)', async () => {
      const parentRoleId = 'parent-role-1';
      const coParentRoleId = 'parent-role-2';
      const childPersonId = 'child-person-1';
      const inviteCode = 'test-invite-code-2';

      // Mock invite validation
      prismaMock.personSharingInvite.findUnique.mockResolvedValue({
        id: 'invite-2',
        inviteCode: inviteCode,
        ownerRoleId: parentRoleId,
        ownerPersonId: childPersonId,
        shareType: 'PERSON',
        permissions: 'EDIT',
        contextData: null,
        expiresAt: new Date(Date.now() + 1000000),
        maxUses: null,
        useCount: 0,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        ownerRole: {
          id: parentRoleId,
          userId: 'user-1',
          type: 'PARENT',
          color: null,
          tierLimitOverride: null,
          stripeSubscriptionId: null,
          stripeCustomerId: null,
          tier: 'FREE',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          user: { name: 'Parent User', image: null },
        } as any,
        ownerPerson: {
          id: childPersonId,
          name: 'Child',
          avatar: null,
        },
      });

      // Mock person lookup - child
      prismaMock.person.findUnique.mockResolvedValue({
        id: childPersonId,
        roleId: parentRoleId,
        name: 'Child',
        isAccountOwner: false,
        avatar: null,
        birthdate: null,
        notes: null,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      // Mock co-parent role lookup
      prismaMock.role.findUnique.mockResolvedValue({
        id: coParentRoleId,
        userId: 'coparent-user-1',
        type: 'PARENT',
        color: null,
        tierLimitOverride: null,
        stripeSubscriptionId: null,
        stripeCustomerId: null,
        tier: 'FREE',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      // Mock no existing connection
      prismaMock.personSharingConnection.findFirst.mockResolvedValue(null);

      // Mock transaction
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        return await callback(prismaMock);
      });

      // Mock connection creation
      prismaMock.personSharingConnection.create.mockResolvedValue({
        id: 'connection-2',
        ownerRoleId: parentRoleId,
        ownerPersonId: childPersonId,
        sharedWithRoleId: coParentRoleId,
        sharedWithUserId: 'coparent-user-1',
        shareType: 'PERSON',
        permissions: 'EDIT',
        contextData: null,
        inviteCodeId: 'invite-2',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        revokedAt: null,
      });

      // Mock invite update
      prismaMock.personSharingInvite.update.mockResolvedValue({} as any);

      await expect(
        claimPersonSharingInvite({
          inviteCode,
          claimingRoleId: coParentRoleId,
          claimingUserId: 'coparent-user-1',
        })
      ).rejects.toThrow('Family member cards can only be used to connect to a teacher');
    });

    it('should prevent parent from sharing child with PRINCIPAL role', async () => {
      const parentRoleId = 'parent-role-1';
      const principalRoleId = 'principal-role-1';
      const childPersonId = 'child-person-1';
      const inviteCode = 'test-invite-code-3';

      // Mock invite validation
      prismaMock.personSharingInvite.findUnique.mockResolvedValue({
        id: 'invite-3',
        inviteCode: inviteCode,
        ownerRoleId: parentRoleId,
        ownerPersonId: childPersonId,
        shareType: 'PERSON',
        permissions: 'VIEW',
        contextData: null,
        expiresAt: new Date(Date.now() + 1000000),
        maxUses: null,
        useCount: 0,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        ownerRole: {
          id: parentRoleId,
          userId: 'user-1',
          type: 'PARENT',
          color: null,
          tierLimitOverride: null,
          stripeSubscriptionId: null,
          stripeCustomerId: null,
          tier: 'FREE',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          user: { name: 'Parent User', image: null },
        } as any,
        ownerPerson: {
          id: childPersonId,
          name: 'Child',
          avatar: null,
        },
      });

      // Mock person lookup - child
      prismaMock.person.findUnique.mockResolvedValue({
        id: childPersonId,
        roleId: parentRoleId,
        name: 'Child',
        isAccountOwner: false,
        avatar: null,
        birthdate: null,
        notes: null,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      // Mock principal role lookup
      prismaMock.role.findUnique.mockResolvedValue({
        id: principalRoleId,
        userId: 'principal-user-1',
        type: 'PRINCIPAL',
        color: null,
        tierLimitOverride: null,
        stripeSubscriptionId: null,
        stripeCustomerId: null,
        tier: 'FREE',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      // Mock no existing connection
      prismaMock.personSharingConnection.findFirst.mockResolvedValue(null);

      await expect(
        claimPersonSharingInvite({
          inviteCode,
          claimingRoleId: principalRoleId,
          claimingUserId: 'principal-user-1',
        })
      ).rejects.toThrow('Family member cards can only be used to connect to a teacher');
    });

    it('should allow teacher to share student with another teacher (classroom sharing)', async () => {
      const teacherRoleId = 'teacher-role-1';
      const anotherTeacherRoleId = 'teacher-role-2';
      const studentPersonId = 'student-person-1';
      const inviteCode = 'test-invite-code-4';

      // Mock invite validation
      prismaMock.personSharingInvite.findUnique.mockResolvedValue({
        id: 'invite-4',
        inviteCode: inviteCode,
        ownerRoleId: teacherRoleId,
        ownerPersonId: studentPersonId,
        shareType: 'PERSON',
        permissions: 'VIEW',
        contextData: null,
        expiresAt: new Date(Date.now() + 1000000),
        maxUses: null,
        useCount: 0,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        ownerRole: {
          id: teacherRoleId,
          userId: 'teacher-user-1',
          type: 'TEACHER',
          color: null,
          tierLimitOverride: null,
          stripeSubscriptionId: null,
          stripeCustomerId: null,
          tier: 'FREE',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          user: { name: 'Teacher User', image: null },
        } as any,
        ownerPerson: {
          id: studentPersonId,
          name: 'Student',
          avatar: null,
        },
      });

      // Mock person lookup - student
      prismaMock.person.findUnique.mockResolvedValue({
        id: studentPersonId,
        roleId: teacherRoleId,
        name: 'Student',
        isAccountOwner: false,
        avatar: null,
        birthdate: null,
        notes: null,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      // Mock another teacher role lookup
      prismaMock.role.findUnique.mockResolvedValue({
        id: anotherTeacherRoleId,
        userId: 'teacher-user-2',
        type: 'TEACHER',
        color: null,
        tierLimitOverride: null,
        stripeSubscriptionId: null,
        stripeCustomerId: null,
        tier: 'FREE',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      // Mock no existing connection
      prismaMock.personSharingConnection.findFirst.mockResolvedValue(null);

      // Mock transaction
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        return await callback(prismaMock);
      });

      // Mock connection creation
      prismaMock.personSharingConnection.create.mockResolvedValue({
        id: 'connection-4',
        ownerRoleId: teacherRoleId,
        ownerPersonId: studentPersonId,
        sharedWithRoleId: anotherTeacherRoleId,
        sharedWithUserId: 'teacher-user-2',
        shareType: 'PERSON',
        permissions: 'VIEW',
        contextData: null,
        inviteCodeId: 'invite-4',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        revokedAt: null,
      });

      // Mock invite update
      prismaMock.personSharingInvite.update.mockResolvedValue({} as any);

      const connection = await claimPersonSharingInvite({
        inviteCode,
        claimingRoleId: anotherTeacherRoleId,
        claimingUserId: 'teacher-user-2',
      });

      expect(connection).toBeDefined();
      expect(connection.sharedWithRoleId).toBe(anotherTeacherRoleId);
    });

    it('should PREVENT teacher from sharing student with parent (must use connection code)', async () => {
      const teacherRoleId = 'teacher-role-1';
      const parentRoleId = 'parent-role-1';
      const studentPersonId = 'student-person-2';
      const inviteCode = 'test-invite-code-teacher-parent';

      // Mock invite validation
      prismaMock.personSharingInvite.findUnique.mockResolvedValue({
        id: 'invite-teacher-parent',
        inviteCode: inviteCode,
        ownerRoleId: teacherRoleId,
        ownerPersonId: studentPersonId,
        shareType: 'PERSON',
        permissions: 'VIEW',
        contextData: null,
        expiresAt: new Date(Date.now() + 1000000),
        maxUses: null,
        useCount: 0,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        ownerRole: {
          id: teacherRoleId,
          userId: 'teacher-user-1',
          type: 'TEACHER',
          color: null,
          tierLimitOverride: null,
          stripeSubscriptionId: null,
          stripeCustomerId: null,
          tier: 'FREE',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          user: { name: 'Teacher User', image: null },
        } as any,
        ownerPerson: {
          id: studentPersonId,
          name: 'Student',
          avatar: null,
        },
      });

      // Mock person lookup - student
      prismaMock.person.findUnique.mockResolvedValue({
        id: studentPersonId,
        roleId: teacherRoleId,
        name: 'Student',
        isAccountOwner: false,
        avatar: null,
        birthdate: null,
        notes: null,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      // Mock parent role lookup
      prismaMock.role.findUnique.mockResolvedValue({
        id: parentRoleId,
        userId: 'parent-user-1',
        type: 'PARENT',
        color: null,
        tierLimitOverride: null,
        stripeSubscriptionId: null,
        stripeCustomerId: null,
        tier: 'FREE',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      // Mock no existing connection
      prismaMock.personSharingConnection.findFirst.mockResolvedValue(null);

      // Mock transaction
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        return await callback(prismaMock);
      });

      // Mock connection creation
      prismaMock.personSharingConnection.create.mockResolvedValue({
        id: 'connection-teacher-parent',
        ownerRoleId: teacherRoleId,
        ownerPersonId: studentPersonId,
        sharedWithRoleId: parentRoleId,
        sharedWithUserId: 'parent-user-1',
        shareType: 'PERSON',
        permissions: 'VIEW',
        contextData: null,
        inviteCodeId: 'invite-teacher-parent',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        revokedAt: null,
      });

      // Mock invite update
      prismaMock.personSharingInvite.update.mockResolvedValue({} as any);

      await expect(
        claimPersonSharingInvite({
          inviteCode,
          claimingRoleId: parentRoleId,
          claimingUserId: 'parent-user-1',
        })
      ).rejects.toThrow('Teacher student cards can only be shared with other teachers');
    });

    it('should prevent teacher from sharing student with SUPPORT role', async () => {
      const teacherRoleId = 'teacher-role-1';
      const supportRoleId = 'support-role-1';
      const studentPersonId = 'student-person-3';
      const inviteCode = 'test-invite-code-support';

      // Mock invite validation
      prismaMock.personSharingInvite.findUnique.mockResolvedValue({
        id: 'invite-support',
        inviteCode: inviteCode,
        ownerRoleId: teacherRoleId,
        ownerPersonId: studentPersonId,
        shareType: 'PERSON',
        permissions: 'VIEW',
        contextData: null,
        expiresAt: new Date(Date.now() + 1000000),
        maxUses: null,
        useCount: 0,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        ownerRole: {
          id: teacherRoleId,
          userId: 'teacher-user-1',
          type: 'TEACHER',
          color: null,
          tierLimitOverride: null,
          stripeSubscriptionId: null,
          stripeCustomerId: null,
          tier: 'FREE',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          user: { name: 'Teacher User', image: null },
        } as any,
        ownerPerson: {
          id: studentPersonId,
          name: 'Student',
          avatar: null,
        },
      });

      // Mock person lookup - student
      prismaMock.person.findUnique.mockResolvedValue({
        id: studentPersonId,
        roleId: teacherRoleId,
        name: 'Student',
        isAccountOwner: false,
        avatar: null,
        birthdate: null,
        notes: null,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      // Mock support role lookup
      prismaMock.role.findUnique.mockResolvedValue({
        id: supportRoleId,
        userId: 'support-user-1',
        type: 'SUPPORT',
        color: null,
        tierLimitOverride: null,
        stripeSubscriptionId: null,
        stripeCustomerId: null,
        tier: 'FREE',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      // Mock no existing connection
      prismaMock.personSharingConnection.findFirst.mockResolvedValue(null);

      await expect(
        claimPersonSharingInvite({
          inviteCode,
          claimingRoleId: supportRoleId,
          claimingUserId: 'support-user-1',
        })
      ).rejects.toThrow('Teacher student cards can only be shared with other teachers');
    });

    it('should prevent claiming invite for account owner person', async () => {
      const parentRoleId = 'parent-role-1';
      const anotherParentRoleId = 'parent-role-2';
      const accountOwnerPersonId = 'account-owner-person-1';
      const inviteCode = 'test-invite-code-5';

      // Mock invite validation
      prismaMock.personSharingInvite.findUnique.mockResolvedValue({
        id: 'invite-5',
        inviteCode: inviteCode,
        ownerRoleId: parentRoleId,
        ownerPersonId: accountOwnerPersonId,
        shareType: 'PERSON',
        permissions: 'VIEW',
        contextData: null,
        expiresAt: new Date(Date.now() + 1000000),
        maxUses: null,
        useCount: 0,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        ownerRole: {
          id: parentRoleId,
          userId: 'user-1',
          type: 'PARENT',
          color: null,
          tierLimitOverride: null,
          stripeSubscriptionId: null,
          stripeCustomerId: null,
          tier: 'FREE',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          user: { name: 'Parent User', image: null },
        } as any,
        ownerPerson: {
          id: accountOwnerPersonId,
          name: 'Me',
          avatar: null,
        },
      });

      // Mock person lookup - account owner
      prismaMock.person.findUnique.mockResolvedValue({
        id: accountOwnerPersonId,
        roleId: parentRoleId,
        name: 'Me',
        isAccountOwner: true,
        avatar: null,
        birthdate: null,
        notes: null,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      // Mock another parent role lookup
      prismaMock.role.findUnique.mockResolvedValue({
        id: anotherParentRoleId,
        userId: 'user-2',
        type: 'PARENT',
        color: null,
        tierLimitOverride: null,
        stripeSubscriptionId: null,
        stripeCustomerId: null,
        tier: 'FREE',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      // Mock no existing connection
      prismaMock.personSharingConnection.findFirst.mockResolvedValue(null);

      await expect(
        claimPersonSharingInvite({
          inviteCode,
          claimingRoleId: anotherParentRoleId,
          claimingUserId: 'user-2',
        })
      ).rejects.toThrow('Account owner persons cannot be shared via person sharing codes');
    });
  });
});
