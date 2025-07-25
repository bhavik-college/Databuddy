import { chQuery, goals } from '@databuddy/db';
import { TRPCError } from '@trpc/server';
import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { authorizeWebsiteAccess } from '../utils/auth';

const goalSchema = z.object({
  type: z.enum(['PAGE_VIEW', 'EVENT', 'CUSTOM']),
  target: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  filters: z
    .array(
      z.object({
        field: z.string(),
        operator: z.enum(['equals', 'contains', 'not_equals', 'in', 'not_in']),
        value: z.union([z.string(), z.array(z.string())]),
      })
    )
    .optional(),
});

const createGoalSchema = z.object({
  websiteId: z.string(),
  ...goalSchema.shape,
});

const updateGoalSchema = z.object({
  id: z.string(),
  type: z.enum(['PAGE_VIEW', 'EVENT', 'CUSTOM']).optional(),
  target: z.string().min(1).optional(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  filters: z
    .array(
      z.object({
        field: z.string(),
        operator: z.enum(['equals', 'contains', 'not_equals', 'in', 'not_in']),
        value: z.union([z.string(), z.array(z.string())]),
      })
    )
    .optional(),
  isActive: z.boolean().optional(),
});

const analyticsDateRangeSchema = z.object({
  goalId: z.string(),
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
) => {
  if (!filters || filters.length === 0) return '';
  const filterConditions = filters
    .map((filter, i) => {
      if (!ALLOWED_FIELDS.has(filter.field)) return '';
      if (!ALLOWED_OPERATORS.has(filter.operator)) return '';
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

export const goalsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ websiteId: z.string() }))
    .query(async ({ ctx, input }) => {
      await authorizeWebsiteAccess(ctx, input.websiteId, 'read');
      const result = await ctx.db
        .select()
        .from(goals)
        .where(
          and(eq(goals.websiteId, input.websiteId), isNull(goals.deletedAt))
        )
        .orderBy(desc(goals.createdAt));
      return result;
    }),
  getById: protectedProcedure
    .input(z.object({ id: z.string(), websiteId: z.string() }))
    .query(async ({ ctx, input }) => {
      await authorizeWebsiteAccess(ctx, input.websiteId, 'read');
      const result = await ctx.db
        .select()
        .from(goals)
        .where(
          and(
            eq(goals.id, input.id),
            eq(goals.websiteId, input.websiteId),
            isNull(goals.deletedAt)
          )
        )
        .limit(1);
      if (result.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Goal not found' });
      }
      return result[0];
    }),
  create: protectedProcedure
    .input(createGoalSchema)
    .mutation(async ({ ctx, input }) => {
      await authorizeWebsiteAccess(ctx, input.websiteId, 'update');
      const goalId = crypto.randomUUID();
      const [newGoal] = await ctx.db
        .insert(goals)
        .values({
          id: goalId,
          websiteId: input.websiteId,
          type: input.type,
          target: input.target,
          name: input.name,
          description: input.description,
          filters: input.filters,
          isActive: true,
          createdBy: ctx.user.id,
        } as any)
        .returning();

      return newGoal;
    }),
  update: protectedProcedure
    .input(updateGoalSchema)
    .mutation(async ({ ctx, input }) => {
      const existingGoal = await ctx.db
        .select({ websiteId: goals.websiteId })
        .from(goals)
        .where(and(eq(goals.id, input.id), isNull(goals.deletedAt)))
        .limit(1);
      if (existingGoal.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Goal not found' });
      }
      await authorizeWebsiteAccess(ctx, existingGoal[0].websiteId, 'update');
      const { id, ...updates } = input;
      const [updatedGoal] = await ctx.db
        .update(goals)
        .set({
          ...updates,
          updatedAt: new Date().toISOString(),
        } as any)
        .where(and(eq(goals.id, id), isNull(goals.deletedAt)))
        .returning();
      return updatedGoal;
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existingGoal = await ctx.db
        .select({ websiteId: goals.websiteId })
        .from(goals)
        .where(and(eq(goals.id, input.id), isNull(goals.deletedAt)))
        .limit(1);
      if (existingGoal.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Goal not found' });
      }
      await authorizeWebsiteAccess(ctx, existingGoal[0].websiteId, 'delete');
      await ctx.db
        .update(goals)
        .set({
          deletedAt: new Date().toISOString(),
          isActive: false,
        } as any)
        .where(and(eq(goals.id, input.id), isNull(goals.deletedAt)));
      return { success: true };
    }),
  getAnalytics: protectedProcedure
    .input(analyticsDateRangeSchema)
    .query(async ({ ctx, input }) => {
      await authorizeWebsiteAccess(ctx, input.websiteId, 'read');
      const { startDate, endDate } =
        input.startDate && input.endDate
          ? { startDate: input.startDate, endDate: input.endDate }
          : getDefaultDateRange();
      const goal = await ctx.db
        .select()
        .from(goals)
        .where(
          and(
            eq(goals.id, input.goalId),
            eq(goals.websiteId, input.websiteId),
            isNull(goals.deletedAt)
          )
        )
        .limit(1);
      if (goal.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Goal not found' });
      }
      const goalData = goal[0];
      const steps = [
        {
          type: goalData.type,
          target: goalData.target,
          name: goalData.name,
        },
      ];
      const filters =
        (goalData.filters as Array<{
          field: string;
          operator: string;
          value: string | string[];
        }>) || [];
      const params: Record<string, unknown> = {
        websiteId: input.websiteId,
        startDate,
        endDate: endDate + ' 23:59:59',
      };
      const filterConditions = buildFilterConditions(filters, 'f', params);
      const totalWebsiteUsersQuery = `
                SELECT COUNT(DISTINCT session_id) as total_users
                FROM analytics.events
                WHERE client_id = {websiteId:String}
                    AND time >= parseDateTimeBestEffort({startDate:String})
                    AND time <= parseDateTimeBestEffort({endDate:String})
            `;
      const totalWebsiteUsersResult = await chQuery<{ total_users: number }>(
        totalWebsiteUsersQuery,
        params
      );
      const totalWebsiteUsers = totalWebsiteUsersResult[0]?.total_users || 0;
      let whereCondition = '';
      const stepNameKey = 'step_name_0';
      const targetKey = 'target_0';
      params[stepNameKey] = steps[0].name;
      if (steps[0].type === 'PAGE_VIEW') {
        params[targetKey] = steps[0].target;
        whereCondition = `event_name = 'screen_view' AND (path = {${targetKey}:String} OR path LIKE {${targetKey}_like:String})`;
        params[`${targetKey}_like`] = `%${steps[0].target}%`;
      } else if (steps[0].type === 'EVENT') {
        params[targetKey] = steps[0].target;
        whereCondition = `event_name = {${targetKey}:String}`;
      }
      const stepQuery = `
                SELECT 
                    1 as step_number,
                    {${stepNameKey}:String} as step_name,
                    session_id,
                    MIN(time) as first_occurrence
                FROM analytics.events
                WHERE client_id = {websiteId:String}
                    AND time >= parseDateTimeBestEffort({startDate:String})
                    AND time <= parseDateTimeBestEffort({endDate:String})
                    AND ${whereCondition}${filterConditions}
                GROUP BY session_id`;
      const analysisQuery = `
                WITH all_step_events AS (
                    ${stepQuery}
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
      const goalCompletions = stepCounts.get(1)?.size || 0;
      const conversion_rate =
        totalWebsiteUsers > 0 ? (goalCompletions / totalWebsiteUsers) * 100 : 0;
      const dropoffs = 0;
      const dropoff_rate = 0;
      const analyticsResults = [
        {
          step_number: 1,
          step_name: steps[0].name,
          users: goalCompletions,
          total_users: totalWebsiteUsers,
          conversion_rate,
          dropoffs,
          dropoff_rate,
          avg_time_to_complete: 0,
        },
      ];
      return {
        overall_conversion_rate: conversion_rate,
        total_users_entered: totalWebsiteUsers,
        total_users_completed: goalCompletions,
        avg_completion_time: 0,
        avg_completion_time_formatted: '0s',
        steps_analytics: analyticsResults,
      };
    }),
  bulkAnalytics: protectedProcedure
    .input(
      z.object({
        websiteId: z.string(),
        goalIds: z.array(z.string()),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      await authorizeWebsiteAccess(ctx, input.websiteId, 'read');
      const { startDate, endDate } =
        input.startDate && input.endDate
          ? { startDate: input.startDate, endDate: input.endDate }
          : getDefaultDateRange();
      const goalsList = await ctx.db
        .select()
        .from(goals)
        .where(
          and(
            eq(goals.websiteId, input.websiteId),
            isNull(goals.deletedAt),
            input.goalIds.length > 0
              ? inArray(goals.id, input.goalIds)
              : sql`1=0`
          )
        )
        .orderBy(desc(goals.createdAt));
      const params: Record<string, unknown> = {
        websiteId: input.websiteId,
        startDate,
        endDate: `${endDate} 23:59:59`,
      };
      const totalWebsiteUsersQuery = `
                SELECT COUNT(DISTINCT session_id) as total_users
                FROM analytics.events
                WHERE client_id = {websiteId:String}
                    AND time >= parseDateTimeBestEffort({startDate:String})
                    AND time <= parseDateTimeBestEffort({endDate:String})
            `;
      const totalWebsiteUsersResult = await chQuery<{ total_users: number }>(
        totalWebsiteUsersQuery,
        params
      );
      const totalWebsiteUsers = totalWebsiteUsersResult[0]?.total_users || 0;

      const analyticsResults: Record<string, any> = {};
      for (const goalData of goalsList) {
        const steps = [
          {
            type: goalData.type,
            target: goalData.target,
            name: goalData.name,
          },
        ];
        const localParams = { ...params };
        const filters =
          (goalData.filters as Array<{
            field: string;
            operator: string;
            value: string | string[];
          }>) || [];
        const filterConditions = buildFilterConditions(
          filters,
          'f',
          localParams
        );
        let whereCondition = '';
        const stepNameKey = 'step_name_0';
        const targetKey = 'target_0';
        localParams[stepNameKey] = steps[0].name;
        if (steps[0].type === 'PAGE_VIEW') {
          localParams[targetKey] = steps[0].target;
          whereCondition = `event_name = 'screen_view' AND (path = {${targetKey}:String} OR path LIKE {${targetKey}_like:String})`;
          localParams[`${targetKey}_like`] = `%${steps[0].target}%`;
        } else if (steps[0].type === 'EVENT') {
          localParams[targetKey] = steps[0].target;
          whereCondition = `event_name = {${targetKey}:String}`;
        }
        const stepQuery = `
                    SELECT 
                        1 as step_number,
                        {${stepNameKey}:String} as step_name,
                        session_id,
                        MIN(time) as first_occurrence
                    FROM analytics.events
                    WHERE client_id = {websiteId:String}
                        AND time >= parseDateTimeBestEffort({startDate:String})
                        AND time <= parseDateTimeBestEffort({endDate:String})
                        AND ${whereCondition}${filterConditions}
                    GROUP BY session_id`;
        const analysisQuery = `
                    WITH all_step_events AS (
                        ${stepQuery}
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
        }>(analysisQuery, localParams);
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
        const goalCompletions = stepCounts.get(1)?.size || 0;
        const conversion_rate =
          totalWebsiteUsers > 0
            ? (goalCompletions / totalWebsiteUsers) * 100
            : 0;
        const dropoffs = 0;
        const dropoff_rate = 0;
        const analyticsStep = {
          step_number: 1,
          step_name: steps[0].name,
          users: goalCompletions,
          total_users: totalWebsiteUsers,
          conversion_rate,
          dropoffs,
          dropoff_rate,
          avg_time_to_complete: 0,
        };
        analyticsResults[goalData.id] = {
          overall_conversion_rate: conversion_rate,
          total_users_entered: totalWebsiteUsers,
          total_users_completed: goalCompletions,
          avg_completion_time: 0,
          avg_completion_time_formatted: '0s',
          steps_analytics: [analyticsStep],
        };
      }
      return analyticsResults;
    }),
});
