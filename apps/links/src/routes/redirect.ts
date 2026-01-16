import { and, clickHouse, db, eq, isNull, links } from "@databuddy/db";
import { Elysia, redirect, t } from "elysia";
import { hashIp } from "../utils/hash";

export const redirectRoute = new Elysia().get(
	"/:slug",
	async ({ params, request, error }) => {
		const link = await db.query.links.findFirst({
			where: and(eq(links.slug, params.slug), isNull(links.deletedAt)),
		});

		if (!link) {
			return error(404, { error: "Link not found" });
		}

		const referrer = request.headers.get("referer");
		const userAgent = request.headers.get("user-agent");
		const forwardedFor = request.headers.get("x-forwarded-for");
		const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";

		const country = request.headers.get("cf-ipcountry");
		const city = request.headers.get("cf-ipcity");
		const region = request.headers.get("cf-ipregion");

		clickHouse
			.insert({
				table: "analytics.link_visits",
				values: [
					{
						id: crypto.randomUUID(),
						link_id: link.id,
						timestamp: new Date()
							.toISOString()
							.replace("T", " ")
							.replace("Z", ""),
						referrer,
						user_agent: userAgent,
						ip_hash: hashIp(ip),
						country,
						region,
						city,
						browser_name: null,
						device_type: null,
					},
				],
				format: "JSONEachRow",
			})
			.catch((err) => console.error("Failed to track visit:", err));

		return redirect(link.targetUrl, 302);
	},
	{
		params: t.Object({
			slug: t.String(),
		}),
	}
);
