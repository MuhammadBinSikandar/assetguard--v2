import { z } from 'zod';

const currentYear = new Date().getFullYear();

export const boroughEnum = z.enum([
  'Brooklyn',
  'Manhattan',
  'Queens',
  'Bronx',
  'Staten Island',
]);

// Allow common variations: "BROOKLYN" → "Brooklyn", "STATEN_ISLAND" → "Staten Island"
const BOROUGH_MAP: Record<string, string> = {
  BROOKLYN: 'Brooklyn',
  MANHATTAN: 'Manhattan',
  QUEENS: 'Queens',
  BRONX: 'Bronx',
  'STATEN ISLAND': 'Staten Island',
  STATEN_ISLAND: 'Staten Island',
};

const flexibleBorough = z
  .string()
  .transform((val) => BOROUGH_MAP[val.toUpperCase().trim()] ?? val)
  .pipe(boroughEnum);

export const propertyTypeEnum = z.enum([
  'RESIDENTIAL',
  'COMMERCIAL',
  'MIXED_USE',
  'INDUSTRIAL',
  'LAND',
]);

// Map common property type strings to the canonical enum values
const PROPERTY_TYPE_MAP: Record<string, string> = {
  RESIDENTIAL: 'RESIDENTIAL',
  COMMERCIAL: 'COMMERCIAL',
  MIXED_USE: 'MIXED_USE',
  MIXEDUSE: 'MIXED_USE',
  'MIXED USE': 'MIXED_USE',
  INDUSTRIAL: 'INDUSTRIAL',
  LAND: 'LAND',
};

// Flexible property type that normalises incoming strings before validation
const flexiblePropertyType = z
  .string()
  .transform((val) => {
    const normalised = val.toUpperCase().trim().replace(/[\s-]+/g, '_');
    return PROPERTY_TYPE_MAP[normalised] ?? PROPERTY_TYPE_MAP[normalised.replace(/_/g, '')] ?? val;
  })
  .pipe(propertyTypeEnum);

/** FormData / spread can leave strings; coerce to int and clamp negatives to 0. */
function optionalNonNegativeInt() {
  return z.preprocess((val: unknown) => {
    if (val === undefined || val === null) return undefined;
    if (typeof val === 'string' && val.trim() === '') return undefined;
    const n = typeof val === 'number' ? val : Number(val);
    if (!Number.isFinite(n)) return undefined;
    return Math.max(0, Math.trunc(n));
  }, z.number().int().optional());
}

export const propertyRegistrationSchema = z.object({
  // Step 1 — NYC BBL
  borough: flexibleBorough,
  block: z.string().regex(/^\d+$/, 'Block must be numeric'),
  lot: z.string().regex(/^\d+$/, 'Lot must be numeric'),

  // Step 2 — Property Details
  propertyAddress: z.string().min(1, 'Property address is required'),
  ownerName: z.string().min(1, 'Owner name is required'),
  propertyType: flexiblePropertyType,
  taxClass: z.string().min(1, 'Tax class is required'),

  // Building Information (optional)
  yearBuilt: z
    .number()
    .int()
    .min(1600, 'Year built must be at least 1600')
    .max(currentYear, `Year built cannot exceed ${currentYear}`)
    .optional(),
  stories: z.number().min(0, 'Stories cannot be negative').optional(),
  totalAreaSqFt: z
    .number()
    .min(0, 'Total area cannot be negative')
    .optional(),
  commercialUnits: optionalNonNegativeInt(),
  residentialUnits: optionalNonNegativeInt(),

  // Land Information (optional)
  frontage: z.number().min(0, 'Frontage cannot be negative').optional(),
  depth: z.number().min(0, 'Depth cannot be negative').optional(),
  landAreaSqFt: z
    .number()
    .min(0, 'Land area cannot be negative')
    .optional(),

  // Valuation
  estimatedPriceUSD: z.number().min(0, 'Estimated price cannot be negative'),
});

export type PropertyRegistrationInput = z.infer<typeof propertyRegistrationSchema>;
