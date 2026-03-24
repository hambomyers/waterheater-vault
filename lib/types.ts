// Shared types for the WaterHeaterVault lookup table.

export interface WHLookupEntry {
  brand: string
  modelPrefix: string           // match prefix of scanned model (e.g. "NPE-", "PE52")
  modelFull: string             // canonical full model number (e.g. "NPE-210A")
  serialPatternType:
    | 'rheem'         // WWYY or LETTER_YY
    | 'ruud'          // same as rheem
    | 'ao-smith'      // YYWW
    | 'bradford-white'// BWL (decade-letter + year-letter + month-letter)
    | 'navien'        // plant-letter + 2-digit year (A19 → 2019)
    | 'rinnai'        // YYMM
    | 'state'         // YYWW (same factory as ao-smith)
    | 'noritz'        // YYWW first 4 chars
    | 'ge'            // letter=factory, next digit=year
    | 'american'      // YYWW
    | 'whirlpool'     // YYWW
    | 'generic'
  tankSizeGallons: number | null  // null for tankless
  fuelType: 'gas' | 'electric' | 'tankless-gas' | 'tankless-electric' | 'heat-pump'
  typicalLifeYears: number
  fairPriceRangeLow: number       // installed replacement cost, Central Virginia, USD
  fairPriceRangeHigh: number
  manualUrl: string | null
  warrantyUrl: string | null
}
