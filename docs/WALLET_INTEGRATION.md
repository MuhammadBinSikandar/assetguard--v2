# Module 13: User Wallet Integration — Implementation Documentation

> **Date:** February 12, 2026
> **Status:** MVP Complete
> **Network:** Solana Devnet (configurable via env)

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Files Created / Modified](#files-created--modified)
4. [Security: Wallet Ownership Proof](#security-wallet-ownership-proof)
5. [Components](#components)
6. [API Routes](#api-routes)
7. [Database Changes](#database-changes)
8. [Environment Variables](#environment-variables)
9. [Dependencies Added](#dependencies-added)
10. [Auth UX Improvements](#auth-ux-improvements)
11. [Feature Mapping (FE-1 through FE-5)](#feature-mapping)

---

## Overview

This module integrates Solana wallet connectivity into the AssetGuard platform. Users can connect a Phantom (or any Wallet Standard-compatible) browser extension, **prove ownership** via a signed message, and then view real on-chain data including SOL balance, SPL token holdings, and transaction history.

Key design decisions:
- **Ownership proof required** — Users cannot simply paste a public key. They must sign a message to link a wallet, preventing impersonation.
- **Wallet Standard auto-detection** — Instead of hardcoding adapter constructors (which redirect to phantom.com if the extension isn't found), we pass an empty wallets array and let the Wallet Standard protocol discover installed extensions automatically.
- **Scoped provider** — `SolanaWalletProvider` wraps only the `/wallet` page, not the entire app, to avoid unnecessary bundle size on other routes.

---

## Architecture

```
User Browser (Phantom Extension)
        │
        ▼
┌─────────────────────────────┐
│  /wallet page               │
│  └─ SolanaWalletProvider    │  ← Wraps page with Connection + Wallet + Modal
│     ├─ WalletLinker         │  ← Connect → Sign → Verify flow
│     ├─ WalletHeader         │  ← Real SOL balance + address
│     ├─ TokenHoldings        │  ← On-chain SPL + Token-2022 accounts
│     ├─ TransactionHistory   │  ← Last 20 signatures from chain
│     └─ UserAssetDashboard   │  ← AG-symbol Token-2022 assets
└─────────────────────────────┘
        │
        ▼ POST /api/wallet/link
┌─────────────────────────────┐
│  Backend (Next.js API)      │
│  1. Verify JWT (auth)       │
│  2. Verify Ed25519 sig      │
│  3. Check wallet not taken  │
│  4. Save to User.walletAddr │
│  5. Audit log               │
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│  PostgreSQL (Neon)          │
│  users.walletAddress        │
└─────────────────────────────┘
```

---

## Files Created / Modified

### New Files

| File | Purpose |
|------|---------|
| `components/wallet/solana-wallet-provider.tsx` | Solana Connection, Wallet, and Modal providers (Wallet Standard auto-detection) |
| `components/wallet/wallet-linker.tsx` | Connect → Sign → Verify ownership flow UI |
| `components/wallet/user-asset-dashboard.tsx` | AG Token-2022 asset grid with metadata decoding |
| `app/api/wallet/link/route.ts` | Backend: Ed25519 signature verification + wallet persistence |

### Modified Files

| File | Changes |
|------|---------|
| `app/wallet/page.tsx` | Replaced mock `connected` toggle with real Solana wallet integration; added auth hydration check |
| `components/wallet/wallet-header.tsx` | Replaced hardcoded `$24,530.42` with real SOL balance from `getBalance()`; added Explorer link |
| `components/wallet/token-holdings.tsx` | Replaced mock data with real `getParsedTokenAccountsByOwner()` for both SPL Token and Token-2022 |
| `components/wallet/transaction-history.tsx` | Replaced mock data with real `getSignaturesForAddress()` (last 20 transactions) |
| `middleware.ts` | Added guest-only route redirects (`/`, `/login`, `/signup`, etc.) for authenticated users |
| `store/redux/userSlice.ts` | Exported `selectIsHydrated` selector to distinguish "not yet checked" from "not logged in" |
| `components/dashboard/topbar.tsx` | Shows skeleton avatar/name while auth is loading instead of flashing "User" |
| `package.json` | Added Solana dependencies |
| `docker-compose.yml` | Added `NEXT_PUBLIC_SOLANA_NETWORK` and `NEXT_PUBLIC_SOLANA_RPC_URL` env vars |
| `.env` | Added Solana configuration variables |

---

## Security: Wallet Ownership Proof

### The Problem
If a user could simply paste a wallet address, a malicious actor could claim any whale's address as their own.

### The Solution (3-Step Link)

1. **Connect** — User connects their Phantom/Solflare wallet via the Wallet Standard adapter.
2. **Sign** — The user signs a deterministic message:
   ```
   Authorize linking wallet <PUBLIC_KEY> to User ID <USER_ID> on AG Platform.
   ```
   This is a free off-chain signature (0 gas). It proves the user holds the private key.
3. **Verify** — The backend (`/api/wallet/link`) verifies the Ed25519 signature using `tweetnacl`, then saves the wallet address to the `User` record.

### Backend Verification Logic (`app/api/wallet/link/route.ts`)

- Authenticates the user via JWT access token cookie
- Validates the public key format
- Reconstructs the expected message and checks it matches (prevents replay with altered messages)
- Verifies the Ed25519 signature using `nacl.sign.detached.verify()`
- Checks the wallet isn't already linked to a different account (409 Conflict)
- Persists `walletAddress` to the `users` table
- Creates an audit log entry

---

## Components

### `SolanaWalletProvider`
**File:** `components/wallet/solana-wallet-provider.tsx`

Wraps children with `ConnectionProvider`, `WalletProvider`, and `WalletModalProvider`. Uses an empty wallets array — installed wallets are discovered automatically via the Wallet Standard protocol. This prevents the adapter from redirecting to phantom.com when the extension is already installed.

### `WalletLinker`
**File:** `components/wallet/wallet-linker.tsx`

**Props:** `userId`, `onLinked?`, `linkedWallet?`

- If `linkedWallet` is set → shows a "Wallet Verified" badge with the address
- If not → shows the `WalletMultiButton` (connect) + "Verify & Link Wallet" button
- Handles errors, loading states, and disconnect

### `WalletHeader`
**File:** `components/wallet/wallet-header.tsx`

**Props:** `onDeposit`, `onWithdraw`, `walletAddress?`

- Fetches real SOL balance via `connection.getBalance()`
- Shows shortened address with copy button
- Links to Solana Explorer (respects network setting)
- Has a refresh button

### `TokenHoldings`
**File:** `components/wallet/token-holdings.tsx`

**Props:** `walletAddress?`

- Fetches token accounts from **both** `TOKEN_PROGRAM_ID` and `TOKEN_2022_PROGRAM_ID` via `getParsedTokenAccountsByOwner()`
- Filters out zero-balance accounts
- Expandable rows showing full mint address, decimals, and Explorer link
- Skeleton loading state and empty state

### `TransactionHistory`
**File:** `components/wallet/transaction-history.tsx`

**Props:** `walletAddress?`

- Fetches last 20 transactions via `getSignaturesForAddress()`
- Shows timestamp, signature (truncated), slot, fee, confirmation status
- Each row links to the transaction on Solana Explorer
- Search filter, pagination, CSV export

### `UserAssetDashboard`
**File:** `components/wallet/user-asset-dashboard.tsx`

**Props:** `walletAddress`

- Fetches Token-2022 accounts, then for each fetches the mint account data
- Deserializes metadata using `@solana/spl-token-metadata` `unpack()`
- Filters to only tokens with symbol `"AG"`
- Extracts `valuation`, `price_per_token`, `property_id` from `additionalMetadata`
- Grid layout with property cards showing valuation, price/token, balance, holdings value
- Sell button (UI only, disabled for MVP)

---

## API Routes

### `POST /api/wallet/link`

Links a verified wallet to the authenticated user.

**Request Body:**
```json
{
  "publicKey": "Base58 public key",
  "signature": "Base58 encoded Ed25519 signature",
  "message": "The exact message that was signed"
}
```

**Auth:** Requires valid `access_token` cookie.

**Responses:**
| Status | Description |
|--------|-------------|
| 200 | `{ success: true, walletAddress: "..." }` |
| 400 | Missing fields or invalid public key |
| 401 | Not authenticated |
| 403 | Signature verification failed |
| 409 | Wallet already linked to another account |
| 500 | Internal error |

### `GET /api/wallet/link`

Returns the currently linked wallet address for the authenticated user.

**Response:**
```json
{
  "walletAddress": "AbC123..." | null,
  "kycStatus": "APPROVED"
}
```

---

## Database Changes

No schema migration was needed. The `User` model already has:

```prisma
model User {
  ...
  walletAddress  String?  @unique
  ...
  @@index([walletAddress])
}
```

The wallet link API writes to this field after successful signature verification.

---

## Environment Variables

Added to `.env` and `docker-compose.yml`:

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_SOLANA_NETWORK` | `devnet` | Solana cluster: `devnet`, `testnet`, or `mainnet-beta` |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | `""` (empty → uses public RPC) | Optional custom RPC endpoint (Helius, QuickNode, etc.) |

The provider uses `||` (not `??`) so an empty string correctly falls back to `clusterApiUrl(network)`.

---

## Dependencies Added

Added to `package.json`:

| Package | Purpose |
|---------|---------|
| `@solana/web3.js` | Core Solana SDK (Connection, PublicKey, etc.) |
| `@solana/spl-token` | SPL Token program ID constants |
| `@solana/spl-token-metadata` | Token-2022 metadata deserialization |
| `@solana/wallet-adapter-base` | Base types for wallet adapters |
| `@solana/wallet-adapter-react` | React hooks (`useWallet`, `useConnection`) |
| `@solana/wallet-adapter-react-ui` | `WalletMultiButton`, `WalletModalProvider` |
| `bs58` | Base58 encoding for signatures |
| `tweetnacl` | Ed25519 signature verification (backend) |

**Not included:** `@solana/wallet-adapter-wallets` — this meta-package pulls in Trezor/Ledger hardware wallet adapters that require native `usb` compilation (Python + node-gyp). Instead, we rely on Wallet Standard auto-detection which finds Phantom/Solflare without native deps.

---

## Auth UX Improvements

### 1. Flash of Unauthenticated State (FOUC) Fix

**Problem:** On page refresh, Redux starts with `isAuthenticated = false`. While `/api/auth/me` is in-flight, all components rendered the unauthenticated UI ("Sign in Required", "User" placeholder).

**Fix:** Exposed the existing `_initialFetchDone` flag as `selectIsHydrated`. Components now show:
- **Skeleton** while `isHydrated === false` (auth check in progress)
- **Actual UI** once `isHydrated === true` (auth check resolved)

Affected: `TopBar` (skeleton avatar), Wallet page (skeleton instead of "Sign in Required").

### 2. Logged-In User Redirect

**Problem:** Authenticated users visiting `/`, `/login`, `/signup`, etc. would see the public homepage/login form.

**Fix:** Added these routes to `GUEST_ONLY_ROUTES` in `middleware.ts`. The middleware checks the access token cookie and issues a server-side 302 redirect to `/admin` (admins) or `/dashboard` (regular users) before the page renders. Zero client-side flash.

---

## Feature Mapping

| Feature | Status | Implementation |
|---------|--------|----------------|
| **FE-1:** Connect Solana wallets (Phantom) | ✅ Done | `SolanaWalletProvider` + `WalletLinker` with Wallet Standard auto-detection |
| **FE-2:** Real-time balances & transaction history | ✅ Done | `WalletHeader` (SOL balance), `TokenHoldings` (SPL tokens), `TransactionHistory` (last 20 txs) — all fetched from chain |
| **FE-3:** Buy/sell property fractions from wallet | 🔲 UI Only | Sell buttons present but disabled ("Coming Soon") — backend transfer logic is a future module |
| **FE-4:** MFA for wallet access | ✅ Partial | Wallet ownership proved via Ed25519 signature; platform MFA via existing 2FA system; deeper transaction-level MFA is future work |
| **FE-5:** Detailed transaction log | ✅ Done | `TransactionHistory` — timestamps, signatures, slots, fees, status, Explorer links, search, pagination, CSV export |

---

## How to Test

1. **Start:** `docker compose up --build`
2. **Login** at `http://localhost:3000/login`
3. **Navigate** to `/wallet`
4. **Connect** Phantom (must have the Chrome extension installed)
5. **Sign** the ownership message when prompted
6. **Verify** you see your real SOL balance, token holdings, and transactions

For devnet testing, airdrop SOL via:
```bash
solana airdrop 2 <YOUR_WALLET_ADDRESS> --url devnet
```
