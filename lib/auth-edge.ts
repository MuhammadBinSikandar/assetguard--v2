/**
 * Edge-compatible authentication utilities
 * Uses jose library which works in Edge Runtime
 */
import { jwtVerify } from 'jose/jwt/verify';
import type { DecodedAccessToken } from '@/db/drizzle/models';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_PRIVATE_KEY || 'development-access-secret-change-in-production';

/**
 * Verify and decode an access token (Edge Runtime compatible)
 * @param token - JWT access token
 * @returns Decoded token payload or null if invalid
 */
export async function verifyAccessTokenEdge(token: string): Promise<DecodedAccessToken | null> {
  try {
    const secret = new TextEncoder().encode(JWT_ACCESS_SECRET);
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'], // Prevent algorithm confusion attacks
    });

    return payload as unknown as DecodedAccessToken;
  } catch (error) {
    console.error('Access token verification failed:', error);
    return null;
  }
}
