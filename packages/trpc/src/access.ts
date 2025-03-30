import { db, Role } from "@databuddy/db";
import { TRPCError } from '@trpc/server';

// Cache duration in seconds
const CACHE_DURATION = 5 * 60; // 5 minutes

/**
 * Simple in-memory cache implementation
 * In production, you'd want to use Redis or another distributed cache
 */
class Cache {
  private cache: Map<string, { value: any; expiresAt: number }> = new Map();

  set(key: string, value: any, ttlSeconds: number): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiresAt });
  }

  get(key: string): any {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

const cache = new Cache();

/**
 * Decorator function to cache the results of async functions
 */
function cacheable<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  ttlSeconds: number = CACHE_DURATION
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const key = `${fn.name}:${JSON.stringify(args)}`;
    const cachedResult = cache.get(key);
    
    if (cachedResult !== null) {
      return cachedResult;
    }
    
    const result = await fn(...args);
    cache.set(key, result, ttlSeconds);
    return result;
  }) as T;
}

/**
 * Get a project by ID
 */
async function getProjectById(projectId: string) {
  return db.project.findUnique({
    where: { id: projectId },
    include: {
      organization: true,
    },
  });
}

/**
 * Type definitions for access results
 */
type ProjectAccessResult = {
  hasAccess: boolean;
  role?: Role;
  projectAccess?: any;
};

type OrganizationAccessResult = {
  hasAccess: boolean;
  role?: Role;
  member?: any;
};

type ClientAccessResult = {
  hasAccess: boolean;
  role?: Role;
  through?: 'organization' | 'project';
  projectId?: string;
};

/**
 * Check if a user has access to a project
 */
export async function getProjectAccess({
  userId,
  projectId,
}: {
  userId: string;
  projectId: string;
}): Promise<ProjectAccessResult> {
  try {
    // Check if user has access to the project
    const project = await getProjectById(projectId);
    if (!project?.organizationId) {
      return { hasAccess: false };
    }

    const [projectAccess, member] = await Promise.all([
      db.projectAccess.findMany({
        where: {
          userId,
          projectId,
        },
      }),
      db.member.findFirst({
        where: {
          organizationId: project.organizationId,
          userId,
        },
      }),
    ]);

    // If user is a member of the organization and has no specific project access,
    // they inherit organization-level access
    if (projectAccess.length === 0 && member) {
      // Organization admins and owners have full access to all projects
      if (member.role === Role.ADMIN || member.role === Role.OWNER) {
        return {
          hasAccess: true,
          role: member.role as Role,
        };
      }
      
      // Other members have viewer access by default
      return {
        hasAccess: true,
        role: member.role as Role,
      };
    }

    // Check specific project access
    const access = projectAccess[0];
    if (access) {
      return {
        hasAccess: true,
        role: access.role as Role,
        projectAccess: access,
      };
    }

    return { hasAccess: false };
  } catch (err) {
    console.error('Error checking project access:', err);
    return { hasAccess: false };
  }
}

/**
 * Cached version of getProjectAccess
 */
export const getProjectAccessCached = cacheable(getProjectAccess, CACHE_DURATION);

/**
 * Check if a user has access to an organization
 */
export async function getOrganizationAccess({
  userId,
  organizationId,
}: {
  userId: string;
  organizationId: string;
}): Promise<OrganizationAccessResult> {
  try {
    const member = await db.member.findFirst({
      where: {
        userId,
        organizationId,
      },
    });

    if (!member) {
      return { hasAccess: false };
    }

    return {
      hasAccess: true,
      role: member.role as Role,
      member,
    };
  } catch (err) {
    console.error('Error checking organization access:', err);
    return { hasAccess: false };
  }
}

/**
 * Cached version of getOrganizationAccess
 */
export const getOrganizationAccessCached = cacheable(getOrganizationAccess, CACHE_DURATION);

/**
 * Check if a user has access to a client
 */
export async function getClientAccess({
  userId,
  clientId,
}: {
  userId: string;
  clientId: string;
}): Promise<ClientAccessResult> {
  try {
    const client = await db.client.findUnique({
      where: { id: clientId },
    });

    if (!client?.organizationId) {
      return { hasAccess: false };
    }

    // Check organization access
    const orgAccess = await getOrganizationAccessCached({
      userId,
      organizationId: client.organizationId,
    });

    if (orgAccess.hasAccess) {
      return {
        hasAccess: true,
        role: orgAccess.role,
        through: 'organization',
      };
    }

    // Check if client is associated with any projects the user has access to
    const projects = await db.project.findMany({
      where: {
        clientId,
      },
    });

    for (const project of projects) {
      const projectAccess = await getProjectAccessCached({
        userId,
        projectId: project.id,
      });

      if (projectAccess.hasAccess) {
        return {
          hasAccess: true,
          role: projectAccess.role,
          through: 'project',
          projectId: project.id,
        };
      }
    }

    return { hasAccess: false };
  } catch (err) {
    console.error('Error checking client access:', err);
    return { hasAccess: false };
  }
}

/**
 * Cached version of getClientAccess
 */
export const getClientAccessCached = cacheable(getClientAccess, CACHE_DURATION);

/**
 * Check if a user can perform a specific action on a project
 */
export async function canAccessProject(
  userId: string,
  projectId: string,
  requiredRole: Role = Role.VIEWER
): Promise<boolean> {
  const access = await getProjectAccessCached({ userId, projectId });
  
  if (!access.hasAccess) {
    return false;
  }
  
  // Admin always has access
  if (access.role === Role.ADMIN) {
    return true;
  }
  
  // Editor can access viewer and editor level resources
  if (access.role === Role.EDITOR) {
    return requiredRole !== Role.ADMIN;
  }
  
  // Viewer can only access viewer level resources
  return requiredRole === Role.VIEWER;
}

/**
 * Check if a user can perform a specific action on an organization
 */
export async function canAccessOrganization(
  userId: string,
  organizationId: string,
  requiredRole: Role = Role.VIEWER
): Promise<boolean> {
  const access = await getOrganizationAccessCached({ userId, organizationId });
  
  if (!access.hasAccess) {
    return false;
  }
  
  // Owner always has access
  if (access.role === Role.OWNER) {
    return true;
  }
  
  // Admin can access everything except owner-specific actions
  if (access.role === Role.ADMIN) {
    return requiredRole !== Role.OWNER;
  }
  
  // Editor can access viewer and editor level resources
  if (access.role === Role.EDITOR) {
    return requiredRole !== Role.ADMIN && requiredRole !== Role.OWNER;
  }
  
  // Viewer can only access viewer level resources
  return requiredRole === Role.VIEWER;
}

/**
 * Middleware to check project access for tRPC procedures
 */
export function requireProjectAccess(
  requiredRole: Role = Role.VIEWER
) {
  return async ({ ctx, next, input }: any) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to access this resource',
      });
    }
    
    const projectId = input.projectId || input.id;
    if (!projectId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Project ID is required',
      });
    }
    
    const hasAccess = await canAccessProject(ctx.user.id, projectId, requiredRole);
    if (!hasAccess) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this project',
      });
    }
    
    return next({
      ctx: {
        ...ctx,
        projectId,
      },
    });
  };
}

/**
 * Middleware to check organization access for tRPC procedures
 */
export function requireOrganizationAccess(
  requiredRole: Role = Role.VIEWER
) {
  return async ({ ctx, next, input }: any) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to access this resource',
      });
    }
    
    const organizationId = input.organizationId || input.id;
    if (!organizationId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Organization ID is required',
      });
    }
    
    const hasAccess = await canAccessOrganization(ctx.user.id, organizationId, requiredRole);
    if (!hasAccess) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this organization',
      });
    }
    
    return next({
      ctx: {
        ...ctx,
        organizationId,
      },
    });
  };
}

/**
 * Clear the access cache for a specific user
 */
export function clearUserAccessCache(userId: string) {
  // In a real implementation with Redis, you'd use a pattern match to clear all keys
  // For our simple cache, we'll just clear everything
  cache.clear();
}
