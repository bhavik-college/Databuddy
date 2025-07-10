import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';
import { and, eq, isNull, websites } from '@databuddy/db';
import { TRPCError } from '@trpc/server';
import { nanoid } from 'nanoid';
import { checkAndTrackWebsiteCreation, getBillingCustomerId, trackWebsiteUsage } from '../utils/billing';
import { authorizeWebsiteAccess } from '../utils/auth';
import { logger as discordLogger } from '../utils/discord-webhook';

const createWebsiteSchema = z.object({
    name: z
        .string()
        .min(1)
        .max(100)
        .regex(/^[a-zA-Z0-9\s\-_.]+$/, "Invalid website name format"),
    domain: z.preprocess((val) => {
        if (typeof val !== "string") {
            return val;
        }
        let domain = val.trim();
        if (domain.startsWith("http://") || domain.startsWith("https://")) {
            try {
                domain = new URL(domain).hostname;
            } catch (e) {
                // let validation fail
            }
        }
        return domain;
    }, z.string()
        .min(1)
        .max(253)
        .regex(
            /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/,
            "Invalid domain format"
        )),
    subdomain: z
        .string()
        .max(63)
        .regex(/^[a-zA-Z0-9-]*$/, "Invalid subdomain format")
        .optional(),
    organizationId: z.string().optional(),
});

const updateWebsiteSchema = z.object({
    id: z.string(),
    name: z
        .string()
        .min(1)
        .max(100)
        .regex(/^[a-zA-Z0-9\s\-_.]+$/, 'Invalid website name format'),
});

const transferWebsiteSchema = z.object({
    websiteId: z.string(),
    organizationId: z.string().optional(),
});

export const websitesRouter = createTRPCRouter({
    list: protectedProcedure
        .input(z.object({ organizationId: z.string().optional() }).default({}))
        .query(async ({ ctx, input }) => {
            const where = input.organizationId
                ? eq(websites.organizationId, input.organizationId)
                : and(eq(websites.userId, ctx.user.id), isNull(websites.organizationId));

            return ctx.db.query.websites.findMany({
                where,
                orderBy: (websites, { desc }) => [desc(websites.createdAt)],
            });
        }),

    getById: publicProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            return authorizeWebsiteAccess(ctx, input.id, 'read');
        }),

    create: protectedProcedure
        .input(createWebsiteSchema)
        .mutation(async ({ ctx, input }) => {
            if (input.organizationId) {
                const { success } = await ctx.auth.api.hasPermission({
                    headers: ctx.headers,
                    body: { permissions: { website: ['create'] } }
                });
                if (!success) {
                    throw new TRPCError({ code: 'FORBIDDEN', message: 'Missing organization permissions.' });
                }
            }

            const customerId = await getBillingCustomerId(ctx.user.id, input.organizationId);
            const limitCheck = await checkAndTrackWebsiteCreation(customerId);
            if (!limitCheck.allowed) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: limitCheck.error });
            }

            const fullDomain = input.subdomain
                ? `${input.subdomain}.${input.domain}`
                : input.domain;

            const existingWebsite = await ctx.db.query.websites.findFirst({
                where: and(
                    eq(websites.domain, fullDomain),
                    input.organizationId
                        ? eq(websites.organizationId, input.organizationId)
                        : and(eq(websites.userId, ctx.user.id), isNull(websites.organizationId))
                ),
            });

            if (existingWebsite) {
                const location = input.organizationId ? 'in this organization' : 'for your account';
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: `A website with the domain "${fullDomain}" already exists ${location}.`
                });
            }

            const [website] = await ctx.db
                .insert(websites)
                .values({
                    id: nanoid(),
                    name: input.name,
                    domain: fullDomain,
                    userId: ctx.user.id,
                    organizationId: input.organizationId,
                    status: 'ACTIVE',
                } as any)
                .returning();

            discordLogger.success(
                "Website Created",
                `New website "${website.name}" was created with domain "${website.domain}"`,
                {
                    websiteId: website.id,
                    domain: website.domain,
                    userId: ctx.user.id,
                    organizationId: website.organizationId,
                }
            );

            return website;
        }),

    update: protectedProcedure
        .input(updateWebsiteSchema)
        .mutation(async ({ ctx, input }) => {
            const originalWebsite = await authorizeWebsiteAccess(ctx, input.id, 'update');

            const [updatedWebsite] = await ctx.db
                .update(websites)
                .set({ name: input.name } as any)
                .where(eq(websites.id, input.id))
                .returning();

            discordLogger.info(
                "Website Updated",
                `Website "${originalWebsite.name}" was renamed to "${updatedWebsite.name}"`,
                {
                    websiteId: updatedWebsite.id,
                    oldName: originalWebsite.name,
                    newName: updatedWebsite.name,
                    userId: ctx.user.id,
                }
            );

            return updatedWebsite;
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const website = await authorizeWebsiteAccess(ctx, input.id, 'delete');
            const customerId = await getBillingCustomerId(ctx.user.id, website.organizationId);

            await ctx.db.delete(websites).where(eq(websites.id, input.id));
            await trackWebsiteUsage(customerId, -1);

            discordLogger.warning(
                "Website Deleted",
                `Website "${website.name}" with domain "${website.domain}" was deleted`,
                {
                    websiteId: website.id,
                    websiteName: website.name,
                    domain: website.domain,
                    userId: ctx.user.id,
                }
            );

            return { success: true };
        }),

    transfer: protectedProcedure
        .input(transferWebsiteSchema)
        .mutation(async ({ ctx, input }) => {
            const website = await authorizeWebsiteAccess(ctx, input.websiteId, 'update');

            if (input.organizationId) {
                const { success } = await ctx.auth.api.hasPermission({
                    headers: ctx.headers,
                    body: { permissions: { website: ['create'] } },
                });
                if (!success) {
                    throw new TRPCError({ code: 'FORBIDDEN', message: 'No permission in target organization.' });
                }
            }

            const [transferred] = await ctx.db
                .update(websites)
                .set({
                    organizationId: input.organizationId || null,
                    userId: input.organizationId ? website.userId : ctx.user.id,
                } as any)
                .where(eq(websites.id, input.websiteId))
                .returning();

            return transferred;
        })
}); 