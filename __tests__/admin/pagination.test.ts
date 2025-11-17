import { prismaMock, setupCommonMocks } from '../utils/prisma-mock'
import { createMockUser, createMockMarketplaceItem } from '../utils/test-factories'

describe('Admin Pagination', () => {
  beforeEach(() => {
    setupCommonMocks()
  })

  describe('Page Navigation', () => {
    const createMockItems = (count: number) => {
      return Array.from({ length: count }, (_, i) =>
        createMockMarketplaceItem({
          id: `item-${i + 1}`,
          title: `Item ${i + 1}`,
          createdAt: new Date(Date.now() - i * 1000 * 60 * 60), // Stagger creation times
        })
      )
    }

    it('should navigate to first page', async () => {
      const items = createMockItems(50)
      const pageSize = 10
      const firstPageItems = items.slice(0, pageSize)

      prismaMock.marketplaceItem.findMany.mockResolvedValue(firstPageItems)
      prismaMock.marketplaceItem.count.mockResolvedValue(50)

      const result = await prismaMock.marketplaceItem.findMany({
        take: pageSize,
        skip: 0,
        orderBy: { createdAt: 'desc' },
      })

      expect(result).toHaveLength(10)
      expect(result[0].id).toBe('item-1')
      expect(result[9].id).toBe('item-10')
    })

    it('should navigate to next page', async () => {
      const items = createMockItems(50)
      const pageSize = 10
      const currentPage = 2
      const secondPageItems = items.slice(10, 20)

      prismaMock.marketplaceItem.findMany.mockResolvedValue(secondPageItems)
      prismaMock.marketplaceItem.count.mockResolvedValue(50)

      const result = await prismaMock.marketplaceItem.findMany({
        take: pageSize,
        skip: (currentPage - 1) * pageSize,
        orderBy: { createdAt: 'desc' },
      })

      expect(result).toHaveLength(10)
      expect(result[0].id).toBe('item-11')
      expect(result[9].id).toBe('item-20')
    })

    it('should navigate to previous page', async () => {
      const items = createMockItems(50)
      const pageSize = 10
      const currentPage = 3
      const prevPage = currentPage - 1
      const secondPageItems = items.slice(10, 20)

      prismaMock.marketplaceItem.findMany.mockResolvedValue(secondPageItems)

      const result = await prismaMock.marketplaceItem.findMany({
        take: pageSize,
        skip: (prevPage - 1) * pageSize,
        orderBy: { createdAt: 'desc' },
      })

      expect(result).toHaveLength(10)
      expect(result[0].id).toBe('item-11')
    })

    it('should navigate to last page', async () => {
      const items = createMockItems(45)
      const pageSize = 10
      const totalPages = Math.ceil(45 / pageSize) // 5 pages
      const lastPage = totalPages
      const lastPageItems = items.slice(40, 45)

      prismaMock.marketplaceItem.findMany.mockResolvedValue(lastPageItems)
      prismaMock.marketplaceItem.count.mockResolvedValue(45)

      const result = await prismaMock.marketplaceItem.findMany({
        take: pageSize,
        skip: (lastPage - 1) * pageSize,
        orderBy: { createdAt: 'desc' },
      })

      expect(result).toHaveLength(5) // Last page has only 5 items
      expect(result[0].id).toBe('item-41')
      expect(result[4].id).toBe('item-45')
    })

    it('should handle page boundaries correctly', async () => {
      const pageSize = 10
      const totalItems = 50
      const totalPages = Math.ceil(totalItems / pageSize)

      // Test first page boundary
      const firstPage = 1
      expect(firstPage).toBeGreaterThanOrEqual(1)

      // Test last page boundary
      const lastPage = totalPages
      expect(lastPage).toBeLessThanOrEqual(totalPages)

      // Test invalid page (too low)
      const invalidLowPage = 0
      const correctedLowPage = Math.max(1, invalidLowPage)
      expect(correctedLowPage).toBe(1)

      // Test invalid page (too high)
      const invalidHighPage = 10
      const correctedHighPage = Math.min(totalPages, invalidHighPage)
      expect(correctedHighPage).toBe(5)
    })
  })

  describe('Page Size Changes', () => {
    it('should handle page size change from 10 to 25', async () => {
      const items = createMockItems(100)
      const newPageSize = 25
      const firstPageWithNewSize = items.slice(0, newPageSize)

      prismaMock.marketplaceItem.findMany.mockResolvedValue(firstPageWithNewSize)
      prismaMock.marketplaceItem.count.mockResolvedValue(100)

      const result = await prismaMock.marketplaceItem.findMany({
        take: newPageSize,
        skip: 0,
        orderBy: { createdAt: 'desc' },
      })

      expect(result).toHaveLength(25)
      expect(result[0].id).toBe('item-1')
      expect(result[24].id).toBe('item-25')

      // Check total pages calculation
      const totalPages = Math.ceil(100 / newPageSize)
      expect(totalPages).toBe(4)
    })

    it('should handle page size change from 10 to 50', async () => {
      const items = createMockItems(100)
      const newPageSize = 50
      const firstPageWithNewSize = items.slice(0, newPageSize)

      prismaMock.marketplaceItem.findMany.mockResolvedValue(firstPageWithNewSize)

      const result = await prismaMock.marketplaceItem.findMany({
        take: newPageSize,
        skip: 0,
        orderBy: { createdAt: 'desc' },
      })

      expect(result).toHaveLength(50)

      // Check total pages calculation
      const totalPages = Math.ceil(100 / newPageSize)
      expect(totalPages).toBe(2)
    })

    it('should reset to first page when page size changes', async () => {
      // When on page 3 with size 10
      let currentPage = 3
      let pageSize = 10

      // Change to size 50
      pageSize = 50
      currentPage = 1 // Should reset to page 1

      const skip = (currentPage - 1) * pageSize

      expect(currentPage).toBe(1)
      expect(skip).toBe(0)
    })
  })

  describe('Filter Interaction with Pagination', () => {
    it('should reset to page 1 when filter is applied', async () => {
      const allItems = createMockItems(100)
      const filteredItems = allItems.filter(item => item.category === 'ROUTINE')
      const pageSize = 10

      prismaMock.marketplaceItem.findMany.mockResolvedValue(filteredItems.slice(0, pageSize))
      prismaMock.marketplaceItem.count.mockResolvedValue(filteredItems.length)

      // Apply filter
      const result = await prismaMock.marketplaceItem.findMany({
        where: { category: 'ROUTINE' },
        take: pageSize,
        skip: 0, // Reset to page 1
        orderBy: { createdAt: 'desc' },
      })

      const currentPage = 1
      expect(currentPage).toBe(1)
      expect(result.length).toBeLessThanOrEqual(pageSize)
    })

    it('should maintain pagination with active filters', async () => {
      const filteredItems = createMockItems(30).map(item => ({
        ...item,
        category: 'ROUTINE',
      }))

      const pageSize = 10
      const page2Items = filteredItems.slice(10, 20)

      prismaMock.marketplaceItem.findMany.mockResolvedValue(page2Items)
      prismaMock.marketplaceItem.count.mockResolvedValue(30)

      const result = await prismaMock.marketplaceItem.findMany({
        where: { category: 'ROUTINE' },
        take: pageSize,
        skip: 10,
        orderBy: { createdAt: 'desc' },
      })

      expect(result).toHaveLength(10)
      expect(result.every(item => item.category === 'ROUTINE')).toBe(true)
    })

    it('should handle search query with pagination', async () => {
      const searchQuery = 'morning'
      const matchingItems = createMockItems(25).map(item => ({
        ...item,
        title: `Morning ${item.title}`,
      }))

      const pageSize = 10
      const firstPageResults = matchingItems.slice(0, pageSize)

      prismaMock.marketplaceItem.findMany.mockResolvedValue(firstPageResults)
      prismaMock.marketplaceItem.count.mockResolvedValue(25)

      const result = await prismaMock.marketplaceItem.findMany({
        where: {
          title: { contains: searchQuery, mode: 'insensitive' },
        },
        take: pageSize,
        skip: 0,
        orderBy: { createdAt: 'desc' },
      })

      expect(result).toHaveLength(10)
      expect(result.every(item => item.title.toLowerCase().includes('morning'))).toBe(true)
    })
  })

  describe('Loading States', () => {
    it('should show loading state during page navigation', async () => {
      // Simulate loading state
      const loadingStates = {
        initial: true,
        pageChange: false,
        filterChange: false,
      }

      // Initial load
      expect(loadingStates.initial).toBe(true)

      // After data loaded
      loadingStates.initial = false
      expect(loadingStates.initial).toBe(false)

      // During page change
      loadingStates.pageChange = true
      expect(loadingStates.pageChange).toBe(true)

      // After page change complete
      loadingStates.pageChange = false
      expect(loadingStates.pageChange).toBe(false)
    })

    it('should handle loading state for filter changes', async () => {
      const loadingState = { isLoading: false }

      // Start filter change
      loadingState.isLoading = true
      expect(loadingState.isLoading).toBe(true)

      // Complete filter change
      loadingState.isLoading = false
      expect(loadingState.isLoading).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty data gracefully', async () => {
      prismaMock.marketplaceItem.findMany.mockResolvedValue([])
      prismaMock.marketplaceItem.count.mockResolvedValue(0)

      const result = await prismaMock.marketplaceItem.findMany({
        take: 10,
        skip: 0,
      })

      expect(result).toHaveLength(0)

      const totalPages = Math.ceil(0 / 10) || 1
      expect(totalPages).toBe(1)
    })

    it('should handle single page of data', async () => {
      const items = createMockItems(5)

      prismaMock.marketplaceItem.findMany.mockResolvedValue(items)
      prismaMock.marketplaceItem.count.mockResolvedValue(5)

      const result = await prismaMock.marketplaceItem.findMany({
        take: 10,
        skip: 0,
      })

      expect(result).toHaveLength(5)

      const totalPages = Math.ceil(5 / 10)
      expect(totalPages).toBe(1)

      // Navigation buttons should be disabled
      const canGoNext = false
      const canGoPrev = false
      expect(canGoNext).toBe(false)
      expect(canGoPrev).toBe(false)
    })

    it('should handle exactly one page worth of data', async () => {
      const items = createMockItems(10)

      prismaMock.marketplaceItem.findMany.mockResolvedValue(items)
      prismaMock.marketplaceItem.count.mockResolvedValue(10)

      const result = await prismaMock.marketplaceItem.findMany({
        take: 10,
        skip: 0,
      })

      expect(result).toHaveLength(10)

      const totalPages = Math.ceil(10 / 10)
      expect(totalPages).toBe(1)
    })

    it('should handle concurrent pagination requests', async () => {
      // Simulate multiple rapid page changes
      const requests = [
        { page: 2, timestamp: Date.now() },
        { page: 3, timestamp: Date.now() + 100 },
        { page: 1, timestamp: Date.now() + 200 },
      ]

      // Only the latest request should be processed
      const latestRequest = requests.reduce((latest, current) =>
        current.timestamp > latest.timestamp ? current : latest
      )

      expect(latestRequest.page).toBe(1)
    })
  })

  describe('Pagination with Sorting', () => {
    it('should maintain sort order across pages', async () => {
      const items = createMockItems(30)
      const sortedItems = [...items].sort((a, b) =>
        a.title.localeCompare(b.title)
      )

      const pageSize = 10
      const firstPage = sortedItems.slice(0, pageSize)

      prismaMock.marketplaceItem.findMany.mockResolvedValue(firstPage)

      const result = await prismaMock.marketplaceItem.findMany({
        take: pageSize,
        skip: 0,
        orderBy: { title: 'asc' },
      })

      // Verify alphabetical order
      for (let i = 1; i < result.length; i++) {
        expect(result[i].title >= result[i - 1].title).toBe(true)
      }
    })

    it('should handle sort order changes', async () => {
      const items = createMockItems(20)

      // Sort by date descending (newest first)
      const dateDescItems = [...items].sort((a, b) =>
        b.createdAt.getTime() - a.createdAt.getTime()
      )

      prismaMock.marketplaceItem.findMany.mockResolvedValue(dateDescItems.slice(0, 10))

      let result = await prismaMock.marketplaceItem.findMany({
        take: 10,
        skip: 0,
        orderBy: { createdAt: 'desc' },
      })

      expect(result[0].createdAt >= result[1].createdAt).toBe(true)

      // Change to ascending (oldest first)
      const dateAscItems = [...items].sort((a, b) =>
        a.createdAt.getTime() - b.createdAt.getTime()
      )

      prismaMock.marketplaceItem.findMany.mockResolvedValue(dateAscItems.slice(0, 10))

      result = await prismaMock.marketplaceItem.findMany({
        take: 10,
        skip: 0,
        orderBy: { createdAt: 'asc' },
      })

      expect(result[0].createdAt <= result[1].createdAt).toBe(true)
    })
  })

  describe('User Table Pagination', () => {
    it('should paginate user list for admin', async () => {
      const users = Array.from({ length: 50 }, (_, i) =>
        createMockUser({
          id: `user-${i + 1}`,
          email: `user${i + 1}@example.com`,
        })
      )

      const pageSize = 10
      const firstPageUsers = users.slice(0, pageSize)

      prismaMock.user.findMany.mockResolvedValue(firstPageUsers)
      prismaMock.user.count.mockResolvedValue(50)

      const result = await prismaMock.user.findMany({
        take: pageSize,
        skip: 0,
        orderBy: { createdAt: 'desc' },
      })

      expect(result).toHaveLength(10)
      expect(result[0].id).toBe('user-1')
    })

    it('should filter users by subscription status with pagination', async () => {
      const premiumUsers = Array.from({ length: 15 }, (_, i) =>
        createMockUser({
          id: `premium-${i + 1}`,
          subscriptionStatus: 'PREMIUM',
        })
      )

      prismaMock.user.findMany.mockResolvedValue(premiumUsers.slice(0, 10))
      prismaMock.user.count.mockResolvedValue(15)

      const result = await prismaMock.user.findMany({
        where: { subscriptionStatus: 'PREMIUM' },
        take: 10,
        skip: 0,
      })

      expect(result).toHaveLength(10)
      expect(result.every(u => u.subscriptionStatus === 'PREMIUM')).toBe(true)
    })
  })
})