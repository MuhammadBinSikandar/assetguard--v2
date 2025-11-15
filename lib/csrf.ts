import crypto from 'crypto';
import { cookies } from 'next/headers';

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_SECRET = process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production';

/**
 * Generate a CSRF token
 * @returns CSRF token string
 */
export function generateCSRFToken(): string {
  return crypto
    .createHash('sha256')
    .update(`${CSRF_SECRET}-${Date.now()}-${crypto.randomBytes(16).toString('hex')}`)
    .digest('hex');
}

/**
 * Set CSRF token in cookie
 * @param token - CSRF token to set
 */
export async function setCSRFCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Client needs to read this for header
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

/**
 * Get CSRF token from cookie
 * @returns CSRF token or null
 */
export async function getCSRFTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const csrfCookie = cookieStore.get(CSRF_COOKIE_NAME);
  return csrfCookie?.value || null;
}

/**
 * Validate CSRF token from request
 * @param request - Request object
 * @returns True if valid, false otherwise
 */
export async function validateCSRFToken(request: Request): Promise<boolean> {
  // Skip CSRF for GET, HEAD, OPTIONS
  const method = request.method;
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return true;
  }

  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  const cookieToken = await getCSRFTokenFromCookie();

  if (!headerToken || !cookieToken) {
    return false;
  }

  // Double-submit cookie pattern: header and cookie must match
  return headerToken === cookieToken;
}

/**
 * Generate and set CSRF token
 * Call this when user logs in or starts a session
 * @returns The generated CSRF token
 */
export async function initializeCSRF(): Promise<string> {
  const token = generateCSRFToken();
  await setCSRFCookie(token);
  return token;
}

/**
 * Clear CSRF token
 */
export async function clearCSRFToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CSRF_COOKIE_NAME);
}
