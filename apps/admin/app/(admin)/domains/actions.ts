"use server";

import { db, domains as domainsTable, websites as websitesTable, user as usersTable } from "@databuddy/db";
import { eq, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import dns from "node:dns";
import { promisify } from "node:util";

// Promisify DNS lookup
const dnsLookup = promisify(dns.lookup);

interface Website {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  domain: string;
}

export async function getAllDomainsAsAdmin() {
  // TODO: Implement admin authentication/authorization
  try {
    const domainList = await db
      .select({
        id: domainsTable.id,
        name: domainsTable.name,
        verifiedAt: domainsTable.verifiedAt,
        verificationStatus: domainsTable.verificationStatus,
        createdAt: domainsTable.createdAt,
        userId: domainsTable.userId,
        ownerName: usersTable.name,
        ownerEmail: usersTable.email,
        ownerImage: usersTable.image,
        websites: sql<Website[]>`COALESCE(
          json_agg(
            json_build_object(
              'id', ${websitesTable.id},
              'name', ${websitesTable.name},
              'status', ${websitesTable.status},
              'createdAt', ${websitesTable.createdAt},
              'domain', ${websitesTable.domain}
            )
          ) FILTER (WHERE ${websitesTable.id} IS NOT NULL),
          '[]'::json
        )`
      })
      .from(domainsTable)
      .leftJoin(usersTable, eq(domainsTable.userId, usersTable.id))
      .leftJoin(websitesTable, eq(websitesTable.domainId, domainsTable.id))
      .groupBy(domainsTable.id, usersTable.name, usersTable.email, usersTable.image)
      .orderBy(desc(domainsTable.createdAt));

    return { domains: domainList, error: null };
  } catch (err) {
    console.error("Error fetching domains for admin:", err);
    if (err instanceof Error) {
      return { domains: [], error: err.message };
    }
    return { domains: [], error: "An unknown error occurred while fetching domains." };
  }
}

export async function checkDomainVerification(id: string) {
  try {
    const domain = await db.query.domains.findFirst({
      where: eq(domainsTable.id, id)
    });

    if (!domain) {
      return { error: "Domain not found" };
    }

    // Check if domain is localhost
    const isLocalhost = domain.name.includes('localhost') || domain.name.includes('127.0.0.1');
    if (isLocalhost) {
      // Auto-verify localhost domains
      await db.update(domainsTable)
        .set({
          verifiedAt: new Date().toISOString(),
          verificationStatus: "VERIFIED"
        })
        .where(eq(domainsTable.id, id));
      
      return { 
        data: { 
          verified: true, 
          message: "Localhost domain automatically verified" 
        } 
      };
    }

    // If already verified, return success
    if (domain.verificationStatus === "VERIFIED" && domain.verifiedAt) {
      return { data: { verified: true, message: "Domain already verified" } };
    }

    // Extract domain from URL and remove www. prefix
    const domainName = domain.name;
    const rootDomain = domainName.replace(/^www\./, '');
    
    // Check for TXT record
    try {
      const dnsRecord = `_databuddy.${rootDomain}`;
      const txtRecords = await dns.promises.resolveTxt(dnsRecord);
      
      // Check if any TXT record contains our verification token
      const expectedToken = domain.verificationToken || '';
      
      const isVerified = txtRecords.some(record => 
        record.some(txt => txt.includes(expectedToken))
      );
      
      if (isVerified) {
        // Update domain as verified
        await db.update(domainsTable)
          .set({
            verifiedAt: new Date().toISOString(),
            verificationStatus: "VERIFIED"
          })
          .where(eq(domainsTable.id, id));
        
        revalidatePath("/admin/domains");
        
        return { 
          data: { 
            verified: true, 
            message: "Domain verified successfully" 
          } 
        };
      }
      
      // Update domain as failed
      await db.update(domainsTable)
        .set({
          verificationStatus: "FAILED"
        })
        .where(eq(domainsTable.id, id));
      
      return { 
        data: { 
          verified: false, 
          message: "Verification token not found in DNS records" 
        } 
      };
    } catch (error) {
      // Update domain as failed
      await db.update(domainsTable)
        .set({
          verificationStatus: "FAILED"
        })
        .where(eq(domainsTable.id, id));
      
      return { 
        data: { 
          verified: false, 
          message: "Could not find verification record" 
        } 
      };
    }
  } catch (error) {
    console.error("Error checking domain verification:", error);
    return { error: "Failed to check domain verification" };
  }
}

export async function regenerateVerificationToken(id: string) {
  try {
    const domain = await db.query.domains.findFirst({
      where: eq(domainsTable.id, id)
    });

    if (!domain) {
      return { error: "Domain not found" };
    }

    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const verificationToken = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    
    // Update domain with new token
    await db.update(domainsTable)
      .set({
        verificationToken,
        verificationStatus: "PENDING",
        verifiedAt: null
      })
      .where(eq(domainsTable.id, id));

    revalidatePath("/admin/domains");
    
    return { data: { verificationToken } };
  } catch (error) {
    console.error("Error regenerating verification token:", error);
    return { error: "Failed to regenerate verification token" };
  }
}

export async function deleteDomain(id: string) {
  try {
    const domain = await db.query.domains.findFirst({
      where: eq(domainsTable.id, id)
    });

    if (!domain) {
      return { error: "Domain not found" };
    }

    // Check if domain has any websites
    const websites = await db.query.websites.findMany({
      where: eq(websitesTable.domainId, id)
    });

    if (websites.length > 0) {
      return { error: "Cannot delete domain with active websites" };
    }

    await db.delete(domainsTable)
      .where(eq(domainsTable.id, id));

    revalidatePath("/admin/domains");
    return { success: true };
  } catch (error) {
    console.error("Error deleting domain:", error);
    return { error: "Failed to delete domain" };
  }
} 