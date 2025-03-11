import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { LRUCache } from "lru-cache";

// Define schema for validation
const requestSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  source: z.string().optional(),
  referrer: z.string().optional(),
});

// Define proper types for cache values
type EmailCacheValue = boolean;
type IPCacheValue = number;

// Configure caches with proper typing
const emailCache = new LRUCache<string, EmailCacheValue>({
  max: 1000,
  ttl: 1000 * 60 * 60 * 24, // 24 hours
});

const ipCache = new LRUCache<string, IPCacheValue>({
  max: 1000,
  ttl: 1000 * 60 * 60 * 24, // 24 hours
});

// Rate limit configuration
const MAX_EMAILS_PER_IP = 5;
const RATE_LIMIT_WINDOW = 1000 * 60 * 60 * 24; // 24 hours

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
    // logEvent("request_received", { 
    //   requestId,
    //   method: request.method,
    //   url: request.url,
    //   userAgent: request.headers.get("user-agent") || "unknown"
    // });

    // Check request method
    if (request.method !== "POST") {
      // logEvent("method_not_allowed", { requestId, method: request.method });
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
      // logEvent("invalid_json", { requestId, error: (e as Error).message });
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate request body against schema
    const validation = requestSchema.safeParse(body);
    if (!validation.success) {
      // logEvent("validation_failed", { 
      //   requestId, 
      //   errors: validation.error.format() 
      // });
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: validation.error.format() 
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const { email, source, referrer } = validation.data;
    
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

    // Check if email already exists in cache
    if (emailCache.has(email)) {
      // logEvent("email_already_submitted", { 
      //   requestId, 
      //   email: email.slice(0, 3) + "***" // Log partial email for privacy
      // });
      return NextResponse.json(
        { error: "This email has already been submitted" }, 
        { status: 409, headers: corsHeaders }
      );
    }

    // Check rate limiting
    const ipSubmissionCount = ipCache.get(IP) || 0;
    if (ipSubmissionCount >= MAX_EMAILS_PER_IP) {
      logEvent("rate_limit_exceeded", { 
        requestId, 
        ip: IP.slice(0, 3) + "***", // Log partial IP for privacy
        count: ipSubmissionCount 
      });
      return NextResponse.json(
        { 
          error: `Rate limit exceeded. Maximum ${MAX_EMAILS_PER_IP} submissions per IP address within ${RATE_LIMIT_WINDOW / (1000 * 60 * 60)} hours` 
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
    
    // Check if email exists in database
    const existingUser = await db.email.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Add to cache to prevent future DB lookups
      emailCache.set(email, true);
      
      // logEvent("email_already_registered", { 
      //   requestId, 
      //   email: email.slice(0, 3) + "***" // Log partial email for privacy
      // });
      
      return NextResponse.json(
        { error: "This email has already been registered" }, 
        { status: 409, headers: corsHeaders }
      );
    }   
    
    // Create new email record
    await db.email.create({
      data: {
        email,
        ipAddress: IP,
        createdAt: new Date(),
      },
    });

    // Update caches
    emailCache.set(email, true);
    ipCache.set(IP, ipSubmissionCount + 1);

    // Set security headers
    const securityHeaders = {
      ...corsHeaders,
      "Content-Security-Policy": "default-src 'self'",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    };

    // Log successful registration
    // logEvent("registration_success", { 
    //   requestId, 
    //   email: email.slice(0, 3) + "***", // Log partial email for privacy
    //   source,
    //   processingTimeMs: Date.now() - startTime
    // });

    return NextResponse.json(
      { 
        success: true, 
        message: "Email submitted successfully",
        submissionsRemaining: MAX_EMAILS_PER_IP - (ipSubmissionCount + 1)
      }, 
      { status: 200, headers: securityHeaders }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Log error details
    // logEvent("registration_error", { 
    //   requestId, 
    //   error: errorMessage,
    //   stack: errorStack,
    //   processingTimeMs: Date.now() - startTime
    // });
    
    console.error("Early access registration error:", error);
    
    return NextResponse.json(
      { error: "An unexpected error occurred while processing your request" }, 
      { status: 500, headers: corsHeaders }
    );
  } finally {
    // Log request completion
    // logEvent("request_completed", { 
    //   requestId,
    //   processingTimeMs: Date.now() - startTime
    // });
  }
}

