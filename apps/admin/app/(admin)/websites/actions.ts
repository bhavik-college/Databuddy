'use server';

import { db, websites as websitesTable, user as usersTable } from '@databuddy/db';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from "next/cache";
import { chQuery } from '@databuddy/db';
// import { isAdminUser } from '@/lib/auth-admin'; // Placeholder

/**
 * Get event counts for websites from ClickHouse
 */
async function getWebsiteEventCounts(websiteIds: string[]) {
  if (websiteIds.length === 0) return {};

  try {
    const query = `
      SELECT 
        client_id,
        count() as total_events,
        count(DISTINCT session_id) as total_sessions,
        countIf(time >= now() - INTERVAL 24 HOUR) as events_last_24h,
        countIf(time >= now() - INTERVAL 7 DAY) as events_last_7d,
        countIf(time >= now() - INTERVAL 30 DAY) as events_last_30d
      FROM analytics.events
      WHERE client_id IN (${websiteIds.map(id => `'${id}'`).join(', ')})
      GROUP BY client_id
    `;

    const results = await chQuery<{
      client_id: string;
      total_events: number;
      total_sessions: number;
      events_last_24h: number;
      events_last_7d: number;
      events_last_30d: number;
    }>(query);

    // Convert to object for easy lookup
    const eventCounts: Record<string, {
      totalEvents: number;
      totalSessions: number;
      eventsLast24h: number;
      eventsLast7d: number;
      eventsLast30d: number;
    }> = {};

    for (const result of results) {
      eventCounts[result.client_id] = {
        totalEvents: result.total_events,
        totalSessions: result.total_sessions,
        eventsLast24h: result.events_last_24h,
        eventsLast7d: result.events_last_7d,
        eventsLast30d: result.events_last_30d,
      };
    }

    return eventCounts;
  } catch (error) {
    console.error('Error fetching website event counts:', error);
    return {};
  }
}

/**
 * Server Action to fetch all websites for the admin dashboard.
 * Includes basic user information (owner) for display and event counts.
 */
export async function getAllWebsitesAsAdmin() {
  // TODO: Implement robust authentication and authorization.
  // if (!isAdminUser()) return { error: 'Unauthorized', websites: [] };

  try {
    const allWebsites = await db
      .select({
        // Select specific fields from websitesTable
        id: websitesTable.id,
        name: websitesTable.name,
        domain: websitesTable.domain, // Assuming domain is a simple string field on the websites table
        createdAt: websitesTable.createdAt,
        userId: websitesTable.userId,
        status: websitesTable.status,
        // Select owner details from usersTable
        ownerName: usersTable.name,
        ownerEmail: usersTable.email,
      })
      .from(websitesTable)
      .leftJoin(usersTable, eq(websitesTable.userId, usersTable.id))
      .orderBy(desc(websitesTable.createdAt));

    // Get event counts for all websites
    const websiteIds = allWebsites.map(w => w.id);
    const eventCounts = await getWebsiteEventCounts(websiteIds);

    // Combine website data with event counts
    const websitesWithEventCounts = allWebsites.map(website => ({
      ...website,
      eventCounts: eventCounts[website.id] || {
        totalEvents: 0,
        totalSessions: 0,
        eventsLast24h: 0,
        eventsLast7d: 0,
        eventsLast30d: 0,
      },
    }));

    return { websites: websitesWithEventCounts, error: null };
  } catch (error) {
    console.error('Error fetching websites in server action:', error);
    return {
      websites: [],
      error: `Failed to fetch websites. ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export async function updateWebsiteName(websiteId: string, newName: string) {
  try {
    await db.update(websitesTable)
      .set({ name: newName, updatedAt: new Date().toISOString() })
      .where(eq(websitesTable.id, websiteId));
    revalidatePath("/websites", "page");
    return { success: true };
  } catch (error) {
    return { error: "Failed to update website name" };
  }
}

export async function deleteWebsite(websiteId: string) {
  try {
    await db.delete(websitesTable).where(eq(websitesTable.id, websiteId));
    revalidatePath("/websites", "page");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete website" };
  }
} 