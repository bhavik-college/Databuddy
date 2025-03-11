import { NextRequest, NextResponse } from 'next/server';

// In-memory store for rate limiting (in production, use Redis or similar)
const rateLimit = new Map<string, { count: number; reset: number }>();

type RateLimitOptions = {
  limit: number;
  window: number; // in seconds
  identifier?: (req: NextRequest) => string;
};

export async function checkRateLimit(
  req: NextRequest,
  options: RateLimitOptions = { limit: 5, window: 60 }
) {
  const { limit, window, identifier } = options;
  
  // Get identifier (IP-like identifier from headers by default, or custom function)
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'anonymous';
  const id = identifier ? identifier(req) : ip;
  
  // Create a unique key for this rate limit
  const key = `rate-limit:${id}`;
  
  // Get current time
  const now = Date.now();
  
  // Set headers for rate limiting info
  const headers = new Headers();
  headers.set('X-RateLimit-Limit', limit.toString());
  
  // If no entry exists or it's expired, create a new one
  if (!rateLimit.has(key) || rateLimit.get(key)!.reset < now) {
    rateLimit.set(key, { 
      count: 1, 
      reset: now + window * 1000 
    });
    headers.set('X-RateLimit-Remaining', (limit - 1).toString());
    return { success: true, headers };
  }
  
  // Get current entry
  const current = rateLimit.get(key)!;
  
  // If under limit, increment
  if (current.count < limit) {
    rateLimit.set(key, { 
      count: current.count + 1, 
      reset: current.reset 
    });
    headers.set('X-RateLimit-Remaining', (limit - current.count - 1).toString());
    return { success: true, headers };
  }
  
  // Calculate time until reset
  const timeUntilReset = Math.ceil((current.reset - now) / 1000);
  headers.set('X-RateLimit-Remaining', '0');
  headers.set('X-RateLimit-Reset', timeUntilReset.toString());
  
  // Rate limit exceeded
  return { 
    success: false, 
    headers,
    message: 'Rate limit exceeded. Please try again later.'
  };
}

// Helper function to create a rate-limited response
export function rateLimitResponse(result: { success: boolean, headers: Headers, message?: string }) {
  if (!result.success) {
    return NextResponse.json(
      { error: result.message || 'Too many requests' },
      { status: 429, headers: result.headers }
    );
  }
  
  return null; // Continue with the request
} 