"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useSession } from "@databuddy/auth/client"
import { useState, createContext, useContext, useEffect } from "react";
import type { ReactNode } from "react";
import type { session } from "@databuddy/db";

type Session = typeof session.$inferSelect;
// Default query client configuration
const defaultQueryClientOptions = {
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: 1,
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: false,
    },
  },
};

// Create a shared query client for prefetching
export const queryClient = new QueryClient(defaultQueryClientOptions);

// Create a SessionContext
type SessionContextType = {
  session: Session | null;
  isLoading: boolean;
  error: Error | null;
};

const SessionContext = createContext<SessionContextType>({
  session: null,
  isLoading: true,
  error: null,
});

// Custom hook to use the session context
export const useAuthSession = () => useContext(SessionContext);

// SessionProvider component
const SessionProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, isPending, error } = useSession();
  
  // Clear React Query cache when session changes
  useEffect(() => {
    if (!session && !isPending) {
      queryClient.clear();
    }
  }, [session, isPending]);
  
  return (
    <SessionContext.Provider value={{ 
      session: session as Session | null, 
      isLoading: isPending, 
      error: error as Error | null 
    }}>
      {children}
    </SessionContext.Provider>
  );
};

export default function Providers({ children }: { children: React.ReactNode }) {
  // Create a client-specific query client to avoid shared state between users
  const [clientQueryClient] = useState(() => new QueryClient({
    ...defaultQueryClientOptions,
    defaultOptions: {
      ...defaultQueryClientOptions.defaultOptions,
      queries: {
        ...defaultQueryClientOptions.defaultOptions.queries,
        gcTime: 1000 * 60 * 5, // 5 minutes
        staleTime: 1000 * 60 * 2, // 2 minutes
      }
    }
  }));

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryClientProvider client={clientQueryClient}>
        <SessionProvider>
          {children}
        </SessionProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}