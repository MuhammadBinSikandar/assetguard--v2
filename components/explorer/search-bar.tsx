"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function SearchBar({ onSearch }: { onSearch?: (query: string) => void }) {
  const [q, setQ] = useState("")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const suggestions = ["0x4f...a91c (tx hash)", "8Df4z...R2qH (wallet)", "AG-131SULLIVAN (token)"]

  const handleSearch = () => {
    if (onSearch) {
      onSearch(q)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex w-full items-center gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search by transaction hash, wallet address, or property token"
          className="h-11"
          aria-label="Search"
        />
        <Button className="h-11" onClick={handleSearch}>Search</Button>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Quick suggestions:</span>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => setQ(s)}
                className={cn(
                  "text-xs rounded-md px-2 py-1 border bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground",
                )}
                aria-label={`Use suggestion ${s}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => setShowAdvanced((v) => !v)}
          className="text-xs text-primary underline-offset-4 hover:underline"
          aria-expanded={showAdvanced}
        >
          {showAdvanced ? "Hide advanced" : "Advanced"}
        </button>
      </div>

      {showAdvanced && (
        <Card className="p-3">
          <div className="text-xs text-muted-foreground">
            Advanced search coming soon. You’ll be able to combine filters like type, amount range, and time window.
          </div>
        </Card>
      )}
    </div>
  )
}
