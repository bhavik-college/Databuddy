import { db } from "@databuddy/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { LRUCache } from "lru-cache";

// Define schema for validation
const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please provide a valid email address"),
  company: z.string().optional(),
  website: z.string().url("Please provide a valid URL").optional().or(z.literal("")),
  monthlyVisitors: z.number(),
  message: z.string().min(10, "Message must be at least 10 characters").max(1000),
  source: z.string().optional(),
});

// Define proper types for cache values
type IPCacheValue = {
  count: number;
  lastSubmission: number;
};

// Configure cache with proper typing
const ipCache = new LRUCache<string, IPCacheValue>({
  max: 1000,
  ttl: 1000 * 60 * 60 * 24, // 24 hours
});

// Rate limit configuration
const MAX_SUBMISSIONS_PER_IP = 5;
const RATE_LIMIT_WINDOW = 1000 * 60 * 60 * 24; // 24 hours
const COOLDOWN_PERIOD = 1000 * 60 * 5; // 5 minutes between submissions

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Consider restricting this in production
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Structured logging helper
function logEvent(type: string, data: Record<string, any>) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    type,
    ...data
  }));
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  
  try {
    // Log request received
    logEvent("contact_request_received", { 
      requestId,
      method: request.method,
      url: request.url,
      userAgent: request.headers.get("user-agent") || "unknown"
    });

    // Check request method
    if (request.method !== "POST") {
      logEvent("method_not_allowed", { requestId, method: request.method });
      return NextResponse.json(
        { error: "Method not allowed" },
        { status: 405, headers: corsHeaders }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      logEvent("invalid_json", { requestId, error: (e as Error).message });
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate request body against schema
    const validation = contactSchema.safeParse(body);
    if (!validation.success) {
      logEvent("validation_failed", { 
        requestId, 
        errors: validation.error.format() 
      });
      return NextResponse.json(
        { 
          error: "Missing email", 
          details: validation.error.format() 
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const { name, email, company, website, monthlyVisitors, message, source } = validation.data;
    
    // Get IP address with fallbacks
    const IP = 
      request.headers.get("x-forwarded-for")?.split(",")[0] || // Get first IP if multiple are provided
      request.headers.get("x-real-ip") || 
      request.headers.get("x-client-ip") || 
      "unknown";

    // Validate IP
    if (IP === "unknown") {
      logEvent("ip_validation_failed", { requestId });
      return NextResponse.json(
        { error: "Could not determine client IP address" }, 
        { status: 400, headers: corsHeaders }
      );
    }

    // Check rate limiting
    const ipData = ipCache.get(IP);
    const now = Date.now();
    
    if (ipData) {
      // Check if on cooldown
      if (now - ipData.lastSubmission < COOLDOWN_PERIOD) {
        const secondsToWait = Math.ceil((COOLDOWN_PERIOD - (now - ipData.lastSubmission)) / 1000);
        
        logEvent("cooldown_period", { 
          requestId, 
          ip: IP.slice(0, 3) + "***", // Log partial IP for privacy
          secondsToWait
        });
        
        return NextResponse.json(
          { 
            error: `Please wait ${secondsToWait} seconds before submitting another message` 
          }, 
          { 
            status: 429, 
            headers: {
              ...corsHeaders,
              "Retry-After": String(secondsToWait)
            }
          }
        );
      }
      
      // Check total submissions
      if (ipData.count >= MAX_SUBMISSIONS_PER_IP) {
        logEvent("rate_limit_exceeded", { 
          requestId, 
          ip: IP.slice(0, 3) + "***", // Log partial IP for privacy
          count: ipData.count 
        });
        
        return NextResponse.json(
          { 
            error: `Maximum ${MAX_SUBMISSIONS_PER_IP} contact submissions per day` 
          }, 
          { 
            status: 429, 
            headers: {
              ...corsHeaders,
              "Retry-After": String(Math.ceil(RATE_LIMIT_WINDOW / 1000)) // Seconds until reset
            }
          }
        );
      }
    }
    
    // Create new contact record
    await db.contact.create({
      data: {
        name,
        email,
        company,
        website: website || null,
        monthlyVisitors,
        message,
      },
    });

    // Update rate limiting cache
    ipCache.set(IP, {
      count: (ipData?.count || 0) + 1,
      lastSubmission: now
    });

    // Set security headers
    const securityHeaders = {
      ...corsHeaders,
      "Content-Security-Policy": "default-src 'self'",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    };

    // Log successful submission
    logEvent("contact_submission_success", { 
      requestId, 
      email: email.slice(0, 3) + "***", // Log partial email for privacy
      name: name.slice(0, 1) + "***", // Log partial name for privacy
      source,
      processingTimeMs: Date.now() - startTime
    });

    return NextResponse.json(
      { 
        success: true, 
        message: "Your message has been received. We'll get back to you shortly.",
        submissionsRemaining: MAX_SUBMISSIONS_PER_IP - ((ipData?.count || 0) + 1)
      }, 
      { status: 200, headers: securityHeaders }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Log error details
    logEvent("contact_submission_error", { 
      requestId, 
      error: errorMessage,
      stack: errorStack,
      processingTimeMs: Date.now() - startTime
    });
    
    console.error("Contact form submission error:", error);
    
    return NextResponse.json(
      { error: "An unexpected error occurred while processing your request" }, 
      { status: 500, headers: corsHeaders }
    );
  } finally {
    // Log request completion
    logEvent("request_completed", { 
      requestId,
      processingTimeMs: Date.now() - startTime
    });
  }
} 