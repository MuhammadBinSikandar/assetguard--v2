# 🔍 Debug Logging System - Quick Start Guide

## What Was Created

I've implemented a comprehensive logging system to help debug authentication and routing issues in your AssetGuard application:

### 1. Server-Side Logger (`lib/debug-logger.ts`)
- Tracks middleware decisions
- Logs authentication attempts and results
- Records token creation and verification
- Monitors role checks and permissions
- Tracks API requests and responses

### 2. Client-Side Logger (`hooks/useClientLogger.ts`)
- Logs page navigation
- Tracks UI component lifecycle
- Records client-side auth checks
- Monitors API calls from the browser
- Logs user interactions

### 3. Enhanced Admin Page (`app/admin/page.tsx`)
- Added auth verification on mount
- Logs all auth checks and API calls
- Shows loading state during verification
- Redirects with detailed logging if not admin

### 4. Instrumented Files
- `middleware.ts` - Full middleware logging
- `app/api/auth/login/route.ts` - Login flow tracking
- `app/api/auth/me/route.ts` - User profile checks
- `app/admin/page.tsx` - Admin access verification

### 5. Diagnostic Tools
- `scripts/check-auth.ts` - Command-line auth status checker
- `docs/DEBUG_LOGGER.md` - Complete documentation

## 🚀 How to Use

### Step 1: Enable Debug Logging

Debug logging is already enabled in your `.env` and `.env.local` files:

```env
# Server-side (in .env)
DEBUG_AUTH=true
DEBUG_CONSOLE=false  # Set to true to also see logs in terminal

# Client-side (in .env.local)
NEXT_PUBLIC_DEBUG_AUTH=true
NEXT_PUBLIC_DEBUG_CONSOLE=false  # Set to true to also see logs in browser console
```

**Note:** With `DEBUG_CONSOLE=false`, logs are written to files only, reducing terminal clutter.

### Step 2: Restart Your Docker Container

```powershell
# Rebuild and restart
docker compose down
docker compose build
docker compose up

# Or just restart
docker compose restart
```

### Step 3: View Logs in Real-Time

**Middleware logs** (routing, role checks) appear in Docker container logs:

```powershell
# View middleware logs (routing decisions)
docker compose logs -f app

# Filter for middleware only
docker compose logs app | Select-String "MIDDLEWARE|ROUTING|ROLE_CHECK"

# Filter for specific route
docker compose logs app | Select-String "/admin"
```

**API and authentication logs** are written to `logs/` directory:

```powershell
# View all logs in real-time
docker compose exec app tail -f /app/logs/combined.log

# View auth-specific logs (login, tokens, etc)
docker compose exec app tail -f /app/logs/auth.log

# View API logs
docker compose exec app tail -f /app/logs/api.log

# View errors only
docker compose exec app tail -f /app/logs/errors.log
```

**Or on your host machine (Windows PowerShell):**

```powershell
# View logs in real-time
Get-Content logs\combined.log -Wait -Tail 50

# View auth logs
Get-Content logs\auth.log -Tail 100

# Search for specific text
Select-String -Path logs\*.log -Pattern "admin@assetguard.io"
```

**⚠️ Important:** Middleware logs only appear in Docker container logs (not files) due to Edge Runtime limitations.

### Step 4: Check Your Auth Status

Run this command to verify your admin account:

```powershell
docker compose exec app npx tsx scripts/check-auth.ts admin@assetguard.io
```

This will show:
- ✅ Email verification status
- ✅ Roles and permissions
- ✅ Whether you can access admin panel
- ✅ Active sessions
- ✅ Recent activity

### Step 5: Test Admin Access

1. **Start watching logs:**
   ```powershell
   # Terminal 1: Watch middleware logs (routing decisions)
   docker compose logs -f app
   
   # Terminal 2: Watch auth logs (login, tokens)
   docker compose exec app tail -f /app/logs/auth.log
   
   # Terminal 3: Watch API logs
   docker compose exec app tail -f /app/logs/api.log
   ```

2. **Open Browser and access the application**
3. **Login** with your admin credentials
4. **Try to access** `/admin`
5. **Check the logs** for detailed flow

**Tip:** Use `grep` or `Select-String` to filter logs:
```powershell
# Filter Docker logs for middleware routing
docker compose logs app | Select-String "MIDDLEWARE|/admin"

# Filter file logs for your email
docker compose exec app grep "admin@assetguard.io" /app/logs/combined.log
```

You'll now see detailed logs:

**Middleware Logs (Docker container logs via `docker compose logs -f app`):**
```
app-1  | [2024-02-11T10:30:46.123Z] [INFO] [MIDDLEWARE] Processing request {"pathname":"/admin","hasToken":true}
app-1  | [2024-02-11T10:30:46.234Z] [INFO] [TOKEN] Token verification succeeded {"userId":"user_123","roles":["admin","user"]}
app-1  | [2024-02-11T10:30:46.345Z] [INFO] [ROLE_CHECK] Role verification passed {"userRoles":["admin","user"],"requiredRoles":["admin"],"hasAccess":true}
app-1  | [2024-02-11T10:30:46.456Z] [INFO] [MIDDLEWARE] Request allowed {"pathname":"/admin","userId":"user_123"}
```

**API/Auth Logs (File logs via `tail -f /app/logs/auth.log`):**
```
[2024-02-11T10:30:45.123Z] [INFO] [AUTH] Login attempt {"email":"admin@assetguard.io","ip":"172.18.0.1"}
[2024-02-11T10:30:45.456Z] [INFO] [AUTH] Login successful {"userId":"user_123","email":"admin@assetguard.io","roles":["admin","user"],"emailVerified":true}
[2024-02-11T10:30:45.789Z] [INFO] [TOKEN] Token created {"userId":"user_123","tokenType":"access"}
```

**Client Logs (Browser sessionStorage - download via console):**

Open browser console (F12) and run:
```javascript
downloadClientLogs()
```

This downloads a JSON file with entries like:
```json
{
  "timestamp": "2024-02-11T10:30:45.123Z",
  "level": "CLIENT-INFO",
  "category": "AUTH",
  "message": "Login form submitted",
  "data": { "email": "admin@assetguard.io" },
  "pathname": "/login"
}
```

## 🔧 Debugging Your Specific Issue

Based on your problem: **"Logged in as admin, redirected to normal dashboard, manually accessing /admin goes to verify-otp page"**

### Look for these in logs:

#### 1. Token Verification Issue?

```powershell
# Check if token is being created (file logs)
docker compose exec app grep "Token created" /app/logs/auth.log

# Check if token verification fails (Docker logs)
docker compose logs app | Select-String "Token verification failed"
```

**Solution:** Check if access_token cookie is being set correctly

#### 2. Role Check Failing?

```powershell
# Check role verification (Docker logs for middleware)
docker compose logs app | Select-String "Role verification"

# Look for FAILED role checks
docker compose logs app | Select-String "Role verification FAILED"
```

**Solution:** Run `docker compose exec app npx tsx scripts/create-admin.ts <email>` to add admin role

#### 3. Email Not Verified?

```powershell
# Check for email verification redirects (Docker logs)
docker compose logs app | Select-String "Email not verified"

# Check redirect patterns
docker compose logs app | Select-String "Redirect triggered"
```

**Solution:** The create-admin script auto-verifies email, but check with check-auth.ts

#### 4. Two-Factor Authentication Issue?

```powershell
# Check for OTP-related redirects in Docker logs
docker compose logs app | Select-String "verify-otp"

# Also check client logs (download from browser)
```

**Solution:** Check if 2FA is enabled but not completed

### View All Logs for a Specific User:

```powershell
# View all activity for a specific email in file logs
docker compose exec app grep "admin@assetguard.io" /app/logs/combined.log | tail -n 50

# View just auth events
docker compose exec app grep "admin@assetguard.io" /app/logs/auth.log

# View middleware decisions in Docker logs
docker compose logs app | Select-String "admin@assetguard.io"
```

## 📊 Understanding the Logs

### Log Levels
- 🔵 **DEBUG** - Detailed debugging info
- 🟢 **INFO** - Normal operations
- 🟡 **WARN** - Issues detected
- 🔴 **ERROR** - Critical errors

### Log Locations

**Middleware Logs** (Edge Runtime - Console Only):
- **Location:** Docker container logs
- **View:** `docker compose logs -f app`
- **Categories:** MIDDLEWARE, ROUTING, ROLE_CHECK, TOKEN verification
- ⚠️ NOT written to files due to Edge Runtime limitations

**API/Server Logs** (Node.js Runtime - File-Based):
- **Location:** `logs/` directory
- **Files:**
  - `combined.log` - All API and server logs
  - `auth.log` - Authentication, login, tokens
  - `api.log` - API requests and responses
  - `errors.log` - Errors only
- **Categories:** AUTH, TOKEN creation, API, SESSION

### Log Format
```
[TIMESTAMP] [LEVEL] [CATEGORY] Message {JSON data}
```

### Useful Commands

**View middleware logs (Docker logs):**
```powershell
docker compose logs -f app
docker compose logs app | Select-String "MIDDLEWARE"
docker compose logs app | Select-String "/admin"
```

**View API/auth logs (file logs):**
```powershell
docker compose exec app tail -f /app/logs/combined.log
docker compose exec app tail -f /app/logs/auth.log
```

**Search for specific text:**
```powershell
# Search Docker logs
docker compose logs app | Select-String "admin@assetguard.io"

# Search file logs
docker compose exec app grep "admin@assetguard.io" /app/logs/auth.log
```

**On Windows host (file logs only):**
```powershell
Get-Content logs\combined.log -Wait -Tail 50
Select-String -Path logs\*.log -Pattern "admin"
```

## 🎯 Common Issues and Solutions

### Issue 1: "User has admin role but still redirected"

**Check:**
```powershell
npx tsx scripts/check-auth.ts your-admin@email.com
```

Look for:
- Is Admin: ✅ YES
- Email Verified: ✅ YES
- All Roles: Should include "admin"

**Fix if needed:**
```powershell
npx tsx scripts/create-admin.ts your-admin@email.com
```

### Issue 2: "Goes to verify-otp instead of admin panel"

**Check logs for:**
```
[CLIENT-WARN] [REDIRECT] to /auth/verify-otp
```

**Possible causes:**
1. Two-factor authentication is enabled but not completed
2. Email verification pending
3. Session state mismatch

**Fix:**
Check user record in database for `twoFactorEnabled` field

### Issue 3: "Token verification fails"

**Check logs for:**
```
[WARN] [TOKEN] Token verification failed
```

**Possible causes:**
1. access_token cookie not set
2. JWT secret mismatch
3. Token expired

**Fix:**
1. Check cookies in browser DevTools (Application → Cookies)
2. Verify JWT_ACCESS_PRIVATE_KEY in .env
3. Try logging out and back in

## 📝 Example Debug Session

Here's what a successful admin access looks like:

**1. Auth/Login Flow** (`logs/auth.log` - file logs):
```
[2024-02-11T10:30:45.123Z] [INFO] [AUTH] Login attempt {"email":"admin@assetguard.io"}
[2024-02-11T10:30:45.456Z] [INFO] [AUTH] Login successful {"userId":"user_123","roles":["admin","user","kyc_verified"],"emailVerified":true}
[2024-02-11T10:30:45.789Z] [INFO] [TOKEN] Token created {"userId":"user_123","tokenType":"access"}
[2024-02-11T10:30:45.890Z] [INFO] [TOKEN] Token created {"userId":"user_123","tokenType":"refresh"}
```

**2. Middleware Routing** (Docker container logs - `docker compose logs app`):
```
app-1  | [2024-02-11T10:30:46.123Z] [INFO] [MIDDLEWARE] Processing request {"pathname":"/admin","hasToken":true}
app-1  | [2024-02-11T10:30:46.234Z] [INFO] [TOKEN] Token verification succeeded {"userId":"user_123","roles":["admin","user"]}
app-1  | [2024-02-11T10:30:46.345Z] [DEBUG] [ROUTING] Route analysis {"pathname":"/admin","isProtected":true}
app-1  | [2024-02-11T10:30:46.456Z] [INFO] [ROLE_CHECK] Role verification passed {"hasAccess":true}
app-1  | [2024-02-11T10:30:46.567Z] [DEBUG] [AUTH] Email verification check {"emailVerified":true,"isAdmin":true}
app-1  | [2024-02-11T10:30:46.678Z] [INFO] [MIDDLEWARE] Request allowed {"pathname":"/admin","userId":"user_123"}
```

**3. Client Logs** (browser sessionStorage - download with `downloadClientLogs()`):
```json
[
  {
    "timestamp": "2024-02-11T10:30:45.123Z",
    "level": "CLIENT-INFO",
    "category": "AUTH",
    "message": "Login form submitted"
  },
  {
    "timestamp": "2024-02-11T10:30:46.789Z",
    "level": "CLIENT-INFO",
    "category": "REDIRECT",
    "message": "Admin detected, redirecting to /admin"
  },
  {
    "timestamp": "2024-02-11T10:30:47.123Z",
    "level": "CLIENT-INFO",
    "category": "COMPONENT",
    "message": "AdminPanel mounted"
  }
]
```

## 🚨 Next Steps for Your Issue

1. **Restart Docker container** with debug enabled:
   ```powershell
   docker compose restart
   ```

2. **Run the auth check script** to verify your admin status:
   ```powershell
   docker compose exec app npx tsx scripts/check-auth.ts admin@assetguard.io
   ```

3. **Start watching logs in real-time:**
   ```powershell
   # Terminal 1: Middleware logs (routing, role checks)
   docker compose logs -f app
   
   # Terminal 2: Auth logs (login, tokens)
   docker compose exec app tail -f /app/logs/auth.log
   
   # Terminal 3: API logs
   docker compose exec app tail -f /app/logs/api.log
   ```

4. **Login and navigate to /admin** in your browser

5. **Check the logs** for any WARN or ERROR entries:
   ```powershell
   # Check Docker logs for middleware errors
   docker compose logs app | Select-String "WARN|ERROR"
   
   # Check file logs for API/auth errors
   docker compose exec app tail -n 100 /app/logs/errors.log
   docker compose exec app grep "WARN\|ERROR" /app/logs/combined.log | tail -n 20
   ```

6. **Download client logs** from browser:
   - Open DevTools (F12)
   - Go to Console
   - Run: `downloadClientLogs()`
   - Open the downloaded JSON file

7. **Share the relevant log entries** if you need further assistance

## 📚 Additional Resources

- **Full documentation:** [docs/DEBUG_LOGGER.md](docs/DEBUG_LOGGER.md)
- **Log files guide:** [logs/README.md](logs/README.md)
- **Auth system docs:** [README_AUTH_SYSTEM.md](README_AUTH_SYSTEM.md)
- **Create admin:** `docker compose exec app npx tsx scripts/create-admin.ts <email>`
- **Check auth:** `docker compose exec app npx tsx scripts/check-auth.ts <email>`

## 💡 Tips

1. **Middleware logs are in Docker logs** (`docker compose logs -f app`), not files
2. **API/auth logs are in files** (`logs/auth.log`, `logs/api.log`)
3. **Use Docker logs** to debug routing and role check issues
4. **Use file logs** to debug authentication and API issues
5. **Download client logs** for UI-related problems
6. **Search both Docker and file logs** for your email to track complete flows
7. **Check errors.log first** when debugging issues
8. **Enable console output** by setting `DEBUG_CONSOLE=true` in .env if needed

## 🎯 Quick Debugging Commands

```powershell
# Check if multer is installed
docker compose exec app npm list multer

# View middleware logs (routing, permissions)
docker compose logs -f app
docker compose logs app | Select-String "MIDDLEWARE|ROLE_CHECK"

# View auth logs (login, tokens)
docker compose exec app tail -f /app/logs/auth.log

# View all logs for your email
docker compose logs app | Select-String "your-email@example.com"
docker compose exec app grep "your-email@example.com" /app/logs/combined.log

# View recent errors
docker compose logs app | Select-String "ERROR"
docker compose exec app tail -n 50 /app/logs/errors.log

# Check environment variables
docker compose exec app env | grep DEBUG

# Restart after changes
docker compose restart

# View Docker logs (includes middleware)
docker compose logs -f app

# Rebuild if needed
docker compose build --no-cache
```

---

**The logging system now works with Edge Runtime! Middleware logs appear in Docker logs, API logs in files.** 🎉
