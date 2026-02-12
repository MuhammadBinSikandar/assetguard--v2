import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { Prisma } from "@prisma/client";
import { getUserFromAccessToken } from "@/lib/auth";
import prisma from "@/db/prismaClient";

/**
 * POST /api/wallet/link
 *
 * Verifies that the caller truly owns the Solana wallet by checking an
 * Ed25519 signature against the supplied message + public key, then
 * persists the wallet address to the User record.
 *
 * Body: { publicKey, signature, message }
 * Auth: Requires a valid access-token cookie (JWT).
 */
export async function POST(request: NextRequest) {
  try {
    // ── 1. Authenticate the user ───────────────────────────────────────
    const user = await getUserFromAccessToken();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── 2. Parse body ──────────────────────────────────────────────────
    const body = await request.json();
    const { publicKey, signature, message } = body as {
      publicKey?: string;
      signature?: string;
      message?: string;
    };

    if (!publicKey || !signature || !message) {
      return NextResponse.json(
        { error: "Missing required fields: publicKey, signature, message" },
        { status: 400 },
      );
    }

    // ── 3. Validate public key format ──────────────────────────────────
    let pubkey: PublicKey;
    try {
      pubkey = new PublicKey(publicKey);
    } catch {
      return NextResponse.json({ error: "Invalid public key format" }, { status: 400 });
    }

    // ── 4. Reconstruct the expected message ────────────────────────────
    // Prevent replay attacks: the message MUST match the expected pattern
    const expectedMessage = `Authorize linking wallet ${publicKey} to User ID ${user.userId} on AG Platform.`;
    if (message !== expectedMessage) {
      return NextResponse.json(
        { error: "Message does not match expected format" },
        { status: 400 },
      );
    }

    // ── 5. Verify the signature (Ed25519) ──────────────────────────────
    const messageBytes = new TextEncoder().encode(message);
    let signatureBytes: Uint8Array;
    try {
      signatureBytes = bs58.decode(signature);
    } catch {
      return NextResponse.json({ error: "Invalid signature format" }, { status: 400 });
    }

    const isValid = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      pubkey.toBytes(),
    );

    if (!isValid) {
      return NextResponse.json(
        { error: "Signature verification failed. You do not own this wallet." },
        { status: 403 },
      );
    }

    // ── 6. Check if wallet is already linked to another account ────────
    const existingUser = await prisma.user.findUnique({
      where: { walletAddress: publicKey },
      select: { id: true },
    });

    if (existingUser && existingUser.id !== user.userId) {
      return NextResponse.json(
        { error: "This wallet is already linked to another account" },
        { status: 409 },
      );
    }

    // ── 7. Persist to database ─────────────────────────────────────────
    await prisma.user.update({
      where: { id: user.userId },
      data: { walletAddress: publicKey },
    });

    // ── 8. Audit log ───────────────────────────────────────────────────
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: "wallet_link",
        details: JSON.stringify({ walletAddress: publicKey }),
        success: true,
      },
    });

    return NextResponse.json({
      success: true,
      walletAddress: publicKey,
      message: "Wallet verified and linked successfully",
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      Array.isArray(error.meta?.target) &&
      error.meta.target.includes("walletAddress")
    ) {
      return NextResponse.json(
        { error: "This wallet is already linked to another account" },
        { status: 409 },
      );
    }

    console.error("[wallet/link] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/wallet/link
 *
 * Returns the currently linked wallet address for the authenticated user.
 */
export async function GET() {
  try {
    const user = await getUserFromAccessToken();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { walletAddress: true, kycStatus: true },
    });

    return NextResponse.json({
      walletAddress: dbUser?.walletAddress ?? null,
      kycStatus: dbUser?.kycStatus ?? "IDLE",
    });
  } catch (error) {
    console.error("[wallet/link] GET Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
