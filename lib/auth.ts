import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import ms from 'ms';
import { cookies } from 'next/headers';
import type { DecodedAccessToken, DecodedRefreshToken } from '@/db/drizzle/models';

// Environment variables with defaults
const JWT_ALG = 'HS256' as const;
const ACCESS_TOKEN_EXP = process.env.ACCESS_TOKEN_EXP || '1h';
const REFRESH_TOKEN_EXP = process.env.REFRESH_TOKEN_EXP || '30d';
const REFRESH_TOKEN_EXP_REMEMBER = process.env.REFRESH_TOKEN_EXP_REMEMBER || '30d';
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || 'localhost';
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production';
const COOKIE_SAME_SITE = (process.env.COOKIE_SAME_SITE || 'strict') as 'strict' | 'lax' | 'none';

// For development, we'll use a secret key approach
// In production, use RS256 with proper private/public key pairs
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_PRIVATE_KEY || 'development-access-secret-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_PRIVATE_KEY || 'development-refresh-secret-change-in-production';

/**
 * Cookie configuration for secure, HTTP-only cookies
 */
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: COOKIE_SECURE,
  sameSite: COOKIE_SAME_SITE,
  domain: COOKIE_DOMAIN !== 'localhost' ? COOKIE_DOMAIN : undefined,
  path: '/',
} as const;

export const REFRESH_COOKIE_NAME = 'refresh_token';
export const ACCESS_COOKIE_NAME = 'access_token';

/**
 * Generate a cryptographically secure random token
 * @param bytes - Number of bytes (default: 64)
 * @returns Hex string token
 */
export function generateSecureToken(bytes: number = 64): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Generate JWT ID (jti) for token tracking
 * @returns UUID v4 string
 */
export function generateJTI(): string {
  return crypto.randomUUID();
}

/**
 * Create an access token (short-lived)
 * @param payload - User data to encode
 * @returns Signed JWT access token
 */
export function createAccessToken(payload: {
  userId: string;
  email: string;
  roles: string[];
  emailVerified?: boolean;
}): { token: string; expiresAt: Date; jti: string } {
  const jti = generateJTI();
  const expiresIn = ACCESS_TOKEN_EXP;

  const token = jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      roles: payload.roles,
      emailVerified: payload.emailVerified ?? false,
      jti,
    },
    JWT_ACCESS_SECRET,
    {
      expiresIn,
    } as jwt.SignOptions
  );

  // @ts-ignore - ms() accepts string and returns number
  const expiresInMs: number = typeof expiresIn === 'string' ? ms(expiresIn) : expiresIn;
  const expiresAt = new Date(Date.now() + expiresInMs);

  return { token, expiresAt, jti };
}

/**
 * Create a refresh token (long-lived)
 * Returns both the raw token (for cookie) and JTI (for DB tracking)
 * @param userId - User ID
 * @param rememberMe - If true, use extended expiration
 * @returns Token data
 */
export function createRefreshToken(userId: string, rememberMe: boolean = false): {
  token: string;
  jti: string;
  expiresAt: Date;
} {
  const jti = generateJTI();
  const expiresIn = rememberMe ? REFRESH_TOKEN_EXP_REMEMBER : REFRESH_TOKEN_EXP;

  const token = jwt.sign(
    {
      userId,
      jti,
    },
    JWT_REFRESH_SECRET,
    {
      expiresIn,
    } as jwt.SignOptions
  );

  // @ts-ignore - ms() accepts string and returns number
  const expiresInMs: number = typeof expiresIn === 'string' ? ms(expiresIn) : expiresIn;
  const expiresAt = new Date(Date.now() + expiresInMs);

  return { token, jti, expiresAt };
}

/**
 * Verify and decode an access token
 * @param token - JWT access token
 * @returns Decoded token payload or null if invalid
 */
export function verifyAccessToken(token: string): DecodedAccessToken | null {
  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET, {
      algorithms: [JWT_ALG],
    }) as DecodedAccessToken;

    return decoded;
  } catch (error) {
    console.error('Access token verification failed:', error);
    return null;
  }
}

/**
 * Verify and decode a refresh token
 * @param token - JWT refresh token
 * @returns Decoded token payload or null if invalid
 */
export function verifyRefreshToken(token: string): DecodedRefreshToken | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      algorithms: [JWT_ALG],
    }) as DecodedRefreshToken;

    return decoded;
  } catch (error) {
    console.error('Refresh token verification failed:', error);
    return null;
  }
}

/**
 * Get access token from cookies
 * @returns Access token string or null
 */
export async function getAccessTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE_NAME);
  return accessToken?.value || null;
}

/**
 * Get refresh token from cookies
 * @returns Refresh token string or null
 */
export async function getRefreshTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME);
  return refreshToken?.value || null;
}

/**
 * Set access token cookie
 * @param token - Access token
 * @param expiresAt - Expiration date
 */
export async function setAccessTokenCookie(
  token: string,
  expiresAt: Date
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_COOKIE_NAME, token, {
    ...COOKIE_OPTIONS,
    expires: expiresAt,
  });
}

/**
 * Set refresh token cookie
 * @param token - Refresh token
 * @param expiresAt - Expiration date
 */
export async function setRefreshTokenCookie(
  token: string,
  expiresAt: Date
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(REFRESH_COOKIE_NAME, token, {
    ...COOKIE_OPTIONS,
    expires: expiresAt,
  });
}

/**
 * Clear all auth cookies
 */
export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_COOKIE_NAME);
  cookieStore.delete(REFRESH_COOKIE_NAME);
}

/**
 * Get user from access token in cookies
 * Server-side helper for protected routes
 * @returns Decoded user data or null
 */
export async function getUserFromAccessToken(): Promise<DecodedAccessToken | null> {
  const token = await getAccessTokenFromCookies();
  if (!token) return null;
  return verifyAccessToken(token);
}

/**
 * Extract device fingerprint from request
 * @param request - Request object with headers
 * @returns Device info object
 */
export function getDeviceInfo(request: Request): {
  ip: string | null;
  userAgent: string | null;
  device: string | null;
} {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0] || realIp || null;

  const userAgent = request.headers.get('user-agent') || null;

  // Simple device fingerprint (can be enhanced)
  const device = userAgent ? `${userAgent.substring(0, 50)}` : null;

  return { ip, userAgent, device };
}

/**
 * Generate email verification token
 * @returns Token object with raw token and hash
 */
export function generateEmailVerificationToken(): {
  rawToken: string;
  expiresAt: Date;
} {
  const rawToken = generateSecureToken(32);
  const expiresAt = new Date(Date.now() + ms('24h')); // 24 hours

  return { rawToken, expiresAt };
}

/**
 * Generate 6-digit OTP code
 * @returns OTP object with code and expiration
 */
export function generateOTP(): {
  otpCode: string;
  expiresAt: Date;
} {
  // Generate a cryptographically secure 6-digit OTP using crypto.randomInt
  const otpNumber = crypto.randomInt(0, 1_000_000);
  const otpCode = otpNumber.toString().padStart(6, '0');
  const expiresAt = new Date(Date.now() + ms('10m' as ms.StringValue)); // 10 minutes

  return { otpCode, expiresAt };
}

/**
 * Generate password reset token
 * @returns Token object with raw token and hash
 */
export function generatePasswordResetToken(): {
  rawToken: string;
  expiresAt: Date;
} {
  const rawToken = generateSecureToken(32);
  const expiresAt = new Date(Date.now() + ms('1h')); // 1 hour

  return { rawToken, expiresAt };
}

/**
 * Validate email format
 * @param email - Email to validate
 * @returns True if valid email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if user account is locked
 * @param lockedUntil - Lock expiration date
 * @returns True if account is locked
 */
export function isAccountLocked(lockedUntil: Date | null): boolean {
  if (!lockedUntil) return false;
  return new Date() < lockedUntil;
}

/**
 * Calculate lockout duration based on failed attempts
 * @param attempts - Number of failed attempts
 * @returns Lockout duration in milliseconds
 */
export function calculateLockoutDuration(attempts: number): number {
  // Exponential backoff: 5 attempts = 15 min, 10 attempts = 1 hour, 15+ = 24 hours
  if (attempts >= 15) return ms('24h');
  if (attempts >= 10) return ms('1h');
  if (attempts >= 5) return ms('15m');
  return 0;
}
