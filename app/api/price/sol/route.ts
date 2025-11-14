import { NextResponse } from "next/server"

export const revalidate = 60 // cache for 60s

export async function GET() {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd", {
      // Avoid sending credentials
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    })
    if (!res.ok) throw new Error("Failed to fetch SOL price")
    const json = await res.json()
    const price = Number(json?.solana?.usd) || 250
    return NextResponse.json({ price })
  } catch {
    return NextResponse.json({ price: 250 })
  }
}
