import { User, Person, Role, PersonConnection, MarketplaceItem } from '@prisma/client'

// Simple ID generator for tests
const generateTestId = () => `test-${Math.random().toString(36).substr(2, 9)}`

// User Factory
export const createMockUser = (overrides?: Partial<User>): User => ({
  id: generateTestId(),
  email: 'test@example.com',
  hashedPassword: 'hashed_password',
  emailVerified: false,
  isAdmin: false,
  subscriptionStatus: 'FREE',
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

// Role Factory
export const createMockRole = (overrides?: Partial<Role>): Role => ({
  id: generateTestId(),
  name: 'parent',
  userId: generateTestId(),
  isPrimary: true,
  permissions: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

// Person Factory
export const createMockPerson = (overrides?: Partial<Person>): Person => ({
  id: generateTestId(),
  name: 'Test Person',
  age: 8,
  emoji: '👤',
  color: '#3B82F6',
  roleId: generateTestId(),
  showRewardSystem: true,
  showTimers: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

// PersonConnection Factory
export const createMockPersonConnection = (overrides?: Partial<PersonConnection>): PersonConnection => ({
  id: generateTestId(),
  personId: generateTestId(),
  sharedWithRoleId: generateTestId(),
  sharedByRoleId: generateTestId(),
  permissionLevel: 'VIEW',
  shareCode: 'test-share-code',
  claimedAt: null,
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

// Marketplace Item Factory
export const createMockMarketplaceItem = (overrides?: Partial<MarketplaceItem>): MarketplaceItem => ({
  id: generateTestId(),
  title: 'Test Item',
  description: 'Test Description',
  content: JSON.stringify({ type: 'routine', data: {} }),
  category: 'ROUTINE',
  ageRange: '5-8',
  tags: ['test', 'mock'],
  authorId: generateTestId(),
  isPublished: true,
  isHidden: false,
  forksCount: 0,
  averageRating: 0,
  ratingsCount: 0,
  downloads: 0,
  version: '1.0.0',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

// Generate Share Code (3-word format)
export const generateMockShareCode = (): string => {
  const words = ['happy', 'bright', 'sunny', 'quick', 'smart', 'brave', 'strong', 'kind', 'cool', 'neat']
  const randomWords = Array.from({ length: 3 }, () => words[Math.floor(Math.random() * words.length)])
  return randomWords.join('-')
}