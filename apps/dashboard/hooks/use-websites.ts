"use client";

import { authClient } from "@databuddy/auth/client";
import type { CreateWebsiteData, Website } from "@databuddy/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";

// Re-export types for backward compatibility
export type { Website, CreateWebsiteData };

// API client functions
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  const response = await fetch(`${API_BASE_URL}/v1${endpoint}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP error! status: ${response.status}`);
  }

  return data;
}

const websiteApi = {
  getById: async (id: string): Promise<Website | null> => {
    const result = await apiRequest<Website>(`/websites/${id}`);
    if (result.error) throw new Error(result.error);
    return result.data || null;
  },

  getByProject: async (projectId: string): Promise<Website[]> => {
    const result = await apiRequest<Website[]>(`/websites/project/${projectId}`);
    if (result.error) throw new Error(result.error);
    return result.data || [];
  },

  update: async (id: string, name: string): Promise<Website> => {
    const result = await apiRequest<Website>(`/websites/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
    if (result.error) throw new Error(result.error);
    if (!result.data) throw new Error("No data returned from update website");
    return result.data;
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    const result = await apiRequest<{ success: boolean }>(`/websites/${id}`, {
      method: "DELETE",
    });
    if (result.error) throw new Error(result.error);
    if (!result.data) throw new Error("No data returned from delete website");
    return result.data;
  },
};

// Query keys
export const websiteKeys = {
  all: ["websites"] as const,
  lists: () => [...websiteKeys.all, "list"] as const,
  list: (filters: string) => [...websiteKeys.lists(), { filters }] as const,
  details: () => [...websiteKeys.all, "detail"] as const,
  detail: (id: string) => [...websiteKeys.details(), id] as const,
};

// Helper hook for getting a single website
export function useWebsite(id: string) {
  return useQuery({
    queryKey: ["websites", id],
    queryFn: () => websiteApi.getById(id),
    enabled: !!id,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

// Helper hook for getting project websites
export function useProjectWebsites(projectId: string) {
  return useQuery({
    queryKey: ["websites", "project", projectId],
    queryFn: () => websiteApi.getByProject(projectId),
    enabled: !!projectId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useWebsites() {
  const queryClient = useQueryClient();
  const { data: activeOrganization } = authClient.useActiveOrganization();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["websites", activeOrganization?.id || "personal"],
    queryFn: async () => {
      const endpoint = activeOrganization?.id
        ? `/websites?organizationId=${activeOrganization.id}`
        : "/websites";

      const result = await apiRequest<Website[]>(endpoint);
      if (result.error) throw new Error(result.error);
      return result.data || [];
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (isError) {
      toast.error("Failed to fetch websites");
    }
  }, [isError]);

  const createMutation = useMutation<Website, Error, CreateWebsiteData>({
    mutationFn: async (data: CreateWebsiteData) => {
      const endpoint = activeOrganization?.id
        ? `/websites?organizationId=${activeOrganization.id}`
        : "/websites";

      const result = await apiRequest<Website>(endpoint, {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (result.error) throw new Error(result.error);
      if (!result.data) throw new Error("No data returned from create website");
      return result.data;
    },
    onSuccess: () => {
      toast.success("Website created successfully");
      queryClient.invalidateQueries({ queryKey: ["websites"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create website");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => websiteApi.update(id, name),
    onSuccess: () => {
      toast.success("Website updated successfully");
      queryClient.invalidateQueries({ queryKey: ["websites"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update website");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: websiteApi.delete,
    onSuccess: () => {
      toast.success("Website deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["websites"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete website");
    },
  });

  return {
    websites: data || [],
    isLoading,
    isError,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createWebsite: createMutation.mutate,
    updateWebsite: updateMutation.mutate,
    deleteWebsite: deleteMutation.mutate,
    refetch,
  };
}

// Export API functions for direct use if needed
export { websiteApi };
