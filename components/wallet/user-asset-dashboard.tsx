"use client";

import { useState, useEffect, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { unpack, type TokenMetadata } from "@solana/spl-token-metadata";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  DollarSign,
  Coins,
  RefreshCw,
  PackageOpen,
  ShieldCheck,
  Tag,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────

interface AGToken {
  mintAddress: string;
  name: string;
  symbol: string;
  uri: string;
  balance: number;
  decimals: number;
  valuation: string;
  pricePerToken: string;
  propertyId: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────

function getAdditionalField(metadata: TokenMetadata, key: string): string {
  const entry = metadata.additionalMetadata.find(([k]) => k === key);
  return entry ? entry[1] : "";
}

function formatCurrency(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "$0.00";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num);
}

// ── Component ────────────────────────────────────────────────────────────

interface UserAssetDashboardProps {
  walletAddress: string;
}

export function UserAssetDashboard({ walletAddress }: UserAssetDashboardProps) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [tokens, setTokens] = useState<AGToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAGTokens = useCallback(async () => {
    const owner = publicKey ?? new PublicKey(walletAddress);

    try {
      setLoading(true);
      setError(null);

      // 1. Fetch ALL Token-2022 accounts owned by this wallet
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(owner, {
        programId: TOKEN_2022_PROGRAM_ID,
      });

      // 2. Filter to accounts with balance > 0
      const nonZeroAccounts = tokenAccounts.value.filter((ta) => {
        const info = ta.account.data.parsed?.info;
        return info && Number(info.tokenAmount?.amount) > 0;
      });

      if (nonZeroAccounts.length === 0) {
        setTokens([]);
        return;
      }

      // 3. For each token account, fetch the Mint data and decode metadata
      const agTokens = await Promise.all(
        nonZeroAccounts.map(async (ta) => {
          try {
            const info = ta.account.data.parsed.info;
            const mintAddress = info.mint as string;
            const balance = Number(info.tokenAmount.uiAmount);
            const decimals = info.tokenAmount.decimals as number;

            // Fetch the raw mint account
            const mintPubkey = new PublicKey(mintAddress);
            const mintAccountInfo = await connection.getAccountInfo(mintPubkey);
            if (!mintAccountInfo) return null;

            // Deserialize Token-2022 metadata from the mint account
            let metadata: TokenMetadata;
            try {
              metadata = unpack(mintAccountInfo.data);
            } catch {
              // No metadata extension on this mint — skip
              return null;
            }

            // Filter: only AG tokens
            if (metadata.symbol !== "AG") return null;

            const valuation = getAdditionalField(metadata, "valuation");
            const pricePerToken = getAdditionalField(metadata, "price_per_token");
            const propertyId = getAdditionalField(metadata, "property_id");

            return {
              mintAddress,
              name: metadata.name,
              symbol: metadata.symbol,
              uri: metadata.uri,
              balance,
              decimals,
              valuation: valuation || "0",
              pricePerToken: pricePerToken || "0",
              propertyId: propertyId || mintAddress.slice(0, 8),
            } satisfies AGToken;
          } catch {
            return null;
          }
        }),
      );

      setTokens(agTokens.filter((t): t is AGToken => t !== null));
    } catch (err) {
      console.error("Failed to fetch AG tokens:", err);
      setError("Failed to load your property tokens. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [connection, publicKey, walletAddress]);

  useEffect(() => {
    fetchAGTokens();
  }, [fetchAGTokens]);

  // ── Loading State ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Property Tokens</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-1" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-9 w-full mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ── Error State ──────────────────────────────────────────────────────

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="py-8 text-center space-y-3">
          <p className="text-destructive font-medium">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchAGTokens}>
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Empty State ──────────────────────────────────────────────────────

  if (tokens.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-3">
          <PackageOpen className="mx-auto h-10 w-10 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No Property Tokens Found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            You don&apos;t own any AG property tokens yet. Browse available properties to invest.
          </p>
          <Button variant="outline" size="sm" onClick={fetchAGTokens}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Token Grid ───────────────────────────────────────────────────────

  const totalValue = tokens.reduce(
    (sum, t) => sum + t.balance * parseFloat(t.pricePerToken || "0"),
    0,
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Your Property Tokens</h2>
          <p className="text-sm text-muted-foreground">
            {tokens.length} asset{tokens.length !== 1 ? "s" : ""} &middot; Total Value:{" "}
            <span className="font-semibold text-foreground">{formatCurrency(totalValue)}</span>
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchAGTokens} title="Refresh">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tokens.map((token) => {
          const holdingValue = token.balance * parseFloat(token.pricePerToken || "0");

          return (
            <Card key={token.mintAddress} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{token.name || "AG Property"}</CardTitle>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      ID: {token.propertyId}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    AG
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-3">
                {/* Valuation */}
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Valuation</span>
                  <span className="ml-auto font-semibold">{formatCurrency(token.valuation)}</span>
                </div>

                {/* Price per Token */}
                <div className="flex items-center gap-2 text-sm">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Price/Token</span>
                  <span className="ml-auto font-semibold">{formatCurrency(token.pricePerToken)}</span>
                </div>

                {/* Balance */}
                <div className="flex items-center gap-2 text-sm">
                  <Coins className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Your Balance</span>
                  <span className="ml-auto font-semibold">{token.balance.toLocaleString()}</span>
                </div>

                {/* Holding Value */}
                <div className="flex items-center gap-2 text-sm border-t pt-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Your Holdings</span>
                  <span className="ml-auto font-bold text-green-600">{formatCurrency(holdingValue)}</span>
                </div>

                {/* Sell Button (UI only) */}
                <Button variant="outline" className="w-full mt-2" disabled>
                  Sell (Coming Soon)
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
