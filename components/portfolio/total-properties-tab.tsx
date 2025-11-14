"use client"

import { useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LayoutGrid, List } from "lucide-react"
import { MetricCard } from "@/components/dashboard/metric-card"
import { PortfolioCard } from "@/components/portfolio/portfolio-card"
import { PortfolioTable } from "@/components/portfolio/portfolio-table"
import Link from "next/link"

// Mock portfolio data
type PortfolioItem = {
    id: string
    name: string
    location: string
    ownership: "full" | "fractional"
    fractionalPercent?: number
    purchasePriceSOL: number
    currentValueSOL: number
    purchaseDate: string
    image?: string
}

const PORTFOLIO: PortfolioItem[] = [
    {
        id: "pf1",
        name: "Marina View Residence",
        location: "Dubai Marina, UAE",
        ownership: "full",
        purchasePriceSOL: 3800,
        currentValueSOL: 4100,
        purchaseDate: "2025-03-15",
        image: "/marina-view-residence.jpg",
    },
    {
        id: "pf2",
        name: "Downtown Offices A",
        location: "Dubai Downtown, UAE",
        ownership: "fractional",
        fractionalPercent: 25,
        purchasePriceSOL: 600,
        currentValueSOL: 720,
        purchaseDate: "2025-01-05",
        image: "/downtown-offices-a.jpg",
    },
    {
        id: "pf3",
        name: "Coastal Land Plot",
        location: "Abu Dhabi, UAE",
        ownership: "fractional",
        fractionalPercent: 10,
        purchasePriceSOL: 200,
        currentValueSOL: 180,
        purchaseDate: "2024-12-12",
        image: "/coastal-land-plot.jpg",
    },
    {
        id: "pf4",
        name: "Palm Jumeirah Villa",
        location: "Palm Jumeirah, UAE",
        ownership: "full",
        purchasePriceSOL: 3000,
        currentValueSOL: 3500,
        purchaseDate: "2024-11-01",
        image: "/palm-jumeirah-villa.jpg",
    },
    {
        id: "pf5",
        name: "Harborfront Apartments",
        location: "Doha, Qatar",
        ownership: "fractional",
        fractionalPercent: 40,
        purchasePriceSOL: 400,
        currentValueSOL: 420,
        purchaseDate: "2025-02-11",
        image: "/harborfront-apartments.jpg",
    },
    {
        id: "pf6",
        name: "Business Bay Tower",
        location: "Business Bay, UAE",
        ownership: "fractional",
        fractionalPercent: 5,
        purchasePriceSOL: 250,
        currentValueSOL: 270,
        purchaseDate: "2025-03-01",
        image: "/business-bay-tower.jpg",
    },
    {
        id: "pf7",
        name: "Sahara Retail Park",
        location: "Sharjah, UAE",
        ownership: "full",
        purchasePriceSOL: 500,
        currentValueSOL: 540,
        purchaseDate: "2024-10-15",
        image: "/sahara-retail-park.jpg",
    },
    {
        id: "pf8",
        name: "Desert Springs Resort",
        location: "Al Ain, UAE",
        ownership: "fractional",
        fractionalPercent: 30,
        purchasePriceSOL: 300,
        currentValueSOL: 330,
        purchaseDate: "2025-01-25",
        image: "/desert-springs-resort.jpg",
    },
    {
        id: "pf9",
        name: "Corniche Residences",
        location: "Abu Dhabi, UAE",
        ownership: "fractional",
        fractionalPercent: 20,
        purchasePriceSOL: 200,
        currentValueSOL: 210,
        purchaseDate: "2025-03-05",
        image: "/corniche-residences.jpg",
    },
    {
        id: "pf10",
        name: "Oasis Villas",
        location: "Riyadh, KSA",
        ownership: "fractional",
        fractionalPercent: 15,
        purchasePriceSOL: 150,
        currentValueSOL: 160,
        purchaseDate: "2025-02-20",
        image: "/oasis-villas.jpg",
    },
    {
        id: "pf11",
        name: "Harbor Offices B",
        location: "Dubai Marina, UAE",
        ownership: "fractional",
        fractionalPercent: 10,
        purchasePriceSOL: 300,
        currentValueSOL: 360,
        purchaseDate: "2024-12-29",
        image: "/harbor-offices-b.jpg",
    },
    {
        id: "pf12",
        name: "Palm Boardwalk Shops",
        location: "Palm Jumeirah, UAE",
        ownership: "full",
        purchasePriceSOL: 300,
        currentValueSOL: 340,
        purchaseDate: "2025-03-10",
        image: "/palm-boardwalk-shops.jpg",
    },
]

// Utility formatters
const SOL_TO_USD = 230 // mock conversion rate
const fmtSOL = (v: number) => `${v.toLocaleString()} SOL`
const fmtUSD = (v: number) => `($${(v * SOL_TO_USD).toLocaleString()})`
const roiPct = (purchase: number, current: number) => ((current - purchase) / Math.max(1, purchase)) * 100

type GroupBy = "all" | "full" | "fractional"
type SortBy = "value" | "roi" | "purchaseDate"

export function TotalPropertiesTab() {
    const [groupBy, setGroupBy] = useState<GroupBy>("all")
    const [sortBy, setSortBy] = useState<SortBy>("value")
    const [view, setView] = useState<"grid" | "list">("grid")

    const filtered = useMemo(() => {
        return PORTFOLIO.filter((p) => {
            if (groupBy === "all") return true
            if (groupBy === "full") return p.ownership === "full"
            return p.ownership === "fractional"
        })
    }, [groupBy])

    const sorted = useMemo(() => {
        const arr = [...filtered]
        switch (sortBy) {
            case "roi":
                arr.sort(
                    (a, b) => roiPct(b.purchasePriceSOL, b.currentValueSOL) - roiPct(a.purchasePriceSOL, a.currentValueSOL),
                )
                break
            case "purchaseDate":
                arr.sort((a, b) => +new Date(b.purchaseDate) - +new Date(a.purchaseDate))
                break
            default:
                // value
                arr.sort((a, b) => b.currentValueSOL - a.currentValueSOL)
        }
        return arr
    }, [filtered, sortBy])

    // Summary numbers (mock consistent with spec)
    const totalProperties = PORTFOLIO.length // 12
    const totalFull = PORTFOLIO.filter((p) => p.ownership === "full").length // 3 (matches spec)
    const totalFractional = totalProperties - totalFull // 9 (matches spec)
    const totalInvestmentSOL = PORTFOLIO.reduce((a, p) => a + p.purchasePriceSOL, 0) // mock to be near 5000
    const totalReturnsSOL = PORTFOLIO.reduce((a, p) => a + (p.currentValueSOL - p.purchasePriceSOL), 0) // ~1200 mock

    // Sparkline mock trends
    const trendA = [4200, 4350, 4380, 4450, 4550, 4600, 4700, 4820, 4900, 5000]
    const trendB = [4900, 4980, 5050, 5120, 5200, 5280, 5350, 5450, 5580, 5600]
    const trendC = [600, 720, 780, 900, 980, 1050, 1120, 1200, 1250, 1300]

    const anyItems = sorted.length > 0

    return (
        <>
            {/* Summary Cards */}
            <section aria-label="Portfolio summary" className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <MetricCard
                    title="Total Properties"
                    value={`${totalProperties}`}
                    delta="+0"
                    valueHint={`${totalFull} Full | ${totalFractional} Fractional`}
                    trend={trendA}
                    colorVar="--chart-1"
                />
                <MetricCard
                    title="Total Investment"
                    value={`${fmtSOL(5000)} ${fmtUSD(5000)}`}
                    delta="↑ 8%"
                    valueHint="+8% vs last month"
                    trend={trendB}
                    colorVar="--chart-2"
                />
                <MetricCard
                    title="Total Returns"
                    value={`+${fmtSOL(1200)} ${fmtUSD(1200)}`}
                    delta="↑ 24%"
                    valueHint="ROI: +24%"
                    trend={trendC}
                    colorVar="--chart-3"
                />
            </section>

            {/* View Controls */}
            <section
                aria-label="View controls"
                className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Group by</span>
                        <Select value={groupBy} onValueChange={(v: GroupBy) => setGroupBy(v)}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Group by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="full">Full Ownership</SelectItem>
                                <SelectItem value="fractional">Fractional</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Sort by</span>
                        <Select value={sortBy} onValueChange={(v: SortBy) => setSortBy(v)}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="value">Value</SelectItem>
                                <SelectItem value="roi">ROI</SelectItem>
                                <SelectItem value="purchaseDate">Purchase Date</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <Button
                        variant={view === "grid" ? "secondary" : "ghost"}
                        size="icon"
                        aria-label="Grid view"
                        onClick={() => setView("grid")}
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={view === "list" ? "secondary" : "ghost"}
                        size="icon"
                        aria-label="List view"
                        onClick={() => setView("list")}
                    >
                        <List className="h-4 w-4" />
                    </Button>
                </div>
            </section>

            {/* Display */}
            {!anyItems ? (
                <Card className="mb-6">
                    <CardContent className="flex flex-col items-center justify-center gap-4 py-10 text-center">
                        <img src="/empty-portfolio.jpg" alt="" className="h-24 w-24 opacity-80" crossOrigin="anonymous" />
                        <div className="space-y-1">
                            <h2 className="text-lg font-semibold">You don't own any properties yet.</h2>
                            <p className="text-sm text-muted-foreground">
                                Browse verified assets and start building your portfolio.
                            </p>
                        </div>
                        <Button asChild>
                            <Link href="/properties">Browse Properties</Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : view === "grid" ? (
                <div aria-label="Portfolio grid" className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {sorted.map((p) => (
                        <PortfolioCard key={p.id} item={p} />
                    ))}
                </div>
            ) : (
                <div aria-label="Portfolio list" className="mb-6">
                    <PortfolioTable items={sorted} />
                </div>
            )}
        </>
    )
}