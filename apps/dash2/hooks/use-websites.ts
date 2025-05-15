"use client";

import { useEffect } from 'react';
import { useWebsitesStore } from '@/stores/use-websites-store';
import { toast } from 'sonner';
import { 
  createWebsite as createWebsiteAction, 
  deleteWebsite as deleteWebsiteAction, 
  getUserWebsites,
  updateWebsite as updateWebsiteAction,
  getWebsiteById
} from "@/app/actions/websites";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Website {
  id: string;
  name: string | null;
  // The domain can be either a string or an object depending on how it's returned from the API
  domain: string | { 
    id: string;
    name: string;
    verificationStatus: string;
    verificationToken: string | null;
    verifiedAt: string | null;
    userId: string | null;
    projectId: string | null;
    dnsRecords: any;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
  };
  userId?: string | null;
  projectId?: string | null;
  domainId?: string | null;
  createdAt: string;
  updatedAt: string;
  status?: string;
  domainData?: {
    id: string;
    name: string;
    verificationStatus: string;
    verificationToken: string | null;
    verifiedAt: string | null;
    userId: string | null;
    projectId: string | null;
    dnsRecords: any;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
  } | null;
}

interface CreateWebsiteData {
  name: string;
  domainId: string;
  domain: string;
  subdomain?: string;
}

// Query keys
export const websiteKeys = {
  all: ['websites'] as const,
  lists: () => [...websiteKeys.all, 'list'] as const,
  list: (filters: string) => [...websiteKeys.lists(), { filters }] as const,
  details: () => [...websiteKeys.all, 'detail'] as const,
  detail: (id: string) => [...websiteKeys.details(), id] as const,
};

export function useWebsites() {
  // Get store actions directly. Avoid subscribing to the whole store if only actions are needed.
  const { 
    setIsCreating, 
    setIsUpdating, 
    setIsDeleting,
    clearSelectedOnDelete 
  } = useWebsitesStore.getState(); 
  
  const queryClient = useQueryClient();
  
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: websiteKeys.lists(),
    queryFn: async () => {
      try {
        const result = await getUserWebsites();
        if (result.error) throw new Error(result.error);
        return result.data || [];
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

  const createMutation = useMutation({
    mutationFn: async (data: CreateWebsiteData) => {
      const result = await createWebsiteAction(data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onMutate: () => {
      setIsCreating(true);
    },
    onSuccess: () => {
      toast.success("Website created successfully");
      queryClient.invalidateQueries({ queryKey: websiteKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create website');
    },
    onSettled: () => {
      setIsCreating(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const result = await updateWebsiteAction(id, name);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onMutate: () => {
      setIsUpdating(true);
    },
    onSuccess: () => {
      toast.success("Website updated successfully");
      queryClient.invalidateQueries({ queryKey: websiteKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update website');
    },
    onSettled: () => {
      setIsUpdating(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteWebsiteAction(id);
      if (result.error) throw new Error(result.error);
      // Pass id to onSuccess to use it for store update
      return { data: result.data, id }; 
    },
    onMutate: () => {
      setIsDeleting(true);
    },
    onSuccess: ({ id }) => { // Destructure id from the mutation result
      toast.success("Website deleted successfully");
      clearSelectedOnDelete(id); // Clear selected if it was the one deleted
      queryClient.invalidateQueries({ queryKey: websiteKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete website');
    },
    onSettled: () => {
      setIsDeleting(false);
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

// Hook to get a single website by ID
export function useWebsite(id: string) {
  const queryClient = useQueryClient();
  
  return useQuery<Website | null, Error>({
    queryKey: websiteKeys.detail(id),
    queryFn: async () => {
      if (!id) return null;
      
      const websitesData = queryClient.getQueryData<Website[]>(websiteKeys.lists());
      const cachedWebsite = websitesData?.find(website => website.id === id);
      if (cachedWebsite) {
        return cachedWebsite;
      }
      
      console.log(`Website with ID ${id} not found in cache, fetching from server...`);
      const result = await getWebsiteById(id);
      
      if (result.error) {
        toast.error(`Failed to fetch website: ${result.error}`);
        throw new Error(result.error);
      }
      
      if (!result.data) {
        // Using toast.message for neutral information. 
        // If this should be an error state, toast.error might be more appropriate.
        toast.message(`Website with ID ${id} not found on server.`);
        return null; 
      }
      
      return result.data as Website; // Cast to Website type
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
} 