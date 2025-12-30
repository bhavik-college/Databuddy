import { z } from "zod";

/**
 * Common error data schemas for type-safe error handling
 * These schemas validate the data sent to clients - never include sensitive info!
 */

const resourceSchema = z.object({
    resourceType: z.string(),
    resourceId: z.string().optional(),
});

const limitSchema = z.object({
    limit: z.number(),
    current: z.number(),
    nextPlan: z.string().optional(),
});

const featureSchema = z.object({
    feature: z.string(),
    requiredPlan: z.string().optional(),
});

const retrySchema = z.object({
    retryAfter: z.number().int().min(1),
});

/**
 * Base errors definition for oRPC type-safe error handling.
 * Use with `os.errors(baseErrors)` to enable type-safe error throwing.
 *
 * @example
 * ```ts
 * // In handler:
 * .handler(async ({ errors }) => {
 *   throw errors.NOT_FOUND({ data: { resourceType: "goal" } });
 * })
 * ```
 */
export const baseErrors = {
    // Authentication errors
    UNAUTHORIZED: {
        message: "Authentication is required for this action",
    },
    FORBIDDEN: {
        message: "You do not have permission to perform this action",
    },

    // Resource errors
    NOT_FOUND: {
        message: "The requested resource was not found",
        data: resourceSchema.optional(),
    },
    CONFLICT: {
        message: "A resource with this identifier already exists",
        data: resourceSchema.optional(),
    },

    // Validation errors
    BAD_REQUEST: {
        message: "Invalid request parameters",
    },

    // Rate limiting
    RATE_LIMITED: {
        message: "Too many requests, please try again later",
        data: retrySchema,
    },

    // Billing/plan errors
    PLAN_LIMIT_EXCEEDED: {
        message: "You have reached the limit for your current plan",
        data: limitSchema,
    },
    FEATURE_UNAVAILABLE: {
        message: "This feature is not available on your current plan",
        data: featureSchema,
    },

    // Server errors
    INTERNAL_SERVER_ERROR: {
        message: "An unexpected error occurred",
    },
} as const;

export type BaseErrors = typeof baseErrors;

