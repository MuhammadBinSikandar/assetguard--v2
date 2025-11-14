export async function GET() {
  const now = new Date()
  const months = [...Array(12)].map((_, i) => {
    const d = new Date(now)
    d.setMonth(d.getMonth() - (11 - i))
    return { date: d.toISOString().slice(0, 7), valueUSD: 4000000 + i * 250000 + Math.round(Math.random() * 100000) }
  })

  const distribution = [
    { name: "NYC102", valueUSD: 2100000 },
    { name: "LA45", valueUSD: 1600000 },
    { name: "BK13", valueUSD: 900000 },
    { name: "QNS77", valueUSD: 650000 },
  ]

  const body = {
    totalProperties: 18,
    totalValueUSD: distribution.reduce((s, d) => s + d.valueUSD, 0),
    registrations24h: 3,
    transfers24h: 7,
    roiPct: 8.42,
    updatedAt: now.toISOString(),
    timeseries: months,
    distribution,
    notifications: [
      { id: "n1", type: "surge", ts: now.toISOString(), message: "Property #NYC102 value increased by 4.5%" },
      {
        id: "n2",
        type: "info",
        ts: new Date(now.getTime() - 1000 * 60 * 25).toISOString(),
        message: "New valuation report available",
      },
      {
        id: "n3",
        type: "drop",
        ts: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
        message: "LA45 decreased by 1.2%",
      },
    ],
  }

  return Response.json(body, { status: 200 })
}
