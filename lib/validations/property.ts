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
  stories: z.number().int().min(1, 'Stories must be at least 1').optional(),
  totalAreaSqFt: z
    .number()
    .positive('Total area must be positive')
    .optional(),
  commercialUnits: z
    .number()
    .int()
    .min(0, 'Commercial units cannot be negative')
    .optional(),
  residentialUnits: z
    .number()
    .int()
    .min(0, 'Residential units cannot be negative')
    .optional(),

  // Land Information (optional)
  frontage: z.number().positive('Frontage must be positive').optional(),
  depth: z.number().positive('Depth must be positive').optional(),
  landAreaSqFt: z
    .number()
    .positive('Land area must be positive')
    .optional(),

  // Valuation
  estimatedPriceUSD: z
    .number()
    .positive('Estimated price must be positive')
    .min(1, 'Estimated price must be at least 1'),
});

export type PropertyRegistrationInput = z.infer<typeof propertyRegistrationSchema>;
