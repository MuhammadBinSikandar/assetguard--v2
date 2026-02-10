# Debug Logger Documentation

This project includes a comprehensive debugging and logging system to track authentication, routing, and user actions throughout the application.

## Overview

The debug logging system consists of:

1. **Server-side Logger** (`lib/debug-logger.ts`) - Tracks middleware, authentication, API calls, and sessions
2. **Client-side Logger Hook** (`hooks/useClientLogger.ts`) - Tracks UI interactions, navigation, and client-side auth checks
3. **Integrated Logging** - Added to middleware, auth endpoints, and admin pages

## Enabling Debug Logging

### Server-side Logging

Add to your `.env` file:

```env
DEBUG_AUTH=true
```

Alternatively, logging is automatically enabled in development mode (`NODE_ENV=development`).

### Client-side Logging

Add to your `.env.local` file:

```env
NEXT_PUBLIC_DEBUG_AUTH=true
```

## What Gets Logged

### Middleware Logs

- **Request Processing**: Every request that goes through middleware
- **Token Verification**: Success/failure of JWT token verification
- **Route Analysis**: Whether routes are protected, public, or require specific roles
- **Role Checks**: User roles vs required roles for a route
- **Email Verification**: Whether email verification is required and if user passes
- **Redirects**: All middleware-triggered redirects with reasons

### Authentication Logs

- **Login Attempts**: Email and IP address
- **Login Success/Failure**: User details, roles, and reasons for failure
- **Token Creation**: Access and refresh token generation
- **Token Refresh**: Token refresh attempts
- **OTP Events**: OTP sending and verification
- **Logout Events**: User logout actions

### API Logs

- **API Requests**: Method, endpoint, and user ID
- **API Responses**: Status codes and success/failure
- **API Errors**: Error messages and context

### Client-side Logs

- **Page Navigation**: Page changes and routes
- **Auth Checks**: Client-side authentication verification
- **Role Checks**: Client-side role verification
- **Redirects**: Client-side routing changes
- **Component Lifecycle**: Component mounts and props
- **User Actions**: User interactions and form submissions

### Session Logs

- **Session Creation**: New sessions with IDs
- **Session Validation**: Session checks
- **Session Revocation**: When and why sessions are revoked

## Using the Logger in Your Code

### Server-side (API Routes, Server Components)

```typescript
import { authLogger, apiLogger, middlewareLogger } from '@/lib/debug-logger';

// In API routes
export async function POST(request: NextRequest) {
  apiLogger.request('POST', '/api/example', userId);
  
  try {
    // Your logic here
    authLogger.loginSuccess(userId, email, roles, emailVerified, ip);
    apiLogger.response('POST', '/api/example', 200, true);
  } catch (error) {
    apiLogger.error('POST', '/api/example', error.message);
  }
}
```

### Client-side (React Components)

```typescript
'use client';

import { useClientLogger } from '@/hooks/useClientLogger';

export default function MyComponent() {
  const logger = useClientLogger();
  
  useEffect(() => {
    logger.logComponentMount('MyComponent', { someProp });
  }, []);
  
  const handleLogin = async () => {
    logger.logAuthAction('login_attempt', true);
    // Your login logic
  };
  
  return <div>...</div>;
}
```

### Standalone Client Logger

```typescript
import { clientLogger } from '@/hooks/useClientLogger';

// Anywhere in client code
clientLogger.info('AUTH', 'User logged in', { userId, email });
clientLogger.warn('VALIDATION', 'Invalid form data', { errors });
clientLogger.error('API', 'Request failed', { endpoint, error });
```

## Log Output Format

### Console Output

Logs are color-coded in the console:

- 🔵 **DEBUG** (Cyan): Detailed information for debugging
- 🟢 **INFO** (Green): Normal successful operations
- 🟡 **WARN** (Yellow): Warning conditions (failed auth, missing permissions)
- 🔴 **ERROR** (Red): Error conditions

### Example Log Entry

```
[INFO] [MIDDLEWARE] [2024-02-11T10:30:45.123Z] Request allowed
  Data: {
    pathname: '/admin',
    userId: 'user_123',
    roles: ['admin', 'user']
  }
```

## Debugging Common Issues

### Issue: Admin Redirect Loop

**What to check in logs:**

1. Look for middleware logs showing the request to `/admin`
2. Check token verification - does it show a valid user?
3. Check role verification - does the user have 'admin' role?
4. Look for any redirects being triggered

**Example debug flow:**

```
[INFO] [MIDDLEWARE] Processing request
  pathname: /admin
  hasToken: true

[INFO] [TOKEN] Token verification succeeded
  userId: user_123
  email: admin@example.com
  roles: ['admin', 'user']
  emailVerified: true

[DEBUG] [ROUTING] Route analysis
  pathname: /admin
  isProtected: true
  routeConfig: { roles: ['admin'], requireEmailVerified: true }

[INFO] [ROLE_CHECK] Role verification passed
  userRoles: ['admin', 'user']
  requiredRoles: ['admin']
  hasAccess: true

[INFO] [MIDDLEWARE] Request allowed
  pathname: /admin
  userId: user_123
```

### Issue: User Not Authenticated After Login

**What to check:**

1. Login API logs - was login successful?
2. Check if tokens were created
3. Verify cookies are being set
4. Check client-side auth validation

### Issue: Email Verification Redirect

**Look for:**

```
[WARN] [ROUTING] Redirect triggered: Email not verified
  from: /admin
  to: /verify-email
```

## Database Audit Logs

Critical authentication events are also persisted to the database in the `AuditLog` table:

- Login attempts (success/failure)
- Password changes
- Account locks
- Session revocations
- Admin actions

Query audit logs:

```typescript
import { getUserAuditLogs } from '@/lib/logger';

const logs = await getUserAuditLogs(userId, 50);
```

## Performance Considerations

- Debug logging adds minimal overhead in production (only ERROR logs are shown)
- Most logs are console-only and don't persist to database
- Critical events (login, logout, security events) are persisted to database
- Background operations (audit logs) are fire-and-forget to avoid blocking requests

## Disabling Logs

To completely disable debug logging:

```env
DEBUG_AUTH=false
NEXT_PUBLIC_DEBUG_AUTH=false
NODE_ENV=production
```

## Troubleshooting the Logger

If logs aren't appearing:

1. Check environment variables are set correctly
2. Verify you're in development mode OR DEBUG_AUTH=true
3. Check browser console (client logs) or terminal (server logs)
4. Ensure imports are correct

## Best Practices

1. **Use appropriate log levels**:
   - DEBUG: Detailed info for development
   - INFO: Normal operations, successful actions
   - WARN: Recoverable issues, failed validations
   - ERROR: Actual errors that need attention

2. **Include context**: Always provide relevant data with logs
3. **Don't log sensitive data**: Never log passwords, tokens, or PII
4. **Use categories**: Helps filter and search logs later

## Examples

### Debugging Admin Access Issue

1. Enable debug logging
2. Attempt to access `/admin`
3. Check console/terminal for:
   - Token verification result
   - User roles
   - Role check pass/fail
   - Any redirects
4. Check client logs for:
   - Auth check on admin page
   - API calls to `/api/auth/me`
   - Any client-side redirects

This should give you a complete picture of why access is being denied or redirects are happening.

