/**
 * AI Assistant API
 * 
 * Provides AI-powered analytics assistant with streaming responses and SQL query generation.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { chQuery } from '@databuddy/db';
import type { AppVariables } from '../../types';
import { authMiddleware } from '../../middleware/auth';
import { websiteAuthHook } from '../../middleware/website';
import { logger } from '../../lib/logger';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.AI_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

const AnalyticsSchema = {
  columns: [
    { name: 'client_id', type: 'String', description: 'Website identifier' },
    { name: 'event_name', type: 'String', description: 'Type of event (screen_view, page_exit, etc)' },
    { name: 'time', type: 'DateTime64', description: 'Event timestamp' },
    { name: 'path', type: 'String', description: 'URL path of the page' },
    { name: 'title', type: 'String', description: 'Page title' },
    { name: 'referrer', type: 'String', description: 'Referrer URL' },
    { name: 'country', type: 'String', description: 'User country' },
    { name: 'browser_name', type: 'String', description: 'Browser name' },
    { name: 'os_name', type: 'String', description: 'Operating system' },
    { name: 'device_type', type: 'String', description: 'Device type (desktop, mobile, tablet)' },
    { name: 'utm_source', type: 'String', description: 'UTM source parameter' },
    { name: 'utm_medium', type: 'String', description: 'UTM medium parameter' },
    { name: 'utm_campaign', type: 'String', description: 'UTM campaign parameter' },
    { name: 'session_id', type: 'String', description: 'User session identifier' },
    { name: 'anonymous_id', type: 'String', description: 'Anonymous user identifier' },
    { name: 'time_on_page', type: 'Float32', description: 'Time spent on page in seconds' },
    { name: 'scroll_depth', type: 'Float32', description: 'Page scroll depth percentage' },
    { name: 'is_bounce', type: 'UInt8', description: 'Whether this was a bounce (1) or not (0)' },
    { name: 'load_time', type: 'Int32', description: 'Page load time in milliseconds' },
    { name: 'ttfb', type: 'Int32', description: 'Time to first byte in milliseconds' }
  ]
};

// Validation schemas
const chatRequestSchema = z.object({
  message: z.string().min(1).max(1000),
  website_id: z.string().min(1),
  context: z.object({
    previousMessages: z.array(z.any()).optional(),
    dateRange: z.any().optional()
  }).optional()
});

const AIResponseJsonSchema = z.object({
  sql: z.string().nullable().optional(),
  chart_type: z.enum(['bar', 'line', 'pie', 'area', 'stacked_bar', 'multi_line']).nullable().optional(),
  response_type: z.enum(['chart', 'text', 'metric']),
  text_response: z.string().nullable().optional(),
  metric_value: z.union([z.string(), z.number()]).nullable().optional(),
  metric_label: z.string().nullable().optional()
});

export interface StreamingUpdate {
  type: 'thinking' | 'progress' | 'complete' | 'error';
  content: string;
  data?: any;
  debugInfo?: Record<string, any>;
}

function validateSQL(sql: string): boolean {
  // Only block truly dangerous operations - don't block safe keywords like CASE, WHEN, etc.
  const forbiddenKeywords = [
    'INSERT INTO', 'UPDATE SET', 'DELETE FROM', 'DROP TABLE', 'DROP DATABASE', 
    'CREATE TABLE', 'CREATE DATABASE', 'ALTER TABLE', 'EXEC ', 'EXECUTE ',
    'TRUNCATE', 'MERGE', 'BULK', 'RESTORE', 'BACKUP'
  ];
  const upperSQL = sql.toUpperCase();
  
  // Check for dangerous keyword patterns
  for (const keyword of forbiddenKeywords) {
    if (upperSQL.includes(keyword)) return false;
  }
  
  // Block standalone UNION that could be used for injection (but allow UNION in subqueries/CTEs)
  if (upperSQL.match(/\bUNION\s+(ALL\s+)?SELECT/)) {
    return false;
  }
  
  // Must start with SELECT or WITH (for CTEs)
  const trimmed = upperSQL.trim();
  return trimmed.startsWith('SELECT') || trimmed.startsWith('WITH');
}

function debugLog(step: string, data: any) {
  logger.info(`🔍 [AI-Assistant] ${step}`, { step, data });
}

function createThinkingStep(step: string): string {
  return `🧠 ${step}`;
}

const enhancedAnalysisPrompt = (userQuery: string, websiteId: string, websiteHostname: string, previousMessages?: any[]) => `
You are Nova - an advanced AI analytics partner that provides intelligent responses based on user queries, your only job is to return the correct SQL query and chart type based on the user's query.

EXECUTION CONTEXT:
- User Query: "${userQuery}"
- Website ID: ${websiteId}
- Website Hostname: ${websiteHostname}
- Current Date (UTC): ${new Date().toISOString().split('T')[0]}
- Current Year: ${new Date().getFullYear()}
- Current Month: ${new Date().getMonth() + 1}
- Current Timestamp: ${new Date().toISOString()}

TIME-BASED QUERY RULES:
- For "yesterday": use \`toDate(time) = yesterday()\`
- For "today": use \`toDate(time) = today()\`
- For "this week" or "last 7 days": use \`time >= today() - INTERVAL '7' DAY\`
- For "this month": use \`time >= date_trunc('month', today())\`
- For "last 30 days": use \`time >= today() - INTERVAL '30' DAY\`
- For unspecified time ranges: default to "last 7 days"
- Always use proper ClickHouse date functions: today(), yesterday(), date_trunc(), INTERVAL syntax

${previousMessages && previousMessages.length > 0 ? `
CONVERSATION CONTEXT:
${previousMessages.slice(-4).map((msg: any) => `${msg.type}: ${msg.content}`).join('\n')}

Use this context to provide more relevant responses and avoid repeating information.
` : ''}

DATABASE SCHEMA:
${JSON.stringify(AnalyticsSchema.columns.map(col => ({name: col.name, type: col.type, description: col.description})), null, 2)};

RESPONSE FORMAT (JSON - ONLY THIS, NO EXTRA TEXT OR MARKDOWN):
{
  "response_type": "chart" | "text" | "metric",
  "sql": "SELECT ... FROM analytics.events WHERE client_id = '${websiteId}' AND ...", // required for "chart" type
  "chart_type": "bar" | "line" | "pie" | "area" | "stacked_bar" | "multi_line", // required for "chart" type
  "text_response": "Contextual explanation for metric or direct answer for text", // required for "text" and "metric" types
  "metric_value": "123" | 123, // required for "metric" type
  "metric_label": "Total Page Views" // required for "metric" type
}

RESPONSE TYPE SELECTION GUIDE:
- "metric": Use when the user asks for a single specific number or metric (e.g., "how many page views yesterday?", "what's my bounce rate?", "total users this month?"). Provide the single number/value with a clear label and contextual explanation.
- "text": Use for general questions, explanations, recommendations, or when no data query is needed (e.g., "what does bounce rate mean?", "how to improve SEO?", "explain UTM parameters"). Provide a helpful text response.
- "chart": Use when the user wants to see trends, comparisons, breakdowns, or multi-dimensional data that benefits from visualization (e.g., "show traffic over time", "compare device types", "top traffic sources").

AMBIGUITY & FALLBACK RULE:
- If the user's query is too vague, ambiguous, or asks for data not available in the schema (e.g., "user demographics", "revenue", "conversion tracking without setup"), you MUST respond with:
{
  "response_type": "text",
  "sql": null,
  "chart_type": null,
  "text_response": "I'm sorry, I can't answer that question with the available data. To help me provide better insights, could you please rephrase your question? For example, instead of 'show me performance', you could ask 'show me page load times by browser for the last 7 days' or 'what's my average bounce rate this month?'",
  "metric_value": null,
  "metric_label": null
}

CHART TYPE SELECTION GUIDE (only for response_type: "chart"):
- "line": Single metric over time (e.g., total pageviews by day). Use if the focus is on the trend of one continuous value.;
- "area": Similar to line, but emphasizes volume. Good for a single metric over time.;
- "multi_line": For comparing trends of 2 or more categories (e.g., different browsers, device types) over a continuous time dimension. Best if there are many time points or more than 3-4 categories. Example: Page load times for Safari, Chrome, Firefox shown as separate lines over a date range.;
- "stacked_bar": Use for comparing a few categories (typically 2-4, e.g., mobile vs. desktop) over a time dimension (e.g., daily, hourly). This shows both individual contributions and their total at each time point. If the user requests a "bar chart" for a time-based comparison of a few categories, prefer "stacked_bar". Also suitable for showing parts-of-a-whole for several main categories (e.g., traffic sources per country, where each country is a bar stack).;
- "bar": For simple categorical comparisons NOT over a continuous time series (e.g., total pageviews per country, top 5 referrers). Use this if the x-axis is categorical and not time.;
- "pie": For part-of-whole relationships for a single point in time or aggregated data with a few (2-5) segments. Avoid for time series or many categories.;

ADVANCED QUERY PATTERNS:
1. Top N queries (for bar charts - "top pages", "top referrers", etc.):
   Query: "Top 10 pages by traffic", "Top referrers", "Most popular pages";
   SQL: SELECT [DIMENSION_COLUMN] AS page, COUNT(*) AS pageviews FROM analytics.events WHERE client_id = '${websiteId}' AND event_name = 'screen_view' GROUP BY [DIMENSION_COLUMN] ORDER BY pageviews DESC LIMIT 10;
   Chart Type: "bar";
   Example for "Top 10 pages by traffic":
     SQL: SELECT path, COUNT(*) AS pageviews FROM analytics.events WHERE client_id = '${websiteId}' AND event_name = 'screen_view' GROUP BY path ORDER BY pageviews DESC LIMIT 10;
     Chart Type: "bar";

2. Time series with categories (for multi-line or stacked_bar charts):
   Query: "[METRIC] by [CATEGORY_DIMENSION] over [TIME_DIMENSION]" (e.g., "pageviews by device type per day", "page load times by browser over time");
   SQL: SELECT toDate(time) AS date, [CATEGORY_DIMENSION_COLUMN], AGGREGATE([METRIC_COLUMN]) AS metric_value FROM analytics.events WHERE client_id = '${websiteId}' ... GROUP BY date, [CATEGORY_DIMENSION_COLUMN] ORDER BY date, [CATEGORY_DIMENSION_COLUMN];
   Chart Type Decision:
     - If 2-4 categories AND user query hints at "bar" or comparison is direct (e.g., "mobile vs desktop"): "stacked_bar";
     - Otherwise (many categories, many time points, or general trend comparison): "multi_line";
   Example for "mobile vs desktop pageviews by day" (prefer stacked_bar):
     SQL: SELECT toDate(time) AS date, device_type, COUNT(*) AS pageviews FROM analytics.events WHERE client_id = '${websiteId}' AND device_type IN ('mobile', 'desktop') AND event_name = 'screen_view' GROUP BY date, device_type ORDER BY date, device_type;
     Chart Type: "stacked_bar";

3. Comparative analysis (typically bar - if not over time, or stacked_bar - if one dimension is time):
   Example: "traffic sources by device" (not over time) → GROUP BY referrer, device_type (Could be complex; simplify or use a bar chart for top referrers, with device breakdown in explanation or a secondary chart if possible. If this implies a breakdown for *each* referrer by device, and there are many referrers, this is too complex for a single chart. Focus on top-level summary.);
   SQL for Top Referrers: SELECT referrer, COUNT(*) AS pageviews FROM analytics.events WHERE client_id = '${websiteId}' AND event_name='screen_view' AND referrer IS NOT NULL AND referrer != '' AND (domain(referrer) != '${websiteHostname}' AND NOT domain(referrer) ILIKE '%.${websiteHostname}') AND domain(referrer) NOT IN ('localhost', '127.0.0.1') GROUP BY referrer ORDER BY pageviews DESC LIMIT 10;
   Chart Type: "bar";

4. Performance metrics:
   Example: "average page load times daily" → AVG(load_time) GROUP BY toDate(time) (Chart: "line");
   Example: "page load times by browser daily" → (Use pattern 2 above. Chart: "multi_line" or "stacked_bar" depending on number of browsers and desired emphasis);

5. Trend analysis (single metric over time):
   Example: "hourly traffic patterns for today" → SELECT toHour(time) as hour, COUNT(*) as pageviews FROM analytics.events WHERE client_id = '${websiteId}' AND event_name='screen_view' AND toDate(time) = today() GROUP BY hour ORDER BY hour (Chart: "line");

COMPLEX ANALYTICS CHART PATTERNS:
6. Bounce rate analysis by entry page (advanced session tracking):
   Example: "bounce rate by entry page" → "WITH entry_pages AS (SELECT session_id, path, MIN(time) as entry_time FROM analytics.events WHERE client_id = '${websiteId}' AND event_name = 'screen_view' GROUP BY session_id, path QUALIFY ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY entry_time) = 1), session_metrics AS (SELECT ep.path, ep.session_id, countIf(e.event_name = 'screen_view') as page_count FROM entry_pages ep LEFT JOIN analytics.events e ON ep.session_id = e.session_id WHERE e.client_id = '${websiteId}' GROUP BY ep.path, ep.session_id) SELECT path, COUNT(*) as sessions, (countIf(page_count = 1) / count()) * 100 as bounce_rate FROM session_metrics GROUP BY path HAVING sessions >= 10 ORDER BY sessions DESC LIMIT 15" (Chart: "bar");

7. Session depth distribution (engagement analysis):
   Example: "session depth distribution" → "WITH session_pages AS (SELECT session_id, countIf(event_name = 'screen_view') as page_count FROM analytics.events WHERE client_id = '${websiteId}' GROUP BY session_id), depth_buckets AS (SELECT CASE WHEN page_count = 1 THEN '1 page' WHEN page_count = 2 THEN '2 pages' WHEN page_count BETWEEN 3 AND 5 THEN '3-5 pages' WHEN page_count BETWEEN 6 AND 10 THEN '6-10 pages' ELSE '10+ pages' END as depth_bucket, count() as sessions FROM session_pages GROUP BY depth_bucket) SELECT depth_bucket, sessions FROM depth_buckets ORDER BY CASE depth_bucket WHEN '1 page' THEN 1 WHEN '2 pages' THEN 2 WHEN '3-5 pages' THEN 3 WHEN '6-10 pages' THEN 4 ELSE 5 END" (Chart: "pie");

8. Time-based engagement patterns:
   Example: "bounce rate trends by day" → "WITH daily_sessions AS (SELECT toDate(time) as date, session_id, countIf(event_name = 'screen_view') as page_count FROM analytics.events WHERE client_id = '${websiteId}' AND time >= today() - INTERVAL '30' DAY GROUP BY date, session_id) SELECT date, (countIf(page_count = 1) / count()) * 100 as bounce_rate FROM daily_sessions GROUP BY date ORDER BY date" (Chart: "line");

9. Performance correlation analysis:
   Example: "bounce rate vs page load time" → "WITH page_performance AS (SELECT path, AVG(load_time) as avg_load_time FROM analytics.events WHERE client_id = '${websiteId}' AND load_time > 0 GROUP BY path), page_bounce AS (SELECT ep.path, (countIf(sm.page_count = 1) / count()) * 100 as bounce_rate FROM (SELECT session_id, path, MIN(time) as entry_time FROM analytics.events WHERE client_id = '${websiteId}' AND event_name = 'screen_view' GROUP BY session_id, path QUALIFY ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY entry_time) = 1) ep LEFT JOIN (SELECT session_id, countIf(event_name = 'screen_view') as page_count FROM analytics.events WHERE client_id = '${websiteId}' GROUP BY session_id) sm ON ep.session_id = sm.session_id GROUP BY ep.path HAVING count() >= 20) SELECT pp.path, pp.avg_load_time, pb.bounce_rate FROM page_performance pp INNER JOIN page_bounce pb ON pp.path = pb.path WHERE pp.avg_load_time IS NOT NULL ORDER BY pp.avg_load_time" (Chart: "bar");

METRIC RESPONSE EXAMPLES:
- Query: "how many page views yesterday?" → response_type: "metric", metric_value: 1247, metric_label: "Page views yesterday"
- Query: "what's my bounce rate?" → response_type: "metric", metric_value: "68.5%", metric_label: "Current bounce rate"
- Query: "total unique visitors this month?" → response_type: "metric", metric_value: 3542, metric_label: "Unique visitors this month"

COMPLEX METRIC QUERIES WITH ADVANCED SQL:
- Query: "bounce rate for mobile visitors?" → response_type: "metric", SQL: "WITH session_metrics AS (SELECT session_id, countIf(event_name = 'screen_view') as page_count FROM analytics.events WHERE client_id = '${websiteId}' AND device_type = 'mobile' GROUP BY session_id) SELECT (countIf(page_count = 1) / count()) * 100 AS bounce_rate FROM session_metrics", metric_label: "Mobile bounce rate"

- Query: "average session duration this week?" → response_type: "metric", SQL: "WITH session_durations AS (SELECT session_id, dateDiff('second', MIN(time), MAX(time)) as duration FROM analytics.events WHERE client_id = '${websiteId}' AND time >= today() - INTERVAL '7' DAY GROUP BY session_id HAVING duration > 0) SELECT AVG(duration) AS avg_duration FROM session_durations", metric_label: "Average session duration (this week)"

- Query: "bounce rate for /landing-page?" → response_type: "metric", SQL: "WITH entry_sessions AS (SELECT session_id, countIf(event_name = 'screen_view') as page_count FROM analytics.events WHERE client_id = '${websiteId}' AND session_id IN (SELECT DISTINCT session_id FROM analytics.events WHERE client_id = '${websiteId}' AND path = '/landing-page' AND event_name = 'screen_view' ORDER BY time ASC LIMIT 1 BY session_id) GROUP BY session_id) SELECT (countIf(page_count = 1) / count()) * 100 AS bounce_rate FROM entry_sessions", metric_label: "Bounce rate for /landing-page"

- Query: "conversion rate from referrer google.com?" → response_type: "metric", SQL: "SELECT (countIf(path ILIKE '%thank%' OR path ILIKE '%success%' OR path ILIKE '%complete%') / count()) * 100 AS conversion_rate FROM analytics.events WHERE client_id = '${websiteId}' AND domain(referrer) = 'google.com' AND event_name = 'screen_view'", metric_label: "Conversion rate from Google"

- Query: "returning visitor percentage?" → response_type: "metric", SQL: "WITH visitor_sessions AS (SELECT anonymous_id, count(DISTINCT session_id) as session_count FROM analytics.events WHERE client_id = '${websiteId}' AND event_name = 'screen_view' GROUP BY anonymous_id) SELECT (countIf(session_count > 1) / count()) * 100 AS returning_percentage FROM visitor_sessions", metric_label: "Returning visitor percentage"

- Query: "pages per session average?" → response_type: "metric", SQL: "WITH session_pages AS (SELECT session_id, countIf(event_name = 'screen_view') as page_count FROM analytics.events WHERE client_id = '${websiteId}' GROUP BY session_id) SELECT AVG(page_count) AS avg_pages_per_session FROM session_pages", metric_label: "Average pages per session"

- Query: "weekend vs weekday traffic ratio?" → response_type: "metric", SQL: "WITH traffic_by_day AS (SELECT CASE WHEN toDayOfWeek(time) IN (6, 7) THEN 'weekend' ELSE 'weekday' END as day_type, count() as visits FROM analytics.events WHERE client_id = '${websiteId}' AND event_name = 'screen_view' GROUP BY day_type) SELECT (MAX(CASE WHEN day_type = 'weekend' THEN visits END) / MAX(CASE WHEN day_type = 'weekday' THEN visits END)) AS weekend_weekday_ratio FROM traffic_by_day", metric_label: "Weekend vs weekday traffic ratio"

TEXT RESPONSE EXAMPLES:
- Query: "what does bounce rate mean?" → response_type: "text", text_response: "Bounce rate is the percentage of visitors who leave your website after viewing only one page..."
- Query: "how to improve my website performance?" → response_type: "text", text_response: "Here are some ways to improve your website performance: 1. Optimize images..."

For METRIC responses, execute a simple SQL query to get the single value, then format it appropriately with contextual explanation.

METRIC EXPLANATION GUIDELINES:
- Simple counts (page views, visitors): Just the number is often sufficient
- Percentages/Rates: Always explain what the percentage means in context
- Ratios: Explain what the ratio represents and provide interpretation
- Averages: Include context about what the average represents
- Complex calculations: Break down what the number means in plain language

METRIC EXPLANATION EXAMPLES:
- Query: "bounce rate for mobile?" → Content: "Your mobile bounce rate is 68.5%. This means about 7 out of 10 mobile visitors leave after viewing just one page, which is higher than the typical 40-60% range."
- Query: "average session duration?" → Content: "Your average session duration is 2m 34s. This indicates visitors spend a healthy amount of time exploring your content, above the typical 1-3 minute range."
- Query: "returning visitor percentage?" → Content: "23.4% of your visitors are returning users. This means about 1 in 4 visitors have been to your site before, showing good user retention."

IMPORTANT: For metric responses, ALWAYS provide the contextual explanation in the "text_response" field. Don't just give the raw number - explain what it means, provide context, and give practical interpretation. The system will use text_response as the main content and display the metric_value separately in the UI.

SQL OPTIMIZATION RULES:
1. ALWAYS include WHERE client_id = '${websiteId}' (exact value, not placeholder).;
2. Use 'screen_view' events for general traffic, visitor, page view, and session analysis unless the query specifies other event types.;
3. For "traffic sources" or "referrers" queries, prioritize SELECTING and GROUPING BY the raw 'referrer' field. 
   Filter out STRICTLY (to ensure clean, actionable external traffic data):
     a) Empty or null referrers (e.g., \`referrer IS NOT NULL AND referrer != ''\`). Do NOT include these as "Direct" in top referrer lists unless the user explicitly asks for "direct traffic".
     b) Internal referrers: referrers where the domain of the 'referrer' URL is the website's own domain (use '${websiteHostname}'). Use a condition like \`(domain(referrer) != '${websiteHostname}' AND NOT domain(referrer) ILIKE '%.${websiteHostname}')\`. Also explicitly exclude common local/dev domains using \`domain(referrer) NOT IN ('localhost', '127.0.0.1')\`
   If the user specifically asks for "direct traffic", then generate a query for \`(referrer IS NULL OR referrer = '')\`
   If UTM specific dimensions are requested, then use utm_source, utm_medium etc. 
   Example for Top Referrers (excluding internal, direct, and empty/null):
     SQL: SELECT referrer, COUNT(*) AS pageviews FROM analytics.events WHERE client_id = '${websiteId}' AND event_name='screen_view' AND referrer IS NOT NULL AND referrer != '' AND (domain(referrer) != '${websiteHostname}' AND NOT domain(referrer) ILIKE '%.${websiteHostname}') AND domain(referrer) NOT IN ('localhost', '127.0.0.1') GROUP BY referrer ORDER BY pageviews DESC LIMIT 10;
   (Client-side Note: The application will handle normalization of displayed referrer names, e.g., mapping various domains like 't.co', 'twitter.com' to a single 'Twitter / X' and applying icons. Your SQL should provide raw referrer data based on these strict filtering rules to ensure the data focuses only on meaningful external traffic sources.)
4. Apply time-based filters according to the TIME-BASED QUERY RULES defined above. Default to 'last 7 days' if unspecified;
5. Use toDate(time) AS date for daily grouping, toHour(time) AS hour for hourly grouping. Always alias the time grouping (e.g., AS date, AS hour).;
6. LIMIT results (e.g., LIMIT 100 for raw data, LIMIT 20-30 for aggregated time series unless many categories for multi-line) to keep visualizations readable and queries performant. For multi-line or stacked_bar charts with categories over time, a typical limit might be 7-14 distinct time points (e.g., days) if there are 2-3 categories, or up to 30 time points if only 1-2 categories. If categories are many (e.g. >5 browsers), limit time points further.;
7. Use meaningful column aliases for ALL aggregated fields and dimensions (e.g., AVG(load_time) AS avg_load_time, browser_name AS browser, device_type AS device).;
8. For multi-dimensional data intended for multi-line or stacked_bar charts, ensure the SQL query returns three key pieces of information: the time dimension (e.g., date), the category dimension (e.g., browser_name, device_type), and the metric value (e.g., pageviews, avg_load_time).;
9. For countries, use their country code, like India is ID, USA is US, etc.

ADVANCED SQL TECHNIQUES:
- CASE statements for custom categorization.;
- Multiple GROUP BY for cross-dimensional analysis.;
- Date functions: toDate(), toHour(), toWeek(), toStartOfMonth(), now(), today(), date_trunc(). Remember interval syntax: \`INTERVAL '7' DAY\`;
- Conditional aggregation: countIf(), avgIf().;
- String functions for URL/referrer analysis: domain(), extractHostname(), cutToFirstSignificantSubdomain(), etc.;

FINAL CHECK: Before generating the JSON, mentally review your plan. Does the chosen 'response_type' best fit the user's core question? Does the SQL query accurately reflect their request and the specified timeframes? Does the chosen 'chart_type' match the structure of the data your SQL will produce (e.g., time-series vs. categorical)? Ensure all rules have been followed.

Return only valid JSON, no markdown or extra text. Ensure SQL is a single line string if possible, otherwise properly escaped. Ensure the SQL uses correct ClickHouse syntax. Use \`ILIKE\` for case-insensitive string matching if needed on user-provided filter values.;
`;

export const assistantRouter = new Hono<{ Variables: AppVariables }>();

assistantRouter.use('*', authMiddleware);
assistantRouter.use('*', websiteAuthHook);

/**
 * Process AI request with streaming updates
 * POST /assistant/stream
 */
assistantRouter.post('/stream', zValidator('json', chatRequestSchema), async (c) => {
  const { message, website_id } = c.req.valid('json') as z.infer<typeof chatRequestSchema>;
  const website = c.get('website');
  const user = c.get('user');

  if (!website || !website.id) {
    return c.json({ error: 'Website not found' }, 404);
  }

  // Check rate limit
  if (!user) {
    return c.json({ error: 'User not found' }, 401);
  }
  
  // const rateLimitPassed = await checkRateLimit(user.id);
  // if (!rateLimitPassed) {
  //   return c.json({ 
  //     error: 'Rate limit exceeded. Please wait before making another request.',
  //     code: 'RATE_LIMIT_EXCEEDED' 
  //   }, 429);
  // }

  const websiteHostname = website.domain;
  const startTime = Date.now();
  const debugInfo: Record<string, any> = {};

  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = (update: StreamingUpdate) => {
        const data = `data: ${JSON.stringify(update)}\n\n`;
        controller.enqueue(new TextEncoder().encode(data));
      };

      try {
        sendUpdate({ 
          type: 'thinking', 
          content: createThinkingStep("Analyzing your analytics request...") 
        });

        debugLog("✅ Input validated", { message, website_id, websiteHostname });
        if ((user as any).role === 'ADMIN') {
          debugInfo.validatedInput = { message, website_id, websiteHostname };
        }

        sendUpdate({ 
          type: 'thinking', 
          content: createThinkingStep("Generating optimized query and visualization...") 
        });

        const aiStart = Date.now();
        const { context } = c.req.valid('json');
        
        const fullPrompt = enhancedAnalysisPrompt(message, website_id, websiteHostname, context?.previousMessages);
        
        const completion = await openai.chat.completions.create({
          model: 'google/gemini-2.0-flash-001',
          messages: [
            {
              role: 'system',
              content: fullPrompt
            }
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' }
        });

        const aiResponseText = completion.choices[0]?.message?.content || '';
        const aiTime = Date.now() - aiStart;

        debugLog("📝 Raw AI JSON response", { aiResponseText, timeTaken: `${aiTime}ms` });

        let parsedAiJson: z.infer<typeof AIResponseJsonSchema>;
        try {
          const cleanedResponse = aiResponseText.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
          debugLog("🧹 Cleaned AI response", { cleanedResponse });
          
          const jsonParsed = JSON.parse(cleanedResponse);
          debugLog("📋 JSON parsed successfully", { jsonParsed });
          
          parsedAiJson = AIResponseJsonSchema.parse(jsonParsed);
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

        sendUpdate({ 
          type: 'thinking', 
          content: createThinkingStep("Executing database query...") 
        });

        if (parsedAiJson.response_type === 'text') {
          sendUpdate({
            type: 'complete',
            content: parsedAiJson.text_response || "Here's the answer to your question.",
            data: {
              hasVisualization: false,
              responseType: 'text'
            },
            debugInfo: (user as any).role === 'ADMIN' ? debugInfo : undefined
          });
          controller.close();
          return;
        }

        if (parsedAiJson.response_type === 'metric') {
          if (parsedAiJson.sql) {
            const sql = parsedAiJson.sql;
            console.log('Metric SQL:', sql);
            if (!validateSQL(sql)) {
              sendUpdate({ 
                type: 'error', 
                content: "Generated query failed security validation.", 
                debugInfo: (user as any).role === 'ADMIN' ? debugInfo : undefined
              });
              controller.close();
              return;
            }

            try {
              const queryStart = Date.now();
              const queryData = await chQuery(sql);
              const queryTime = Date.now() - queryStart;

              let metricValue = parsedAiJson.metric_value;
              if (queryData.length > 0 && queryData[0]) {
                const firstRow = queryData[0];
                const valueKey = Object.keys(firstRow).find(key => typeof firstRow[key] === 'number') ||
                                Object.keys(firstRow)[0];
                if (valueKey) {
                  metricValue = firstRow[valueKey];
                }
              }

              sendUpdate({
                type: 'complete',
                content: parsedAiJson.text_response || `${parsedAiJson.metric_label || 'Result'}: ${typeof metricValue === 'number' ? metricValue.toLocaleString() : metricValue}`,
                data: {
                  hasVisualization: false,
                  responseType: 'metric',
                  metricValue: metricValue,
                  metricLabel: parsedAiJson.metric_label
                },
                debugInfo: (user as any).role === 'ADMIN' ? debugInfo : undefined
              });

            } catch (queryError: any) {
              debugLog("❌ Metric SQL execution error", { error: queryError.message, sql });
              
              sendUpdate({ 
                type: 'complete',
                content: parsedAiJson.text_response || `${parsedAiJson.metric_label || 'Result'}: ${typeof parsedAiJson.metric_value === 'number' ? parsedAiJson.metric_value.toLocaleString() : parsedAiJson.metric_value}`,
                data: {
                  hasVisualization: false,
                  responseType: 'metric',
                  metricValue: parsedAiJson.metric_value,
                  metricLabel: parsedAiJson.metric_label
                },
                debugInfo: (user as any).role === 'ADMIN' ? debugInfo : undefined
              });
            }
          } else {
            sendUpdate({
              type: 'complete',
              content: parsedAiJson.text_response || `${parsedAiJson.metric_label || 'Result'}: ${typeof parsedAiJson.metric_value === 'number' ? parsedAiJson.metric_value.toLocaleString() : parsedAiJson.metric_value}`,
              data: {
                hasVisualization: false,
                responseType: 'metric',
                metricValue: parsedAiJson.metric_value,
                metricLabel: parsedAiJson.metric_label
              },
              debugInfo: (user as any).role === 'ADMIN' ? debugInfo : undefined
            });
          }
          controller.close();
          return;
        }

        if (parsedAiJson.response_type === 'chart' && parsedAiJson.sql) {
          const sql = parsedAiJson.sql;
          console.log(sql);
          if (!validateSQL(sql)) {
            sendUpdate({ 
              type: 'error', 
              content: "Generated query failed security validation.", 
              debugInfo: (user as any).role === 'ADMIN' ? debugInfo : undefined
            });
            controller.close();
            return;
          }

          try {
            const queryStart = Date.now();
            const queryData = await chQuery(sql);
            const queryTime = Date.now() - queryStart;
            const totalTime = Date.now() - startTime;

            debugLog("✅ Query executed successfully", {
              resultCount: queryData.length,
              timeTaken: `${queryTime}ms`,
              totalTime: `${totalTime}ms`,
              sampleData: queryData.slice(0, 3)
            });

            if ((user as any).role === 'ADMIN') {
              debugInfo.processing = { aiTime, queryTime, totalTime };
            }

            const finalContent = queryData.length > 0 
              ? `Found ${queryData.length} data points. Displaying as a ${parsedAiJson.chart_type?.replace(/_/g, ' ') || 'chart'}.`
              : "No data found for your query.";

            sendUpdate({
              type: 'complete',
              content: finalContent,
              data: {
                hasVisualization: queryData.length > 0,
                chartType: parsedAiJson.chart_type,
                data: queryData,
                responseType: 'chart'
              },
              debugInfo: (user as any).role === 'ADMIN' ? debugInfo : undefined
            });

          } catch (queryError: any) {
            debugLog("❌ SQL execution error", { error: queryError.message, sql });
            sendUpdate({ 
              type: 'error', 
              content: "Database query failed. The data might not be available.", 
              debugInfo: (user as any).role === 'ADMIN' ? debugInfo : undefined
            });
          }
        } else {
          sendUpdate({ 
            type: 'error', 
            content: "Invalid response format from AI.", 
            debugInfo: (user as any).role === 'ADMIN' ? debugInfo : undefined
          });
        }

        controller.close();

      } catch (error: any) {
        debugLog("💥 Processing error", { error: error.message });
        if (error.name === 'ZodError') {
          sendUpdate({ 
            type: 'error', 
            content: `Invalid input: ${error.errors?.map((e: any) => e.message).join(', ')}`, 
            debugInfo: (user as any).role === 'ADMIN' ? debugInfo : undefined
          });
        } else {
          sendUpdate({ 
            type: 'error', 
            content: "An unexpected error occurred.", 
            debugInfo: (user as any).role === 'ADMIN' ? { error: error.message } : undefined
          });
        }
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

export default assistantRouter; 