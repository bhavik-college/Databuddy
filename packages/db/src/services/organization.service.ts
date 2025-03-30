import { prisma } from '../client';
import { Prisma, Role } from '../client';
import { createLogger } from '@databuddy/logger';

const logger = createLogger('organization-service');

export class OrganizationService {
  static async create(data: Prisma.OrganizationCreateInput) {
    try {
      return await prisma.organization.create({ data });
    } catch (error) {
      logger.error('Failed to create organization', { error });
      throw error;
    }
  }

  static async findById(id: string) {
    try {
      return await prisma.organization.findUnique({
        where: { id },
        include: {
          projects: true,
          members: true,
          createdBy: true,
          clients: true,
          invites: true,
        },
      });
    } catch (error) {
      logger.error('Failed to find organization', { error, id });
      throw error;
    }
  }

  static async findByUserId(userId: string) {
    try {
      return await prisma.organization.findMany({
        where: {
          OR: [
            { createdByUserId: userId },
            { members: { some: { userId } } },
          ],
        },
        include: {
          projects: true,
          members: true,
          createdBy: true,
          clients: true,
        },
      });
    } catch (error) {
      logger.error('Failed to find organizations by user', { error, userId });
      throw error;
    }
  }

  static async update(id: string, data: Prisma.OrganizationUpdateInput) {
    try {
      return await prisma.organization.update({
        where: { id },
        data,
      });
    } catch (error) {
      logger.error('Failed to update organization', { error, id });
      throw error;
    }
  }

  static async delete(id: string) {
    try {
      return await prisma.organization.update({
        where: { id },
        data: { deleteAt: new Date() },
      });
    } catch (error) {
      logger.error('Failed to delete organization', { error, id });
      throw error;
    }
  }

  static async addMember(organizationId: string, data: Prisma.MemberCreateInput) {
    try {
      return await prisma.member.create({
        data: {
          ...data,
          organization: { connect: { id: organizationId } },
        },
      });
    } catch (error) {
      logger.error('Failed to add member to organization', { error, organizationId });
      throw error;
    }
  }

  static async removeMember(organizationId: string, userId: string) {
    try {
      return await prisma.member.deleteMany({
        where: {
          organizationId,
          userId,
        },
      });
    } catch (error) {
      logger.error('Failed to remove member from organization', { error, organizationId, userId });
      throw error;
    }
  }

  static async createInvite(data: Prisma.InviteCreateInput) {
    try {
      return await prisma.invite.create({ data });
    } catch (error) {
      logger.error('Failed to create invite', { error });
      throw error;
    }
  }

  static async acceptInvite(token: string) {
    try {
      return await prisma.invite.update({
        where: { token },
        data: { acceptedAt: new Date() },
      });
    } catch (error) {
      logger.error('Failed to accept invite', { error, token });
      throw error;
    }
  }
} 