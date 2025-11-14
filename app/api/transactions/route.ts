import { NextResponse } from "next/server"

const MOCK: any[] = Array.from({ length: 42 }).map((_, i) => {
  const types = ["purchase", "sale", "transfer", "registration"] as const
  const statuses = ["completed", "pending", "failed"] as const
  const type = types[i % types.length]
  const status = statuses[i % statuses.length]
  const ts = new Date(Date.now() - i * 1000 * 60 * 60).toISOString()
  return {
    id: `tx_${1000 + i}`,
    type,
    property: i % 3 === 0 ? "131 SULLIVAN PLACE" : `Property-${i + 1}`,
    amountAG: 100 + (i % 7) * 75,
    status,
    hash: `0x${(Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2)).slice(0, 64)}`,
    from: `8D${i}f4zFromWalletAddress${i}XYZ`,
    to: `8D${i}f4zToWalletAddress${i}XYZ`,
    timestamp: ts,
    contract: i % 5 === 0 ? "ContractAddressXYZ789" : undefined,
  }
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = Number.parseInt(searchParams.get("page") || "1", 10)
  const q = (searchParams.get("q") || "").toLowerCase()
  const type = searchParams.get("type") || "all"
  const status = searchParams.get("status") || "all"

  let data = MOCK
  if (type !== "all") data = data.filter((d) => d.type === type)
  if (status !== "all") data = data.filter((d) => d.status === status)
  if (q) {
    data = data.filter(
      (d) =>
        d.property.toLowerCase().includes(q) ||
        d.hash.toLowerCase().includes(q) ||
        d.from.toLowerCase().includes(q) ||
        d.to.toLowerCase().includes(q),
    )
  }

  // reverse chronological
  data = [...data].sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))

  const pageSize = 10
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const items = data.slice(start, end)

  return NextResponse.json({ items, total: data.length })
}
