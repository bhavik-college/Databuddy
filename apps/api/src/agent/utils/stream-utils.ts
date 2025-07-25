export interface StreamingUpdate {
  type: 'thinking' | 'progress' | 'complete' | 'error';
  content: string;
  data?: Record<string, unknown>;
  debugInfo?: Record<string, unknown>;
}

export function createStreamingResponse(
  updates: AsyncGenerator<StreamingUpdate>
): Response {
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const update of updates) {
          const data = `data: ${JSON.stringify(update)}\n\n`;
          controller.enqueue(new TextEncoder().encode(data));
        }
        controller.close();
      } catch (error) {
        const errorUpdate: StreamingUpdate = {
          type: 'error',
          content:
            error instanceof Error ? error.message : 'Unknown error occurred',
        };
        const data = `data: ${JSON.stringify(errorUpdate)}\n\n`;
        controller.enqueue(new TextEncoder().encode(data));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

export function createThinkingStep(step: string): string {
  return `🧠 ${step}`;
}

export async function* generateThinkingSteps(
  steps: string[]
): AsyncGenerator<StreamingUpdate> {
  for (const step of steps) {
    yield { type: 'thinking', content: createThinkingStep(step) };
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}
