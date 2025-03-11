import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { db } from '@databuddy/db';
import { AccessLevel, ProjectType, Role } from '@prisma/client';
import { adminProcedure, protectedProcedure, publicProcedure, router } from '../trpc';
import { requireProjectAccess, requireOrganizationAccess, getProjectAccessCached } from '../access';

export const projectRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().nullish(),
      })
    )
    .use(requireOrganizationAccess(Role.VIEWER))
    .query(async ({ input, ctx }) => {
      const { organizationId, limit, cursor } = input;
      
      const projects = await db.project.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { updatedAt: 'desc' },
        where: { 
          organizationId,
          deletedAt: null,
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      let nextCursor: typeof cursor = undefined;
      if (projects.length > limit) {
        const nextItem = projects.pop();
        nextCursor = nextItem?.id;
      }

      return {
        projects,
        nextCursor,
      };
    }),

  // Get a project by ID
  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .use(requireProjectAccess(AccessLevel.VIEWER))
    .query(async ({ input }) => {
      const { id } = input;
      
      const project = await db.project.findUnique({
        where: { 
          id,
          deletedAt: null,
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              type: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
          access: {
            select: {
              id: true,
              userId: true,
              level: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      return project;
    }),

  // Create a new project
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
        description: z.string().optional(),
        type: z.nativeEnum(ProjectType).default(ProjectType.WEBSITE),
        organizationId: z.string(),
        clientId: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .use(requireOrganizationAccess(Role.EDITOR))
    .mutation(async ({ input, ctx }) => {
      const { organizationId, slug } = input;
      
      // Check if slug is already used in this organization
      const existingProject = await db.project.findFirst({
        where: {
          organizationId,
          slug,
        },
      });

      if (existingProject) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A project with this slug already exists in this organization',
        });
      }

      // Create the project
      const project = await db.project.create({
        data: {
          name: input.name,
          slug: input.slug,
          description: input.description,
          type: input.type,
          organizationId: input.organizationId,
          clientId: input.clientId,
          startDate: input.startDate,
          endDate: input.endDate,
        },
      });

      // Create project access separately
      await db.projectAccess.create({
        data: {
          projectId: project.id,
          userId: ctx.user.id,
          level: AccessLevel.ADMIN,
        },
      });

      return project;
    }),

  // Update a project
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        slug: z.string().min(1).optional(),
        description: z.string().optional(),
        type: z.nativeEnum(ProjectType).optional(),
        clientId: z.string().optional().nullable(),
        startDate: z.date().optional().nullable(),
        endDate: z.date().optional().nullable(),
        status: z.string().optional(),
      })
    )
    .use(requireProjectAccess(AccessLevel.EDITOR))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      
      // If slug is being updated, check if it's already used
      if (data.slug) {
        const project = await db.project.findUnique({
          where: { id },
          select: { organizationId: true },
        });
        
        if (!project) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Project not found',
          });
        }
        
        const existingProject = await db.project.findFirst({
          where: {
            organizationId: project.organizationId,
            slug: data.slug,
            id: { not: id },
          },
        });
        
        if (existingProject) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'A project with this slug already exists in this organization',
          });
        }
      }
      
      // Update the project
      const updatedProject = await db.project.update({
        where: { id },
        data,
      });
      
      return updatedProject;
    }),

  // Delete a project (soft delete)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .use(requireProjectAccess(AccessLevel.ADMIN))
    .mutation(async ({ input }) => {
      const { id } = input;
      
      // Soft delete the project
      await db.project.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
      });
      
      return { success: true };
    }),

  // Get project access for the current user
  access: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const { id } = input;
      const userId = ctx.user.id;
      
      const access = await getProjectAccessCached({ userId, projectId: id });
      
      return access;
    }),

  // Add a user to a project
  addUser: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        userId: z.string(),
        level: z.nativeEnum(AccessLevel).default(AccessLevel.VIEWER),
      })
    )
    .use(requireProjectAccess(AccessLevel.ADMIN))
    .mutation(async ({ input }) => {
      const { projectId, userId, level } = input;
      
      // Check if user already has access
      const existingAccess = await db.projectAccess.findFirst({
        where: {
          projectId,
          userId,
        },
      });
      
      if (existingAccess) {
        // Update existing access
        return db.projectAccess.update({
          where: {
            id: existingAccess.id,
          },
          data: { level },
        });
      }
      
      // Create new access
      return db.projectAccess.create({
        data: {
          projectId,
          userId,
          level,
        },
      });
    }),

  // Remove a user from a project
  removeUser: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        userId: z.string(),
      })
    )
    .use(requireProjectAccess(AccessLevel.ADMIN))
    .mutation(async ({ input, ctx }) => {
      const { projectId, userId } = input;
      
      // Don't allow removing yourself
      if (userId === ctx.user.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You cannot remove yourself from the project',
        });
      }
      
      // Find the access record
      const access = await db.projectAccess.findFirst({
        where: {
          projectId,
          userId,
        },
      });
      
      if (!access) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User does not have access to this project',
        });
      }
      
      // Remove access
      await db.projectAccess.delete({
        where: {
          id: access.id,
        },
      });
      
      return { success: true };
    }),
}); 