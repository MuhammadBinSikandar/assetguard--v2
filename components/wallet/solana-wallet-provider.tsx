"use client";

import { useMemo, type ReactNode } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";

// Import wallet adapter styles
import "@solana/wallet-adapter-react-ui/styles.css";

interface SolanaWalletProviderProps {
  children: ReactNode;
}

/**
 * Wraps children with Solana Connection + Wallet + Modal providers.
 * Defaults to devnet — switch to "mainnet-beta" for production.
 *
 * Wallets array is empty — Phantom, Solflare, and other wallets that
 * implement the Wallet Standard are auto-detected from the browser.
 * This prevents the adapter from redirecting to phantom.com when the
 * extension is already installed.
 */
export function SolanaWalletProvider({ children }: SolanaWalletProviderProps) {
  const network = (process.env.NEXT_PUBLIC_SOLANA_NETWORK as "devnet" | "mainnet-beta" | "testnet") || "devnet";
  const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(network);

  // Empty array: installed wallets are discovered via the Wallet Standard protocol
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
