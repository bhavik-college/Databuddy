import { websitesApi } from "@databuddy/auth";
import { and, desc, eq, isNull, links } from "@databuddy/db";
import { invalidateLinkCache } from "@databuddy/redis";
import { ORPCError } from "@orpc/server";
import { randomUUIDv7 } from "bun";
import { customAlphabet } from "nanoid";
import { z } from "zod";
import type { Context } from "../orpc";
import { protectedProcedure } from "../orpc";

const generateSlug = customAlphabet(
	"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
	8
);

async function authorizeOrganizationAccess(
	context: Context,
	_organizationId: string,
	permission: "read" | "create" | "update" | "delete" = "read"
): Promise<void> {
	if (!context.user) {
		throw new ORPCError("UNAUTHORIZED", {
			message: "Authentication is required",
		});
	}

	if (context.user.role === "ADMIN") {
		return;
	}

	const headersObj: Record<string, string> = {};
	context.headers.forEach((value, key) => {
		headersObj[key] = value;
	});

	const perm =
		permission === "read"
			? "read"
			: permission === "delete"
				? "delete"
				: "create";
	const { success } = await websitesApi.hasPermission({
		headers: headersObj,
		body: { permissions: { website: [perm] } },
	});

	if (!success) {
		throw new ORPCError("FORBIDDEN", {
			message: "You do not have permission to access this organization",
		});
	}
}

const listLinksSchema = z.object({
	organizationId: z.string(),
});

const getLinkSchema = z.object({
	id: z.string(),
	organizationId: z.string(),
});

const slugRegex = /^[a-zA-Z0-9_-]+$/;

const createLinkSchema = z.object({
	organizationId: z.string(),
	name: z.string().min(1).max(255),
	targetUrl: z.url(),
	slug: z
		.string()
		.min(3)
		.max(50)
		.regex(
			slugRegex,
			"Slug can only contain letters, numbers, hyphens, and underscores"
		)
		.optional(),
	expiresAt: z.date().nullable().optional(),
	expiredRedirectUrl: z.url().nullable().optional(),
	ogTitle: z.string().max(200).nullable().optional(),
	ogDescription: z.string().max(500).nullable().optional(),
	ogImageUrl: z.url().nullable().optional(),
});

const updateLinkSchema = z.object({
	id: z.string(),
	name: z.string().min(1).max(255).optional(),
	targetUrl: z.url().optional(),
	slug: z
		.string()
		.min(3)
		.max(50)
		.regex(
			slugRegex,
			"Slug can only contain letters, numbers, hyphens, and underscores"
		)
		.optional(),
	expiresAt: z.string().datetime().nullable().optional(),
	expiredRedirectUrl: z.url().nullable().optional(),
	ogTitle: z.string().max(200).nullable().optional(),
	ogDescription: z.string().max(500).nullable().optional(),
	ogImageUrl: z.url().nullable().optional(),
});

const deleteLinkSchema = z.object({
	id: z.string(),
});

export const linksRouter = {
	list: protectedProcedure
		.input(listLinksSchema)
		.handler(async ({ context, input }) => {
			await authorizeOrganizationAccess(context, input.organizationId, "read");

			return context.db
				.select()
				.from(links)
				.where(
					and(
						eq(links.organizationId, input.organizationId),
						isNull(links.deletedAt)
					)
				)
				.orderBy(desc(links.createdAt));
		}),

	get: protectedProcedure
		.input(getLinkSchema)
		.handler(async ({ context, input }) => {
			await authorizeOrganizationAccess(context, input.organizationId, "read");

			const result = await context.db
				.select()
				.from(links)
				.where(
					and(
						eq(links.id, input.id),
						eq(links.organizationId, input.organizationId),
						isNull(links.deletedAt)
					)
				)
				.limit(1);

			if (result.length === 0) {
				throw new ORPCError("NOT_FOUND", {
					message: "Link not found",
				});
			}

			return result[0];
		}),

	create: protectedProcedure
		.input(createLinkSchema)
		.handler(async ({ context, input }) => {
			await authorizeOrganizationAccess(
				context,
				input.organizationId,
				"create"
			);

			const url = new URL(input.targetUrl);
			if (url.protocol !== "http:" && url.protocol !== "https:") {
				throw new ORPCError("BAD_REQUEST", {
					message: "Target URL must be an absolute HTTP or HTTPS URL",
				});
			}

			const linkValues = {
				organizationId: input.organizationId,
				createdBy: context.user.id,
				name: input.name,
				targetUrl: input.targetUrl,
				expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
				expiredRedirectUrl: input.expiredRedirectUrl ?? null,
				ogTitle: input.ogTitle ?? null,
				ogDescription: input.ogDescription ?? null,
				ogImageUrl: input.ogImageUrl ?? null,
			};

			if (input.slug) {
				try {
					const linkId = randomUUIDv7();
					const [newLink] = await context.db
						.insert(links)
						.values({
							id: linkId,
							slug: input.slug,
							...linkValues,
						})
						.returning();

					await invalidateLinkCache(input.slug).catch(() => { });

					return newLink;
				} catch (error) {
					const dbError = error as { code?: string; constraint?: string };
					if (
						dbError.code === "23505" &&
						dbError.constraint === "links_slug_unique"
					) {
						throw new ORPCError("CONFLICT", {
							message: "This slug is already taken",
						});
					}
					throw error;
				}
			}

			let slug = "";
			let attempts = 0;
			const maxAttempts = 10;

			while (attempts < maxAttempts) {
				slug = generateSlug();

				try {
					const linkId = randomUUIDv7();
					const [newLink] = await context.db
						.insert(links)
						.values({
							id: linkId,
							slug,
							...linkValues,
						})
						.returning();

					await invalidateLinkCache(slug).catch(() => { });

					return newLink;
				} catch (error) {
					const dbError = error as { code?: string; constraint?: string };
					if (
						dbError.code === "23505" &&
						dbError.constraint === "links_slug_unique"
					) {
						attempts++;
						continue;
					}
					throw error;
				}
			}

			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: "Failed to generate unique slug",
			});
		}),

	update: protectedProcedure
		.input(updateLinkSchema)
		.handler(async ({ context, input }) => {
			const existingLink = await context.db
				.select()
				.from(links)
				.where(and(eq(links.id, input.id), isNull(links.deletedAt)))
				.limit(1);

			if (existingLink.length === 0) {
				throw new ORPCError("NOT_FOUND", {
					message: "Link not found",
				});
			}

			const link = existingLink[0];
			await authorizeOrganizationAccess(context, link.organizationId, "update");

			if (input.targetUrl) {
				const url = new URL(input.targetUrl);
				if (url.protocol !== "http:" && url.protocol !== "https:") {
					throw new ORPCError("BAD_REQUEST", {
						message: "Target URL must be an absolute HTTP or HTTPS URL",
					});
				}
			}

			const { id, expiresAt, ...updates } = input;
			const oldSlug = link.slug;

			try {
				const [updatedLink] = await context.db
					.update(links)
					.set({
						...updates,
						expiresAt: expiresAt !== undefined ? (expiresAt ? new Date(expiresAt) : null) : undefined,
						updatedAt: new Date(),
					})
					.where(eq(links.id, id))
					.returning();

				// Invalidate old slug cache
				await invalidateLinkCache(oldSlug).catch(() => { });

				// If slug changed, also invalidate new slug (in case of negative cache)
				if (input.slug && input.slug !== oldSlug) {
					await invalidateLinkCache(input.slug).catch(() => { });
				}

				return updatedLink;
			} catch (error) {
				const dbError = error as { code?: string; constraint?: string };
				if (
					dbError.code === "23505" &&
					dbError.constraint === "links_slug_unique"
				) {
					throw new ORPCError("CONFLICT", {
						message: "This slug is already taken",
					});
				}
				throw error;
			}
		}),

	delete: protectedProcedure
		.input(deleteLinkSchema)
		.handler(async ({ context, input }) => {
			const existingLink = await context.db
				.select({
					organizationId: links.organizationId,
					slug: links.slug,
				})
				.from(links)
				.where(and(eq(links.id, input.id), isNull(links.deletedAt)))
				.limit(1);

			if (existingLink.length === 0) {
				throw new ORPCError("NOT_FOUND", {
					message: "Link not found",
				});
			}

			const link = existingLink[0];

			await authorizeOrganizationAccess(
				context,
				link.organizationId,
				"delete"
			);

			await context.db
				.update(links)
				.set({ deletedAt: new Date() })
				.where(eq(links.id, input.id));

			// Invalidate the cache for this slug
			await invalidateLinkCache(link.slug).catch(() => { });

			return { success: true };
		}),
};
