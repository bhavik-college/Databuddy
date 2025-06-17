import { cacheable } from "@/packages/redis";
import { CreateDomainType } from "../types";
import { db, eq, domains, SQL } from "@/packages/db";

const getCachedDomain = async (whereClause: SQL<unknown>) => {
	return cacheable(
		async () => {
			return await db.query.domains.findFirst({ where: whereClause });
		},
		{
			expireInSec: 60 * 60 * 24, // 24 hours
			staleWhileRevalidate: true,
		},
	)();
};

export async function createDomain(domain: CreateDomainType) {
  const newDomain = await db.insert(domains).values(domain).returning();
  return newDomain;
}

export async function getDomain(id: string, cache: boolean = true) {
  const where = eq(domains.id, id);
  if (cache) {
    return getCachedDomain(where);
  }
  return await db.query.domains.findFirst({ where });
}

export async function getDomainByDomain(domain: string, cache: boolean = true) {
    const where = eq(domains.name, domain);
    if (cache) {
        return getCachedDomain(where);
    }
    return await db.query.domains.findFirst({ where });
}

export async function deleteDomain(id: string) {
  const deletedDomain = await db.delete(domains).where(eq(domains.id, id)).returning();
  return deletedDomain;
}

export async function updateDomain(id: string, domain: Partial<CreateDomainType>) {
  const updatedDomain = await db.update(domains).set(domain).where(eq(domains.id, id)).returning();
  return updatedDomain;
} 