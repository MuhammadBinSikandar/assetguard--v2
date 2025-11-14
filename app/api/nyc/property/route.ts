import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { borough, block, lot } = await req.json()

  // Simple mock mapping for demo; return example when matching common sample BBL
  const isSample =
    (String(block) === "1304" && String(lot) === "43") || (String(block) === "1304" && String(lot) === "433")
  const address = isSample
    ? "131 SULLIVAN PLACE - BROOKLYN 11225"
    : `${Number(block)}-${Number(lot)} ${borough.toUpperCase() || "NYC"}`

  const data = {
    address,
    borough,
    block: String(block),
    lot: String(lot),
    owner: isSample ? "FULL GOSPEL ASSEMBLY OF BROOKLYN" : "N/A",
    type: isSample ? "M1 - CHURCH, SYNAGOGUE, CHAPEL" : "Mixed-Use",
    taxClass: isSample ? "4" : "2",
    building: {
      yearBuilt: isSample ? 1930 : 1985,
      stories: isSample ? 2 : 5,
      totalArea: isSample ? 19362 : 8500,
      commercialUnits: isSample ? 0 : 2,
      residentialUnits: isSample ? 0 : 6,
      constructionType: isSample ? "Masonry" : "Steel/Concrete",
    },
    land: {
      frontage: isSample ? 100 : 25,
      depth: isSample ? 193 : 100,
      landArea: isSample ? 19362 : 2500,
      zoning: isSample ? "M1-1" : "R6",
    },
    assessment: {
      marketValue: isSample ? 6117000 : 1250000,
      taxableValue: isSample ? 0 : 850000,
      latestYear: new Date().getFullYear(),
    },
  }

  return NextResponse.json(data)
}
