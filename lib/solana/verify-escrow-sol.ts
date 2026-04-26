import { Connection, PublicKey, type ParsedTransactionWithMeta } from '@solana/web3.js';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type ParsedTransfer = {
  type?: string;
  info?: { source?: string; destination?: string; lamports?: number | string };
};

function addIfMatching(
  p: ParsedTransfer,
  buyer: string,
  admin: string,
  sum: { n: bigint },
) {
  if (p.type !== 'transfer' || !p.info) return;
  const lam = p.info.lamports;
  if (lam == null) return;
  const n = BigInt(lam);
  if (p.info.source === buyer && p.info.destination === admin) {
    sum.n = sum.n + n;
  }
}

function walkInstructions(
  instructions: ReadonlyArray<{ parsed?: unknown; programId?: PublicKey; program?: string }>,
  buyer: string,
  admin: string,
  sum: { n: bigint },
) {
  for (const ix of instructions) {
    if (!ix.parsed || typeof ix.parsed !== 'object') continue;
    addIfMatching(ix.parsed as ParsedTransfer, buyer, admin, sum);
  }
}

/**
 * Sums system transfers (parsed path). v0/legacy: works when instructions are fully parsed.
 */
function sumFromParsed(
  tx: ParsedTransactionWithMeta,
  buyer: string,
  admin: string,
): bigint {
  const sum = { n: BigInt(0) };
  const message = tx.transaction.message;
  if ('instructions' in message) {
    walkInstructions(message.instructions, buyer, admin, sum);
  }
  const inner = tx.meta?.innerInstructions;
  if (inner) {
    for (const group of inner) {
      walkInstructions(
        group.instructions as { parsed?: unknown; programId?: PublicKey; program?: string }[],
        buyer,
        admin,
        sum,
      );
    }
  }
  return sum.n;
}

/** How much lamports the admin (receiver) account gained, using raw tx + getAccountKeys. */
function sumAdminLamportGainFromFullTx(
  r: { meta: NonNullable<NonNullable<ParsedTransactionWithMeta>['meta']> },
  adminWallet: PublicKey,
): bigint {
  const m = r.meta;
  const pre = m.preBalances;
  const post = m.postBalances;
  if (!pre?.length || !post?.length) return 0n;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const message = (r as any).transaction?.message;
  if (!message) return 0n;

  if (Array.isArray(message.accountKeys)) {
    for (let i = 0; i < message.accountKeys.length; i++) {
      const k = message.accountKeys[i] as PublicKey;
      if (k?.equals?.(adminWallet)) {
        const d = (post[i] ?? 0) - (pre[i] ?? 0);
        if (d > 0) return BigInt(d);
        return 0n;
      }
    }
  }
  if (typeof message.getAccountKeys === 'function') {
    const keys = message.getAccountKeys() as { get: (i: number) => PublicKey; length: number };
    for (let i = 0; i < keys.length; i++) {
      if (keys.get(i).equals(adminWallet)) {
        return BigInt((post[i] ?? 0) - (pre[i] ?? 0));
      }
    }
  }
  return 0n;
}

/**
 * Confirms a transaction that sends SOL from buyer → admin.
 * Retries: RPCs often return null right after the wallet until the tx is processed.
 * minLamports: expected minimum received (caller may apply a small slippage discount).
 */
export async function verifyBuyerToAdminSolTransfer(
  connection: Connection,
  signature: string,
  buyerWallet: PublicKey,
  adminWallet: PublicKey,
  minLamports: bigint,
): Promise<boolean> {
  const buyer = buyerWallet.toBase58();
  const admin = adminWallet.toBase58();
  // Allow 2% under minimum (fees, rounding, client/server SOL price skew)
  const need = (minLamports * 98n) / 100n;

  for (let attempt = 0; attempt < 15; attempt++) {
    if (attempt > 0) await sleep(400);

    const tx: ParsedTransactionWithMeta | null = await connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: 'confirmed',
    });
    if (!tx || tx.meta?.err) continue;

    let sum = sumFromParsed(tx, buyer, admin);
    if (sum < need && tx.meta) {
      const bal = sumAdminLamportGainFromFullTx({ ...tx, meta: tx.meta }, adminWallet);
      if (bal > sum) sum = bal;
    }
    if (sum < need) {
      const raw = await connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0,
        commitment: 'confirmed',
      });
      if (raw?.meta && !raw.meta.err) {
        const bal = sumAdminLamportGainFromFullTx(raw, adminWallet);
        if (bal > sum) sum = bal;
      }
    }

    if (sum >= need) return true;
  }

  return false;
}

/**
 * Same as {@link verifyBuyerToAdminSolTransfer}, but also returns the lamports
 * the admin account gained from the buyer (for full refunds on failed settlement).
 */
export async function verifyBuyerToAdminTransferAndGetAmount(
  connection: Connection,
  signature: string,
  buyerWallet: PublicKey,
  adminWallet: PublicKey,
  minLamports: bigint,
): Promise<{ ok: true; receivedLamports: bigint } | { ok: false }> {
  const buyer = buyerWallet.toBase58();
  const admin = adminWallet.toBase58();
  const need = (minLamports * 98n) / 100n;

  for (let attempt = 0; attempt < 15; attempt++) {
    if (attempt > 0) await sleep(400);

    const tx: ParsedTransactionWithMeta | null = await connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: 'confirmed',
    });
    if (!tx || tx.meta?.err) continue;

    let sum = sumFromParsed(tx, buyer, admin);
    if (tx.meta) {
      const bal = sumAdminLamportGainFromFullTx({ ...tx, meta: tx.meta }, adminWallet);
      if (bal > sum) sum = bal;
    }
    if (sum < need) {
      const raw = await connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0,
        commitment: 'confirmed',
      });
      if (raw?.meta && !raw.meta.err) {
        const bal = sumAdminLamportGainFromFullTx(raw, adminWallet);
        if (bal > sum) sum = bal;
      }
    }

    if (sum >= need) {
      return { ok: true, receivedLamports: sum };
    }
  }

  return { ok: false };
}

/**
 * Best-effort lamports the admin received from the buyer in a given payment tx (for manual refunds).
 */
export async function getBuyerToAdminLamportsFromTx(
  connection: Connection,
  signature: string,
  buyerWallet: PublicKey,
  adminWallet: PublicKey,
): Promise<bigint | null> {
  const buyer = buyerWallet.toBase58();
  const admin = adminWallet.toBase58();

  const tx: ParsedTransactionWithMeta | null = await connection.getParsedTransaction(signature, {
    maxSupportedTransactionVersion: 0,
    commitment: 'confirmed',
  });
  if (tx?.meta && !tx.meta.err) {
    let sum = sumFromParsed(tx, buyer, admin);
    const bal = sumAdminLamportGainFromFullTx({ ...tx, meta: tx.meta }, adminWallet);
    if (bal > sum) sum = bal;
    if (sum > 0n) return sum;
  }

  const raw = await connection.getTransaction(signature, {
    maxSupportedTransactionVersion: 0,
    commitment: 'confirmed',
  });
  if (!raw?.meta || raw.meta.err) return null;
  const fromBal = sumAdminLamportGainFromFullTx(raw, adminWallet);
  return fromBal > 0n ? fromBal : null;
}
