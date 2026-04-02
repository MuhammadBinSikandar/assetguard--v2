# Token-2022 Minting System Documentation

## Overview

AssetGuard uses Solana's **Token-2022 Program** (also known as Token Extensions) to mint property tokens. When an admin approves a property, they can mint tokens that represent fractional ownership shares. Each property gets its own unique token mint with embedded metadata.

## Architecture

```
┌─────────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   Admin Dashboard   │────▶│  POST /api/admin/    │────▶│  Solana Devnet  │
│  (Property Panel)   │     │   mint-property      │     │  (Token-2022)   │
└─────────────────────┘     └──────────────────────┘     └─────────────────┘
                                      │
                                      ▼
                            ┌──────────────────────┐
                            │   PostgreSQL DB      │
                            │  (Update Property)   │
                            └──────────────────────┘
```

## Files Created

| File | Purpose |
|------|---------|
| `lib/solana/admin-keypair.ts` | Helper functions to decode admin secret key and get RPC URL |
| `app/api/admin/mint-property/route.ts` | POST endpoint that handles the minting transaction |
| `components/admin/property-details-panel.tsx` | Updated UI with minting modal and token display |
| `prisma/schema.prisma` | Added minting fields to Property model |

## Database Schema Changes

Four new fields were added to the `Property` model:

```prisma
model Property {
  // ... existing fields ...
  
  // Minting (Token-2022)
  mintAddress         String?        @unique // Solana Token-2022 mint address
  mintSignature       String?        // Transaction signature from minting
  mintedAt            DateTime?      // When tokens were minted
  tokenSupply         Int?           // Total token supply minted
  
  @@index([mintAddress])
}
```

### Migration

Run the migration using the locally installed Prisma version:

```bash
npm run prisma:migrate
```

> **Note:** Do not use `npx prisma migrate` directly as it may download a newer incompatible version.

## Environment Variables

Add these to your `.env` file:

```env
# Required: Solana Admin Wallet
# This is the Base58-encoded 64-byte secret key of the admin wallet
# Used as the mint authority and transaction payer
ADMIN_SECRET_KEY=your_base58_secret_key_here

# Optional: Solana RPC URL (defaults to devnet)
SOLANA_RPC_URL=https://api.devnet.solana.com
```

### Generating an Admin Keypair

```bash
# Install Solana CLI tools
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Generate a new keypair
solana-keygen new --outfile admin-wallet.json

# Get the Base58 secret key for .env
cat admin-wallet.json
# Convert the JSON array to Base58 (use an online tool or script)

# Fund with devnet SOL
solana airdrop 2 <PUBLIC_KEY> --url devnet
```

## API Reference

### POST `/api/admin/mint-property`

Mints Token-2022 tokens for an approved property.

#### Request Body

```typescript
{
  propertyId: string;        // UUID of the property
  userWalletAddress: string; // Owner's Solana wallet (Base58)
  totalValuation: number;    // Property valuation in USD
  tokenSupply: number;       // Number of tokens to mint (integer)
}
```

#### Success Response (200)

```typescript
{
  success: true,
  message: "Property tokens minted successfully.",
  data: {
    mintAddress: string;     // Token mint address
    signature: string;       // Transaction signature
    tokenSupply: number;     // Tokens minted
    pricePerToken: number;   // Calculated price per token
    userAta: string;         // User's Associated Token Account
    explorerUrl: string;     // Solana Explorer link for token
    txUrl: string;           // Solana Explorer link for transaction
  }
}
```

#### Error Responses

| Status | Condition |
|--------|-----------|
| 400 | Validation failed, property not APPROVED, invalid wallet |
| 401 | Unauthorized (no valid session) |
| 403 | Forbidden (not an admin) |
| 404 | Property not found |
| 409 | Property already minted |
| 500 | Server error (admin key not configured) |
| 503 | Insufficient SOL balance or network congestion |

## Token Specifications

| Property | Value |
|----------|-------|
| Program | Token-2022 (TOKEN_2022_PROGRAM_ID) |
| Decimals | 0 (1 token = 1 share) |
| Extensions | Metadata Pointer |
| Network | Solana Devnet |

### Token Metadata

Each token includes embedded metadata:

```typescript
{
  name: "AG Property #PR-2026-0001",
  symbol: "AG",
  uri: "",  // Can be updated for off-chain metadata
  additionalMetadata: [
    ["property_id", "<uuid>"],
    ["valuation", "500000"],
    ["price_per_token", "500.00"],
    ["reference_id", "PR-2026-0001"]
  ]
}
```

## Security Features

### Immutable Supply
After minting, both the **Mint Authority** and **Freeze Authority** are revoked:

```typescript
// Revoke Mint Authority
createSetAuthorityInstruction(
  mint,
  adminKeypair.publicKey,
  AuthorityType.MintTokens,
  null,  // Revoke
);

// Revoke Freeze Authority
createSetAuthorityInstruction(
  mint,
  adminKeypair.publicKey,
  AuthorityType.FreezeAccount,
  null,  // Revoke
);
```

This ensures:
- No additional tokens can ever be minted
- Tokens cannot be frozen by any authority
- Supply is permanently fixed

### Server-Side Only
The admin secret key is **never exposed to the client**. All minting happens server-side in the API route.

### Balance Check
The API checks admin wallet balance before attempting to mint:

```typescript
const minimumBalance = 0.05 * 1e9; // 0.05 SOL
if (adminBalance < minimumBalance) {
  return NextResponse.json(
    { message: 'Insufficient SOL balance for transaction fees.' },
    { status: 503 }
  );
}
```

## Frontend Integration

### Property Details Panel

The `PropertyDetailsPanel` component was updated with:

1. **Minting Button** - Appears for APPROVED properties without a mint address
2. **Token Supply Input** - Admin specifies how many tokens to create
3. **Minting Modal** - Confirmation dialog with valuation details
4. **Success Display** - Shows mint address with Solana Explorer links
5. **Minted Badge** - For properties that already have tokens

### User Flow

```
PENDING/UNDER_REVIEW Property
         │
         ▼
    [Approve] ──▶ APPROVED Property
                        │
                        ▼
              [Mint Property Tokens]
                        │
                        ▼
              Enter Token Supply
                        │
                        ▼
              [Confirm Minting]
                        │
                        ▼
              ✅ Tokens Minted
              (Links to Explorer)
```

## Transaction Structure

The minting transaction includes these instructions (in order):

1. **CreateAccount** - Create the mint account with space for metadata
2. **InitializeMetadataPointer** - Point metadata to the mint itself
3. **InitializeMint** - Initialize with 0 decimals
4. **InitializeMetadata** - Set name, symbol, URI
5. **UpdateField** (×4) - Add custom metadata fields
6. **CreateAssociatedTokenAccount** - Create user's ATA
7. **MintTo** - Mint tokens to user's ATA
8. **SetAuthority** (×2) - Revoke mint and freeze authorities

## Troubleshooting

### "Admin key not configured"
Ensure `ADMIN_SECRET_KEY` is set in your `.env` file with a valid Base58 secret key.

### "Insufficient SOL balance"
Fund the admin wallet:
```bash
solana airdrop 2 <ADMIN_PUBLIC_KEY> --url devnet
```

### "Property must be APPROVED before minting"
Only properties with status `APPROVED` can be minted. Review and approve the property first.

### "Property tokens have already been minted"
Each property can only be minted once. The `mintAddress` field prevents duplicate minting.

### Transaction Timeout
Devnet can be congested. The API includes retry logic:
```typescript
{
  commitment: 'confirmed',
  maxRetries: 3,
}
```

## Testing

### Manual Testing

1. Create and approve a test property
2. Navigate to Admin → Property Approvals
3. Select an APPROVED property
4. Click "Mint Property Tokens"
5. Enter token supply (e.g., 1000)
6. Confirm and wait for transaction
7. Verify on Solana Explorer

### Verify Token on Explorer

After minting, click the explorer link or navigate to:
```
https://explorer.solana.com/address/<MINT_ADDRESS>?cluster=devnet
```

Check:
- Token supply matches
- Metadata shows property details
- Mint authority is null (revoked)
- Freeze authority is null (revoked)

## Dependencies

The minting system uses these packages (already in package.json):

```json
{
  "@solana/web3.js": "^1.98.0",
  "@solana/spl-token": "^0.4.9",
  "@solana/spl-token-metadata": "^0.1.6",
  "bs58": "^6.0.0"
}
```

## Future Enhancements

- [ ] Mainnet deployment configuration
- [ ] Off-chain metadata URI support (IPFS/Arweave)
- [ ] Token transfer restrictions (transfer hooks)
- [ ] Multi-sig mint authority
- [ ] Batch minting for multiple properties
- [ ] Token holder verification for property access
