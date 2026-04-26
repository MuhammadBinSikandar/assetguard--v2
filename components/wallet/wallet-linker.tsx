"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import bs58 from "bs58";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck, Wallet, Link2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ConnectWallet from "@/components/wallet/connect-wallet";

interface WalletLinkerProps {
  userId: string;
  /** Called after a successful link so the parent can refresh state */
  onLinked?: (walletAddress: string) => void;
  /** If the user already has a linked wallet */
  linkedWallet?: string | null;
}

export function WalletLinker({ userId, onLinked, linkedWallet }: WalletLinkerProps) {
  const { publicKey, signMessage, connected, disconnect } = useWallet();
  const { toast } = useToast();
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const linkWalletToAccount = useCallback(async () => {
    if (!publicKey || !signMessage) {
      setError("Wallet does not support message signing. Please use a supported Solana wallet.");
      return;
    }

    try {
      setIsLinking(true);
      setError(null);

      // 1. Create a deterministic message to sign — proves ownership
      const messageContent = `Authorize linking wallet ${publicKey.toBase58()} to User ID ${userId} on AG Platform.`;
      const message = new TextEncoder().encode(messageContent);

      // 2. Request signature from wallet (0 gas, free)
      const signature = await signMessage(message);

      // 3. Send to backend for cryptographic verification
      const response = await fetch("/api/wallet/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          publicKey: publicKey.toBase58(),
          signature: bs58.encode(signature),
          message: messageContent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Wallet verification failed");
      }

      toast({
        title: "Wallet Linked",
        description: `Wallet ${publicKey.toBase58().slice(0, 6)}...${publicKey.toBase58().slice(-4)} verified and linked to your account.`,
      });

      onLinked?.(publicKey.toBase58());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to link wallet";
      setError(msg);
      toast({ title: "Link Failed", description: msg, variant: "destructive" });
    } finally {
      setIsLinking(false);
    }
  }, [publicKey, signMessage, userId, toast, onLinked]);

  // Already linked — show linked state
  if (linkedWallet) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            Wallet Verified
          </CardTitle>
          <CardDescription>Your Solana wallet is linked and verified via signature proof.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="font-mono text-xs px-3 py-1">
              {linkedWallet.slice(0, 6)}...{linkedWallet.slice(-4)}
            </Badge>
            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Ownership Proven
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Connect &amp; Verify Wallet
        </CardTitle>
        <CardDescription>
          Connect your Solana wallet and sign a free message to prove ownership. This prevents anyone from claiming a
          wallet they don&apos;t own.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Step 1: Connect */}
        <div className="flex justify-center">
          <ConnectWallet />
        </div>

        {/* Step 2: Sign & Link */}
        {connected && publicKey && (
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Connected:{" "}
                <span className="font-mono font-medium text-foreground">
                  {publicKey.toBase58().slice(0, 6)}...{publicKey.toBase58().slice(-4)}
                </span>
              </p>
              <Button variant="ghost" size="sm" onClick={() => disconnect()}>
                Disconnect
              </Button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-2 rounded-md">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button
              className="w-full"
              onClick={linkWalletToAccount}
              disabled={isLinking}
            >
              {isLinking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying Ownership…
                </>
              ) : (
                <>
                  <Link2 className="mr-2 h-4 w-4" />
                  Verify &amp; Link Wallet
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              You&apos;ll be asked to sign a message. This is <strong>free</strong> (0 gas) and proves you own the
              private key.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
