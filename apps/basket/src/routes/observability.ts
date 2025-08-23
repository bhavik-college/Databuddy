import { randomUUID } from 'node:crypto';
import { clickHouse, type ObservabilityEvent } from '@databuddy/db';
import { Elysia } from 'elysia';
import { logger } from '../lib/logger';
import { observabilityEventSchema } from '../utils/event-schema';
import { sanitizeString, VALIDATION_LIMITS } from '../utils/validation';

async function insertObservabilityEvent(
	data: ObservabilityEvent
): Promise<void> {
	const now = Date.now();

	const event = {
		id: randomUUID(),
		service: sanitizeString(data.service, VALIDATION_LIMITS.SERVICE_MAX_LENGTH),
		environment: sanitizeString(
			data.environment,
			VALIDATION_LIMITS.ENVIRONMENT_MAX_LENGTH
		),
		version: data.version
			? sanitizeString(data.version, VALIDATION_LIMITS.VERSION_MAX_LENGTH)
			: undefined,
		host: data.host
			? sanitizeString(data.host, VALIDATION_LIMITS.HOST_MAX_LENGTH)
			: undefined,
		region: data.region
			? sanitizeString(data.region, VALIDATION_LIMITS.REGION_MAX_LENGTH)
			: undefined,
		instance_id: data.instance_id
			? sanitizeString(
					data.instance_id,
					VALIDATION_LIMITS.INSTANCE_ID_MAX_LENGTH
				)
			: undefined,
		trace_id: data.trace_id
			? sanitizeString(data.trace_id, VALIDATION_LIMITS.TRACE_ID_MAX_LENGTH)
			: undefined,
		span_id: data.span_id
			? sanitizeString(data.span_id, VALIDATION_LIMITS.SPAN_ID_MAX_LENGTH)
			: undefined,
		parent_span_id: data.parent_span_id
			? sanitizeString(
					data.parent_span_id,
					VALIDATION_LIMITS.PARENT_SPAN_ID_MAX_LENGTH
				)
			: undefined,
		span_kind: data.span_kind,
		status_code: data.status_code,
		status_message: data.status_message
			? sanitizeString(
					data.status_message,
					VALIDATION_LIMITS.STATUS_MESSAGE_MAX_LENGTH
				)
			: undefined,
		start_time: data.start_time || now,
		end_time: data.end_time || now,
		duration_ms: data.duration_ms,
		level: data.level || 'info',
		category: sanitizeString(data.category, VALIDATION_LIMITS.NAME_MAX_LENGTH),
		request_id: data.request_id
			? sanitizeString(data.request_id, VALIDATION_LIMITS.REQUEST_ID_MAX_LENGTH)
			: undefined,
		correlation_id: data.correlation_id
			? sanitizeString(
					data.correlation_id,
					VALIDATION_LIMITS.CORRELATION_ID_MAX_LENGTH
				)
			: undefined,
		user_id: data.user_id
			? sanitizeString(data.user_id, VALIDATION_LIMITS.USER_ID_MAX_LENGTH)
			: undefined,
		tenant_id: data.tenant_id
			? sanitizeString(data.tenant_id, VALIDATION_LIMITS.TENANT_ID_MAX_LENGTH)
			: undefined,
		attributes: data.attributes || {},
		events: data.events || {},
	};

	try {
		await clickHouse.insert({
			table: 'observability.events',
			values: [event],
			format: 'JSONEachRow',
		});
		await logger.info('Inserted observability event', {
			service: event.service,
			environment: event.environment,
			category: event.category,
		});
	} catch (err) {
		await logger.error('Failed to insert observability event', {
			error: err,
			service: data.service,
		});
		throw err;
	}
}

const app = new Elysia()
	.post('/', async ({ body }: { body: ObservabilityEvent }) => {
		const parseResult = observabilityEventSchema.safeParse(body);
		if (!parseResult.success) {
			logger.error('Invalid observability event schema', {
				issues: parseResult.error.issues,
			});
			return {
				status: 'error',
				message: 'Invalid event schema',
				errors: parseResult.error.issues,
			};
		}

		try {
			await insertObservabilityEvent(body as ObservabilityEvent);
			return { status: 'success', type: 'observability' };
		} catch (error) {
			logger.error('Failed to process observability event', {
				error,
				service: body.service,
			});
			return {
				status: 'error',
				message: 'Failed to process event',
				error: String(error),
			};
		}
	})
	.post('/batch', async ({ body }: { body: ObservabilityEvent[] }) => {
		if (!Array.isArray(body)) {
			return {
				status: 'error',
				message: 'Batch endpoint expects array of events',
			};
		}

		if (body.length > VALIDATION_LIMITS.BATCH_MAX_SIZE) {
			return { status: 'error', message: 'Batch too large' };
		}

		const results = await Promise.all(
			body.map(async (event) => {
				const parseResult = observabilityEventSchema.safeParse(event);
				if (!parseResult.success) {
					return {
						status: 'error',
						message: 'Invalid schema',
						errors: parseResult.error.issues,
					};
				}

				try {
					await insertObservabilityEvent(event);
					return { status: 'success', type: 'observability' };
				} catch (error) {
					return {
						status: 'error',
						message: 'Processing failed',
						error: String(error),
					};
				}
			})
		);

		return {
			status: 'success',
			batch: true,
			processed: results.length,
			results,
		};
	});

export default app;
