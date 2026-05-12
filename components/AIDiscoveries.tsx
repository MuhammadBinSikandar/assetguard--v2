"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sparkles, MapPin, Building2, TrendingUp, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useMemo } from "react"

const AI_EXAMPLES = [
  {
    "borough": "BRONX",
    "block": 5419,
    "lot": 77,
    "gross_sqft": 1188,
    "land_sqft": 4750,
    "year_built": 1950,
    "res_units": 2,
    "com_units": 0,
    "total_units": 2,
    "tax_class": "1",
    "actual_sale_price": 735000,
    "predicted_2019": 494229,
    "predicted_2024": 634049,
    "total_gain": 139820,
    "total_roi_5yr_pct": 28.29
  },
  {
    "borough": "BRONX",
    "block": 3686,
    "lot": 2,
    "gross_sqft": 2472,
    "land_sqft": 2235,
    "year_built": 1925,
    "res_units": 2,
    "com_units": 0,
    "total_units": 2,
    "tax_class": "1",
    "actual_sale_price": 700000,
    "predicted_2019": 493353,
    "predicted_2024": 627869,
    "total_gain": 134516,
    "total_roi_5yr_pct": 27.27
  },
  {
    "borough": "BRONX",
    "block": 5402,
    "lot": 54,
    "gross_sqft": 1880,
    "land_sqft": 2413,
    "year_built": 1930,
    "res_units": 2,
    "com_units": 0,
    "total_units": 2,
    "tax_class": "1",
    "actual_sale_price": 890000,
    "predicted_2019": 491112,
    "predicted_2024": 623491,
    "total_gain": 132379,
    "total_roi_5yr_pct": 26.95
  },
  {
    "borough": "BRONX",
    "block": 2633,
    "lot": 29,
    "gross_sqft": 1770,
    "land_sqft": 2017,
    "year_built": 1901,
    "res_units": 2,
    "com_units": 0,
    "total_units": 2,
    "tax_class": "1",
    "actual_sale_price": 500000,
    "predicted_2019": 490834,
    "predicted_2024": 622950,
    "total_gain": 132116,
    "total_roi_5yr_pct": 26.92
  },
  {
    "borough": "BRONX",
    "block": 4532,
    "lot": 56,
    "gross_sqft": 1600,
    "land_sqft": 2500,
    "year_built": 1920,
    "res_units": 2,
    "com_units": 0,
    "total_units": 2,
    "tax_class": "1",
    "actual_sale_price": 999999,
    "predicted_2019": 491157,
    "predicted_2024": 623310,
    "total_gain": 132153,
    "total_roi_5yr_pct": 26.91
  },
  {
    "borough": "BRONX",
    "block": 3667,
    "lot": 43,
    "gross_sqft": 2310,
    "land_sqft": 2100,
    "year_built": 1993,
    "res_units": 2,
    "com_units": 0,
    "total_units": 2,
    "tax_class": "1",
    "actual_sale_price": 725000,
    "predicted_2019": 493493,
    "predicted_2024": 626073,
    "total_gain": 132580,
    "total_roi_5yr_pct": 26.87
  },
  {
    "borough": "BRONX",
    "block": 5440,
    "lot": 22,
    "gross_sqft": 1728,
    "land_sqft": 2500,
    "year_built": 1920,
    "res_units": 2,
    "com_units": 0,
    "total_units": 2,
    "tax_class": "1",
    "actual_sale_price": 680000,
    "predicted_2019": 491144,
    "predicted_2024": 623049,
    "total_gain": 131905,
    "total_roi_5yr_pct": 26.86
  },
  {
    "borough": "BRONX",
    "block": 4978,
    "lot": 108,
    "gross_sqft": 1386,
    "land_sqft": 2215,
    "year_built": 1950,
    "res_units": 2,
    "com_units": 0,
    "total_units": 2,
    "tax_class": "1",
    "actual_sale_price": 495000,
    "predicted_2019": 489759,
    "predicted_2024": 621178,
    "total_gain": 131419,
    "total_roi_5yr_pct": 26.83
  },
  {
    "borough": "BRONX",
    "block": 5110,
    "lot": 4,
    "gross_sqft": 1550,
    "land_sqft": 1340,
    "year_built": 1949,
    "res_units": 0,
    "com_units": 1,
    "total_units": 1,
    "tax_class": "4",
    "actual_sale_price": 550000,
    "predicted_2019": 493585,
    "predicted_2024": 625698,
    "total_gain": 132113,
    "total_roi_5yr_pct": 26.77
  },
  {
    "borough": "BRONX",
    "block": 5531,
    "lot": 117,
    "gross_sqft": 2344,
    "land_sqft": 3200,
    "year_built": 1945,
    "res_units": 2,
    "com_units": 0,
    "total_units": 2,
    "tax_class": "1",
    "actual_sale_price": 815000,
    "predicted_2019": 494346,
    "predicted_2024": 626485,
    "total_gain": 132139,
    "total_roi_5yr_pct": 26.73
  },
  {
    "borough": "BRONX",
    "block": 3386,
    "lot": 62,
    "gross_sqft": 1348,
    "land_sqft": 2500,
    "year_built": 1901,
    "res_units": 2,
    "com_units": 0,
    "total_units": 2,
    "tax_class": "1",
    "actual_sale_price": 580000,
    "predicted_2019": 489272,
    "predicted_2024": 619908,
    "total_gain": 130636,
    "total_roi_5yr_pct": 26.7
  },
  {
    "borough": "BRONX",
    "block": 5500,
    "lot": 21,
    "gross_sqft": 1836,
    "land_sqft": 2024,
    "year_built": 1960,
    "res_units": 1,
    "com_units": 0,
    "total_units": 1,
    "tax_class": "1",
    "actual_sale_price": 638000,
    "predicted_2019": 489213,
    "predicted_2024": 618188,
    "total_gain": 128975,
    "total_roi_5yr_pct": 26.36
  },
  {
    "borough": "BRONX",
    "block": 5459,
    "lot": 16,
    "gross_sqft": 1636,
    "land_sqft": 1710,
    "year_built": 1955,
    "res_units": 1,
    "com_units": 0,
    "total_units": 1,
    "tax_class": "1",
    "actual_sale_price": 570000,
    "predicted_2019": 487911,
    "predicted_2024": 616445,
    "total_gain": 128534,
    "total_roi_5yr_pct": 26.34
  },
  {
    "borough": "BRONX",
    "block": 2266,
    "lot": 116,
    "gross_sqft": 1480,
    "land_sqft": 1850,
    "year_built": 1998,
    "res_units": 1,
    "com_units": 0,
    "total_units": 1,
    "tax_class": "1",
    "actual_sale_price": 420000,
    "predicted_2019": 484953,
    "predicted_2024": 612348,
    "total_gain": 127395,
    "total_roi_5yr_pct": 26.27
  },
  {
    "borough": "BRONX",
    "block": 5476,
    "lot": 56,
    "gross_sqft": 1670,
    "land_sqft": 2500,
    "year_built": 1920,
    "res_units": 1,
    "com_units": 0,
    "total_units": 1,
    "tax_class": "1",
    "actual_sale_price": 675000,
    "predicted_2019": 489890,
    "predicted_2024": 618588,
    "total_gain": 128698,
    "total_roi_5yr_pct": 26.27
  },
  {
    "borough": "BRONX",
    "block": 5263,
    "lot": 18,
    "gross_sqft": 2250,
    "land_sqft": 1500,
    "year_built": 1931,
    "res_units": 0,
    "com_units": 1,
    "total_units": 1,
    "tax_class": "4",
    "actual_sale_price": 400000,
    "predicted_2019": 497556,
    "predicted_2024": 627291,
    "total_gain": 129735,
    "total_roi_5yr_pct": 26.07
  },
  {
    "borough": "BRONX",
    "block": 4921,
    "lot": 149,
    "gross_sqft": 2146,
    "land_sqft": 3019,
    "year_built": 1995,
    "res_units": 2,
    "com_units": 0,
    "total_units": 2,
    "tax_class": "1",
    "actual_sale_price": 749000,
    "predicted_2019": 494350,
    "predicted_2024": 622552,
    "total_gain": 128202,
    "total_roi_5yr_pct": 25.93
  },
  {
    "borough": "BRONX",
    "block": 4610,
    "lot": 50,
    "gross_sqft": 2160,
    "land_sqft": 2500,
    "year_built": 1915,
    "res_units": 3,
    "com_units": 0,
    "total_units": 3,
    "tax_class": "1",
    "actual_sale_price": 865000,
    "predicted_2019": 494213,
    "predicted_2024": 622296,
    "total_gain": 128083,
    "total_roi_5yr_pct": 25.92
  },
  {
    "borough": "BRONX",
    "block": 4576,
    "lot": 22,
    "gross_sqft": 3780,
    "land_sqft": 2500,
    "year_built": 1920,
    "res_units": 3,
    "com_units": 0,
    "total_units": 3,
    "tax_class": "1",
    "actual_sale_price": 500000,
    "predicted_2019": 504098,
    "predicted_2024": 634196,
    "total_gain": 130098,
    "total_roi_5yr_pct": 25.81
  },
  {
    "borough": "BRONX",
    "block": 4847,
    "lot": 56,
    "gross_sqft": 2110,
    "land_sqft": 2020,
    "year_built": 1955,
    "res_units": 2,
    "com_units": 0,
    "total_units": 2,
    "tax_class": "1",
    "actual_sale_price": 765000,
    "predicted_2019": 493821,
    "predicted_2024": 620938,
    "total_gain": 127117,
    "total_roi_5yr_pct": 25.74
  },
  {
    "borough": "BRONX",
    "block": 5723,
    "lot": 42,
    "gross_sqft": 0,
    "land_sqft": 2500,
    "year_built": 1953,
    "res_units": 1,
    "com_units": 0,
    "total_units": 1,
    "tax_class": "1",
    "actual_sale_price": 605855,
    "predicted_2019": 605855,
    "predicted_2024": 752825,
    "total_gain": 146970,
    "total_roi_5yr_pct": 24.26
  },
  {
    "borough": "BRONX",
    "block": 5813,
    "lot": 105,
    "gross_sqft": 4308,
    "land_sqft": 2154,
    "year_built": 1910,
    "res_units": 1,
    "com_units": 0,
    "total_units": 1,
    "tax_class": "1",
    "actual_sale_price": 652322,
    "predicted_2019": 652322,
    "predicted_2024": 810361,
    "total_gain": 158039,
    "total_roi_5yr_pct": 24.23
  },
  {
    "borough": "BRONX",
    "block": 5517,
    "lot": 1,
    "gross_sqft": 0,
    "land_sqft": 2500,
    "year_built": 1930,
    "res_units": 1,
    "com_units": 0,
    "total_units": 1,
    "tax_class": "1",
    "actual_sale_price": 619897,
    "predicted_2019": 619897,
    "predicted_2024": 769149,
    "total_gain": 149252,
    "total_roi_5yr_pct": 24.08
  },
  {
    "borough": "BRONX",
    "block": 5455,
    "lot": 60,
    "gross_sqft": 0,
    "land_sqft": 2500,
    "year_built": 1921,
    "res_units": 1,
    "com_units": 0,
    "total_units": 1,
    "tax_class": "1",
    "actual_sale_price": 603795,
    "predicted_2019": 603795,
    "predicted_2024": 749171,
    "total_gain": 145376,
    "total_roi_5yr_pct": 24.08
  },
  {
    "borough": "BRONX",
    "block": 2786,
    "lot": 14,
    "gross_sqft": 3196,
    "land_sqft": 1598,
    "year_built": 2007,
    "res_units": 1,
    "com_units": 0,
    "total_units": 1,
    "tax_class": "1",
    "actual_sale_price": 618876,
    "predicted_2019": 618876,
    "predicted_2024": 760760,
    "total_gain": 141884,
    "total_roi_5yr_pct": 22.93
  },
  {
    "borough": "BRONX",
    "block": 3432,
    "lot": 1380,
    "gross_sqft": 0,
    "land_sqft": 2500,
    "year_built": 2005,
    "res_units": 1,
    "com_units": 0,
    "total_units": 1,
    "tax_class": "1",
    "actual_sale_price": 573421,
    "predicted_2019": 573421,
    "predicted_2024": 704189,
    "total_gain": 130768,
    "total_roi_5yr_pct": 22.8
  },
  {
    "borough": "BRONX",
    "block": 4340,
    "lot": 1034,
    "gross_sqft": 0,
    "land_sqft": 2500,
    "year_built": 1957,
    "res_units": 1,
    "com_units": 0,
    "total_units": 1,
    "tax_class": "1",
    "actual_sale_price": 554621,
    "predicted_2019": 554621,
    "predicted_2024": 673121,
    "total_gain": 118500,
    "total_roi_5yr_pct": 21.37
  },
  {
    "borough": "BRONX",
    "block": 5417,
    "lot": 1066,
    "gross_sqft": 0,
    "land_sqft": 2500,
    "year_built": 2002,
    "res_units": 1,
    "com_units": 0,
    "total_units": 1,
    "tax_class": "1",
    "actual_sale_price": 606707,
    "predicted_2019": 606707,
    "predicted_2024": 733895,
    "total_gain": 127188,
    "total_roi_5yr_pct": 20.96
  },
  {
    "borough": "BROOKLYN",
    "block": 1248,
    "lot": 44,
    "gross_sqft": 11000,
    "land_sqft": 5500,
    "year_built": 1931,
    "res_units": 1,
    "com_units": 0,
    "total_units": 1,
    "tax_class": "1",
    "actual_sale_price": 973270,
    "predicted_2019": 973270,
    "predicted_2024": 1143194,
    "total_gain": 169924,
    "total_roi_5yr_pct": 17.46
  },
  {
    "borough": "BROOKLYN",
    "block": 6417,
    "lot": 1112,
    "gross_sqft": 0,
    "land_sqft": 2500,
    "year_built": 2005,
    "res_units": 1,
    "com_units": 0,
    "total_units": 1,
    "tax_class": "1",
    "actual_sale_price": 968748,
    "predicted_2019": 968748,
    "predicted_2024": 1137455,
    "total_gain": 168707,
    "total_roi_5yr_pct": 17.42
  },
  {
    "borough": "BROOKLYN",
    "block": 6051,
    "lot": 11,
    "gross_sqft": 1000,
    "land_sqft": 500,
    "year_built": 1925,
    "res_units": 1,
    "com_units": 0,
    "total_units": 1,
    "tax_class": "1",
    "actual_sale_price": 917557,
    "predicted_2019": 917557,
    "predicted_2024": 1077175,
    "total_gain": 159618,
    "total_roi_5yr_pct": 17.4
  },
  {
    "borough": "BROOKLYN",
    "block": 1223,
    "lot": 69,
    "gross_sqft": 9952,
    "land_sqft": 4976,
    "year_built": 1905,
    "res_units": 1,
    "com_units": 0,
    "total_units": 1,
    "tax_class": "1",
    "actual_sale_price": 971249,
    "predicted_2019": 971249,
    "predicted_2024": 1136800,
    "total_gain": 165551,
    "total_roi_5yr_pct": 17.05
  },
  {
    "borough": "BRONX",
    "block": 2587,
    "lot": 11,
    "gross_sqft": 15056,
    "land_sqft": 7528,
    "year_built": 1931,
    "res_units": 1,
    "com_units": 0,
    "total_units": 1,
    "tax_class": "1",
    "actual_sale_price": 710308,
    "predicted_2019": 710308,
    "predicted_2024": 830425,
    "total_gain": 120117,
    "total_roi_5yr_pct": 16.91
  },
  {
    "borough": "BROOKLYN",
    "block": 5328,
    "lot": 1014,
    "gross_sqft": 0,
    "land_sqft": 2500,
    "year_built": 2002,
    "res_units": 1,
    "com_units": 0,
    "total_units": 1,
    "tax_class": "1",
    "actual_sale_price": 958908,
    "predicted_2019": 958908,
    "predicted_2024": 1119910,
    "total_gain": 161002,
    "total_roi_5yr_pct": 16.79
  },
  {
    "borough": "BRONX",
    "block": 3258,
    "lot": 190,
    "gross_sqft": 153952,
    "land_sqft": 76976,
    "year_built": 1927,
    "res_units": 1,
    "com_units": 0,
    "total_units": 1,
    "tax_class": "1",
    "actual_sale_price": 795853,
    "predicted_2019": 795853,
    "predicted_2024": 923370,
    "total_gain": 127517,
    "total_roi_5yr_pct": 16.02
  },
  {
    "borough": "BROOKLYN",
    "block": 6299,
    "lot": 32,
    "gross_sqft": 0,
    "land_sqft": 2500,
    "year_built": 1939,
    "res_units": 1,
    "com_units": 0,
    "total_units": 1,
    "tax_class": "1",
    "actual_sale_price": 935613,
    "predicted_2019": 935613,
    "predicted_2024": 1077348,
    "total_gain": 141735,
    "total_roi_5yr_pct": 15.15
  },
  {
    "borough": "BRONX",
    "block": 2970,
    "lot": 40,
    "gross_sqft": 14461,
    "land_sqft": 7231,
    "year_built": 1931,
    "res_units": 1,
    "com_units": 0,
    "total_units": 1,
    "tax_class": "1",
    "actual_sale_price": 691705,
    "predicted_2019": 691705,
    "predicted_2024": 793457,
    "total_gain": 101752,
    "total_roi_5yr_pct": 14.71
  },
  {
    "borough": "QUEENS",
    "block": 10524,
    "lot": 150,
    "gross_sqft": 0,
    "land_sqft": 2500,
    "year_built": 1950,
    "res_units": 1,
    "com_units": 0,
    "total_units": 1,
    "tax_class": "1",
    "actual_sale_price": 678242,
    "predicted_2019": 678242,
    "predicted_2024": 774203,
    "total_gain": 95961,
    "total_roi_5yr_pct": 14.15
  },
  {
    "borough": "QUEENS",
    "block": 10524,
    "lot": 150,
    "gross_sqft": 0,
    "land_sqft": 2500,
    "year_built": 1950,
    "res_units": 1,
    "com_units": 0,
    "total_units": 1,
    "tax_class": "1",
    "actual_sale_price": 678242,
    "predicted_2019": 678242,
    "predicted_2024": 774203,
    "total_gain": 95961,
    "total_roi_5yr_pct": 14.15
  },
  {
    "borough": "STATEN ISLAND",
    "block": 1039,
    "lot": 1005,
    "gross_sqft": 0,
    "land_sqft": 2500,
    "year_built": 2008,
    "res_units": 1,
    "com_units": 0,
    "total_units": 1,
    "tax_class": "1",
    "actual_sale_price": 622707,
    "predicted_2019": 622707,
    "predicted_2024": 700162,
    "total_gain": 77455,
    "total_roi_5yr_pct": 12.44
  },
  {
    "borough": "MANHATTAN",
    "block": 218,
    "lot": 1202,
    "gross_sqft": 0,
    "land_sqft": 2500,
    "year_built": 2006,
    "res_units": 1,
    "com_units": 0,
    "total_units": 1,
    "tax_class": "1",
    "actual_sale_price": 1238486,
    "predicted_2019": 1238486,
    "predicted_2024": 1269760,
    "total_gain": 31274,
    "total_roi_5yr_pct": 2.53
  },
  {
    "borough": "MANHATTAN",
    "block": 529,
    "lot": 57,
    "gross_sqft": 0,
    "land_sqft": 2500,
    "year_built": 1900,
    "res_units": 1,
    "com_units": 0,
    "total_units": 1,
    "tax_class": "1",
    "actual_sale_price": 1183885,
    "predicted_2019": 1183885,
    "predicted_2024": 1213779,
    "total_gain": 29894,
    "total_roi_5yr_pct": 2.53
  },
  {
    "borough": "MANHATTAN",
    "block": 142,
    "lot": 1287,
    "gross_sqft": 0,
    "land_sqft": 2500,
    "year_built": 2005,
    "res_units": 1,
    "com_units": 0,
    "total_units": 1,
    "tax_class": "1",
    "actual_sale_price": 1238185,
    "predicted_2019": 1238185,
    "predicted_2024": 1269451,
    "total_gain": 31266,
    "total_roi_5yr_pct": 2.53
  },
  {
    "borough": "MANHATTAN",
    "block": 25,
    "lot": 1473,
    "gross_sqft": 0,
    "land_sqft": 2500,
    "year_built": 2005,
    "res_units": 1,
    "com_units": 0,
    "total_units": 1,
    "tax_class": "1",
    "actual_sale_price": 1224562,
    "predicted_2019": 1224562,
    "predicted_2024": 1255484,
    "total_gain": 30922,
    "total_roi_5yr_pct": 2.53
  },
  {
    "borough": "MANHATTAN",
    "block": 1833,
    "lot": 2149,
    "gross_sqft": 0,
    "land_sqft": 2500,
    "year_built": 1961,
    "res_units": 1,
    "com_units": 0,
    "total_units": 1,
    "tax_class": "1",
    "actual_sale_price": 1242755,
    "predicted_2019": 1242755,
    "predicted_2024": 1274136,
    "total_gain": 31381,
    "total_roi_5yr_pct": 2.53
  },
  {
    "borough": "MANHATTAN",
    "block": 1882,
    "lot": 1191,
    "gross_sqft": 0,
    "land_sqft": 2500,
    "year_built": 2005,
    "res_units": 1,
    "com_units": 0,
    "total_units": 1,
    "tax_class": "1",
    "actual_sale_price": 1242253,
    "predicted_2019": 1242253,
    "predicted_2024": 1273621,
    "total_gain": 31368,
    "total_roi_5yr_pct": 2.53
  },
  {
    "borough": "MANHATTAN",
    "block": 142,
    "lot": 1652,
    "gross_sqft": 0,
    "land_sqft": 2500,
    "year_built": 2006,
    "res_units": 1,
    "com_units": 0,
    "total_units": 1,
    "tax_class": "1",
    "actual_sale_price": 1238486,
    "predicted_2019": 1238486,
    "predicted_2024": 1269760,
    "total_gain": 31274,
    "total_roi_5yr_pct": 2.53
  },
  {
    "borough": "MANHATTAN",
    "block": 1550,
    "lot": 7,
    "gross_sqft": 0,
    "land_sqft": 2500,
    "year_built": 1959,
    "res_units": 1,
    "com_units": 0,
    "total_units": 1,
    "tax_class": "1",
    "actual_sale_price": 1196967,
    "predicted_2019": 1196967,
    "predicted_2024": 1227191,
    "total_gain": 30224,
    "total_roi_5yr_pct": 2.53
  }
]

interface PropertyListing {
  id: string
  borough: string
  block: string
  lot: string
}

const fmtUSD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

const PROPERTY_IMAGES = [
  "/skyline-tower-nyc.jpg",
  "/modern-property-exterior.png",
  "/modern-house-exterior.png",
  "/harborfront-apartments.jpg",
  "/downtown-offices-exterior.jpg"
]

export function AIDiscoveries({ registeredProperties }: { registeredProperties: PropertyListing[] }) {
  // Create a fast lookup for registered properties
  const registeredLookup = useMemo(() => {
    const map = new Map<string, string>() // key -> id
    for (const p of registeredProperties) {
      if (p.borough && p.block && p.lot) {
        const key = `${p.borough.toLowerCase()}-${p.block}-${p.lot}`
        map.set(key, p.id)
      }
    }
    return map
  }, [registeredProperties])

  const registeredExamples = useMemo(() => {
    return AI_EXAMPLES.filter(ex => {
      const lookupKey = `${ex.borough.toLowerCase()}-${ex.block}-${ex.lot}`
      return registeredLookup.has(lookupKey)
    })
  }, [registeredLookup])

  if (registeredExamples.length === 0) {
    return null // Hide section if none are registered
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end justify-between border-b pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-500 mb-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live Intelligence
          </div>
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <Sparkles className="h-6 w-6 text-emerald-500" />
            Top ML Model Discoveries
          </h2>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">
            These are the highest-ROI opportunities automatically surfaced by our predictive pipeline for the Bronx area, cross-referenced with your active properties.
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-4">
        {registeredExamples.map((ex, i) => {
          const lookupKey = `${ex.borough.toLowerCase()}-${ex.block}-${ex.lot}`
          const registeredId = registeredLookup.get(lookupKey)!

          return (
            <Card key={i} className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:shadow-emerald-500/10 border-border/50 bg-gradient-to-b from-card to-card/50">
              {/* Header Image Area */}
              <div className="relative h-40 w-full overflow-hidden flex items-center justify-center">
                {/* Real property image */}
                <img 
                  src={PROPERTY_IMAGES[i % PROPERTY_IMAGES.length]} 
                  alt="Property View" 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Dark gradient overlay so text stays readable */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-slate-900/10"></div>
                
                {/* Badges */}
                <Badge className="absolute top-3 left-3 bg-black/40 text-white backdrop-blur-md border-white/10 shadow-sm font-medium" variant="secondary">
                  <MapPin className="mr-1 h-3 w-3" />
                  Block {ex.block} · Lot {ex.lot}
                </Badge>
                
                <Badge className="absolute top-3 right-3 bg-emerald-500 text-white border-0 shadow-md">
                  Registered
                </Badge>
              </div>
              
              <CardContent className="p-5 space-y-5">
                {/* ROI Section */}
                <div className="flex items-center justify-between rounded-lg bg-emerald-500/5 p-3 border border-emerald-500/10">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Projected 5-Yr ROI</div>
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-lg">
                    <TrendingUp className="h-5 w-5" />
                    {ex.total_roi_5yr_pct.toFixed(1)}%
                  </div>
                </div>

                {/* Financials Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Est. Value (2024)</div>
                    <div className="font-semibold text-foreground text-base tracking-tight">{fmtUSD.format(ex.predicted_2024)}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Projected Gain</div>
                    <div className="font-semibold text-emerald-600 dark:text-emerald-400 text-base tracking-tight">+{fmtUSD.format(ex.total_gain)}</div>
                  </div>
                </div>

                {/* Property Details */}
                <div className="flex items-center justify-between text-xs font-medium text-muted-foreground bg-muted/30 rounded-md p-2.5">
                  <div className="flex flex-col items-center gap-0.5 w-1/3 border-r border-border/50">
                    <span className="text-foreground">{ex.year_built}</span>
                    <span className="text-[10px] uppercase tracking-wider opacity-70">Built</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5 w-1/3 border-r border-border/50">
                    <span className="text-foreground">{ex.gross_sqft.toLocaleString()}</span>
                    <span className="text-[10px] uppercase tracking-wider opacity-70">Sq. Ft.</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5 w-1/3">
                    <span className="text-foreground">{ex.res_units + ex.com_units}</span>
                    <span className="text-[10px] uppercase tracking-wider opacity-70">Units</span>
                  </div>
                </div>

                <Button variant="default" className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm group-hover:shadow-md transition-all" asChild>
                  <Link href={`/properties/${registeredId}`}>
                    View Full Analysis <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
