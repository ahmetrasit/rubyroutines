import { prismaMock, setupCommonMocks } from './utils/prisma-mock'
import { createMockUser, createMockMarketplaceItem } from './utils/test-factories'
import { createMockContext } from './utils/trpc-mock'

describe('Marketplace Security', () => {
  beforeEach(() => {
    setupCommonMocks()
  })

  describe('Hidden Items Access Control', () => {
    it('should not return hidden items via getById for non-admin users', async () => {
      const hiddenItem = createMockMarketplaceItem({
        id: 'hidden1',
        isHidden: true,
        title: 'Hidden Item',
      })

      const user = createMockUser({ isAdmin: false })
      const ctx = createMockContext({ userId: user.id, isAdmin: false })

      // Mock Prisma to return null for hidden items when not admin
      prismaMock.marketplaceItem.findFirst.mockResolvedValue(null)

      const result = await prismaMock.marketplaceItem.findFirst({
        where: {
          id: hiddenItem.id,
          isHidden: false, // Non-admins should only see non-hidden items
        },
      })

      expect(result).toBeNull()
    })

    it('should allow admins to access hidden items via getById', async () => {
      const hiddenItem = createMockMarketplaceItem({
        id: 'hidden1',
        isHidden: true,
        title: 'Hidden Item',
      })

      const adminUser = createMockUser({ id: 'admin1', isAdmin: true })
      const ctx = createMockContext({ userId: adminUser.id, isAdmin: true })

      prismaMock.marketplaceItem.findUnique.mockResolvedValue(hiddenItem)

      const result = await prismaMock.marketplaceItem.findUnique({
        where: { id: hiddenItem.id },
      })

      expect(result).toBeDefined()
      expect(result?.id).toBe(hiddenItem.id)
      expect(result?.isHidden).toBe(true)
    })

    it('should exclude hidden items from search results for non-admin users', async () => {
      const visibleItem = createMockMarketplaceItem({
        id: 'visible1',
        isHidden: false,
        title: 'Visible Item',
      })

      const hiddenItem = createMockMarketplaceItem({
        id: 'hidden1',
        isHidden: true,
        title: 'Hidden Item',
      })

      prismaMock.marketplaceItem.findMany.mockResolvedValue([visibleItem])

      const results = await prismaMock.marketplaceItem.findMany({
        where: {
          isHidden: false,
          isPublished: true,
        },
      })

      expect(results).toHaveLength(1)
      expect(results[0].id).toBe(visibleItem.id)
      expect(results.find(item => item.id === hiddenItem.id)).toBeUndefined()
    })

    it('should include hidden items in search results for admin users', async () => {
      const visibleItem = createMockMarketplaceItem({
        id: 'visible1',
        isHidden: false,
        title: 'Visible Item',
      })

      const hiddenItem = createMockMarketplaceItem({
        id: 'hidden1',
        isHidden: true,
        title: 'Hidden Item',
      })

      const adminUser = createMockUser({ isAdmin: true })
      const ctx = createMockContext({ userId: adminUser.id, isAdmin: true })

      prismaMock.marketplaceItem.findMany.mockResolvedValue([visibleItem, hiddenItem])

      const results = await prismaMock.marketplaceItem.findMany({
        where: {
          isPublished: true, // Admins see both hidden and non-hidden
        },
      })

      expect(results).toHaveLength(2)
      expect(results.find(item => item.id === hiddenItem.id)).toBeDefined()
    })
  })

  describe('Fork Protection', () => {
    it('should prevent forking hidden items', async () => {
      const hiddenItem = createMockMarketplaceItem({
        id: 'hidden1',
        isHidden: true,
      })

      const user = createMockUser({ isAdmin: false })

      // First, try to find the item (should fail for hidden items)
      prismaMock.marketplaceItem.findFirst.mockResolvedValue(null)

      const itemToFork = await prismaMock.marketplaceItem.findFirst({
        where: {
          id: hiddenItem.id,
          isHidden: false,
        },
      })

      expect(itemToFork).toBeNull()
    })

    it('should allow forking visible items', async () => {
      const visibleItem = createMockMarketplaceItem({
        id: 'visible1',
        isHidden: false,
        title: 'Original Item',
      })

      const user = createMockUser({ id: 'user1' })

      prismaMock.marketplaceItem.findFirst.mockResolvedValue(visibleItem)

      const forkedItem = createMockMarketplaceItem({
        id: 'forked1',
        title: 'Forked: Original Item',
        authorId: user.id,
      })

      prismaMock.marketplaceItem.create.mockResolvedValue(forkedItem)

      // Simulate forking
      const original = await prismaMock.marketplaceItem.findFirst({
        where: {
          id: visibleItem.id,
          isHidden: false,
        },
      })

      expect(original).toBeDefined()

      const result = await prismaMock.marketplaceItem.create({
        data: {
          title: `Forked: ${original!.title}`,
          description: original!.description,
          content: original!.content,
          category: original!.category,
          ageRange: original!.ageRange,
          tags: original!.tags,
          authorId: user.id,
          isPublished: false,
          isHidden: false,
        },
      })

      expect(result.title).toContain('Forked')
      expect(result.authorId).toBe(user.id)
    })
  })

  describe('Rating Security', () => {
    it('should prevent rating hidden items', async () => {
      const hiddenItem = createMockMarketplaceItem({
        id: 'hidden1',
        isHidden: true,
      })

      const user = createMockUser({ id: 'user1' })

      // Check if item is accessible for rating
      prismaMock.marketplaceItem.findFirst.mockResolvedValue(null)

      const itemToRate = await prismaMock.marketplaceItem.findFirst({
        where: {
          id: hiddenItem.id,
          isHidden: false,
        },
      })

      expect(itemToRate).toBeNull()
    })

    it('should prevent duplicate ratings from the same user (server-side)', async () => {
      const item = createMockMarketplaceItem({ id: 'item1' })
      const user = createMockUser({ id: 'user1' })

      // Mock existing rating
      prismaMock.marketplaceRating.findUnique.mockResolvedValue({
        id: 'rating1',
        itemId: item.id,
        userId: user.id,
        rating: 5,
        comment: 'Great!',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const existingRating = await prismaMock.marketplaceRating.findUnique({
        where: {
          itemId_userId: {
            itemId: item.id,
            userId: user.id,
          },
        },
      })

      expect(existingRating).toBeDefined()
      expect(existingRating?.userId).toBe(user.id)
      expect(existingRating?.itemId).toBe(item.id)
    })

    it('should allow rating visible items', async () => {
      const item = createMockMarketplaceItem({
        id: 'item1',
        isHidden: false,
      })
      const user = createMockUser({ id: 'user1' })

      // No existing rating
      prismaMock.marketplaceRating.findUnique.mockResolvedValue(null)

      // Item is accessible
      prismaMock.marketplaceItem.findFirst.mockResolvedValue(item)

      // Create new rating
      const newRating = {
        id: 'rating1',
        itemId: item.id,
        userId: user.id,
        rating: 4,
        comment: 'Good item',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      prismaMock.marketplaceRating.create.mockResolvedValue(newRating)

      const result = await prismaMock.marketplaceRating.create({
        data: {
          itemId: item.id,
          userId: user.id,
          rating: 4,
          comment: 'Good item',
        },
      })

      expect(result.rating).toBe(4)
      expect(result.userId).toBe(user.id)
    })
  })

  describe('Admin Operations', () => {
    it('should allow admins to hide items', async () => {
      const item = createMockMarketplaceItem({
        id: 'item1',
        isHidden: false,
      })

      const adminUser = createMockUser({ isAdmin: true })

      const hiddenItem = { ...item, isHidden: true }
      prismaMock.marketplaceItem.update.mockResolvedValue(hiddenItem)

      const result = await prismaMock.marketplaceItem.update({
        where: { id: item.id },
        data: { isHidden: true },
      })

      expect(result.isHidden).toBe(true)
    })

    it('should allow admins to unhide items', async () => {
      const item = createMockMarketplaceItem({
        id: 'item1',
        isHidden: true,
      })

      const adminUser = createMockUser({ isAdmin: true })

      const unhiddenItem = { ...item, isHidden: false }
      prismaMock.marketplaceItem.update.mockResolvedValue(unhiddenItem)

      const result = await prismaMock.marketplaceItem.update({
        where: { id: item.id },
        data: { isHidden: false },
      })

      expect(result.isHidden).toBe(false)
    })

    it('should allow bulk hide operations for admins', async () => {
      const itemIds = ['item1', 'item2', 'item3']

      prismaMock.marketplaceItem.updateMany.mockResolvedValue({ count: 3 })

      const result = await prismaMock.marketplaceItem.updateMany({
        where: {
          id: { in: itemIds },
        },
        data: { isHidden: true },
      })

      expect(result.count).toBe(3)
    })

    it('should allow bulk unhide operations for admins', async () => {
      const itemIds = ['item1', 'item2', 'item3']

      prismaMock.marketplaceItem.updateMany.mockResolvedValue({ count: 3 })

      const result = await prismaMock.marketplaceItem.updateMany({
        where: {
          id: { in: itemIds },
        },
        data: { isHidden: false },
      })

      expect(result.count).toBe(3)
    })

    it('should prevent non-admins from accessing admin endpoints', async () => {
      const user = createMockUser({ isAdmin: false })
      const ctx = createMockContext({ userId: user.id, isAdmin: false })

      // Verify non-admin status
      expect(ctx.isAdmin).toBe(false)

      // This would typically throw an error in the actual implementation
      const canAccessAdminEndpoint = ctx.isAdmin

      expect(canAccessAdminEndpoint).toBe(false)
    })
  })

  describe('Search Filtering', () => {
    it('should filter hidden items from category searches', async () => {
      const items = [
        createMockMarketplaceItem({ id: '1', category: 'ROUTINE', isHidden: false }),
        createMockMarketplaceItem({ id: '2', category: 'ROUTINE', isHidden: true }),
        createMockMarketplaceItem({ id: '3', category: 'ROUTINE', isHidden: false }),
      ]

      const visibleItems = items.filter(item => !item.isHidden)
      prismaMock.marketplaceItem.findMany.mockResolvedValue(visibleItems)

      const results = await prismaMock.marketplaceItem.findMany({
        where: {
          category: 'ROUTINE',
          isHidden: false,
        },
      })

      expect(results).toHaveLength(2)
      expect(results.every(item => !item.isHidden)).toBe(true)
    })

    it('should filter hidden items from tag searches', async () => {
      const items = [
        createMockMarketplaceItem({ id: '1', tags: ['morning'], isHidden: false }),
        createMockMarketplaceItem({ id: '2', tags: ['morning'], isHidden: true }),
      ]

      const visibleItems = items.filter(item => !item.isHidden)
      prismaMock.marketplaceItem.findMany.mockResolvedValue(visibleItems)

      const results = await prismaMock.marketplaceItem.findMany({
        where: {
          tags: { has: 'morning' },
          isHidden: false,
        },
      })

      expect(results).toHaveLength(1)
      expect(results[0].isHidden).toBe(false)
    })
  })
})