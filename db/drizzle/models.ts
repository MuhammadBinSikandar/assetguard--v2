/**
 * Drizzle Type-Safe Models
 * These provide additional type safety for raw SQL queries and serve as a contract
 * Kept separate from Prisma for flexibility in SQL operations
 */

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string | null;
  roles: string[];
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret: string | null;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefreshToken {
  id: string;
  userId: string;
  hashedToken: string;
  jti: string;
  device: string | null;
  ip: string | null;
  userAgent: string | null;
  revoked: boolean;
  revokedAt: Date | null;
  revokedReason: string | null;
  createdAt: Date;
  expiresAt: Date;
  replacedById: string | null;
}

export interface EmailVerificationToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  consumed: boolean;
  consumedAt: Date | null;
}

export interface PasswordResetToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  consumed: boolean;
  consumedAt: Date | null;
  ip: string | null;
  userAgent: string | null;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  details: string | null;
  ip: string | null;
  userAgent: string | null;
  success: boolean;
  createdAt: Date;
}

// Type helpers for common operations
export type CreateUser = Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'emailVerified' | 'twoFactorEnabled' | 'failedLoginAttempts' | 'lockedUntil' | 'twoFactorSecret'>;
export type UpdateUser = Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>;
export type UserPublic = Omit<User, 'passwordHash' | 'twoFactorSecret'>;

export type CreateRefreshToken = Omit<RefreshToken, 'id' | 'createdAt' | 'revoked' | 'revokedAt' | 'revokedReason' | 'replacedById'>;
export type SessionInfo = Pick<RefreshToken, 'id' | 'device' | 'ip' | 'createdAt' | 'expiresAt'> & {
  current: boolean;
};

// Helper types for auth operations
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

export interface DecodedAccessToken {
  userId: string;
  email: string;
  roles: string[];
  emailVerified?: boolean;
  iat: number;
  exp: number;
  jti: string;
}

export interface DecodedRefreshToken {
  userId: string;
  jti: string;
  iat: number;
  exp: number;
}
