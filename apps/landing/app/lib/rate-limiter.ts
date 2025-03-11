/**
 * Simple in-memory rate limiter
 * In a production environment, you would use Redis or another distributed cache
 */
export class RateLimiter {
  private cache: Map<string, { count: number; timestamp: number }>;
  
  constructor() {
    this.cache = new Map();
    
    // Clean up expired entries every hour
    if (typeof window === 'undefined') {
      setInterval(() => this.cleanup(), 60 * 60 * 1000);
    }
  }
  
  /**
   * Check if a request is rate limited
   * @param ip The IP address or identifier
   * @param action The action being rate limited
   * @param limit The maximum number of requests allowed
   * @param windowSeconds The time window in seconds
   * @returns True if rate limited, false otherwise
   */
  async isRateLimited(
    ip: string,
    action: string,
    limit: number,
    windowSeconds: number
  ): Promise<boolean> {
    const key = `${ip}:${action}`;
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    
    // Get current entry or create a new one
    const entry = this.cache.get(key) || { count: 0, timestamp: now };
    
    // Reset if window has expired
    if (now - entry.timestamp > windowMs) {
      entry.count = 1;
      entry.timestamp = now;
    } else {
      entry.count++;
    }
    
    // Update cache
    this.cache.set(key, entry);
    
    // Check if limit exceeded
    return entry.count > limit;
  }
  
  /**
   * Clean up expired entries
   */
  private cleanup() {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      // Remove entries older than 24 hours
      if (now - entry.timestamp > 24 * 60 * 60 * 1000) {
        this.cache.delete(key);
      }
    }
  }
} 