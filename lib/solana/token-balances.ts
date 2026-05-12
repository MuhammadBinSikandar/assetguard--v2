import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { getSolanaRpcUrl } from '@/lib/solana/admin-keypair';

let cachedConnection: Connection | null = null;

function getConnection(): Connection {
    if (!cachedConnection) {
        cachedConnection = new Connection(getSolanaRpcUrl(), 'confirmed');
    }
    return cachedConnection;
}

function parseUiAmountFromOwnerAccounts(
    response: Awaited<ReturnType<Connection['getParsedTokenAccountsByOwner']>>,
    mintAddress: string,
): number {
    return response.value.reduce((sum, item) => {
        const parsedInfo = (item.account.data as { parsed?: { info?: { mint?: string; tokenAmount?: { uiAmount?: number | null } } } })
            ?.parsed?.info;

        if (!parsedInfo || parsedInfo.mint !== mintAddress) {
            return sum;
        }

        const uiAmount = Number(parsedInfo.tokenAmount?.uiAmount ?? 0);
        return Number.isFinite(uiAmount) ? sum + uiAmount : sum;
    }, 0);
}

/**
 * Returns a wallet's current token balance for a mint by summing all owner token accounts.
 * Includes Token-2022 and legacy SPL token programs for compatibility.
 */
export async function getWalletMintBalance(
    ownerWalletAddress: string | null | undefined,
    mintAddress: string | null | undefined,
): Promise<number | null> {
    if (!ownerWalletAddress || !mintAddress) {
        return null;
    }

    try {
        const owner = new PublicKey(ownerWalletAddress);
        const mint = new PublicKey(mintAddress).toBase58();
        const connection = getConnection();

        const [token2022Accounts, tokenAccounts] = await Promise.all([
            connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_2022_PROGRAM_ID }),
            connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_PROGRAM_ID }),
        ]);

        const token2022Balance = parseUiAmountFromOwnerAccounts(token2022Accounts, mint);
        const tokenBalance = parseUiAmountFromOwnerAccounts(tokenAccounts, mint);

        return token2022Balance + tokenBalance;
    } catch {
        return null;
    }
}

/**
 * Returns a map of all token balances for a given wallet address.
 */
export async function getAllWalletTokenBalances(
    ownerWalletAddress: string | null | undefined,
): Promise<Map<string, number>> {
    const balances = new Map<string, number>();
    if (!ownerWalletAddress) return balances;

    try {
        const owner = new PublicKey(ownerWalletAddress);
        const connection = getConnection();

        const [token2022Accounts, tokenAccounts] = await Promise.all([
            connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_2022_PROGRAM_ID }),
            connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_PROGRAM_ID }),
        ]);

        const processAccounts = (response: Awaited<ReturnType<Connection['getParsedTokenAccountsByOwner']>>) => {
            for (const item of response.value) {
                const parsedInfo = (item.account.data as { parsed?: { info?: { mint?: string; tokenAmount?: { uiAmount?: number | null } } } })
                    ?.parsed?.info;
                if (!parsedInfo || !parsedInfo.mint) continue;
                const mint = parsedInfo.mint;
                const uiAmount = Number(parsedInfo.tokenAmount?.uiAmount ?? 0);
                if (Number.isFinite(uiAmount)) {
                    balances.set(mint, (balances.get(mint) ?? 0) + uiAmount);
                }
            }
        };

        processAccounts(token2022Accounts);
        processAccounts(tokenAccounts);

    } catch (e) {
        console.error("Failed to fetch all wallet token balances", e);
    }

    return balances;
}
