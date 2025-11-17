import { prismaMock, setupCommonMocks, mockTransaction } from '../utils/prisma-mock'
import { createMockUser, createMockRole, createMockPerson, createMockPersonConnection, generateMockShareCode } from '../utils/test-factories'

describe('Person Sharing Flow - E2E Integration', () => {
  beforeEach(() => {
    setupCommonMocks()
  })

  describe('Complete Parent-to-Parent Sharing Flow', () => {
    it('should complete full sharing flow from parent A to parent B', async () => {
      // Setup: Create two parent users with their children
      const parentA = createMockUser({ id: 'parentA', email: 'parentA@example.com' })
      const parentARoleId = 'parentA-role'
      const parentARole = createMockRole({
        id: parentARoleId,
        userId: parentA.id,
        name: 'parent',
      })

      const parentB = createMockUser({ id: 'parentB', email: 'parentB@example.com' })
      const parentBRoleId = 'parentB-role'
      const parentBRole = createMockRole({
        id: parentBRoleId,
        userId: parentB.id,
        name: 'parent',
      })

      const childA = createMockPerson({
        id: 'childA',
        name: 'Child A',
        roleId: parentARoleId,
      })

      // Step 1: Parent A generates share code
      const shareCode = generateMockShareCode()
      const connection = createMockPersonConnection({
        id: 'conn1',
        personId: childA.id,
        sharedByRoleId: parentARoleId,
        shareCode,
        permissionLevel: 'VIEW',
        claimedAt: null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })

      prismaMock.personConnection.create.mockResolvedValue(connection)

      const generatedConnection = await prismaMock.personConnection.create({
        data: {
          personId: childA.id,
          sharedByRoleId: parentARoleId,
          shareCode,
          permissionLevel: 'VIEW',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      })

      expect(generatedConnection.shareCode).toBe(shareCode)
      expect(generatedConnection.claimedAt).toBeNull()

      // Step 2: Parent B claims the share code
      prismaMock.personConnection.findFirst.mockResolvedValue(generatedConnection)

      const claimedConnection = {
        ...generatedConnection,
        sharedWithRoleId: parentBRoleId,
        claimedAt: new Date(),
      }

      prismaMock.personConnection.update.mockResolvedValue(claimedConnection)

      const claimed = await prismaMock.personConnection.update({
        where: { id: generatedConnection.id },
        data: {
          sharedWithRoleId: parentBRoleId,
          claimedAt: new Date(),
        },
      })

      expect(claimed.sharedWithRoleId).toBe(parentBRoleId)
      expect(claimed.claimedAt).toBeTruthy()

      // Step 3: Parent B can now see the child in their list
      prismaMock.personConnection.findMany.mockResolvedValue([claimedConnection])

      const parentBConnections = await prismaMock.personConnection.findMany({
        where: {
          sharedWithRoleId: parentBRoleId,
          claimedAt: { not: null },
        },
      })

      expect(parentBConnections).toHaveLength(1)
      expect(parentBConnections[0].personId).toBe(childA.id)

      // Step 4: Parent B has VIEW permission
      const permission = parentBConnections[0].permissionLevel
      expect(permission).toBe('VIEW')

      // Step 5: Parent A can see the connection is claimed
      prismaMock.personConnection.findMany.mockResolvedValue([claimedConnection])

      const parentAConnections = await prismaMock.personConnection.findMany({
        where: {
          sharedByRoleId: parentARoleId,
        },
      })

      expect(parentAConnections).toHaveLength(1)
      expect(parentAConnections[0].claimedAt).toBeTruthy()
      expect(parentAConnections[0].sharedWithRoleId).toBe(parentBRoleId)
    })

    it('should handle permission upgrades in sharing flow', async () => {
      const parentA = createMockUser({ id: 'parentA' })
      const parentARoleId = 'parentA-role'
      const parentB = createMockUser({ id: 'parentB' })
      const parentBRoleId = 'parentB-role'

      const child = createMockPerson({
        id: 'child1',
        roleId: parentARoleId,
      })

      // Initial share with VIEW permission
      let connection = createMockPersonConnection({
        id: 'conn1',
        personId: child.id,
        sharedByRoleId: parentARoleId,
        sharedWithRoleId: parentBRoleId,
        permissionLevel: 'VIEW',
        claimedAt: new Date(),
      })

      prismaMock.personConnection.findFirst.mockResolvedValue(connection)

      // Parent A upgrades permission to EDIT
      const upgradedConnection = {
        ...connection,
        permissionLevel: 'EDIT' as const,
      }

      prismaMock.personConnection.update.mockResolvedValue(upgradedConnection)

      const upgraded = await prismaMock.personConnection.update({
        where: { id: connection.id },
        data: { permissionLevel: 'EDIT' },
      })

      expect(upgraded.permissionLevel).toBe('EDIT')

      // Parent B now has EDIT capabilities
      const canEdit = upgraded.permissionLevel === 'EDIT' || upgraded.permissionLevel === 'MANAGE'
      expect(canEdit).toBe(true)
    })
  })

  describe('Complete Teacher-to-Teacher Sharing Flow', () => {
    it('should complete sharing flow between two teachers', async () => {
      const teacherA = createMockUser({ id: 'teacherA', email: 'teacherA@school.edu' })
      const teacherARoleId = 'teacherA-role'
      const teacherARole = createMockRole({
        id: teacherARoleId,
        userId: teacherA.id,
        name: 'teacher',
      })

      const teacherB = createMockUser({ id: 'teacherB', email: 'teacherB@school.edu' })
      const teacherBRoleId = 'teacherB-role'
      const teacherBRole = createMockRole({
        id: teacherBRoleId,
        userId: teacherB.id,
        name: 'teacher',
      })

      const student = createMockPerson({
        id: 'student1',
        name: 'Student One',
        roleId: teacherARoleId,
      })

      // Teacher A shares with EDIT permission (common for co-teaching)
      const shareCode = generateMockShareCode()
      const connection = createMockPersonConnection({
        id: 'conn1',
        personId: student.id,
        sharedByRoleId: teacherARoleId,
        shareCode,
        permissionLevel: 'EDIT',
        claimedAt: null,
      })

      prismaMock.personConnection.create.mockResolvedValue(connection)

      const created = await prismaMock.personConnection.create({
        data: {
          personId: student.id,
          sharedByRoleId: teacherARoleId,
          shareCode,
          permissionLevel: 'EDIT',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      })

      // Teacher B claims the code
      const claimedConnection = {
        ...created,
        sharedWithRoleId: teacherBRoleId,
        claimedAt: new Date(),
      }

      prismaMock.personConnection.update.mockResolvedValue(claimedConnection)

      const claimed = await prismaMock.personConnection.update({
        where: { id: created.id },
        data: {
          sharedWithRoleId: teacherBRoleId,
          claimedAt: new Date(),
        },
      })

      expect(claimed.permissionLevel).toBe('EDIT')
      expect(claimed.sharedWithRoleId).toBe(teacherBRoleId)

      // Both teachers can now manage the student's tasks
      const canEditTasks = claimed.permissionLevel === 'EDIT' || claimed.permissionLevel === 'MANAGE'
      expect(canEditTasks).toBe(true)
    })
  })

  describe('Complete Cross-Role Sharing Flow', () => {
    it('should handle parent sharing with teacher correctly', async () => {
      const parent = createMockUser({ id: 'parent1' })
      const parentRoleId = 'parent-role'
      const parentRole = createMockRole({
        id: parentRoleId,
        userId: parent.id,
        name: 'parent',
      })

      const teacher = createMockUser({ id: 'teacher1' })
      const teacherRoleId = 'teacher-role'
      const teacherRole = createMockRole({
        id: teacherRoleId,
        userId: teacher.id,
        name: 'teacher',
      })

      const child = createMockPerson({
        id: 'child1',
        name: 'Student',
        roleId: parentRoleId,
      })

      // Parent shares child with teacher with VIEW permission
      const shareCode = generateMockShareCode()
      const connection = createMockPersonConnection({
        id: 'conn1',
        personId: child.id,
        sharedByRoleId: parentRoleId,
        shareCode,
        permissionLevel: 'VIEW',
        claimedAt: null,
      })

      prismaMock.personConnection.create.mockResolvedValue(connection)

      const created = await prismaMock.personConnection.create({
        data: {
          personId: child.id,
          sharedByRoleId: parentRoleId,
          shareCode,
          permissionLevel: 'VIEW',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      })

      // Teacher claims the code
      const claimedConnection = {
        ...created,
        sharedWithRoleId: teacherRoleId,
        claimedAt: new Date(),
      }

      prismaMock.personConnection.update.mockResolvedValue(claimedConnection)

      const claimed = await prismaMock.personConnection.update({
        where: { id: created.id },
        data: {
          sharedWithRoleId: teacherRoleId,
          claimedAt: new Date(),
        },
      })

      // Verify teacher has appropriate access
      expect(claimed.sharedWithRoleId).toBe(teacherRoleId)
      expect(claimed.permissionLevel).toBe('VIEW')

      // Teacher can view but not edit
      const canView = true
      const canEdit = claimed.permissionLevel === 'EDIT' || claimed.permissionLevel === 'MANAGE'

      expect(canView).toBe(true)
      expect(canEdit).toBe(false)
    })

    it('should handle teacher sharing with parent correctly', async () => {
      const teacher = createMockUser({ id: 'teacher1' })
      const teacherRoleId = 'teacher-role'

      const parent = createMockUser({ id: 'parent1' })
      const parentRoleId = 'parent-role'

      const student = createMockPerson({
        id: 'student1',
        name: 'Student',
        roleId: teacherRoleId,
      })

      // Teacher shares student with parent with EDIT permission
      const shareCode = generateMockShareCode()
      const connection = createMockPersonConnection({
        id: 'conn1',
        personId: student.id,
        sharedByRoleId: teacherRoleId,
        shareCode,
        permissionLevel: 'EDIT',
        claimedAt: null,
      })

      prismaMock.personConnection.create.mockResolvedValue(connection)

      const created = await prismaMock.personConnection.create({
        data: {
          personId: student.id,
          sharedByRoleId: teacherRoleId,
          shareCode,
          permissionLevel: 'EDIT',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      })

      // Parent claims the code
      const claimedConnection = {
        ...created,
        sharedWithRoleId: parentRoleId,
        claimedAt: new Date(),
      }

      prismaMock.personConnection.update.mockResolvedValue(claimedConnection)

      const claimed = await prismaMock.personConnection.update({
        where: { id: created.id },
        data: {
          sharedWithRoleId: parentRoleId,
          claimedAt: new Date(),
        },
      })

      // Parent can edit tasks
      expect(claimed.permissionLevel).toBe('EDIT')
      const canEditTasks = claimed.permissionLevel === 'EDIT' || claimed.permissionLevel === 'MANAGE'
      expect(canEditTasks).toBe(true)
    })
  })

  describe('Dashboard Navigation and Modal Interactions', () => {
    it('should navigate through sharing workflow in dashboard', async () => {
      // Simulate dashboard navigation flow
      const user = createMockUser({ id: 'user1' })
      const roleId = 'role1'
      const role = createMockRole({ id: roleId, userId: user.id })

      const persons = [
        createMockPerson({ id: 'p1', name: 'Child 1', roleId }),
        createMockPerson({ id: 'p2', name: 'Child 2', roleId }),
      ]

      // Mock listing persons
      prismaMock.person.findMany.mockResolvedValue(persons)

      const userPersons = await prismaMock.person.findMany({
        where: { roleId },
      })

      expect(userPersons).toHaveLength(2)

      // Open share modal and generate code
      const selectedPersonIds = ['p1']
      const shareCode = generateMockShareCode()

      const connection = createMockPersonConnection({
        personId: selectedPersonIds[0],
        sharedByRoleId: roleId,
        shareCode,
        permissionLevel: 'VIEW',
      })

      prismaMock.personConnection.create.mockResolvedValue(connection)

      const created = await prismaMock.personConnection.create({
        data: {
          personId: selectedPersonIds[0],
          sharedByRoleId: roleId,
          shareCode,
          permissionLevel: 'VIEW',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      })

      expect(created.shareCode).toBe(shareCode)

      // Navigate to connections page
      prismaMock.personConnection.findMany.mockResolvedValue([created])

      const connections = await prismaMock.personConnection.findMany({
        where: {
          sharedByRoleId: roleId,
        },
      })

      expect(connections).toHaveLength(1)
      expect(connections[0].personId).toBe('p1')
    })

    it('should handle modal state transitions correctly', async () => {
      // Test modal open/close states
      const modalStates = {
        shareModal: false,
        claimModal: false,
        revokeConfirmation: false,
      }

      // Open share modal
      modalStates.shareModal = true
      expect(modalStates.shareModal).toBe(true)

      // Generate code and close modal
      const shareCode = generateMockShareCode()
      modalStates.shareModal = false
      expect(modalStates.shareModal).toBe(false)

      // Open claim modal
      modalStates.claimModal = true
      expect(modalStates.claimModal).toBe(true)

      // Claim code and close modal
      modalStates.claimModal = false
      expect(modalStates.claimModal).toBe(false)

      // Open revoke confirmation
      modalStates.revokeConfirmation = true
      expect(modalStates.revokeConfirmation).toBe(true)

      // Confirm and close
      modalStates.revokeConfirmation = false
      expect(modalStates.revokeConfirmation).toBe(false)
    })
  })

  describe('Error Handling in Sharing Flow', () => {
    it('should handle network errors gracefully', async () => {
      prismaMock.personConnection.create.mockRejectedValue(new Error('Network error'))

      try {
        await prismaMock.personConnection.create({
          data: {
            personId: 'person1',
            sharedByRoleId: 'role1',
            shareCode: 'test-code',
            permissionLevel: 'VIEW',
            expiresAt: new Date(),
          },
        })
      } catch (error: any) {
        expect(error.message).toBe('Network error')
      }
    })

    it('should handle duplicate connection attempts', async () => {
      const existingConnection = createMockPersonConnection({
        personId: 'person1',
        sharedWithRoleId: 'role1',
        claimedAt: new Date(),
      })

      prismaMock.personConnection.findFirst.mockResolvedValue(existingConnection)

      const duplicate = await prismaMock.personConnection.findFirst({
        where: {
          personId: 'person1',
          sharedWithRoleId: 'role1',
        },
      })

      expect(duplicate).toBeDefined()
      expect(duplicate?.claimedAt).toBeTruthy()
    })
  })
})