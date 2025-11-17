import { createTRPCMsw } from 'msw-trpc'
import { AppRouter } from '@/lib/trpc/routers/_app'
import superjson from 'superjson'
import { createTRPCProxyClient } from '@trpc/client'

// Create a mock tRPC context
export const createMockContext = ({
  userId,
  roleId,
  isAdmin = false,
}: {
  userId?: string
  roleId?: string
  isAdmin?: boolean
} = {}) => {
  return {
    user: userId ? { id: userId } : null,
    role: roleId ? { id: roleId } : null,
    isAdmin,
    session: userId ? { user: { id: userId } } : null,
  }
}

// Create mock tRPC caller for testing
export const createMockCaller = () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    person: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    personConnection: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    marketplaceItem: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    task: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    taskCompletion: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  }

  return {
    prisma: mockPrisma,
    // Add other mock services as needed
  }
}

// Mock tRPC client for component testing
export const createMockTRPCClient = (overrides = {}) => {
  const defaultMocks = {
    person: {
      list: jest.fn().mockResolvedValue([]),
      getById: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'new-person' }),
      update: jest.fn().mockResolvedValue({ id: 'updated-person' }),
      delete: jest.fn().mockResolvedValue({ success: true }),
    },
    invitation: {
      generateShareCode: jest.fn().mockResolvedValue({ code: 'test-code-123' }),
      claimShareCode: jest.fn().mockResolvedValue({ success: true }),
      listConnections: jest.fn().mockResolvedValue([]),
      revokeConnection: jest.fn().mockResolvedValue({ success: true }),
    },
    marketplace: {
      list: jest.fn().mockResolvedValue({ items: [], total: 0 }),
      getById: jest.fn().mockResolvedValue(null),
      fork: jest.fn().mockResolvedValue({ id: 'forked-item' }),
      rate: jest.fn().mockResolvedValue({ success: true }),
    },
    adminMarketplace: {
      hideItem: jest.fn().mockResolvedValue({ success: true }),
      unhideItem: jest.fn().mockResolvedValue({ success: true }),
      bulkHide: jest.fn().mockResolvedValue({ count: 0 }),
    },
    task: {
      verifyAccess: jest.fn().mockResolvedValue({ hasAccess: true }),
      complete: jest.fn().mockResolvedValue({ success: true }),
    },
    ...overrides,
  }

  return defaultMocks
}

// Helper to wrap components with mock tRPC provider
export const withMockTRPC = (component: React.ReactElement, mockClient = createMockTRPCClient()) => {
  // This would need actual implementation based on your tRPC setup
  // For now, returning the component as-is
  return component
}

// Mock permission checker
export const mockVerifyTaskAccess = jest.fn().mockImplementation(async ({
  taskId,
  userId,
  roleId,
}: {
  taskId: string
  userId: string
  roleId: string
}) => {
  // Default implementation - can be overridden in tests
  return true
})