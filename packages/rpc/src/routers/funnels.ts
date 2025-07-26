import { chQuery, funnelDefinitions } from '@databuddy/db';
import { logger } from '@databuddy/shared';
import { TRPCError } from '@trpc/server';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { z } from 'zod/v4';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { authorizeWebsiteAccess } from '../utils/auth';
import { parseReferrer } from '../utils/referrer';

const funnelStepSchema = z.object({
	type: z.enum(['PAGE_VIEW', 'EVENT', 'CUSTOM']),
	target: z.string().min(1),
	name: z.string().min(1),
	conditions: z.record(z.string(), z.any()).optional(),
});

const funnelFilterSchema = z.object({
	field: z.string(),
	operator: z.enum(['equals', 'contains', 'not_equals', 'in', 'not_in']),
	value: z.union([z.string(), z.array(z.string())]),
});

const createFunnelSchema = z.object({
	websiteId: z.string(),
	name: z.string().min(1).max(100),
	description: z.string().optional(),
	steps: z.array(funnelStepSchema).min(2).max(10),
	filters: z.array(funnelFilterSchema).optional(),
});

const updateFunnelSchema = z.object({
	id: z.string(),
	name: z.string().min(1).max(100).optional(),
	description: z.string().optional(),
	steps: z.array(funnelStepSchema).min(2).max(10).optional(),
	filters: z.array(funnelFilterSchema).optional(),
	isActive: z.boolean().optional(),
});

const analyticsDateRangeSchema = z.object({
	websiteId: z.string(),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
});

const funnelAnalyticsSchema = z.object({
	funnelId: z.string(),
	websiteId: z.string(),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
});

const ALLOWED_FIELDS = new Set([
	'id',
	'client_id',
	'event_name',
	'anonymous_id',
	'time',
	'session_id',
	'event_type',
	'event_id',
	'session_start_time',
	'timestamp',
	'referrer',
	'url',
	'path',
	'title',
	'ip',
	'user_agent',
	'browser_name',
	'browser_version',
	'os_name',
	'os_version',
	'device_type',
	'device_brand',
	'device_model',
	'country',
	'region',
	'city',
	'screen_resolution',
	'viewport_size',
	'language',
	'timezone',
	'connection_type',
	'rtt',
	'downlink',
	'time_on_page',
	'scroll_depth',
	'interaction_count',
	'exit_intent',
	'page_count',
	'is_bounce',
	'has_exit_intent',
	'page_size',
	'utm_source',
	'utm_medium',
	'utm_campaign',
	'utm_term',
	'utm_content',
	'load_time',
	'dom_ready_time',
	'dom_interactive',
	'ttfb',
	'connection_time',
	'request_time',
	'render_time',
	'redirect_time',
	'domain_lookup_time',
	'fcp',
	'lcp',
	'cls',
	'fid',
	'inp',
	'href',
	'text',
	'value',
	'error_message',
	'error_filename',
	'error_lineno',
	'error_colno',
	'error_stack',
	'error_type',
	'properties',
	'created_at',
]);

const ALLOWED_OPERATORS = new Set([
	'equals',
	'contains',
	'not_equals',
	'in',
	'not_in',
]);

const buildFilterConditions = (
	filters: Array<{ field: string; operator: string; value: string | string[] }>,
	paramPrefix: string,
	params: Record<string, unknown>
): string => {
	if (!filters || filters.length === 0) {
		return '';
	}
	const filterConditions = filters
		.map((filter, i) => {
			if (!ALLOWED_FIELDS.has(filter.field)) {
				return '';
			}
			if (!ALLOWED_OPERATORS.has(filter.operator)) {
				return '';
			}
			const field = filter.field;
			const value = Array.isArray(filter.value) ? filter.value : [filter.value];
			const key = `${paramPrefix}_${i}`;
			switch (filter.operator) {
				case 'equals':
					params[key] = value[0];
					return `${field} = {${key}:String}`;
				case 'contains':
					params[key] = `%${value[0]}%`;
					return `${field} LIKE {${key}:String}`;
				case 'not_equals':
					params[key] = value[0];
					return `${field} != {${key}:String}`;
				case 'in':
					params[key] = value;
					return `${field} IN {${key}:Array(String)}`;
				case 'not_in':
					params[key] = value;
					return `${field} NOT IN {${key}:Array(String)}`;
				default:
					return '';
			}
		})
		.filter(Boolean);
	return filterConditions.length > 0
		? ` AND ${filterConditions.join(' AND ')}`
		: '';
};

const getDefaultDateRange = () => {
	const endDate = new Date().toISOString().split('T')[0];
	const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
		.toISOString()
		.split('T')[0];
	return { startDate, endDate };
};

export const funnelsRouter = createTRPCRouter({
	getAutocomplete: protectedProcedure
		.input(analyticsDateRangeSchema)
		.query(async ({ ctx, input }) => {
			const website = await authorizeWebsiteAccess(
				ctx,
				input.websiteId,
				'read'
			);
			const { startDate, endDate } =
				input.startDate && input.endDate
					? { startDate: input.startDate, endDate: input.endDate }
					: getDefaultDateRange();
			const params = { websiteId: website.id, startDate, endDate };
			const query = `
                SELECT 'customEvents' as category, event_name as value
                FROM analytics.events
                WHERE client_id = {websiteId:String}
                    AND time >= parseDateTimeBestEffort({startDate:String})
                    AND time <= parseDateTimeBestEffort({endDate:String})
                    AND event_name NOT IN ('screen_view', 'page_exit', 'error', 'web_vitals', 'link_out')
                    AND event_name != ''
                GROUP BY event_name
                UNION ALL
                SELECT 'pagePaths' as category, 
                    CASE 
                        WHEN path LIKE 'http%' THEN 
                            substring(path, position(path, '/', 9))
                        ELSE path
                    END as value
                FROM analytics.events
                WHERE client_id = {websiteId:String}
                    AND time >= parseDateTimeBestEffort({startDate:String})
                    AND time <= parseDateTimeBestEffort({endDate:String})
                    AND event_name = 'screen_view'
                    AND path != ''
                GROUP BY value
                HAVING value != '' AND value != '/'
                UNION ALL
                SELECT 'browsers' as category, browser_name as value
                FROM analytics.events
                WHERE client_id = {websiteId:String}
                    AND time >= parseDateTimeBestEffort({startDate:String})
                    AND time <= parseDateTimeBestEffort({endDate:String})
                    AND browser_name IS NOT NULL AND browser_name != '' AND browser_name != 'Unknown'
                GROUP BY browser_name
                UNION ALL
                SELECT 'operatingSystems' as category, os_name as value
                FROM analytics.events
                WHERE client_id = {websiteId:String}
                    AND time >= parseDateTimeBestEffort({startDate:String})
                    AND time <= parseDateTimeBestEffort({endDate:String})
                    AND os_name IS NOT NULL AND os_name != '' AND os_name != 'Unknown'
                GROUP BY os_name
                UNION ALL
                SELECT 'countries' as category, country as value
                FROM analytics.events
                WHERE client_id = {websiteId:String}
                    AND time >= parseDateTimeBestEffort({startDate:String})
                    AND time <= parseDateTimeBestEffort({endDate:String})
                    AND country IS NOT NULL AND country != ''
                GROUP BY country
                UNION ALL
                SELECT 'deviceTypes' as category, device_type as value
                FROM analytics.events
                WHERE client_id = {websiteId:String}
                    AND time >= parseDateTimeBestEffort({startDate:String})
                    AND time <= parseDateTimeBestEffort({endDate:String})
                    AND device_type IS NOT NULL AND device_type != ''
                GROUP BY device_type
                UNION ALL
                SELECT 'utmSources' as category, utm_source as value
                FROM analytics.events
                WHERE client_id = {websiteId:String}
                    AND time >= parseDateTimeBestEffort({startDate:String})
                    AND time <= parseDateTimeBestEffort({endDate:String})
                    AND utm_source IS NOT NULL AND utm_source != ''
                GROUP BY utm_source
                UNION ALL
                SELECT 'utmMediums' as category, utm_medium as value
                FROM analytics.events
                WHERE client_id = {websiteId:String}
                    AND time >= parseDateTimeBestEffort({startDate:String})
                    AND time <= parseDateTimeBestEffort({endDate:String})
                    AND utm_medium IS NOT NULL AND utm_medium != ''
                GROUP BY utm_medium
                UNION ALL
                SELECT 'utmCampaigns' as category, utm_campaign as value
                FROM analytics.events
                WHERE client_id = {websiteId:String}
                    AND time >= parseDateTimeBestEffort({startDate:String})
                    AND time <= parseDateTimeBestEffort({endDate:String})
                    AND utm_campaign IS NOT NULL AND utm_campaign != ''
                GROUP BY utm_campaign
            `;

			try {
				const results = await chQuery<{
					category: string;
					value: string;
				}>(query, params);

				const categorized = {
					customEvents: results
						.filter((r) => r.category === 'customEvents')
						.map((r) => r.value),
					pagePaths: results
						.filter((r) => r.category === 'pagePaths')
						.map((r) => r.value),
					browsers: results
						.filter((r) => r.category === 'browsers')
						.map((r) => r.value),
					operatingSystems: results
						.filter((r) => r.category === 'operatingSystems')
						.map((r) => r.value),
					countries: results
						.filter((r) => r.category === 'countries')
						.map((r) => r.value),
					deviceTypes: results
						.filter((r) => r.category === 'deviceTypes')
						.map((r) => r.value),
					utmSources: results
						.filter((r) => r.category === 'utmSources')
						.map((r) => r.value),
					utmMediums: results
						.filter((r) => r.category === 'utmMediums')
						.map((r) => r.value),
					utmCampaigns: results
						.filter((r) => r.category === 'utmCampaigns')
						.map((r) => r.value),
				};

				return categorized;
			} catch (error) {
				logger.error(
					'Failed to fetch autocomplete data',
					error instanceof Error ? error.message : String(error),
					{
						websiteId: website.id,
					}
				);
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to fetch autocomplete data',
				});
			}
		}),

	list: protectedProcedure
		.input(z.object({ websiteId: z.string() }))
		.query(async ({ ctx, input }) => {
			const website = await authorizeWebsiteAccess(
				ctx,
				input.websiteId,
				'read'
			);

			try {
				const funnels = await ctx.db
					.select({
						id: funnelDefinitions.id,
						name: funnelDefinitions.name,
						description: funnelDefinitions.description,
						steps: funnelDefinitions.steps,
						filters: funnelDefinitions.filters,
						isActive: funnelDefinitions.isActive,
						createdAt: funnelDefinitions.createdAt,
						updatedAt: funnelDefinitions.updatedAt,
					})
					.from(funnelDefinitions)
					.where(
						and(
							eq(funnelDefinitions.websiteId, website.id),
							isNull(funnelDefinitions.deletedAt),
							sql`jsonb_array_length(${funnelDefinitions.steps}) > 1`
						)
					)
					.orderBy(desc(funnelDefinitions.createdAt));

				return funnels;
			} catch (error) {
				logger.error(
					'Failed to fetch funnels',
					error instanceof Error ? error.message : String(error),
					{
						websiteId: website.id,
					}
				);
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to fetch funnels',
				});
			}
		}),

	getById: protectedProcedure
		.input(z.object({ id: z.string(), websiteId: z.string() }))
		.query(async ({ ctx, input }) => {
			const website = await authorizeWebsiteAccess(
				ctx,
				input.websiteId,
				'read'
			);

			try {
				const funnel = await ctx.db
					.select()
					.from(funnelDefinitions)
					.where(
						and(
							eq(funnelDefinitions.id, input.id),
							eq(funnelDefinitions.websiteId, website.id),
							isNull(funnelDefinitions.deletedAt)
						)
					)
					.limit(1);

				if (funnel.length === 0) {
					throw new TRPCError({
						code: 'NOT_FOUND',
						message: 'Funnel not found',
					});
				}

				return funnel[0];
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}

				logger.error(
					'Failed to fetch funnel',
					error instanceof Error ? error.message : String(error),
					{
						funnelId: input.id,
						websiteId: website.id,
					}
				);
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to fetch funnel',
				});
			}
		}),

	create: protectedProcedure
		.input(createFunnelSchema)
		.mutation(async ({ ctx, input }) => {
			const website = await authorizeWebsiteAccess(
				ctx,
				input.websiteId,
				'update'
			);

			try {
				const funnelId = crypto.randomUUID();

				const [newFunnel] = await ctx.db
					.insert(funnelDefinitions)
					.values({
						id: funnelId,
						websiteId: website.id,
						name: input.name,
						description: input.description,
						steps: input.steps,
						filters: input.filters,
						createdBy: ctx.user.id,
					} as any)
					.returning();

				logger.success('Funnel created', `Created funnel "${input.name}"`, {
					funnelId,
					websiteId: website.id,
					userId: ctx.user.id,
				});

				return newFunnel;
			} catch (error) {
				logger.error(
					'Failed to create funnel',
					error instanceof Error ? error.message : String(error),
					{
						websiteId: website.id,
						userId: ctx.user.id,
					}
				);
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to create funnel',
				});
			}
		}),

	// Update a funnel
	update: protectedProcedure
		.input(updateFunnelSchema)
		.mutation(async ({ ctx, input }) => {
			const existingFunnel = await ctx.db
				.select({ websiteId: funnelDefinitions.websiteId })
				.from(funnelDefinitions)
				.where(
					and(
						eq(funnelDefinitions.id, input.id),
						isNull(funnelDefinitions.deletedAt)
					)
				)
				.limit(1);

			if (existingFunnel.length === 0) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Funnel not found',
				});
			}

			await authorizeWebsiteAccess(ctx, existingFunnel[0].websiteId, 'update');

			try {
				const { id, ...updates } = input;
				const [updatedFunnel] = await ctx.db
					.update(funnelDefinitions)
					.set({
						...updates,
						updatedAt: new Date().toISOString(),
					} as any)
					.where(
						and(
							eq(funnelDefinitions.id, id),
							isNull(funnelDefinitions.deletedAt)
						)
					)
					.returning();

				return updatedFunnel;
			} catch (error) {
				logger.error(
					'Failed to update funnel',
					error instanceof Error ? error.message : String(error),
					{
						funnelId: input.id,
					}
				);
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to update funnel',
				});
			}
		}),

	// Delete a funnel (soft delete)
	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const existingFunnel = await ctx.db
				.select({ websiteId: funnelDefinitions.websiteId })
				.from(funnelDefinitions)
				.where(
					and(
						eq(funnelDefinitions.id, input.id),
						isNull(funnelDefinitions.deletedAt)
					)
				)
				.limit(1);

			if (existingFunnel.length === 0) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Funnel not found',
				});
			}

			await authorizeWebsiteAccess(ctx, existingFunnel[0].websiteId, 'delete');

			try {
				await ctx.db
					.update(funnelDefinitions)
					.set({
						deletedAt: new Date().toISOString(),
						isActive: false,
					} as any)
					.where(
						and(
							eq(funnelDefinitions.id, input.id),
							isNull(funnelDefinitions.deletedAt)
						)
					);

				return { success: true };
			} catch (error) {
				logger.error(
					'Failed to delete funnel',
					error instanceof Error ? error.message : String(error),
					{
						funnelId: input.id,
					}
				);
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to delete funnel',
				});
			}
		}),

	// Get funnel analytics
	getAnalytics: protectedProcedure
		.input(funnelAnalyticsSchema)
		.query(async ({ ctx, input }) => {
			const website = await authorizeWebsiteAccess(
				ctx,
				input.websiteId,
				'read'
			);
			const { startDate, endDate } =
				input.startDate && input.endDate
					? { startDate: input.startDate, endDate: input.endDate }
					: getDefaultDateRange();
			try {
				const funnel = await ctx.db
					.select()
					.from(funnelDefinitions)
					.where(
						and(
							eq(funnelDefinitions.id, input.funnelId),
							eq(funnelDefinitions.websiteId, website.id),
							isNull(funnelDefinitions.deletedAt)
						)
					)
					.limit(1);
				if (funnel.length === 0) {
					throw new TRPCError({
						code: 'NOT_FOUND',
						message: 'Funnel not found',
					});
				}
				const funnelData = funnel[0];
				const steps = funnelData.steps as Array<{
					type: string;
					target: string;
					name: string;
					conditions?: Record<string, unknown>;
				}>;
				const filters =
					(funnelData.filters as Array<{
						field: string;
						operator: string;
						value: string | string[];
					}>) || [];
				const params: Record<string, unknown> = {
					websiteId: website.id,
					startDate,
					endDate: `${endDate} 23:59:59`,
				};
				const filterClause = buildFilterConditions(filters, 'f', params);
				const stepQueries = steps.map((step, index) => {
					const stepNameKey = `step_name_${index}`;
					const targetKey = `target_${index}`;
					let whereCondition = '';
					if (step.type === 'PAGE_VIEW') {
						params[targetKey] = step.target;
						whereCondition = `event_name = 'screen_view' AND (path = {${targetKey}:String} OR path LIKE {${targetKey}_like:String})`;
						params[`${targetKey}_like`] = `%${step.target}%`;
					} else if (step.type === 'EVENT') {
						params[targetKey] = step.target;
						whereCondition = `event_name = {${targetKey}:String}`;
					}
					params[stepNameKey] = step.name;
					return `
                    SELECT 
                      ${index + 1} as step_number,
                      {${stepNameKey}:String} as step_name,
                      session_id,
                      MIN(time) as first_occurrence
                    FROM analytics.events
                    WHERE client_id = {websiteId:String}
                      AND time >= parseDateTimeBestEffort({startDate:String})
                      AND time <= parseDateTimeBestEffort({endDate:String})
                      AND ${whereCondition}${filterClause}
                    GROUP BY session_id`;
				});
				const analysisQuery = `
                  WITH all_step_events AS (
                    ${stepQueries.join('\n                    UNION ALL\n')}
                  )
                  SELECT 
                    step_number,
                    step_name,
                    session_id,
                    first_occurrence
                  FROM all_step_events
                  ORDER BY session_id, first_occurrence
                `;
				const rawResults = await chQuery<{
					step_number: number;
					step_name: string;
					session_id: string;
					first_occurrence: number;
				}>(analysisQuery, params);
				// Process the results to calculate proper funnel progression
				const sessionEvents = new Map<
					string,
					Array<{
						step_number: number;
						step_name: string;
						first_occurrence: number;
					}>
				>();

				for (const event of rawResults) {
					if (!sessionEvents.has(event.session_id)) {
						sessionEvents.set(event.session_id, []);
					}
					sessionEvents.get(event.session_id)?.push({
						step_number: event.step_number,
						step_name: event.step_name,
						first_occurrence: event.first_occurrence,
					});
				}

				// Calculate funnel progression for each session
				const stepCounts = new Map<number, Set<string>>();

				for (const [sessionId, events] of sessionEvents) {
					events.sort((a, b) => a.first_occurrence - b.first_occurrence);

					let currentStep = 1;
					for (const event of events) {
						if (event.step_number === currentStep) {
							if (!stepCounts.has(event.step_number)) {
								stepCounts.set(event.step_number, new Set());
							}
							stepCounts.get(event.step_number)?.add(sessionId);
							currentStep++;
						}
					}
				}

				// Build analytics results
				const analyticsResults = steps.map((step, index) => {
					const stepNumber = index + 1;
					const users = stepCounts.get(stepNumber)?.size || 0;
					const prevStepUsers =
						index > 0 ? stepCounts.get(index)?.size || 0 : users;
					const totalUsers = stepCounts.get(1)?.size || 0;

					const conversion_rate =
						index === 0
							? 100.0
							: prevStepUsers > 0
								? Math.round((users / prevStepUsers) * 100 * 100) / 100
								: 0;

					const dropoffs = index > 0 ? prevStepUsers - users : 0;
					const dropoff_rate =
						index > 0 && prevStepUsers > 0
							? Math.round((dropoffs / prevStepUsers) * 100 * 100) / 100
							: 0;

					return {
						step_number: stepNumber,
						step_name: step.name,
						users,
						total_users: totalUsers,
						conversion_rate,
						dropoffs,
						dropoff_rate,
						avg_time_to_complete: 0,
					};
				});

				// Calculate overall metrics
				const firstStep = analyticsResults[0];
				const lastStep = analyticsResults.at(-1);
				const biggestDropoff = analyticsResults.reduce(
					(max, step) => (step.dropoff_rate > max.dropoff_rate ? step : max),
					analyticsResults[1] || analyticsResults[0]
				);

				const overallAnalytics = {
					overall_conversion_rate: lastStep
						? Math.round(
								(lastStep.users / (stepCounts.get(1)?.size || 1)) * 100 * 100
							) / 100
						: 0,
					total_users_entered: firstStep ? firstStep.total_users : 0,
					total_users_completed: lastStep ? lastStep.users : 0,
					avg_completion_time: 0,
					avg_completion_time_formatted: '0s',
					biggest_dropoff_step: biggestDropoff ? biggestDropoff.step_number : 1,
					biggest_dropoff_rate: biggestDropoff
						? biggestDropoff.dropoff_rate
						: 0,
					steps_analytics: analyticsResults,
				};

				return overallAnalytics;
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}

				logger.error(
					'Failed to fetch funnel analytics',
					error instanceof Error ? error.message : String(error),
					{
						funnelId: input.funnelId,
						websiteId: website.id,
					}
				);
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to fetch funnel analytics',
				});
			}
		}),

	// Get funnel analytics grouped by referrer
	getAnalyticsByReferrer: protectedProcedure
		.input(funnelAnalyticsSchema)
		.query(async ({ ctx, input }) => {
			const website = await authorizeWebsiteAccess(
				ctx,
				input.websiteId,
				'read'
			);
			const { startDate, endDate } =
				input.startDate && input.endDate
					? { startDate: input.startDate, endDate: input.endDate }
					: getDefaultDateRange();
			try {
				const funnel = await ctx.db
					.select()
					.from(funnelDefinitions)
					.where(
						and(
							eq(funnelDefinitions.id, input.funnelId),
							eq(funnelDefinitions.websiteId, website.id),
							isNull(funnelDefinitions.deletedAt)
						)
					)
					.limit(1);
				if (funnel.length === 0) {
					throw new TRPCError({
						code: 'NOT_FOUND',
						message: 'Funnel not found',
					});
				}
				const funnelData = funnel[0];
				const steps = funnelData.steps as Array<{
					type: string;
					target: string;
					name: string;
					conditions?: Record<string, unknown>;
				}>;
				const filters =
					(funnelData.filters as Array<{
						field: string;
						operator: string;
						value: string | string[];
					}>) || [];
				if (!steps || steps.length === 0) {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message: 'Funnel has no steps',
					});
				}
				const params: Record<string, unknown> = {
					websiteId: website.id,
					startDate,
					endDate: `${endDate} 23:59:59`,
				};
				const filterClause = buildFilterConditions(filters, 'f', params);
				const stepQueries = steps.map((step, index) => {
					const stepNameKey = `step_name_${index}`;
					const targetKey = `target_${index}`;
					let whereCondition = '';
					if (step.type === 'PAGE_VIEW') {
						params[targetKey] = step.target;
						whereCondition = `event_name = 'screen_view' AND (path = {${targetKey}:String} OR path LIKE {${targetKey}_like:String})`;
						params[`${targetKey}_like`] = `%${step.target}%`;
					} else if (step.type === 'EVENT') {
						params[targetKey] = step.target;
						whereCondition = `event_name = {${targetKey}:String}`;
					}
					params[stepNameKey] = step.name;
					return `
                    SELECT 
                      ${index + 1} as step_number,
                      {${stepNameKey}:String} as step_name,
                      session_id,
                      MIN(time) as first_occurrence,
                      any(referrer) as session_referrer
                    FROM analytics.events
                    WHERE client_id = {websiteId:String}
                      AND time >= parseDateTimeBestEffort({startDate:String})
                      AND time <= parseDateTimeBestEffort({endDate:String})
                      AND ${whereCondition}${filterClause}
                    GROUP BY session_id`;
				});
				const sessionReferrerQuery = `
                  WITH all_step_events AS (
                    ${stepQueries.join('\n                    UNION ALL\n')}
                  ),
                  session_referrers AS (
                    SELECT DISTINCT
                      session_id,
                      argMin(referrer, time) as first_referrer
                    FROM analytics.events
                    WHERE client_id = {websiteId:String}
                      AND time >= parseDateTimeBestEffort({startDate:String})
                      AND time <= parseDateTimeBestEffort({endDate:String})${filterClause}
                    GROUP BY session_id
                  )
                  SELECT 
                    t1.step_number,
                    t1.step_name,
                    t1.session_id,
                    t1.first_occurrence,
                    t2.first_referrer as referrer
                  FROM all_step_events t1
                  JOIN session_referrers t2 ON t1.session_id = t2.session_id
                  ORDER BY t1.session_id, t1.first_occurrence
                `;
				const rawResults = await chQuery<{
					step_number: number;
					step_name: string;
					session_id: string;
					first_occurrence: number;
					referrer: string;
				}>(sessionReferrerQuery, params);

				const sessionEvents = new Map<
					string,
					Array<{
						step_number: number;
						step_name: string;
						first_occurrence: number;
						referrer: string;
					}>
				>();

				for (const event of rawResults) {
					if (!sessionEvents.has(event.session_id)) {
						sessionEvents.set(event.session_id, []);
					}
					sessionEvents.get(event.session_id)?.push(event);
				}

				const referrerGroups = new Map<
					string,
					{ parsed: ReturnType<typeof parseReferrer>; sessionIds: Set<string> }
				>();
				for (const [sessionId, events] of sessionEvents) {
					if (events.length > 0) {
						const referrer = events[0].referrer || 'Direct';
						const parsed = parseReferrer(referrer);
						const groupKey = parsed.domain
							? parsed.domain.toLowerCase()
							: 'direct';
						if (!referrerGroups.has(groupKey)) {
							referrerGroups.set(groupKey, { parsed, sessionIds: new Set() });
						}
						const group = referrerGroups.get(groupKey);
						if (group) {
							group.sessionIds.add(sessionId);
						}
					}
				}

				const referrerAnalytics: {
					referrer: string;
					referrer_parsed: ReturnType<typeof parseReferrer>;
					total_users: number;
					completed_users: number;
					conversion_rate: number;
				}[] = [];
				for (const [groupKey, group] of referrerGroups) {
					const stepCounts = new Map<number, Set<string>>();
					for (const sessionId of group.sessionIds) {
						const events = sessionEvents
							.get(sessionId)
							?.sort((a, b) => a.first_occurrence - b.first_occurrence);
						if (!events) {
							continue;
						}
						let currentStep = 1;
						for (const event of events) {
							if (event.step_number === currentStep) {
								if (!stepCounts.has(currentStep)) {
									stepCounts.set(currentStep, new Set());
								}
								stepCounts.get(currentStep)?.add(sessionId);
								currentStep++;
							}
						}
					}
					const total_users = stepCounts.get(1)?.size || 0;
					if (total_users === 0) {
						continue;
					}
					const completed_users = stepCounts.get(steps.length)?.size || 0;
					const conversion_rate =
						total_users > 0
							? Math.round((completed_users / total_users) * 100 * 100) / 100
							: 0;
					referrerAnalytics.push({
						referrer: groupKey,
						referrer_parsed: group.parsed,
						total_users,
						completed_users,
						conversion_rate,
					});
				}

				const aggregated = new Map<
					string,
					{
						parsed: ReturnType<typeof parseReferrer>;
						total_users: number;
						completed_users: number;
						conversion_rate_sum: number;
						conversion_rate_count: number;
					}
				>();
				for (const {
					referrer,
					referrer_parsed,
					total_users,
					completed_users,
					conversion_rate,
				} of referrerAnalytics) {
					const key = referrer;
					if (!aggregated.has(key)) {
						aggregated.set(key, {
							parsed: referrer_parsed,
							total_users: 0,
							completed_users: 0,
							conversion_rate_sum: 0,
							conversion_rate_count: 0,
						});
					}
					const agg = aggregated.get(key);
					if (agg) {
						agg.total_users += total_users;
						agg.completed_users += completed_users;
						agg.conversion_rate_sum += conversion_rate;
						agg.conversion_rate_count += 1;
					}
				}
				const referrer_analytics = Array.from(aggregated.entries())
					.map(([key, agg]) => ({
						referrer: key,
						referrer_parsed: agg.parsed,
						total_users: agg.total_users,
						completed_users: agg.completed_users,
						conversion_rate:
							agg.conversion_rate_count > 0
								? Math.round(
										(agg.conversion_rate_sum / agg.conversion_rate_count) * 100
									) / 100
								: 0,
					}))
					.sort((a, b) => b.total_users - a.total_users);

				return {
					referrer_analytics,
				};
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}

				logger.error(
					'Failed to fetch funnel analytics by referrer',
					error instanceof Error ? error.message : String(error),
					{
						funnelId: input.funnelId,
						websiteId: website.id,
					}
				);
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to fetch funnel analytics by referrer',
				});
			}
		}),
});
