"use client";

import { QueryClient, QueryClientProvider as TanStackQueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

/**
 * QueryClientProvider wrapper that creates a QueryClient with optimized defaults.
 * 
 * Cache Configuration:
 * - staleTime: Data considered fresh for this duration (no refetch)
 * - gcTime: Unused data kept in cache for this duration
 * - refetchOnWindowFocus: Refetch when user returns to tab
 * - retry: Number of retry attempts on failure
 */
export function QueryClientProvider({ children }: { children: ReactNode }) {
    // Create QueryClient instance (one per app lifetime)
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                // Consider data fresh for 5 minutes (no refetch during this time)
                staleTime: 5 * 60 * 1000, // 5 minutes

                // Keep unused data in cache for 10 minutes
                gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)

                // Refetch when user returns to the tab
                refetchOnWindowFocus: true,

                // Refetch when network reconnects
                refetchOnReconnect: true,

                // Retry failed requests once
                retry: 1,

                // Don't refetch on mount if data is fresh
                refetchOnMount: false,
            },
        },
    }));

    return (
        <TanStackQueryClientProvider client={queryClient}>
            {children}
        </TanStackQueryClientProvider>
    );
}
