'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

/**
 * QueryProvider - Wraps the application with TanStack Query client
 * 
 * Configuration:
 * - 5 minute stale time: Data stays fresh for 5 minutes before refetching
 * - 10 minute cache time: Data persists in cache for 10 minutes
 * - No automatic refetch on window focus (prevents unnecessary requests)
 * - Retry failed requests 1 time only
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data stays fresh for 5 minutes
            staleTime: 5 * 60 * 1000,
            // Keep data in cache for 10 minutes
            gcTime: 10 * 60 * 1000,
            // Don't refetch on window focus (too aggressive for our use case)
            refetchOnWindowFocus: false,
            // Don't refetch on mount if data is still fresh
            refetchOnMount: false,
            // Retry failed requests once
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools only in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      )}
    </QueryClientProvider>
  );
}
