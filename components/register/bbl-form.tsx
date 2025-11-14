"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export type BBLValues = {
  borough: "Brooklyn" | "Queens" | "Manhattan" | "Bronx" | "Staten Island"
  block: string
  lot: string
}

export type PropertyData = {
  address: string
  borough: string
  block: string
  lot: string
  owner: string
  type: string
  taxClass: string
  building: {
    yearBuilt?: number | null
    stories?: number | null
    totalArea?: number | null
    commercialUnits?: number | null
    residentialUnits?: number | null
    constructionType?: string | null
  }
  land: {
    frontage?: number | null
    depth?: number | null
    landArea?: number | null
    zoning?: string | null
  }
  assessment: {
    marketValue?: number | null
    taxableValue?: number | null
    latestYear?: number | null
  }
}

export default function BBLForm({
  initialValues,
  onFetched,
  onChange,
}: {
  initialValues?: BBLValues
  onFetched: (values: BBLValues, data: PropertyData) => void
  onChange?: (values: BBLValues) => void
}) {
  const [borough, setBorough] = useState<BBLValues["borough"]>(initialValues?.borough || "Brooklyn")
  const [block, setBlock] = useState(initialValues?.block || "")
  const [lot, setLot] = useState(initialValues?.lot || "")

  const handleChange = (newBorough?: BBLValues["borough"], newBlock?: string, newLot?: string) => {
    const values = {
      borough: newBorough ?? borough,
      block: newBlock ?? block,
      lot: newLot ?? lot,
    }
    onChange?.(values)
  }

  return (
    <div className="space-y-6" aria-live="polite">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="borough">Borough</Label>
          <Select
            value={borough}
            onValueChange={(v) => {
              const newBorough = v as BBLValues["borough"]
              setBorough(newBorough)
              handleChange(newBorough, undefined, undefined)
            }}
          >
            <SelectTrigger id="borough" aria-label="Select borough">
              <SelectValue placeholder="Select borough" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Brooklyn">Brooklyn</SelectItem>
              <SelectItem value="Queens">Queens</SelectItem>
              <SelectItem value="Manhattan">Manhattan</SelectItem>
              <SelectItem value="Bronx">Bronx</SelectItem>
              <SelectItem value="Staten Island">Staten Island</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="block">Block</Label>
          <Input
            id="block"
            inputMode="numeric"
            pattern="[0-9]*"
            value={block}
            onChange={(e) => {
              const newBlock = e.target.value.replace(/[^0-9]/g, "")
              setBlock(newBlock)
              handleChange(undefined, newBlock, undefined)
            }}
            placeholder="e.g., 1304"
            aria-describedby="block-hint"
          />
          <span id="block-hint" className="text-xs text-muted-foreground">
            Numeric only
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="lot">Lot</Label>
          <Input
            id="lot"
            inputMode="numeric"
            pattern="[0-9]*"
            value={lot}
            onChange={(e) => {
              const newLot = e.target.value.replace(/[^0-9]/g, "")
              setLot(newLot)
              handleChange(undefined, undefined, newLot)
            }}
            placeholder="e.g., 43"
            aria-describedby="lot-hint"
          />
          <span id="lot-hint" className="text-xs text-muted-foreground">
            Numeric only
          </span>
        </div>
      </div>
    </div>
  )
}
