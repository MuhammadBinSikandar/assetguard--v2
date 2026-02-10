# 🎯 Debug Logging System - Implementation Summary

## ✅ Changes Made

### 1. Updated Debug Logger for File-Based Logging

**File:** `lib/debug-logger.ts`

**Changes:**
- ✅ Logs now written to files in `logs/` directory (API routes and server components only)
- ✅ Separate log files for different categories:
  - `combined.log` - All logs
  - `auth.log` - Authentication and tokens
  - `middleware.log` - Routing and permissions
  - `api.log` - API requests/responses
  - `errors.log` - Errors only
- ✅ Automatic log rotation when files reach 10MB
- ✅ Auto-cleanup of logs older than 7 days
- ✅ Optional console output controlled by `DEBUG_CONSOLE` env variable

**File:** `lib/debug-logger-edge.ts` *(NEW)*

**Changes:**
- ✅ Edge Runtime compatible logger for middleware
- ✅ Console-only logging (Edge Runtime doesn't support file system)
- ✅ Same logging API as full logger
- ⚠️ **Note:** Middleware logs go to console only due to Edge Runtime limitations

### 2. Updated Client Logger

**File:** `hooks/useClientLogger.ts`

**Changes:**
- ✅ Client logs stored in browser sessionStorage
- ✅ Downloadable as JSON file via `downloadClientLogs()` function
- ✅ Optional browser console output controlled by `NEXT_PUBLIC_DEBUG_CONSOLE`
- ✅ Exposed helper functions: `downloadClientLogs()`, `clearClientLogs()`

### 3. Docker Configuration

**File:** `docker-compose.yml`

**Changes:**
- ✅ Added volume mount for `./logs:/app/logs`
- ✅ Added volume mount for `./uploads:/app/uploads`
- ✅ Added environment variables for debug logging:
  - `DEBUG_AUTH`
  - `DEBUG_MODE`
  - `NEXT_PUBLIC_DEBUG_AUTH`

### 4. Environment Configuration

**File:** `.env`

**Changes:**
- ✅ Added `DEBUG_AUTH=true` (file-based logging)
- ✅ Added `DEBUG_CONSOLE=false` (no terminal clutter)

**File:** `.env.local`

**Changes:**
- ✅ Added `NEXT_PUBLIC_DEBUG_AUTH=true` (sessionStorage logging)
- ✅ Added `NEXT_PUBLIC_DEBUG_CONSOLE=false` (no console clutter)

### 5. Git Ignore

**File:** `.gitignore`

**Changes:**
- ✅ Added `/logs` directory to ignore
- ✅ Added `*.log` files to ignore
- ✅ Added `/uploads` directory to ignore

### 6. Documentation

**Created:**
- ✅ `logs/README.md` - Complete guide for viewing and analyzing logs
- ✅ `view-logs.ps1` - PowerShell script for easy log viewing
- ✅ Updated `DEBUG_QUICKSTART.md` with Docker-specific instructions

## 🚀 How to Use

### Start the Application

```powershell
# Build and start
docker compose build
docker compose up

# Or in detached mode
docker compose up -d
```

### View Logs

**Method 1: Using the PowerShell Script**

```powershell
# View combined logs
.\view-logs.ps1

# View auth logs
.\view-logs.ps1 auth

# Follow logs in real-time
.\view-logs.ps1 combined -Follow

# View errors
.\view-logs.ps1 errors

# Search for text
.\view-logs.ps1 -Search -Pattern "admin@assetguard.io"

# Show all available log files
.\view-logs.ps1 all
```

**Method 2: Direct File Access**

```powershell
# View in real-time
Get-Content logs\combined.log -Wait -Tail 50

# View specific log
Get-Content logs\auth.log -Tail 100

# Search
Select-String -Path logs\*.log -Pattern "error"
```

**Method 3: Inside Docker Container**

```powershell
# View logs
docker compose exec app tail -f /app/logs/combined.log

# Search logs
docker compose exec app grep "admin" /app/logs/auth.log

# View errors
docker compose exec app tail -n 50 /app/logs/errors.log
```

### Download Client Logs

1. Open browser DevTools (F12)
2. Go to Console
3. Run: `downloadClientLogs()`
4. A JSON file will be downloaded

### Check Auth Status

```powershell
docker compose exec app npx tsx scripts/check-auth.ts admin@assetguard.io
```

## 📊 Log Structure

### Server Logs (File Format)

```
[TIMESTAMP] [LEVEL] [CATEGORY] Message {JSON data}
```

Example:
```
[2024-02-11T10:30:45.123Z] [INFO] [AUTH] Login successful {"userId":"user_123","roles":["admin"]}
```

### Client Logs (JSON Format)

```json
{
  "timestamp": "2024-02-11T10:30:45.123Z",
  "level": "CLIENT-INFO",
  "category": "AUTH",
  "message": "Login form submitted",
  "data": {"email": "admin@assetguard.io"},
  "pathname": "/login"
}
```

## 🔍 Debugging the Admin Redirect Issue

### Step 1: Check User Status

```powershell
docker compose exec app npx tsx scripts/check-auth.ts admin@assetguard.io
```

Look for:
- ✅ Roles include "admin"
- ✅ Email verified = true
- ✅ Can Access Admin = YES

### Step 2: Watch Logs During Login

```powershell
# Terminal 1: Auth logs
.\view-logs.ps1 auth -Follow

# Terminal 2: Middleware logs
.\view-logs.ps1 middleware -Follow
```

Then login and try to access `/admin`.

### Step 3: Analyze the Flow

Look for these patterns in logs:

**✅ Success Pattern:**
```
[INFO] [AUTH] Login successful
[INFO] [TOKEN] Token created (access)
[INFO] [MIDDLEWARE] Processing request /admin
[INFO] [TOKEN] Token verification succeeded
[INFO] [ROLE_CHECK] Role verification passed
[INFO] [MIDDLEWARE] Request allowed
```

**❌ Problem Patterns:**

**Token Issue:**
```
[WARN] [TOKEN] Token verification failed
```
→ Check cookies in browser DevTools

**Role Issue:**
```
[WARN] [ROLE_CHECK] Role verification FAILED
```
→ Run create-admin script

**Email Verification:**
```
[WARN] [ROUTING] Redirect triggered: Email not verified
```
→ Check emailVerified status

**OTP Redirect:**
```
[CLIENT-WARN] [REDIRECT] to /auth/verify-otp
```
→ Check if 2FA is enabled

### Step 4: Search for Issues

```powershell
# Find errors
.\view-logs.ps1 errors

# Search for your email
.\view-logs.ps1 -Search -Pattern "admin@assetguard.io"

# Check redirects
docker compose exec app grep "Redirect triggered" /app/logs/middleware.log

# Check role failures
docker compose exec app grep "Role verification FAILED" /app/logs/middleware.log
```

## 🛠️ Troubleshooting

### Multer Package Error Fixed

The `multer` package is already in `package.json`. If you still see the error:

```powershell
# Rebuild Docker image
docker compose build --no-cache

# Or force reinstall
docker compose exec app npm install
```

### Logs Not Being Created

```powershell
# Check if directory exists
docker compose exec app ls -la /app/logs

# Check environment variables
docker compose exec app env | grep DEBUG

# Check Docker volumes
docker compose config
```

### Large Log Files

Logs rotate automatically at 10MB, but to manually clean:

```powershell
# Remove old rotated logs
Remove-Item logs\*_*.log

# Or inside Docker
docker compose exec app sh -c "rm -f /app/logs/*_*.log"
```

## ⚙️ Configuration Options

### Enable Console Output

If you want to see logs in terminal/console as well:

**`.env`:**
```env
DEBUG_CONSOLE=true
```

**`.env.local`:**
```env
NEXT_PUBLIC_DEBUG_CONSOLE=true
```

Then restart: `docker compose restart`

### Disable File Logging

To disable file logging (not recommended):

```env
DEBUG_AUTH=false
DEBUG_MODE=false
```

## 📁 Files Created/Modified

### Created:
- ✅ `logs/README.md` - Log files documentation
- ✅ `view-logs.ps1` - PowerShell log viewer script
- ✅ `IMPLEMENTATION_SUMMARY.md` - This file

### Modified:
- ✅ `lib/debug-logger.ts` - File-based logging
- ✅ `hooks/useClientLogger.ts` - SessionStorage logging
- ✅ `docker-compose.yml` - Added volumes and env vars
- ✅ `.env` - Added debug flags
- ✅ `.env.local` - Added client debug flags
- ✅ `.gitignore` - Ignore logs and uploads
- ✅ `DEBUG_QUICKSTART.md` - Updated for Docker

## 🎉 Benefits

1. **No Terminal Clutter** - Logs written to files by default
2. **Organized** - Separate files for different log types
3. **Searchable** - Easy to search through log files
4. **Persistent** - Logs survive container restarts
5. **Downloadable** - Client logs can be downloaded as JSON
6. **Automatic Rotation** - Prevents disk space issues
7. **Docker-Friendly** - Works seamlessly with Docker Compose
8. **Optional Console** - Can enable console output if needed

## 🚀 Next Steps

1. **Rebuild and start Docker:**
   ```powershell
   docker compose down
   docker compose build
   docker compose up -d
   ```

2. **Check auth status:**
   ```powershell
   docker compose exec app npx tsx scripts/check-auth.ts admin@assetguard.io
   ```

3. **Watch logs:**
   ```powershell
   .\view-logs.ps1 combined -Follow
   ```

4. **Test login and admin access**

5. **Review logs for issues:**
   ```powershell
   .\view-logs.ps1 errors
   .\view-logs.ps1 -Search -Pattern "your-email@example.com"
   ```

---

**All logging is now file-based and Docker-ready!** 🎯
