"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { domains } from '@databuddy/db';

type Domain = typeof domains.$inferSelect;

// API client functions
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  const response = await fetch(`${API_BASE_URL}/v1${endpoint}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
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

// API functions
const domainApi = {
  getAll: async (): Promise<Domain[]> => {
    const result = await apiRequest<Domain[]>('/domains');
    if (result.error) throw new Error(result.error);
    return result.data || [];
  },

  getById: async (id: string): Promise<Domain | null> => {
    const result = await apiRequest<Domain>(`/domains/${id}`);
    if (result.error) throw new Error(result.error);
    return result.data || null;
  },

  getByProject: async (projectId: string): Promise<Domain[]> => {
    const result = await apiRequest<Domain[]>(`/domains/project/${projectId}`);
    if (result.error) throw new Error(result.error);
    return result.data || [];
  },

  create: async (data: CreateDomainData): Promise<Domain> => {
    const result = await apiRequest<Domain>('/domains', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (result.error) throw new Error(result.error);
    if (!result.data) throw new Error('No data returned from create domain');
    return result.data;
  },

  update: async (id: string, data: UpdateDomainData): Promise<Domain> => {
    const result = await apiRequest<Domain>(`/domains/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (result.error) throw new Error(result.error);
    if (!result.data) throw new Error('No data returned from update domain');
    return result.data;
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    const result = await apiRequest<{ success: boolean }>(`/domains/${id}`, {
      method: 'DELETE',
    });
    if (result.error) throw new Error(result.error);
    if (!result.data) throw new Error('No data returned from delete domain');
    return result.data;
  },

  verify: async (id: string): Promise<VerificationResult> => {
    const result = await apiRequest<VerificationResult>(`/domains/${id}/verify`, {
      method: 'POST',
    });
    if (result.error) throw new Error(result.error);
    if (!result.data) throw new Error('No data returned from verify domain');
    return result.data;
  },

  regenerateToken: async (id: string): Promise<Domain> => {
    const result = await apiRequest<Domain>(`/domains/${id}/regenerate-token`, {
      method: 'POST',
    });
    if (result.error) throw new Error(result.error);
    if (!result.data) throw new Error('No data returned from regenerate token');
    return result.data;
  },
};

// Query keys
export const domainKeys = {
  all: ['domains'] as const,
  lists: () => [...domainKeys.all, 'list'] as const,
  list: (filters: string) => [...domainKeys.lists(), { filters }] as const,
  details: () => [...domainKeys.all, 'detail'] as const,
  detail: (id: string) => [...domainKeys.details(), id] as const,
};

interface CreateDomainData {
  name: string;
  userId?: string;
  projectId?: string;
}

interface UpdateDomainData {
  name?: string;
  verificationStatus?: string;
}

interface VerificationResult {
  verified: boolean;
  message: string;
}

export function useDomains() {
  const queryClient = useQueryClient();
  
  // Fetch domains with React Query
  const { data: domains = [], isLoading, isError, refetch } = useQuery({
    queryKey: domainKeys.lists(),
    queryFn: async () => {
      try {
        return await domainApi.getAll();
      } catch (error) {
        console.error('Error fetching domains:', error);
        throw error;
      }
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  // Create domain mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateDomainData) => {
      return await domainApi.create(data);
    },
    onSuccess: () => {
      toast.success("Domain created successfully");
      queryClient.invalidateQueries({ queryKey: domainKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create domain');
    }
  });

  // Update domain mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateDomainData }) => {
      return await domainApi.update(id, data);
    },
    onSuccess: () => {
      toast.success("Domain updated successfully");
      queryClient.invalidateQueries({ queryKey: domainKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update domain');
    }
  });

  // Delete domain mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await domainApi.delete(id);
      return { data: result, id };
    },
    onSuccess: () => {
      toast.success("Domain deleted successfully");
      queryClient.invalidateQueries({ queryKey: domainKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete domain');
    }
  });

  // Verify domain mutation
  const verifyMutation = useMutation({
    mutationFn: async (id: string) => {
      return await domainApi.verify(id);
    },
    onSuccess: (data: VerificationResult) => {
      if (data?.verified) {
        toast.success(data.message || "Domain verified successfully");
      } else if (data) {
        toast.error(data.message || "Domain verification failed");
      }
      queryClient.invalidateQueries({ queryKey: domainKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to verify domain');
    }
  });

  // Regenerate token mutation
  const regenerateMutation = useMutation({
    mutationFn: async (id: string) => {
      return await domainApi.regenerateToken(id);
    },
    onSuccess: () => {
      toast.success("Verification token regenerated successfully");
      queryClient.invalidateQueries({ queryKey: domainKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to regenerate verification token');
    }
  });

  // Extract verified domains
  const verifiedDomains = domains.filter(
    domain => domain.verificationStatus === "VERIFIED"
  );

  return {
    // Data
    domains,
    verifiedDomains,
    
    // UI States
    isLoading,
    isError,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isVerifying: verifyMutation.isPending,
    isRegenerating: regenerateMutation.isPending,
    
    // Actions
    createDomain: createMutation.mutate,
    updateDomain: updateMutation.mutate,
    deleteDomain: deleteMutation.mutate,
    verifyDomain: verifyMutation.mutate,
    regenerateToken: regenerateMutation.mutate,
    refetch
  };
}

// Hook to get a single domain by ID
export function useDomain(id: string) {
  return useQuery({
    queryKey: domainKeys.detail(id),
    queryFn: async () => {
      return await domainApi.getById(id);
    },
    enabled: !!id,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
}

// Helper hook for getting project domains
export function useProjectDomains(projectId: string) {
  return useQuery({
    queryKey: [...domainKeys.lists(), 'project', projectId],
    queryFn: async () => {
      return await domainApi.getByProject(projectId);
    },
    enabled: !!projectId,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
}

// Export API functions for direct use if needed
export { domainApi }; 