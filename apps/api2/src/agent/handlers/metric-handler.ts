import type { z } from 'zod';
import type { AIResponseJsonSchema } from '../prompts/agent';
import { validateSQL } from '../utils/sql-validator';
import { executeQuery } from '../utils/query-executor';
import type { StreamingUpdate } from '../utils/stream-utils';

export interface MetricHandlerContext {
    user: any;
    website: any;
    debugInfo: Record<string, unknown>;
}

export async function handleMetricResponse(
    parsedAiJson: z.infer<typeof AIResponseJsonSchema>,
    context: MetricHandlerContext,
    sendUpdate: (update: StreamingUpdate) => void
): Promise<void> {
    if (parsedAiJson.sql) {
        if (!validateSQL(parsedAiJson.sql)) {
            sendUpdate({
                type: 'error',
                content: "Generated query failed security validation.",
                debugInfo: context.user.role === 'ADMIN' ? context.debugInfo : undefined
            });
            return;
        }

        try {
            const queryResult = await executeQuery(parsedAiJson.sql);
            const metricValue = extractMetricValue(queryResult.data, parsedAiJson.metric_value);
            await sendMetricResponse(parsedAiJson, metricValue, context, sendUpdate);
        } catch (queryError: unknown) {
            console.error('❌ Metric SQL execution error', {
                error: queryError instanceof Error ? queryError.message : 'Unknown error',
                sql: parsedAiJson.sql
            });
            await sendMetricResponse(parsedAiJson, parsedAiJson.metric_value, context, sendUpdate);
        }
    } else {
        await sendMetricResponse(parsedAiJson, parsedAiJson.metric_value, context, sendUpdate);
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
    context: MetricHandlerContext,
    sendUpdate: (update: StreamingUpdate) => void
): Promise<void> {
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
        debugInfo: context.user.role === 'ADMIN' ? context.debugInfo : undefined
    });
} 