import { z } from "zod/v4";

const resolutionRegex = /^(\d{2,5})x(\d{2,5})$/;
const resolutionSchema = z
    .string()
    .regex(resolutionRegex, "Must be in the format 'WIDTHxHEIGHT'")
    .refine((val) => {
        const match = val.match(resolutionRegex);
        if (!match) return false;
        const width = Number(match[1]);
        const height = Number(match[2]);
        return width >= 240 && width <= 10000 && height >= 240 && height <= 10000;
    }, "Width/height out of range (240-10000)");

const languageSchema = z
    .string()
    .regex(/^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$/, "Invalid language tag");

const connectionTypeSchema = z.enum([
    "bluetooth",
    "cellular",
    "ethernet",
    "none",
    "wifi",
    "wimax",
    "other",
    "unknown",
    "slow-2g",
    "2g",
    "3g",
    "4g",
]).nullable().optional();

const MAX_FUTURE_MS = 60 * 60 * 1000; // 1 hour
const MIN_TIMESTAMP = 946684800000; // year 2000

export const analyticsEventSchema = z.object({
    eventId: z.string().max(512),
    name: z.string().min(1).max(128),
    anonymousId: z.string().nullable().optional(),
    sessionId: z.string().nullable().optional(),
    timestamp: z.number().int().gte(MIN_TIMESTAMP).nullable().optional()
        .refine(val => val == null || val <= Date.now() + MAX_FUTURE_MS, {
            message: 'Timestamp too far in the future (max 1 hour ahead)'
        }),
    sessionStartTime: z.number().int().gte(MIN_TIMESTAMP).nullable().optional()
        .refine(val => val == null || val <= Date.now() + MAX_FUTURE_MS, {
            message: 'Session start time too far in the future (max 1 hour ahead)'
        }),
    referrer: z.union([
        z.url({ protocol: /^https?$/, hostname: z.regexes.domain }),
        z.literal('direct')
    ]).nullable().optional(),
    path: z.union([
        z.url({ protocol: /^https?$/, hostname: z.regexes.domain }),
        z.string().regex(/^https?:\/\/localhost(:\d+)?\//) // Temporary, probably should remove tho.
    ]),
    title: z.string().max(512).nullable().optional(),
    screen_resolution: resolutionSchema.nullable().optional(),
    viewport_size: resolutionSchema.nullable().optional(),
    language: languageSchema.nullable().optional(),
    timezone: z.string().max(64).nullable().optional(),
    connection_type: connectionTypeSchema,
    rtt: z.number().int().max(10000).nullable().optional(),
    downlink: z.number().max(10000).nullable().optional(),
    time_on_page: z.number().int().max(86400).nullable().optional(),
    scroll_depth: z.number().max(100).nullable().optional(),
    interaction_count: z.number().int().max(10000).nullable().optional(),
    exit_intent: z.number().int().max(1).nullable().optional(),
    page_count: z.number().int().max(1000).nullable().optional(),
    is_bounce: z.number().int().max(1).nullable().optional(),
    has_exit_intent: z.boolean().nullable().optional(),
    page_size: z.number().int().max(100_000_000).nullable().optional(),
    utm_source: z.string().max(128).nullable().optional(),
    utm_medium: z.string().max(128).nullable().optional(),
    utm_campaign: z.string().max(128).nullable().optional(),
    utm_term: z.string().max(128).nullable().optional(),
    utm_content: z.string().max(128).nullable().optional(),
    load_time: z.number().max(60000).nullable().optional(),
    dom_ready_time: z.number().max(60000).nullable().optional(),
    dom_interactive: z.number().max(60000).nullable().optional(),
    ttfb: z.number().max(60000).nullable().optional(),
    connection_time: z.number().max(60000).nullable().optional(),
    request_time: z.number().max(60000).nullable().optional(),
    render_time: z.number().max(60000).nullable().optional(),
    redirect_time: z.number().max(60000).nullable().optional(),
    domain_lookup_time: z.number().max(60000).nullable().optional(),
    fcp: z.number().max(60000).nullable().optional(),
    lcp: z.number().max(60000).nullable().optional(),
    cls: z.number().max(10).nullable().optional(),
    fid: z.number().max(10000).nullable().optional(),
    inp: z.number().max(10000).nullable().optional(),
    href: z.string().max(2048).nullable().optional(),
    text: z.string().max(2048).nullable().optional(),
    value: z.string().max(2048).nullable().optional(),
});

export const errorEventSchema = z.object({
    payload: z.object({
        eventId: z.string().max(128).nullable().optional(),
        anonymousId: z.string().max(128).nullable().optional(),
        sessionId: z.string().max(128).nullable().optional(),
        timestamp: z.number().int().gte(MIN_TIMESTAMP).nullable().optional()
            .refine(val => val == null || val <= Date.now() + MAX_FUTURE_MS, {
                message: 'Timestamp too far in the future (max 1 hour ahead)'
            }),
        path: z.string().max(2048),
        message: z.string().max(2048),
        filename: z.string().max(512).nullable().optional(),
        lineno: z.number().int().max(100_000).nullable().optional(),
        colno: z.number().int().max(100_000).nullable().optional(),
        stack: z.string().max(4096).nullable().optional(),
        errorType: z.string().max(128).nullable().optional(),
    })
});

export const webVitalsEventSchema = z.object({
    payload: z.object({
        eventId: z.string().max(128).nullable().optional(),
        anonymousId: z.string().max(128).nullable().optional(),
        sessionId: z.string().max(128).nullable().optional(),
        timestamp: z.number().int().gte(MIN_TIMESTAMP).nullable().optional()
            .refine(val => val == null || val <= Date.now() + MAX_FUTURE_MS, {
                message: 'Timestamp too far in the future (max 1 hour ahead)'
            }),
        path: z.string().max(2048),
        fcp: z.number().max(60000).nullable().optional(),
        lcp: z.number().max(60000).nullable().optional(),
        cls: z.number().max(10).nullable().optional(),
        fid: z.number().max(10000).nullable().optional(),
        inp: z.number().max(10000).nullable().optional(),
    })
}); 