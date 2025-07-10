/**
 * AI Assistant API
 * 
 * Provides AI-powered analytics assistant with streaming responses and SQL query generation.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { chQuery, db, member, eq, and } from '@databuddy/db';
import type { AppVariables } from '../../types';
import { authMiddleware } from '../../middleware/auth';
import { websiteAuthHook } from '../../middleware/website';
import { logger } from '../../lib/logger';
import OpenAI from 'openai';
import { Autumn as autumn } from "autumn-js";
import { cacheable } from '@databuddy/redis';
import { AIResponseJsonSchema, enhancedAnalysisPrompt } from '../../prompts/assistant';

// ============================================================================
// TYPES
// ============================================================================

export interface StreamingUpdate {
  type: 'thinking' | 'progress' | 'complete' | 'error';
  content: string;
  data?: Record<string, unknown>;
  debugInfo?: Record<string, unknown>;
}

interface AutumnCheckResult {
  allowed: boolean;
  error?: string;
  data: unknown | null;
}

interface AutumnTrackResult {
  success: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const OPENAI_CONFIG = {
  apiKey: process.env.AI_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
} as const;

const FORBIDDEN_SQL_KEYWORDS = [
  'INSERT INTO', 'UPDATE SET', 'DELETE FROM', 'DROP TABLE', 'DROP DATABASE',
  'CREATE TABLE', 'CREATE DATABASE', 'ALTER TABLE', 'EXEC ', 'EXECUTE ',
  'TRUNCATE', 'MERGE', 'BULK', 'RESTORE', 'BACKUP'
] as const;

// const AI_MODEL = 'google/gemini-2.0-flash-001';
const AI_MODEL = 'google/gemini-2.5-flash-lite-preview-06-17';
// const AI_MODEL = 'x-ai/grok-4-07-09';
// const AI_MODEL = 'cohere/command-r';

const openai = new OpenAI(OPENAI_CONFIG);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Gets the billing customer ID for autumn tracking
 * Uses organization owner ID if in organization context, otherwise user ID
 */
async function getBillingCustomerId(userId: string, organizationId?: string | null): Promise<string> {
  if (!organizationId) return userId;

  if (!userId) {
    throw new Error('User ID is required for billing customer ID');
  }

  const orgOwnerId = await getOrganizationOwnerId(organizationId);
  return orgOwnerId || userId;
}

/**
 * Handles autumn limit checking and tracking
 */
async function handleAutumnLimits(
  customerId: string,
  action: 'check' | 'track',
  value = 1
): Promise<AutumnCheckResult | AutumnTrackResult> {
  if (!customerId) {
    logger.warn('[Assistant API] No customer ID provided for autumn limits');
    return action === 'check'
      ? { allowed: true, data: null } as AutumnCheckResult
      : { success: false } as AutumnTrackResult;
  }

  try {
    if (action === 'check') {
      const { data } = await autumn.check({
        customer_id: customerId,
        feature_id: 'assistant_message',
      });

      const result: AutumnCheckResult = {
        allowed: data?.allowed ?? true,
        data,
        ...(data?.allowed === false && { error: "Assistant message limit exceeded" })
      };

      return result;
    }

    await autumn.track({
      customer_id: customerId,
      feature_id: 'assistant_message',
      value,
    });
    return { success: true } as AutumnTrackResult;
  } catch (error) {
    logger.error(`[Assistant API] Error with autumn ${action}:`, { error });
    // Continue without autumn if service is unavailable
    return action === 'check'
      ? { allowed: true, data: null } as AutumnCheckResult
      : { success: false } as AutumnTrackResult;
  }
}

async function _getOrganizationOwnerId(organizationId: string): Promise<string | null> {
  if (!organizationId) return null;

  try {
    const orgMember = await db.query.member.findFirst({
      where: and(
        eq(member.organizationId, organizationId),
        eq(member.role, 'owner'),
      ),
      columns: { userId: true },
    });

    return orgMember?.userId || null;
  } catch (error) {
    logger.error('[Assistant API] Error fetching organization owner:', { error, organizationId });
    return null;
  }
}

const getOrganizationOwnerId = cacheable(_getOrganizationOwnerId, {
  expireInSec: 300,
  prefix: 'org_owner',
  staleWhileRevalidate: true,
  staleTime: 60
});

function validateSQL(sql: string): boolean {
  const upperSQL = sql.toUpperCase();
  const trimmed = upperSQL.trim();

  // Check for dangerous keyword patterns
  for (const keyword of FORBIDDEN_SQL_KEYWORDS) {
    if (upperSQL.includes(keyword)) return false;
  }

  // Must start with SELECT or WITH (for CTEs)
  return trimmed.startsWith('SELECT') || trimmed.startsWith('WITH');
}

function debugLog(step: string, data: unknown): void {
  logger.info(`🔍 [AI-Assistant] ${step}`, { step, data });
}

function createThinkingStep(step: string): string {
  return `🧠 ${step}`;
}

async function trackAssistantUsage(userId: string, organizationId: string | null): Promise<void> {
  try {
    const customerId = await getBillingCustomerId(userId, organizationId);
    await handleAutumnLimits(customerId, 'track', 1);
  } catch (error) {
    logger.error('[Assistant API] Error tracking autumn usage:', { error });
  }
}

async function executeQuery(sql: string): Promise<unknown[]> {
  const queryStart = Date.now();
  const result = await chQuery(sql);
  const queryTime = Date.now() - queryStart;

  debugLog("Query execution completed", { timeTaken: `${queryTime}ms`, resultCount: result.length });

  return result;
}

// ============================================================================
// ROUTER SETUP
// ============================================================================

export const assistantRouter = new Hono<{ Variables: AppVariables }>();

assistantRouter.use('*', authMiddleware);
assistantRouter.use('*', websiteAuthHook({ website: ["read"] }));

// ============================================================================
// ROUTE HANDLERS
// ============================================================================

/**
 * Process AI request with streaming updates
 * POST /assistant/stream
 */
assistantRouter.post('/stream', async (c) => {
  const { message, website_id, context } = await c.req.json();
  const website = c.get('website');
  const user = c.get('user');

  if (!website?.id) {
    return c.json({ error: 'Website not found' }, 404);
  }

  if (!user) {
    return c.json({ error: 'User not found' }, 401);
  }

  // Check assistant message limits with autumn
  try {
    const customerId = await getBillingCustomerId(user.id, (website as any).organizationId);
    const limitCheck = await handleAutumnLimits(customerId, 'check');

    if ('allowed' in limitCheck && !limitCheck.allowed) {
      return c.json({
        error: limitCheck.error || "Assistant message limit exceeded",
        code: 'ASSISTANT_LIMIT_EXCEEDED'
      }, 429);
    }
  } catch (error) {
    logger.error('[Assistant API] Error checking autumn limits:', { error });
  }

  const websiteHostname = website.domain;
  const startTime = Date.now();
  const debugInfo: Record<string, unknown> = {};

  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = (update: StreamingUpdate) => {
        const data = `data: ${JSON.stringify(update)}\n\n`;
        controller.enqueue(new TextEncoder().encode(data));
      };

      try {
        debugLog("✅ Input validated", { message, website_id, websiteHostname });
        if ((user as any).role === 'ADMIN') {
          debugInfo.validatedInput = { message, website_id, websiteHostname };
        }

        const aiStart = Date.now();
        const fullPrompt = enhancedAnalysisPrompt(message, website_id, websiteHostname, context?.previousMessages);

        const completion = await openai.chat.completions.create({
          model: AI_MODEL,
          messages: [{ role: 'system', content: fullPrompt }],
          temperature: 0.1,
          response_format: { type: 'json_object' }
        });

        const aiResponseText = completion.choices[0]?.message?.content || '';
        const aiTime = Date.now() - aiStart;

        debugLog("📝 Raw AI JSON response", { aiResponseText, timeTaken: `${aiTime}ms` });

        let parsedAiJson: z.infer<typeof AIResponseJsonSchema>;
        try {
          const cleanedResponse = aiResponseText.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
          parsedAiJson = AIResponseJsonSchema.parse(JSON.parse(cleanedResponse));
          debugLog("✅ AI JSON response parsed", parsedAiJson);
        } catch (parseError) {
          debugLog("❌ AI JSON parsing failed", {
            error: parseError,
            rawText: aiResponseText,
            errorMessage: parseError instanceof Error ? parseError.message : 'Unknown error'
          });

          sendUpdate({
            type: 'error',
            content: "AI response parsing failed. Please try rephrasing.",
            debugInfo: (user as any).role === 'ADMIN' ? {
              ...debugInfo,
              parseError: parseError instanceof Error ? parseError.message : 'Unknown error',
              rawResponse: aiResponseText
            } : undefined
          });
          controller.close();
          return;
        }

        // Process thinking steps
        if (parsedAiJson.thinking_steps?.length) {
          for (const step of parsedAiJson.thinking_steps) {
            sendUpdate({ type: 'thinking', content: createThinkingStep(step) });
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }

        // Handle different response types
        switch (parsedAiJson.response_type) {
          case 'text':
            await trackAssistantUsage(user.id, (website as any).organizationId);
            sendUpdate({
              type: 'complete',
              content: parsedAiJson.text_response || "Here's the answer to your question.",
              data: { hasVisualization: false, responseType: 'text' },
              debugInfo: (user as any).role === 'ADMIN' ? debugInfo : undefined
            });
            break;

          case 'metric':
            await handleMetricResponse(parsedAiJson, user, website, sendUpdate, debugInfo);
            break;

          case 'chart':
            if (parsedAiJson.sql) {
              await handleChartResponse(parsedAiJson, user, website, startTime, aiTime, sendUpdate, debugInfo);
            } else {
              sendUpdate({
                type: 'error',
                content: "Invalid chart configuration.",
                debugInfo: (user as any).role === 'ADMIN' ? debugInfo : undefined
              });
            }
            break;

          default:
            sendUpdate({
              type: 'error',
              content: "Invalid response format from AI.",
              debugInfo: (user as any).role === 'ADMIN' ? debugInfo : undefined
            });
        }

        controller.close();

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        debugLog("💥 Processing error", { error: errorMessage });

        sendUpdate({
          type: 'error',
          content: error instanceof z.ZodError
            ? `Invalid input: ${error.errors?.map(e => e.message).join(', ')}`
            : "An unexpected error occurred.",
          debugInfo: (user as any).role === 'ADMIN' ? { error: errorMessage } : undefined
        });

        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
});

// ============================================================================
// RESPONSE HANDLERS
// ============================================================================

async function handleMetricResponse(
  parsedAiJson: z.infer<typeof AIResponseJsonSchema>,
  user: any,
  website: any,
  sendUpdate: (update: StreamingUpdate) => void,
  debugInfo: Record<string, unknown>
): Promise<void> {
  if (parsedAiJson.sql) {
    if (!validateSQL(parsedAiJson.sql || '')) {
      sendUpdate({
        type: 'error',
        content: "Generated query failed security validation.",
        debugInfo: user.role === 'ADMIN' ? debugInfo : undefined
      });
      return;
    }

    try {
      const queryData = await executeQuery(parsedAiJson.sql);
      const metricValue = extractMetricValue(queryData, parsedAiJson.metric_value);
      await sendMetricResponse(parsedAiJson, metricValue, user, website, sendUpdate, debugInfo);
    } catch (queryError: unknown) {
      debugLog("❌ Metric SQL execution error", {
        error: queryError instanceof Error ? queryError.message : 'Unknown error',
        sql: parsedAiJson.sql
      });
      await sendMetricResponse(parsedAiJson, parsedAiJson.metric_value, user, website, sendUpdate, debugInfo);
    }
  } else {
    await sendMetricResponse(parsedAiJson, parsedAiJson.metric_value, user, website, sendUpdate, debugInfo);
  }
}

async function handleChartResponse(
  parsedAiJson: z.infer<typeof AIResponseJsonSchema>,
  user: any,
  website: any,
  startTime: number,
  aiTime: number,
  sendUpdate: (update: StreamingUpdate) => void,
  debugInfo: Record<string, unknown>
): Promise<void> {
  if (!parsedAiJson.sql) {
    sendUpdate({
      type: 'error',
      content: "AI did not provide a query for the chart.",
      debugInfo: user.role === 'ADMIN' ? debugInfo : undefined
    });
    return;
  }

  if (!validateSQL(parsedAiJson.sql)) {
    sendUpdate({
      type: 'error',
      content: "Generated query failed security validation.",
      debugInfo: user.role === 'ADMIN' ? debugInfo : undefined
    });
    return;
  }

  try {
    const queryData = await executeQuery(parsedAiJson.sql);
    const totalTime = Date.now() - startTime;

    if (user.role === 'ADMIN') {
      debugInfo.processing = { aiTime, queryTime: Date.now() - startTime - aiTime, totalTime };
    }

    await trackAssistantUsage(user.id, website.organizationId);

    sendUpdate({
      type: 'complete',
      content: queryData.length > 0
        ? `Found ${queryData.length} data points. Displaying as a ${parsedAiJson.chart_type?.replace(/_/g, ' ') || 'chart'}.`
        : "No data found for your query.",
      data: {
        hasVisualization: queryData.length > 0,
        chartType: parsedAiJson.chart_type,
        data: queryData,
        responseType: 'chart'
      },
      debugInfo: user.role === 'ADMIN' ? debugInfo : undefined
    });
  } catch (queryError: unknown) {
    debugLog("❌ SQL execution error", {
      error: queryError instanceof Error ? queryError.message : 'Unknown error',
      sql: parsedAiJson.sql
    });
    sendUpdate({
      type: 'error',
      content: "Database query failed. The data might not be available.",
      debugInfo: user.role === 'ADMIN' ? debugInfo : undefined
    });
  }
}

function extractMetricValue(queryData: unknown[], defaultValue: unknown): unknown {
  if (!queryData.length || !queryData[0]) return defaultValue;

  const firstRow = queryData[0] as Record<string, unknown>;
  const valueKey = Object.keys(firstRow).find(key => typeof firstRow[key] === 'number') ||
    Object.keys(firstRow)[0];

  return valueKey ? firstRow[valueKey] : defaultValue;
}

async function sendMetricResponse(
  parsedAiJson: z.infer<typeof AIResponseJsonSchema>,
  metricValue: unknown,
  user: any,
  website: any,
  sendUpdate: (update: StreamingUpdate) => void,
  debugInfo: Record<string, unknown>
): Promise<void> {
  await trackAssistantUsage(user.id, website.organizationId);

  const formattedValue = typeof metricValue === 'number'
    ? metricValue.toLocaleString()
    : metricValue;

  sendUpdate({
    type: 'complete',
    content: parsedAiJson.text_response ||
      `${parsedAiJson.metric_label || 'Result'}: ${formattedValue}`,
    data: {
      hasVisualization: false,
      responseType: 'metric',
      metricValue: metricValue,
      metricLabel: parsedAiJson.metric_label
    },
    debugInfo: user.role === 'ADMIN' ? debugInfo : undefined
  });
}

export default assistantRouter; 