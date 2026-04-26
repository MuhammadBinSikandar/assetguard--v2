import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

const PUBLIC_KEY = "GHtknbNgzVDtEUEznqd8VFekffPJWFJs3YWKZBrPCvn6"; // paste yours here

const connection = new Connection("https://api.devnet.solana.com", "confirmed");
const pubkey = new PublicKey(PUBLIC_KEY);

const balance = await connection.getBalance(pubkey);
console.log("SOL Balance:", balance / LAMPORTS_PER_SOL, "SOL");

const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubkey, {
  programId: new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb") // Token-2022
});

if (tokenAccounts.value.length === 0) {
  console.log("No Token-2022 tokens found.");
} else {
  tokenAccounts.value.forEach(({ account }) => {
    const info = account.data.parsed.info;
    console.log("Mint:   ", info.mint);
    console.log("Amount: ", info.tokenAmount.amount);
    console.log("---");
  });
}