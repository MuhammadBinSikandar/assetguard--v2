# AssetGuard Functional Testing Documentation

## 5.2 Functional Testing

Functional testing validates that the AssetGuard modules work correctly as a whole, ensuring that the developed system meets its specifications and requirements. Unlike unit testing which focuses on internal functions, functional testing evaluates user-facing features through the UI or APIs.

> **Note:** Functional Testing 1–14 (Authentication Flow and Role-Based Access Control) are documented separately and cover user registration, OTP verification, login, password reset, account lockout, and role-based route protection.

---

## 5.2.3 KYC (Know Your Customer) Module

### Functional Testing 15: KYC Document Submission by Authenticated User

**Testing Objective:** To verify that an authenticated user can successfully submit a KYC application with their full name, ID number, and supporting documents, and that the system creates a KYC record and transitions their status to PENDING.

**API Endpoint:** `POST /api/kyc/submit`

**Table 124: Table for Functional Testing 15**

| No. | Test Case | Attribute and Value | Expected Result | Actual Result | Result |
|-----|-----------|---------------------|-----------------|---------------|--------|
| 1 | Submit KYC with valid documents | `userId`: valid authenticated user ID, `fullName`: "Laiqa Tariq", `idNumber`: "AB1234567", `documents`: 1 valid image file | KYC record created in database, `user.kycStatus` set to `PENDING`, success response `{ kycRecordId, kycStatus: "PENDING" }` returned | KYC record created, status set to PENDING | Pass |

---

### Functional Testing 16: KYC Re-Submission Blocked When Already PENDING

**Testing Objective:** To ensure the system prevents a user from submitting a second KYC application while their first submission is still awaiting admin review.

**API Endpoint:** `POST /api/kyc/submit`

**Table 125: Table for Functional Testing 16**

| No. | Test Case | Attribute and Value | Expected Result | Actual Result | Result |
|-----|-----------|---------------------|-----------------|---------------|--------|
| 1 | Submit KYC when status is already PENDING | `userId`: user with `kycStatus: PENDING`, valid form data | HTTP 409 error returned with message `"A KYC submission is already under review. Please wait for admin decision."`, original KYC record unchanged | 409 Conflict returned, re-submission blocked | Pass |

---

### Functional Testing 17: KYC Re-Submission Allowed After Rejection

**Testing Objective:** To verify that a previously rejected user can re-submit a KYC application with updated documents.

**API Endpoint:** `POST /api/kyc/submit`

**Table 126: Table for Functional Testing 17**

| No. | Test Case | Attribute and Value | Expected Result | Actual Result | Result |
|-----|-----------|---------------------|-----------------|---------------|--------|
| 1 | Re-submit KYC after rejection | `userId`: user with `kycStatus: REJECTED`, updated `fullName`, `idNumber`, and new documents | KYC record upserted with new data, `kycStatus` reset to `PENDING`, previous admin notes and `reviewedAt` cleared | KYC updated, status reset to PENDING | Pass |

---

### Functional Testing 18: KYC Status Retrieval by Authenticated User

**Testing Objective:** To ensure an authenticated user can retrieve their own KYC status and record details.

**API Endpoint:** `GET /api/kyc/status`

**Table 127: Table for Functional Testing 18**

| No. | Test Case | Attribute and Value | Expected Result | Actual Result | Result |
|-----|-----------|---------------------|-----------------|---------------|--------|
| 1 | Get own KYC status — authenticated user | Valid access token cookie, no `userId` query param | Returns `{ kycStatus, kycRecord: { fullName, idNumber, documentUrls, submittedAt } }` for the calling user | Correct KYC record returned | Pass |
| 2 | Get another user's KYC status as non-admin | Valid access token, `userId` query param set to a different user's ID | HTTP 403 returned with `"Forbidden. You can only view your own KYC status."` | Access denied | Pass |
| 3 | Get KYC status without authentication | No access token cookie | HTTP 401 returned with `"Unauthorized. Please log in."` | Unauthorized response | Pass |

---

### Functional Testing 19: Admin Reviews and Approves a KYC Submission

**Testing Objective:** To verify that an admin user can approve a PENDING KYC submission, triggering the user's status to change to APPROVED and the `kyc_verified` role to be added.

**API Endpoint:** `PATCH /api/kyc/review`

**Table 128: Table for Functional Testing 19**

| No. | Test Case | Attribute and Value | Expected Result | Actual Result | Result |
|-----|-----------|---------------------|-----------------|---------------|--------|
| 1 | Admin approves PENDING KYC | Admin access token, `{ userId: "<target_user>", status: "APPROVED", adminNotes: "Documents verified" }` | `user.kycStatus` = `APPROVED`, `kyc_verified` added to `user.roles`, `kycRecord.reviewedAt` and `reviewedBy` populated | KYC approved, role granted | Pass |
| 2 | Admin rejects PENDING KYC | Admin access token, `{ userId: "<target_user>", status: "REJECTED", adminNotes: "ID unclear" }` | `user.kycStatus` = `REJECTED`, `kyc_verified` removed from roles if present, admin notes saved | KYC rejected, role revoked | Pass |
| 3 | Non-admin tries to review KYC | Regular user access token, same request body | HTTP 403 returned with `"Forbidden. Admin access required."` | Access denied | Pass |
| 4 | Admin reviews KYC with no authentication | No access token cookie | HTTP 401 returned with `"Unauthorized. Please log in."` | Unauthorized response | Pass |

---

### Functional Testing 20: Admin Lists KYC Submissions

**Testing Objective:** To ensure admins can retrieve a list of all KYC submissions, optionally filtered by status.

**API Endpoint:** `GET /api/kyc/review`

**Table 129: Table for Functional Testing 20**

| No. | Test Case | Attribute and Value | Expected Result | Actual Result | Result |
|-----|-----------|---------------------|-----------------|---------------|--------|
| 1 | Admin retrieves all KYC submissions | Admin access token, no filters | Returns array of all KYC records with user details, status, and submission timestamps | Full list returned | Pass |
| 2 | Admin filters by PENDING status | Admin access token, `?status=PENDING` | Returns only KYC records with `kycStatus: PENDING` | Filtered list returned | Pass |
| 3 | Regular user attempts to list KYC submissions | Non-admin access token | HTTP 403 returned | Access denied | Pass |

---

## 5.2.4 Wallet Integration

### Functional Testing 21: Link Solana Wallet with Valid Signature

**Testing Objective:** To verify that an authenticated user can link their Solana wallet by providing a valid Ed25519 cryptographic signature, proving ownership of the wallet.

**API Endpoint:** `POST /api/wallet/link`

**Table 130: Table for Functional Testing 21**

| No. | Test Case | Attribute and Value | Expected Result | Actual Result | Result |
|-----|-----------|---------------------|-----------------|---------------|--------|
| 1 | Link wallet with valid signature | Authenticated user, `{ publicKey: "<44-char Solana address>", signature: "<bs58-encoded Ed25519 signature>", message: "Authorize linking wallet <pubkey> to User ID <userId> on AG Platform." }` | Signature verified, `user.walletAddress` updated in database, HTTP 200 with success message | Wallet linked successfully | Pass |

---

### Functional Testing 22: Wallet Linking Blocked with Invalid Signature

**Testing Objective:** To ensure the system rejects wallet linking attempts when the cryptographic signature cannot be verified against the provided public key.

**API Endpoint:** `POST /api/wallet/link`

**Table 131: Table for Functional Testing 22**

| No. | Test Case | Attribute and Value | Expected Result | Actual Result | Result |
|-----|-----------|---------------------|-----------------|---------------|--------|
| 1 | Link wallet with invalid signature | Valid `publicKey`, tampered or incorrect `signature`, valid `message` | HTTP 403 returned with `"Signature verification failed. You do not own this wallet."`, wallet not linked | Signature rejected | Pass |
| 2 | Link wallet without authentication | No access token cookie | HTTP 401 returned with `"Unauthorized"` | Unauthorized response | Pass |
| 3 | Link wallet with missing fields | Request body missing `signature` field | HTTP 400 returned with `"Missing required fields: publicKey, signature, message"` | Validation error returned | Pass |
| 4 | Link wallet with tampered message | Correct signature, but `message` text manually altered | HTTP 400 returned with `"Message does not match expected format"`, replay attack blocked | Tampered message rejected | Pass |
| 5 | Link wallet already linked to another account | Valid signature, but `publicKey` already stored under a different `userId` | HTTP 409 returned with `"This wallet is already linked to another account"` | Conflict error returned | Pass |

---

## 5.2.5 Token Refresh and Session Management

### Functional Testing 23: Access Token Refresh with Valid Refresh Token

**Testing Objective:** To verify that a user with a valid, non-revoked refresh token cookie can silently obtain new access and refresh tokens without re-authenticating.

**API Endpoint:** `POST /api/auth/refresh`

**Table 132: Table for Functional Testing 23**

| No. | Test Case | Attribute and Value | Expected Result | Actual Result | Result |
|-----|-----------|---------------------|-----------------|---------------|--------|
| 1 | Refresh tokens with valid refresh token | Valid `refresh_token` cookie (non-expired, non-revoked) | New `access_token` and `refresh_token` cookies set, old refresh token revoked in database (rotation), HTTP 200 | Token rotation successful, new cookies set | Pass |
| 2 | Refresh with no refresh token cookie | No `refresh_token` cookie present | HTTP 401 with `"No refresh token provided"` | Unauthorized response | Pass |
| 3 | Refresh with already-revoked token | `refresh_token` cookie present but marked as `revoked: true` in database | HTTP 401, all auth cookies cleared from response | Revoked token rejected | Pass |
| 4 | Refresh rate limiting enforced | Exceed 100 refresh requests per hour from same IP | HTTP 429 with `"Too many refresh requests. Please try again later."` | Rate limit applied | Pass |

---

### Functional Testing 24: User Logout

**Testing Objective:** To verify that logging out revokes the active refresh token in the database and clears all authentication cookies.

**API Endpoint:** `POST /api/auth/logout`

**Table 133: Table for Functional Testing 24**

| No. | Test Case | Attribute and Value | Expected Result | Actual Result | Result |
|-----|-----------|---------------------|-----------------|---------------|--------|
| 1 | Logout with valid session | Valid `access_token` and `refresh_token` cookies | Refresh token marked `revoked: true` in database, `access_token`, `refresh_token`, and `csrf_token` cookies deleted from response, HTTP 200 with `"Logged out successfully"` | Cookies cleared, token revoked | Pass |
| 2 | Logout without active session | No cookies present | HTTP 200 returned (logout is idempotent), no errors thrown | Graceful response | Pass |
| 3 | Post-logout access attempt using old access token | Attempt to call `GET /api/auth/me` with old (now cookie-deleted) access token | HTTP 401 returned, user must re-authenticate | Access denied after logout | Pass |

---

### Functional Testing 25: Active Session Listing

**Testing Objective:** To ensure authenticated users can view all their active login sessions, with the current session flagged.

**API Endpoint:** `GET /api/auth/sessions`

**Table 134: Table for Functional Testing 25**

| No. | Test Case | Attribute and Value | Expected Result | Actual Result | Result |
|-----|-----------|---------------------|-----------------|---------------|--------|
| 1 | Retrieve sessions for authenticated user | Valid access token cookie, user has 2 active sessions | Returns array of sessions with `id`, `device`, `ip`, `createdAt`, `expiresAt`, one flagged as `isCurrent: true` | Session list returned with current flag | Pass |
| 2 | Retrieve sessions without authentication | No access token cookie | HTTP 401 returned | Unauthorized response | Pass |
| 3 | Expired sessions not included in list | User has 1 active and 1 expired (but non-revoked) session | Only the non-expired session returned | Expired sessions excluded | Pass |

---

### Functional Testing 26: OTP Resend

**Testing Objective:** To verify that users can request a new OTP code, that previous OTP codes are invalidated, and that the rate limit prevents abuse.

**API Endpoint:** `POST /api/auth/resend-otp`

**Table 135: Table for Functional Testing 26**

| No. | Test Case | Attribute and Value | Expected Result | Actual Result | Result |
|-----|-----------|---------------------|-----------------|---------------|--------|
| 1 | Resend OTP for unverified user | `{ email: "laiqa230104@gmail.com" }`, user exists and `emailVerified: false` | Previous unconsumed OTP tokens marked as consumed, new 6-digit OTP generated and emailed, HTTP 200 with success message | New OTP sent, old OTP invalidated | Pass |
| 2 | Resend OTP for already-verified user | `{ email: "laiqa230104@gmail.com" }`, user `emailVerified: true` | HTTP 200 with `"Email is already verified"`, no new OTP generated | Verification confirmed, no unnecessary OTP | Pass |
| 3 | Resend OTP for non-existent email | `{ email: "nonexistent@test.com" }` | HTTP 200 with generic message `"If the email is registered, a new verification code has been sent."` (prevents user enumeration) | Generic response returned | Pass |
| 4 | Resend OTP exceeds rate limit | 4+ resend requests within 15 minutes from same IP | HTTP 429 with `"Too many resend attempts. Please try again later."` | Rate limit enforced | Pass |
| 5 | Resend OTP with missing email field | `{}` (empty body) | HTTP 400 with `"Email is required"` | Validation error returned | Pass |

---

## 5.2.6 User Profile Management

### Functional Testing 27: Retrieve Current User Profile

**Testing Objective:** To ensure an authenticated user can retrieve their own profile data, including email, name, roles, KYC status, and email verification status.

**API Endpoint:** `GET /api/auth/me`

**Table 136: Table for Functional Testing 27**

| No. | Test Case | Attribute and Value | Expected Result | Actual Result | Result |
|-----|-----------|---------------------|-----------------|---------------|--------|
| 1 | Get authenticated user profile | Valid `access_token` cookie | HTTP 200 with `{ user: { id, email, name, roles, emailVerified, kycStatus, twoFactorEnabled, createdAt } }` | User profile returned with all fields | Pass |
| 2 | Get profile without authentication | No `access_token` cookie | HTTP 401 with `"Unauthorized"` | Unauthorized response | Pass |
| 3 | Get profile with valid token but deleted user account | `access_token` valid but user removed from database | HTTP 404 with `"User not found"` | Not found response | Pass |
| 4 | Profile reflects latest roles after KYC approval | Admin approves KYC, then user calls `/api/auth/me` | Response includes `kyc_verified` in `roles` array | Updated roles reflected | Pass |

---

## 5.2.7 Transaction History

### Functional Testing 28: Retrieve Transaction History with Filters

**Testing Objective:** To verify that the transactions endpoint correctly returns paginated results and applies type, status, and keyword query filters accurately.

**API Endpoint:** `GET /api/transactions`

**Table 137: Table for Functional Testing 28**

| No. | Test Case | Attribute and Value | Expected Result | Actual Result | Result |
|-----|-----------|---------------------|-----------------|---------------|--------|
| 1 | Retrieve first page of all transactions | `?page=1` | Returns 10 transactions (page size), `total` equals 42 | 10 items returned, total 42 | Pass |
| 2 | Retrieve second page | `?page=2` | Returns next 10 transactions (items 11–20) | 10 items returned | Pass |
| 3 | Filter by transaction type "purchase" | `?type=purchase` | Returns only transactions with `type: "purchase"` | Filtered results returned | Pass |
| 4 | Filter by status "completed" | `?status=completed` | Returns only transactions with `status: "completed"` | Filtered results returned | Pass |
| 5 | Filter by keyword matching property name | `?q=SULLIVAN` | Returns only transactions where `property` contains "SULLIVAN" (case-insensitive) | Matching transactions returned | Pass |
| 6 | Filter by keyword matching transaction hash | `?q=0x3fa2` | Returns transactions whose `hash` field contains the query string | Hash-matched transactions returned | Pass |
| 7 | Combine type and status filters | `?type=sale&status=pending` | Returns only sale transactions that are still pending | Combined filter applied | Pass |
| 8 | Query with no matching results | `?q=zzz_no_match_xyz` | Returns `{ items: [], total: 0 }` | Empty result set | Pass |
| 9 | Results ordered reverse-chronologically | `?page=1` | First item has the most recent `timestamp` | Most recent transaction appears first | Pass |

---

## 5.2.8 Blockchain Explorer

### Functional Testing 29: Retrieve Explorer Transactions

**Testing Objective:** To ensure the blockchain explorer transaction endpoint returns a well-structured set of recent on-chain transactions with all required fields (hash, type, addresses, token, amount, status, block info).

**API Endpoint:** `GET /api/explorer/transactions`

**Table 138: Table for Functional Testing 29**

| No. | Test Case | Attribute and Value | Expected Result | Actual Result | Result |
|-----|-----------|---------------------|-----------------|---------------|--------|
| 1 | Retrieve explorer transactions | No parameters | HTTP 200 with `{ transactions: [...] }` containing 32 entries | 32 transactions returned | Pass |
| 2 | Verify required fields present | Inspect first transaction object | Each transaction has `id`, `hash`, `type`, `from`, `to`, `amount`, `timestamp`, `status`, `block`, `fee`, `confirmations` | All required fields present | Pass |
| 3 | Verify transaction types are valid | Inspect `type` field across all transactions | All values are one of `"transfer"`, `"mint"`, `"burn"` | Valid type values only | Pass |
| 4 | Verify status values are valid | Inspect `status` field across all transactions | All values are one of `"success"`, `"pending"`, `"failed"` | Valid status values only | Pass |
| 5 | Verify transactions ordered chronologically | Inspect `timestamp` ordering | Transactions listed in descending time order (most recent first based on index) | Correct ordering | Pass |
| 6 | Optional `token` field handles absence gracefully | Inspect transactions where `token` is undefined | Transactions without a token field are returned without error | Missing optional field handled | Pass |

---

## 5.2.9 Analytics Dashboard

### Functional Testing 30: Retrieve Analytics Summary

**Testing Objective:** To verify that the analytics summary endpoint returns platform-wide statistics including total properties, asset value, ROI, a 12-month timeseries, property distribution, and current notifications.

**API Endpoint:** `GET /api/analytics/summary`

**Table 139: Table for Functional Testing 30**

| No. | Test Case | Attribute and Value | Expected Result | Actual Result | Result |
|-----|-----------|---------------------|-----------------|---------------|--------|
| 1 | Retrieve analytics summary | No parameters | HTTP 200 with `{ totalProperties, totalValueUSD, registrations24h, transfers24h, roiPct, timeseries, distribution, notifications, updatedAt }` | Summary returned with all fields | Pass |
| 2 | Verify timeseries contains 12 months of data | Inspect `timeseries` array | Array has exactly 12 entries, each with `date` (YYYY-MM format) and `valueUSD` (positive number) | 12-month timeseries correct | Pass |
| 3 | Verify distribution array present | Inspect `distribution` field | Array contains property entries with `name` and `valueUSD` fields | Distribution data present | Pass |
| 4 | Verify notifications array present | Inspect `notifications` field | Array contains notification objects with `id`, `type`, `ts`, `message` fields | Notifications included | Pass |
| 5 | Verify `totalValueUSD` matches distribution sum | Sum all `distribution[].valueUSD` values | Sum equals `totalValueUSD` in response body | Values consistent | Pass |

---

### Functional Testing 31: Real-Time Analytics Event Stream (SSE)

**Testing Objective:** To verify that the analytics events endpoint establishes a Server-Sent Events (SSE) stream, sends an immediate connection confirmation event, and continuously emits periodic market update events.

**API Endpoint:** `GET /api/analytics/events`

**Table 140: Table for Functional Testing 31**

| No. | Test Case | Attribute and Value | Expected Result | Actual Result | Result |
|-----|-----------|---------------------|-----------------|---------------|--------|
| 1 | Connect to SSE stream | HTTP GET request | Response has `Content-Type: text/event-stream`, `Cache-Control: no-cache`, HTTP 200 connection established | SSE connection opened | Pass |
| 2 | Receive initial connection event | Wait for first SSE message | First event arrives with `{ type: "info", message: "Analytics stream connected" }` | Connection event received | Pass |
| 3 | Receive periodic update events | Wait 5–10 seconds after connection | At least one event emitted with `type` in `["surge", "drop", "info"]` and `message` describing a market change | Periodic events received | Pass |
| 4 | All events include required fields | Inspect received event payloads | Every event has `id` (UUID), `type`, `ts` (ISO timestamp), and `message` fields | Required fields present | Pass |
| 5 | Heartbeat pings sent every 15 seconds | Monitor stream for 20 seconds | SSE `: ping` comment received to keep connection alive | Heartbeat ping received | Pass |
| 6 | Stream gracefully closes after 60 seconds | Wait 60 seconds | Stream closed by server without error, client connection terminates cleanly | Stream auto-closed | Pass |

---

## 5.2.10 AI Chat Assistant

### Functional Testing 32: AI Chat Assistant — Valid Query

**Testing Objective:** To verify that users can send a question to the AI chat assistant, which performs RAG (Retrieval-Augmented Generation) over the AssetGuard knowledge base, and returns a contextually relevant response.

**API Endpoint:** `POST /api/chat`

**Table 141: Table for Functional Testing 32**

| No. | Test Case | Attribute and Value | Expected Result | Actual Result | Result |
|-----|-----------|---------------------|-----------------|---------------|--------|
| 1 | Ask a platform-related question | `{ messages: [{ role: "user", content: "What is AssetGuard?" }] }` | HTTP 200 with AI-generated response relevant to the AssetGuard knowledge base content | Response references AssetGuard platform details | Pass |
| 2 | Ask about KYC process | `{ messages: [{ role: "user", content: "How do I complete KYC verification?" }] }` | AI responds with KYC steps sourced from the knowledge base | KYC steps described | Pass |
| 3 | Ask a question outside the knowledge base scope | `{ messages: [{ role: "user", content: "What is the capital of France?" }] }` | AI responds that it does not have that information (system prompt restricts to context only) | Out-of-scope response acknowledged | Pass |

---

### Functional Testing 33: AI Chat Assistant — Invalid Requests

**Testing Objective:** To verify that the AI chat endpoint properly rejects malformed requests with empty or missing message content.

**API Endpoint:** `POST /api/chat`

**Table 142: Table for Functional Testing 33**

| No. | Test Case | Attribute and Value | Expected Result | Actual Result | Result |
|-----|-----------|---------------------|-----------------|---------------|--------|
| 1 | Send request with empty messages array | `{ messages: [] }` | HTTP 400 with `{ error: "No message provided" }` | Bad request returned | Pass |
| 2 | Send request with empty message content | `{ messages: [{ role: "user", content: "" }] }` | HTTP 400 with `{ error: "No message provided" }` (empty content after trim) | Bad request returned | Pass |
| 3 | Send request with missing `messages` field | `{}` (empty body) | HTTP 400 with `{ error: "No message provided" }` | Bad request returned | Pass |

---

## Summary Table

| Functional Test No. | Feature/Module Tested | API Endpoint | Test Cases | Status |
|--------------------|----------------------|-------------|------------|--------|
| 15 | KYC document submission (new user) | `POST /api/kyc/submit` | 1 | Pass |
| 16 | KYC re-submission blocked (PENDING status) | `POST /api/kyc/submit` | 1 | Pass |
| 17 | KYC re-submission allowed after rejection | `POST /api/kyc/submit` | 1 | Pass |
| 18 | KYC status retrieval by user and access control | `GET /api/kyc/status` | 3 | Pass |
| 19 | Admin KYC approval and rejection | `PATCH /api/kyc/review` | 4 | Pass |
| 20 | Admin KYC submission listing with filters | `GET /api/kyc/review` | 3 | Pass |
| 21 | Solana wallet linking with valid signature | `POST /api/wallet/link` | 1 | Pass |
| 22 | Wallet linking rejection (invalid signature, conflicts) | `POST /api/wallet/link` | 5 | Pass |
| 23 | Access token refresh and rotation | `POST /api/auth/refresh` | 4 | Pass |
| 24 | User logout and token revocation | `POST /api/auth/logout` | 3 | Pass |
| 25 | Active session listing | `GET /api/auth/sessions` | 3 | Pass |
| 26 | OTP resend with rate limiting | `POST /api/auth/resend-otp` | 5 | Pass |
| 27 | User profile retrieval | `GET /api/auth/me` | 4 | Pass |
| 28 | Transaction history with filtering and pagination | `GET /api/transactions` | 9 | Pass |
| 29 | Blockchain explorer transaction listing | `GET /api/explorer/transactions` | 6 | Pass |
| 30 | Analytics summary data | `GET /api/analytics/summary` | 5 | Pass |
| 31 | Real-time analytics SSE event stream | `GET /api/analytics/events` | 6 | Pass |
| 32 | AI chat assistant valid queries | `POST /api/chat` | 3 | Pass |
| 33 | AI chat assistant invalid request handling | `POST /api/chat` | 3 | Pass |
