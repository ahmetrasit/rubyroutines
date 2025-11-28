'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { useState } from 'react';
import { trpc } from './client';
import superjson from 'superjson';

function getBaseUrl() {
  if (typeof window !== 'undefined') return '';
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cache configuration
            staleTime: 60 * 1000, // 1 minute default - data considered fresh for this period
            gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache after unmount (formerly cacheTime in React Query v4)
            refetchOnWindowFocus: false, // Don't refetch on every tab focus
            refetchOnReconnect: 'always', // Always refetch on reconnect
            refetchInterval: false, // No automatic polling by default

            // Retry configuration
            retry: (failureCount, error: any) => {
              // Don't retry on client errors (4xx)
              if (error?.data?.httpStatus >= 400 && error?.data?.httpStatus < 500) {
                return false;
              }
              // Retry only once for most queries (reduced from 3)
              return failureCount < 1;
            },
            retryDelay: (attemptIndex) => {
              // Exponential backoff: 1s, 2s, 4s
              return Math.min(1000 * Math.pow(2, attemptIndex), 10000);
            },
          },
          mutations: {
            retry: (failureCount, error: any) => {
              // Don't retry on client errors or validation errors
              if (error?.data?.httpStatus >= 400 && error?.data?.httpStatus < 500) {
                return false;
              }
              // Don't retry on explicit business logic errors
              if (error?.data?.code === 'BAD_REQUEST') return false;
              if (error?.data?.code === 'FORBIDDEN') return false;
              if (error?.data?.code === 'NOT_FOUND') return false;
              if (error?.data?.code === 'CONFLICT') return false;
              // Retry up to 2 times for server/network errors (mutations are more sensitive)
              return failureCount < 2;
            },
            retryDelay: (attemptIndex) => {
              // Exponential backoff: 1s, 2s
              return Math.min(1000 * Math.pow(2, attemptIndex), 5000);
            },
          },
        },
      })
  );
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
