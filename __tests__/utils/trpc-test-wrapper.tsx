import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTRPCReact } from '@trpc/react-query';
import { AppRouter } from '@/lib/trpc/routers/_app';

// Create a test query client
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

// Create mock tRPC client
export const createMockTRPCClient = (mockHandlers: any = {}) => {
  const trpcReact = createTRPCReact<AppRouter>();

  const defaultHandlers = {
    personSharing: {
      validateInvite: {
        useMutation: jest.fn(() => ({
          mutate: jest.fn(),
          mutateAsync: jest.fn(),
          isPending: false,
          isLoading: false,
          isError: false,
          error: null,
        })),
      },
      claimInvite: {
        useMutation: jest.fn(() => ({
          mutate: jest.fn(),
          mutateAsync: jest.fn(),
          isPending: false,
          isLoading: false,
          isError: false,
          error: null,
        })),
      },
      generateInvite: {
        useMutation: jest.fn(() => ({
          mutate: jest.fn(),
          mutateAsync: jest.fn(),
          isPending: false,
          isLoading: false,
          isError: false,
          error: null,
        })),
      },
      getConnections: {
        useQuery: jest.fn(() => ({
          data: [],
          isLoading: false,
          isError: false,
          error: null,
        })),
      },
    },
    ...mockHandlers,
  };

  return defaultHandlers;
};

// Test wrapper component
export function TRPCTestWrapper({ children, mockClient }: { children: React.ReactNode; mockClient?: any }) {
  const queryClient = createTestQueryClient();

  // Mock the trpc client
  jest.mock('@/lib/trpc/client', () => ({
    trpc: mockClient || createMockTRPCClient(),
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// Helper to render with tRPC wrapper
export function renderWithTRPC(ui: React.ReactElement, options: { mockClient?: any } = {}) {
  return {
    ...require('@testing-library/react').render(ui, {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <TRPCTestWrapper mockClient={options.mockClient}>{children}</TRPCTestWrapper>
      ),
    }),
  };
}
