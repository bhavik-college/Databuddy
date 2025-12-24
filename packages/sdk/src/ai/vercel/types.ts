/**
 * Token usage from AI model calls
 */
export interface TokenUsage {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cachedInputTokens?: number;
}

/**
 * Cost breakdown from TokenLens
 */
export interface TokenCost {
    inputTokenCostUSD?: number;
    outputTokenCostUSD?: number;
    totalTokenCostUSD?: number;
}

/**
 * Tool call information
 */
export interface ToolCallInfo {
    toolCallCount: number;
    toolResultCount: number;
    toolCallNames: string[];
}

/**
 * Error information for failed AI calls
 */
export interface AIError {
    name: string;
    message: string;
    stack?: string;
}

/**
 * Complete AI call log entry
 */
export interface AICall {
    timestamp: Date;
    type: "generate" | "stream";
    model: string;
    provider: string;
    finishReason?: string;
    usage: TokenUsage;
    cost: TokenCost;
    tools: ToolCallInfo;
    error?: AIError;
    durationMs: number;
}

/**
 * Transport function for sending log entries
 */
export type Transport = (call: AICall) => Promise<void> | void;

/**
 * Configuration options for Databuddy LLM tracking
 */
export interface DatabuddyLLMOptions {
    /**
     * API endpoint for sending logs (should include /llm path)
     * @default process.env.DATABUDDY_API_URL or 'https://basket.databuddy.cc/llm'
     */
    apiUrl?: string;
    /**
     * API key for authentication
     * @default process.env.DATABUDDY_API_KEY
     */
    apiKey?: string;
    /**
     * Custom transport function to send log entries
     * If provided, overrides default HTTP transport
     */
    transport?: Transport;
    /**
     * Whether to compute costs using TokenLens
     * @default true
     */
    computeCosts?: boolean;
    /**
     * Called on successful AI calls
     */
    onSuccess?: (call: AICall) => void;
    /**
     * Called on failed AI calls
     */
    onError?: (call: AICall) => void;
}

/**
 * Configuration options for tracking individual models
 */
export interface TrackOptions {
    /**
     * Transport function to send log entries
     * If not provided, uses the transport from DatabuddyLLM instance
     */
    transport?: Transport;
    /**
     * Whether to compute costs using TokenLens
     * @default true
     */
    computeCosts?: boolean;
    /**
     * Called on successful AI calls
     */
    onSuccess?: (call: AICall) => void;
    /**
     * Called on failed AI calls
     */
    onError?: (call: AICall) => void;
}
