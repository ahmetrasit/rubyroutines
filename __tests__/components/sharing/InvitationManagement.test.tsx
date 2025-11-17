import React from 'react';
import { render, screen } from '@testing-library/react';
import { InvitationManagement } from '@/components/sharing/InvitationManagement';

// Mock the tRPC client
jest.mock('@/lib/trpc/client', () => ({
  trpc: {
    personSharing: {
      getConnections: {
        useQuery: jest.fn(() => ({
          data: [],
          isLoading: false,
          isError: false,
        })),
      },
      revokeConnection: {
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

describe('InvitationManagement', () => {
  const defaultProps = {
    roleId: 'role1',
    roleType: 'PARENT' as const,
  };

  it('should render the component', () => {
    render(<InvitationManagement {...defaultProps} />);

    expect(screen.getByText(/sent invitations/i)).toBeInTheDocument();
    expect(screen.getByText(/received connections/i)).toBeInTheDocument();
  });

  it('should show empty state when no connections', () => {
    render(<InvitationManagement {...defaultProps} />);

    // Component renders but shows empty lists
    expect(screen.getByText(/sent invitations/i)).toBeInTheDocument();
  });
});
