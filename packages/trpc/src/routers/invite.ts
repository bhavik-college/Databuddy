// import { z } from 'zod';
// import { TRPCError } from '@trpc/server';
// import { Role } from '@databuddy/db';
// import { router, protectedProcedure } from '../trpc';

// const inviteCreateSchema = z.object({
//   email: z.string().email(),
//   organizationId: z.string().uuid(),
//   role: z.nativeEnum(Role).default(Role.VIEWER),
// });

// export const inviteRouter = router({
//   // Create a new invite
//   create: protectedProcedure
//     .input(inviteCreateSchema)
//     .mutation(async ({ ctx, input }) => {
//       try {
//         const invite = await InviteService.create({
//           email: input.email,
//           Organization: {
//             connect: { id: input.organizationId }
//           },
//           role: input.role,
//           createdBy: {
//             connect: { id: ctx.user.id }
//           },
//           expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
//         });
//         return invite;
//       } catch (error) {
//         throw new TRPCError({
//           code: 'INTERNAL_SERVER_ERROR',
//           message: 'Failed to create invite',
//           cause: error,
//         });
//       }
//     }),

//   // Get invite by token
//   byToken: protectedProcedure
//     .input(z.string())
//     .query(async ({ input }) => {
//       const invite = await InviteService.findByToken(input);
//       if (!invite) {
//         throw new TRPCError({ code: 'NOT_FOUND', message: 'Invite not found' });
//       }
//       return invite;
//     }),

//   // List invites by organization
//   byOrganization: protectedProcedure
//     .input(z.string().uuid())
//     .query(async ({ input }) => {
//       try {
//         const invites = await InviteService.findByOrganization(input);
//         return invites;
//       } catch (error) {
//         throw new TRPCError({
//           code: 'INTERNAL_SERVER_ERROR',
//           message: 'Failed to list invites',
//           cause: error,
//         });
//       }
//     }),

//   // Accept invite
//   accept: protectedProcedure
//     .input(z.string())
//     .mutation(async ({ ctx, input }) => {
//       try {
//         const invite = await InviteService.accept(input, ctx.user.id);
//         return invite;
//       } catch (error) {
//         throw new TRPCError({
//           code: 'INTERNAL_SERVER_ERROR',
//           message: 'Failed to accept invite',
//           cause: error,
//         });
//       }
//     }),
// }); 