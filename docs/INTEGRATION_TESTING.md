# 5.4 Integration Testing

Integration testing verifies that different modules of AssetGuard work together correctly. Unlike unit testing (which checks isolated functions) and functional testing (which checks features from a user's perspective), integration testing focuses on the interfaces, linkages, and data flow between modules.

---

## 5.4.1 Integration Testing 1: User Registration → Email Verification → Login Flow

**Testing Objective:** To ensure the complete user authentication flow works seamlessly from registration to login.

**Modules Involved:** Authentication Module, Email Service, Database, Session Management

**API Endpoints:** `POST /api/auth/register`, `POST /api/auth/verify-otp`, `POST /api/auth/login`, `GET /dashboard`

**Table 127: Table for Integration Testing 1**

| No. | Test Step | Action | Expected Result | Actual Result | Result |
|---|---|---|---|---|---|
| 1 | User Registration | `POST /api/auth/register` with email `laiqa230104@gmail.com` and password `Secure123!` | User created with `emailVerified=false`, OTP generated and stored in `EmailVerificationToken` table | User created, OTP sent | Pass |
| 2 | Verify OTP in Database | Query `EmailVerificationToken` table | OTP hash exists with 10-minute expiry | OTP record found | Pass |
| 3 | Email Verification | `POST /api/auth/verify-otp` with correct OTP | User `emailVerified` set to `true`, verification token deleted | Email verified | Pass |
| 4 | Login with Credentials | `POST /api/auth/login` with same credentials | Access token (1 hr) and refresh token (30 days) created, stored as HTTP-only cookies | Login successful | Pass |
| 5 | Access Protected Route | `GET /dashboard` | Dashboard loads successfully, user session valid | Dashboard accessed | Pass |
| 6 | Verify Refresh Token | Check `RefreshToken` table | Refresh token hash stored with expiry and device info | Token stored correctly | Pass |

**Overall Result:** Pass — Complete authentication flow works correctly with proper data flow between modules.

---

## 5.4.2 Integration Testing 2: Failed Login Attempts → Rate Limiting → Account Lockout → Audit Logging

**Testing Objective:** To ensure rate limiting, account lockout, and audit logging work together for security.

**Modules Involved:** Authentication, Rate Limiting, Audit Logging, Database

**API Endpoints:** `POST /api/auth/login`, `GET /api/auth/sessions`

**Table 128: Table for Integration Testing 2**

| No. | Test Step | Action | Expected Result | Actual Result | Result |
|---|---|---|---|---|---|
| 1 | First Failed Login | `POST /api/auth/login` with wrong password | Error response, attempt counter=1 | Failed, counter=1 | Pass |
| 2 | Verify Audit Log | Query `AuditLog` table | Log entry created with `action="login_failed"` | Log entry exists | Pass |
| 3 | Second Failed Login | `POST /api/auth/login` with wrong password | Error response, attempt counter=2 | Failed, counter=2 | Pass |
| 4 | Third and Fourth Failed Login | `POST /api/auth/login` with wrong password (×2) | Error responses, attempt counter=3 then counter=4 | Failed, counter=4 | Pass |
| 5 | Fifth Failed Login — Lockout Triggered | `POST /api/auth/login` with wrong password | 429 Too Many Requests; `lockedUntil` set to current time + 1 hour in `rateLimitStore` (`RATE_LIMIT_CONFIGS.login` lockoutDuration = 3,600,000 ms) | 429 — locked | Pass |
| 6 | Verify Rate Limit Record | Inspect in-memory `rateLimitStore` for client IP key | Entry shows `count=5`, `lockedUntil` approximately 60 minutes from now | Lockout record confirmed | Pass |
| 7 | Login Attempt During Lockout | `POST /api/auth/login` with correct credentials | 429 — account locked; response includes lockout expiry timestamp | Blocked with expiry | Pass |
| 8 | Verify Audit Log Completeness | Query `AuditLog` table | Five `login_failed` entries plus one `account_locked` event, all with correct `userId` and timestamps | All entries present | Pass |
| 9 | Verify No Active Session Created | `GET /api/auth/sessions` | No `RefreshToken` records exist for this user — no session was ever established during failed attempts | Sessions table empty | Pass |

**Overall Result:** Pass — Rate limiting, account lockout, and audit logging interact correctly to secure the login endpoint.

---

## 5.4.3 Integration Testing 3: KYC Submission → Document Upload → Admin Review → Role Update

**Testing Objective:** To verify that the complete KYC workflow correctly moves a user from unverified status to a fully KYC-approved state with updated roles and database records.

**Modules Involved:** KYC Module, File Upload Service, Admin Module, Authentication, Database

**API Endpoints:** `POST /api/kyc/submit`, `GET /api/kyc/status`, `PATCH /api/kyc/review`, `GET /api/kyc/review`

**Table 129: Table for Integration Testing 3**

| No. | Test Step | Action | Expected Result | Actual Result | Result |
|---|---|---|---|---|---|
| 1 | Submit KYC Application | `POST /api/kyc/submit` (multipart) with `userId`, `fullName`, `idNumber`, and an `image/jpeg` document file | `KYCRecord` created via `prisma.kYCRecord.upsert`; user `kycStatus` → `PENDING`; document saved as `user_{userId}_{ts}_{original}` in `/uploads/kyc/` | KYC submitted, status = PENDING | Pass |
| 2 | Verify KYC Record in Database | Query `KYCRecord` table for `userId` | Record exists with `fullName`, `idNumber`, `documentUrls` array, and `submittedAt` timestamp; `reviewedAt` is `null` | KYC record confirmed | Pass |
| 3 | Check KYC Status via API | `GET /api/kyc/status?userId={userId}` | Response `{ kycStatus: "PENDING", documentUrls: [...] }` | Status = PENDING returned | Pass |
| 4 | Attempt Re-Submission While PENDING | `POST /api/kyc/submit` again for the same user | 409 — "A KYC submission is already under review. Please wait for admin decision." (enforced by `lib/kyc/service.ts`) | 409 Conflict | Pass |
| 5 | Admin Lists Pending Submissions | `GET /api/kyc/review` with admin JWT cookie | List includes the user's KYC record with `PENDING` status | Record appears in admin list | Pass |
| 6 | Admin Approves KYC | `PATCH /api/kyc/review` with `{ userId, status: "APPROVED", adminNotes: "Documents verified" }` and admin JWT cookie | `KYCRecord.reviewedAt` set; user `kycStatus` → `APPROVED`; `kyc_verified` role appended to user `roles` array | KYC approved, role added | Pass |
| 7 | Verify Role Update in Database | Query `User` table for `userId` | `roles` array includes `"kyc_verified"`; `kycStatus = APPROVED` | Role confirmed | Pass |
| 8 | Attempt Re-Submission After Approval | `POST /api/kyc/submit` again for the same user | 409 — "KYC is already approved. No re-submission is necessary." | 409 Conflict | Pass |

**Overall Result:** Pass — The KYC module, file storage, admin review, and role management modules integrate correctly through all status transitions.

---

## 5.4.4 Integration Testing 4: Property Registration → BBL Lookup → Tokenization Calculation → Review & Submit

**Testing Objective:** To verify that the 5-step property registration wizard correctly fetches live property data, calculates tokenization values, and produces a valid submission reference ID.

**Modules Involved:** Property Registration, NYC Property API, SOL Price Feed, Tokenization Engine, Session, Database

**API Endpoints:** `POST /api/nyc/property`, `GET /api/price/sol`, Property Registration Steps 1–5

**Table 130: Table for Integration Testing 4**

| No. | Test Step | Action | Expected Result | Actual Result | Result |
|---|---|---|---|---|---|
| 1 | Step 1 — BBL Entry | User submits Borough=Brooklyn, Block=1304, Lot=43 in the BBL form | Form validates input; proceeds to Step 2 (Property Details) | Step 1 accepted | Pass |
| 2 | BBL Lookup via NYC API | `POST /api/nyc/property` with `{ borough: "Brooklyn", block: 1304, lot: 43 }` | Response populates property: address = "131 SULLIVAN PLACE - BROOKLYN 11225", `marketValue = $6,117,000`, `yearBuilt = 1930`, `taxClass = "4"` | Property data returned | Pass |
| 3 | Step 2 — Property Details Auto-Filled | Property Details form pre-populated from BBL response | All fields filled: owner, type, building data, land data, assessment; user confirms and proceeds | Details displayed and confirmed | Pass |
| 4 | Step 3 — Document Upload | User uploads title deed (`application/pdf`, ≤ 5 MB); `UploadStatus` transitions `"Pending"` → `"Uploaded"` | File accepted per `ALLOWED_MIME_TYPES`; stored in `/uploads/kyc/`; status = `"Uploaded"` | Document uploaded | Pass |
| 5 | Step 4 — Wallet Address Entry | User enters valid Solana base58 wallet address (32–44 chars, regex `/^[1-9A-HJ-NP-Za-km-z]{32,44}$/`) | `isBase58Address` returns `true`; form proceeds to Step 5 | Wallet validated | Pass |
| 6 | SOL Price Fetch for Review | `GET /api/price/sol` called during Step 5 load | Live SOL/USD price returned from CoinGecko (60-second cache); fallback = $250 if unreachable | SOL price fetched | Pass |
| 7 | Step 5 — Tokenization Values Calculated | Review page computes `perTokenUSD = 6,117,000 / 1000 = $6,117.00`; `perTokenSOL = 6117 / solPrice` | Token count = 1,000; `perTokenUSD = $6,117.00`; `perTokenSOL` calculated at live rate; displayed correctly | Token values correct | Pass |
| 8 | Reference ID Generation | User clicks Submit; `onSubmitFinal` runs | Reference ID generated in format `PR-{year}-{4 random digits}` (e.g. `PR-2026-3847`); navigation to confirmation page with masked wallet address | Reference ID created, confirmation shown | Pass |

**Overall Result:** Pass — The property registration pipeline integrates BBC lookup, SOL price feed, tokenization logic, and submission into a coherent end-to-end flow.

---

## 5.4.5 Integration Testing 5: Wallet Linking → Ed25519 Verification → Portfolio Update → Transaction Recording

**Testing Objective:** To verify that Solana wallet ownership is cryptographically confirmed before the wallet is persisted and becomes usable for portfolio and transaction tracking.

**Modules Involved:** Wallet Module, Solana Web3.js (@solana/wallet-adapter-react), Authentication, Database, Portfolio, Transaction History

**API Endpoints:** `POST /api/wallet/link`, `GET /api/transactions`

**Table 131: Table for Integration Testing 5**

| No. | Test Step | Action | Expected Result | Actual Result | Result |
|---|---|---|---|---|---|
| 1 | Authenticate User | Login via `POST /api/auth/login` with verified credentials | Valid JWT access-token cookie set (HTTP-only) | Session established | Pass |
| 2 | Construct Link Message | Client builds `expectedMessage = "Authorize linking wallet {pubkey} to User ID {userId} on AG Platform."` | Message string matches the server-side expected format exactly | Message constructed | Pass |
| 3 | Sign Message with Wallet | User signs message using connected Solana wallet adapter; signature encoded as base58 | Ed25519 signature produced from wallet's private key; base58-encoded `signature` string ready | Signature generated | Pass |
| 4 | Submit Wallet Link Request | `POST /api/wallet/link` with `{ publicKey, signature, message }` and JWT cookie | Server verifies JWT; reconstructs expected message; calls `nacl.sign.detached.verify`; verification passes; `walletAddress` written to `User` record via Prisma | 200 — wallet linked | Pass |
| 5 | Verify Audit Log Entry | Query `AuditLog` table | Entry with `action="wallet_link"`, `userId`, `walletAddress`, and `success=true` recorded | Audit entry confirmed | Pass |
| 6 | Attempt to Link Same Wallet to Another User | `POST /api/wallet/link` from a different authenticated account with the same `publicKey` | 409 — "This wallet is already linked to another account" (Prisma uniqueness constraint or explicit check) | 409 Conflict | Pass |
| 7 | Verify Portfolio Reflects Linked Wallet | Navigate to Portfolio page | Portfolio page reads `walletAddress` from user profile; wallet address displayed (first 8 + last 8 chars); total token balance aggregated from holdings | Portfolio shows wallet | Pass |
| 8 | Transaction History Available | `GET /api/transactions?page=1` | Transactions associated with the linked wallet address returned; `type`, `status`, `hash`, `from`, `to`, `timestamp` fields populated | Transactions listed | Pass |

**Overall Result:** Pass — Wallet cryptographic verification, database persistence, audit logging, and downstream portfolio and transaction modules integrate correctly.

---

## 5.4.6 Integration Testing 6: Analytics Data Aggregation → Real-Time Streaming → AI Chat Assistance

**Testing Objective:** To verify that the analytics summary, real-time SSE event stream, and AI chat assistant operate together and consistently reflect the same underlying platform data.

**Modules Involved:** Analytics Module, SSE Event Stream, AI Chat (Ollama + LangChain RAG), Knowledge Base, Authentication

**API Endpoints:** `GET /api/analytics/summary`, `GET /api/analytics/events` (SSE), `POST /api/chat`

**Table 132: Table for Integration Testing 6**

| No. | Test Step | Action | Expected Result | Actual Result | Result |
|---|---|---|---|---|---|
| 1 | Fetch Analytics Summary | `GET /api/analytics/summary` with authenticated session | Response includes `totalProperties=18`, `totalValueUSD`, `roiPct=8.42`, `timeseries` (12 months), `distribution` (4 properties), `notifications` array, and `updatedAt` timestamp | Summary data returned | Pass |
| 2 | Verify Metrics Card Rendering | Analytics page reads summary response | `formatUSD` (Intl.NumberFormat) formats `totalValueUSD`; `deltaPct` computed for each metric; `statusLabel` derived correctly | Metrics rendered | Pass |
| 3 | Connect to SSE Stream | `GET /api/analytics/events` via EventSource | HTTP 200 with `Content-Type: text/event-stream`; connection kept alive; periodic `ping` events received | SSE connected | Pass |
| 4 | Receive Real-Time Alert | SSE stream emits `notification` event | Alert data (e.g. "Property #NYC102 value increased by 4.5%") matches a `notifications` entry from the summary response | Alert received and displayed | Pass |
| 5 | Disconnect and Reconnect SSE | Close and re-open EventSource connection | Stream resumes; no duplicate events; server correctly closes previous connection | Reconnect successful | Pass |
| 6 | Submit Platform Query to AI Chat | `POST /api/chat` with `{ message: "What is the total value of registered properties?" }` | Ollama (`tinyllama`) processes query via LangChain RAG; `MemoryVectorStore` retrieves relevant chunks from `assetguard_knowledge_base.md`; response references platform data | AI response returned | Pass |
| 7 | Verify Chat Contextual Accuracy | Submit follow-up query: `"What is the minimum investment amount?"` | AI retrieves knowledge-base context about 1,000 tokens per property and the $100 minimum entry (BO-5); response is contextually accurate | Accurate response | Pass |
| 8 | Invalid Chat Request Handling | `POST /api/chat` with empty `message` field | 400 Bad Request returned; no model inference triggered; error message returned to client | 400 — rejected | Pass |

**Overall Result:** Pass — Analytics aggregation, real-time SSE streaming, and AI-assisted chat all reflect consistent platform data and integrate correctly under authenticated sessions.
