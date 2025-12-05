/**
 * AI module - centralized exports for agent system.
 *
 * Structure:
 * - config/   - Model, memory, and context configuration
 * - agents/   - Agent definitions (triage, analytics, etc.)
 * - prompts/  - System prompts and instructions
 * - tools/    - Tool implementations for agents
 */

// Agent exports
export { analyticsAgent, createAgent, mainAgent, triageAgent } from "./agents";
// Config exports
export {
	type AppContext,
	buildAppContext,
	defaultMemoryConfig,
	formatContextForLLM,
	type ModelKey,
	memoryProvider,
	models,
	openrouter,
} from "./config";
// Prompt exports (for customization/testing)
export {
	buildAnalyticsInstructions,
	buildTriageInstructions,
	CLICKHOUSE_SCHEMA_DOCS,
	COMMON_AGENT_RULES,
} from "./prompts";
// Tool exports
export { analyticsTools, executeSqlQueryTool, getTopPagesTool } from "./tools";

// Type exports
export type {
	ChatMessageMetadata,
	MessageDataParts,
	UIChatMessage,
	UITools,
} from "./types";
