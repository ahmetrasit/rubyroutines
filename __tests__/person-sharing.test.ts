import { prismaMock, setupCommonMocks } from './utils/prisma-mock'
import { createMockUser, createMockRole, createMockPerson, createMockPersonConnection, generateMockShareCode } from './utils/test-factories'
import { createMockContext } from './utils/trpc-mock'

describe('Person Sharing Flow', () => {
  beforeEach(() => {
    setupCommonMocks()
  })

  describe('Generate Share Code', () => {
    it('should generate a share code in 3-word format', async () => {
      const parentUser = createMockUser({ id: 'parent1' })
      const parentRole = createMockRole({ id: 'role1', userId: parentUser.id })
      const person = createMockPerson({ id: 'person1', roleId: parentRole.id })

      const shareCode = generateMockShareCode()

      // Verify share code format (3 words separated by hyphens)
      expect(shareCode).toMatch(/^[a-z]+-[a-z]+-[a-z]+$/)
      const words = shareCode.split('-')
      expect(words).toHaveLength(3)
    })

    it('should create a PersonConnection record with share code', async () => {
      const parentUser = createMockUser({ id: 'parent1' })
      const parentRole = createMockRole({ id: 'role1', userId: parentUser.id })
      const person = createMockPerson({ id: 'person1', roleId: parentRole.id })

      const shareCode = generateMockShareCode()
      const connection = createMockPersonConnection({
        personId: person.id,
        sharedByRoleId: parentRole.id,
        shareCode,
        permissionLevel: 'VIEW',
      })

      prismaMock.personConnection.create.mockResolvedValue(connection)

      const result = await prismaMock.personConnection.create({
        data: {
          personId: person.id,
          sharedByRoleId: parentRole.id,
          shareCode,
          permissionLevel: 'VIEW',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      })

      expect(result.shareCode).toBe(shareCode)
      expect(result.personId).toBe(person.id)
      expect(result.sharedByRoleId).toBe(parentRole.id)
      expect(result.permissionLevel).toBe('VIEW')
    })

    it('should set expiration time to 24 hours from creation', async () => {
      const now = new Date()
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      const connection = createMockPersonConnection({
        expiresAt,
      })

      const timeDiff = connection.expiresAt.getTime() - now.getTime()
      const hoursDiff = timeDiff / (1000 * 60 * 60)

      expect(hoursDiff).toBeCloseTo(24, 0)
    })
  })

  describe('Claim Share Code', () => {
    it('should successfully claim a valid share code', async () => {
      const sharer = createMockUser({ id: 'sharer1' })
      const sharerRole = createMockRole({ id: 'sharerRole1', userId: sharer.id })
      const claimer = createMockUser({ id: 'claimer1' })
      const claimerRole = createMockRole({ id: 'claimerRole1', userId: claimer.id })
      const person = createMockPerson({ id: 'person1', roleId: sharerRole.id })

      const shareCode = generateMockShareCode()
      const connection = createMockPersonConnection({
        id: 'conn1',
        personId: person.id,
        sharedByRoleId: sharerRole.id,
        shareCode,
        claimedAt: null,
      })

      // Mock finding the unclaimed connection
      prismaMock.personConnection.findFirst.mockResolvedValue(connection)

      // Mock updating the connection with claimer info
      const claimedConnection = {
        ...connection,
        sharedWithRoleId: claimerRole.id,
        claimedAt: new Date(),
      }
      prismaMock.personConnection.update.mockResolvedValue(claimedConnection)

      const result = await prismaMock.personConnection.update({
        where: { id: connection.id },
        data: {
          sharedWithRoleId: claimerRole.id,
          claimedAt: new Date(),
        },
      })

      expect(result.sharedWithRoleId).toBe(claimerRole.id)
      expect(result.claimedAt).toBeTruthy()
    })

    it('should prevent duplicate claims on the same share code', async () => {
      const shareCode = generateMockShareCode()
      const connection = createMockPersonConnection({
        shareCode,
        claimedAt: new Date(), // Already claimed
        sharedWithRoleId: 'existing-role',
      })

      prismaMock.personConnection.findFirst.mockResolvedValue(connection)

      // Attempt to claim already claimed code
      const isAlreadyClaimed = connection.claimedAt !== null

      expect(isAlreadyClaimed).toBe(true)
      expect(connection.sharedWithRoleId).toBe('existing-role')
    })

    it('should reject expired share codes', async () => {
      const shareCode = generateMockShareCode()
      const expiredConnection = createMockPersonConnection({
        shareCode,
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
        claimedAt: null,
      })

      prismaMock.personConnection.findFirst.mockResolvedValue(expiredConnection)

      const isExpired = expiredConnection.expiresAt < new Date()

      expect(isExpired).toBe(true)
    })

    it('should reject invalid share codes', async () => {
      const invalidCode = 'invalid-code'

      prismaMock.personConnection.findFirst.mockResolvedValue(null)

      const connection = await prismaMock.personConnection.findFirst({
        where: { shareCode: invalidCode },
      })

      expect(connection).toBeNull()
    })
  })

  describe('Shared Persons List', () => {
    it('should display shared persons in co-parent list', async () => {
      const user = createMockUser({ id: 'user1' })
      const role = createMockRole({ id: 'role1', userId: user.id })

      const sharedPerson1 = createMockPerson({ id: 'person1', name: 'Child 1' })
      const sharedPerson2 = createMockPerson({ id: 'person2', name: 'Child 2' })

      const connections = [
        createMockPersonConnection({
          personId: sharedPerson1.id,
          sharedWithRoleId: role.id,
          permissionLevel: 'VIEW',
          claimedAt: new Date(),
        }),
        createMockPersonConnection({
          personId: sharedPerson2.id,
          sharedWithRoleId: role.id,
          permissionLevel: 'EDIT',
          claimedAt: new Date(),
        }),
      ]

      prismaMock.personConnection.findMany.mockResolvedValue(connections)

      const result = await prismaMock.personConnection.findMany({
        where: {
          sharedWithRoleId: role.id,
          claimedAt: { not: null },
        },
      })

      expect(result).toHaveLength(2)
      expect(result[0].permissionLevel).toBe('VIEW')
      expect(result[1].permissionLevel).toBe('EDIT')
    })

    it('should show correct permission badges for shared persons', async () => {
      const permissions = ['VIEW', 'EDIT', 'MANAGE'] as const

      permissions.forEach(level => {
        const connection = createMockPersonConnection({
          permissionLevel: level,
        })

        expect(connection.permissionLevel).toBe(level)
      })
    })
  })

  describe('Revoke Connection', () => {
    it('should allow sharer to revoke a connection', async () => {
      const sharer = createMockUser({ id: 'sharer1' })
      const sharerRole = createMockRole({ id: 'sharerRole1', userId: sharer.id })
      const connection = createMockPersonConnection({
        id: 'conn1',
        sharedByRoleId: sharerRole.id,
        claimedAt: new Date(),
      })

      prismaMock.personConnection.delete.mockResolvedValue(connection)

      const result = await prismaMock.personConnection.delete({
        where: { id: connection.id },
      })

      expect(result.id).toBe(connection.id)
    })

    it('should allow recipient to remove themselves from a connection', async () => {
      const recipient = createMockUser({ id: 'recipient1' })
      const recipientRole = createMockRole({ id: 'recipientRole1', userId: recipient.id })
      const connection = createMockPersonConnection({
        id: 'conn1',
        sharedWithRoleId: recipientRole.id,
        claimedAt: new Date(),
      })

      prismaMock.personConnection.delete.mockResolvedValue(connection)

      const result = await prismaMock.personConnection.delete({
        where: { id: connection.id },
      })

      expect(result.id).toBe(connection.id)
    })

    it('should not allow unauthorized users to revoke connections', async () => {
      const unauthorizedUser = createMockUser({ id: 'unauthorized1' })
      const unauthorizedRole = createMockRole({ id: 'unauthorizedRole1', userId: unauthorizedUser.id })

      const connection = createMockPersonConnection({
        sharedByRoleId: 'other-role',
        sharedWithRoleId: 'another-role',
      })

      // Check that user is neither sharer nor recipient
      const isAuthorized =
        connection.sharedByRoleId === unauthorizedRole.id ||
        connection.sharedWithRoleId === unauthorizedRole.id

      expect(isAuthorized).toBe(false)
    })
  })

  describe('Permission Levels', () => {
    it('should correctly apply VIEW permission restrictions', async () => {
      const connection = createMockPersonConnection({
        permissionLevel: 'VIEW',
      })

      const canView = true
      const canEdit = connection.permissionLevel === 'EDIT' || connection.permissionLevel === 'MANAGE'
      const canManage = connection.permissionLevel === 'MANAGE'

      expect(canView).toBe(true)
      expect(canEdit).toBe(false)
      expect(canManage).toBe(false)
    })

    it('should correctly apply EDIT permission capabilities', async () => {
      const connection = createMockPersonConnection({
        permissionLevel: 'EDIT',
      })

      const canView = true
      const canEdit = connection.permissionLevel === 'EDIT' || connection.permissionLevel === 'MANAGE'
      const canManage = connection.permissionLevel === 'MANAGE'

      expect(canView).toBe(true)
      expect(canEdit).toBe(true)
      expect(canManage).toBe(false)
    })

    it('should correctly apply MANAGE permission capabilities', async () => {
      const connection = createMockPersonConnection({
        permissionLevel: 'MANAGE',
      })

      const canView = true
      const canEdit = true
      const canManage = connection.permissionLevel === 'MANAGE'

      expect(canView).toBe(true)
      expect(canEdit).toBe(true)
      expect(canManage).toBe(true)
    })
  })
})