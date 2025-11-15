# AssetGuard Advanced Authentication System

## 🔐 Production-Ready Auth for Next.js 15+

A comprehensive, secure authentication system built with Next.js 15, TypeScript, Prisma, PostgreSQL, JWT, and includes:

- ✅ **JWT with Refresh Token Rotation** - Short-lived access tokens + long-lived refresh tokens with automatic rotation
- ✅ **Reuse Detection** - Security mechanism that revokes all sessions if token reuse is detected
- ✅ **Role-Based Access Control (RBAC)** - Admin, User, Buyer, Seller roles with middleware protection
- ✅ **Email Verification** - Secure email verification with time-limited tokens
- ✅ **Password Reset** - Secure password reset flow with single-use tokens
- ✅ **Rate Limiting** - Protect against brute force attacks with configurable limits
- ✅ **Session Management** - List and revoke active sessions
- ✅ **CSRF Protection** - Double-submit cookie pattern
- ✅ **Audit Logging** - Complete audit trail of authentication events
- ✅ **HTTP-Only Secure Cookies** - Tokens stored in secure, http-only cookies
- ✅ **Account Lockout** - Automatic lockout after failed login attempts
- ✅ **Redux + Zustand** - Global user state (Redux) + session UI state (Zustand)

---

## 📋 Table of Contents

1. [Architecture](#architecture)
2. [Setup & Installation](#setup--installation)
3. [Environment Variables](#environment-variables)
4. [Database Setup](#database-setup)
5. [Running the Project](#running-the-project)
6. [API Endpoints](#api-endpoints)
7. [Frontend Integration](#frontend-integration)
8. [Security Features](#security-features)
9. [Testing](#testing)
10. [Deployment](#deployment)
11. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture

### Tech Stack

- **Framework**: Next.js 15.2.4 (App Router)
- **Language**: TypeScript 5
- **Database**: PostgreSQL (Neon DB)
- **ORM**: Prisma 6
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **State Management**: Redux Toolkit + Zustand
- **Email**: Resend, SendGrid, or Nodemailer (with mock fallback)

### Folder Structure

```
/app
  /api/auth
    /register         - User registration endpoint
    /login            - Login with token generation
    /refresh          - Token rotation with reuse detection
    /logout           - Session termination
    /verify-email     - Email verification
    /forgot-password  - Password reset request
    /reset-password   - Password reset completion
    /me               - Get current user
    /sessions         - List/revoke sessions
  /login             - Login page
  /register          - Registration page
  /dashboard         - Protected dashboard
  /admin             - Admin-only page
  /forgot-password   - Password reset request page
  /reset-password    - Password reset page
  /verify-email      - Email verification page

/db
  /drizzle          - Type-safe models
  prismaClient.ts   - Prisma singleton

/lib
  auth.ts           - JWT, cookies, token helpers
  bcrypt.ts         - Password hashing
  email.ts          - Email abstraction layer
  csrf.ts           - CSRF protection
  rateLimit.ts      - Rate limiting
  logger.ts         - Audit logging

/middleware.ts      - Route protection & RBAC

/prisma
  schema.prisma     - Database schema

/store
  /redux
    store.ts        - Redux store configuration
    userSlice.ts    - User state management
    Provider.tsx    - Redux provider component
  /zustand
    useSessionStore.ts - Session state management

/hooks
  useAuth.ts        - Client auth hook
```

---

## 🚀 Setup & Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL database (Neon DB recommended)

### Installation Steps

1. **Clone the repository**

```bash
git clone <your-repo-url>
cd assetguard--v2
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your actual values (see [Environment Variables](#environment-variables) section).

4. **Generate Prisma Client**

```bash
npm run prisma:generate
```

5. **Run database migrations**

```bash
npm run prisma:migrate
```

Or for production:

```bash
npm run prisma:migrate:prod
```

Or push schema without migration history:

```bash
npm run prisma:push
```

---

## 🔑 Environment Variables

### Required Variables

```env
# Database
DATABASE_URL="postgresql://..."

# JWT (use strong random strings or generate RSA keys)
JWT_ACCESS_PRIVATE_KEY="your-access-secret-key"
JWT_REFRESH_PRIVATE_KEY="your-refresh-secret-key"
JWT_ALG="HS256"  # or RS256 with proper RSA keys

# Token Expiration
ACCESS_TOKEN_EXP="15m"
REFRESH_TOKEN_EXP="30d"

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Optional Variables

```env
# Email Provider (mock | resend | sendgrid | nodemailer)
EMAIL_PROVIDER="mock"
EMAIL_FROM="noreply@yourdomain.com"
RESEND_API_KEY="re_..."
SENDGRID_API_KEY="SG..."

# Security
BCRYPT_SALT_ROUNDS="12"
CSRF_SECRET="random-secret"
RATE_LIMIT_ENABLED="true"
AUDIT_LOG_ENABLED="true"

# Session
MAX_SESSIONS_PER_USER="5"
```

### Generating JWT Keys (Production)

For **HS256** (symmetric):
- Use strong random strings (32+ characters)
- Keep secrets private and rotate regularly

For **RS256** (asymmetric, recommended):

```bash
# Generate private key
openssl genrsa -out private.pem 2048

# Extract public key
openssl rsa -in private.pem -pubout -out public.pem

# Convert to base64 for .env
cat private.pem | base64 -w 0
```

---

## 🗄️ Database Setup

### Prisma Schema

The schema includes:

- **User** - User accounts with roles, email verification, 2FA support
- **RefreshToken** - Refresh token records with rotation tracking
- **EmailVerificationToken** - Email verification tokens
- **PasswordResetToken** - Password reset tokens
- **AuditLog** - Security audit trail

### Running Migrations

Development:
```bash
npm run prisma:migrate
```

Production:
```bash
npm run prisma:migrate:prod
```

### Viewing Database

```bash
npm run prisma:studio
```

Opens Prisma Studio at `http://localhost:5555`

---

## 💻 Running the Project

### Development

```bash
npm run dev
```

Access at `http://localhost:3000`

### Production

```bash
npm run build
npm run start
```

---

## 🔌 API Endpoints

All endpoints return JSON in format:
```json
{
  "success": boolean,
  "message": string,
  "data"?: object
}
```

### POST `/api/auth/register`

Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ss123",
  "name": "John Doe",
  "role": "buyer"  // optional: buyer, seller
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account.",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "emailVerified": false
    }
  }
}
```

### POST `/api/auth/login`

Login and receive tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ss123",
  "rememberMe": true  // optional
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "roles": ["user", "buyer"],
      "emailVerified": true
    },
    "accessTokenExpiresAt": "2025-01-15T12:30:00.000Z",
    "csrfToken": "..."
  }
}
```

Cookies set:
- `access_token` - Short-lived access token
- `refresh_token` - Long-lived refresh token

### POST `/api/auth/refresh`

Rotate tokens (automatic refresh).

**Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "user": { ... },
    "accessTokenExpiresAt": "2025-01-15T12:45:00.000Z"
  }
}
```

**Security Feature:** If a previously-used refresh token is presented (reuse detection), all user sessions are immediately revoked.

### POST `/api/auth/logout`

Logout and revoke current session.

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### GET `/api/auth/me`

Get current user profile.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "roles": ["user", "buyer"],
      "emailVerified": true
    }
  }
}
```

### GET `/api/auth/sessions`

List all active sessions.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "uuid",
        "device": "Chrome on MacOS",
        "ip": "192.168.1.1",
        "createdAt": "2025-01-15T10:00:00.000Z",
        "expiresAt": "2025-02-14T10:00:00.000Z",
        "current": true
      }
    ],
    "total": 1
  }
}
```

### DELETE `/api/auth/sessions?id=<session-id>`

Revoke a specific session.

**DELETE `/api/auth/sessions?id=all`** - Revoke all other sessions except current.

---

## 🎨 Frontend Integration

### Using the useAuth Hook

```tsx
'use client';

import { useAuth } from '@/hooks/useAuth';

export default function MyComponent() {
  const { user, isAuthenticated, login, logout, loading } = useAuth();

  const handleLogin = async () => {
    try {
      await login({
        email: 'user@example.com',
        password: 'password123'
      });
      // Redirect or show success
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {isAuthenticated ? (
        <>
          <p>Welcome, {user?.name}!</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

### Protected Pages

```tsx
'use client';

import { useRequireAuth } from '@/hooks/useAuth';

export default function AdminPage() {
  const { user, loading } = useRequireAuth(['admin']);

  if (loading) return <div>Loading...</div>;

  return <div>Admin Dashboard for {user?.email}</div>;
}
```

### Server-Side Protection (Middleware)

Routes are automatically protected via `middleware.ts`:

- `/admin` - Requires `admin` role
- `/dashboard` - Requires authenticated user
- `/register/property` - Requires `seller` role

---

## 🛡️ Security Features

### 1. Refresh Token Rotation with Reuse Detection

**How it works:**
1. On `/api/auth/login`, both access and refresh tokens are created
2. Refresh token is hashed and stored in DB with unique JTI
3. When `/api/auth/refresh` is called:
   - Old refresh token is verified
   - New access and refresh tokens are generated
   - Old token is marked as `revoked` with `replacedById` pointing to new token
4. **Reuse Detection:** If an already-rotated token is used again:
   - System detects `replacedById` is not null
   - All user sessions are immediately revoked
   - Security alert email is sent

**Example scenario:**
1. User logs in → Gets Token A
2. Token A is refreshed → Gets Token B, Token A marked as replaced
3. Attacker tries to use Token A → System detects reuse, revokes all tokens

### 2. Password Requirements

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

### 3. Rate Limiting

Configured per endpoint:
- Login: 5 attempts per 15 minutes
- Register: 3 attempts per hour
- Password reset: 3 attempts per hour

### 4. Account Lockout

After 5 failed login attempts:
- Account locked for 15 minutes
- After 10 attempts: 1 hour
- After 15+ attempts: 24 hours

### 5. CSRF Protection

Double-submit cookie pattern:
- CSRF token set in cookie (readable by client)
- Client must send token in `X-CSRF-Token` header
- Server validates both match

### 6. Audit Logging

All security events logged:
- Login attempts (success/failure)
- Token refreshes
- Password resets
- Session revocations
- Account lockouts

---

## 🧪 Testing

### Manual Testing

1. **Register a new user**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#","name":"Test User"}'
```

2. **Login**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}' \
  -c cookies.txt
```

3. **Access protected endpoint**
```bash
curl http://localhost:3000/api/auth/me \
  -b cookies.txt
```

### Unit Tests (TODO)

Create tests in `/tests/unit/`:

```typescript
// tests/unit/tokenRotation.test.ts
describe('Token Rotation', () => {
  it('should rotate tokens successfully', async () => {
    // Test implementation
  });

  it('should detect token reuse', async () => {
    // Test reuse detection
  });
});
```

Run tests:
```bash
npm test
```

---

## 🚀 Deployment

### Vercel Deployment

1. **Push to GitHub**

```bash
git push origin main
```

2. **Connect to Vercel**

- Import project in Vercel dashboard
- Add environment variables
- Deploy

3. **Important Vercel Settings**

Environment Variables:
- Add all variables from `.env`
- Set `NODE_ENV=production`
- Set `COOKIE_SECURE=true`
- Set `COOKIE_DOMAIN=.yourdomain.com` (with leading dot for subdomains)

4. **Post-Deployment**

Run migrations:
```bash
npx prisma migrate deploy
```

### Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t assetguard .
docker run -p 3000:3000 --env-file .env assetguard
```

---

## 🔧 Troubleshooting

### Issue: Prisma client not generated

**Solution:**
```bash
npm run prisma:generate
```

### Issue: Migration fails

**Solution:**
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or push schema without migrations
npm run prisma:push
```

### Issue: 403 Forbidden on Prisma binary download

**Solution:**
```bash
# Skip checksum validation
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npm run prisma:generate
```

### Issue: Cookies not working in development

**Solution:**
- Ensure you're accessing via `localhost` (not `127.0.0.1`)
- Check `COOKIE_DOMAIN=localhost` in `.env`
- For cross-origin: set `COOKIE_SAME_SITE=lax` or `none` (less secure)

### Issue: Email verification emails not sending

**Solution:**
- Check `EMAIL_PROVIDER` setting
- For development, use `EMAIL_PROVIDER=mock` and check console logs
- Check `/tmp/mock-emails/` for saved mock emails

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

## 📝 License

MIT License

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## ⚠️ Security Notice

**Production Checklist:**

- [ ] Use RS256 with proper RSA key pairs (not HS256 with secrets)
- [ ] Enable HTTPS (`COOKIE_SECURE=true`)
- [ ] Set strong `CSRF_SECRET` and `ENCRYPTION_KEY`
- [ ] Configure real email provider (not mock)
- [ ] Enable audit logging (`AUDIT_LOG_ENABLED=true`)
- [ ] Set proper `COOKIE_DOMAIN` for your domain
- [ ] Review and adjust rate limits
- [ ] Set up database backups
- [ ] Enable Two-Factor Authentication (optional feature)
- [ ] Regular security audits

---

**Built with 🔐 by AssetGuard Team**
