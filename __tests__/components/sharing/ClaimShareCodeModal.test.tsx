import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ClaimShareCodeModal } from '@/components/sharing/ClaimShareCodeModal'

// Mock the tRPC client
jest.mock('@/lib/trpc/client', () => ({
  trpc: {
    personSharing: {
      claimInvite: {
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

describe('ClaimShareCodeModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    roleId: 'role1',
    onSuccess: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the modal when open', () => {
    render(<ClaimShareCodeModal {...defaultProps} />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/enter share code/i)).toBeInTheDocument()
  })

  it('should not render when closed', () => {
    render(<ClaimShareCodeModal {...defaultProps} isOpen={false} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should display input fields for 3-word code', () => {
    render(<ClaimShareCodeModal {...defaultProps} />)

    const inputs = screen.getAllByRole('textbox')
    expect(inputs).toHaveLength(3)
  })

  it('should validate code format (3 words)', async () => {
    const user = userEvent.setup()
    render(<ClaimShareCodeModal {...defaultProps} />)

    const inputs = screen.getAllByRole('textbox')

    // Enter valid code
    await user.type(inputs[0], 'happy')
    await user.type(inputs[1], 'sunny')
    await user.type(inputs[2], 'day')

    // Check that all inputs have values
    expect(inputs[0]).toHaveValue('happy')
    expect(inputs[1]).toHaveValue('sunny')
    expect(inputs[2]).toHaveValue('day')
  })

  it('should auto-focus next input when word is entered', async () => {
    const user = userEvent.setup()
    render(<ClaimShareCodeModal {...defaultProps} />)

    const inputs = screen.getAllByRole('textbox')

    // Type in first input
    await user.type(inputs[0], 'happy')
    await user.keyboard('{Tab}')

    // Second input should be focused
    expect(inputs[1]).toHaveFocus()
  })

  it('should successfully claim a valid code', async () => {
    const mockMutate = jest.fn()
    const mockClaimInvite = {
      useMutation: jest.fn((options) => ({
        mutate: (data: any) => {
          mockMutate(data)
          options.onSuccess({ success: true })
        },
        isLoading: false,
      })),
    }

    require('@/lib/trpc/client').trpc.personSharing.claimInvite = mockClaimInvite

    const user = userEvent.setup()
    render(<ClaimShareCodeModal {...defaultProps} />)

    const inputs = screen.getAllByRole('textbox')

    // Enter code
    await user.type(inputs[0], 'happy')
    await user.type(inputs[1], 'sunny')
    await user.type(inputs[2], 'day')

    // Click claim button
    const claimButton = screen.getByText(/claim access/i)
    await user.click(claimButton)

    expect(mockMutate).toHaveBeenCalledWith({
      code: 'happy-sunny-day',
      roleId: 'role1',
    })

    expect(defaultProps.onSuccess).toHaveBeenCalled()
  })

  it('should show error for invalid code', async () => {
    const mockToast = jest.fn()
    jest.spyOn(require('@/components/ui/use-toast'), 'useToast').mockReturnValue({
      toast: mockToast,
    })

    const mockClaimInvite = {
      useMutation: jest.fn((options) => ({
        mutate: () => {
          options.onError(new Error('Invalid or expired code'))
        },
        isLoading: false,
      })),
    }

    require('@/lib/trpc/client').trpc.personSharing.claimInvite = mockClaimInvite

    const user = userEvent.setup()
    render(<ClaimShareCodeModal {...defaultProps} />)

    const inputs = screen.getAllByRole('textbox')

    // Enter code
    await user.type(inputs[0], 'invalid')
    await user.type(inputs[1], 'share')
    await user.type(inputs[2], 'code')

    // Try to claim
    const claimButton = screen.getByText(/claim access/i)
    await user.click(claimButton)

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Error',
      description: 'Invalid or expired code',
      variant: 'destructive',
    })
  })

  it('should show error for expired code', async () => {
    const mockToast = jest.fn()
    jest.spyOn(require('@/components/ui/use-toast'), 'useToast').mockReturnValue({
      toast: mockToast,
    })

    const mockClaimInvite = {
      useMutation: jest.fn((options) => ({
        mutate: () => {
          options.onError(new Error('This share code has expired'))
        },
        isLoading: false,
      })),
    }

    require('@/lib/trpc/client').trpc.personSharing.claimInvite = mockClaimInvite

    const user = userEvent.setup()
    render(<ClaimShareCodeModal {...defaultProps} />)

    const inputs = screen.getAllByRole('textbox')
    await user.type(inputs[0], 'expired')
    await user.type(inputs[1], 'share')
    await user.type(inputs[2], 'code')

    const claimButton = screen.getByText(/claim access/i)
    await user.click(claimButton)

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Error',
      description: 'This share code has expired',
      variant: 'destructive',
    })
  })

  it('should show error for already claimed code', async () => {
    const mockToast = jest.fn()
    jest.spyOn(require('@/components/ui/use-toast'), 'useToast').mockReturnValue({
      toast: mockToast,
    })

    const mockClaimInvite = {
      useMutation: jest.fn((options) => ({
        mutate: () => {
          options.onError(new Error('This code has already been claimed'))
        },
        isLoading: false,
      })),
    }

    require('@/lib/trpc/client').trpc.personSharing.claimInvite = mockClaimInvite

    const user = userEvent.setup()
    render(<ClaimShareCodeModal {...defaultProps} />)

    const inputs = screen.getAllByRole('textbox')
    await user.type(inputs[0], 'already')
    await user.type(inputs[1], 'claimed')
    await user.type(inputs[2], 'code')

    const claimButton = screen.getByText(/claim access/i)
    await user.click(claimButton)

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Error',
      description: 'This code has already been claimed',
      variant: 'destructive',
    })
  })

  it('should disable claim button when code is incomplete', () => {
    render(<ClaimShareCodeModal {...defaultProps} />)

    const claimButton = screen.getByText(/claim access/i)
    expect(claimButton).toBeDisabled()
  })

  it('should enable claim button when all fields are filled', async () => {
    const user = userEvent.setup()
    render(<ClaimShareCodeModal {...defaultProps} />)

    const inputs = screen.getAllByRole('textbox')
    const claimButton = screen.getByText(/claim access/i)

    // Initially disabled
    expect(claimButton).toBeDisabled()

    // Fill all fields
    await user.type(inputs[0], 'happy')
    await user.type(inputs[1], 'sunny')
    await user.type(inputs[2], 'day')

    // Should now be enabled
    await waitFor(() => {
      expect(claimButton).not.toBeDisabled()
    })
  })

  it('should close modal on cancel', async () => {
    const user = userEvent.setup()
    render(<ClaimShareCodeModal {...defaultProps} />)

    const cancelButton = screen.getByText(/cancel/i)
    await user.click(cancelButton)

    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('should clear inputs when modal is reopened', () => {
    const { rerender } = render(<ClaimShareCodeModal {...defaultProps} isOpen={false} />)

    // Open modal
    rerender(<ClaimShareCodeModal {...defaultProps} isOpen={true} />)

    const inputs = screen.getAllByRole('textbox')
    inputs.forEach(input => {
      expect(input).toHaveValue('')
    })
  })
})