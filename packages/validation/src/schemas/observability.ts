import z from 'zod';
import { VALIDATION_LIMITS } from '../constants';

const timestampSchema = z.number().int().min(0).nullable().optional();

const spanKindSchema = z
	.enum(['client', 'server', 'producer', 'consumer', 'internal'])
	.nullable()
	.optional();

const statusCodeSchema = z.enum(['ok', 'error', 'unset']).nullable().optional();

const levelSchema = z
	.enum(['debug', 'info', 'warn', 'error', 'fatal'])
	.nullable()
	.optional();

export const observabilityEventSchema = z.object({
	service: z.string().min(1).max(VALIDATION_LIMITS.SERVICE_MAX_LENGTH),
	environment: z.string().min(1).max(VALIDATION_LIMITS.ENVIRONMENT_MAX_LENGTH),
	version: z
		.string()
		.max(VALIDATION_LIMITS.VERSION_MAX_LENGTH)
		.nullable()
		.optional(),
	host: z.string().max(VALIDATION_LIMITS.HOST_MAX_LENGTH).nullable().optional(),
	region: z
		.string()
		.max(VALIDATION_LIMITS.REGION_MAX_LENGTH)
		.nullable()
		.optional(),
	instance_id: z
		.string()
		.max(VALIDATION_LIMITS.INSTANCE_ID_MAX_LENGTH)
		.nullable()
		.optional(),

	trace_id: z
		.string()
		.max(VALIDATION_LIMITS.TRACE_ID_MAX_LENGTH)
		.nullable()
		.optional(),
	span_id: z
		.string()
		.max(VALIDATION_LIMITS.SPAN_ID_MAX_LENGTH)
		.nullable()
		.optional(),
	parent_span_id: z
		.string()
		.max(VALIDATION_LIMITS.PARENT_SPAN_ID_MAX_LENGTH)
		.nullable()
		.optional(),
	span_kind: spanKindSchema,
	status_code: statusCodeSchema,
	status_message: z
		.string()
		.max(VALIDATION_LIMITS.STATUS_MESSAGE_MAX_LENGTH)
		.nullable()
		.optional(),

	start_time: timestampSchema,
	end_time: timestampSchema,
	duration_ms: z.number().int().min(0).nullable().optional(),

	level: levelSchema,
	category: z.string().min(1).max(VALIDATION_LIMITS.NAME_MAX_LENGTH),
	request_id: z
		.string()
		.max(VALIDATION_LIMITS.REQUEST_ID_MAX_LENGTH)
		.nullable()
		.optional(),
	correlation_id: z
		.string()
		.max(VALIDATION_LIMITS.CORRELATION_ID_MAX_LENGTH)
		.nullable()
		.optional(),

	user_id: z
		.string()
		.max(VALIDATION_LIMITS.USER_ID_MAX_LENGTH)
		.nullable()
		.optional(),
	tenant_id: z
		.string()
		.max(VALIDATION_LIMITS.TENANT_ID_MAX_LENGTH)
		.nullable()
		.optional(),

	attributes: z.json().optional().nullable(),
	events: z.json().optional().nullable(),
});
