"use client";

import { authClient } from "@databuddy/auth/client";
import type { domains } from "@databuddy/db";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";

type Domain = typeof domains.$inferSelect;

interface CreateDomainData {
  name: string;
  projectId?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";

async function apiRequest<T>(
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

const domainApi = {
  getById: async (id: string): Promise<Domain | null> => {
    const result = await apiRequest<Domain>(`/domains/${id}`);
    if (result.error) throw new Error(result.error);
    return result.data || null;
  },

  update: async (id: string, name: string): Promise<Domain> => {
    const result = await apiRequest<Domain>(`/domains/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
    if (result.error) throw new Error(result.error);
    if (!result.data) throw new Error("No data returned from update domain");
    return result.data;
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    const result = await apiRequest<{ success: boolean }>(`/domains/${id}`, {
      method: "DELETE",
    });
    if (result.error) throw new Error(result.error);
    if (!result.data) throw new Error("No data returned from delete domain");
    return result.data;
  },

  verify: async (id: string): Promise<{ verified: boolean; message: string }> => {
    const result = await apiRequest<{ verified: boolean; message: string }>(
      `/domains/${id}/verify`,
      {
        method: "POST",
      }
    );
    if (result.error) throw new Error(result.error);
    if (!result.data) throw new Error("No data returned from verify domain");
    return result.data;
  },

  regenerateToken: async (id: string): Promise<Domain> => {
    const result = await apiRequest<Domain>(`/domains/${id}/regenerate-token`, {
      method: "POST",
    });
    if (result.error) throw new Error(result.error);
    if (!result.data) throw new Error("No data returned from regenerate token");
    return result.data;
  },
};

export function useDomain(id: string) {
  return useQuery({
    queryKey: ["domains", id],
    queryFn: () => domainApi.getById(id),
    enabled: !!id,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useDomains() {
  const queryClient = useQueryClient();
  const { data: activeOrganization } = authClient.useActiveOrganization();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["domains", activeOrganization?.id || "personal"],
    queryFn: async () => {
      const endpoint = activeOrganization?.id
        ? `/domains?organizationId=${activeOrganization.id}`
        : "/domains";

      const result = await apiRequest<Domain[]>(endpoint);
      if (result.error) throw new Error(result.error);
      return result.data || [];
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (isError) {
      toast.error("Failed to fetch domains");
    }
  }, [isError]);

  const createMutation = useMutation<Domain, Error, CreateDomainData>({
    mutationFn: async (data: CreateDomainData) => {
      const endpoint = activeOrganization?.id
        ? `/domains?organizationId=${activeOrganization.id}`
        : "/domains";

      const result = await apiRequest<Domain>(endpoint, {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (result.error) throw new Error(result.error);
      if (!result.data) throw new Error("No data returned from create domain");
      return result.data;
    },
    onSuccess: () => {
      toast.success("Domain created successfully");
      queryClient.invalidateQueries({ queryKey: ["domains"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create domain");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => domainApi.update(id, name),
    onSuccess: () => {
      toast.success("Domain updated successfully");
      queryClient.invalidateQueries({ queryKey: ["domains"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update domain");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: domainApi.delete,
    onSuccess: () => {
      toast.success("Domain deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["domains"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete domain");
    },
  });

  const verifyMutation = useMutation({
    mutationFn: domainApi.verify,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domains"] });
    },
  });

  const regenerateTokenMutation = useMutation({
    mutationFn: domainApi.regenerateToken,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domains"] });
    },
  });

  return {
    domains: data || [],
    isLoading,
    isError,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isVerifying: verifyMutation.isPending,
    isRegenerating: regenerateTokenMutation.isPending,
    createDomain: createMutation.mutate,
    updateDomain: updateMutation.mutate,
    deleteDomain: deleteMutation.mutate,
    verifyDomain: verifyMutation.mutate,
    regenerateToken: regenerateTokenMutation.mutate,
    refetch,
  };
}

export { domainApi };
