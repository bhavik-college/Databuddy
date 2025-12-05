import type { AppContext } from "../config/context";
import { formatContextForLLM } from "../config/context";
import { CLICKHOUSE_SCHEMA_DOCS, COMMON_AGENT_RULES } from "./shared";

/**
 * Analytics-specific rules for data analysis and presentation.
 */
const ANALYTICS_RULES = `<agent-specific-rules>
- Lead with key metrics and insights
- Provide 2-3 actionable recommendations
- Use the get_top_pages tool for page analytics
- Use the execute_sql_query tool for custom analytics queries
- Always include time context (e.g., "in the last 7 days")
- Format large numbers with commas for readability
- CRITICAL: When using execute_sql_query with {websiteId:String} in the SQL, you MUST pass the params object with websiteId set to the website_id from the context above
- Example: execute_sql_query({ sql: "SELECT ... WHERE client_id = {websiteId:String}", params: { websiteId: "<use website_id from context>" } })
</agent-specific-rules>`;

/**
 * Builds the instruction prompt for the analytics agent.
 */
export function buildAnalyticsInstructions(ctx: AppContext): string {
	return `You are an analytics specialist for ${ctx.websiteDomain}. Your goal is to analyze website traffic, user behavior, and performance metrics.

<background-data>
${formatContextForLLM(ctx)}
</background-data>

${COMMON_AGENT_RULES}

${ANALYTICS_RULES}

${CLICKHOUSE_SCHEMA_DOCS}`;
}
