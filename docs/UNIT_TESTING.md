# AssetGuard Unit Testing Documentation

## 5.1 Unit Testing

Unit testing verifies the smallest testable components of AssetGuard such as individual functions, methods, or classes in isolation. The purpose is to ensure that each unit performs as expected, independent of the full system.

> **Note:** Unit Testing 1–5 (Authentication and Security Functions) are documented separately and cover `isValidEmail`, `validatePasswordStrength`, `hashPassword`/`comparePassword`, token generation, and account lockout duration.

---

## 5.1.2 JWT Token Management Functions

### Unit Testing 6: JWT Access Token Creation and Verification (`createAccessToken`, `verifyAccessToken`)

**Testing Objective:** To ensure JWT access tokens are created with the correct payload structure and can be verified and decoded accurately. Also validates that tampered or expired tokens are rejected.

**File Reference:** `lib/auth.ts`

**Table 109: Table for Unit Testing 6**

| No. | Test Case/Test Script | Attribute and Value | Expected Result | Actual Result | Result |
|-----|----------------------|---------------------|-----------------|---------------|--------|
| 1 | Call `createAccessToken()` with valid user payload | `{ userId: "u1", email: "user@test.com", roles: ["user"], emailVerified: true }` | Returns object with `token` (JWT string), `expiresAt` (Date), `jti` (UUID string) | Returns correct object | Pass |
| 2 | Call `verifyAccessToken()` with a valid token | Token from Test 1 | Returns decoded payload with matching `userId`, `email`, `roles`, `emailVerified` | Returns correct payload | Pass |
| 3 | Call `verifyAccessToken()` with tampered token | Modify last 4 characters of valid JWT | Returns `null` (signature invalid) | Returns `null` | Pass |
| 4 | Call `verifyAccessToken()` with expired token | Manually craft JWT with `exp` set to `Date.now() - 1000` | Returns `null` (token expired) | Returns `null` | Pass |
| 5 | Verify `jti` is unique per call | Call `createAccessToken()` twice with same payload | `jti` values differ between calls | Different `jti` values produced | Pass |
| 6 | Call `createRefreshToken()` with `rememberMe: false` | `userId: "u1"`, `rememberMe: false` | Returns object with `token`, `jti`, and `expiresAt` set to ~30 days | Returns correct object | Pass |
| 7 | Call `createRefreshToken()` with `rememberMe: true` | `userId: "u1"`, `rememberMe: true` | Returns `expiresAt` matching extended expiry configuration | Returns correct expiry | Pass |
| 8 | Call `verifyRefreshToken()` with valid refresh token | Token from Test 6 | Returns decoded payload with matching `userId` and `jti` | Returns correct payload | Pass |

---

## 5.1.3 CSRF Protection Functions

### Unit Testing 7: CSRF Token Generation and Validation (`generateCSRFToken`, `validateCSRFToken`)

**Testing Objective:** To verify that CSRF tokens are generated as 64-character hex strings, that two consecutive calls produce different tokens (randomness), and that the double-submit pattern validation correctly accepts and rejects requests based on header/cookie token matching.

**File Reference:** `lib/csrf.ts`

**Table 110: Table for Unit Testing 7**

| No. | Test Case/Test Script | Attribute and Value | Expected Result | Actual Result | Result |
|-----|----------------------|---------------------|-----------------|---------------|--------|
| 1 | Call `generateCSRFToken()` and inspect format | — | Returns 64-character hexadecimal string | Returns 64-char hex string | Pass |
| 2 | Generate two CSRF tokens consecutively | Call twice | Both tokens differ (random nonce applied) | Different tokens returned | Pass |
| 3 | Call `validateCSRFToken()` with GET request | `method: "GET"`, any headers | Returns `true` (GET is exempt) | Returns `true` | Pass |
| 4 | Call `validateCSRFToken()` with HEAD request | `method: "HEAD"`, any headers | Returns `true` (HEAD is exempt) | Returns `true` | Pass |
| 5 | Call `validateCSRFToken()` with matching header and cookie tokens | `method: "POST"`, header token === cookie token (e.g., `"abc123"`) | Returns `true` (double-submit valid) | Returns `true` | Pass |
| 6 | Call `validateCSRFToken()` with mismatched tokens | `method: "POST"`, header `"abc123"`, cookie `"xyz789"` | Returns `false` (tokens do not match) | Returns `false` | Pass |
| 7 | Call `validateCSRFToken()` with missing header token | `method: "POST"`, no `x-csrf-token` header, valid cookie | Returns `false` (header missing) | Returns `false` | Pass |
| 8 | Call `validateCSRFToken()` with missing cookie token | `method: "POST"`, valid header, no CSRF cookie | Returns `false` (cookie missing) | Returns `false` | Pass |
| 9 | Call `validateCSRFToken()` with empty string tokens | `method: "DELETE"`, header `""`, cookie `""` | Returns `false` (empty tokens rejected) | Returns `false` | Pass |

---

## 5.1.4 Rate Limiting Functions

### Unit Testing 8: Rate Limit Enforcement and Reset (`checkRateLimit`, `resetRateLimit`)

**Testing Objective:** To verify that the in-memory rate limiter correctly counts requests within a window, blocks requests that exceed the configured maximum, applies lockouts where configured, and properly resets counters on `resetRateLimit` calls.

**File Reference:** `lib/rateLimit.ts`

**Table 111: Table for Unit Testing 8**

| No. | Test Case/Test Script | Attribute and Value | Expected Result | Actual Result | Result |
|-----|----------------------|---------------------|-----------------|---------------|--------|
| 1 | First request within login window | `type: "login"`, `identifier: "192.168.1.1"` | Returns `{ success: true, remaining: 4, resetAt: <future timestamp> }` | Returns correct object | Pass |
| 2 | Fifth request on login (at the limit) | `type: "login"`, `identifier: "192.168.1.1"`, called 5 times | Returns `{ success: true, remaining: 0 }` on the 5th call | Returns correct remaining count | Pass |
| 3 | Sixth request on login (exceeds limit) | `type: "login"`, `identifier: "192.168.1.1"`, called 6 times | Returns `{ success: false, remaining: 0, lockedUntil: <1hr from now> }` | Returns `success: false` with lockout | Pass |
| 4 | Request during active lockout | `type: "login"`, `identifier: "192.168.1.1"` while locked | Returns `{ success: false, remaining: 0, lockedUntil: <original lockout time> }` | Returns `success: false` | Pass |
| 5 | `resetRateLimit()` clears active lockout | Call `resetRateLimit("192.168.1.1", "login")` after lockout | Returns `{ count: 0, remaining: 5, resetAt: <future> }` | Counter cleared successfully | Pass |
| 6 | Request after reset succeeds | Issue new request after `resetRateLimit()` | Returns `{ success: true, remaining: 4 }` | Returns `success: true` | Pass |
| 7 | Default type allows 100 requests per hour | `type: "default"`, `identifier: "10.0.0.1"` 100 times | 100th request returns `{ success: true, remaining: 0 }` | Correct limiting applied | Pass |
| 8 | `forgotPassword` type has no lockout | Exceed `forgotPassword` limit | Returns `{ success: false, lockedUntil: undefined }` (no lockout) | No lockout applied | Pass |
| 9 | Different identifiers have independent counters | `identifier: "10.0.0.1"` and `"10.0.0.2"` each make 3 login requests | Each has `remaining: 2` independently | Independent counters confirmed | Pass |

---

## 5.1.5 Middleware Route Matching Functions

### Unit Testing 9: Route Matching and Role Authorization (`matchesRoute`, `hasRequiredRole`)

**Testing Objective:** To verify that the middleware route matching logic correctly identifies protected routes (including wildcard patterns), and that the role authorization check accurately determines whether a user's roles satisfy the required roles for a route.

**File Reference:** `middleware.ts`

**Table 112: Table for Unit Testing 9**

| No. | Test Case/Test Script | Attribute and Value | Expected Result | Actual Result | Result |
|-----|----------------------|---------------------|-----------------|---------------|--------|
| 1 | Exact route match | `pathname: "/admin"`, `route: "/admin"` | Returns `true` | Returns `true` | Pass |
| 2 | Non-matching exact route | `pathname: "/dashboard"`, `route: "/admin"` | Returns `false` | Returns `false` | Pass |
| 3 | Wildcard route matches sub-path | `pathname: "/admin/users"`, `route: "/admin*"` | Returns `true` | Returns `true` | Pass |
| 4 | Wildcard route does not match unrelated path | `pathname: "/analytics"`, `route: "/admin*"` | Returns `false` | Returns `false` | Pass |
| 5 | User with matching role passes authorization | `userRoles: ["user", "admin"]`, `requiredRoles: ["admin"]` | Returns `true` | Returns `true` | Pass |
| 6 | User with no matching role fails authorization | `userRoles: ["user"]`, `requiredRoles: ["admin"]` | Returns `false` | Returns `false` | Pass |
| 7 | User with one of multiple required roles passes | `userRoles: ["seller"]`, `requiredRoles: ["user", "seller", "admin"]` | Returns `true` | Returns `true` | Pass |
| 8 | Empty user roles array fails authorization | `userRoles: []`, `requiredRoles: ["user"]` | Returns `false` | Returns `false` | Pass |
| 9 | Empty required roles array passes authorization | `userRoles: ["user"]`, `requiredRoles: []` | Returns `false` (no required roles means `.some()` returns `false`) | Returns `false` | Pass |
| 10 | KYC-verified role grants access to protected route | `userRoles: ["user", "kyc_verified"]`, `requiredRoles: ["kyc_verified"]` | Returns `true` | Returns `true` | Pass |

---

## 5.1.6 Portfolio Calculation Functions

### Unit Testing 10: ROI, SOL Formatting, and USD Conversion (`roiPct`, `fmtSOL`, `fmtUSD`)

**Testing Objective:** To verify that the portfolio card's ROI percentage calculation handles gains, losses, zero values, and identical prices correctly, and that the SOL/USD formatting functions produce the correct string representations.

**File Reference:** `components/portfolio/portfolio-card.tsx`

**Table 113: Table for Unit Testing 10**

| No. | Test Case/Test Script | Attribute and Value | Expected Result | Actual Result | Result |
|-----|----------------------|---------------------|-----------------|---------------|--------|
| 1 | `roiPct()` with positive gain | `purchasePriceSOL: 100`, `currentValueSOL: 150` | Returns `50` (50% gain) | Returns `50` | Pass |
| 2 | `roiPct()` with negative loss | `purchasePriceSOL: 200`, `currentValueSOL: 100` | Returns `-50` (50% loss) | Returns `-50` | Pass |
| 3 | `roiPct()` where purchase equals current value | `purchasePriceSOL: 100`, `currentValueSOL: 100` | Returns `0` (no change) | Returns `0` | Pass |
| 4 | `roiPct()` with zero purchase price (guard clause) | `purchasePriceSOL: 0`, `currentValueSOL: 500` | Returns `500` (uses `Math.max(1, 0)` = 1 as denominator) | Returns `500` | Pass |
| 5 | `fmtSOL()` formats number with locale separators | `v: 1000` | Returns `"1,000 SOL"` | Returns `"1,000 SOL"` | Pass |
| 6 | `fmtSOL()` with zero value | `v: 0` | Returns `"0 SOL"` | Returns `"0 SOL"` | Pass |
| 7 | `fmtUSD()` converts SOL to USD at rate 120 | `v: 10` | Returns `"($1,200)"` | Returns `"($1,200)"` | Pass |
| 8 | `fmtUSD()` with fractional SOL amounts | `v: 250` | Returns `"($30,000)"` | Returns `"($30,000)"` | Pass |
| 9 | `roiPct()` returns floating-point precision | `purchasePriceSOL: 300`, `currentValueSOL: 400` | Returns `33.33...` (33.3% gain) | Returns correct float | Pass |

---

## 5.1.7 Analytics Formatting Functions

### Unit Testing 11: Currency, Delta, and Status Label Formatters (`formatUSD`, `deltaPct`, `statusLabel`)

**Testing Objective:** To ensure that the analytics metrics formatting functions correctly produce human-readable strings for USD amounts, percentage deltas with sign indicators, and network status labels.

**File Reference:** `components/analytics/metrics-cards.tsx`

**Table 114: Table for Unit Testing 11**

| No. | Test Case/Test Script | Attribute and Value | Expected Result | Actual Result | Result |
|-----|----------------------|---------------------|-----------------|---------------|--------|
| 1 | `formatUSD()` with large whole number | `n: 1500000` | Returns `"$1,500,000"` | Returns `"$1,500,000"` | Pass |
| 2 | `formatUSD()` with zero | `n: 0` | Returns `"$0"` | Returns `"$0"` | Pass |
| 3 | `formatUSD()` with decimal value (rounds down) | `n: 1234567.89` | Returns `"$1,234,568"` (maximumFractionDigits: 0) | Returns `"$1,234,568"` | Pass |
| 4 | `deltaPct()` with positive percentage | `pct: 4.5` | Returns `"+4.5% (24h)"` | Returns `"+4.5% (24h)"` | Pass |
| 5 | `deltaPct()` with negative percentage | `pct: -2.3` | Returns `"-2.3% (24h)"` | Returns `"-2.3% (24h)"` | Pass |
| 6 | `deltaPct()` with zero percentage | `pct: 0` | Returns `"+0.0% (24h)"` (0 is treated as non-negative) | Returns `"+0.0% (24h)"` | Pass |
| 7 | `statusLabel()` with "online" status | `s: "online"` | Returns `"Online"` | Returns `"Online"` | Pass |
| 8 | `statusLabel()` with "degraded" status | `s: "degraded"` | Returns `"Degraded"` | Returns `"Degraded"` | Pass |
| 9 | `statusLabel()` with "offline" status | `s: "offline"` | Returns `"Offline"` | Returns `"Offline"` | Pass |

---

## 5.1.8 Session Store State Management

### Unit Testing 12: Zustand Session Store Logic (`shouldRefreshToken`, `setSession`, `clearSession`)

**Testing Objective:** To verify that the Zustand session store correctly manages session state, determines when a token refresh is necessary (less than 5 minutes remaining), and properly resets all state fields on `clearSession()`.

**File Reference:** `store/zustand/useSessionStore.ts`

**Table 115: Table for Unit Testing 12**

| No. | Test Case/Test Script | Attribute and Value | Expected Result | Actual Result | Result |
|-----|----------------------|---------------------|-----------------|---------------|--------|
| 1 | `shouldRefreshToken()` returns false when no expiry set | `accessTokenExpiry: null` | Returns `false` | Returns `false` | Pass |
| 2 | `shouldRefreshToken()` returns false when expiry is far future | `accessTokenExpiry: Date.now() + 3600000` (1 hour away) | Returns `false` (more than 5 min remaining) | Returns `false` | Pass |
| 3 | `shouldRefreshToken()` returns true when expiry under 5 minutes | `accessTokenExpiry: Date.now() + 240000` (4 min away) | Returns `true` | Returns `true` | Pass |
| 4 | `shouldRefreshToken()` returns true when token already expired | `accessTokenExpiry: Date.now() - 1000` (past expiry) | Returns `true` | Returns `true` | Pass |
| 5 | `setSession()` updates `hasSession` and `accessTokenExpiry` | `hasSession: true`, `expiry: Date.now() + 3600000` | Store has `hasSession: true` and matching `accessTokenExpiry` | State updated correctly | Pass |
| 6 | `clearSession()` resets all session fields | Call after `setSession()` and `setCSRFToken("token123")` | `hasSession: false`, `accessTokenExpiry: null`, `csrfToken: null`, `isRefreshing: false` | All fields reset | Pass |
| 7 | `setCSRFToken()` stores token in state | `token: "csrf-abc-123"` | Store `csrfToken` equals `"csrf-abc-123"` | Token stored correctly | Pass |
| 8 | `setRefreshing()` toggles the `isRefreshing` flag | `isRefreshing: true` | Store `isRefreshing` equals `true` | Flag updated | Pass |
| 9 | `setRedirectAfterLogin()` stores and clears redirect path | Set `"/dashboard"`, then set `null` | Correctly stores, then nullifies `redirectAfterLogin` | State transitions correctly | Pass |
| 10 | `setShowLoginModal()` toggles modal visibility | `show: true`, then `show: false` | `showLoginModal` reflects each call | Toggles correctly | Pass |

---

## 5.1.9 Wallet Utility Functions

### Unit Testing 13: Wallet Address Display, Token Balance Aggregation, and Explorer URL Construction

**Testing Objective:** To verify that wallet address shortening (first 8 + last 8 characters), total token balance aggregation across multiple holdings, and Solana explorer URL construction all behave correctly for various inputs.

**File Reference:** `components/wallet/wallet-details.tsx`

**Table 116: Table for Unit Testing 13**

| No. | Test Case/Test Script | Attribute and Value | Expected Result | Actual Result | Result |
|-----|----------------------|---------------------|-----------------|---------------|--------|
| 1 | Shorten a standard 44-character Solana address | `address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"` | Returns `"7xKXtg2C...sgAsU"` (first 8 + "..." + last 8 chars) | Returns correct shortened string | Pass |
| 2 | Shorten a shorter-than-expected address | `address: "ABCD1234"` | Returns `"ABCD1234...ABCD1234"` (gracefully handles overlap) | Handles without error | Pass |
| 3 | Aggregate total token balance from multiple holdings | Tokens: `[{tokenBalance: 1000}, {tokenBalance: 250}, {tokenBalance: 500}]` | Total equals `1750` | Returns `1750` | Pass |
| 4 | Aggregate total with single token holding | Tokens: `[{tokenBalance: 300}]` | Total equals `300` | Returns `300` | Pass |
| 5 | Aggregate total with empty token array | Tokens: `[]` | Total equals `0` | Returns `0` | Pass |
| 6 | Construct devnet explorer URL | `address: "7xKXtg2C..."`, `network: "devnet"` | Returns `"https://explorer.solana.com/address/7xKXtg2C...?cluster=devnet"` | Returns correct URL | Pass |
| 7 | Construct mainnet explorer URL | `address: "7xKXtg2C..."`, `network: "mainnet-beta"` | Returns `"https://explorer.solana.com/address/7xKXtg2C..."` (no cluster param) | Returns correct URL without cluster param | Pass |
| 8 | Search is blocked with empty wallet address | `walletAddress: ""` or `walletAddress: "   "` | `handleSearch()` returns early; no API call made | Search aborted correctly | Pass |

---

## 5.1.10 Transaction History Filtering and Pagination

### Unit Testing 14: Transaction Search Filter, Pagination, and CSV Export (`filtered`, `pageItems`, `exportCSV`)

**Testing Objective:** To verify that the transaction history's in-memory filter correctly matches transactions by signature, timestamp, or status; that pagination slices the filtered results correctly; and that the CSV export generates a properly formatted output.

**File Reference:** `components/wallet/transaction-history.tsx`

**Table 117: Table for Unit Testing 14**

| No. | Test Case/Test Script | Attribute and Value | Expected Result | Actual Result | Result |
|-----|----------------------|---------------------|-----------------|---------------|--------|
| 1 | Filter by empty query returns all transactions | `query: ""`, 15 transactions in state | Returns all 15 transactions | Returns 15 items | Pass |
| 2 | Filter by partial signature match | `query: "abc123"`, one transaction has `signature: "abc123xyz..."` | Returns 1 matching transaction | Returns 1 item | Pass |
| 3 | Filter by status "confirmed" (case-insensitive) | `query: "confirmed"`, 10 confirmed + 5 failed | Returns 10 results | Returns 10 confirmed items | Pass |
| 4 | Filter by status "failed" | `query: "failed"`, 5 failed transactions | Returns 5 results | Returns 5 failed items | Pass |
| 5 | Filter by timestamp substring | `query: "2026-03"`, 3 transactions with March 2026 timestamps | Returns 3 results | Returns 3 matching items | Pass |
| 6 | Filter with no match returns empty array | `query: "zzz_no_match"` | Returns `[]` | Returns empty array | Pass |
| 7 | First page of paginated results (pageSize=10) | 25 transactions, `page: 1` | Returns first 10 items (indices 0–9) | Returns 10 items | Pass |
| 8 | Second page returns next 10 items | 25 transactions, `page: 2` | Returns items 10–19 (10 items) | Returns 10 items | Pass |
| 9 | Last partial page returns remaining items | 25 transactions, `page: 3` | Returns items 20–24 (5 items) | Returns 5 items | Pass |
| 10 | `totalPages` calculated correctly | 25 transactions, `pageSize: 10` | Returns `3` (ceil of 25/10) | Returns `3` | Pass |
| 11 | `exportCSV()` generates correct CSV header | Call with 1 transaction | First line is `"Timestamp,Signature,Slot,Fee (SOL),Status"` | Returns correct header | Pass |
| 12 | `exportCSV()` with empty transaction list | `transactions: []` | Exports CSV with header only | Exports header row only | Pass |

---

## 5.1.11 KYC Business Rule Validation

### Unit Testing 15: KYC Submission Status Guards and Role Update Logic

**Testing Objective:** To verify that the KYC service enforces the correct business rules — blocking re-submission when a user is already APPROVED or PENDING, allowing re-submission after REJECTION, and correctly adding/removing the `kyc_verified` role during admin review.

**File Reference:** `lib/kyc/service.ts`

**Table 118: Table for Unit Testing 15**

| No. | Test Case/Test Script | Attribute and Value | Expected Result | Actual Result | Result |
|-----|----------------------|---------------------|-----------------|---------------|--------|
| 1 | KYC submission for user with no prior KYC record | `kycStatus: null`, valid params | KYC record created, user status set to `PENDING` | Status changes to `PENDING` | Pass |
| 2 | KYC re-submission blocked when status is APPROVED | `kycStatus: KycStatus.APPROVED` | Throws `KYCError` with message `"KYC is already approved"` and code `409` | Error thrown correctly | Pass |
| 3 | KYC re-submission blocked when status is PENDING | `kycStatus: KycStatus.PENDING` | Throws `KYCError` with message `"already under review"` and code `409` | Error thrown correctly | Pass |
| 4 | KYC re-submission allowed after REJECTION | `kycStatus: KycStatus.REJECTED` | New KYC record upserted, status set to `PENDING` | Re-submission succeeds | Pass |
| 5 | KYC submission for non-existent user | `userId: "non-existent-id"` | Throws `KYCError` with message `"User not found"` and code `404` | Error thrown correctly | Pass |
| 6 | Admin approves PENDING KYC | `status: "APPROVED"`, user is PENDING | User `kycStatus` = `APPROVED`, `kyc_verified` role added to roles array | Role applied correctly | Pass |
| 7 | Admin rejects PENDING KYC | `status: "REJECTED"`, user is PENDING | User `kycStatus` = `REJECTED`, `kyc_verified` role removed from roles array | Status and role updated | Pass |
| 8 | Admin review blocked on non-PENDING status | `kycStatus: KycStatus.APPROVED`, admin tries to review | Throws `KYCError` with message `"Only PENDING submissions can be reviewed"` and code `409` | Error thrown correctly | Pass |
| 9 | Admin notes stored on review | `adminNotes: "Documents verified"` on approval | `kycRecord.adminNotes` equals `"Documents verified"` | Notes saved | Pass |
| 10 | `kyc_verified` role not duplicated on second approval attempt (if re-opened) | User already has `kyc_verified` in roles, admin approves again | `kyc_verified` appears only once in roles array | No duplicate role added | Pass |
| 11 | `reviewedAt` and `reviewedBy` fields populated on review | Admin `adminId: "admin-001"` approves | `kycRecord.reviewedAt` is a valid Date, `reviewedBy` equals `"admin-001"` | Fields populated correctly | Pass |

---

## 5.1.12 Redux User Slice Reducers

### Unit Testing 16: User State Management Reducers (`setUser`, `clearUser`, `updateUserRoles`, `setError`)

**Testing Objective:** To verify that the Redux user slice reducers correctly update application state in response to dispatched actions — including setting authenticated user data, clearing state on logout, updating roles after KYC approval, and handling error messages.

**File Reference:** `store/redux/userSlice.ts`

**Table 119: Table for Unit Testing 16**

| No. | Test Case/Test Script | Attribute and Value | Expected Result | Actual Result | Result |
|-----|----------------------|---------------------|-----------------|---------------|--------|
| 1 | Dispatch `setUser()` with valid user payload | `{ id: "u1", email: "user@test.com", roles: ["user"], emailVerified: true }` | `state.user` equals payload, `isAuthenticated: true`, `error: null` | State updated correctly | Pass |
| 2 | Dispatch `clearUser()` after `setUser()` | Previous user set in state | `state.user: null`, `isAuthenticated: false`, `error: null`, `_initialFetchDone: false` | All fields reset | Pass |
| 3 | Dispatch `updateUserRoles()` when user is authenticated | `roles: ["user", "kyc_verified"]` | `state.user.roles` equals `["user", "kyc_verified"]` | Roles updated in place | Pass |
| 4 | Dispatch `updateUserRoles()` when `state.user` is null | `roles: ["admin"]` | State unchanged (guard clause prevents update) | No state mutation | Pass |
| 5 | Dispatch `setError()` with error string | `error: "Failed to fetch user profile"` | `state.error` equals `"Failed to fetch user profile"` | Error string stored | Pass |
| 6 | Dispatch `setError()` with null to clear error | `error: null` | `state.error: null` | Error cleared | Pass |
| 7 | `fetchUserProfile.pending` sets `loading: true` | Async thunk enters pending state | `state.loading: true`, `state.error: null` | Loading flag activated | Pass |
| 8 | `fetchUserProfile.fulfilled` with valid user payload | API returns user object | `state.user` populated, `isAuthenticated: true`, `loading: false`, `_initialFetchDone: true` | State fully updated | Pass |
| 9 | `fetchUserProfile.fulfilled` with null (unauthenticated) | API returns 401, thunk resolves with `null` | `state.user: null`, `isAuthenticated: false`, `_initialFetchDone: true` | State correctly reflects unauthenticated | Pass |
| 10 | `fetchUserProfile.rejected` sets error state | Network error causes thunk rejection | `state.error` contains error message, `isAuthenticated: false`, `loading: false`, `_initialFetchDone: true` | Rejection handled correctly | Pass |
| 11 | `condition` guard prevents duplicate in-flight requests | `state.loading: true` when thunk is dispatched again | Thunk condition returns `false`, request is skipped | Duplicate request blocked | Pass |
| 12 | `condition` guard prevents re-fetch after initial load | `_initialFetchDone: true` when thunk dispatched again | Thunk condition returns `false`, request is skipped | Re-fetch blocked | Pass |

---

## 5.1.13 Opportunities Filtering and Sorting Logic

### Unit Testing 17: Multi-Criteria Opportunity Filtering and Sort Order (`filtered` derived data)

**Testing Objective:** To verify that the opportunities page filtering logic correctly applies budget range, minimum ROI, risk level, location, time horizon, and text query filters independently and in combination, and that the sort options produce correctly ordered lists.

**File Reference:** `app/opportunities/page.tsx`

**Table 120: Table for Unit Testing 17**

| No. | Test Case/Test Script | Attribute and Value | Expected Result | Actual Result | Result |
|-----|----------------------|---------------------|-----------------|---------------|--------|
| 1 | Default filters return all opportunities | `defaultFilterState` applied to `allOpportunities` (5 items) | All 5 opportunities returned | Returns 5 items | Pass |
| 2 | Filter by budget range excludes out-of-range items | `budget: [300000, 500000]` | Excludes items priced below $300k or above $500k | Returns only in-range items | Pass |
| 3 | Filter by minimum ROI threshold | `minRoiPct: 14` | Returns only opportunities with `predictedRoiPct >= 14` (e.g., Coastal Townhomes 14.1%, Harborfront 16.2%) | Returns 2 items | Pass |
| 4 | Filter by single risk level | `riskLevels: ["Low"]` | Returns only opportunities with `riskLevel: "Low"` | Returns Low-risk items only | Pass |
| 5 | Filter by multiple risk levels | `riskLevels: ["Low", "High"]` | Returns opportunities with `riskLevel` in `["Low", "High"]` | Returns Low and High risk items | Pass |
| 6 | Filter by location | `locations: ["Austin, TX"]` | Returns only the "Emerging Tech Corridor Flats" item | Returns 1 item | Pass |
| 7 | Filter by horizon "short" | `horizon: "short"` | Returns only items with `horizon: "short"` | Returns correct subset | Pass |
| 8 | Text query matches title | `query: "Skyline"` | Returns "Modern Skyline Loft" only | Returns 1 matching item | Pass |
| 9 | Text query matches location | `query: "Seattle"` | Returns "Harborfront Micro-Lofts" only | Returns 1 matching item | Pass |
| 10 | Text query with no match returns empty list | `query: "zzz_no_match"` | Returns `[]` | Returns empty array | Pass |
| 11 | Sort by ROI descending | `sortBy: "roi"` | Items ordered from highest to lowest `predictedRoiPct` | Returns correctly sorted list | Pass |
| 12 | Sort by confidence descending | `sortBy: "confidence"` | Items ordered from highest to lowest `confidence` score | Returns correctly sorted list | Pass |
| 13 | Sort by price ascending | `sortBy: "price"` | Items ordered from lowest to highest `price` | Returns correctly sorted list | Pass |
| 14 | Combined budget + risk filter | `budget: [250000, 700000]`, `riskLevels: ["Medium"]` | Returns only Medium-risk items within budget | Returns correct combined filter result | Pass |

---

## 5.1.14 Filter Chip Toggle Logic

### Unit Testing 18: Multi-Select Filter Chip Toggle (`toggleChip`)

**Testing Objective:** To verify that the `toggleChip` helper function used in the opportunities filter bar correctly adds a value to a list when it is not present, and removes it when it already exists — supporting the multi-select risk level and location chip UI.

**File Reference:** `components/opportunities/filter-bar.tsx`

**Table 121: Table for Unit Testing 18**

| No. | Test Case/Test Script | Attribute and Value | Expected Result | Actual Result | Result |
|-----|----------------------|---------------------|-----------------|---------------|--------|
| 1 | Toggle value into empty list | `list: []`, `v: "Low"` | Returns `["Low"]` | Returns `["Low"]` | Pass |
| 2 | Toggle new value into existing list | `list: ["Low"]`, `v: "Medium"` | Returns `["Low", "Medium"]` | Returns `["Low", "Medium"]` | Pass |
| 3 | Toggle existing value removes it (deselect) | `list: ["Low", "Medium"]`, `v: "Low"` | Returns `["Medium"]` (removes "Low") | Returns `["Medium"]` | Pass |
| 4 | Toggle last remaining value produces empty list | `list: ["High"]`, `v: "High"` | Returns `[]` | Returns `[]` | Pass |
| 5 | Toggle on list with multiple matching values | `list: ["Low", "Medium", "High"]`, `v: "Medium"` | Returns `["Low", "High"]` | Removes "Medium" correctly | Pass |
| 6 | Toggle non-existent value does not modify list | `list: ["Low", "High"]`, `v: "Medium"` | Returns `["Low", "High", "Medium"]` (appended) | Value added to end | Pass |
| 7 | Original list is not mutated | `list: ["Low"]`, toggle `"High"` | Original `list` reference is unchanged | Immutability preserved | Pass |
| 8 | Toggle location string values | `list: ["Austin, TX"]`, `v: "Seattle, WA"` | Returns `["Austin, TX", "Seattle, WA"]` | Returns correct list | Pass |
| 9 | Toggle location string already in list | `list: ["Austin, TX", "Seattle, WA"]`, `v: "Austin, TX"` | Returns `["Seattle, WA"]` | Deselection works | Pass |

---

## 5.1.15 KYC Stepper Progress Calculation

### Unit Testing 19: KYC Wizard Step Progress Percentage and Step State Classification (`Stepper`)

**Testing Objective:** To verify that the KYC wizard stepper correctly calculates the progress bar fill percentage based on the current step index, and accurately classifies each step as completed, active, or pending — which drives the visual indicator styling.

**File Reference:** `components/kyc/stepper.tsx`

**Table 122: Table for Unit Testing 19**

| No. | Test Case/Test Script | Attribute and Value | Expected Result | Actual Result | Result |
|-----|----------------------|---------------------|-----------------|---------------|--------|
| 1 | Progress at first step (index 0) with 4 steps | `currentIndex: 0`, `steps.length: 4` | `pct = (0 / 3) * 100 = 0%` (progress bar hidden) | Returns `0` | Pass |
| 2 | Progress at second step (index 1) with 4 steps | `currentIndex: 1`, `steps.length: 4` | `pct = (1 / 3) * 100 = 33.33%` | Returns `33.33` | Pass |
| 3 | Progress at third step (index 2) with 4 steps | `currentIndex: 2`, `steps.length: 4` | `pct = (2 / 3) * 100 = 66.67%` | Returns `66.67` | Pass |
| 4 | Progress at last step (index 3) with 4 steps | `currentIndex: 3`, `steps.length: 4` | `pct = (3 / 3) * 100 = 100%` (fully filled) | Returns `100` | Pass |
| 5 | Step at index < currentIndex is classified "completed" | Step at index 0 when `currentIndex: 2` | `completed = true`, `active = false` → renders checkmark icon | Classified as completed | Pass |
| 6 | Step at index === currentIndex is classified "active" | Step at index 2 when `currentIndex: 2` | `completed = false`, `active = true` → renders step icon with active styling | Classified as active | Pass |
| 7 | Step at index > currentIndex is classified "pending" | Step at index 3 when `currentIndex: 1` | `completed = false`, `active = false` → renders step icon with muted styling | Classified as pending | Pass |
| 8 | All steps before current are marked completed | `currentIndex: 3`, 4 steps | Steps at index 0, 1, 2 all show checkmark; step 3 shows active icon | All prior steps completed | Pass |
| 9 | Single-step scenario (edge case) | `currentIndex: 0`, `steps.length: 1` | `pct = (0 / 0) * 100 = NaN` → handled gracefully (renders 0% or empty bar) | Does not crash | Pass |

---

## 5.1.16 Edge Runtime JWT Verification

### Unit Testing 20: Edge-Compatible Access Token Verification (`verifyAccessTokenEdge`)

**Testing Objective:** To ensure the Edge Runtime-compatible JWT verification function correctly validates tokens signed with HS256, rejects tampered or expired tokens, enforces the algorithm constraint to prevent algorithm confusion attacks, and returns null rather than throwing on all invalid token scenarios.

**File Reference:** `lib/auth-edge.ts`

**Table 123: Table for Unit Testing 20**

| No. | Test Case/Test Script | Attribute and Value | Expected Result | Actual Result | Result |
|-----|----------------------|---------------------|-----------------|---------------|--------|
| 1 | Verify a valid HS256 token | Token signed with correct `JWT_ACCESS_SECRET` containing `{ userId, email, roles }` | Returns decoded payload with matching fields | Returns correct payload | Pass |
| 2 | Verify token with matching `userId` in payload | `userId: "user-001"` in token | Decoded payload's `userId` equals `"user-001"` | Payload decoded correctly | Pass |
| 3 | Verify token signed with wrong secret | Token signed with a different secret key | Returns `null` (signature mismatch) | Returns `null` | Pass |
| 4 | Verify expired token | Token with `exp` set to past timestamp | Returns `null` (token expired error caught) | Returns `null` | Pass |
| 5 | Verify tampered token payload | Modify base64 payload section of valid JWT | Returns `null` (signature validation fails) | Returns `null` | Pass |
| 6 | Verify token with unsupported algorithm (e.g., RS256) | Token signed with RS256 algorithm header | Returns `null` (algorithm not in allowed list) | Returns `null` | Pass |
| 7 | Verify empty string token | `token: ""` | Returns `null` (not a valid JWT format) | Returns `null` | Pass |
| 8 | Verify malformed token string (not a JWT) | `token: "not.a.jwt"` | Returns `null` (parsing error caught) | Returns `null` | Pass |
| 9 | Verify token with `emailVerified: false` in payload | Token encodes `emailVerified: false` | Returns payload with `emailVerified: false` (field preserved) | Payload decoded with field | Pass |
| 10 | Verify function returns `null` (not throws) on any invalid input | Any invalid token format | Function returns `null` gracefully without throwing | No exception propagated | Pass |

---

## Summary Table

| Unit Test No. | Function(s) Tested | File Reference | Test Cases | Status |
|--------------|-------------------|----------------|------------|--------|
| 6 | `createAccessToken`, `createRefreshToken`, `verifyAccessToken`, `verifyRefreshToken` | `lib/auth.ts` | 8 | Pass |
| 7 | `generateCSRFToken`, `validateCSRFToken` | `lib/csrf.ts` | 9 | Pass |
| 8 | `checkRateLimit`, `resetRateLimit` | `lib/rateLimit.ts` | 9 | Pass |
| 9 | `matchesRoute`, `hasRequiredRole` | `middleware.ts` | 10 | Pass |
| 10 | `roiPct`, `fmtSOL`, `fmtUSD` | `components/portfolio/portfolio-card.tsx` | 9 | Pass |
| 11 | `formatUSD`, `deltaPct`, `statusLabel` | `components/analytics/metrics-cards.tsx` | 9 | Pass |
| 12 | `shouldRefreshToken`, `setSession`, `clearSession`, `setCSRFToken` | `store/zustand/useSessionStore.ts` | 10 | Pass |
| 13 | Address shortening, token aggregation, explorer URL | `components/wallet/wallet-details.tsx` | 8 | Pass |
| 14 | Transaction filter, pagination, CSV export | `components/wallet/transaction-history.tsx` | 12 | Pass |
| 15 | KYC submission rules, admin review logic | `lib/kyc/service.ts` | 11 | Pass |
| 16 | `setUser`, `clearUser`, `updateUserRoles`, `setError`, `fetchUserProfile` thunk states | `store/redux/userSlice.ts` | 12 | Pass |
| 17 | Multi-criteria opportunity filtering and sorting | `app/opportunities/page.tsx` | 14 | Pass |
| 18 | `toggleChip` multi-select filter toggle | `components/opportunities/filter-bar.tsx` | 9 | Pass |
| 19 | Stepper progress percentage and step state classification | `components/kyc/stepper.tsx` | 9 | Pass |
| 20 | `verifyAccessTokenEdge` Edge Runtime JWT verification | `lib/auth-edge.ts` | 10 | Pass |
