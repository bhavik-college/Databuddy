import { Elysia, t } from "elysia";
import { db } from "@databuddy/db";
import { eq } from "drizzle-orm";
import { websites } from "@databuddy/db";
import { auth } from "@databuddy/auth";
import {
    processAssistantRequest,
    createStreamingResponse,
    type AssistantRequest,
    type AssistantContext
} from "../agent";

// ============================================================================
// SCHEMAS
// ============================================================================

const AssistantRequestSchema = t.Object({
    message: t.String(),
    website_id: t.String(),
    context: t.Optional(t.Object({
        previousMessages: t.Optional(t.Array(t.Object({
            role: t.String(),
            content: t.String()
        })))
    }))
});

// ============================================================================
// ROUTER SETUP
// ============================================================================

export const assistant = new Elysia({ prefix: '/v1/assistant' })
    .derive(async ({ request }) => {
        const session = await auth.api.getSession({
            headers: request.headers
        });

        if (!session?.user) {
            throw new Error('Unauthorized');
        }

        return { user: session.user, session };
    })
    .post('/stream', async ({ body, user }) => {
        const { message, website_id, context } = body;

        // Get website info
        const website = await db.query.websites.findFirst({
            where: eq(websites.id, website_id),
        });

        if (!website?.id) {
            return new Response(JSON.stringify({ error: 'Website not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const assistantRequest: AssistantRequest = {
            message,
            website_id,
            website_hostname: website.domain,
            context
        };

        const assistantContext: AssistantContext = {
            user,
            website,
            debugInfo: {}
        };

        // Process the assistant request and create streaming response
        const updates = processAssistantRequest(assistantRequest, assistantContext);
        return createStreamingResponse(updates);
    }, {
        body: AssistantRequestSchema
    }); 