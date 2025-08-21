import { websitesApi } from '@databuddy/auth';
import { db, invitation, organization } from '@databuddy/db';
import {
	getPendingInvitationsSchema,
	uploadOrganizationLogoSchema,
} from '@databuddy/validation';
import { TRPCError } from '@trpc/server';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { s3 } from '../utils/s3';

export const organizationsRouter = createTRPCRouter({
	uploadLogo: protectedProcedure
		.input(
			uploadOrganizationLogoSchema.extend({
				fileData: z.string().min(1, 'File data is required'),
				fileName: z.string().min(1, 'File name is required'),
				fileType: z.string().min(1, 'File type is required'),
			})
		)
		.mutation(async ({ input, ctx }) => {
			const { success } = await websitesApi.hasPermission({
				headers: ctx.headers,
				body: { permissions: { organization: ['manage_logo'] } },
			});
			if (!success) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message:
						'You do not have permission to manage this organization logo.',
				});
			}

			// Get organization
			const [org] = await db
				.select()
				.from(organization)
				.where(eq(organization.id, input.organizationId))
				.limit(1);

			if (!org) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Organization not found.',
				});
			}

			try {
				// Delete old logo if it exists
				if (org.logo) {
					await s3.deleteOrganizationLogo(org.logo);
				}

				// Type check the input since it's extended
				if (
					typeof input.fileData !== 'string' ||
					typeof input.fileName !== 'string' ||
					typeof input.fileType !== 'string'
				) {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message: 'Invalid file data format',
					});
				}

				const base64Data = input.fileData.split(',')[1];
				if (!base64Data) {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message: 'Invalid file data format',
					});
				}
				const buffer = Buffer.from(base64Data, 'base64');
				const file = new File([buffer], input.fileName, {
					type: input.fileType,
				});

				const logoUrl = await s3.uploadOrganizationLogo(
					input.organizationId,
					file
				);

				// Update organization with new logo URL
				const [updatedOrganization] = await db
					.update(organization)
					.set({ logo: logoUrl })
					.where(eq(organization.id, input.organizationId))
					.returning();

				return {
					organization: updatedOrganization,
					logoUrl,
				};
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to upload organization logo',
					cause: error,
				});
			}
		}),

	deleteLogo: protectedProcedure
		.input(uploadOrganizationLogoSchema)
		.mutation(async ({ input, ctx }) => {
			const { success } = await websitesApi.hasPermission({
				headers: ctx.headers,
				body: { permissions: { organization: ['manage_logo'] } },
			});
			if (!success) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message:
						'You do not have permission to manage this organization logo.',
				});
			}

			// Get organization
			const [org] = await db
				.select()
				.from(organization)
				.where(eq(organization.id, input.organizationId))
				.limit(1);

			if (!org) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Organization not found.',
				});
			}

			try {
				// Delete logo if it exists
				if (org.logo) {
					await s3.deleteOrganizationLogo(org.logo);
				}

				// Remove logo URL from database
				const [updatedOrganization] = await db
					.update(organization)
					.set({ logo: null })
					.where(eq(organization.id, input.organizationId))
					.returning();

				return {
					organization: updatedOrganization,
					success: true,
				};
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to delete organization logo',
					cause: error,
				});
			}
		}),

	getPendingInvitations: protectedProcedure
		.input(getPendingInvitationsSchema)
		.query(async ({ input, ctx }) => {
			const { success } = await websitesApi.hasPermission({
				headers: ctx.headers,
				body: { permissions: { organization: ['read'] } },
			});
			if (!success) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message:
						'You do not have permission to view invitations for this organization.',
				});
			}

			const [org] = await db
				.select()
				.from(organization)
				.where(eq(organization.id, input.organizationId))
				.limit(1);

			if (!org) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Organization not found.',
				});
			}

			try {
				const conditions = [
					eq(invitation.organizationId, input.organizationId),
				];

				if (!input.includeExpired) {
					conditions.push(eq(invitation.status, 'pending'));
				}

				const invitations = await db
					.select({
						id: invitation.id,
						email: invitation.email,
						role: invitation.role,
						status: invitation.status,
						expiresAt: invitation.expiresAt,
						inviterId: invitation.inviterId,
					})
					.from(invitation)
					.where(and(...conditions))
					.orderBy(desc(invitation.expiresAt));

				return invitations;
			} catch (error) {
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to fetch pending invitations',
					cause: error,
				});
			}
		}),
});
