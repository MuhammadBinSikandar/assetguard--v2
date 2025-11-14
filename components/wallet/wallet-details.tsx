"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, ExternalLink, Wallet, ArrowLeft } from "lucide-react"

type PropertyToken = {
    id: string
    propertyName: string
    propertyLocation: string
    tokenSymbol: string
    tokenBalance: number
    propertyImage?: string
    verified: boolean
}

// Mock data for demonstration
const MOCK_PROPERTY_TOKENS: PropertyToken[] = [
    {
        id: "1",
        propertyName: "Marina View Residence",
        propertyLocation: "Dubai Marina, UAE",
        tokenSymbol: "AG",
        tokenBalance: 1000,
        propertyImage: "/marina-view-residence.jpg",
        verified: true,
    },
    {
        id: "2",
        propertyName: "Downtown Offices A",
        propertyLocation: "Dubai Downtown, UAE",
        tokenSymbol: "AG",
        tokenBalance: 250,
        propertyImage: "/downtown-offices-a.jpg",
        verified: true,
    },
    {
        id: "3",
        propertyName: "Palm Jumeirah Villa",
        propertyLocation: "Palm Jumeirah, UAE",
        tokenSymbol: "AG",
        tokenBalance: 500,
        propertyImage: "/palm-jumeirah-villa.jpg",
        verified: true,
    },
]

export function WalletDetails({ initialAddress, onBack }: { initialAddress?: string; onBack?: () => void } = {}) {
    const [walletAddress, setWalletAddress] = useState(initialAddress || "")
    const [searchedAddress, setSearchedAddress] = useState("")
    const [tokens, setTokens] = useState<PropertyToken[]>([])
    const [loading, setLoading] = useState(false);
    const handleSearch = async () => {
        if (!walletAddress.trim()) return

        setLoading(true)
        // Simulate API call
        setTimeout(() => {
            setSearchedAddress(walletAddress)
            setTokens(MOCK_PROPERTY_TOKENS)
            setLoading(false)
        }, 800)
    }

    // Auto-search if initial address is provided
    useEffect(() => {
        if (initialAddress && initialAddress.trim()) {
            handleSearch()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialAddress])

    const totalTokens = tokens.reduce((sum, token) => sum + token.tokenBalance, 0)

    const handleViewOnExplorer = (address: string) => {
        window.open(`https://explorer.solana.com/address/${address}`, "_blank")
    }

    return (
        <div className="space-y-6">
            {/* Back Button */}
            {onBack && (
                <Button
                    variant="outline"
                    onClick={onBack}
                    className="gap-2 hover:gap-3 transition-all hover:bg-primary hover:border-primary [&:hover]:text-[oklch(0.696_0.17_162.48)]"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Explorer
                </Button>
            )}

            {/* Results Section */}
            {searchedAddress && (
                <>
                    {/* Summary Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Wallet Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Wallet Address:</span>
                                    <div className="flex items-center gap-2">
                                        <code className="text-sm font-mono">{searchedAddress.slice(0, 8)}...{searchedAddress.slice(-8)}</code>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => handleViewOnExplorer(searchedAddress)}
                                        >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Total Properties:</span>
                                    <span className="font-semibold">{tokens.length}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Total AG Tokens:</span>
                                    <span className="text-lg font-bold">{totalTokens.toLocaleString()} AG</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tokens Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Property Tokens</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {tokens.length === 0 ? (
                                <div className="py-8 text-center text-sm text-muted-foreground">
                                    No property tokens found for this wallet address
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Property</TableHead>
                                                <TableHead>Location</TableHead>
                                                <TableHead>Token Symbol</TableHead>
                                                <TableHead className="text-right">Balance</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {tokens.map((token) => (
                                                <TableRow key={token.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            {token.propertyImage && (
                                                                <div className="h-10 w-10 overflow-hidden rounded-md">
                                                                    <img
                                                                        src={token.propertyImage}
                                                                        alt={token.propertyName}
                                                                        className="h-full w-full object-cover"
                                                                        crossOrigin="anonymous"
                                                                    />
                                                                </div>
                                                            )}
                                                            <span className="font-medium">{token.propertyName}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {token.propertyLocation}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary">{token.tokenSymbol}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right font-semibold">
                                                        {token.tokenBalance.toLocaleString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        {token.verified ? (
                                                            <Badge variant="default" className="bg-green-600">
                                                                Verified
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline">Unverified</Badge>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}

            {/* Empty State */}
            {!searchedAddress && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                        <div className="rounded-full bg-muted p-4">
                            <Wallet className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold">Search for a Wallet</h3>
                            <p className="text-sm text-muted-foreground max-w-md">
                                Enter a wallet address above to view all property tokens (AG tokens) associated with that wallet.
                                This helps verify property ownership on the blockchain.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
