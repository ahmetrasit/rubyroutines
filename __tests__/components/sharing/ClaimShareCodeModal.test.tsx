import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClaimShareCodeModal } from '@/components/sharing/ClaimShareCodeModal';

// Mock the tRPC client
const mockValidateMutate = jest.fn();
const mockClaimMutate = jest.fn();

jest.mock('@/lib/trpc/client', () => ({
  trpc: {
    personSharing: {
      validateInvite: {
        useMutation: jest.fn((callbacks) => ({
          mutate: mockValidateMutate,
          isPending: false,
          isLoading: false,
        })),
      },
      claimInvite: {
        useMutation: jest.fn((callbacks) => ({
          mutate: mockClaimMutate,
          isPending: false,
          isLoading: false,
        })),
      },
    },
  },
}));

// Mock the toast hook
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock window.location.reload
delete (window as any).location;
(window as any).location = { reload: jest.fn() };

describe('ClaimShareCodeModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    roleId: 'role1',
    userId: 'user1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the modal when open', () => {
    render(<ClaimShareCodeModal {...defaultProps} />);

    expect(screen.getByText(/enter share code/i)).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<ClaimShareCodeModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText(/enter share code/i)).not.toBeInTheDocument();
  });

  it('should display single input field for code', () => {
    render(<ClaimShareCodeModal {...defaultProps} />);

    const input = screen.getByPlaceholderText(/e\.g\., happy-turtle-jump/i);
    expect(input).toBeInTheDocument();
  });

  it('should call validate mutation when validating code', async () => {
    const user = userEvent.setup();
    render(<ClaimShareCodeModal {...defaultProps} />);

    const input = screen.getByPlaceholderText(/e\.g\., happy-turtle-jump/i);
    const continueButton = screen.getByText(/continue/i);

    await user.type(input, 'happy-turtle-jump');
    await user.click(continueButton);

    expect(mockValidateMutate).toHaveBeenCalledWith('happy-turtle-jump');
  });

  it('should validate on Enter key press', async () => {
    const user = userEvent.setup();
    render(<ClaimShareCodeModal {...defaultProps} />);

    const input = screen.getByPlaceholderText(/e\.g\., happy-turtle-jump/i);

    await user.type(input, 'happy-turtle-jump{Enter}');

    expect(mockValidateMutate).toHaveBeenCalledWith('happy-turtle-jump');
  });

  it('should pre-fill code when initialCode is provided', () => {
    render(<ClaimShareCodeModal {...defaultProps} initialCode="pre-filled-code" />);

    const input = screen.getByPlaceholderText(/e\.g\., happy-turtle-jump/i);
    expect(input).toHaveValue('pre-filled-code');
  });

  it('should show error when validating empty code', async () => {
    const mockToast = jest.fn();
    jest.spyOn(require('@/components/ui/use-toast'), 'useToast').mockReturnValue({
      toast: mockToast,
    });

    const user = userEvent.setup();
    render(<ClaimShareCodeModal {...defaultProps} />);

    const continueButton = screen.getByText(/continue/i);
    await user.click(continueButton);

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Error',
      description: 'Please enter a share code',
      variant: 'destructive',
    });

    expect(mockValidateMutate).not.toHaveBeenCalled();
  });

  it('should close modal on cancel', async () => {
    const user = userEvent.setup();
    render(<ClaimShareCodeModal {...defaultProps} />);

    const cancelButton = screen.getByText(/cancel/i);
    await user.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should reset to initialCode when closed and reopened', () => {
    const { rerender } = render(<ClaimShareCodeModal {...defaultProps} initialCode="test-code" isOpen={false} />);

    // Open modal
    rerender(<ClaimShareCodeModal {...defaultProps} initialCode="test-code" isOpen={true} />);

    const input = screen.getByPlaceholderText(/e\.g\., happy-turtle-jump/i);
    expect(input).toHaveValue('test-code');
  });
});
