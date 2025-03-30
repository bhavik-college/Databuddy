import { prisma, ProjectStatus } from '../client';
import { Prisma, Project, ProjectType } from '../client';
import { createLogger } from '@databuddy/logger';
// import { cacheable } from '@databuddy/redis';

const logger = createLogger('project-service');

type ProjectWithRelations = Project & {
  organization: any;
  client?: any;
  access: any[];
  events: any[];
};

export class ProjectService {
  static async create(data: Prisma.ProjectCreateInput) {
    try {
      return await prisma.project.create({ data });
    } catch (error) {
      logger.error('Failed to create project', { error });
      throw error;
    }
  }

  static findById = async (id: string): Promise<ProjectWithRelations | null> => {
    try {
      return await prisma.project.findUnique({
        where: { id },
        include: {
          organization: true,
          client: true,
          access: true,
          events: true,
        },
      });
    } catch (error) {
      logger.error('Failed to find project', { error, id });
      throw error;
    }
  };

  static findBySlug = async (organizationId: string, slug: string): Promise<ProjectWithRelations | null> => {
    try {
      return await prisma.project.findUnique({
        where: { 
          organizationId_slug: {
            organizationId,
            slug
          }
        },
        include: {
          organization: true,
          client: true,
          access: true,
          events: true,
        },
      });
    } catch (error) {
      logger.error('Failed to find project by slug', { error, organizationId, slug });
      throw error;
    }
  };

  static findByOrganization = async (organizationId: string): Promise<ProjectWithRelations[]> => {
    try {
      return await prisma.project.findMany({
        where: { 
          organizationId,
          deletedAt: null
        },
        include: {
          organization: true,
          client: true,
          access: true,
          events: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Failed to find projects by organization', { error, organizationId });
      throw error;
    }
  };

  static findByClient = async (clientId: string): Promise<ProjectWithRelations[]> => {
    try {
      return await prisma.project.findMany({
        where: { 
          clientId,
          deletedAt: null
        },
        include: {
          organization: true,
          client: true,
          access: true,
          events: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Failed to find projects by client', { error, clientId });
      throw error;
    }
  };

  static async update(id: string, data: Prisma.ProjectUpdateInput) {
    try {
      const project = await prisma.project.update({
        where: { id },
        data,
        include: {
          organization: true,
          client: true,
          access: true,
          events: true,
        },
      });
      // Invalidate caches
      // await ProjectService.findById.invalidate(id);
      // await ProjectService.findBySlug.invalidate(project.organizationId, project.slug);
      // await ProjectService.findByOrganization.invalidate(project.organizationId);
      // if (project.clientId) {
      //   await ProjectService.findByClient.invalidate(project.clientId);
      // }
      return project;
    } catch (error) {
      logger.error('Failed to update project', { error, id });
      throw error;
    }
  }

  static async updateStatus(id: string, status: string) {
    try {
      const project = await prisma.project.update({
        where: { id },
        data: { status: status as ProjectStatus },
      });
      // Invalidate caches
      // await ProjectService.findById.invalidate(id);
      // await ProjectService.findBySlug.invalidate(project.organizationId, project.slug);
      // await ProjectService.findByOrganization.invalidate(project.organizationId);
      // if (project.clientId) {
      //   await ProjectService.findByClient.invalidate(project.clientId);
      // }
      return project;
    } catch (error) {
      logger.error('Failed to update project status', { error, id });
      throw error;
    }
  }

  static async delete(id: string) {
    try {
      const project = await prisma.project.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      // Invalidate caches
      // await ProjectService.findById.invalidate(id);
      // await ProjectService.findBySlug.invalidate(project.organizationId, project.slug);
      // await ProjectService.findByOrganization.invalidate(project.organizationId);
      // if (project.clientId) {
      //   await ProjectService.findByClient.invalidate(project.clientId);
      // }
      return project;
    } catch (error) {
      logger.error('Failed to delete project', { error, id });
      throw error;
    }
  }

  static async addAccess(projectId: string, data: Prisma.ProjectAccessCreateInput) {
    try {
      const access = await prisma.projectAccess.create({
        data: {
          ...data,
          project: { connect: { id: projectId } }
        },
      });
      // Invalidate project caches
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (project) {
        // await ProjectService.findById.invalidate(projectId);
        // await ProjectService.findBySlug.invalidate(project.organizationId, project.slug);
        // await ProjectService.findByOrganization.invalidate(project.organizationId);
        // if (project.clientId) {
        //   await ProjectService.findByClient.invalidate(project.clientId);
        // }
      }
      return access;
    } catch (error) {
      logger.error('Failed to add project access', { error, projectId });
      throw error;
    }
  }

  static async removeAccess(projectId: string, userId: string) {
    try {
      const access = await prisma.projectAccess.delete({
        where: {
          projectId_userId: {
            projectId,
            userId
          }
        },
      });
      // Invalidate project caches
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (project) {
        // await ProjectService.findById.invalidate(projectId);
        // await ProjectService.findBySlug.invalidate(project.organizationId, project.slug);
        // await ProjectService.findByOrganization.invalidate(project.organizationId);
        // if (project.clientId) {
        //   await ProjectService.findByClient.invalidate(project.clientId);
        // }
      }
      return access;
    } catch (error) {
      logger.error('Failed to remove project access', { error, projectId, userId });
      throw error;
    }
  }

  static async addEvent(projectId: string, data: Prisma.EventMetaCreateInput) {
    try {
      const event = await prisma.eventMeta.create({
        data: {
          ...data,
          project: { connect: { id: projectId } }
        },
      });
      // Invalidate project caches
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (project) {
        // await ProjectService.findById.invalidate(projectId);
        // await ProjectService.findBySlug.invalidate(project.organizationId, project.slug);
        // await ProjectService.findByOrganization.invalidate(project.organizationId);
        // if (project.clientId) {
        //   await ProjectService.findByClient.invalidate(project.clientId);
        // }
      }
      return event;
    } catch (error) {
      logger.error('Failed to add project event', { error, projectId });
      throw error;
    }
  }
} 