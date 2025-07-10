import { protectedProcedure, publicProcedure, createTRPCRouter } from "../trpc";
import { z } from "zod";
import { chQuery, db, websites, eq, inArray, or, isNull, member, and } from "@databuddy/db";

async function getAuthorizedWebsiteIds(userId: string, requestedIds: string[]): Promise<string[]> {
    if (!userId || requestedIds.length === 0) return [];

    const userOrgs = await db.query.member.findMany({
        where: eq(member.userId, userId),
        columns: { organizationId: true },
    });
    const orgIds = userOrgs.map(m => m.organizationId);

    const accessibleWebsites = await db.query.websites.findMany({
        where: and(
            inArray(websites.id, requestedIds),
            or(
                eq(websites.userId, userId),
                orgIds.length > 0 ? inArray(websites.organizationId, orgIds) : isNull(websites.organizationId)
            )
        ),
        columns: {
            id: true,
        },
    });

    return accessibleWebsites.map(w => w.id);
}

const getBatchedMiniChartData = async (websiteIds: string[]) => {
    if (websiteIds.length === 0) {
        return {};
    }

    const websiteIdsString = websiteIds.map(id => `'${id}'`).join(',');

    const query = `
        WITH dates AS (
            SELECT toDate(now() - number) as date
            FROM system.numbers
            LIMIT 7
        ),
        website_dates AS (
            SELECT
                id as websiteId,
                date
            FROM (
                SELECT id FROM system.tables WHERE database = 'system' AND name = 'one'
            )
            CROSS JOIN (
                SELECT id FROM (SELECT arrayJoin([${websiteIdsString}]) as id)
            )
            CROSS JOIN dates
        ),
        daily_pageviews AS (
            SELECT
                client_id as websiteId,
                toDate(time) as event_date,
                countIf(event_name = 'screen_view') as pageviews
            FROM analytics.events
            WHERE
                client_id IN (${websiteIdsString})
                AND toDate(time) >= (today() - 6)
            GROUP BY client_id, event_date
        )
        SELECT
            wd.websiteId,
            toString(wd.date) as date,
            COALESCE(dp.pageviews, 0) as value
        FROM website_dates wd
        LEFT JOIN daily_pageviews dp ON wd.date = dp.event_date AND wd.websiteId = dp.websiteId
        ORDER BY wd.websiteId, wd.date ASC
    `;

    interface MiniChartRow {
        websiteId: string;
        date: string;
        value: number;
    }

    const queryResult = await chQuery<MiniChartRow>(query);

    const result = websiteIds.reduce((acc, id) => {
        acc[id] = [];
        return acc;
    }, {} as Record<string, { date: string, value: number }[]>);

    for (const row of queryResult) {
        if (result[row.websiteId]) {
            result[row.websiteId].push({
                date: row.date,
                value: row.value,
            });
        }
    }

    return result;
}

export const analyticsRouter = createTRPCRouter({
    getMiniCharts: protectedProcedure
        .input(
            z.object({
                websiteIds: z.array(z.string()),
            })
        )
        .query(async ({ ctx, input }) => {
            const userId = ctx.user.id;
            const authorizedIds = await getAuthorizedWebsiteIds(userId, input.websiteIds);
            const charts = await getBatchedMiniChartData(authorizedIds);
            return charts;
        }),
}); 