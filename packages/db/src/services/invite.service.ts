// import { prisma } from '../client';
// import { Prisma, Invite, Role } from '../client';
// import { createLogger } from '@databuddy/logger';
// // import { cacheable } from '@databuddy/redis';
// import { randomUUID, randomBytes } from 'crypto';

// const logger = createLogger('invite-service');

// type InviteWithRelations = Invite & {
//   Organization: any;
//   createdBy: any;
// };

// export class InviteService {
//   static generateToken(): string {
//     return randomBytes(32).toString('hex');
//   }

//   static async create(data: Omit<Prisma.InviteCreateInput, 'token'>) {
//     try {
//       const token = randomUUID();
//       return await prisma.invite.create({
//         data: {
//           ...data,
//           token,
//           expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
//         },
//         include: {
//           organization: true,
//           createdBy: true,
//         },
//       });
//     } catch (error) {
//       logger.error('Failed to create invite', { error });
//       throw error;
//     }
//   }

//   static findById = /*cacheable(*/async (id: string): Promise<InviteWithRelations | null> => {
//     try {
//       return await prisma.invite.findUnique({
//         where: { id },
//         include: {
//           organization: true,
//           createdBy: true,
//         },
//       });
//     } catch (error) {
//       logger.error('Failed to find invite', { error, id });
//       throw error;
//     }
//   }/*)*/;

//   static findByToken = /*cacheable(*/async (token: string): Promise<InviteWithRelations | null> => {
//     try {
//       return await prisma.invite.findUnique({
//         where: { token },
//         include: {
//           organization: true,
//           createdBy: true,
//         },
//       });
//     } catch (error) {
//       logger.error('Failed to find invite by token', { error, token });
//       throw error;
//     }
//   }/*)*/;

//   static findByOrganization = /*cacheable(*/async (organizationId: string): Promise<InviteWithRelations[]> => {
//     try {
//       return await prisma.invite.findMany({
//         where: { 
//           organizationId,
//           acceptedAt: null,
//           expires: { gt: new Date() }
//         },
//         include: {
//           organization: true,
//           createdBy: true,
//         },
//         orderBy: { createdAt: 'desc' },
//       });
//     } catch (error) {
//       logger.error('Failed to find invites by organization', { error, organizationId });
//       throw error;
//     }
//   }/*)*/;

//   static findByEmail = /*cacheable(*/async (email: string): Promise<InviteWithRelations[]> => {
//     try {
//       return await prisma.invite.findMany({
//         where: { 
//           email,
//           acceptedAt: null,
//           expires: { gt: new Date() }
//         },
//         include: {
//           organization: true,
//           createdBy: true,
//         },
//         orderBy: { createdAt: 'desc' },
//       });
//     } catch (error) {
//       logger.error('Failed to find invites by email', { error, email });
//       throw error;
//     }
//   }/*)*/;

//   static async accept(token: string, userId: string) {
//     try {
//       const invite = await prisma.invite.update({
//         where: { 
//           token,
//           acceptedAt: null,
//           expires: { gt: new Date() }
//         },
//         data: { 
//           acceptedAt: new Date(),
//         },
//       });

//       // Create organization membership
//       await prisma.member.create({
//         data: {
//           email: invite.email,
//           organization: {
//             connect: { id: invite.organizationId }
//           },
//           user: {
//             connect: { id: userId }
//           },
//           role: invite.role,
//         },
//       });

//       // Invalidate caches
//       // await InviteService.findById.invalidate(invite.id);
//       // await InviteService.findByToken.invalidate(token);
//       // await InviteService.findByOrganization.invalidate(invite.organizationId);
//       // await InviteService.findByEmail.invalidate(invite.email);

//       return invite;
//     } catch (error) {
//       logger.error('Failed to accept invite', { error, token });
//       throw error;
//     }
//   }

//   static async reject(token: string) {
//     try {
//       const invite = await prisma.invite.update({
//         where: { 
//           token,
//           acceptedAt: null,
//           expires: { gt: new Date() }
//         },
//         data: { 
//           acceptedAt: new Date(), // Mark as processed
//         },
//       });

//       // Invalidate caches
//       // await InviteService.findById.invalidate(invite.id);
//       // await InviteService.findByToken.invalidate(token);
//       // await InviteService.findByOrganization.invalidate(invite.organizationId);
//       // await InviteService.findByEmail.invalidate(invite.email);

//       return invite;
//     } catch (error) {
//       logger.error('Failed to reject invite', { error, token });
//       throw error;
//     }
//   }

//   static async cancel(id: string) {
//     try {
//       const invite = await prisma.invite.update({
//         where: { id },
//         data: { 
//           acceptedAt: new Date(), // Mark as processed
//         },
//       });

//       // Invalidate caches
//       // await InviteService.findById.invalidate(id);
//       // await InviteService.findByToken.invalidate(invite.token);
//       // await InviteService.findByOrganization.invalidate(invite.organizationId);
//       // await InviteService.findByEmail.invalidate(invite.email);

//       return invite;
//     } catch (error) {
//       logger.error('Failed to cancel invite', { error, id });
//       throw error;
//     }
//   }

//   static async resend(id: string) {
//     try {
//       const invite = await prisma.invite.update({
//         where: { id },
//         data: { 
//           token: randomUUID(),
//           expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
//           acceptedAt: null, // Reset accepted status
//         },
//       });

//       // Invalidate caches
//       // await InviteService.findById.invalidate(id);
//       // await InviteService.findByToken.invalidate(invite.token);
//       // await InviteService.findByOrganization.invalidate(invite.organizationId);
//       // await InviteService.findByEmail.invalidate(invite.email);

//       return invite;
//     } catch (error) {
//       logger.error('Failed to resend invite', { error, id });
//       throw error;
//     }
//   }
// } 