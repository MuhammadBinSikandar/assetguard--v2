"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { DocumentState } from "./document-upload"
import type { PropertyData } from "./bbl-form"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function ReviewAndSubmit({
  property,
  documents,
  wallet,
  onConfirm,
  onBack,
}: {
  property: PropertyData | null
  documents: DocumentState
  wallet: string
  onConfirm: (referenceId: string) => void
  onBack: () => void
}) {
  const { data } = useSWR<{ price: number }>("/api/price/sol", fetcher, { revalidateOnFocus: false })
  const sol = data?.price || 250 // fallback
  const totalTokens = 1000
  const marketValue = property?.assessment?.marketValue || 0
  const perTokenUSD = marketValue / totalTokens
  const perTokenSOL = perTokenUSD > 0 ? perTokenUSD / sol : 0
  const totalValueSOL = marketValue > 0 ? marketValue / sol : 0

  const [open, setOpen] = useState(false)

  const maskedWallet = useMemo(() => (wallet ? `${wallet.slice(0, 4)}...${wallet.slice(-4)}` : ""), [wallet])
  const referenceId = useMemo(() => {
    const now = new Date()
    const y = now.getFullYear()
    const seq = Math.floor(Math.random() * 9000 + 1000)
    return `PR-${y}-${seq}`
  }, [])

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold">Review Your Submission</h2>
        <p className="text-muted-foreground">
          Verify all details before final submission. Your property will be tokenized upon approval.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Accordion type="multiple" defaultValue={["prop", "docs", "wallet"]}>
            <AccordionItem value="prop">
              <AccordionTrigger>Property Details</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-6">
                  {/* Basic Property Information */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Basic Information</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <Item label="Address" value={property?.address || "—"} />

                      <Item label="Owner" value={property?.owner || "—"} />
                      <Item label="Property Type" value={property?.type || "—"} />
                      <Item label="Tax Class" value={property?.taxClass || "—"} />
                    </div>
                  </div>

                  {/* Building Information */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Building Information</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <Item label="Year Built" value={fmt(property?.building?.yearBuilt)} />
                      <Item label="Stories" value={fmt(property?.building?.stories)} />
                      <Item label="Total Area" value={fmt(property?.building?.totalArea, " sq ft")} />
                      <Item label="Commercial Units" value={fmt(property?.building?.commercialUnits)} />
                      <Item label="Residential Units" value={fmt(property?.building?.residentialUnits)} />
                    </div>
                  </div>

                  {/* Land Information */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Land Information</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <Item label="Frontage" value={fmt(property?.land?.frontage, " ft")} />
                      <Item label="Depth" value={fmt(property?.land?.depth, " ft")} />
                      <Item label="Land Area" value={fmt(property?.land?.landArea, " sq ft")} />
                    </div>
                  </div>

                  {/* Assessment/Valuation */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Property Valuation</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <Item label="Estimated Market Value" value={money(marketValue)} />
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="docs">
              <AccordionTrigger>Uploaded Documents</AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Document Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Uploaded File</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>Title Deed</TableCell>
                          <TableCell>
                            <Badge variant={documents.titleDeed.status === "Uploaded" ? "secondary" : "outline"}>
                              {documents.titleDeed.status === "Uploaded" ? "✅ Uploaded" : documents.titleDeed.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{documents.titleDeed.file?.name || "—"}</TableCell>
                          <TableCell>
                            <span className="text-sm text-primary/80">Replace</span>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="wallet">
              <AccordionTrigger>Wallet Information</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Item label="Solana Wallet Address" value={maskedWallet} />
                  <Item label="Blockchain Network" value="Solana Devnet" />
                  <Item label="Token Symbol" value="AG" />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tokenization Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row k="Property Market Value" v={money(marketValue)} />
              <Row k="Total Tokens (AG)" v={Intl.NumberFormat().format(totalTokens)} />
              <Row k="Implied Value per Token" v={money(perTokenUSD)} />
              <Row k="Token Conversion" v={`1 AG = ${money(perTokenUSD)} = ${perTokenSOL.toFixed(3)} SOL`} />
              <Row k="Total Value in SOL" v={`${Intl.NumberFormat().format(totalValueSOL)} SOL`} />
              <Row k="Smart Contract Fee" v="$0.02" />
              <Row k="Reg Cost" v="$0.02" />
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  )
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="text-muted-foreground">{k}</div>
      <div className="font-medium">{v}</div>
    </div>
  )
}
function fmt(n?: number | null, suffix = "") {
  if (n === null || n === undefined) return "—"
  return `${Intl.NumberFormat().format(n)}${suffix}`
}
function money(n?: number | null) {
  if (n === null || n === undefined) return "—"
  return Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)
}
