import { auth } from "@databuddy/auth";
import { and, db, eq, inArray, isNull, member, websites } from "@databuddy/db";
import { filterOptions } from "@databuddy/shared/lists/filters";
import type { CustomQueryRequest } from "@databuddy/shared/types/custom-query";
import { Elysia, t } from "elysia";
import {
	type ApiKeyRow,
	getAccessibleWebsiteIds,
	getApiKeyFromHeader,
	hasGlobalAccess,
	isApiKeyPresent,
} from "../lib/api-key";
import { record, setAttributes } from "../lib/tracing";
import { getCachedWebsiteDomain, getWebsiteDomain } from "../lib/website-utils";
import { compileQuery, executeBatch } from "../query";
import { QueryBuilders } from "../query/builders";
import { executeCustomQuery } from "../query/custom-query-builder";
import type { Filter, QueryRequest } from "../query/types";
import {
	CompileRequestSchema,
	type CompileRequestType,
	DynamicQueryRequestSchema,
	type DynamicQueryRequestType,
} from "../schemas";

const MAX_HOURLY_DAYS = 7;

interface AuthContext {
	apiKey: ApiKeyRow | null;
	user: { id: string; name: string; email: string } | null;
	isAuthenticated: boolean;
	authMethod: "api_key" | "session" | "none";
}

const AUTH_FAILED = new Response(
	JSON.stringify({
		success: false,
		error: "Authentication required",
		code: "AUTH_REQUIRED",
	}),
	{ status: 401, headers: { "Content-Type": "application/json" } }
);

function getAccessibleWebsites(authCtx: AuthContext) {
	const select = {
		id: websites.id,
		name: websites.name,
		domain: websites.domain,
		isPublic: websites.isPublic,
		createdAt: websites.createdAt,
	};

	if (authCtx.user) {
		return db
			.select(select)
			.from(websites)
			.where(
				and(
					eq(websites.userId, authCtx.user.id),
					isNull(websites.organizationId)
				)
			)
			.orderBy((t) => t.createdAt);
	}

	if (authCtx.apiKey) {
		if (hasGlobalAccess(authCtx.apiKey)) {
			const filter = authCtx.apiKey.organizationId
				? eq(websites.organizationId, authCtx.apiKey.organizationId)
				: authCtx.apiKey.userId
					? and(
						eq(websites.userId, authCtx.apiKey.userId),
						isNull(websites.organizationId)
					)
					: eq(websites.id, "");
			return db
				.select(select)
				.from(websites)
				.where(filter)
				.orderBy((t) => t.createdAt);
		}

		const ids = getAccessibleWebsiteIds(authCtx.apiKey);
		if (ids.length === 0) {
			return [];
		}
		return db
			.select(select)
			.from(websites)
			.where(inArray(websites.id, ids))
			.orderBy((t) => t.createdAt);
	}

	return [];
}

async function verifyWebsiteAccess(
	ctx: AuthContext,
	websiteId: string
): Promise<boolean> {
	const website = await db.query.websites.findFirst({
		where: eq(websites.id, websiteId),
		columns: {
			id: true,
			isPublic: true,
			userId: true,
			organizationId: true,
		},
	});

	if (!website) {
		return false;
	}

	if (website.isPublic) {
		return true;
	}

	if (!ctx.isAuthenticated) {
		return false;
	}

	if (ctx.apiKey) {
		if (hasGlobalAccess(ctx.apiKey)) {
			if (ctx.apiKey.organizationId) {
				return website.organizationId === ctx.apiKey.organizationId;
			}
			if (ctx.apiKey.userId) {
				return (
					website.userId === ctx.apiKey.userId && !website.organizationId
				);
			}
			return false;
		}

		const accessibleIds = getAccessibleWebsiteIds(ctx.apiKey);
		return accessibleIds.includes(websiteId);
	}

	if (ctx.user) {
		// Direct ownership (personal websites)
		if (website.userId === ctx.user.id && !website.organizationId) {
			return true;
		}

		// Organization access - check if user is a member of the website's organization
		if (website.organizationId) {
			const membership = await db.query.member.findFirst({
				where: and(
					eq(member.userId, ctx.user.id),
					eq(member.organizationId, website.organizationId)
				),
				columns: {
					id: true,
				},
			});

			return !!membership;
		}

		return false;
	}

	return false;
}

const MS_PER_DAY = 86_400_000;

function getTimeUnit(
	granularity?: string,
	from?: string,
	to?: string
): "hour" | "day" {
	const isHourly = granularity === "hourly" || granularity === "hour";
	if (isHourly && from && to) {
		const days = Math.ceil(
			(new Date(to).getTime() - new Date(from).getTime()) / MS_PER_DAY
		);
		if (days > MAX_HOURLY_DAYS) {
			throw new Error(
				`Hourly granularity only supports up to ${MAX_HOURLY_DAYS} days`
			);
		}
	}
	return isHourly ? "hour" : "day";
}

type ParamInput =
	| string
	| {
		name: string;
		start_date?: string;
		end_date?: string;
		granularity?: string;
		id?: string;
	};

function parseParam(p: ParamInput) {
	if (typeof p === "string") {
		return { name: p, id: p };
	}
	return {
		name: p.name,
		id: p.id || p.name,
		start: p.start_date,
		end: p.end_date,
		granularity: p.granularity,
	};
}

export const query = new Elysia({ prefix: "/v1/query" })
	.derive(async ({ request }): Promise<{ auth: AuthContext }> => {
		const hasApiKey = isApiKeyPresent(request.headers);
		const [apiKey, session] = await Promise.all([
			hasApiKey ? getApiKeyFromHeader(request.headers) : null,
			auth.api.getSession({ headers: request.headers }),
		]);
		const user = session?.user ?? null;
		return {
			auth: {
				apiKey,
				user,
				isAuthenticated: Boolean(user ?? apiKey),
				authMethod: apiKey ? "api_key" : user ? "session" : "none",
			},
		};
	})

	.get("/websites", ({ auth: ctx }) =>
		record("getWebsites", async () => {
			if (!ctx.isAuthenticated) {
				return AUTH_FAILED;
			}
			const list = await getAccessibleWebsites(ctx);
			const count = Array.isArray(list) ? list.length : 0;
			setAttributes({ "websites_count": count, "auth_method": ctx.authMethod });
			return { success: true, websites: list, total: count };
		})
	)

	.get(
		"/types",
		({
			query: params,
			auth: ctx,
		}: {
			query: { include_meta?: string };
			auth: AuthContext;
		}) => {
			if (!ctx.isAuthenticated) {
				return AUTH_FAILED;
			}
			const includeMeta = params.include_meta === "true";
			const configs = Object.fromEntries(
				Object.entries(QueryBuilders).map(([key, cfg]) => [
					key,
					{
						allowedFilters:
							cfg.allowedFilters ?? filterOptions.map((f) => f.value),
						customizable: cfg.customizable,
						defaultLimit: cfg.limit,
						...(includeMeta && { meta: cfg.meta }),
					},
				])
			);
			return { success: true, types: Object.keys(QueryBuilders), configs };
		}
	)

	.post(
		"/compile",
		async ({
			body,
			query: q,
			auth: ctx,
		}: {
			body: CompileRequestType;
			query: { website_id?: string; timezone?: string };
			auth: AuthContext;
		}) => {
			// Check website access first (handles public websites)
			if (q.website_id) {
				const hasAccess = await verifyWebsiteAccess(ctx, q.website_id);
				if (!hasAccess) {
					return new Response(
						JSON.stringify({
							success: false,
							error: ctx.isAuthenticated
								? "Access denied to this website"
								: "Authentication required",
							code: ctx.isAuthenticated ? "ACCESS_DENIED" : "AUTH_REQUIRED",
						}),
						{
							status: ctx.isAuthenticated ? 403 : 401,
							headers: { "Content-Type": "application/json" },
						}
					);
				}
			} else if (!ctx.isAuthenticated) {
				// No website_id and not authenticated
				return AUTH_FAILED;
			}

			try {
				const domain = q.website_id
					? await getWebsiteDomain(q.website_id)
					: null;
				return {
					success: true,
					...compileQuery(body as QueryRequest, domain, q.timezone || "UTC"),
				};
			} catch (e) {
				return {
					success: false,
					error: e instanceof Error ? e.message : "Compilation failed",
				};
			}
		},
		{ body: CompileRequestSchema }
	)

	.post(
		"/",
		({
			body,
			query: q,
			auth: ctx,
		}: {
			body: DynamicQueryRequestType | DynamicQueryRequestType[];
			query: { website_id?: string; timezone?: string };
			auth: AuthContext;
		}) =>
			record("executeQuery", async () => {
				// Check website access first (handles public websites)
				if (q.website_id) {
					const hasAccess = await verifyWebsiteAccess(ctx, q.website_id);
					if (!hasAccess) {
						return {
							success: false,
							error: ctx.isAuthenticated
								? "Access denied to this website"
								: "Authentication required",
							code: ctx.isAuthenticated ? "ACCESS_DENIED" : "AUTH_REQUIRED",
						};
					}
				} else if (!ctx.isAuthenticated) {
					// No website_id and not authenticated
					return AUTH_FAILED;
				}

				const tz = q.timezone || "UTC";
				const isBatch = Array.isArray(body);
				setAttributes({
					"query_is_batch": isBatch,
					"query_count": isBatch ? body.length : 1,
				});

				if (isBatch) {
					const cache = await getCachedWebsiteDomain([]);
					const results = await Promise.all(
						body.map((req) =>
							runDynamicQuery(req, q.website_id, tz, cache).catch((e) => ({
								success: false,
								error: e instanceof Error ? e.message : "Query failed",
							}))
						)
					);
					return { success: true, batch: true, results };
				}

				return {
					success: true,
					...(await runDynamicQuery(body, q.website_id, tz)),
				};
			}),
		{
			body: t.Union([
				DynamicQueryRequestSchema,
				t.Array(DynamicQueryRequestSchema),
			]),
		}
	)

	.post(
		"/custom",
		async ({
			body,
			query: q,
			auth: ctx,
		}: {
			body: CustomQueryRequest;
			query: { website_id?: string };
			auth: AuthContext;
		}) =>
			record("executeCustomQuery", async () => {
				if (!q.website_id) {
					return {
						success: false,
						error: "website_id is required",
						code: "MISSING_WEBSITE_ID",
					};
				}

				const hasAccess = await verifyWebsiteAccess(ctx, q.website_id);
				if (!hasAccess) {
					return {
						success: false,
						error: ctx.isAuthenticated
							? "Access denied to this website"
							: "Authentication required",
						code: ctx.isAuthenticated ? "ACCESS_DENIED" : "AUTH_REQUIRED",
					};
				}

				setAttributes({
					"custom_query_table": body.query.table,
					"custom_query_selects": body.query.selects.length,
					"custom_query_filters": body.query.filters?.length || 0,
				});

				return executeCustomQuery(body, q.website_id);
			}),
		{
			body: t.Object({
				query: t.Object({
					table: t.String(),
					selects: t.Array(
						t.Object({
							field: t.String(),
							aggregate: t.Union([
								t.Literal("count"),
								t.Literal("sum"),
								t.Literal("avg"),
								t.Literal("max"),
								t.Literal("min"),
								t.Literal("uniq"),
							]),
							alias: t.Optional(t.String()),
						})
					),
					filters: t.Optional(
						t.Array(
							t.Object({
								field: t.String(),
								operator: t.Union([
									t.Literal("eq"),
									t.Literal("ne"),
									t.Literal("gt"),
									t.Literal("lt"),
									t.Literal("gte"),
									t.Literal("lte"),
									t.Literal("contains"),
									t.Literal("not_contains"),
									t.Literal("starts_with"),
									t.Literal("in"),
									t.Literal("not_in"),
								]),
								value: t.Union([
									t.String(),
									t.Number(),
									t.Array(t.Union([t.String(), t.Number()])),
								]),
							})
						)
					),
					groupBy: t.Optional(t.Array(t.String())),
				}),
				startDate: t.String(),
				endDate: t.String(),
				timezone: t.Optional(t.String()),
				granularity: t.Optional(
					t.Union([t.Literal("hourly"), t.Literal("daily")])
				),
				limit: t.Optional(t.Number()),
			}),
		}
	);

interface QueryResult {
	parameter: string;
	success: boolean;
	data: Record<string, unknown>[];
	error?: string;
}

async function runDynamicQuery(
	req: DynamicQueryRequestType,
	websiteId?: string,
	timezone?: string,
	domainCache?: Record<string, string | null>
) {
	const from = req.startDate;
	const to = req.endDate;
	const domain = websiteId
		? (domainCache?.[websiteId] ?? (await getWebsiteDomain(websiteId)))
		: null;

	type PreparedItem =
		| { id: string; error: string }
		| { id: string; request: QueryRequest & { type: string } };

	const prepared: PreparedItem[] = req.parameters.map((p) => {
		const { name, id, start, end, granularity } = parseParam(p);
		const paramFrom = start || from;
		const paramTo = end || to;

		if (!QueryBuilders[name]) {
			return { id, error: `Unknown query type: ${name}` };
		}
		if (!(websiteId && paramFrom && paramTo)) {
			return { id, error: "Missing website_id, start_date, or end_date" };
		}

		return {
			id,
			request: {
				projectId: websiteId,
				type: name,
				from: paramFrom,
				to: paramTo,
				timeUnit: getTimeUnit(
					granularity || req.granularity,
					paramFrom,
					paramTo
				),
				filters: (req.filters || []) as Filter[],
				limit: req.limit || 100,
				offset: req.page ? (req.page - 1) * (req.limit || 100) : 0,
				timezone,
			},
		};
	});

	const valid = prepared.filter(
		(p): p is { id: string; request: QueryRequest & { type: string } } =>
			"request" in p
	);
	const errors = prepared.filter(
		(p): p is { id: string; error: string } => "error" in p
	);

	const resultMap = new Map<string, QueryResult>();

	for (const e of errors) {
		resultMap.set(e.id, {
			parameter: e.id,
			success: false,
			error: e.error,
			data: [],
		});
	}

	if (valid.length > 0) {
		const results = await executeBatch(
			valid.map((v) => v.request),
			{ websiteDomain: domain, timezone }
		);
		for (let i = 0; i < valid.length; i++) {
			const v = valid[i];
			const r = results[i];
			if (v) {
				resultMap.set(v.id, {
					parameter: v.id,
					success: !r?.error,
					data: r?.data || [],
					error: r?.error,
				});
			}
		}
	}

	// Build results array, separating errors from successes
	const allResults = prepared.map(
		(p) =>
			resultMap.get(p.id) || {
				parameter: p.id,
				success: false,
				error: "Unknown",
				data: [],
			}
	);

	// Sort: successes first, then errors (at the bottom)
	const sortedResults = allResults.sort((a, b) => {
		const aIsError = !a.success;
		const bIsError = !b.success;
		if (!aIsError && bIsError) {
			return -1; // a (success) comes before b (error)
		}
		if (aIsError && !bIsError) {
			return 1; // b (success) comes before a (error)
		}
		return 0; // maintain original order for same type
	});

	return {
		queryId: req.id,
		data: sortedResults,
		meta: {
			parameters: req.parameters,
			total_parameters: req.parameters.length,
			page: req.page || 1,
			limit: req.limit || 100,
			filters_applied: req.filters?.length || 0,
		},
	};
}
