"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddFundsModal({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Add Funds</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="crypto" className="space-y-4">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="crypto">Cryptocurrency</TabsTrigger>
            <TabsTrigger value="bank">Bank Transfer</TabsTrigger>
            <TabsTrigger value="card">Credit Card</TabsTrigger>
          </TabsList>

          <AmountAndFees />

          <TabsContent value="crypto" className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label>Asset</Label>
                <Select defaultValue="USDC">
                  <SelectTrigger>
                    <SelectValue placeholder="Asset" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USDC">USDC</SelectItem>
                    <SelectItem value="USDT">USDT</SelectItem>
                    <SelectItem value="SOL">SOL</SelectItem>
                    <SelectItem value="ETH">ETH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Network</Label>
                <Select defaultValue="solana">
                  <SelectTrigger>
                    <SelectValue placeholder="Network" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solana">Solana</SelectItem>
                    <SelectItem value="ethereum">Ethereum</SelectItem>
                    <SelectItem value="polygon">Polygon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full">Confirm Payment</Button>
          </TabsContent>

          <TabsContent value="bank" className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label>Account Holder</Label>
                <Input placeholder="Full name" />
              </div>
              <div>
                <Label>Account Number</Label>
                <Input placeholder="XXXX-XXXX" />
              </div>
              <div>
                <Label>Routing Number</Label>
                <Input placeholder="XXXXXXXXX" />
              </div>
              <div>
                <Label>Reference</Label>
                <Input placeholder="Optional reference" />
              </div>
            </div>
            <Button className="w-full">Confirm Payment</Button>
          </TabsContent>

          <TabsContent value="card" className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label>Card Number</Label>
                <Input placeholder="4242 4242 4242 4242" />
              </div>
              <div>
                <Label>Name on Card</Label>
                <Input placeholder="Full name" />
              </div>
              <div>
                <Label>Expiry</Label>
                <Input placeholder="MM/YY" />
              </div>
              <div>
                <Label>CVC</Label>
                <Input placeholder="CVC" />
              </div>
            </div>
            <Button className="w-full">Confirm Payment</Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function AmountAndFees() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="sm:col-span-2">
        <Label>Amount (USD)</Label>
        <Input placeholder="0.00" />
        <div className="mt-1 text-xs text-muted-foreground">Conversion: 1 USDC ≈ $1.00</div>
      </div>
      <div className="rounded-md border p-3 text-sm">
        <div className="font-medium mb-2">Fee Breakdown</div>
        <div className="flex items-center justify-between">
          <span>Processing</span>
          <span>$1.50</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Network</span>
          <span>$0.25</span>
        </div>
        <div className="flex items-center justify-between font-medium border-t mt-2 pt-2">
          <span>Total</span>
          <span>$1.75</span>
        </div>
      </div>
    </div>
  )
}
