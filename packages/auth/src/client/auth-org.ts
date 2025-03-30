"use client"

import { authClient, useUser } from './auth-client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

/**
 * Types for organization-related functions
 */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  createdAt: Date;
}

export interface Member {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  createdAt: Date;
}

export interface Invitation {
  id: string;
  email: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  organizationId: string;
  role: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface Team {
  id: string;
  name: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Hook to use the active organization
 */
export function useActiveOrganization() {
  const { data: activeOrganization, isPending, error } = authClient.useActiveOrganization();
  return { activeOrganization, isLoading: isPending, error };
}

/**
 * Hook to list all organizations the user is a member of
 */
export function useUserOrganizations() {
  const { data: organizations, isPending, error } = authClient.useListOrganizations();
  return { organizations, isLoading: isPending, error };
}

/**
 * Creates a new organization
 */
export async function createOrganization(data: {
  name: string;
  slug: string;
  logo?: string;
}, options?: {
  onSuccess?: (organization: Organization) => void;
  onError?: (error: any) => void;
  setActive?: boolean;
}) {
  try {
    const result = await authClient.organization.create(data);
    
    if (result.data) {
      if (options?.setActive) {
        await setActiveOrganization(result.data.id);
      }
      options?.onSuccess?.(result.data as Organization);
    }
    
    return { success: true, data: result.data };
  } catch (error) {
    options?.onError?.(error);
    return { success: false, error };
  }
}

/**
 * Sets the active organization for the current user
 */
export async function setActiveOrganization(
  organizationId: string,
  options?: {
    onSuccess?: () => void;
    onError?: (error: any) => void;
    router?: any;
  }
) {
  try {
    await authClient.organization.setActive({
      organizationId,
    });
    
    if (options?.router) {
      options.router.refresh();
    }
    
    options?.onSuccess?.();
    return { success: true };
  } catch (error) {
    options?.onError?.(error);
    return { success: false, error };
  }
}

/**
 * Invites a user to an organization
 */
export async function inviteToOrganization(
  email: string,
  role: string | string[],
  options?: {
    organizationId: string;
    teamId?: string;
    onSuccess?: () => void;
    onError?: (error: any) => void;
  }
) {
  try {
    const result = await authClient.organization.inviteMember({
      email,
      role: role as "member" | "admin" | "owner",
      organizationId: options?.organizationId,
      teamId: options?.teamId
    });
    
    options?.onSuccess?.();
    return { success: true, data: result };
  } catch (error) {
    options?.onError?.(error);
    return { success: false, error };
  }
}

/**
 * Accepts an organization invitation
 */
export async function acceptInvitation(
  invitationId: string,
  options?: {
    onSuccess?: () => void;
    onError?: (error: any) => void;
    setActive?: boolean;
    router?: any;
  }
) {
  try {
    const result = await authClient.organization.acceptInvitation({
      invitationId,
    });
    
    if (result.data && options?.setActive) {
      await setActiveOrganization(result.data.invitation.organizationId, {
        router: options.router
      });
    }
    
    options?.onSuccess?.();
    return { success: true, data: result.data };
  } catch (error) {
    options?.onError?.(error);
    return { success: false, error };
  }
}

/**
 * Creates a new team in an organization
 */
export async function createTeam(
  name: string,
  options?: {
    organizationId: string;
    onSuccess?: (team: Team) => void;
    onError?: (error: any) => void;
  }
) {
  try {
    const result = await authClient.organization.createTeam({
      name,
      organizationId: options?.organizationId
    });
    
    options?.onSuccess?.(result.data as Team);
    return { success: true, data: result.data };
  } catch (error) {
    options?.onError?.(error);
    return { success: false, error };
  }
}

/**
 * Removes a user from an organization
 */
export async function removeMember(
  memberIdOrEmail: string,
  options?: {
    organizationId: string;
    onSuccess?: () => void;
    onError?: (error: any) => void;
  }
) {
  try {
    await authClient.organization.removeMember({
      memberIdOrEmail,
      organizationId: options?.organizationId
    });
    
    options?.onSuccess?.();
    return { success: true };
  } catch (error) {
    options?.onError?.(error);
    return { success: false, error };
  }
}

/**
 * Updates a member's role in an organization
 */
export async function updateMemberRole(
  memberId: string,
  role: string | string[],
  options?: {
    organizationId: string;
    onSuccess?: () => void;
    onError?: (error: any) => void;
  }
) {
  try {
    await authClient.organization.updateMemberRole({
      memberId,
      role: role as "member" | "admin" | "owner",
      organizationId: options?.organizationId
    });
    
    options?.onSuccess?.();
    return { success: true };
  } catch (error) {
    options?.onError?.(error);
    return { success: false, error };
  }
}

/**
 * Checks if a user has a specific permission in the organization
 */
export async function hasPermission(
  permission: Record<string, string[]>,
  options?: {
    organizationId: string;
    onSuccess?: (hasPermission: boolean) => void;
    onError?: (error: any) => void;
  }
) {
  try {
    const result = await authClient.organization.hasPermission({
      permission,
      organizationId: options?.organizationId
    })
    options?.onSuccess?.(result.data?.success || false);
    return { success: true, hasPermission: result.data?.success || false };
  } catch (error) {
    options?.onError?.(error);
    return { success: false, error, hasPermission: false };
  }
}

/**
 * Component hook for checking organization permissions
 */
export function useOrganizationPermission(permission: Record<string, string[]>) {
  const { user } = useUser();
  const { activeOrganization } = useActiveOrganization();
  
  const checkPermission = async () => {
    if (!user || !activeOrganization) {
      return false;
    }
    
    const { hasPermission: hasAccess } = await hasPermission(permission);
    return hasAccess;
  };
  
  return {
    checkPermission,
    isLoading: !user || !activeOrganization,
    user,
    activeOrganization
  };
}

/**
 * Component helper for organization selection
 */
export function useOrganizationSelector() {
  const { organizations, isLoading } = useUserOrganizations();
  const { activeOrganization } = useActiveOrganization();
  const router = useRouter();
  
  const selectOrganization = async (organizationId: string) => {
    const result = await setActiveOrganization(organizationId, {
      router,
      onError: (error) => {
        toast.error("Failed to switch organization");
      }
    });
    
    if (result.success) {
      toast.success("Switched organization");
    }
    
    return result.success;
  };
  
  return {
    organizations,
    activeOrganization,
    isLoading,
    selectOrganization
  };
}

/**
 * Update organization details
 */
export async function updateOrganization(
  data: {
    name?: string;
    logo?: string;
    slug?: string;
    metadata?: Record<string, any>;
  },
  options?: {
    organizationId: string;
    onSuccess?: () => void;
    onError?: (error: any) => void;
  }
) {
  try {
    await authClient.organization.update({
      data,
      organizationId: options?.organizationId
    });
    
    options?.onSuccess?.();
    return { success: true };
  } catch (error) {
    options?.onError?.(error);
    return { success: false, error };
  }
}

/**
 * Delete an organization
 */
export async function deleteOrganization(
  options?: {
    organizationId: string;
    onSuccess?: () => void;
    onError?: (error: any) => void;
  }
) {
  try {
    await authClient.organization.delete({
      organizationId: options?.organizationId
    });
    
    options?.onSuccess?.();
    return { success: true };
  } catch (error) {
    options?.onError?.(error);
    return { success: false, error };
  }
} 