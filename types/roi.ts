// ── ROI Projection Types ────────────────────────────────────────────────────

export interface ROIProjection {
  year: number;
  projected_price: number;
  profit: number;
  roi_percentage: number;
}

export interface ROIResult {
  success: boolean;
  borough: string;
  baseline_year: number;
  baseline_price: number;
  projections: ROIProjection[];
}

// Borough stats types (used by /api/opportunities/borough-stats)
export interface BoroughStat {
  name: string;
  avgROI: number;
  propertyCount: number;
  topROI: number;
}

export interface BoroughStatsResult {
  boroughs: BoroughStat[];
}
