/**
 * Rate Limiter using in-memory store
 * For production, consider using Redis for distributed rate limiting
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
  lockedUntil?: number;
}

// In-memory store for rate limiting
// In production, use Redis or similar distributed cache
const rateLimitStore = new Map<string, RateLimitEntry>();

const RATE_LIMIT_ENABLED = process.env.RATE_LIMIT_ENABLED === 'true';
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '5', 10);
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10); // 15 minutes
const LOCKOUT_DURATION = parseInt(
  process.env.RATE_LIMIT_LOCKOUT_DURATION || '3600000',
  10
); // 1 hour

/**
 * Rate limit configuration for different endpoints
 */
export const RATE_LIMIT_CONFIGS = {
  login: {
    maxRequests: MAX_REQUESTS,
    windowMs: WINDOW_MS,
    lockoutDuration: LOCKOUT_DURATION,
  },
  register: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    lockoutDuration: 0, // No lockout for registration
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
 * Get IP address from request
 * @param request - Request object
 * @returns IP address
 */
function getClientIP(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  return forwardedFor?.split(',')[0] || realIp || 'unknown';
}

/**
 * Generate rate limit key
 * @param identifier - IP or user ID
 * @param type - Type of rate limit
 * @returns Rate limit key
 */
function getRateLimitKey(identifier: string, type: RateLimitType): string {
  return `${type}:${identifier}`;
}

/**
 * Clean up expired entries
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
 * @param request - Request object
 * @param type - Type of rate limit
 * @param identifier - Optional custom identifier (defaults to IP)
 * @returns Rate limit result
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
      resetAt: Date.now() + WINDOW_MS,
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
 * Useful for clearing after successful login
 * @param identifier - IP or user ID
 * @param type - Type of rate limit
 */
export function resetRateLimit(
  identifier: string,
  type: RateLimitType = 'default'
): void {
  const key = getRateLimitKey(identifier, type);
  rateLimitStore.delete(key);
}

/**
 * Get rate limit info without incrementing
 * @param identifier - IP or user ID
 * @param type - Type of rate limit
 * @returns Rate limit info
 */
export function getRateLimitInfo(
  identifier: string,
  type: RateLimitType = 'default'
): {
  count: number;
  remaining: number;
  resetAt: number;
  lockedUntil?: number;
} {
  const config = RATE_LIMIT_CONFIGS[type] || RATE_LIMIT_CONFIGS.default;
  const key = getRateLimitKey(identifier, type);
  const entry = rateLimitStore.get(key);
  const now = Date.now();

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
