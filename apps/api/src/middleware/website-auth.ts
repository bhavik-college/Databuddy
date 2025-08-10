import { auth } from '@databuddy/auth';
import { Elysia } from 'elysia';
import { getApiKeyFromHeader, hasWebsiteScope } from '../lib/api-key';
import { getCachedWebsite, getTimezone } from '../lib/website-utils';

function json(status: number, body: unknown) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}

export function websiteAuth() {
	return new Elysia()
		.onRequest(async ({ request }) => {
			const url = new URL(request.url);
			const websiteId = url.searchParams.get('website_id');

			const apiKeySecret = request.headers.get('x-api-key');
			const apiKey = apiKeySecret
				? await getApiKeyFromHeader(request.headers)
				: null;

			const session = await auth.api.getSession({ headers: request.headers });
			const hasSession = Boolean(session?.user);

			// No website_id: require either session or valid API key
			if (!websiteId) {
				if (hasSession || apiKey) {
					return;
				}
				return json(401, {
					success: false,
					error: 'Authentication required',
					code: 'AUTH_REQUIRED',
				});
			}

			const website = await getCachedWebsite(websiteId);
			if (!website) {
				return json(404, {
					success: false,
					error: 'Website not found',
					code: 'NOT_FOUND',
				});
			}

			if (website.isPublic) {
				return;
			}

			// Private website: allow if session exists OR key has read:data for website
			if (hasSession) {
				return;
			}

			if (!apiKeySecret) {
				return json(401, {
					success: false,
					error: 'Authentication required',
					code: 'AUTH_REQUIRED',
				});
			}

			if (!apiKey) {
				return json(401, {
					success: false,
					error: 'Invalid or expired API key',
					code: 'AUTH_REQUIRED',
				});
			}

			const canRead = await hasWebsiteScope(apiKey, websiteId, 'read:data');
			if (!canRead) {
				return json(403, {
					success: false,
					error: 'Insufficient permissions',
					code: 'FORBIDDEN',
				});
			}
		})
		.derive(async ({ request }) => {
			const url = new URL(request.url);
			const websiteId = url.searchParams.get('website_id');
			const session = await auth.api.getSession({ headers: request.headers });
			const timezone = session?.user
				? await getTimezone(request, session)
				: await getTimezone(request, null);
			const website = websiteId ? await getCachedWebsite(websiteId) : undefined;
			return {
				user: session?.user ?? null,
				session,
				website,
				timezone,
			} as const;
		});
}
