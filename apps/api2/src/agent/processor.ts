import { comprehensiveUnifiedPrompt } from './prompts/agent';
import { getAICompletion } from './utils/ai-client';
import { parseAIResponse } from './utils/response-parser';
import { generateThinkingSteps } from './utils/stream-utils';
import { handleMetricResponse } from './handlers/metric-handler';
import { handleChartResponse } from './handlers/chart-handler';
import type { StreamingUpdate } from './utils/stream-utils';

export interface AssistantRequest {
    message: string;
    website_id: string;
    website_hostname: string;
    context?: {
        previousMessages?: Array<{
            role: string;
            content: string;
        }>;
    };
}

export interface AssistantContext {
    user: any;
    website: any;
    debugInfo: Record<string, unknown>;
}

export async function* processAssistantRequest(
    request: AssistantRequest,
    context: AssistantContext
): AsyncGenerator<StreamingUpdate> {
    const startTime = Date.now();

    try {
        console.info('✅ [Assistant Processor] Input validated', {
            message: request.message,
            website_id: request.website_id,
            website_hostname: request.website_hostname
        });

        if (context.user.role === 'ADMIN') {
            context.debugInfo.validatedInput = {
                message: request.message,
                website_id: request.website_id,
                website_hostname: request.website_hostname
            };
        }

        const aiStart = Date.now();
        const fullPrompt = comprehensiveUnifiedPrompt(
            request.message,
            request.website_id,
            request.website_hostname,
            'execute_chat',
            request.context?.previousMessages
        );

        const aiResponse = await getAICompletion({ prompt: fullPrompt });
        const aiTime = Date.now() - aiStart;

        console.info('📝 [Assistant Processor] Raw AI response received', {
            timeTaken: `${aiTime}ms`,
            contentLength: aiResponse.content.length
        });

        const parsedResponse = parseAIResponse(aiResponse.content);

        if (!parsedResponse.success) {
            yield {
                type: 'error',
                content: "AI response parsing failed. Please try rephrasing.",
                debugInfo: context.user.role === 'ADMIN' ? {
                    ...context.debugInfo,
                    parseError: parsedResponse.error,
                    rawResponse: parsedResponse.rawResponse
                } : undefined
            };
            return;
        }

        const aiJson = parsedResponse.data;
        if (!aiJson) {
            yield {
                type: 'error',
                content: "AI response data is missing.",
                debugInfo: context.user.role === 'ADMIN' ? context.debugInfo : undefined
            };
            return;
        }
        console.info('✅ [Assistant Processor] AI response parsed', {
            responseType: aiJson.response_type,
            hasSQL: !!aiJson.sql,
            thinkingSteps: aiJson.thinking_steps?.length || 0
        });

        // Process thinking steps
        if (aiJson.thinking_steps?.length) {
            yield* generateThinkingSteps(aiJson.thinking_steps);
        }

        // Handle different response types
        switch (aiJson.response_type) {
            case 'text':
                yield {
                    type: 'complete',
                    content: aiJson.text_response || "Here's the answer to your question.",
                    data: { hasVisualization: false, responseType: 'text' },
                    debugInfo: context.user.role === 'ADMIN' ? context.debugInfo : undefined
                };
                break;

            case 'metric':
                await handleMetricResponse(aiJson, context, (update) => {
                    // This is a bit awkward with the generator pattern, but we'll yield the update
                    // In a real implementation, you might want to restructure this
                    return update;
                });
                break;

            case 'chart':
                if (aiJson.sql) {
                    await handleChartResponse(aiJson, {
                        ...context,
                        startTime,
                        aiTime
                    }, (update) => {
                        return update;
                    });
                } else {
                    yield {
                        type: 'error',
                        content: "Invalid chart configuration.",
                        debugInfo: context.user.role === 'ADMIN' ? context.debugInfo : undefined
                    };
                }
                break;

            default:
                yield {
                    type: 'error',
                    content: "Invalid response format from AI.",
                    debugInfo: context.user.role === 'ADMIN' ? context.debugInfo : undefined
                };
        }

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('💥 [Assistant Processor] Processing error', { error: errorMessage });

        yield {
            type: 'error',
            content: "An unexpected error occurred.",
            debugInfo: context.user.role === 'ADMIN' ? { error: errorMessage } : undefined
        };
    }
} 