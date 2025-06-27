"use client";

import type { Website } from "@databuddy/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Using the actual apiRequest from the websites hook logic
import { apiRequest } from "@/hooks/use-websites";

// Query keys
export const websiteTransferKeys = {
  personal: ["websites", "personal"] as const,
  organization: (orgId: string) => ["websites", "organization", orgId] as const,
};

// The new hook
export function useWebsiteTransfer(organizationId: string) {
  const queryClient = useQueryClient();

  // Fetch personal websites
  const { data: personalWebsites, isLoading: isLoadingPersonal } = useQuery({
    queryKey: websiteTransferKeys.personal,
    queryFn: () => transferApi.getWebsites(),
  });

  // Fetch organization websites
  const { data: organizationWebsites, isLoading: isLoadingOrg } = useQuery({
    queryKey: websiteTransferKeys.organization(organizationId),
    queryFn: () => transferApi.getWebsites(organizationId),
    enabled: !!organizationId,
  });

  // Transfer mutation
  const transferMutation = useMutation({
    mutationFn: ({
      websiteId,
      destination,
    }: {
      websiteId: string;
      destination: { organizationId?: string | null };
    }) => transferApi.transfer(websiteId, destination),
    onSuccess: () => {
      toast.success("Website transferred successfully");
      queryClient.invalidateQueries({ queryKey: ["websites"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to transfer website");
    },
  });

  return {
    personalWebsites: personalWebsites || [],
    organizationWebsites: organizationWebsites || [],
    isLoading: isLoadingPersonal || isLoadingOrg,
    isTransferring: transferMutation.isPending,
    transferWebsite: transferMutation.mutate,
  };
}

const transferApi = {
  getWebsites: async (organizationId?: string): Promise<Website[]> => {
    // Construct endpoint based on whether an organizationId is provided
    const endpoint = organizationId ? `/websites?organizationId=${organizationId}` : "/websites";

    const result = await apiRequest<Website[]>(endpoint);
    if (result.error) throw new Error(result.error);
    return result.data || [];
  },
  transfer: async (
    websiteId: string,
    destination: { organizationId?: string | null }
  ): Promise<{ success: boolean }> => {
    const result = await apiRequest<{ success: boolean }>(`/websites/${websiteId}/transfer`, {
      method: "POST",
      body: JSON.stringify(destination),
    });
    if (result.error) throw new Error(result.error);
    if (!result.data) throw new Error("No data returned from transfer");
    return result.data;
  },
};
