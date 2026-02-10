# KYC Module Implementation Documentation

**AssetGuard Real Estate Tokenization Platform**  
**Date:** February 10, 2026  
**Version:** 1.0

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Backend Implementation](#backend-implementation)
5. [API Endpoints](#api-endpoints)
6. [File Upload System](#file-upload-system)
7. [Middleware & Guards](#middleware--guards)
8. [Admin Panel](#admin-panel)
9. [Usage Guide](#usage-guide)
10. [Admin Creation](#admin-creation)
11. [Security Considerations](#security-considerations)
12. [Migration & Deployment](#migration--deployment)

---

## Overview

The KYC (Know Your Customer) module enables user identity verification before granting access to platform features (property registration, tokenization, etc.). The implementation follows a **Service-Controller-Route** architecture with strict TypeScript typing and uses **Multer** for local file storage.

### Key Features

- ✅ **Multi-file document upload** (passport, ID, proof of address, etc.)
- ✅ **Admin review workflow** (approve/reject with notes)
- ✅ **Role-based access control** (admin-only review endpoints)
- ✅ **4-state status model** (IDLE → PENDING → APPROVED/REJECTED)
- ✅ **Secure file serving** (ownership checks, auth-gated)
- ✅ **Audit logging** (all admin actions tracked)
- ✅ **Guardrail middleware** (`requireKYCApproved`) for protecting routes
- ✅ **Real-time admin dashboard** with live stats

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER WORKFLOW                            │
├─────────────────────────────────────────────────────────────────┤
│  Register → Complete KYC Form → Upload Documents → Pending      │
│  Review by Admin → Approved → Access Platform Features          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐      ┌──────────────┐      ┌─────────────────┐
│   Frontend      │─────▶│  API Routes  │─────▶│   Controller    │
│  (React/Next)   │      │ (Next.js)    │      │   (HTTP layer)  │
└─────────────────┘      └──────────────┘      └─────────────────┘
                                                          │
                         ┌─────────────────────────────────┘
                         ▼
                  ┌──────────────┐      ┌─────────────────┐
                  │   Service    │─────▶│   Database      │
                  │ (Business    │      │   (Prisma)      │
                  │  Logic)      │      └─────────────────┘
                  └──────────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │  File System │
                  │ (Multer)     │
                  └──────────────┘
```

### Layer Responsibilities

| Layer | File | Purpose |
|-------|------|---------|
| **Types** | `lib/kyc/types.ts` | DTOs, error classes, constants |
| **Upload** | `lib/kyc/upload.ts` | Multer configuration, file handling |
| **Service** | `lib/kyc/service.ts` | Prisma DB operations, business rules |
| **Controller** | `lib/kyc/controller.ts` | Request validation, HTTP shaping |
| **Routes** | `app/api/kyc/**/*.ts` | Next.js route handlers (thin wrappers) |
| **Middleware** | `lib/middleware/requireKYC.ts` | Route guard for KYC-approved users |

---

## Database Schema

### Enums

```prisma
enum KycStatus {
  IDLE      // User registered, no KYC submission yet
  PENDING   // Documents submitted, awaiting admin review
  APPROVED  // Admin approved, user can access platform
  REJECTED  // Admin rejected, user can re-submit
}

enum Role {
  USER      // Standard user
  ADMIN     // Platform administrator
}
```

### User Model (Extended)

```prisma
model User {
  // ... existing fields ...
  
  // KYC & Blockchain fields (NEW)
  kycStatus      KycStatus  @default(IDLE)
  walletAddress  String?    @unique
  role           Role       @default(USER)
  
  // Relations (NEW)
  kycRecord      KYCRecord?
}
```

### KYCRecord Model (NEW)

```prisma
model KYCRecord {
  id            String    @id @default(uuid())
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId        String    @unique // 1-to-1 relation
  fullName      String
  idNumber      String
  documentUrls  String[]  // Relative paths: /uploads/kyc/user_[id]_[ts]_[file]
  submittedAt   DateTime  @default(now())
  reviewedAt    DateTime?
  reviewedBy    String?   // Admin user ID
  adminNotes    String?   // Rejection reason or internal notes
}
```

---

## Backend Implementation

### 1. Types (`lib/kyc/types.ts`)

```typescript
// Request DTOs
export interface SubmitKYCBody {
  userId: string;
  fullName: string;
  idNumber: string;
}

export interface AdminReviewBody {
  userId: string;
  status: 'APPROVED' | 'REJECTED';
  adminNotes?: string;
}

// Response DTOs
export interface KYCSubmissionResult {
  kycRecordId: string;
  kycStatus: KycStatus;
  documentUrls: string[];
  submittedAt: Date;
}

// Constants
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_FILES_PER_SUBMISSION = 5;
export const UPLOAD_DIR = './uploads/kyc';
export const UPLOAD_URL_PREFIX = '/uploads/kyc';
```

### 2. File Upload (`lib/kyc/upload.ts`)

Uses **Multer** with custom storage configuration:

```typescript
// Filename format: user_[userId]_[timestamp]_[originalName]
const kycStorage: StorageEngine = multer.diskStorage({
  destination: './uploads/kyc',
  filename(req, file, cb) {
    const userId = req.body.userId ?? 'unknown';
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `user_${userId}_${timestamp}_${safeName}`);
  },
});
```

**Key function:**
```typescript
export async function handleFileUpload(request: Request): 
  Promise<{ fields: Record<string, string>; files: SavedFile[] }>
```

Parses Next.js native `Request.formData()` and saves files to disk with security checks (MIME type, file size, max files).

### 3. Service Layer (`lib/kyc/service.ts`)

Pure database operations, no HTTP concerns.

```typescript
export async function submitKYC(params: SubmitKYCParams): Promise<KYCSubmissionResult>
// Business rules:
// - Cannot re-submit if APPROVED or PENDING
// - REJECTED users CAN re-submit (upsert pattern)
// - Updates both KYCRecord and User.kycStatus in a transaction

export async function adminReviewKYC(params: AdminReviewParams): Promise<KYCReviewResult>
// On APPROVED: adds 'kyc_verified' to user's roles array
// On REJECTED: removes 'kyc_verified' from roles
// Creates audit log entry for tracking
```

### 4. Controller Layer (`lib/kyc/controller.ts`)

HTTP-aware request handlers:

```typescript
export async function handleSubmitKYC(request: Request): Promise<NextResponse>
export async function handleAdminReview(request: Request, adminId: string): Promise<NextResponse>
export async function handleGetKYC(request: Request): Promise<NextResponse>
export async function handleListKYC(request: Request): Promise<NextResponse>
```

Standard response format:
```json
// Success
{
  "success": true,
  "message": "KYC documents submitted successfully.",
  "data": { ... }
}

// Error
{
  "success": false,
  "message": "Error description"
}
```

---

## API Endpoints

### User Endpoints

#### Submit KYC Documents
```http
POST /api/kyc/submit
Content-Type: multipart/form-data

Fields:
  userId: string
  fullName: string
  idNumber: string
  documents: File[] (1-5 files, max 5MB each)

Response: 201 Created
{
  "success": true,
  "message": "KYC documents submitted successfully. Awaiting admin review.",
  "data": {
    "kycRecordId": "uuid",
    "kycStatus": "PENDING",
    "documentUrls": ["/uploads/kyc/user_abc_123_passport.jpg"],
    "submittedAt": "2026-02-10T10:30:00Z"
  }
}
```

### Admin Endpoints (Protected)

#### Review KYC Application
```http
PATCH /api/kyc/review
Authorization: Required (admin role)
Content-Type: application/json

Body:
{
  "userId": "user-uuid",
  "status": "APPROVED" | "REJECTED",
  "adminNotes": "Optional notes (required for rejection)"
}

Response: 200 OK
{
  "success": true,
  "message": "KYC approved successfully.",
  "data": {
    "userId": "user-uuid",
    "kycStatus": "APPROVED",
    "reviewedAt": "2026-02-10T10:35:00Z",
    "adminNotes": null
  }
}
```

#### List KYC Submissions
```http
GET /api/kyc/review?status=PENDING&page=1&limit=20
Authorization: Required (admin role)

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": "kyc-record-uuid",
      "userId": "user-uuid",
      "fullName": "John Doe",
      "idNumber": "ID123456",
      "documentUrls": [...],
      "submittedAt": "2026-02-08T10:30:00Z",
      "reviewedAt": null,
      "adminNotes": null,
      "user": {
        "id": "user-uuid",
        "email": "john@example.com",
        "name": "John Doe",
        "kycStatus": "PENDING"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### Serve Uploaded Documents
```http
GET /api/uploads/kyc/user_abc_123_passport.jpg
Authorization: Required

Access Control:
- Admins can view any document
- Users can only view their own documents (userId extracted from filename)

Response: 200 OK (binary file)
Content-Type: image/jpeg | image/png | application/pdf
```

---

## File Upload System

### Storage Strategy

Files are stored **locally** in `./uploads/kyc/` with the following format:

```
user_[userId]_[timestamp]_[originalName]

Example:
user_abc123_1707559800000_passport.jpg
```

This ensures:
- ✅ Unique filenames (timestamp + userId)
- ✅ Ownership tracking (userId embedded)
- ✅ Original name preserved (for display)
- ✅ Easy migration to IPFS/Arweave later (just swap relative path for CID)

### Validation

| Check | Limit |
|-------|-------|
| MIME types | `image/jpeg`, `image/png`, `image/webp`, `application/pdf` |
| File size | 5 MB per file |
| Files per submission | 5 max |

### Security

1. **Path traversal protection** — Rejects filenames with `..` or `~`
2. **Ownership verification** — Non-admin users can only access files matching their `userId`
3. **Authentication required** — All file access requires valid `access_token` cookie
4. **Resolved path validation** — Double-checks resolved path stays within `uploads/kyc/`

---

## Middleware & Guards

### `requireKYCApproved` Middleware

**File:** `lib/middleware/requireKYC.ts`

**Purpose:** Protect routes that require KYC verification (property registration, minting, etc.)

**Usage:**
```typescript
import { requireKYCApproved } from '@/lib/middleware/requireKYC';

export async function POST(request: NextRequest) {
  const guard = await requireKYCApproved();
  if (!guard.allowed) return guard.response;

  // guard.userId, guard.email, guard.roles available
  // Continue with protected logic...
}
```

**Behavior:**
- Returns `401 Unauthorized` if user not authenticated
- Returns `403 Forbidden` with contextual message based on `kycStatus`:
  - `IDLE` → "KYC verification required. Please complete your KYC submission."
  - `PENDING` → "Your KYC submission is under review. Please wait for approval."
  - `REJECTED` → "Your KYC submission was rejected. Please re-submit with valid documents."
  - `APPROVED` → Allows request to proceed

**Response Type:**
```typescript
type KYCGuardResult =
  | { allowed: true; userId: string; email: string; roles: string[] }
  | { allowed: false; response: NextResponse };
```

---

## Admin Panel

### Dashboard (`app/admin/page.tsx`)

- **Live KYC stats** — Fetches pending count from API
- **Quick links** to KYC and Property approval pages
- **System health** indicator

### KYC Approvals Page (`app/admin/kyc/page.tsx`)

**Layout:** 3-column grid

#### Left Sidebar — Filters
- Search by name, email, or ID
- Status filter (PENDING / APPROVED / REJECTED / All)
- Reset and refresh buttons

#### Middle Panel — Applications Queue
- Paginated list of KYC submissions
- Shows: name, email, ID number, status badge, days in queue, document count
- Bulk select with Approve/Reject actions
- Click row to view details in right panel

#### Right Panel — Application Details
- **User information** — Full name, email, ID number, submission date
- **Uploaded documents** — View each document in new tab via secure API route
- **Status banner** — For reviewed applications (APPROVED/REJECTED with timestamp)
- **Admin notes** — Displayed if previously rejected
- **Action buttons** (PENDING only):
  - **Approve KYC** — Grants platform access, adds `kyc_verified` role
  - **Reject KYC** — Requires reason, user can re-submit

### Components

| Component | Path | Purpose |
|-----------|------|---------|
| `KYCApprovalsTab` | `components/admin/kyc-approvals-tab.tsx` | Main queue list with filters |
| `KYCDetailsPanel` | `components/admin/kyc-details-panel.tsx` | Detailed review panel |
| `AdminSidebar` | `components/admin/admin-sidebar.tsx` | Navigation (pre-existing) |
| `AdminTopBar` | `components/admin/admin-topbar.tsx` | Header (pre-existing) |

---

## Usage Guide

### User Flow

#### 1. Register Account
```bash
POST /api/auth/register
```
User is created with `kycStatus: IDLE`

#### 2. Submit KYC Documents
```javascript
const formData = new FormData();
formData.append('userId', user.id);
formData.append('fullName', 'John Doe');
formData.append('idNumber', 'ID123456');
formData.append('documents', passportFile);
formData.append('documents', proofOfAddressFile);

const res = await fetch('/api/kyc/submit', {
  method: 'POST',
  body: formData,
});
```
User's `kycStatus` becomes `PENDING`

#### 3. Wait for Admin Review
Admin logs in → navigates to `/admin/kyc` → reviews submission

#### 4. Access Platform Features
If approved (`kycStatus: APPROVED`), user can now:
- Register properties (`POST /api/properties`)
- Mint tokens
- Access KYC-gated routes protected by `requireKYCApproved` middleware

### Admin Flow

#### 1. View Pending Applications
- Navigate to `/admin/kyc`
- Filter by `status=PENDING`
- See queue of submissions sorted by date

#### 2. Review Documents
- Click on an application
- View all uploaded documents via "View" button (opens in new tab)
- Check ID number, full name, submission date

#### 3. Make Decision
- **Approve:** Click "Approve KYC" → Confirm → User gets `kyc_verified` role
- **Reject:** Click "Reject KYC" → Enter reason → User receives notification, can re-submit

#### 4. Bulk Operations
- Select multiple applications with checkboxes
- Click "Approve Selected" or "Reject Selected"
- All updates processed sequentially

---

## Admin Creation

### Script: `scripts/create-admin.ts`

Promotes an existing user to admin role.

**Usage:**
```bash
# Using npm/pnpm script
pnpm create-admin admin@assetguard.io

# Using npx tsx directly
npx tsx scripts/create-admin.ts admin@assetguard.io
```

**What it does:**
1. Looks up user by email
2. Adds `'admin'` to their `roles` array
3. Sets `role` field to `Role.ADMIN`
4. Creates audit log entry
5. Prints confirmation

**Output:**
```
🔍 Looking up user with email: admin@assetguard.io...

✅ User promoted to admin successfully!

   ID:     abc-123-def-456
   Email:  admin@assetguard.io
   Name:   Admin User
   Roles:  user, admin
   Role:   ADMIN
```

**Error Handling:**
- ❌ Email not provided → Shows usage
- ❌ Invalid email format → Rejects
- ❌ User not found → Must register first
- ℹ️ Already admin → No changes made

---

## Security Considerations

### Authentication & Authorization

1. **JWT-based auth** — All KYC endpoints require valid `access_token` cookie
2. **Role-based access** — Admin endpoints check for `admin` role in decoded JWT
3. **Ownership validation** — Users can only submit their own KYC, view their own documents

### File Upload Security

1. **MIME type whitelist** — Only JPEG, PNG, WebP, PDF allowed
2. **File size limit** — 5 MB per file prevents DoS
3. **File count limit** — Max 5 files per submission
4. **Filename sanitization** — Special chars replaced with underscores
5. **Path traversal protection** — Rejects `..` and `~` in paths
6. **Storage isolation** — All files stored in dedicated `./uploads/kyc/` directory

### Data Protection

1. **Sensitive data** — ID numbers, documents stored securely
2. **Admin notes** — Rejection reasons stored for transparency
3. **Audit logging** — All admin actions logged to `audit_logs` table
4. **Soft delete** — Files remain on disk (can implement cleanup cron later)

### Rate Limiting

**Recommended (not yet implemented):**
```typescript
// In route handler
const limited = await checkRateLimit(request, 'kyc-submit', { max: 3, window: '1h' });
if (limited) return limited.response;
```

Add rate limiting to:
- `POST /api/kyc/submit` — 3 submissions per hour
- `PATCH /api/kyc/review` — 100 reviews per hour (admin)

---

## Migration & Deployment

### 1. Generate Prisma Migration

```bash
npx prisma migrate dev --name add_kyc_module
```

This creates migration SQL and updates `schema.prisma`.

### 2. Update Production Database

```bash
npx prisma migrate deploy
```

### 3. Create Upload Directory

```bash
mkdir -p uploads/kyc
```

The directory has `.gitignore` and `.gitkeep` already configured.

### 4. Environment Variables

Ensure these are set (already in your `.env`):

```env
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
JWT_ACCESS_PRIVATE_KEY=your-secret
```

### 5. Create First Admin

```bash
# User must register first via /register or /api/auth/register
pnpm create-admin your.email@example.com
```

### 6. Restart Services

```bash
pnpm build
pnpm start
```

---

## File Structure

```
assetguard--v2/
├── prisma/
│   └── schema.prisma              # Extended with KYC models
├── lib/
│   ├── kyc/
│   │   ├── types.ts               # DTOs, constants, error classes
│   │   ├── upload.ts              # Multer configuration
│   │   ├── service.ts             # Database operations
│   │   ├── controller.ts          # HTTP handlers
│   │   └── index.ts               # Barrel export
│   └── middleware/
│       └── requireKYC.ts          # Route guard middleware
├── app/
│   ├── api/
│   │   ├── kyc/
│   │   │   ├── submit/
│   │   │   │   └── route.ts       # POST /api/kyc/submit
│   │   │   └── review/
│   │   │       └── route.ts       # PATCH, GET /api/kyc/review
│   │   └── uploads/
│   │       └── kyc/
│   │           └── [...path]/
│   │               └── route.ts   # GET /api/uploads/kyc/*
│   └── admin/
│       ├── page.tsx               # Admin dashboard (updated stats)
│       └── kyc/
│           └── page.tsx           # KYC approvals page
├── components/
│   └── admin/
│       ├── kyc-approvals-tab.tsx  # Main queue (rewritten)
│       └── kyc-details-panel.tsx  # Details panel (rewritten)
├── scripts/
│   └── create-admin.ts            # Admin promotion script
├── uploads/
│   └── kyc/                       # File storage directory
│       ├── .gitignore             # Ignore uploaded files
│       └── .gitkeep               # Keep directory in git
└── package.json                   # Added "create-admin" script
```

---

## API Response Codes

| Code | Meaning | Usage |
|------|---------|-------|
| `200` | OK | Successful GET, PATCH |
| `201` | Created | Successful POST (KYC submission) |
| `400` | Bad Request | Missing/invalid fields, file validation failure |
| `401` | Unauthorized | Missing or invalid authentication |
| `403` | Forbidden | Insufficient permissions (not admin, KYC not approved) |
| `404` | Not Found | User or KYC record not found |
| `409` | Conflict | Cannot re-submit (already PENDING/APPROVED) |
| `413` | Payload Too Large | File exceeds 5 MB |
| `415` | Unsupported Media Type | Invalid MIME type |
| `500` | Internal Server Error | Unexpected server error |

---

## Testing Checklist

### User Flow
- [ ] User registers account
- [ ] User submits KYC with valid documents (JPEG, PDF)
- [ ] User status changes to PENDING
- [ ] User cannot access protected routes (gets 403 with message)
- [ ] User cannot re-submit while PENDING

### Admin Flow
- [ ] Admin logs in with admin role
- [ ] Admin sees pending count on dashboard
- [ ] Admin navigates to KYC approvals page
- [ ] Admin can filter by status (PENDING, APPROVED, REJECTED)
- [ ] Admin can search by name/email/ID
- [ ] Admin clicks application → sees details panel
- [ ] Admin can view uploaded documents (opens in new tab)
- [ ] Admin approves application → user gets `kyc_verified` role
- [ ] Admin rejects application with reason → user can re-submit

### Edge Cases
- [ ] File too large (5+ MB) → 413 error
- [ ] Wrong MIME type (e.g., .exe) → 415 error
- [ ] More than 5 files → 400 error
- [ ] Rejected user can re-submit with new documents
- [ ] Approved user cannot re-submit
- [ ] Non-admin cannot access `/api/kyc/review`
- [ ] User cannot view other users' documents

---

## Future Enhancements

### Phase 2
- [ ] **Email notifications** — Notify users on approval/rejection
- [ ] **IPFS/Arweave migration** — Replace local paths with content hashes
- [ ] **Facial recognition** — AI-powered identity verification
- [ ] **Document OCR** — Auto-extract ID number from uploads
- [ ] **Risk scoring** — Automated compliance checks (sanctions, PEP)
- [ ] **Re-submission workflow** — Dedicated UI for rejected users
- [ ] **Document expiry alerts** — Notify when ID/passport expires

### Phase 3
- [ ] **Blockchain attestation** — Store KYC approval proof on-chain
- [ ] **Multi-tier KYC** — Basic/Advanced/Enterprise verification levels
- [ ] **Third-party integrations** — Onfido, Jumio, Sumsub
- [ ] **Batch export** — CSV export of KYC applications
- [ ] **Advanced analytics** — Approval rate, avg review time, etc.

---

## Troubleshooting

### TypeScript Errors: "Module has no exported member 'KycStatus'"

**Cause:** TS language server cache is stale after Prisma generation.

**Fix:**
```bash
npx prisma generate
# Then restart TS server in VS Code: Cmd+Shift+P → "Restart TS Server"
```

### Files Not Uploading

**Check:**
1. `uploads/kyc/` directory exists and is writable
2. Request uses `Content-Type: multipart/form-data`
3. Files are under 5 MB
4. MIME types are allowed (JPEG, PNG, WebP, PDF)

### Admin Cannot View Documents

**Check:**
1. User has `admin` role in database
2. Access token cookie is present and valid
3. File path matches pattern: `/api/uploads/kyc/user_abc_123_file.jpg`

### KYC Status Not Updating

**Check:**
1. Admin review API call succeeded (check Network tab)
2. Database transaction completed (check Prisma logs)
3. User's `roles` array includes `kyc_verified` (for approved users)

---

## Summary

The KYC module is a **production-ready identity verification system** with:

- ✅ **Secure file upload** with Multer (local storage, ready for IPFS migration)
- ✅ **Admin review workflow** with approve/reject actions
- ✅ **Role-based access control** (admin-only endpoints)
- ✅ **Route protection middleware** (`requireKYCApproved`)
- ✅ **Real-time admin dashboard** with live stats
- ✅ **Audit logging** for compliance
- ✅ **Type-safe** with strict TypeScript
- ✅ **Service-Controller architecture** for maintainability

**Total Implementation:**
- 10 new files
- 4 updated files
- 2 database models
- 5 API endpoints
- 1 admin script

**Ready for:** Property registration, tokenization, and all KYC-gated platform features.

---

**Document Version:** 1.0  
**Last Updated:** February 10, 2026  
**Maintained By:** AssetGuard Development Team
