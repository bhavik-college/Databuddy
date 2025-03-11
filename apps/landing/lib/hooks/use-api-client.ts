"use client";

import { useSession } from "@databuddy/auth";
import { useEffect, useState } from "react";
import { AnalyticsApiClient, createApiClient } from "@/lib/api-client";

/**
 * Hook to use the API client with the current session
 * @param trackingId Optional tracking ID for the website
 * @returns The API client instance
 */
export function useApiClient(trackingId?: string): {
  client: AnalyticsApiClient;
  isReady: boolean;
} {
  const { data: session } = useSession();
  const [client, setClient] = useState<AnalyticsApiClient>(() => createApiClient());
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Create a new client when the session or tracking ID changes
    const newClient = createApiClient(
      session?.session?.id || null,
      trackingId || null
    );
    
    setClient(newClient);
    setIsReady(!!session);
  }, [session, trackingId]);

  return { client, isReady };
} 