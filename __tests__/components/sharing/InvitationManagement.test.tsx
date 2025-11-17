import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InvitationManagement } from '@/components/sharing/InvitationManagement'

// Mock the tRPC client
jest.mock('@/lib/trpc/client', () => ({
  trpc: {
    personSharing: {
      listConnections: {
        useQuery: jest.fn(),
      },
      revokeConnection: {
        useMutation: jest.fn(),
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

// Mock the toast hook
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

describe('InvitationManagement', () => {
  const defaultProps = {
    roleId: 'role1',
  }

  const mockConnections = [
    {
      id: 'conn1',
      person: {
        id: 'person1',
        name: 'Child 1',
        emoji: '👦',
      },
      sharedWith: {
        user: {
          email: 'parent2@example.com',
        },
      },
      permissionLevel: 'VIEW',
      createdAt: new Date('2024-01-01'),
      claimedAt: new Date('2024-01-02'),
    },
    {
      id: 'conn2',
      person: {
        id: 'person2',
        name: 'Child 2',
        emoji: '👧',
      },
      sharedWith: null,
      permissionLevel: 'EDIT',
      createdAt: new Date('2024-01-03'),
      claimedAt: null,
      shareCode: 'happy-sunny-day',
      expiresAt: new Date('2024-01-04'),
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should display list of connections', () => {
    const mockListConnections = {
      useQuery: jest.fn(() => ({
        data: mockConnections,
        isLoading: false,
        error: null,
      })),
    }

    require('@/lib/trpc/client').trpc.personSharing.listConnections = mockListConnections

    render(<InvitationManagement {...defaultProps} />)

    expect(screen.getByText('Child 1')).toBeInTheDocument()
    expect(screen.getByText('Child 2')).toBeInTheDocument()
  })

  it('should show claimed connections with recipient email', () => {
    const mockListConnections = {
      useQuery: jest.fn(() => ({
        data: [mockConnections[0]],
        isLoading: false,
        error: null,
      })),
    }

    require('@/lib/trpc/client').trpc.personSharing.listConnections = mockListConnections

    render(<InvitationManagement {...defaultProps} />)

    expect(screen.getByText('parent2@example.com')).toBeInTheDocument()
    expect(screen.getByText('VIEW')).toBeInTheDocument()
  })

  it('should show unclaimed invitations with share code', () => {
    const mockListConnections = {
      useQuery: jest.fn(() => ({
        data: [mockConnections[1]],
        isLoading: false,
        error: null,
      })),
    }

    require('@/lib/trpc/client').trpc.personSharing.listConnections = mockListConnections

    render(<InvitationManagement {...defaultProps} />)

    expect(screen.getByText('happy-sunny-day')).toBeInTheDocument()
    expect(screen.getByText(/pending/i)).toBeInTheDocument()
  })

  it('should allow revoking a connection', async () => {
    const mockRevoke = jest.fn()
    const mockListConnections = {
      useQuery: jest.fn(() => ({
        data: mockConnections,
        isLoading: false,
        error: null,
      })),
    }

    const mockRevokeConnection = {
      useMutation: jest.fn((options) => ({
        mutate: (data: any) => {
          mockRevoke(data)
          options.onSuccess()
        },
        isLoading: false,
      })),
    }

    require('@/lib/trpc/client').trpc.personSharing.listConnections = mockListConnections
    require('@/lib/trpc/client').trpc.personSharing.revokeConnection = mockRevokeConnection

    const user = userEvent.setup()
    render(<InvitationManagement {...defaultProps} />)

    const revokeButtons = screen.getAllByText(/revoke/i)
    await user.click(revokeButtons[0])

    // Confirm revocation in dialog
    const confirmButton = await screen.findByText(/confirm/i)
    await user.click(confirmButton)

    expect(mockRevoke).toHaveBeenCalledWith({
      connectionId: 'conn1',
    })
  })

  it('should show loading state', () => {
    const mockListConnections = {
      useQuery: jest.fn(() => ({
        data: null,
        isLoading: true,
        error: null,
      })),
    }

    require('@/lib/trpc/client').trpc.personSharing.listConnections = mockListConnections

    render(<InvitationManagement {...defaultProps} />)

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('should show empty state when no connections', () => {
    const mockListConnections = {
      useQuery: jest.fn(() => ({
        data: [],
        isLoading: false,
        error: null,
      })),
    }

    require('@/lib/trpc/client').trpc.personSharing.listConnections = mockListConnections

    render(<InvitationManagement {...defaultProps} />)

    expect(screen.getByText(/no shared connections/i)).toBeInTheDocument()
  })

  it('should display permission levels correctly', () => {
    const mockListConnections = {
      useQuery: jest.fn(() => ({
        data: mockConnections,
        isLoading: false,
        error: null,
      })),
    }

    require('@/lib/trpc/client').trpc.personSharing.listConnections = mockListConnections

    render(<InvitationManagement {...defaultProps} />)

    expect(screen.getByText('VIEW')).toBeInTheDocument()
    expect(screen.getByText('EDIT')).toBeInTheDocument()
  })

  it('should show expiration time for pending invites', () => {
    const futureDate = new Date()
    futureDate.setHours(futureDate.getHours() + 12)

    const pendingConnection = {
      ...mockConnections[1],
      expiresAt: futureDate,
    }

    const mockListConnections = {
      useQuery: jest.fn(() => ({
        data: [pendingConnection],
        isLoading: false,
        error: null,
      })),
    }

    require('@/lib/trpc/client').trpc.personSharing.listConnections = mockListConnections

    render(<InvitationManagement {...defaultProps} />)

    expect(screen.getByText(/expires in/i)).toBeInTheDocument()
  })

  it('should show expired status for expired invites', () => {
    const pastDate = new Date()
    pastDate.setHours(pastDate.getHours() - 1)

    const expiredConnection = {
      ...mockConnections[1],
      expiresAt: pastDate,
    }

    const mockListConnections = {
      useQuery: jest.fn(() => ({
        data: [expiredConnection],
        isLoading: false,
        error: null,
      })),
    }

    require('@/lib/trpc/client').trpc.personSharing.listConnections = mockListConnections

    render(<InvitationManagement {...defaultProps} />)

    expect(screen.getByText(/expired/i)).toBeInTheDocument()
  })

  it('should copy share code to clipboard', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(),
      },
    })

    const mockListConnections = {
      useQuery: jest.fn(() => ({
        data: [mockConnections[1]],
        isLoading: false,
        error: null,
      })),
    }

    require('@/lib/trpc/client').trpc.personSharing.listConnections = mockListConnections

    const user = userEvent.setup()
    render(<InvitationManagement {...defaultProps} />)

    const copyButton = screen.getByLabelText(/copy code/i)
    await user.click(copyButton)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('happy-sunny-day')
  })

  it('should refresh list after successful revocation', async () => {
    const mockInvalidate = jest.fn()
    const mockContext = {
      personSharing: {
        listConnections: {
          invalidate: mockInvalidate,
        },
      },
    }

    jest.spyOn(require('@/lib/trpc/client').trpc, 'useContext').mockReturnValue(mockContext)

    const mockRevokeConnection = {
      useMutation: jest.fn((options) => ({
        mutate: () => {
          options.onSuccess()
        },
        isLoading: false,
      })),
    }

    require('@/lib/trpc/client').trpc.personSharing.revokeConnection = mockRevokeConnection

    const mockListConnections = {
      useQuery: jest.fn(() => ({
        data: mockConnections,
        isLoading: false,
        error: null,
      })),
    }

    require('@/lib/trpc/client').trpc.personSharing.listConnections = mockListConnections

    const user = userEvent.setup()
    render(<InvitationManagement {...defaultProps} />)

    const revokeButtons = screen.getAllByText(/revoke/i)
    await user.click(revokeButtons[0])

    const confirmButton = await screen.findByText(/confirm/i)
    await user.click(confirmButton)

    await waitFor(() => {
      expect(mockInvalidate).toHaveBeenCalled()
    })
  })
})