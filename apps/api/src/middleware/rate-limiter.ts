import { type MiddlewareHandler } from "hono";
import { redis } from "@databuddy/redis";
import { type AppVariables } from "../types";

type RateLimiterOptions = {
    keyPrefix: string;
    limit: number;
    window: number; // in seconds
};

export const rateLimiter = (
    options: RateLimiterOptions,
): MiddlewareHandler<{ Variables: AppVariables }> => {
    return async (c, next) => {
        const user = c.get("user");
        if (!user) {
            return c.json({ error: "Unauthorized" }, 401);
        }

        const key = `rate-limit:${options.keyPrefix}:${user.id}`;

        const count = await redis.incr(key);

        if (count === 1) {
            await redis.expire(key, options.window);
        }

        const ttl = await redis.ttl(key);

        c.res.headers.set("X-RateLimit-Limit", options.limit.toString());
        c.res.headers.set(
            "X-RateLimit-Remaining",
            Math.max(0, options.limit - count).toString(),
        );
        c.res.headers.set(
            "X-RateLimit-Reset",
            (Math.floor(Date.now() / 1000) + ttl).toString(),
        );

        if (count > options.limit) {
            c.res.headers.set("Retry-After", ttl.toString());
            return c.json({ error: "Too many requests" }, 429);
        }

        await next();
    };
}; 