export async function GET() {
  const rows = [
    ["propertyId", "name", "tokensOwned", "ownershipPct", "currentValueUSD"],
    ["NYC102", "131 SULLIVAN PLACE", "600", "60", "2100000"],
    ["LA45", "Sunset Tower", "150", "15", "1600000"],
  ]
  const csv = rows.map((r) => r.join(",")).join("\n")
  return new Response(csv, {
    headers: {
      "content-type": "text/csv",
      "content-disposition": 'attachment; filename="ownership-report.csv"',
    },
  })
}
