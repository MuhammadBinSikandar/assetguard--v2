"use client"

import { useState, useEffect, useCallback, useMemo, Fragment } from "react"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronDown, ChevronRight, RefreshCw, Coins, ExternalLink } from "lucide-react"

interface TokenAccount {
  id: string
  mint: string
  symbol: string
  balance: number
  decimals: number
  uiAmount: string
  programId: string
}

interface TokenHoldingsProps {
  walletAddress?: string | null
}

export function TokenHoldings({ walletAddress }: TokenHoldingsProps) {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const [holdings, setHoldings] = useState<TokenAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  const ownerAddress = useMemo(() => {
    if (publicKey) return publicKey.toBase58()
    return walletAddress ?? null
  }, [publicKey, walletAddress])

  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet"
  const explorerClusterQuery = network === "mainnet-beta" ? "" : `?cluster=${network}`

  const fetchTokens = useCallback(async () => {
    if (!ownerAddress) {
      setLoading(false)
      setError(null)
      return
    }

    let ownerPubkey: PublicKey
    try {
      ownerPubkey = new PublicKey(ownerAddress)
    } catch {
      setLoading(false)
      setError("Invalid wallet address format.")
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch from both token programs in parallel
      const [splAccounts, token2022Accounts] = await Promise.all([
        connection.getParsedTokenAccountsByOwner(ownerPubkey, { programId: TOKEN_PROGRAM_ID }),
        connection.getParsedTokenAccountsByOwner(ownerPubkey, { programId: TOKEN_2022_PROGRAM_ID }),
      ])

      const allAccounts = [
        ...splAccounts.value.map((a) => ({ ...a, programLabel: "SPL Token" })),
        ...token2022Accounts.value.map((a) => ({ ...a, programLabel: "Token-2022" })),
      ]

      const tokens: TokenAccount[] = allAccounts
        .map((ta, i) => {
          const info = ta.account.data.parsed?.info
          if (!info) return null

          const amount = Number(info.tokenAmount?.uiAmount ?? 0)
          if (amount <= 0) return null

          return {
            id: `tk-${i}`,
            mint: info.mint as string,
            symbol: ta.programLabel,
            balance: amount,
            decimals: info.tokenAmount?.decimals ?? 0,
            uiAmount: info.tokenAmount?.uiAmountString ?? "0",
            programId: ta.programLabel,
          }
        })
        .filter((t): t is TokenAccount => t !== null)

      setHoldings(tokens)
    } catch (err) {
      console.error("Failed to fetch tokens:", err)
      const message =
        err instanceof Error && (err.message.includes("429") || err.message.toLowerCase().includes("too many requests"))
          ? "RPC rate limit reached. Please wait a few seconds and refresh."
          : "Failed to fetch token holdings."
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [connection, ownerAddress])

  useEffect(() => { fetchTokens() }, [fetchTokens])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Token Holdings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-pretty">Token Holdings</CardTitle>
        <Button variant="ghost" size="icon" onClick={fetchTokens} title="Refresh">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {holdings.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <Coins className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No tokens found in this wallet.</p>
            <p className="text-xs text-muted-foreground">Tokens will appear here after you receive or purchase them.</p>
          </div>
        ) : (
          <div className="relative w-full overflow-x-auto">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Mint Address</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holdings.map((h) => {
                  const open = openId === h.id
                  const shortMint = `${h.mint.slice(0, 6)}...${h.mint.slice(-4)}`

                  return (
                    <Fragment key={h.id}>
                      <TableRow data-state={open ? "open" : "closed"}>
                        <TableCell className="w-8">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={open ? "Collapse" : "Expand"}
                            aria-expanded={open}
                            onClick={() => setOpenId(open ? null : h.id)}
                          >
                            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{shortMint}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">{h.programId}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{h.uiAmount}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="secondary" size="sm" disabled>
                            Sell
                          </Button>
                        </TableCell>
                      </TableRow>

                      {open && (
                        <TableRow>
                          <TableCell colSpan={5} className="bg-muted/30 p-3">
                            <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                              <div>
                                <span className="text-muted-foreground">Full Mint:</span>{" "}
                                <span className="font-mono text-xs break-all">{h.mint}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Decimals:</span> {h.decimals}
                              </div>
                              <div>
                                <a
                                  href={`https://explorer.solana.com/address/${h.mint}${explorerClusterQuery}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-sky-600 hover:underline text-xs"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  View on Solana Explorer
                                </a>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
