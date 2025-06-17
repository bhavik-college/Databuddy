import { Elysia } from 'elysia';
import { detectUserTimezone, isValidTimezone } from '../lib/timezone';

export const timezoneMiddleware = new Elysia({ name: 'middleware.timezone' })
    .derive(({ request, query }) => {
        const explicitTimezone = query.timezone as string | undefined;

        if (explicitTimezone && !isValidTimezone(explicitTimezone)) {
            throw new Error('Invalid timezone provided');
        }

        const timezoneInfo = detectUserTimezone(request.headers, explicitTimezone);

        return {
            timezoneInfo
        };
    });

export type TimezoneMiddleware = typeof timezoneMiddleware;
