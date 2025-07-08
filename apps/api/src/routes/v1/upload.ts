import { Hono } from "hono";
import { s3 } from "../../lib/s3";
import { authMiddleware } from "../../middleware/auth";
import { rateLimiter } from "../../middleware/rate-limiter";
import type { AppVariables } from "../../types";
import { db, organization, member, and, eq, inArray } from "@databuddy/db";

type UploadContext = {
    Variables: AppVariables
}

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ['image/png', 'image/jpeg', 'image/gif'];

export const uploadRouter = new Hono<UploadContext>();
uploadRouter.use("*", authMiddleware);

uploadRouter.post(
    "/organization/:orgId/logo",
    rateLimiter({
        keyPrefix: "upload-org-logo",
        limit: 5,
        window: 60,
    }),
    async (c) => {
        const { orgId } = c.req.param();
        const user = c.get('user');

        if (!user) {
            return c.json({ error: "Unauthorized" }, 401);
        }

        const orgMember = await db.query.member.findFirst({
            where: and(
                eq(member.organizationId, orgId),
                eq(member.userId, user.id),
                inArray(member.role, ['admin', 'owner'])
            )
        });

        if (!orgMember) {
            return c.json({ error: "Forbidden" }, 403);
        }

        const formData = await c.req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return c.json({ error: "No file provided" }, 400);
        }

        if (file.size > MAX_FILE_SIZE) {
            return c.json({ error: "File size exceeds the 2MB limit." }, 400);
        }

        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            return c.json({ error: "Invalid file type. Only PNG, JPEG, and GIF are allowed." }, 400);
        }

        const currentOrganization = await db.query.organization.findFirst({
            where: eq(organization.id, orgId),
        });

        if (currentOrganization?.logo) {
            await s3.deleteFileFromUrl(currentOrganization.logo);
        }

        const { url } = await s3.uploadFile(file, { isPublic: true });

        if (!url) {
            return c.json({ error: "Failed to upload file" }, 500);
        }

        return c.json({ url });
    }
);