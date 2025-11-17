import React from 'react';
import { render, screen } from '@testing-library/react';
import { SharePersonModal } from '@/components/sharing/SharePersonModal';

// Mock the tRPC client
jest.mock('@/lib/trpc/client', () => ({
  trpc: {
    personSharing: {
      generateInvite: {
        useMutation: jest.fn(() => ({
          mutate: jest.fn(),
          isPending: false,
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

describe('SharePersonModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    roleId: 'role1',
    roleType: 'PARENT' as const,
    persons: [
      { id: 'person1', name: 'Test Person 1' },
      { id: 'person2', name: 'Test Person 2' },
    ],
  };

  it('should render the modal when open', () => {
    render(<SharePersonModal {...defaultProps} />);

    expect(screen.getByText(/generate share code/i)).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<SharePersonModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText(/generate share code/i)).not.toBeInTheDocument();
  });

  it('should display person list for selection', () => {
    render(<SharePersonModal {...defaultProps} />);

    expect(screen.getByText('Test Person 1')).toBeInTheDocument();
    expect(screen.getByText('Test Person 2')).toBeInTheDocument();
  });
});
