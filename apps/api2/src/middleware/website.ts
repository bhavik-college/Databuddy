import { Elysia } from "elysia";
import { db, eq, and, websites, projects } from "@databuddy/db";
import { cacheable } from "@databuddy/redis";
import type { User } from "../lib/auth";
import { WebsiteType } from "../types";

export const getWebsiteById = cacheable(
    async (id: string): Promise<WebsiteType> => {
        return db.query.websites.findFirst({
            where: eq(websites.id, id)
        });
    },
    {
        expireInSec: 300,
        prefix: 'website_by_id',
        staleWhileRevalidate: true,
        staleTime: 60
    }
);

export const verifyWebsiteAccess = cacheable(
    async (userId: string, websiteId: string, role: string): Promise<boolean> => {
        try {
            const website = await getWebsiteById(websiteId);

            if (!website) return false;
            if (website.isPublic) return true;
            if (role === 'ADMIN') return true;
            if (!userId) return false;
            if (website.userId === userId) return true;

            if (website.projectId) {
                const access = await db.query.projects.findFirst({
                    where: and(
                        eq(projects.id, website.projectId),
                        eq(projects.organizationId, userId)
                    )
                });

                return !!access;
            }

            return false;
        } catch (error) {
            console.error('Error verifying website access:', { error, userId, websiteId });
            return false;
        }
    },
    {
        expireInSec: 300,
        prefix: 'website-access',
        staleWhileRevalidate: true,
        staleTime: 60
    }
);

type WebsiteAuthOptions = {
    required?: boolean;
}

export const websiteMiddleware = (options: WebsiteAuthOptions = { required: false }) => {
    return new Elysia({ name: 'middleware.website' })
        .derive(async ({ request, store }) => {
            const user = (store as any).user as User | null;
            const websiteId = request.headers.get('X-Website-Id') || new URL(request.url).searchParams.get('website_id') || new URL(request.url).searchParams.get('websiteId');
            
            if (!websiteId) {
                return { website: null };
            }

            const hasAccess = await verifyWebsiteAccess(user?.id ?? '', websiteId, (user as any)?.role || 'USER');

            if (!hasAccess) {
                return { website: null };
            }

            const website = await getWebsiteById(websiteId);

            return { website };
        })
        .onBeforeHandle(({ website, set }) => {
            if (options.required && !website) {
                set.status = 403;
                return {
                    success: false,
                    error: 'Unauthorized access to website',
                    code: 'UNAUTHORIZED_WEBSITE_ACCESS'
                }
            }
        });
}

export type WebsiteMiddleware = ReturnType<typeof websiteMiddleware>;
