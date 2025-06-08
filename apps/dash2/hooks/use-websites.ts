"use client";

import { useEffect } from 'react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Website {
  id: string;
  name: string | null;
  domain: string;
  userId?: string | null;
  projectId?: string | null;
  domainId?: string | null;
  createdAt: string;
  updatedAt: string;
  status?: "ACTIVE" | "INACTIVE" | "PENDING" | "HEALTHY" | "UNHEALTHY";
  deletedAt?: string | null;
}

export interface CreateWebsiteData {
  name: string;
  domainId: string;
  domain: string;
  subdomain?: string;
}

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
const websiteApi = {
  getAll: async (): Promise<Website[]> => {
    const result = await apiRequest<Website[]>('/websites');
    if (result.error) throw new Error(result.error);
    return result.data || [];
  },

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

  create: async (data: CreateWebsiteData): Promise<Website> => {
    const result = await apiRequest<Website>('/websites', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (result.error) throw new Error(result.error);
    if (!result.data) throw new Error('No data returned from create website');
    return result.data;
  },

  update: async (id: string, name: string): Promise<Website> => {
    const result = await apiRequest<Website>(`/websites/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
    if (result.error) throw new Error(result.error);
    if (!result.data) throw new Error('No data returned from update website');
    return result.data;
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    const result = await apiRequest<{ success: boolean }>(`/websites/${id}`, {
      method: 'DELETE',
    });
    if (result.error) throw new Error(result.error);
    if (!result.data) throw new Error('No data returned from delete website');
    return result.data;
  },
};

// Query keys
export const websiteKeys = {
  all: ['websites'] as const,
  lists: () => [...websiteKeys.all, 'list'] as const,
  list: (filters: string) => [...websiteKeys.lists(), { filters }] as const,
  details: () => [...websiteKeys.all, 'detail'] as const,
  detail: (id: string) => [...websiteKeys.details(), id] as const,
};

// Helper hook for getting a single website
export function useWebsite(id: string) {
  return useQuery({
    queryKey: websiteKeys.detail(id),
    queryFn: async () => {
      return await websiteApi.getById(id);
    },
    enabled: !!id,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
}

// Helper hook for getting project websites
export function useProjectWebsites(projectId: string) {
  return useQuery({
    queryKey: [...websiteKeys.lists(), 'project', projectId],
    queryFn: async () => {
      return await websiteApi.getByProject(projectId);
    },
    enabled: !!projectId,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
}

export function useWebsites() {
  const queryClient = useQueryClient();
  
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: websiteKeys.lists(),
    queryFn: async () => {
      try {
        return await websiteApi.getAll();
      } catch (error) {
        console.error('Error fetching websites:', error);
        throw error;
      }
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
  
  useEffect(() => {
    if (isError) {
      toast.error('Failed to fetch websites');
    }
  }, [isError]);

  const createMutation = useMutation<
    Website,
    Error,
    CreateWebsiteData
  >({
    mutationFn: async (data: CreateWebsiteData) => {
      return await websiteApi.create(data);
    },
    onMutate: () => {
    },
    onSuccess: () => {
      toast.success("Website created successfully");
      queryClient.invalidateQueries({ queryKey: websiteKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create website');
    },
    onSettled: () => {
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      return await websiteApi.update(id, name);
    },
    onMutate: () => {
    },
    onSuccess: () => {
      toast.success("Website updated successfully");
      queryClient.invalidateQueries({ queryKey: websiteKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update website');
    },
    onSettled: () => {
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await websiteApi.delete(id);
      return { data: result, id }; 
    },
    onMutate: () => {
    },
    onSuccess: ({ id }) => { // Destructure id from the mutation result
      toast.success("Website deleted successfully");
      queryClient.invalidateQueries({ queryKey: websiteKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete website');
    },
    onSettled: () => {
    }
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