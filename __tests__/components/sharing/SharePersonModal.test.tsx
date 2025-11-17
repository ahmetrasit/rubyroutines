import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SharePersonModal } from '@/components/sharing/SharePersonModal'
import { createMockTRPCClient } from '../../utils/trpc-mock'

// Mock the tRPC client
jest.mock('@/lib/trpc/client', () => ({
  trpc: {
    personSharing: {
      generateInvite: {
        useMutation: jest.fn(),
      },
    },
  },
}))

// Mock the toast hook
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
})

describe('SharePersonModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    roleId: 'role1',
    roleType: 'PARENT' as const,
    persons: [
      { id: 'person1', name: 'Child 1' },
      { id: 'person2', name: 'Child 2' },
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the modal when open', () => {
    render(<SharePersonModal {...defaultProps} />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/share access/i)).toBeInTheDocument()
  })

  it('should not render when closed', () => {
    render(<SharePersonModal {...defaultProps} isOpen={false} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should display list of persons with checkboxes', () => {
    render(<SharePersonModal {...defaultProps} />)

    expect(screen.getByText('Child 1')).toBeInTheDocument()
    expect(screen.getByText('Child 2')).toBeInTheDocument()

    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(2)
  })

  it('should allow selecting persons', async () => {
    const user = userEvent.setup()
    render(<SharePersonModal {...defaultProps} />)

    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[0])

    expect(checkboxes[0]).toBeChecked()
  })

  it('should allow selecting permission level', async () => {
    const user = userEvent.setup()
    render(<SharePersonModal {...defaultProps} />)

    const permissionSelect = screen.getByRole('combobox')
    await user.click(permissionSelect)

    // Wait for dropdown to open
    await waitFor(() => {
      expect(screen.getByText('View Only')).toBeInTheDocument()
      expect(screen.getByText('Edit')).toBeInTheDocument()
      expect(screen.getByText('Manage')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Edit'))
  })

  it('should generate share code on button click', async () => {
    const mockMutate = jest.fn()
    const mockGenerateInvite = {
      useMutation: jest.fn(() => ({
        mutate: mockMutate,
        isLoading: false,
      })),
    }

    require('@/lib/trpc/client').trpc.personSharing.generateInvite = mockGenerateInvite

    const user = userEvent.setup()
    render(<SharePersonModal {...defaultProps} />)

    // Select a person
    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[0])

    // Click generate button
    const generateButton = screen.getByText(/generate share code/i)
    await user.click(generateButton)

    expect(mockMutate).toHaveBeenCalledWith({
      roleId: 'role1',
      personIds: ['person1'],
      permissions: 'VIEW',
    })
  })

  it('should display generated code', async () => {
    const mockGenerateInvite = {
      useMutation: jest.fn((options) => ({
        mutate: () => {
          options.onSuccess({ code: 'happy-sunny-day' })
        },
        isLoading: false,
      })),
    }

    require('@/lib/trpc/client').trpc.personSharing.generateInvite = mockGenerateInvite

    const user = userEvent.setup()
    render(<SharePersonModal {...defaultProps} />)

    // Select person and generate code
    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[0])

    const generateButton = screen.getByText(/generate share code/i)
    await user.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText('happy-sunny-day')).toBeInTheDocument()
    })
  })

  it('should copy code to clipboard', async () => {
    const mockGenerateInvite = {
      useMutation: jest.fn((options) => ({
        mutate: () => {
          options.onSuccess({ code: 'happy-sunny-day' })
        },
        isLoading: false,
      })),
    }

    require('@/lib/trpc/client').trpc.personSharing.generateInvite = mockGenerateInvite

    const user = userEvent.setup()
    render(<SharePersonModal {...defaultProps} />)

    // Generate code first
    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[0])
    await user.click(screen.getByText(/generate share code/i))

    // Wait for code to appear
    await waitFor(() => {
      expect(screen.getByText('happy-sunny-day')).toBeInTheDocument()
    })

    // Click copy button
    const copyButton = screen.getByLabelText(/copy/i)
    await user.click(copyButton)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('happy-sunny-day')
  })

  it('should show error message on generation failure', async () => {
    const mockToast = jest.fn()
    jest.spyOn(require('@/components/ui/use-toast'), 'useToast').mockReturnValue({
      toast: mockToast,
    })

    const mockGenerateInvite = {
      useMutation: jest.fn((options) => ({
        mutate: () => {
          options.onError(new Error('Generation failed'))
        },
        isLoading: false,
      })),
    }

    require('@/lib/trpc/client').trpc.personSharing.generateInvite = mockGenerateInvite

    const user = userEvent.setup()
    render(<SharePersonModal {...defaultProps} />)

    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[0])
    await user.click(screen.getByText(/generate share code/i))

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Error',
      description: 'Generation failed',
      variant: 'destructive',
    })
  })

  it('should close modal on close button click', async () => {
    const user = userEvent.setup()
    render(<SharePersonModal {...defaultProps} />)

    const closeButton = screen.getByLabelText(/close/i)
    await user.click(closeButton)

    expect(defaultProps.onClose).toHaveBeenCalled()
  })
})