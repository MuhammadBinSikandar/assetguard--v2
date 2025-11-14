// Simple mock dataset for AI-discovered opportunities

export type RiskLevel = "Low" | "Medium" | "High"
export type Horizon = "short" | "long"
export type Opportunity = {
  id: string
  title: string
  imageAlt: string
  location: string
  price: number // USD
  predictedRoiPct: number
  confidence: number // 0-100
  riskLevel: RiskLevel
  horizon: Horizon
  appreciationPct: number
  why: string[]
}

export const allOpportunities: Opportunity[] = [
  {
    id: "opp-001",
    title: "Modern Skyline Loft",
    imageAlt: "Modern skyline loft with panoramic city view",
    location: "New York, NY",
    price: 420000,
    predictedRoiPct: 11.8,
    confidence: 92,
    riskLevel: "Medium",
    horizon: "long",
    appreciationPct: 6.2,
    why: [
      "Market trend: High urban demand",
      "Historical performance: Consistent rent growth",
      "Comparable analysis: Above-median yields",
    ],
  },
  {
    id: "opp-002",
    title: "Coastal Townhomes Cluster",
    imageAlt: "Coastal townhome cluster near the beach",
    location: "San Diego, CA",
    price: 680000,
    predictedRoiPct: 14.1,
    confidence: 87,
    riskLevel: "Low",
    horizon: "short",
    appreciationPct: 4.9,
    why: [
      "Market trend: Beachfront scarcity premium",
      "Historical performance: Low vacancy",
      "Comparable analysis: Strong seasonal demand",
    ],
  },
  {
    id: "opp-003",
    title: "Emerging Tech Corridor Flats",
    imageAlt: "Mid-rise flats in a tech corridor",
    location: "Austin, TX",
    price: 350000,
    predictedRoiPct: 12.3,
    confidence: 95,
    riskLevel: "Medium",
    horizon: "long",
    appreciationPct: 7.4,
    why: [
      "Market trend: Inbound migration",
      "Historical performance: Robust job growth",
      "Comparable analysis: New supply limited",
    ],
  },
  {
    id: "opp-004",
    title: "Suburban Garden Villas",
    imageAlt: "Suburban villas surrounded by greenery",
    location: "Raleigh, NC",
    price: 290000,
    predictedRoiPct: 9.6,
    confidence: 85,
    riskLevel: "Low",
    horizon: "short",
    appreciationPct: 3.8,
    why: [
      "Market trend: Family-centric demand",
      "Historical performance: Steady appreciation",
      "Comparable analysis: Attractive schools",
    ],
  },
  {
    id: "opp-005",
    title: "Harborfront Micro-Lofts",
    imageAlt: "Harborfront micro-lofts near marina",
    location: "Seattle, WA",
    price: 510000,
    predictedRoiPct: 16.2,
    confidence: 90,
    riskLevel: "High",
    horizon: "short",
    appreciationPct: 5.5,
    why: [
      "Market trend: Downtown revitalization",
      "Historical performance: Rent spike periods",
      "Comparable analysis: Undersupplied micro-units",
    ],
  },
]
