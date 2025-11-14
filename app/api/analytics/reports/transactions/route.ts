export async function GET() {
  const rows = [
    ["id", "type", "property", "amountAG", "status", "hash", "timestamp"],
    ["tx_001", "purchase", "NYC102", "1200", "completed", "0x91af...9fd", "2025-10-05T14:22:00Z"],
    ["tx_002", "transfer", "LA45", "300", "pending", "0x77bc...0aa", "2025-10-05T12:10:00Z"],
  ]
  const csv = rows.map((r) => r.join(",")).join("\n")
  return new Response(csv, {
    headers: {
      "content-type": "text/csv",
      "content-disposition": 'attachment; filename="transactions-report.csv"',
    },
  })
}
