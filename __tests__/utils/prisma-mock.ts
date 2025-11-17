import { PrismaClient } from '@prisma/client'
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended'

// Create a deep mock of Prisma Client
export const prismaMock = mockDeep<PrismaClient>()

// Export for use in tests
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: prismaMock,
  prisma: prismaMock,
}))

// Helper to reset all mocks between tests
beforeEach(() => {
  mockReset(prismaMock)
})

// Common mock implementations
export const setupCommonMocks = () => {
  // User mocks
  prismaMock.user.findUnique.mockResolvedValue(null)
  prismaMock.user.findMany.mockResolvedValue([])
  prismaMock.user.count.mockResolvedValue(0)

  // Person mocks
  prismaMock.person.findUnique.mockResolvedValue(null)
  prismaMock.person.findMany.mockResolvedValue([])
  prismaMock.person.count.mockResolvedValue(0)

  // Role mocks
  prismaMock.role.findUnique.mockResolvedValue(null)
  prismaMock.role.findMany.mockResolvedValue([])

  // PersonConnection mocks
  prismaMock.personConnection.findUnique.mockResolvedValue(null)
  prismaMock.personConnection.findMany.mockResolvedValue([])

  // MarketplaceItem mocks
  prismaMock.marketplaceItem.findUnique.mockResolvedValue(null)
  prismaMock.marketplaceItem.findMany.mockResolvedValue([])
  prismaMock.marketplaceItem.count.mockResolvedValue(0)

  // Task mocks
  prismaMock.task.findUnique.mockResolvedValue(null)
  prismaMock.task.findMany.mockResolvedValue([])

  // TaskCompletion mocks
  prismaMock.taskCompletion.findUnique.mockResolvedValue(null)
  prismaMock.taskCompletion.findMany.mockResolvedValue([])
  prismaMock.taskCompletion.count.mockResolvedValue(0)

  // MarketplaceRating mocks
  prismaMock.marketplaceRating.findUnique.mockResolvedValue(null)
  prismaMock.marketplaceRating.findMany.mockResolvedValue([])
  prismaMock.marketplaceRating.create.mockResolvedValue(null)
}

// Transaction mock helper
export const mockTransaction = (callback: (tx: DeepMockProxy<PrismaClient>) => void) => {
  prismaMock.$transaction.mockImplementation(async (fn) => {
    if (typeof fn === 'function') {
      return fn(prismaMock)
    }
    return Promise.resolve([])
  })
  callback(prismaMock)
}