"use client";

import { useSession } from "@databuddy/auth/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { createContext, useContext, useEffect, useState } from "react";
import type { session } from "@databuddy/db";
import type { ReactNode } from "react";
import { AutumnProvider } from "autumn-js/react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { trpc } from "@/lib/trpc";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";

type Session = typeof session.$inferSelect;

const defaultQueryClientOptions = {
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
      retry: 1,
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30_000),
    },
    mutations: {
      retry: false,
    },
  },
};

export const queryClient = new QueryClient(defaultQueryClientOptions);

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

export const useAuthSession = () => useContext(SessionContext);

const SessionProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, isPending, error } = useSession();

  useEffect(() => {
    if (!(session || isPending)) {
      queryClient.clear();
    }
  }, [session, isPending]);

  return (
    <SessionContext.Provider
      value={{
        session: session as Session | null,
        isLoading: isPending,
        error: error as Error | null,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        ...defaultQueryClientOptions,
        defaultOptions: {
          ...defaultQueryClientOptions.defaultOptions,
          queries: {
            ...defaultQueryClientOptions.defaultOptions.queries,
            gcTime: 1000 * 60 * 5, // 5 minutes
            staleTime: 1000 * 60 * 2, // 2 minutes
          },
        },
      })
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/trpc`,
          fetch: (url, options) =>
            fetch(url, {
              ...options,
              credentials: "include",
            }),
          transformer: superjson,
        }),
      ],
    })
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <SessionProvider>
            <AutumnProvider backendUrl={process.env.NEXT_PUBLIC_API_URL}>
              <NuqsAdapter>{children}</NuqsAdapter>
            </AutumnProvider>
          </SessionProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </ThemeProvider>
  );
}