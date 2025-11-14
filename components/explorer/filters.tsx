"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

export function ExplorerFilters() {
  const [type, setType] = useState<string>("all")
  const [status, setStatus] = useState<string>("all")
  const [time, setTime] = useState<string>("24h")
  const [min, setMin] = useState<string>("")
  const [max, setMax] = useState<string>("")

  return (
    <Card className="p-3">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Transaction Type</label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
              <SelectItem value="mint">Mint</SelectItem>
              <SelectItem value="burn">Burn</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Status</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Time Range</label>
          <Select value={time} onValueChange={setTime}>
            <SelectTrigger>
              <SelectValue placeholder="24h" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last hour</SelectItem>
              <SelectItem value="24h">24 hours</SelectItem>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Min Amount</label>
          <Input value={min} onChange={(e) => setMin(e.target.value)} placeholder="0" inputMode="decimal" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Max Amount</label>
          <Input value={max} onChange={(e) => setMax(e.target.value)} placeholder="∞" inputMode="decimal" />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setType("all")
            setStatus("all")
            setTime("24h")
            setMin("")
            setMax("")
          }}
        >
          Reset
        </Button>
        <Button>Apply</Button>
      </div>
    </Card>
  )
}
