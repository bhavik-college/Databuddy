import type {
	LanguageModelV2,
	LanguageModelV2Middleware,
} from "@ai-sdk/provider";
import { wrapLanguageModel } from "ai";
import type {
	AICall,
	DatabuddyLLMOptions,
	TokenCost,
	ToolCallInfo,
	TrackOptions,
	Transport,
} from "./types";

const extractToolInfo = (
	content: Array<{ type: string; toolName?: string }>
): ToolCallInfo => {
	const toolCalls = content.filter((part) => part.type === "tool-call");
	const toolResults = content.filter((part) => part.type === "tool-result");
	const toolCallNames = [
		...new Set(
			toolCalls
				.map((c) => c.toolName)
				.filter((name): name is string => Boolean(name))
		),
	];

	return {
		toolCallCount: toolCalls.length,
		toolResultCount: toolResults.length,
		toolCallNames,
	};
};

const computeCosts = async (
	modelId: string,
	provider: string,
	usage: { inputTokens: number; outputTokens: number }
): Promise<TokenCost> => {
	try {
		const { computeCostUSD } = await import("tokenlens");
		const result = await computeCostUSD({
			modelId,
			provider,
			usage: {
				input_tokens: usage.inputTokens,
				output_tokens: usage.outputTokens,
			},
		});
		return {
			inputTokenCostUSD: result.inputTokenCostUSD,
			outputTokenCostUSD: result.outputTokenCostUSD,
			totalTokenCostUSD: result.totalTokenCostUSD,
		};
	} catch {
		return {};
	}
};

const createDefaultTransport = (apiUrl: string, apiKey?: string): Transport => {
	return async (call) => {
		const headers: HeadersInit = {
			"Content-Type": "application/json",
		};

		if (apiKey) {
			headers.Authorization = `Bearer ${apiKey}`;
		}

		const response = await fetch(apiUrl, {
			method: "POST",
			headers,
			body: JSON.stringify(call),
		});

		if (!response.ok) {
			throw new Error(
				`Failed to send AI log: ${response.status} ${response.statusText}`
			);
		}
	};
};

const createMiddleware = (
	transport: Transport,
	options: TrackOptions = {}
): LanguageModelV2Middleware => {
	const { computeCosts: shouldComputeCosts = true } = options;

	return {
		wrapGenerate: async ({ doGenerate, model }) => {
			const startTime = Date.now();

			try {
				const result = await doGenerate();
				const durationMs = Date.now() - startTime;

				const tools = extractToolInfo(
					result.content as Array<{ type: string; toolName?: string }>
				);

				const inputTokens = result.usage.inputTokens ?? 0;
				const outputTokens = result.usage.outputTokens ?? 0;
				const totalTokens =
					result.usage.totalTokens ?? inputTokens + outputTokens;
				const cachedInputTokens = result.usage.cachedInputTokens;

				const cost: TokenCost =
					shouldComputeCosts && (inputTokens > 0 || outputTokens > 0)
						? await computeCosts(model.modelId, model.provider, {
							inputTokens,
							outputTokens,
						})
						: {};

				const call: AICall = {
					timestamp: new Date(),
					type: "generate",
					model: model.modelId,
					provider: model.provider,
					finishReason: result.finishReason,
					usage: {
						inputTokens,
						outputTokens,
						totalTokens,
						cachedInputTokens,
					},
					cost,
					tools,
					durationMs,
				};

				const effectiveTransport = options.transport ?? transport;
				const transportResult = effectiveTransport(call);
				if (transportResult instanceof Promise) {
					transportResult.catch(() => {
						// Silently fail - logging should not affect main flow
					});
				}
				options.onSuccess?.(call);

				return result;
			} catch (error) {
				const durationMs = Date.now() - startTime;

				const call: AICall = {
					timestamp: new Date(),
					type: "generate",
					model: model.modelId,
					provider: model.provider,
					usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
					cost: {},
					tools: { toolCallCount: 0, toolResultCount: 0, toolCallNames: [] },
					durationMs,
					error: {
						name: error instanceof Error ? error.name : "UnknownError",
						message: error instanceof Error ? error.message : String(error),
						stack: error instanceof Error ? error.stack : undefined,
					},
				};

				const effectiveTransport = options.transport ?? transport;
				const transportResult = effectiveTransport(call);
				if (transportResult instanceof Promise) {
					transportResult.catch(() => {
						// Silently fail - logging should not affect main flow
					});
				}
				options.onError?.(call);

				throw error;
			}
		},

		wrapStream: async ({ doStream, model }) => {
			const startTime = Date.now();

			try {
				const { stream, ...rest } = await doStream();
				const durationMs = Date.now() - startTime;

				// Streams don't have usage info until completion
				// We'll log the stream start, but usage will be tracked separately
				const call: AICall = {
					timestamp: new Date(),
					type: "stream",
					model: model.modelId,
					provider: model.provider,
					usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
					cost: {},
					tools: { toolCallCount: 0, toolResultCount: 0, toolCallNames: [] },
					durationMs,
				};

				const effectiveTransport = options.transport ?? transport;
				const transportResult = effectiveTransport(call);
				if (transportResult instanceof Promise) {
					transportResult.catch(() => {
						// Silently fail - logging should not affect main flow
					});
				}
				options.onSuccess?.(call);

				return { stream, ...rest };
			} catch (error) {
				const durationMs = Date.now() - startTime;

				const call: AICall = {
					timestamp: new Date(),
					type: "stream",
					model: model.modelId,
					provider: model.provider,
					usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
					cost: {},
					tools: { toolCallCount: 0, toolResultCount: 0, toolCallNames: [] },
					durationMs,
					error: {
						name: error instanceof Error ? error.name : "UnknownError",
						message: error instanceof Error ? error.message : String(error),
						stack: error instanceof Error ? error.stack : undefined,
					},
				};

				const effectiveTransport = options.transport ?? transport;
				const transportResult = effectiveTransport(call);
				if (transportResult instanceof Promise) {
					transportResult.catch(() => {
						// Silently fail - logging should not affect main flow
					});
				}
				options.onError?.(call);

				throw error;
			}
		},
	};
};

/**
 * Create a Databuddy LLM tracking instance
 *
 * @example
 * ```ts
 * import { databuddyLLM } from "@databuddy/sdk/ai/vercel";
 *
 * // Use default endpoint (basket.databuddy.cc/llm)
 * const { track } = databuddyLLM({
 *   apiKey: "your-api-key",
 * });
 *
 * // Or override with custom endpoint
 * const { track } = databuddyLLM({
 *   apiUrl: "https://custom.example.com/llm",
 *   apiKey: "your-api-key",
 * });
 *
 * // Track a model
 * const model = track(openai("gpt-4"));
 *
 * // Or with custom transport
 * const { track } = databuddyLLM({
 *   transport: async (call) => console.log(call),
 * });
 * ```
 */
export const databuddyLLM = (options: DatabuddyLLMOptions = {}) => {
	const {
		apiUrl,
		apiKey,
		transport: customTransport,
		computeCosts: defaultComputeCosts = true,
		onSuccess: defaultOnSuccess,
		onError: defaultOnError,
	} = options;

	// Determine transport
	let transport: Transport;
	if (customTransport) {
		transport = customTransport;
	} else {
		const endpoint = apiUrl ?? process.env.DATABUDDY_API_URL ?? "https://basket.databuddy.cc/llm";
		const key = apiKey ?? process.env.DATABUDDY_API_KEY;
		transport = createDefaultTransport(endpoint, key);
	}

	/**
	 * Track AI model calls with automatic logging, cost tracking, and error handling
	 */
	const track = (model: LanguageModelV2, trackOptions: TrackOptions = {}) => {
		return wrapLanguageModel({
			model,
			middleware: createMiddleware(transport, {
				computeCosts: trackOptions.computeCosts ?? defaultComputeCosts,
				onSuccess: trackOptions.onSuccess ?? defaultOnSuccess,
				onError: trackOptions.onError ?? defaultOnError,
				transport: trackOptions.transport,
			}),
		});
	};

	return { track };
};

/**
 * Create an HTTP transport that sends logs to an API endpoint
 *
 * @example
 * ```ts
 * import { databuddyLLM, httpTransport } from "@databuddy/sdk/ai/vercel";
 *
 * const { track } = databuddyLLM({
 *   transport: httpTransport("https://api.example.com/ai-logs"),
 * });
 * ```
 */
export const httpTransport = (url: string, apiKey?: string): Transport => {
	return async (call) => {
		const headers: HeadersInit = {
			"Content-Type": "application/json",
		};

		if (apiKey) {
			headers.Authorization = `Bearer ${apiKey}`;
		}

		const response = await fetch(url, {
			method: "POST",
			headers,
			body: JSON.stringify(call),
		});

		if (!response.ok) {
			throw new Error(
				`Failed to send AI log: ${response.status} ${response.statusText}`
			);
		}
	};
};
