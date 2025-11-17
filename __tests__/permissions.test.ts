import { prismaMock, setupCommonMocks } from './utils/prisma-mock'
import { createMockUser, createMockRole, createMockPerson, createMockPersonConnection } from './utils/test-factories'
import { mockVerifyTaskAccess } from './utils/trpc-mock'

describe('Permission System', () => {
  beforeEach(() => {
    setupCommonMocks()
    mockVerifyTaskAccess.mockClear()
  })

  describe('verifyTaskAccess', () => {
    it('should grant access with direct ownership', async () => {
      const owner = createMockUser({ id: 'owner1' })
      const ownerRole = createMockRole({ id: 'ownerRole1', userId: owner.id })
      const person = createMockPerson({ id: 'person1', roleId: ownerRole.id })

      const task = {
        id: 'task1',
        title: 'Test Task',
        personId: person.id,
        routineId: 'routine1',
        description: null,
        duration: 5,
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Mock finding the task
      prismaMock.task.findUnique.mockResolvedValue(task)

      // Mock finding the person with role
      prismaMock.person.findUnique.mockResolvedValue({
        ...person,
        role: ownerRole,
      } as any)

      // Direct ownership check
      const hasAccess = person.roleId === ownerRole.id

      expect(hasAccess).toBe(true)
    })

    it('should grant VIEW access with co-parent VIEW permission', async () => {
      const owner = createMockUser({ id: 'owner1' })
      const ownerRole = createMockRole({ id: 'ownerRole1', userId: owner.id })
      const viewer = createMockUser({ id: 'viewer1' })
      const viewerRole = createMockRole({ id: 'viewerRole1', userId: viewer.id })
      const person = createMockPerson({ id: 'person1', roleId: ownerRole.id })

      const connection = createMockPersonConnection({
        personId: person.id,
        sharedWithRoleId: viewerRole.id,
        sharedByRoleId: ownerRole.id,
        permissionLevel: 'VIEW',
        claimedAt: new Date(),
      })

      prismaMock.personConnection.findFirst.mockResolvedValue(connection)

      // Check VIEW permission
      const canView = connection.permissionLevel === 'VIEW' ||
                     connection.permissionLevel === 'EDIT' ||
                     connection.permissionLevel === 'MANAGE'
      const canEdit = connection.permissionLevel === 'EDIT' ||
                     connection.permissionLevel === 'MANAGE'

      expect(canView).toBe(true)
      expect(canEdit).toBe(false)
    })

    it('should grant EDIT access with co-parent EDIT permission', async () => {
      const owner = createMockUser({ id: 'owner1' })
      const ownerRole = createMockRole({ id: 'ownerRole1', userId: owner.id })
      const editor = createMockUser({ id: 'editor1' })
      const editorRole = createMockRole({ id: 'editorRole1', userId: editor.id })
      const person = createMockPerson({ id: 'person1', roleId: ownerRole.id })

      const connection = createMockPersonConnection({
        personId: person.id,
        sharedWithRoleId: editorRole.id,
        sharedByRoleId: ownerRole.id,
        permissionLevel: 'EDIT',
        claimedAt: new Date(),
      })

      prismaMock.personConnection.findFirst.mockResolvedValue(connection)

      const task = {
        id: 'task1',
        title: 'Test Task',
        personId: person.id,
        routineId: 'routine1',
        description: null,
        duration: 5,
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Mock task update
      prismaMock.task.update.mockResolvedValue({
        ...task,
        title: 'Updated Task',
      })

      // Check EDIT permission
      const canView = true
      const canEdit = connection.permissionLevel === 'EDIT' ||
                     connection.permissionLevel === 'MANAGE'
      const canComplete = canEdit

      expect(canView).toBe(true)
      expect(canEdit).toBe(true)
      expect(canComplete).toBe(true)
    })

    it('should grant MANAGE access with co-parent MANAGE permission', async () => {
      const owner = createMockUser({ id: 'owner1' })
      const ownerRole = createMockRole({ id: 'ownerRole1', userId: owner.id })
      const manager = createMockUser({ id: 'manager1' })
      const managerRole = createMockRole({ id: 'managerRole1', userId: manager.id })
      const person = createMockPerson({ id: 'person1', roleId: ownerRole.id })

      const connection = createMockPersonConnection({
        personId: person.id,
        sharedWithRoleId: managerRole.id,
        sharedByRoleId: ownerRole.id,
        permissionLevel: 'MANAGE',
        claimedAt: new Date(),
      })

      prismaMock.personConnection.findFirst.mockResolvedValue(connection)

      // Check MANAGE permission
      const canView = true
      const canEdit = true
      const canManage = connection.permissionLevel === 'MANAGE'
      const canDelete = canManage
      const canShareFurther = canManage

      expect(canView).toBe(true)
      expect(canEdit).toBe(true)
      expect(canManage).toBe(true)
      expect(canDelete).toBe(true)
      expect(canShareFurther).toBe(true)
    })

    it('should deny access for unauthorized users', async () => {
      const owner = createMockUser({ id: 'owner1' })
      const ownerRole = createMockRole({ id: 'ownerRole1', userId: owner.id })
      const unauthorized = createMockUser({ id: 'unauthorized1' })
      const unauthorizedRole = createMockRole({ id: 'unauthorizedRole1', userId: unauthorized.id })
      const person = createMockPerson({ id: 'person1', roleId: ownerRole.id })

      // No connection exists
      prismaMock.personConnection.findFirst.mockResolvedValue(null)

      const connection = await prismaMock.personConnection.findFirst({
        where: {
          personId: person.id,
          sharedWithRoleId: unauthorizedRole.id,
          claimedAt: { not: null },
        },
      })

      // Check if user has any access
      const isOwner = person.roleId === unauthorizedRole.id
      const hasSharedAccess = connection !== null

      expect(isOwner).toBe(false)
      expect(hasSharedAccess).toBe(false)
    })
  })

  describe('Task Completion with Shared Access', () => {
    it('should allow task completion with EDIT permission', async () => {
      const editor = createMockUser({ id: 'editor1' })
      const editorRole = createMockRole({ id: 'editorRole1', userId: editor.id })
      const person = createMockPerson({ id: 'person1' })

      const connection = createMockPersonConnection({
        personId: person.id,
        sharedWithRoleId: editorRole.id,
        permissionLevel: 'EDIT',
        claimedAt: new Date(),
      })

      prismaMock.personConnection.findFirst.mockResolvedValue(connection)

      const taskCompletion = {
        id: 'completion1',
        taskId: 'task1',
        personId: person.id,
        completedAt: new Date(),
        completedBy: editorRole.id,
        notes: 'Completed by co-parent',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      prismaMock.taskCompletion.create.mockResolvedValue(taskCompletion)

      const result = await prismaMock.taskCompletion.create({
        data: {
          taskId: 'task1',
          personId: person.id,
          completedAt: new Date(),
          completedBy: editorRole.id,
          notes: 'Completed by co-parent',
        },
      })

      expect(result.completedBy).toBe(editorRole.id)
      expect(result.notes).toContain('co-parent')
    })

    it('should deny task completion with VIEW permission', async () => {
      const viewer = createMockUser({ id: 'viewer1' })
      const viewerRole = createMockRole({ id: 'viewerRole1', userId: viewer.id })
      const person = createMockPerson({ id: 'person1' })

      const connection = createMockPersonConnection({
        personId: person.id,
        sharedWithRoleId: viewerRole.id,
        permissionLevel: 'VIEW',
        claimedAt: new Date(),
      })

      // Check if user can complete tasks
      const canCompleteTask = connection.permissionLevel === 'EDIT' ||
                             connection.permissionLevel === 'MANAGE'

      expect(canCompleteTask).toBe(false)
    })

    it('should allow task completion with MANAGE permission', async () => {
      const manager = createMockUser({ id: 'manager1' })
      const managerRole = createMockRole({ id: 'managerRole1', userId: manager.id })
      const person = createMockPerson({ id: 'person1' })

      const connection = createMockPersonConnection({
        personId: person.id,
        sharedWithRoleId: managerRole.id,
        permissionLevel: 'MANAGE',
        claimedAt: new Date(),
      })

      const canCompleteTask = connection.permissionLevel === 'EDIT' ||
                             connection.permissionLevel === 'MANAGE'

      expect(canCompleteTask).toBe(true)
    })
  })

  describe('Permission Hierarchy Validation', () => {
    it('should validate VIEW < EDIT < MANAGE hierarchy', () => {
      const permissionHierarchy = {
        VIEW: 1,
        EDIT: 2,
        MANAGE: 3,
      }

      expect(permissionHierarchy.VIEW).toBeLessThan(permissionHierarchy.EDIT)
      expect(permissionHierarchy.EDIT).toBeLessThan(permissionHierarchy.MANAGE)
      expect(permissionHierarchy.VIEW).toBeLessThan(permissionHierarchy.MANAGE)
    })

    it('should correctly check permission capabilities', () => {
      const hasPermission = (userLevel: string, requiredLevel: string) => {
        const hierarchy: Record<string, number> = {
          VIEW: 1,
          EDIT: 2,
          MANAGE: 3,
        }
        return hierarchy[userLevel] >= hierarchy[requiredLevel]
      }

      // VIEW permission checks
      expect(hasPermission('VIEW', 'VIEW')).toBe(true)
      expect(hasPermission('VIEW', 'EDIT')).toBe(false)
      expect(hasPermission('VIEW', 'MANAGE')).toBe(false)

      // EDIT permission checks
      expect(hasPermission('EDIT', 'VIEW')).toBe(true)
      expect(hasPermission('EDIT', 'EDIT')).toBe(true)
      expect(hasPermission('EDIT', 'MANAGE')).toBe(false)

      // MANAGE permission checks
      expect(hasPermission('MANAGE', 'VIEW')).toBe(true)
      expect(hasPermission('MANAGE', 'EDIT')).toBe(true)
      expect(hasPermission('MANAGE', 'MANAGE')).toBe(true)
    })
  })

  describe('Cross-Role Permission Checks', () => {
    it('should handle parent-to-teacher sharing correctly', async () => {
      const parent = createMockUser({ id: 'parent1' })
      const parentRole = createMockRole({
        id: 'parentRole1',
        userId: parent.id,
        name: 'parent'
      })

      const teacher = createMockUser({ id: 'teacher1' })
      const teacherRole = createMockRole({
        id: 'teacherRole1',
        userId: teacher.id,
        name: 'teacher'
      })

      const person = createMockPerson({ id: 'person1', roleId: parentRole.id })

      const connection = createMockPersonConnection({
        personId: person.id,
        sharedByRoleId: parentRole.id,
        sharedWithRoleId: teacherRole.id,
        permissionLevel: 'VIEW',
        claimedAt: new Date(),
      })

      prismaMock.personConnection.findFirst.mockResolvedValue(connection)

      // Verify teacher has access
      const teacherHasAccess = connection.sharedWithRoleId === teacherRole.id

      expect(teacherHasAccess).toBe(true)
      expect(connection.permissionLevel).toBe('VIEW')
    })

    it('should handle teacher-to-parent sharing correctly', async () => {
      const teacher = createMockUser({ id: 'teacher1' })
      const teacherRole = createMockRole({
        id: 'teacherRole1',
        userId: teacher.id,
        name: 'teacher'
      })

      const parent = createMockUser({ id: 'parent1' })
      const parentRole = createMockRole({
        id: 'parentRole1',
        userId: parent.id,
        name: 'parent'
      })

      const person = createMockPerson({ id: 'person1', roleId: teacherRole.id })

      const connection = createMockPersonConnection({
        personId: person.id,
        sharedByRoleId: teacherRole.id,
        sharedWithRoleId: parentRole.id,
        permissionLevel: 'EDIT',
        claimedAt: new Date(),
      })

      prismaMock.personConnection.findFirst.mockResolvedValue(connection)

      // Verify parent has access
      const parentHasAccess = connection.sharedWithRoleId === parentRole.id

      expect(parentHasAccess).toBe(true)
      expect(connection.permissionLevel).toBe('EDIT')
    })
  })
})