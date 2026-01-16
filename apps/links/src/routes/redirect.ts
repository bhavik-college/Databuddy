import { and, db, eq, isNull, links } from "@databuddy/db";
import {
	type CachedLink,
	getCachedLink,
	setCachedLink,
	setCachedLinkNotFound,
} from "@databuddy/redis";
import { Elysia, redirect, t } from "elysia";
import { sendLinkVisit } from "../lib/producer";
import { extractIp, getGeo } from "../utils/geo";
import { hashIp } from "../utils/hash";
import { parseUserAgent } from "../utils/user-agent";

const DEFAULT_EXPIRED_URL = "https://dby.sh/expired";

async function getLinkBySlug(slug: string): Promise<CachedLink | null> {
	// Try cache first
	const cached = await getCachedLink(slug).catch(() => null);
	if (cached) {
		return cached;
	}

	// Fetch from database
	const dbLink = await db.query.links.findFirst({
		where: and(eq(links.slug, slug), isNull(links.deletedAt)),
		columns: {
			id: true,
			targetUrl: true,
			expiresAt: true,
			expiredRedirectUrl: true,
			ogTitle: true,
			ogDescription: true,
			ogImageUrl: true,
		},
	});

	if (!dbLink) {
		// Cache negative result with short TTL
		await setCachedLinkNotFound(slug).catch(() => { });
		return null;
	}

	const link: CachedLink = {
		id: dbLink.id,
		targetUrl: dbLink.targetUrl,
		expiresAt: dbLink.expiresAt?.toISOString() ?? null,
		expiredRedirectUrl: dbLink.expiredRedirectUrl,
		ogTitle: dbLink.ogTitle,
		ogDescription: dbLink.ogDescription,
		ogImageUrl: dbLink.ogImageUrl,
	};

	// Cache the result
	await setCachedLink(slug, link).catch(() => { });

	return link;
}

function isLinkExpired(link: CachedLink): boolean {
	if (!link.expiresAt) {
		return false;
	}
	return new Date(link.expiresAt) < new Date();
}

// Bot user agents for social media crawlers
const BOT_USER_AGENTS = [
	"facebookexternalhit",
	"Facebot",
	"Twitterbot",
	"LinkedInBot",
	"Slackbot",
	"Discordbot",
	"WhatsApp",
	"TelegramBot",
	"Pinterestbot",
	"Googlebot",
	"bingbot",
	"Baiduspider",
	"YandexBot",
	"DuckDuckBot",
];

function isSocialBot(userAgent: string | null): boolean {
	if (!userAgent) {
		return false;
	}
	const lowerUA = userAgent.toLowerCase();
	return BOT_USER_AGENTS.some((bot) => lowerUA.includes(bot.toLowerCase()));
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

function generateOgHtml(link: CachedLink, requestUrl: string): string {
	const title = link.ogTitle ?? "Shared Link";
	const description = link.ogDescription ?? "";
	const image = link.ogImageUrl ?? "";

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>${escapeHtml(title)}</title>
	<meta property="og:title" content="${escapeHtml(title)}">
	<meta property="og:url" content="${escapeHtml(requestUrl)}">
	<meta property="og:type" content="website">
	${description ? `<meta property="og:description" content="${escapeHtml(description)}">` : ""}
	${image ? `<meta property="og:image" content="${escapeHtml(image)}">` : ""}
	<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}">
	<meta name="twitter:title" content="${escapeHtml(title)}">
	${description ? `<meta name="twitter:description" content="${escapeHtml(description)}">` : ""}
	${image ? `<meta name="twitter:image" content="${escapeHtml(image)}">` : ""}
	<meta http-equiv="refresh" content="0; url=${escapeHtml(link.targetUrl)}">
</head>
<body>
	<p>Redirecting to <a href="${escapeHtml(link.targetUrl)}">${escapeHtml(link.targetUrl)}</a></p>
</body>
</html>`;
}

export const redirectRoute = new Elysia().get(
	"/:slug",
	async ({ params, request }) => {
		const link = await getLinkBySlug(params.slug);

		if (!link) {
			return Response.json({ error: "Link not found" }, { status: 404 });
		}

		// Check if link has expired
		if (isLinkExpired(link)) {
			const expiredUrl = link.expiredRedirectUrl ?? DEFAULT_EXPIRED_URL;
			return redirect(expiredUrl, 302);
		}

		const referrer = request.headers.get("referer");
		const userAgent = request.headers.get("user-agent");
		const ip = extractIp(request);

		// If this is a social bot and we have custom OG metadata, serve HTML
		const hasCustomOg = link.ogTitle ?? link.ogDescription ?? link.ogImageUrl;
		if (hasCustomOg && isSocialBot(userAgent)) {
			const requestUrl = request.url;
			const html = generateOgHtml(link, requestUrl);
			return new Response(html, {
				status: 200,
				headers: { "Content-Type": "text/html; charset=utf-8" },
			});
		}

		const [geo, ua] = await Promise.all([
			getGeo(ip),
			Promise.resolve(parseUserAgent(userAgent)),
		]);

		sendLinkVisit(
			{
				link_id: link.id,
				timestamp: new Date()
					.toISOString()
					.replace("T", " ")
					.replace("Z", ""),
				referrer,
				user_agent: userAgent,
				ip_hash: hashIp(ip),
				country: geo.country,
				region: geo.region,
				city: geo.city,
				browser_name: ua.browserName,
				device_type: ua.deviceType,
			},
			link.id
		).catch((err) => console.error("Failed to track visit:", err));

		return redirect(link.targetUrl, 302);
	},
	{
		params: t.Object({
			slug: t.String(),
		}),
	}
);
