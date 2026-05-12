import { NextRequest, NextResponse } from 'next/server';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  ExtensionType,
  createInitializeMetadataPointerInstruction,
  createInitializeMintInstruction,
  getMintLen,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  createSetAuthorityInstruction,
  AuthorityType,
  TYPE_SIZE,
  LENGTH_SIZE,
} from '@solana/spl-token';
import {
  createInitializeInstruction,
  createUpdateFieldInstruction,
  pack,
  TokenMetadata,
} from '@solana/spl-token-metadata';
import { z } from 'zod';
import { getUserFromAccessToken } from '@/lib/auth';
import { getAdminKeypair, getSolanaRpcUrl } from '@/lib/solana/admin-keypair';
import prisma from '@/db/prismaClient';
import { effectivePropertyValuationUsd } from '@/lib/property-valuation';
import { FIXED_PROPERTY_TOKEN_SUPPLY } from '@/lib/property-tokens';

// ── Input Validation ────────────────────────────────────────────────────────

const mintPropertySchema = z.object({
  propertyId: z.string().uuid('Invalid property ID format'),
  userWalletAddress: z.string().min(32, 'Invalid wallet address').max(44, 'Invalid wallet address'),
});

// ── POST /api/admin/mint-property ───────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // ── 1. Auth + Admin check ──────────────────────────────────────────────
    const decoded = await getUserFromAccessToken();
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please log in.' },
        { status: 401 },
      );
    }
    if (!decoded.roles.includes('admin')) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Admin access required.' },
        { status: 403 },
      );
    }

    // ── 2. Parse & Validate Request Body ───────────────────────────────────
    const body = await request.json();
    const validation = mintPropertySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed.',
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { propertyId, userWalletAddress } = validation.data;

    // ── 3. Validate User Wallet Address ────────────────────────────────────
    let userWallet: PublicKey;
    try {
      userWallet = new PublicKey(userWalletAddress);
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid Solana wallet address format.' },
        { status: 400 },
      );
    }

    // ── 4. Verify Property Exists and is Approved ──────────────────────────
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        referenceId: true,
        borough: true,
        block: true,
        lot: true,
        status: true,
        mintAddress: true,
        walletAddress: true,
        estimatedPriceUSD: true,
        verifiedPriceUSD: true,
      },
    });

    if (!property) {
      return NextResponse.json(
        { success: false, message: 'Property not found.' },
        { status: 404 },
      );
    }

    if (property.status !== 'APPROVED') {
      return NextResponse.json(
        { success: false, message: 'Property must be APPROVED before minting.' },
        { status: 400 },
      );
    }

    if (property.mintAddress) {
      return NextResponse.json(
        {
          success: false,
          message: 'Property tokens have already been minted.',
          mintAddress: property.mintAddress,
        },
        { status: 409 },
      );
    }

    const duplicate = await prisma.property.findFirst({
      where: {
        borough: property.borough,
        block: property.block,
        lot: property.lot,
        mintAddress: { not: null },
        id: { not: propertyId },
      },
      select: { id: true, referenceId: true, mintAddress: true },
    });

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          message: `This property location has already been tokenized. Reference: ${duplicate.referenceId}`,
          existingMintAddress: duplicate.mintAddress,
        },
        { status: 409 },
      );
    }

    // ── 5. Setup Solana Connection & Admin Keypair ─────────────────────────
    let adminKeypair: Keypair;
    try {
      adminKeypair = getAdminKeypair();
    } catch (error) {
      console.error('[Mint Property] Admin keypair error:', error);
      return NextResponse.json(
        { success: false, message: 'Server configuration error: Admin key not configured.' },
        { status: 500 },
      );
    }

    const connection = new Connection(getSolanaRpcUrl(), 'confirmed');

    // Check admin balance
    const adminBalance = await connection.getBalance(adminKeypair.publicKey);
    const minimumBalance = 0.05 * 1e9; // 0.05 SOL minimum
    if (adminBalance < minimumBalance) {
      console.error(
        `[Mint Property] Insufficient admin balance: ${adminBalance / 1e9} SOL`,
      );
      return NextResponse.json(
        {
          success: false,
          message: 'Insufficient SOL balance in admin wallet for transaction fees.',
        },
        { status: 503 },
      );
    }

    // ── 6. Create New Mint Keypair ─────────────────────────────────────────
    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;

    // ── 7. Prepare Token Metadata ──────────────────────────────────────────
    const tokenSupply = FIXED_PROPERTY_TOKEN_SUPPLY;
    const propertyValuation = effectivePropertyValuationUsd(
      property.estimatedPriceUSD,
      property.verifiedPriceUSD,
    );
    const pricePerToken = propertyValuation / tokenSupply;
    const decimals = 6; // Real estate tokens: 1 token = 1 share

    const metadata: TokenMetadata = {
      mint: mint,
      name: 'AG',
      symbol: 'AG',
      uri: 'https://res.cloudinary.com/ddudykruo/raw/upload/v1777141210/ag-token-metadata_ot1bb4.json',
      additionalMetadata: [
        ['property_id', propertyId],
        ['valuation', propertyValuation.toString()],
        ['price_per_token', pricePerToken.toFixed(2)],
        ['reference_id', property.referenceId],
        ['borough', property.borough],
        ['block', property.block],
        ['lot', property.lot],
      ],
    };

    // ── 8. Calculate Account Sizes ─────────────────────────────────────────
    const metadataExtension = TYPE_SIZE + LENGTH_SIZE;
    const metadataLen = pack(metadata).length;
    const mintLen = getMintLen([ExtensionType.MetadataPointer]);
    const lamports = await connection.getMinimumBalanceForRentExemption(
      mintLen + metadataExtension + metadataLen,
    );

    // ── 9. Build Transaction Instructions ──────────────────────────────────
    const transaction = new Transaction();

    // 9a. Create Mint Account
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: adminKeypair.publicKey,
        newAccountPubkey: mint,
        space: mintLen,
        lamports,
        programId: TOKEN_2022_PROGRAM_ID,
      }),
    );

    // 9b. Initialize Metadata Pointer (pointing to mint itself)
    transaction.add(
      createInitializeMetadataPointerInstruction(
        mint,
        adminKeypair.publicKey, // authority
        mint, // metadata address (self-referential)
        TOKEN_2022_PROGRAM_ID,
      ),
    );

    // 9c. Initialize Mint
    transaction.add(
      createInitializeMintInstruction(
        mint,
        decimals,
        adminKeypair.publicKey, // mint authority
        adminKeypair.publicKey, // freeze authority (will be revoked)
        TOKEN_2022_PROGRAM_ID,
      ),
    );

    // 9d. Initialize Token Metadata
    transaction.add(
      createInitializeInstruction({
        programId: TOKEN_2022_PROGRAM_ID,
        mint: mint,
        metadata: mint,
        name: metadata.name,
        symbol: metadata.symbol,
        uri: metadata.uri,
        mintAuthority: adminKeypair.publicKey,
        updateAuthority: adminKeypair.publicKey,
      }),
    );

    // 9e. Add Additional Metadata Fields
    for (const [key, value] of metadata.additionalMetadata) {
      transaction.add(
        createUpdateFieldInstruction({
          programId: TOKEN_2022_PROGRAM_ID,
          metadata: mint,
          updateAuthority: adminKeypair.publicKey,
          field: key,
          value: value,
        }),
      );
    }

    // 9f–9g. Mint full supply to the **user's wallet ATA**.
    // This gives the user direct custody of the tokens upon minting.
    // They will need to sign an Approve delegate transaction later when listing them.
    const userAta = getAssociatedTokenAddressSync(
      mint,
      userWallet,
      false,
      TOKEN_2022_PROGRAM_ID,
    );

    transaction.add(
      createAssociatedTokenAccountInstruction(
        adminKeypair.publicKey, // fee payer
        userAta,
        userWallet,
        mint,
        TOKEN_2022_PROGRAM_ID,
      ),
    );

    transaction.add(
      createMintToInstruction(
        mint,
        userAta,
        adminKeypair.publicKey,
        BigInt(tokenSupply) * BigInt(10 ** decimals),
        [],
        TOKEN_2022_PROGRAM_ID,
      ),
    );

    // 9h. Revoke Mint Authority (Immutable Supply)
    transaction.add(
      createSetAuthorityInstruction(
        mint,
        adminKeypair.publicKey, // current authority
        AuthorityType.MintTokens,
        null, // new authority (null = revoke)
        [],
        TOKEN_2022_PROGRAM_ID,
      ),
    );

    // 9i. Revoke Freeze Authority
    transaction.add(
      createSetAuthorityInstruction(
        mint,
        adminKeypair.publicKey,
        AuthorityType.FreezeAccount,
        null,
        [],
        TOKEN_2022_PROGRAM_ID,
      ),
    );

    // ── 10. Send Transaction ───────────────────────────────────────────────
    let signature: string;
    try {
      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = adminKeypair.publicKey;

      signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [adminKeypair, mintKeypair],
        {
          commitment: 'confirmed',
          maxRetries: 3,
        },
      );
    } catch (txError) {
      console.error('[Mint Property] Transaction error:', txError);

      // Parse specific Solana errors
      const errorMessage =
        txError instanceof Error ? txError.message : 'Unknown transaction error';

      if (errorMessage.includes('insufficient funds') || errorMessage.includes('0x1')) {
        return NextResponse.json(
          { success: false, message: 'Insufficient SOL for transaction fees.' },
          { status: 503 },
        );
      }

      if (errorMessage.includes('blockhash not found') || errorMessage.includes('expired')) {
        return NextResponse.json(
          { success: false, message: 'Network congestion. Please try again.' },
          { status: 503 },
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: 'Failed to send transaction to Solana network.',
          error: errorMessage,
        },
        { status: 500 },
      );
    }

    // ── 11. Update Database ────────────────────────────────────────────────
    const mintAddress = mint.toBase58();

    await prisma.property.update({
      where: { id: propertyId },
      data: {
        mintAddress: mintAddress,
        mintSignature: signature,
        mintedAt: new Date(),
        tokenSupply: tokenSupply,
        pricePerToken: pricePerToken,
      },
    });

    // ── 12. Create Audit Log ───────────────────────────────────────────────
    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'property_mint',
        details: JSON.stringify({
          propertyId,
          mintAddress,
          signature,
          tokenSupply,
          totalValuation: propertyValuation,
          pricePerToken,
          borough: property.borough,
          block: property.block,
          lot: property.lot,
          userWallet: userWalletAddress,
          custodyAta: userAta.toBase58(),
        }),
        success: true,
      },
    });

    // ── 13. Return Success Response ────────────────────────────────────────
    return NextResponse.json(
      {
        success: true,
        message:
          'Property tokens successfully minted directly to the registrant\'s wallet. The user will need to authorize sales when listing.',
        data: {
          mintAddress,
          signature,
          tokenSupply,
          pricePerToken,
          custodyAta: userAta.toBase58(),
          ownerWallet: userWallet.toBase58(),
          explorerUrl: `https://explorer.solana.com/address/${mintAddress}?cluster=devnet`,
          txUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('[Mint Property] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An unexpected error occurred during minting.',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
