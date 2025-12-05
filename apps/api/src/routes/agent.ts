import { auth, websitesApi } from "@databuddy/auth";
import { smoothStream } from "ai";
import { Elysia, t } from "elysia";
import { buildAppContext, triageAgent } from "../ai";
import { record, setAttributes } from "../lib/tracing";
import { validateWebsite } from "../lib/website-utils";

// Accept both content string and parts array formats (like Midday)
const AgentRequestSchema = t.Object({
	websiteId: t.String(),
	message: t.Object({
		id: t.Optional(t.String()),
		role: t.Union([t.Literal("user"), t.Literal("assistant")]),
		content: t.Optional(t.String()),
		parts: t.Optional(
			t.Array(
				t.Object({
					type: t.String(),
					text: t.Optional(t.String()),
				})
			)
		),
		text: t.Optional(t.String()), // SDK sometimes sends text directly
	}),
	id: t.Optional(t.String()),
	timezone: t.Optional(t.String()),
});

interface UIMessage {
	id: string;
	role: "user" | "assistant";
	parts: Array<{ type: "text"; text: string }>;
}

interface IncomingMessage {
	id?: string;
	role: "user" | "assistant";
	content?: string;
	parts?: Array<{ type: string; text?: string }>;
	text?: string;
}

function toUIMessage(msg: IncomingMessage): UIMessage {
	// If already has parts, use them
	if (msg.parts && msg.parts.length > 0) {
		return {
			id: msg.id ?? crypto.randomUUID(),
			role: msg.role,
			parts: msg.parts.map((p) => ({ type: "text", text: p.text ?? "" })),
		};
	}

	// Extract text from content or text field
	const text = msg.content ?? msg.text ?? "";

	return {
		id: msg.id ?? crypto.randomUUID(),
		role: msg.role,
		parts: [{ type: "text", text }],
	};
}

export const agent = new Elysia({ prefix: "/v1/agent" })
	.derive(async ({ request }) => {
		const session = await auth.api.getSession({ headers: request.headers });
		return { user: session?.user ?? null };
	})
	.onBeforeHandle(({ user }) => {
		if (!user) {
			return new Response(
				JSON.stringify({
					success: false,
					error: "Authentication required",
					code: "AUTH_REQUIRED",
				}),
				{ status: 401, headers: { "Content-Type": "application/json" } }
			);
		}
	})
	.post(
		"/chat",
		function agentChat({ body, user, request }) {
			return record("agentChat", async () => {
				const chatId = body.id ?? crypto.randomUUID();

				setAttributes({
					"agent.website_id": body.websiteId,
					"agent.user_id": user?.id ?? "unknown",
					"agent.chat_id": chatId,
				});

				try {
					const websiteValidation = await validateWebsite(body.websiteId);
					if (!(websiteValidation.success && websiteValidation.website)) {
						return new Response(
							JSON.stringify({
								error: websiteValidation.error ?? "Website not found",
							}),
							{ status: 404, headers: { "Content-Type": "application/json" } }
						);
					}

					const { website } = websiteValidation;

					let authorized = website.isPublic;
					if (!authorized) {
						if (website.organizationId) {
							const { success } = await websitesApi.hasPermission({
								headers: request.headers,
								body: { permissions: { website: ["read"] } },
							});
							authorized = success;
						} else {
							authorized = website.userId === user?.id;
						}
					}

					if (!authorized) {
						return new Response(JSON.stringify({ error: "Unauthorized" }), {
							status: 403,
							headers: { "Content-Type": "application/json" },
						});
					}

					const appContext = buildAppContext(
						user?.id ?? "anonymous",
						body.websiteId,
						website.domain ?? "unknown",
						body.timezone ?? "UTC"
					);

					const message = toUIMessage(body.message);

					return triageAgent.toUIMessageStream({
						message,
						strategy: "auto",
						maxRounds: 5,
						maxSteps: 20,
						context: appContext,
						experimental_transform: smoothStream({
							chunking: "word",
						}),
						sendSources: true,
					});
				} catch (error) {
					console.error("Agent chat error:", error);
					return new Response(
						JSON.stringify({
							error: error instanceof Error ? error.message : "Unknown error",
						}),
						{ status: 500, headers: { "Content-Type": "application/json" } }
					);
				}
			});
		},
		{ body: AgentRequestSchema }
	);
