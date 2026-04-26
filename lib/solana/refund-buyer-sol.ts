import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';

/**
 * Return SOL from the admin wallet to the buyer after a payment could not be settled.
 * Catches errors so callers can log and return a user-facing "manual support" state.
 */
export async function tryRefundLamportsToBuyer(
  connection: Connection,
  adminKeypair: Keypair,
  buyer: PublicKey,
  lamports: bigint,
): Promise<{ ok: true; signature: string } | { ok: false; error: string }> {
  if (lamports <= 0n) {
    return { ok: false, error: 'Refund amount is zero.' };
  }
  if (lamports > BigInt(Number.MAX_SAFE_INTEGER)) {
    return { ok: false, error: 'Refund amount too large for this path.' };
  }
  const n = Number(lamports);
  try {
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: adminKeypair.publicKey,
        toPubkey: buyer,
        lamports: n,
      }),
    );
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    tx.recentBlockhash = blockhash;
    tx.feePayer = adminKeypair.publicKey;
    const signature = await sendAndConfirmTransaction(connection, tx, [adminKeypair], {
      commitment: 'confirmed',
    });
    return { ok: true, signature };
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    return { ok: false, error: err };
  }
}
