import { NextResponse } from "next/server"

const addr = () =>
  ["8Df4z", "9xnAA", "4JpQz", "G3LmT", "H9zUy"].map((s) => s)[Math.floor(Math.random() * 5)] +
  "..." +
  ["R2qH", "D4Gk", "t7Mx", "p1Na", "XyG9"][Math.floor(Math.random() * 5)]

const fullAddr = () =>
  Array.from(
    { length: 44 },
    () => "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"[Math.floor(Math.random() * 58)],
  ).join("")

const hash = () => "0x" + Array.from({ length: 64 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("")

export async function GET() {
  // Simple mocked dataset with plausible structure
  const now = Date.now()
  const transactions = Array.from({ length: 32 }).map((_, i) => {
    const h = hash()
    const b = 320000 + i
    return {
      id: String(i + 1),
      hash: h,
      type: (["transfer", "mint", "burn"] as const)[Math.floor(Math.random() * 3)],
      from: fullAddr(),
      to: fullAddr(),
      token: Math.random() > 0.4 ? "AG" : undefined,
      amount: Math.floor(Math.random() * 50) + 1,
      timestamp: new Date(now - i * 1000 * 60 * 7).toISOString(),
      status: (["success", "pending", "failed"] as const)[Math.floor(Math.random() * 3)],
      block: b,
      fee: Math.floor(Math.random() * 3000) + 500,
      gasUsed: Math.floor(Math.random() * 200000),
      confirmations: Math.floor(Math.random() * 100),
    }
  })

  return NextResponse.json({ transactions })
}
