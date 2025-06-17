import { cacheable } from "@/packages/redis";
import { CreateWebsiteType } from "../types";
import { db, eq, websites, SQL } from "@/packages/db";

const getCachedWebsite = async (whereClause: SQL<unknown>) => {
  return cacheable(
    async () => {
      return await db.query.websites.findFirst({ where: whereClause });
    },
    {
      expireInSec: 60 * 60 * 24, // 24 hours
      staleWhileRevalidate: true,
    },
  )();
};

export async function createWebsite(website: CreateWebsiteType) {
  const newWebsite = await db.insert(websites).values(website).returning();
  return newWebsite;
}

export async function getWebsite(id: string, cache: boolean = true) {
  const where = eq(websites.id, id);
  if (cache) {
    return getCachedWebsite(where);
  }
  return await db.query.websites.findFirst({ where });
}

export async function getWebsiteByDomain(domain: string, cache: boolean = true) {
  const where = eq(websites.domain, domain);
  if (cache) {
    return getCachedWebsite(where);
  }
  return await db.query.websites.findFirst({ where });
}

export async function deleteWebsite(id: string) {
  const deletedWebsite = await db
    .delete(websites)
    .where(eq(websites.id, id))
    .returning();
  return deletedWebsite;
}

export async function updateWebsite(
  id: string,
  website: Partial<CreateWebsiteType>,
) {
  const updatedWebsite = await db
    .update(websites)
    .set(website)
    .where(eq(websites.id, id))
    .returning();
  return updatedWebsite;
}