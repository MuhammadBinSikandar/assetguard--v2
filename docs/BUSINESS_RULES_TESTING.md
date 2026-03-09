# 5.3 Business Rules Testing

Business rules testing validates that the core business logic of the AssetGuard platform behaves correctly under all defined input conditions. Each decision table maps combinations of conditions to a specific system action, ensuring that every path through the rule set produces the correct and expected outcome.

This section covers **Decision Tables 3–12**, each grounded in one of the platform's ten primary business objectives (BO-1 through BO-10) and verified against the actual source code.

> **Note:** Decision Table 1 (Account Lockout Duration — `lib/auth.ts`) and Decision Table 2 (Rate Limit Actions — `lib/rateLimit.ts`) are documented in the preceding tables and are not repeated here.

---

## Decision Table 3 — KYC Verification Requirement Before Property Registration

**Business Objective BO-1:** Reduce property forgery cases by 95% through mandatory identity verification before any property can be registered.

This decision table governs the KYC re-submission and gating rules enforced in `lib/kyc/service.ts`. A user's current `kycStatus` (stored on the `User` record as `null`, `PENDING`, `REJECTED`, or `APPROVED`) determines whether they may submit KYC documents and subsequently register a property on the platform. An APPROVED status is the only state that grants full platform access; all other states result in a block at the submission or property-registration gate.

**Table 127 — Decision Table 3: KYC Submission Eligibility**

| Condition | Rule 1 | Rule 2 | Rule 3 | Rule 4 |
|---|---|---|---|---|
| User's current KYC status | `null` (never submitted) | `PENDING` | `REJECTED` | `APPROVED` |
| Documents provided by user | No | No | Yes | N/A |
| Re-submission permitted | No | No | Yes | No |
| **System Action** | **409 – No prior KYC; prompt user to begin submission** | **409 – "A KYC submission is already under review. Please wait for admin decision."** | **200 – KYC record upserted; user status set to PENDING** | **409 – "KYC is already approved. No re-submission is necessary."** |

**Table 128 — Test Cases: KYC Submission Eligibility**

| Test No. | User KYC Status | Documents Provided | Expected Result | Actual Result | Result |
|---|---|---|---|---|---|
| 1 | `null` | None | 409 – User prompted to begin fresh KYC submission | 409 – Blocked | Pass |
| 2 | `PENDING` | None | 409 – "A KYC submission is already under review. Please wait for admin decision." | 409 – Blocked | Pass |
| 3 | `REJECTED` | ID image + title document | 200 – KYC record upserted via `prisma.kYCRecord.upsert`; user `kycStatus` → `PENDING` | 200 – Submitted | Pass |
| 4 | `APPROVED` | N/A | 409 – "KYC is already approved. No re-submission is necessary." | 409 – Blocked | Pass |

---

## Decision Table 4 — Wallet Ownership Verification Before Property Linking

**Business Objective BO-4:** Prevent duplicate property sales and fraudulent transfers by verifying cryptographic Solana wallet ownership through Ed25519 signature verification before any wallet is linked to a user account.

This table reflects the full verification chain in `app/api/wallet/link/route.ts`. The endpoint authenticates the caller via a JWT access-token cookie, validates the Ed25519 signature against a deterministic expected message (`"Authorize linking wallet {pubkey} to User ID {userId} on AG Platform."`), and checks that the wallet address is not already assigned to a different account record in the database.

**Table 129 — Decision Table 4: Wallet Linking Eligibility**

| Condition | Rule 1 | Rule 2 | Rule 3 | Rule 4 |
|---|---|---|---|---|
| Valid JWT access-token cookie present | No | Yes | Yes | Yes |
| Ed25519 signature matches expected message | N/A | No | Yes | Yes |
| Wallet address already linked to another user | N/A | N/A | Yes | No |
| **System Action** | **401 – Unauthorized; no session** | **403 – "Signature verification failed. You do not own this wallet."** | **409 – "This wallet is already linked to another account"** | **200 – Wallet verified and linked; audit log created** |

**Table 130 — Test Cases: Wallet Linking Eligibility**

| Test No. | JWT Present | Signature Valid | Wallet Pre-linked to Another User | Expected Result | Actual Result | Result |
|---|---|---|---|---|---|---|
| 1 | No | N/A | N/A | 401 – Unauthorized | 401 – Unauthorized | Pass |
| 2 | Yes | No (wrong private key) | N/A | 403 – "Signature verification failed. You do not own this wallet." | 403 – Forbidden | Pass |
| 3 | Yes | Yes | Yes (different `userId`) | 409 – "This wallet is already linked to another account" | 409 – Conflict | Pass |
| 4 | Yes | Yes | No | 200 – `{ success: true, walletAddress, message: "Wallet verified and linked successfully" }` | 200 – OK | Pass |

---

## Decision Table 5 — Minimum Fractional Investment Token Pricing

**Business Objective BO-5:** Lower the minimum entry barrier for real-estate investment to as low as $100 by dividing each tokenised property into exactly 1,000 equal-value tokens.

This table reflects the tokenisation formula in `components/register/review.tsx`: `perTokenUSD = marketValue / 1000`. Properties whose assessed market value produces a token price below $100 do not satisfy the BO-5 minimum-entry threshold; those at or above the threshold are displayed with their calculated per-token price and may proceed through registration. The SOL-denominated price is additionally derived as `perTokenSOL = perTokenUSD / solPrice`, with a $250 fallback from `app/api/price/sol/route.ts`.

**Table 131 — Decision Table 5: Token Price Threshold Validation**

| Condition | Rule 1 | Rule 2 | Rule 3 | Rule 4 |
|---|---|---|---|---|
| Property market value (USD) | < $100,000 | $100,000 – $999,999 | $1,000,000 – $9,999,999 | ≥ $10,000,000 |
| Calculated `perTokenUSD` (marketValue ÷ 1,000) | < $100 | $100 – $999 | $1,000 – $9,999 | ≥ $10,000 |
| Meets $100 minimum entry threshold (BO-5) | No | Yes | Yes | Yes |
| **System Action** | **Block registration; display minimum price warning** | **Allow – display token price and SOL equivalent** | **Allow – display token price and SOL equivalent** | **Allow – display token price and SOL equivalent** |

**Table 132 — Test Cases: Token Price Threshold Validation**

| Test No. | Market Value (USD) | `perTokenUSD` (value ÷ 1,000) | Meets Minimum | Expected Result | Actual Result | Result |
|---|---|---|---|---|---|---|
| 1 | $50,000 | $50.00 | No | Registration blocked; warning shown — token price below $100 minimum | Blocked | Pass |
| 2 | $250,000 | $250.00 | Yes | Token price $250.00 displayed; `perTokenSOL` = $1.00 at $250/SOL; registration proceeds | Displayed | Pass |
| 3 | $2,000,000 | $2,000.00 | Yes | Token price $2,000.00 displayed; registration proceeds | Displayed | Pass |
| 4 | $6,117,000 | $6,117.00 | Yes | Token price $6,117.00 displayed (sample BBL data); registration proceeds | Displayed | Pass |

---

## Decision Table 6 — Fractional Ownership Partial Liquidation Rules

**Business Objective BO-3:** Allow investors to partially liquidate their fractionalized property holdings at any time without requiring a full-property sale.

This table defines the conditions under which a `"sale"` transaction is permitted via `app/api/transactions/route.ts`. Two prerequisite gates must be cleared before any sell order is processed: the user must hold `kyc_verified` role (granted by `adminReviewKYC` in `lib/kyc/service.ts`) and their current token balance must be equal to or greater than the quantity being sold. Partial and full liquidations are both valid provided the balance condition holds.

**Table 133 — Decision Table 6: Partial Liquidation Eligibility**

| Condition | Rule 1 | Rule 2 | Rule 3 | Rule 4 |
|---|---|---|---|---|
| User holds `kyc_verified` role (KYC status APPROVED) | No | Yes | Yes | Yes |
| Token balance ≥ quantity to sell | N/A | No | Yes (partial sale) | Yes (full sale) |
| Transaction type submitted | N/A | `sale` | `sale` | `sale` |
| **System Action** | **Deny – user lacks `kyc_verified` role** | **Deny – insufficient token balance** | **Allow – partial liquidation; remaining tokens retained** | **Allow – full liquidation; position closed** |

**Table 134 — Test Cases: Partial Liquidation Eligibility**

| Test No. | KYC Approved (`kyc_verified`) | Tokens Available | Sell Quantity | Expected Result | Actual Result | Result |
|---|---|---|---|---|---|---|
| 1 | No | N/A | 50 tokens | Sale denied – `kyc_verified` role absent | Denied | Pass |
| 2 | Yes | 100 tokens | 200 tokens | Sale denied – requested quantity (200) exceeds balance (100) | Denied | Pass |
| 3 | Yes | 500 tokens | 250 tokens | Partial sale of 250 tokens processed; 250 tokens remain in portfolio | Processed | Pass |
| 4 | Yes | 1,000 tokens | 1,000 tokens | Full liquidation processed; position = 0; property listing status updated | Processed | Pass |

---

## Decision Table 7 — Property Document Verification Status Workflow

**Business Objective BO-6:** Reduce property verification processing time to under 2 minutes through a structured, status-driven document upload workflow.

This table captures the `UploadStatus` state machine from `components/register/document-upload.tsx` and the allowed MIME types defined in `lib/kyc/types.ts` (`ALLOWED_MIME_TYPES`: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`; max 5 MB). The title deed progresses through `"Pending"` → `"Uploaded"` → `"Verified"` based on user upload actions and subsequent admin review via `adminReviewKYC` in `lib/kyc/service.ts`.

**Table 135 — Decision Table 7: Document Upload Status Transitions**

| Condition | Rule 1 | Rule 2 | Rule 3 | Rule 4 |
|---|---|---|---|---|
| File selected by user | No | Yes | Yes | Yes |
| MIME type is in `ALLOWED_MIME_TYPES` | N/A | No | Yes | Yes |
| Upload triggered | N/A | Yes | Yes | Yes |
| Admin marks document Verified (KYC APPROVED) | N/A | N/A | No | Yes |
| **Document Status** | **`"Pending"` – cannot advance to wallet step** | **Rejected – invalid file type or size** | **`"Uploaded"` – stored at `/uploads/kyc/`** | **`"Verified"` – `kyc_verified` role added** |

**Table 136 — Test Cases: Document Upload Status Transitions**

| Test No. | File Selected | MIME Type | Admin Reviewed | Expected Status | Actual Status | Result |
|---|---|---|---|---|---|---|
| 1 | No | N/A | No | `"Pending"` — user cannot proceed to wallet step | Pending | Pass |
| 2 | Yes | `text/plain` | No | Rejected – MIME type not in allowed list (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`) | Rejected | Pass |
| 3 | Yes | `application/pdf` | No | `"Uploaded"` – file saved as `user_{userId}_{timestamp}_{original}`; user may continue | Uploaded | Pass |
| 4 | Yes | `image/jpeg` | Yes (APPROVED) | `"Verified"` – KYC record approved; `kyc_verified` role appended to user `roles` array | Verified | Pass |

---

## Decision Table 8 — Smart Contract Execution Conditions (Transaction Time Compliance)

**Business Objective BO-2:** Reduce end-to-end property transaction completion time to under 2 hours using smart contract automation on the Solana blockchain.

This table defines valid and breach outcomes for the transaction lifecycle modelled in `app/api/transactions/route.ts`, where each transaction record carries a `type` (`purchase | sale | transfer | registration`) and a `status` (`completed | pending | failed`). Smart contracting eliminates multi-day escrow delays; all four transaction types must settle within the 2-hour SLA to comply with BO-2.

**Table 137 — Decision Table 8: Transaction Execution Outcome**

| Condition | Rule 1 | Rule 2 | Rule 3 | Rule 4 |
|---|---|---|---|---|
| Transaction type | `purchase` | `transfer` | `sale` | `registration` |
| Execution time within 2-hour SLA | Yes | Yes | No | No |
| On-chain confirmation received | Yes | No | N/A | N/A |
| **Transaction Status** | **`completed` – hash and timestamp recorded** | **`pending` – awaiting on-chain confirmation** | **`failed` – SLA breach; admin alerted** | **`pending` – queued for manual review** |

**Table 138 — Test Cases: Transaction Execution Outcome**

| Test No. | Type | Within 2-Hour SLA | On-Chain Confirmed | Expected Status | Actual Status | Result |
|---|---|---|---|---|---|---|
| 1 | `purchase` | Yes (< 15 sec) | Yes | `completed`; `hash` and `timestamp` stored in transaction record | completed | Pass |
| 2 | `transfer` | Yes (< 2 hr) | No | `pending`; UI displays awaiting confirmation | pending | Pass |
| 3 | `sale` | No (> 2 hr) | N/A | `failed`; SLA breach logged; admin notification triggered | failed | Pass |
| 4 | `registration` | No (> 2 hr) | N/A | `pending`; record flagged for manual review queue | pending | Pass |

---

## Decision Table 9 — Solana Transaction Confirmation Status Handling

**Business Objective BO-9:** Display Solana transaction confirmation to the user interface within 5 seconds of final on-chain settlement.

This table reflects the confirmation lifecycle surfaced in `app/api/explorer/transactions/route.ts` and the transaction status model. On Solana, economic finality is reached at 32 or more confirmations; transactions with fewer confirmations remain `pending` in the explorer view. A validator rollback sets the status to `failed` and prompts the user to retry or request a refund.

**Table 139 — Decision Table 9: On-Chain Confirmation Status Mapping**

| Condition | Rule 1 | Rule 2 | Rule 3 | Rule 4 |
|---|---|---|---|---|
| On-chain confirmations received | 0 | 1 – 31 | 32 or more | Rollback detected |
| Transaction status assigned | `pending` | `pending` (in progress) | `completed` | `failed` |
| UI feedback displayed | Awaiting broadcast | Confirmation in progress | Confirmed and finalised | Transaction reverted |
| **System Action** | **Poll for confirmation; display loading spinner** | **Show confirmation progress indicator (n/32)** | **Mark completed; display transaction hash in explorer** | **Mark failed; enable retry button; prompt refund** |

**Table 140 — Test Cases: On-Chain Confirmation Status Mapping**

| Test No. | Confirmations | Expected Status | Expected UI Message | Actual Result | Result |
|---|---|---|---|---|---|
| 1 | 0 | `pending` | "Awaiting broadcast" — spinner shown | pending – spinner displayed | Pass |
| 2 | 15 | `pending` | "Confirmation in progress (15/32)" — progress indicator shown | pending – progress shown | Pass |
| 3 | 32 | `completed` | "Transaction confirmed" — `hash` link displayed in explorer | completed – hash shown | Pass |
| 4 | Rollback | `failed` | "Transaction reverted" — retry and refund options enabled | failed – retry enabled | Pass |

---

## Decision Table 10 — Transaction Fee Comparison (Traditional vs. Solana Blockchain)

**Business Objective BO-7:** Reduce real-estate transaction costs by at least 70% relative to traditional intermediary fees by processing settlements on the Solana blockchain.

This table models the fee differential using the live SOL price feed from `app/api/price/sol/route.ts` (CoinGecko, 60-second revalidation, $250 fallback) and the tokenisation values calculated in `components/register/review.tsx`. Traditional property transfers incur 1–5% of transaction value in agent, legal, and escrow fees; Solana on-chain fees are fixed at approximately $0.00025 per transaction regardless of value, representing a saving far exceeding the 70% BO-7 target.

**Table 141 — Decision Table 10: Transaction Fee Calculation by Rail**

| Condition | Rule 1 | Rule 2 | Rule 3 | Rule 4 |
|---|---|---|---|---|
| Payment rail | Traditional (wire / escrow) | Traditional (wire / escrow) | Solana blockchain | Solana blockchain |
| Transaction value (USD) | $250,000 | $2,000,000 | $250,000 | $2,000,000 |
| Applicable fee rate | 3 – 5% | 1 – 3% + escrow | ~$0.00025 per tx | ~$0.00025 per tx |
| **Estimated Fee (USD)** | **$7,500 – $12,500** | **$20,000 – $60,000** | **< $0.001** | **< $0.001** |
| **Cost Saving vs. Traditional Baseline** | **N/A (baseline)** | **N/A (baseline)** | **≥ 99.9% (exceeds 70% target)** | **≥ 99.9% (exceeds 70% target)** |

**Table 142 — Test Cases: Transaction Fee Comparison**

| Test No. | Rail | Transaction Value | Fee Rate Applied | Estimated Fee (USD) | Cost Saving | Result |
|---|---|---|---|---|---|---|
| 1 | Traditional | $250,000 | 4% (midpoint) | $10,000 | Baseline | Pass |
| 2 | Traditional | $2,000,000 | 2% + escrow | $40,000 – $60,000 | Baseline | Pass |
| 3 | Solana | $250,000 | Fixed ~$0.00025 per tx | < $0.001 | > 99.9% — exceeds 70% BO-7 target | Pass |
| 4 | Solana | $2,000,000 | Fixed ~$0.00025 per tx | < $0.001 | > 99.9% — exceeds 70% BO-7 target | Pass |

---

## Decision Table 11 — AI-Driven Opportunity Recommendation Filtering

**Business Objective BO-8:** Surface high-ROI investment opportunities to investors using ML-driven filtering that respects each investor's risk tolerance, budget, and minimum return expectations.

This table reflects the multi-criteria filter and sort logic in `app/opportunities/page.tsx`, backed by `Opportunity` data from `components/opportunities/data.ts`. Each opportunity carries `predictedRoiPct`, `confidence` (0–100), `riskLevel` (`"Low" | "Medium" | "High"`), `horizon` (`"short" | "long"`), and `price`. The `toggleChip` helper in `components/opportunities/filter-bar.tsx` manages the active risk-level chip set, and valid sort keys are `"roi"` (descending), `"confidence"` (descending), and `"price"` (ascending).

**Table 143 — Decision Table 11: Opportunity Filter Outcome**

| Condition | Rule 1 | Rule 2 | Rule 3 | Rule 4 |
|---|---|---|---|---|
| Active risk-level filter (`riskLevels`) | `["Low"]` | `["Low", "Medium"]` | `["High"]` | `[]` (no filter — all) |
| Minimum ROI threshold (`minRoiPct`) | ≥ 8% | ≥ 10% | ≥ 15% | ≥ 8% |
| Budget ceiling (`price ≤`) | $350,000 | $550,000 | $750,000 | Unlimited |
| Sort key (`sortBy`) | `"roi"` desc | `"confidence"` desc | `"price"` asc | `"roi"` desc |
| **Filter Result** | **Low-risk props ≤ $350 k; ROI ≥ 8%; highest ROI first** | **Low/Medium-risk ≤ $550 k; ROI ≥ 10%; highest confidence first** | **High-risk ≤ $750 k; ROI ≥ 15%; cheapest first** | **All props with ROI ≥ 8%; highest ROI first** |

**Table 144 — Test Cases: Opportunity Filter Outcome**

| Test No. | Risk Filter | Min ROI | Budget Ceiling | Sort | Expected Matches | Actual Result | Result |
|---|---|---|---|---|---|---|---|
| 1 | `["Low"]` | 8% | $350,000 | ROI desc | Low-risk properties ≤ $350 k matching ROI ≥ 8% (e.g. East Harlem – 9.6% ROI) returned; highest ROI first | Filtered list returned | Pass |
| 2 | `["Low", "Medium"]` | 10% | $550,000 | Confidence desc | Low and Medium-risk properties ≤ $550 k with ROI ≥ 10% returned; highest confidence first | Filtered list returned | Pass |
| 3 | `["High"]` | 15% | $750,000 | Price asc | High-risk properties ≤ $750 k with ROI ≥ 15% returned; cheapest first (empty if none qualify) | Filtered/empty list | Pass |
| 4 | `[]` (all) | 8% | Unlimited | ROI desc | All properties with ROI ≥ 8% returned; Crown Heights (16.2% ROI) ranked first | Full sorted list | Pass |

---

## Decision Table 12 — Real-Time Property Valuation Accuracy and Timeliness

**Business Objective BO-10:** Deliver real-time property valuations with no more than ±2% price deviation from market by using live SOL/USD exchange rates refreshed at 60-second intervals.

This table governs the SOL price feed behaviour in `app/api/price/sol/route.ts` (Next.js `revalidate = 60`, CoinGecko source, hardcoded $250 USD fallback on API failure) and the downstream effect on per-token pricing in `components/register/review.tsx` (`perTokenSOL = perTokenUSD / solPrice`). A stale feed or API outage risks violating the ±2% tolerance; the system must detect and correct deviations on next revalidation.

**Table 145 — Decision Table 12: SOL Price Feed Behaviour**

| Condition | Rule 1 | Rule 2 | Rule 3 | Rule 4 |
|---|---|---|---|---|
| CoinGecko API reachable | No | Yes | Yes | Yes |
| Cache age since last revalidation | N/A | < 60 s | 60 – 300 s | > 300 s |
| SOL price delta from prior cached value | N/A | ≤ 2% | ≤ 2% | > 2% |
| **Price Source Used** | **$250 hardcoded fallback** | **Cached live price (< 60 s old)** | **Revalidated live price** | **Revalidated live price (deviation corrected)** |
| **Valuation Status** | **Approximate – fallback warning displayed** | **Current – within BO-10 ±2% tolerance** | **Refreshed – within BO-10 ±2% tolerance** | **Updated – price delta corrected on revalidation** |

**Table 146 — Test Cases: SOL Price Feed Behaviour**

| Test No. | API Available | Cache Age | Price Delta | Price Used | Expected Status | Actual Result | Result |
|---|---|---|---|---|---|---|---|
| 1 | No | N/A | N/A | $250.00 (fallback from catch block) | Approximate – fallback warning shown to user | $250 applied | Pass |
| 2 | Yes | 30 s | 0.5% | Cached live price (e.g. $148.32) | Current – delta within ±2%; no revalidation needed | Cached price used | Pass |
| 3 | Yes | 90 s | 1.8% | Revalidated live price (Next.js ISR triggers refetch) | Refreshed – delta within ±2% after revalidation | Revalidated price used | Pass |
| 4 | Yes | 310 s | 3.5% | Revalidated live price (forced cache miss) | Updated – deviation corrected; `perTokenSOL` recalculated | Corrected price used | Pass |
