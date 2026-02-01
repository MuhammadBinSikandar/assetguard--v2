/**
 * Simple In-Memory Rate Limiter
 * 
 * Uses a sliding window counter algorithm for efficient rate limiting.
 * Suitable for single-server deployments and development.
 * 
 * For production with multiple servers, consider using Redis or a distributed cache.
 */

// In-memory store for rate limiting
interface RateLimitEntry {
  count: number;
  resetAt: number;
  lockedUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration
const RATE_LIMIT_ENABLED = process.env.RATE_LIMIT_ENABLED !== 'false'; // Enabled by default

/**
 * Rate limit configuration for different endpoints
 */
export const RATE_LIMIT_CONFIGS = {
  login: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    lockoutDuration: 60 * 60 * 1000, // 1 hour lockout after exceeding
  },
  register: {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
    lockoutDuration: 0,
  },
  verifyOtp: {
    maxRequests: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
    lockoutDuration: 30 * 60 * 1000, // 30 minutes lockout
  },
  resend_otp: {
    maxRequests: 3,
    windowMs: 15 * 60 * 1000, // 15 minutes
    lockoutDuration: 30 * 60 * 1000, // 30 minutes lockout
  },
  forgotPassword: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    lockoutDuration: 0,
  },
  resetPassword: {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
    lockoutDuration: 0,
  },
  refresh: {
    maxRequests: 100,
    windowMs: 60 * 60 * 1000, // 1 hour
    lockoutDuration: 0,
  },
  default: {
    maxRequests: 100,
    windowMs: 60 * 60 * 1000, // 1 hour
    lockoutDuration: 0,
  },
};

export type RateLimitType = keyof typeof RATE_LIMIT_CONFIGS;

/**
 * Get client IP from request headers
 */
function getClientIP(request: Request): string {
  // Cloudflare
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp;

  // Standard proxy headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;

  return 'unknown';
}

/**
 * Generate rate limit key
 */
function getRateLimitKey(identifier: string, type: RateLimitType): string {
  return `${type}:${identifier}`;
}

/**
 * Clean up expired entries periodically
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now && (!entry.lockedUntil || entry.lockedUntil < now)) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}

/**
 * Check rate limit for a request
 */
export async function checkRateLimit(
  request: Request,
  type: RateLimitType = 'default',
  identifier?: string
): Promise<{
  success: boolean;
  remaining: number;
  resetAt: number;
  lockedUntil?: number;
}> {
  if (!RATE_LIMIT_ENABLED) {
    return {
      success: true,
      remaining: 999,
      resetAt: Date.now() + 60000,
    };
  }

  const config = RATE_LIMIT_CONFIGS[type] || RATE_LIMIT_CONFIGS.default;
  const clientIdentifier = identifier || getClientIP(request);
  const key = getRateLimitKey(clientIdentifier, type);
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  // Check if currently locked
  if (entry?.lockedUntil && entry.lockedUntil > now) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
      lockedUntil: entry.lockedUntil,
    };
  }

  // Create new entry or reset if window expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + config.windowMs,
    };
  }

  // Increment counter
  entry.count += 1;

  // Check if limit exceeded
  if (entry.count > config.maxRequests) {
    if (config.lockoutDuration > 0) {
      entry.lockedUntil = now + config.lockoutDuration;
    }
    rateLimitStore.set(key, entry);

    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
      lockedUntil: entry.lockedUntil,
    };
  }

  rateLimitStore.set(key, entry);

  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Reset rate limit for an identifier
 */
export async function resetRateLimit(
  identifier: string,
  type: RateLimitType = 'default'
): Promise<void> {
  const key = getRateLimitKey(identifier, type);
  rateLimitStore.delete(key);
}

/**
 * Get rate limit info without incrementing
 */
export async function getRateLimitInfo(
  identifier: string,
  type: RateLimitType = 'default'
): Promise<{
  count: number;
  remaining: number;
  resetAt: number;
  lockedUntil?: number;
}> {
  const config = RATE_LIMIT_CONFIGS[type] || RATE_LIMIT_CONFIGS.default;
  const key = getRateLimitKey(identifier, type);
  const now = Date.now();

  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    return {
      count: 0,
      remaining: config.maxRequests,
      resetAt: now + config.windowMs,
    };
  }

  return {
    count: entry.count,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetAt: entry.resetAt,
    lockedUntil: entry.lockedUntil,
  };
}
