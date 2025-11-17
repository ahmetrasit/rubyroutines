// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock tRPC client
jest.mock('@/lib/trpc/client', () => ({
  trpc: {
    personSharing: {
      generateInvite: {
        useMutation: jest.fn(() => ({
          mutate: jest.fn(),
          isLoading: false,
        })),
      },
      validateInvite: {
        useMutation: jest.fn(() => ({
          mutate: jest.fn(),
          isLoading: false,
        })),
      },
      claimInvite: {
        useMutation: jest.fn(() => ({
          mutate: jest.fn(),
          isLoading: false,
        })),
      },
      listConnections: {
        useQuery: jest.fn(() => ({
          data: [],
          isLoading: false,
          error: null,
        })),
      },
      revokeConnection: {
        useMutation: jest.fn(() => ({
          mutate: jest.fn(),
          isLoading: false,
        })),
      },
    },
    useContext: jest.fn(() => ({
      personSharing: {
        listConnections: {
          invalidate: jest.fn(),
        },
      },
    })),
  },
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
  useParams() {
    return {}
  },
}))

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(),
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  })),
}))

// Suppress console errors in tests
const originalError = console.error
beforeAll(() => {
  console.error = jest.fn()
})

afterAll(() => {
  console.error = originalError
})