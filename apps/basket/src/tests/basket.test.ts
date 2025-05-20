import { describe, test, expect } from "bun:test";
import { randomUUID } from "node:crypto";
import { parseReferrer, categorizeReferrer } from "../utils/referrer";

// Types
interface EventResponse {
  status: string;
  message?: string;
  errors?: any[];
  event?: {
    payload: {
      browser_name?: string;
      os_name?: string;
      referrer?: string;
      referrer_type?: string;
      referrer_name?: string;
    };
  };
  processed?: Array<{
    status: string;
    eventName?: string;
    anonymousId?: string;
    error?: string;
  }>;
}

// Helper function to generate random domains
function generateRandomDomain() {
  const tlds = ['.com', '.net', '.org', '.io', '.co', '.app', '.dev'];
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const length = Math.floor(Math.random() * 10) + 3; // 3-12 chars
  const domain = Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const tld = tlds[Math.floor(Math.random() * tlds.length)];
  return domain + tld;
}

// Helper function to generate random subdomains
function generateRandomSubdomain(domain: string) {
  const prefixes = ['www', 'mail', 'blog', 'shop', 'api', 'dev', 'staging', 'test'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  return `${prefix}.${domain}`;
}

// Helper function to generate random search URLs
function generateRandomSearchUrl(domain: string) {
  const searchParams = ['q', 'query', 'search', 'p', 's', 'search_query'];
  const param = searchParams[Math.floor(Math.random() * searchParams.length)];
  const searchTerms = ['test', 'query', 'search', 'find', 'lookup', 'seek'];
  const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  return `https://${domain}/search?${param}=${term}`;
}

describe("Referrer Analysis", () => {
  describe("parseReferrer", () => {
    test("should handle null/undefined referrer", () => {
      expect(parseReferrer(null)).toEqual({
        type: "direct",
        name: "Direct",
        url: "",
        domain: "",
      });
      expect(parseReferrer(undefined)).toEqual({
        type: "direct",
        name: "Direct",
        url: "",
        domain: "",
      });
    });

    test("should handle invalid URLs", () => {
      const invalidUrls = [
        "invalid-url",
        "not-a-url",
        "http://",
        "https://",
        "://example.com",
        "example.com:",
        "example.com:80",
        "example.com:443",
        "example.com:8080",
        "example.com:3000",
      ];

      for (const url of invalidUrls) {
        const result = parseReferrer(url);
        expect(result.type).toBe("unknown");
        expect(result.name).toBe(url);
        expect(result.domain).toBe(url);
      }
    });

    test("should handle URLs without protocol", () => {
      const domains = Array.from({ length: 50 }, generateRandomDomain);
      
      for (const domain of domains) {
        const result = parseReferrer(domain);
        expect(result.domain).toBe(domain);
        expect(result.type).toBe("unknown");
      }
    });

    test("should handle URLs with trailing dots", () => {
      const domains = Array.from({ length: 50 }, generateRandomDomain);
      
      for (const domain of domains) {
        const result = parseReferrer(`${domain}.`);
        expect(result.domain).toBe(domain);
      }
    });

    test("should handle mixed case domains", () => {
      const domains = Array.from({ length: 50 }, generateRandomDomain);
      
      for (const domain of domains) {
        const mixedCase = domain.split('').map((char, i) => 
          i % 2 === 0 ? char.toUpperCase() : char.toLowerCase()
        ).join('');
        const result = parseReferrer(mixedCase);
        expect(result.domain).toBe(domain);
      }
    });

    test("should identify search engines", () => {
      const searchEngines = [
        "https://google.com/search?q=test",
        "https://bing.com/search?query=test",
        "https://duckduckgo.com/?q=test",
        "https://yandex.ru/search?text=test",
        "https://www.baidu.com/s?wd=test",
      ];

      for (const url of searchEngines) {
        const result = parseReferrer(url);
        expect(result.type).toBe("search");
      }
    });

    test("should handle known referrers", () => {
      const knownReferrers = [
        { url: "https://www.facebook.com", type: "social", name: "Facebook" },
        { url: "https://twitter.com", type: "social", name: "Twitter" },
        { url: "https://mail.google.com", type: "email", name: "Gmail" },
        { url: "https://outlook.live.com", type: "email", name: "Outlook.com" },
      ];

      for (const { url, type, name } of knownReferrers) {
        const result = parseReferrer(url);
        expect(result.type).toBe(type);
        expect(result.name).toBe(name);
      }
    });

    test("should handle subdomains correctly", () => {
      const domains = Array.from({ length: 50 }, generateRandomDomain);
      
      for (const domain of domains) {
        const subdomain = generateRandomSubdomain(domain);
        const result = parseReferrer(`https://${subdomain}`);
        expect(result.domain).toBe(domain);
      }
    });

    test("should handle internationalized domain names", () => {
      const idnTests = [
        { url: "https://münchen.de", expected: "xn--mnchen-3ya.de" },
        { url: "https://www.österreich.at", expected: "xn--sterreich-z7a.at" },
        { url: "https://www.über.com", expected: "xn--ber-goa.com" },
        { url: "https://www.ñandú.com", expected: "xn--and-6ma2c.com" },
      ];

      for (const { url, expected } of idnTests) {
        const result = parseReferrer(url);
        expect(result.domain).toBe(expected);
      }
    });

    test("should handle various search parameters", () => {
      const domains = Array.from({ length: 50 }, generateRandomDomain);
      const searchParams = ['q', 'query', 'search', 'p', 's', 'search_query'];
      
      for (const domain of domains) {
        for (const param of searchParams) {
          const url = `https://${domain}/search?${param}=test`;
          const result = parseReferrer(url);
          expect(result.type).toBe("search");
        }
      }
    });

    test("should handle generated edge cases", () => {
      const edgeCases = [
        // Protocol variations
        ...Array.from({ length: 20 }, () => `http://${generateRandomDomain()}`),
        ...Array.from({ length: 20 }, () => `https://${generateRandomDomain()}`),
        ...Array.from({ length: 20 }, () => `ftp://${generateRandomDomain()}`),
        
        // Subdomain variations
        ...Array.from({ length: 20 }, () => `https://${generateRandomSubdomain(generateRandomDomain())}`),
        
        // Search variations
        ...Array.from({ length: 20 }, () => generateRandomSearchUrl(generateRandomDomain())),
        
        // Mixed case variations
        ...Array.from({ length: 20 }, () => {
          const domain = generateRandomDomain();
          return `https://${domain.split('').map((char, i) => 
            i % 2 === 0 ? char.toUpperCase() : char.toLowerCase()
          ).join('')}`;
        }),
        
        // Trailing dot variations
        ...Array.from({ length: 20 }, () => `https://${generateRandomDomain()}.`),
        
        // Port variations
        ...Array.from({ length: 20 }, () => `https://${generateRandomDomain()}:8080`),
        
        // Path variations
        ...Array.from({ length: 20 }, () => `https://${generateRandomDomain()}/path/to/page`),
        
        // Query parameter variations
        ...Array.from({ length: 20 }, () => `https://${generateRandomDomain()}/?param=value`),
      ];

      for (const url of edgeCases) {
        const result = parseReferrer(url);
        expect(result).toHaveProperty('type');
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('url');
        expect(result).toHaveProperty('domain');
      }
    });
  });

  describe("categorizeReferrer", () => {
    test("should categorize known referrer types", () => {
      const categories = [
        { type: "search", expected: "Search Engine" },
        { type: "social", expected: "Social Media" },
        { type: "email", expected: "Email" },
        { type: "ads", expected: "Advertising" },
        { type: "direct", expected: "Direct" },
      ];

      for (const { type, expected } of categories) {
        const result = categorizeReferrer({ type, name: "", url: "", domain: "" });
        expect(result).toBe(expected);
      }
    });

    test("should handle unknown referrer types", () => {
      const unknownTypes = Array.from({ length: 50 }, () => 
        Math.random().toString(36).substring(7)
      );

      for (const type of unknownTypes) {
        const result = categorizeReferrer({ type, name: "", url: "", domain: "" });
        expect(result).toBe("Other");
      }
    });
  });
});  