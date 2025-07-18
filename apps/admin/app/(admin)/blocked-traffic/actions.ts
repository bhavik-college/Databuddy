"use server";

import { chQuery } from "@databuddy/db";
import type { BlockedTraffic } from "@databuddy/db";
import { db, websites as websitesTable } from "@databuddy/db";
import { inArray } from "drizzle-orm";

export interface BlockedTrafficQueryParams {
    limit?: number;
    offset?: number;
    client_id?: string;
    ip?: string;
    block_reason?: string;
    country?: string;
    from?: string;
    to?: string;
    search?: string;
}

function escapeString(str: string): string {
    return str.replace(/'/g, "''");
}

export async function fetchBlockedTraffic(params: BlockedTrafficQueryParams = {}) {
    try {
        const {
            limit = 25,
            offset = 0,
            client_id,
            ip,
            block_reason,
            country,
            from,
            to,
            search,
        } = params;

        const conditions: string[] = [];
        if (client_id) conditions.push(`client_id ILIKE '%${escapeString(client_id)}%'`);
        if (ip) conditions.push(`ip ILIKE '%${escapeString(ip)}%'`);
        if (block_reason) conditions.push(`block_reason ILIKE '%${escapeString(block_reason)}%'`);
        if (country) conditions.push(`country ILIKE '%${escapeString(country)}%'`);
        if (from) conditions.push(`timestamp >= parseDateTimeBestEffort('${escapeString(from)}')`);
        if (to) conditions.push(`timestamp <= parseDateTimeBestEffort('${escapeString(to)} 23:59:59')`);
        if (search) {
            const s = escapeString(search);
            conditions.push(`(
        client_id ILIKE '%${s}%'
        OR ip ILIKE '%${s}%'
        OR block_reason ILIKE '%${s}%'
        OR country ILIKE '%${s}%'
        OR referrer ILIKE '%${s}%'
        OR url ILIKE '%${s}%'
        OR user_agent ILIKE '%${s}%'
        OR browser_name ILIKE '%${s}%'
        OR os_name ILIKE '%${s}%'
      )`);
        }
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        const totalQuery = `
      SELECT count() as total
      FROM analytics.blocked_traffic
      ${whereClause}
    `;
        const totalResult = await chQuery<{ total: number }>(totalQuery);
        const total = totalResult[0]?.total || 0;

        const dataQuery = `
      SELECT *
      FROM analytics.blocked_traffic
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;
        const data = await chQuery<BlockedTraffic>(dataQuery);
        return { data, total };
    } catch (error) {
        console.error("Error fetching blocked traffic:", error);
        return { data: [], total: 0, error: String(error) };
    }
}

export interface BlockedTrafficStats {
    total_blocked: number;
    top_reasons: Array<{ block_reason: string; count: number }>;
    top_countries: Array<{ country: string; count: number }>;
    top_clients: Array<{ client_id: string; count: number; website_name?: string | null; website_domain?: string | null }>;
    hourly_trend: Array<{ hour: string; count: number }>;
    top_bot_names: Array<{ bot_name: string; count: number }>;
    top_user_agents: Array<{ user_agent: string; count: number }>;
    total_known_bots: number;
    total_unknown_bots: number;
}

export async function fetchBlockedTrafficStats(params: Pick<BlockedTrafficQueryParams, 'from' | 'to' | 'client_id'> = {}): Promise<BlockedTrafficStats> {
    try {
        const { from, to, client_id } = params;
        const conditions: string[] = [];
        if (from) conditions.push(`timestamp >= parseDateTimeBestEffort('${escapeString(from)}')`);
        if (to) conditions.push(`timestamp <= parseDateTimeBestEffort('${escapeString(to)} 23:59:59')`);
        if (client_id) conditions.push(`client_id ILIKE '%${escapeString(client_id)}%'`);
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        // Total blocked
        const totalQuery = `
      SELECT count() as total_blocked
      FROM analytics.blocked_traffic
      ${whereClause}
    `;
        // Top reasons
        const topReasonsQuery = `
      SELECT block_reason, count() as count
      FROM analytics.blocked_traffic
      ${whereClause}
      GROUP BY block_reason
      ORDER BY count DESC
      LIMIT 10
    `;
        // Top countries
        const topCountriesQuery = `
      SELECT country, count() as count
      FROM analytics.blocked_traffic
      ${whereClause}
      GROUP BY country
      ORDER BY count DESC
      LIMIT 10
    `;
        // Top clients
        const topClientsQuery = `
      SELECT client_id, count() as count
      FROM analytics.blocked_traffic
      ${whereClause}
      GROUP BY client_id
      ORDER BY count DESC
      LIMIT 10
    `;
        // Hourly trend (last 24h)
        let hourlyTrendWhere = '';
        if (whereClause) {
            hourlyTrendWhere = `${whereClause} AND timestamp >= now() - INTERVAL 24 HOUR`;
        } else {
            hourlyTrendWhere = 'WHERE timestamp >= now() - INTERVAL 24 HOUR';
        }
        const hourlyTrendQuery = `
      SELECT formatDateTime(timestamp, '%Y-%m-%d %H:00:00') as hour, count() as count
      FROM analytics.blocked_traffic
      ${hourlyTrendWhere}
      GROUP BY hour
      ORDER BY hour ASC
    `;
        // Top bot names (exclude empty)
        const topBotNamesQuery = `
      SELECT bot_name, count() as count
      FROM analytics.blocked_traffic
      ${whereClause}${whereClause ? ` AND bot_name != ''` : `WHERE bot_name != ''`}
      GROUP BY bot_name
      ORDER BY count DESC
      LIMIT 10
    `;
        // Top user agents for known bots (bot_name not empty)
        const topUserAgentsQuery = `
      SELECT user_agent, count() as count
      FROM analytics.blocked_traffic
      ${whereClause}${whereClause ? ` AND bot_name != ''` : `WHERE bot_name != ''`}
      GROUP BY user_agent
      ORDER BY count DESC
      LIMIT 10
    `;
        // Total known bots (bot_name not empty)
        const totalKnownBotsQuery = `
      SELECT count() as count
      FROM analytics.blocked_traffic
      ${whereClause}${whereClause ? ` AND bot_name != ''` : `WHERE bot_name != ''`}
    `;
        // Total unknown bots (bot_name empty, block_category = 'Bot Detection')
        const totalUnknownBotsQuery = `
      SELECT count() as count
      FROM analytics.blocked_traffic
      ${whereClause}${whereClause ? ` AND (bot_name = '' OR bot_name IS NULL) AND block_category = 'Bot Detection'` : `WHERE (bot_name = '' OR bot_name IS NULL) AND block_category = 'Bot Detection'`}
    `;

        const [
            totalResult,
            topReasonsResult,
            topCountriesResult,
            topClientsResult,
            hourlyTrendResult,
            topBotNamesResult,
            topUserAgentsResult,
            totalKnownBotsResult,
            totalUnknownBotsResult
        ] = await Promise.all([
            chQuery<{ total_blocked: number }>(totalQuery),
            chQuery<{ block_reason: string; count: number }>(topReasonsQuery),
            chQuery<{ country: string; count: number }>(topCountriesQuery),
            chQuery<{ client_id: string; count: number }>(topClientsQuery),
            chQuery<{ hour: string; count: number }>(hourlyTrendQuery),
            chQuery<{ bot_name: string; count: number }>(topBotNamesQuery),
            chQuery<{ user_agent: string; count: number }>(topUserAgentsQuery),
            chQuery<{ count: number }>(totalKnownBotsQuery),
            chQuery<{ count: number }>(totalUnknownBotsQuery),
        ]);

        // Fetch website metadata for top clients
        const clientIds = topClientsResult.map(c => c.client_id);
        let websiteMeta: { id: string; name: string | null; domain: string | null }[] = [];
        if (clientIds.length > 0) {
            websiteMeta = await db
                .select({ id: websitesTable.id, name: websitesTable.name, domain: websitesTable.domain })
                .from(websitesTable)
                .where(inArray(websitesTable.id, clientIds));
        }
        const topClientsWithMeta = topClientsResult.map(c => {
            const meta = websiteMeta.find(w => w.id === c.client_id);
            return {
                ...c,
                website_name: meta?.name || null,
                website_domain: meta?.domain || null,
            };
        });

        return {
            total_blocked: totalResult[0]?.total_blocked || 0,
            top_reasons: topReasonsResult,
            top_countries: topCountriesResult,
            top_clients: topClientsWithMeta,
            hourly_trend: hourlyTrendResult,
            top_bot_names: topBotNamesResult,
            top_user_agents: topUserAgentsResult,
            total_known_bots: totalKnownBotsResult[0]?.count || 0,
            total_unknown_bots: totalUnknownBotsResult[0]?.count || 0,
        };
    } catch (error) {
        console.error("Error fetching blocked traffic stats:", error);
        return {
            total_blocked: 0,
            top_reasons: [],
            top_countries: [],
            top_clients: [],
            hourly_trend: [],
            top_bot_names: [],
            top_user_agents: [],
            total_known_bots: 0,
            total_unknown_bots: 0,
        };
    }
} 