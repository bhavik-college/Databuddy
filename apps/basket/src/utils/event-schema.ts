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
    .regex(/^[a-zA-Z-]{2,16}$/, "Invalid language code");

const connectionTypeSchema = z.enum([
    "wifi",
    "cellular",
    "ethernet",
    "none",
    "unknown",
]).nullable().optional();

export const analyticsEventSchema = z.object({
    eventId: z.string().min(1).max(128),
    name: z.string().min(1).max(128),
    anonymousId: z.string().min(1).max(128).nullable().optional(),
    sessionId: z.string().min(1).max(128).nullable().optional(),
    timestamp: z.number().int().gte(946684800000).lte(Date.now() + 31_536_000_000).nullable().optional(), // year 2000 to 1 year in future
    sessionStartTime: z.number().int().gte(946684800000).lte(Date.now() + 31_536_000_000).nullable().optional(),
    referrer: z.string().max(2048).nullable().optional(),
    path: z.string().max(2048),
    title: z.string().max(512).nullable().optional(),
    screen_resolution: resolutionSchema.nullable().optional(),
    viewport_size: resolutionSchema.nullable().optional(),
    language: languageSchema.nullable().optional(),
    timezone: z.string().max(64).nullable().optional(),
    connection_type: connectionTypeSchema,
    rtt: z.number().int().min(0).max(10000).nullable().optional(),
    downlink: z.number().min(0).max(10000).nullable().optional(),
    time_on_page: z.number().int().min(0).max(86400).nullable().optional(),
    scroll_depth: z.number().min(0).max(100).nullable().optional(),
    interaction_count: z.number().int().min(0).max(10000).nullable().optional(),
    exit_intent: z.number().int().min(0).max(1).nullable().optional(),
    page_count: z.number().int().min(1).max(1000).nullable().optional(),
    is_bounce: z.number().int().min(0).max(1).nullable().optional(),
    has_exit_intent: z.boolean().nullable().optional(),
    page_size: z.number().int().min(0).max(100_000_000).nullable().optional(),
    utm_source: z.string().max(128).nullable().optional(),
    utm_medium: z.string().max(128).nullable().optional(),
    utm_campaign: z.string().max(128).nullable().optional(),
    utm_term: z.string().max(128).nullable().optional(),
    utm_content: z.string().max(128).nullable().optional(),
    load_time: z.number().min(0).max(60000).nullable().optional(),
    dom_ready_time: z.number().min(0).max(60000).nullable().optional(),
    dom_interactive: z.number().min(0).max(60000).nullable().optional(),
    ttfb: z.number().min(0).max(60000).nullable().optional(),
    connection_time: z.number().min(0).max(60000).nullable().optional(),
    request_time: z.number().min(0).max(60000).nullable().optional(),
    render_time: z.number().min(0).max(60000).nullable().optional(),
    redirect_time: z.number().min(0).max(60000).nullable().optional(),
    domain_lookup_time: z.number().min(0).max(60000).nullable().optional(),
    fcp: z.number().min(0).max(60000).nullable().optional(),
    lcp: z.number().min(0).max(60000).nullable().optional(),
    cls: z.number().min(0).max(10).nullable().optional(),
    fid: z.number().min(0).max(10000).nullable().optional(),
    inp: z.number().min(0).max(10000).nullable().optional(),
    href: z.string().max(2048).nullable().optional(),
    text: z.string().max(2048).nullable().optional(),
    value: z.string().max(2048).nullable().optional(),
});

export const errorEventSchema = z.object({
    payload: z.object({
        eventId: z.string().min(1).max(128).nullable().optional(),
        anonymousId: z.string().min(1).max(128).nullable().optional(),
        sessionId: z.string().min(1).max(128).nullable().optional(),
        timestamp: z.number().int().gte(946684800000).lte(Date.now() + 31_536_000_000).nullable().optional(),
        path: z.string().max(2048),
        message: z.string().max(2048),
        filename: z.string().max(512).nullable().optional(),
        lineno: z.number().int().min(0).max(100_000).nullable().optional(),
        colno: z.number().int().min(0).max(100_000).nullable().optional(),
        stack: z.string().max(4096).nullable().optional(),
        errorType: z.string().max(128).nullable().optional(),
    })
});

export const webVitalsEventSchema = z.object({
    payload: z.object({
        eventId: z.string().min(1).max(128).nullable().optional(),
        anonymousId: z.string().min(1).max(128).nullable().optional(),
        sessionId: z.string().min(1).max(128).nullable().optional(),
        timestamp: z.number().int().gte(946684800000).lte(Date.now() + 31_536_000_000).nullable().optional(),
        path: z.string().max(2048),
        fcp: z.number().min(0).max(60000).nullable().optional(),
        lcp: z.number().min(0).max(60000).nullable().optional(),
        cls: z.number().min(0).max(10).nullable().optional(),
        fid: z.number().min(0).max(10000).nullable().optional(),
        inp: z.number().min(0).max(10000).nullable().optional(),
    })
}); 