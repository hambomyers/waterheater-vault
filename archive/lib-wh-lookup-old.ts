'use client'

import type { WHLookupEntry } from './types'

// ─── Model Table ─────────────────────────────────────────────────────────────
// 10 brands × 8-12 real catalog models each.
// Price ranges are installed (labor + parts) for Central Virginia 2024-2025.
// Update fairPriceRange* annually using the inflationFactor above.

export const MODEL_TABLE: WHLookupEntry[] = [

  // ── Rheem ──────────────────────────────────────────────────────────────────
  // Serial: WWYY (week 01-52 + 2-digit year) OR letter+YY (A=Jan … L=Dec)
  { brand: 'Rheem', modelPrefix: 'PROG40', modelFull: 'PROG40-38N RH62',    serialPatternType: 'rheem', tankSizeGallons: 40, fuelType: 'gas',      typicalLifeYears: 12, fairPriceRangeLow: 1350, fairPriceRangeHigh: 1750, manualUrl: 'https://www.rheem.com', warrantyUrl: 'https://www.rheem.com/warranty' },
  { brand: 'Rheem', modelPrefix: 'PROG50', modelFull: 'PROG50-38N RH62',    serialPatternType: 'rheem', tankSizeGallons: 50, fuelType: 'gas',      typicalLifeYears: 12, fairPriceRangeLow: 1450, fairPriceRangeHigh: 1850, manualUrl: 'https://www.rheem.com', warrantyUrl: 'https://www.rheem.com/warranty' },
  { brand: 'Rheem', modelPrefix: 'PROG75', modelFull: 'PROG75-76N RH67',    serialPatternType: 'rheem', tankSizeGallons: 75, fuelType: 'gas',      typicalLifeYears: 12, fairPriceRangeLow: 1750, fairPriceRangeHigh: 2200, manualUrl: 'https://www.rheem.com', warrantyUrl: 'https://www.rheem.com/warranty' },
  { brand: 'Rheem', modelPrefix: 'PROE40', modelFull: 'PROE40 T2 RH45',     serialPatternType: 'rheem', tankSizeGallons: 40, fuelType: 'electric', typicalLifeYears: 12, fairPriceRangeLow: 1050, fairPriceRangeHigh: 1450, manualUrl: 'https://www.rheem.com', warrantyUrl: 'https://www.rheem.com/warranty' },
  { brand: 'Rheem', modelPrefix: 'PROE50', modelFull: 'PROE50 T2 RH45',     serialPatternType: 'rheem', tankSizeGallons: 50, fuelType: 'electric', typicalLifeYears: 12, fairPriceRangeLow: 1150, fairPriceRangeHigh: 1550, manualUrl: 'https://www.rheem.com', warrantyUrl: 'https://www.rheem.com/warranty' },
  { brand: 'Rheem', modelPrefix: 'PROE80', modelFull: 'PROE80 T2 RH45',     serialPatternType: 'rheem', tankSizeGallons: 80, fuelType: 'electric', typicalLifeYears: 12, fairPriceRangeLow: 1350, fairPriceRangeHigh: 1750, manualUrl: 'https://www.rheem.com', warrantyUrl: 'https://www.rheem.com/warranty' },
  { brand: 'Rheem', modelPrefix: 'PROPH50', modelFull: 'PROPH50 T2 RH350',  serialPatternType: 'rheem', tankSizeGallons: 50, fuelType: 'heat-pump',typicalLifeYears: 15, fairPriceRangeLow: 1800, fairPriceRangeHigh: 2400, manualUrl: 'https://www.rheem.com', warrantyUrl: 'https://www.rheem.com/warranty' },
  { brand: 'Rheem', modelPrefix: 'PROPH80', modelFull: 'PROPH80 T2 RH350',  serialPatternType: 'rheem', tankSizeGallons: 80, fuelType: 'heat-pump',typicalLifeYears: 15, fairPriceRangeLow: 2000, fairPriceRangeHigh: 2600, manualUrl: 'https://www.rheem.com', warrantyUrl: 'https://www.rheem.com/warranty' },
  { brand: 'Rheem', modelPrefix: 'RTEM',   modelFull: 'RTEM-18',            serialPatternType: 'rheem', tankSizeGallons: null, fuelType: 'tankless-electric', typicalLifeYears: 20, fairPriceRangeLow: 900,  fairPriceRangeHigh: 1300, manualUrl: 'https://www.rheem.com', warrantyUrl: 'https://www.rheem.com/warranty' },
  { brand: 'Rheem', modelPrefix: 'RTGH',   modelFull: 'RTGH-95DVLN',        serialPatternType: 'rheem', tankSizeGallons: null, fuelType: 'tankless-gas',      typicalLifeYears: 20, fairPriceRangeLow: 2100, fairPriceRangeHigh: 2800, manualUrl: 'https://www.rheem.com', warrantyUrl: 'https://www.rheem.com/warranty' },

  // ── Ruud ───────────────────────────────────────────────────────────────────
  // Serial: same factory as Rheem — WWYY or LETTER_YY
  { brand: 'Ruud', modelPrefix: 'PE40',   modelFull: 'PE40-1',              serialPatternType: 'ruud', tankSizeGallons: 40, fuelType: 'electric', typicalLifeYears: 12, fairPriceRangeLow: 1050, fairPriceRangeHigh: 1450, manualUrl: 'https://www.ruud.com', warrantyUrl: 'https://www.ruud.com/warranty' },
  { brand: 'Ruud', modelPrefix: 'PE50',   modelFull: 'PE52-2 B',            serialPatternType: 'ruud', tankSizeGallons: 50, fuelType: 'electric', typicalLifeYears: 12, fairPriceRangeLow: 1150, fairPriceRangeHigh: 1550, manualUrl: 'https://www.ruud.com', warrantyUrl: 'https://www.ruud.com/warranty' },
  { brand: 'Ruud', modelPrefix: 'PE80',   modelFull: 'PE80-2 B',            serialPatternType: 'ruud', tankSizeGallons: 80, fuelType: 'electric', typicalLifeYears: 12, fairPriceRangeLow: 1350, fairPriceRangeHigh: 1750, manualUrl: 'https://www.ruud.com', warrantyUrl: 'https://www.ruud.com/warranty' },
  { brand: 'Ruud', modelPrefix: 'PG40',   modelFull: 'PG40S-36N',           serialPatternType: 'ruud', tankSizeGallons: 40, fuelType: 'gas',      typicalLifeYears: 12, fairPriceRangeLow: 1300, fairPriceRangeHigh: 1700, manualUrl: 'https://www.ruud.com', warrantyUrl: 'https://www.ruud.com/warranty' },
  { brand: 'Ruud', modelPrefix: 'PG50',   modelFull: 'PG50S-38N',           serialPatternType: 'ruud', tankSizeGallons: 50, fuelType: 'gas',      typicalLifeYears: 12, fairPriceRangeLow: 1400, fairPriceRangeHigh: 1800, manualUrl: 'https://www.ruud.com', warrantyUrl: 'https://www.ruud.com/warranty' },
  { brand: 'Ruud', modelPrefix: 'PG75',   modelFull: 'PG75S-76N',           serialPatternType: 'ruud', tankSizeGallons: 75, fuelType: 'gas',      typicalLifeYears: 12, fairPriceRangeLow: 1700, fairPriceRangeHigh: 2150, manualUrl: 'https://www.ruud.com', warrantyUrl: 'https://www.ruud.com/warranty' },
  { brand: 'Ruud', modelPrefix: 'PRG50',  modelFull: 'PRG50-42N',           serialPatternType: 'ruud', tankSizeGallons: 50, fuelType: 'gas',      typicalLifeYears: 12, fairPriceRangeLow: 1500, fairPriceRangeHigh: 1900, manualUrl: 'https://www.ruud.com', warrantyUrl: 'https://www.ruud.com/warranty' },
  { brand: 'Ruud', modelPrefix: 'PHE',    modelFull: 'PHE80',               serialPatternType: 'ruud', tankSizeGallons: 80, fuelType: 'heat-pump',typicalLifeYears: 15, fairPriceRangeLow: 2000, fairPriceRangeHigh: 2600, manualUrl: 'https://www.ruud.com', warrantyUrl: 'https://www.ruud.com/warranty' },
  { brand: 'Ruud', modelPrefix: 'RGNSX',  modelFull: 'RGNSX-100',           serialPatternType: 'ruud', tankSizeGallons: null, fuelType: 'tankless-gas', typicalLifeYears: 20, fairPriceRangeLow: 2200, fairPriceRangeHigh: 2900, manualUrl: 'https://www.ruud.com', warrantyUrl: 'https://www.ruud.com/warranty' },

  // ── AO Smith ───────────────────────────────────────────────────────────────
  // Serial: YYWW (2-digit year + 2-digit week)
  { brand: 'AO Smith', modelPrefix: 'ENS',    modelFull: 'ENS-50',          serialPatternType: 'ao-smith', tankSizeGallons: 50, fuelType: 'gas',      typicalLifeYears: 12, fairPriceRangeLow: 1400, fairPriceRangeHigh: 1850, manualUrl: 'https://www.aosmith.com', warrantyUrl: 'https://www.aosmith.com/warranty' },
  { brand: 'AO Smith', modelPrefix: 'GPVH',   modelFull: 'GPVH-40L',        serialPatternType: 'ao-smith', tankSizeGallons: 40, fuelType: 'gas',      typicalLifeYears: 12, fairPriceRangeLow: 1350, fairPriceRangeHigh: 1750, manualUrl: 'https://www.aosmith.com', warrantyUrl: 'https://www.aosmith.com/warranty' },
  { brand: 'AO Smith', modelPrefix: 'GPVH',   modelFull: 'GPVH-50L',        serialPatternType: 'ao-smith', tankSizeGallons: 50, fuelType: 'gas',      typicalLifeYears: 12, fairPriceRangeLow: 1450, fairPriceRangeHigh: 1850, manualUrl: 'https://www.aosmith.com', warrantyUrl: 'https://www.aosmith.com/warranty' },
  { brand: 'AO Smith', modelPrefix: 'GPDH',   modelFull: 'GPDH-50L',        serialPatternType: 'ao-smith', tankSizeGallons: 50, fuelType: 'gas',      typicalLifeYears: 12, fairPriceRangeLow: 1500, fairPriceRangeHigh: 1900, manualUrl: 'https://www.aosmith.com', warrantyUrl: 'https://www.aosmith.com/warranty' },
  { brand: 'AO Smith', modelPrefix: 'GPSH',   modelFull: 'GPSH-40L',        serialPatternType: 'ao-smith', tankSizeGallons: 40, fuelType: 'gas',      typicalLifeYears: 12, fairPriceRangeLow: 1350, fairPriceRangeHigh: 1750, manualUrl: 'https://www.aosmith.com', warrantyUrl: 'https://www.aosmith.com/warranty' },
  { brand: 'AO Smith', modelPrefix: 'ELSV',   modelFull: 'ELSV-40',         serialPatternType: 'ao-smith', tankSizeGallons: 40, fuelType: 'electric', typicalLifeYears: 12, fairPriceRangeLow: 1050, fairPriceRangeHigh: 1450, manualUrl: 'https://www.aosmith.com', warrantyUrl: 'https://www.aosmith.com/warranty' },
  { brand: 'AO Smith', modelPrefix: 'ELSV',   modelFull: 'ELSV-50',         serialPatternType: 'ao-smith', tankSizeGallons: 50, fuelType: 'electric', typicalLifeYears: 12, fairPriceRangeLow: 1150, fairPriceRangeHigh: 1550, manualUrl: 'https://www.aosmith.com', warrantyUrl: 'https://www.aosmith.com/warranty' },
  { brand: 'AO Smith', modelPrefix: 'HPTU',   modelFull: 'HPTU-50',         serialPatternType: 'ao-smith', tankSizeGallons: 50, fuelType: 'heat-pump',typicalLifeYears: 15, fairPriceRangeLow: 1800, fairPriceRangeHigh: 2400, manualUrl: 'https://www.aosmith.com', warrantyUrl: 'https://www.aosmith.com/warranty' },
  { brand: 'AO Smith', modelPrefix: 'HPTU',   modelFull: 'HPTU-80',         serialPatternType: 'ao-smith', tankSizeGallons: 80, fuelType: 'heat-pump',typicalLifeYears: 15, fairPriceRangeLow: 2000, fairPriceRangeHigh: 2600, manualUrl: 'https://www.aosmith.com', warrantyUrl: 'https://www.aosmith.com/warranty' },
  { brand: 'AO Smith', modelPrefix: 'ATI',    modelFull: 'ATI-310P',        serialPatternType: 'ao-smith', tankSizeGallons: null, fuelType: 'tankless-gas', typicalLifeYears: 20, fairPriceRangeLow: 2200, fairPriceRangeHigh: 2900, manualUrl: 'https://www.aosmith.com', warrantyUrl: 'https://www.aosmith.com/warranty' },

  // ── Bradford White ─────────────────────────────────────────────────────────
  // Serial: BWL (char1=decade A=2000s/B=2010s/C=2020s, char2=yr A=0…J=9, char3=mo A=Jan…L=Dec)
  { brand: 'Bradford White', modelPrefix: 'M2TW75',  modelFull: 'M2TW75T6FBN',    serialPatternType: 'bradford-white', tankSizeGallons: 75, fuelType: 'gas',      typicalLifeYears: 12, fairPriceRangeLow: 1750, fairPriceRangeHigh: 2200, manualUrl: 'https://www.bradfordwhite.com', warrantyUrl: 'https://www.bradfordwhite.com/warranty' },
  { brand: 'Bradford White', modelPrefix: 'MI50',    modelFull: 'MI50L6DS-1NCW',   serialPatternType: 'bradford-white', tankSizeGallons: 50, fuelType: 'electric', typicalLifeYears: 12, fairPriceRangeLow: 1150, fairPriceRangeHigh: 1550, manualUrl: 'https://www.bradfordwhite.com', warrantyUrl: 'https://www.bradfordwhite.com/warranty' },
  { brand: 'Bradford White', modelPrefix: 'MI40',    modelFull: 'MI40L6DS-1NCW',   serialPatternType: 'bradford-white', tankSizeGallons: 40, fuelType: 'electric', typicalLifeYears: 12, fairPriceRangeLow: 1050, fairPriceRangeHigh: 1450, manualUrl: 'https://www.bradfordwhite.com', warrantyUrl: 'https://www.bradfordwhite.com/warranty' },
  { brand: 'Bradford White', modelPrefix: 'MI75',    modelFull: 'MI75T6DS-1NCW',   serialPatternType: 'bradford-white', tankSizeGallons: 75, fuelType: 'electric', typicalLifeYears: 12, fairPriceRangeLow: 1350, fairPriceRangeHigh: 1800, manualUrl: 'https://www.bradfordwhite.com', warrantyUrl: 'https://www.bradfordwhite.com/warranty' },
  { brand: 'Bradford White', modelPrefix: 'RE350',   modelFull: 'RE350T6-1NCWW',   serialPatternType: 'bradford-white', tankSizeGallons: 30, fuelType: 'electric', typicalLifeYears: 12, fairPriceRangeLow:  950, fairPriceRangeHigh: 1350, manualUrl: 'https://www.bradfordwhite.com', warrantyUrl: 'https://www.bradfordwhite.com/warranty' },
  { brand: 'Bradford White', modelPrefix: 'MH80',    modelFull: 'MH80T8BN-262',    serialPatternType: 'bradford-white', tankSizeGallons: 80, fuelType: 'gas',      typicalLifeYears: 12, fairPriceRangeLow: 1800, fairPriceRangeHigh: 2300, manualUrl: 'https://www.bradfordwhite.com', warrantyUrl: 'https://www.bradfordwhite.com/warranty' },
  { brand: 'Bradford White', modelPrefix: 'MHE50',   modelFull: 'MHE50T8BN',       serialPatternType: 'bradford-white', tankSizeGallons: 50, fuelType: 'gas',      typicalLifeYears: 12, fairPriceRangeLow: 1500, fairPriceRangeHigh: 1950, manualUrl: 'https://www.bradfordwhite.com', warrantyUrl: 'https://www.bradfordwhite.com/warranty' },
  { brand: 'Bradford White', modelPrefix: 'RG275',   modelFull: 'RG275T6N',        serialPatternType: 'bradford-white', tankSizeGallons: 75, fuelType: 'gas',      typicalLifeYears: 12, fairPriceRangeLow: 1800, fairPriceRangeHigh: 2250, manualUrl: 'https://www.bradfordwhite.com', warrantyUrl: 'https://www.bradfordwhite.com/warranty' },
  { brand: 'Bradford White', modelPrefix: 'MITW50',  modelFull: 'MITW5036S3N',     serialPatternType: 'bradford-white', tankSizeGallons: 50, fuelType: 'gas',      typicalLifeYears: 12, fairPriceRangeLow: 1450, fairPriceRangeHigh: 1900, manualUrl: 'https://www.bradfordwhite.com', warrantyUrl: 'https://www.bradfordwhite.com/warranty' },

  // ── State ──────────────────────────────────────────────────────────────────
  // Serial: YYWW (same factory network as AO Smith)
  { brand: 'State', modelPrefix: 'GS6-50',  modelFull: 'GS6-50-YHTX',      serialPatternType: 'state', tankSizeGallons: 50, fuelType: 'gas',      typicalLifeYears: 12, fairPriceRangeLow: 1400, fairPriceRangeHigh: 1800, manualUrl: 'https://www.statewaterheaters.com', warrantyUrl: 'https://www.statewaterheaters.com/warranty' },
  { brand: 'State', modelPrefix: 'GS6-40',  modelFull: 'GS6-40-YHTX',      serialPatternType: 'state', tankSizeGallons: 40, fuelType: 'gas',      typicalLifeYears: 12, fairPriceRangeLow: 1300, fairPriceRangeHigh: 1700, manualUrl: 'https://www.statewaterheaters.com', warrantyUrl: 'https://www.statewaterheaters.com/warranty' },
  { brand: 'State', modelPrefix: 'GS6-75',  modelFull: 'GS6-75-YJSA',      serialPatternType: 'state', tankSizeGallons: 75, fuelType: 'gas',      typicalLifeYears: 12, fairPriceRangeLow: 1700, fairPriceRangeHigh: 2150, manualUrl: 'https://www.statewaterheaters.com', warrantyUrl: 'https://www.statewaterheaters.com/warranty' },
  { brand: 'State', modelPrefix: 'ES6-40',  modelFull: 'ES6-40-DORS',      serialPatternType: 'state', tankSizeGallons: 40, fuelType: 'electric', typicalLifeYears: 12, fairPriceRangeLow: 1050, fairPriceRangeHigh: 1450, manualUrl: 'https://www.statewaterheaters.com', warrantyUrl: 'https://www.statewaterheaters.com/warranty' },
  { brand: 'State', modelPrefix: 'ES6-50',  modelFull: 'ES6-50-DORS',      serialPatternType: 'state', tankSizeGallons: 50, fuelType: 'electric', typicalLifeYears: 12, fairPriceRangeLow: 1150, fairPriceRangeHigh: 1550, manualUrl: 'https://www.statewaterheaters.com', warrantyUrl: 'https://www.statewaterheaters.com/warranty' },
  { brand: 'State', modelPrefix: 'ES6-80',  modelFull: 'ES6-80-DORS',      serialPatternType: 'state', tankSizeGallons: 80, fuelType: 'electric', typicalLifeYears: 12, fairPriceRangeLow: 1350, fairPriceRangeHigh: 1750, manualUrl: 'https://www.statewaterheaters.com', warrantyUrl: 'https://www.statewaterheaters.com/warranty' },
  { brand: 'State', modelPrefix: 'GP6-50',  modelFull: 'GP6-50-YBVT',      serialPatternType: 'state', tankSizeGallons: 50, fuelType: 'gas',      typicalLifeYears: 12, fairPriceRangeLow: 1500, fairPriceRangeHigh: 1900, manualUrl: 'https://www.statewaterheaters.com', warrantyUrl: 'https://www.statewaterheaters.com/warranty' },
  { brand: 'State', modelPrefix: 'SHP-50',  modelFull: 'SHP-50-NOCT-RS',   serialPatternType: 'state', tankSizeGallons: 50, fuelType: 'heat-pump',typicalLifeYears: 15, fairPriceRangeLow: 1800, fairPriceRangeHigh: 2400, manualUrl: 'https://www.statewaterheaters.com', warrantyUrl: 'https://www.statewaterheaters.com/warranty' },
  { brand: 'State', modelPrefix: 'GCR-50',  modelFull: 'GCR-50-DVIT',      serialPatternType: 'state', tankSizeGallons: 50, fuelType: 'gas',      typicalLifeYears: 12, fairPriceRangeLow: 1550, fairPriceRangeHigh: 2000, manualUrl: 'https://www.statewaterheaters.com', warrantyUrl: 'https://www.statewaterheaters.com/warranty' },

  // ── Navien ─────────────────────────────────────────────────────────────────
  // Serial decode — VERIFIED from real NPE-210A label (SN : 7412A1971271065):
  //   Find the plant letter (A/C/X etc.) in the serial string.
  //   The TWO digits immediately after that letter = year suffix (2000 + digits).
  //   Example: "7412A19..." → "A19" → 2019. Month is NOT encoded; use YYYY-01.
  { brand: 'Navien', modelPrefix: 'NPE-150A', modelFull: 'NPE-150A',   serialPatternType: 'navien', tankSizeGallons: null, fuelType: 'tankless-gas', typicalLifeYears: 20, fairPriceRangeLow: 2200, fairPriceRangeHigh: 2800, manualUrl: 'https://www.navieninc.com', warrantyUrl: 'https://www.navieninc.com/warranty' },
  { brand: 'Navien', modelPrefix: 'NPE-180A', modelFull: 'NPE-180A',   serialPatternType: 'navien', tankSizeGallons: null, fuelType: 'tankless-gas', typicalLifeYears: 20, fairPriceRangeLow: 2300, fairPriceRangeHigh: 2900, manualUrl: 'https://www.navieninc.com', warrantyUrl: 'https://www.navieninc.com/warranty' },
  { brand: 'Navien', modelPrefix: 'NPE-210A', modelFull: 'NPE-210A',   serialPatternType: 'navien', tankSizeGallons: null, fuelType: 'tankless-gas', typicalLifeYears: 20, fairPriceRangeLow: 2400, fairPriceRangeHigh: 3000, manualUrl: 'https://www.navieninc.com', warrantyUrl: 'https://www.navieninc.com/warranty' },
  { brand: 'Navien', modelPrefix: 'NPE-240A', modelFull: 'NPE-240A',   serialPatternType: 'navien', tankSizeGallons: null, fuelType: 'tankless-gas', typicalLifeYears: 20, fairPriceRangeLow: 2500, fairPriceRangeHigh: 3100, manualUrl: 'https://www.navieninc.com', warrantyUrl: 'https://www.navieninc.com/warranty' },
  { brand: 'Navien', modelPrefix: 'NPE-150S', modelFull: 'NPE-150S2',  serialPatternType: 'navien', tankSizeGallons: null, fuelType: 'tankless-gas', typicalLifeYears: 20, fairPriceRangeLow: 2300, fairPriceRangeHigh: 2950, manualUrl: 'https://www.navieninc.com', warrantyUrl: 'https://www.navieninc.com/warranty' },
  { brand: 'Navien', modelPrefix: 'NPE-180S', modelFull: 'NPE-180S2',  serialPatternType: 'navien', tankSizeGallons: null, fuelType: 'tankless-gas', typicalLifeYears: 20, fairPriceRangeLow: 2400, fairPriceRangeHigh: 3050, manualUrl: 'https://www.navieninc.com', warrantyUrl: 'https://www.navieninc.com/warranty' },
  { brand: 'Navien', modelPrefix: 'NPE-210S', modelFull: 'NPE-210S2',  serialPatternType: 'navien', tankSizeGallons: null, fuelType: 'tankless-gas', typicalLifeYears: 20, fairPriceRangeLow: 2500, fairPriceRangeHigh: 3150, manualUrl: 'https://www.navieninc.com', warrantyUrl: 'https://www.navieninc.com/warranty' },
  { brand: 'Navien', modelPrefix: 'NPE-240S', modelFull: 'NPE-240S2',  serialPatternType: 'navien', tankSizeGallons: null, fuelType: 'tankless-gas', typicalLifeYears: 20, fairPriceRangeLow: 2600, fairPriceRangeHigh: 3250, manualUrl: 'https://www.navieninc.com', warrantyUrl: 'https://www.navieninc.com/warranty' },
  { brand: 'Navien', modelPrefix: 'NCB-180',  modelFull: 'NCB-180E',   serialPatternType: 'navien', tankSizeGallons: null, fuelType: 'tankless-gas', typicalLifeYears: 20, fairPriceRangeLow: 2600, fairPriceRangeHigh: 3300, manualUrl: 'https://www.navieninc.com', warrantyUrl: 'https://www.navieninc.com/warranty' },
  { brand: 'Navien', modelPrefix: 'NFC-175',  modelFull: 'NFC-175H',   serialPatternType: 'navien', tankSizeGallons: null, fuelType: 'tankless-gas', typicalLifeYears: 20, fairPriceRangeLow: 2700, fairPriceRangeHigh: 3400, manualUrl: 'https://www.navieninc.com', warrantyUrl: 'https://www.navieninc.com/warranty' },

  // ── Rinnai ─────────────────────────────────────────────────────────────────
  // Serial: YYMM (first 4 chars = 2-digit year + 2-digit month)
  { brand: 'Rinnai', modelPrefix: 'RU130',   modelFull: 'RU130iN',    serialPatternType: 'rinnai', tankSizeGallons: null, fuelType: 'tankless-gas', typicalLifeYears: 20, fairPriceRangeLow: 2100, fairPriceRangeHigh: 2700, manualUrl: 'https://www.rinnai.us', warrantyUrl: 'https://www.rinnai.us/warranty' },
  { brand: 'Rinnai', modelPrefix: 'RU160',   modelFull: 'RU160iN',    serialPatternType: 'rinnai', tankSizeGallons: null, fuelType: 'tankless-gas', typicalLifeYears: 20, fairPriceRangeLow: 2200, fairPriceRangeHigh: 2800, manualUrl: 'https://www.rinnai.us', warrantyUrl: 'https://www.rinnai.us/warranty' },
  { brand: 'Rinnai', modelPrefix: 'RU199i',  modelFull: 'RU199iN',    serialPatternType: 'rinnai', tankSizeGallons: null, fuelType: 'tankless-gas', typicalLifeYears: 20, fairPriceRangeLow: 2300, fairPriceRangeHigh: 2950, manualUrl: 'https://www.rinnai.us', warrantyUrl: 'https://www.rinnai.us/warranty' },
  { brand: 'Rinnai', modelPrefix: 'RU199e',  modelFull: 'RU199eN',    serialPatternType: 'rinnai', tankSizeGallons: null, fuelType: 'tankless-gas', typicalLifeYears: 20, fairPriceRangeLow: 2200, fairPriceRangeHigh: 2850, manualUrl: 'https://www.rinnai.us', warrantyUrl: 'https://www.rinnai.us/warranty' },
  { brand: 'Rinnai', modelPrefix: 'RL75i',   modelFull: 'RL75iN',     serialPatternType: 'rinnai', tankSizeGallons: null, fuelType: 'tankless-gas', typicalLifeYears: 20, fairPriceRangeLow: 2000, fairPriceRangeHigh: 2600, manualUrl: 'https://www.rinnai.us', warrantyUrl: 'https://www.rinnai.us/warranty' },
  { brand: 'Rinnai', modelPrefix: 'RL75e',   modelFull: 'RL75eN',     serialPatternType: 'rinnai', tankSizeGallons: null, fuelType: 'tankless-gas', typicalLifeYears: 20, fairPriceRangeLow: 1950, fairPriceRangeHigh: 2550, manualUrl: 'https://www.rinnai.us', warrantyUrl: 'https://www.rinnai.us/warranty' },
  { brand: 'Rinnai', modelPrefix: 'RLX94i',  modelFull: 'RLX94iN',   serialPatternType: 'rinnai', tankSizeGallons: null, fuelType: 'tankless-gas', typicalLifeYears: 20, fairPriceRangeLow: 2100, fairPriceRangeHigh: 2700, manualUrl: 'https://www.rinnai.us', warrantyUrl: 'https://www.rinnai.us/warranty' },
  { brand: 'Rinnai', modelPrefix: 'RLX94e',  modelFull: 'RLX94eN',   serialPatternType: 'rinnai', tankSizeGallons: null, fuelType: 'tankless-gas', typicalLifeYears: 20, fairPriceRangeLow: 2050, fairPriceRangeHigh: 2650, manualUrl: 'https://www.rinnai.us', warrantyUrl: 'https://www.rinnai.us/warranty' },
  { brand: 'Rinnai', modelPrefix: 'RSC199',  modelFull: 'RSC199iN',  serialPatternType: 'rinnai', tankSizeGallons: null, fuelType: 'tankless-gas', typicalLifeYears: 20, fairPriceRangeLow: 2400, fairPriceRangeHigh: 3100, manualUrl: 'https://www.rinnai.us', warrantyUrl: 'https://www.rinnai.us/warranty' },
  { brand: 'Rinnai', modelPrefix: 'RU199iP', modelFull: 'RU199iP',   serialPatternType: 'rinnai', tankSizeGallons: null, fuelType: 'tankless-gas', typicalLifeYears: 20, fairPriceRangeLow: 2350, fairPriceRangeHigh: 3000, manualUrl: 'https://www.rinnai.us', warrantyUrl: 'https://www.rinnai.us/warranty' },

  // ── GE ─────────────────────────────────────────────────────────────────────
  // Serial: letter=factory, next digit=year offset from 2001 (A=2001, B=2002…)
  { brand: 'GE', modelPrefix: 'GEH50D', modelFull: 'GEH50DFEJSR',   serialPatternType: 'ge', tankSizeGallons: 50, fuelType: 'heat-pump', typicalLifeYears: 15, fairPriceRangeLow: 1850, fairPriceRangeHigh: 2450, manualUrl: 'https://www.geappliances.com', warrantyUrl: 'https://www.geappliances.com/warranty' },
  { brand: 'GE', modelPrefix: 'GEH80D', modelFull: 'GEH80DFEJSR',   serialPatternType: 'ge', tankSizeGallons: 80, fuelType: 'heat-pump', typicalLifeYears: 15, fairPriceRangeLow: 2050, fairPriceRangeHigh: 2650, manualUrl: 'https://www.geappliances.com', warrantyUrl: 'https://www.geappliances.com/warranty' },
  { brand: 'GE', modelPrefix: 'GE40T10', modelFull: 'GE40T10BAM',   serialPatternType: 'ge', tankSizeGallons: 40, fuelType: 'electric',  typicalLifeYears: 12, fairPriceRangeLow: 1050, fairPriceRangeHigh: 1450, manualUrl: 'https://www.geappliances.com', warrantyUrl: 'https://www.geappliances.com/warranty' },
  { brand: 'GE', modelPrefix: 'GE50T10', modelFull: 'GE50T10BAM',   serialPatternType: 'ge', tankSizeGallons: 50, fuelType: 'electric',  typicalLifeYears: 12, fairPriceRangeLow: 1150, fairPriceRangeHigh: 1550, manualUrl: 'https://www.geappliances.com', warrantyUrl: 'https://www.geappliances.com/warranty' },
  { brand: 'GE', modelPrefix: 'GE80T10', modelFull: 'GE80T10BAM',   serialPatternType: 'ge', tankSizeGallons: 80, fuelType: 'electric',  typicalLifeYears: 12, fairPriceRangeLow: 1350, fairPriceRangeHigh: 1750, manualUrl: 'https://www.geappliances.com', warrantyUrl: 'https://www.geappliances.com/warranty' },
  { brand: 'GE', modelPrefix: 'GE40S10', modelFull: 'GE40S10BLM',   serialPatternType: 'ge', tankSizeGallons: 40, fuelType: 'electric',  typicalLifeYears: 12, fairPriceRangeLow: 1000, fairPriceRangeHigh: 1400, manualUrl: 'https://www.geappliances.com', warrantyUrl: 'https://www.geappliances.com/warranty' },
  { brand: 'GE', modelPrefix: 'GE30T06', modelFull: 'GE30T06BAR',   serialPatternType: 'ge', tankSizeGallons: 30, fuelType: 'electric',  typicalLifeYears: 12, fairPriceRangeLow:  900, fairPriceRangeHigh: 1300, manualUrl: 'https://www.geappliances.com', warrantyUrl: 'https://www.geappliances.com/warranty' },
  { brand: 'GE', modelPrefix: 'GEH50DE', modelFull: 'GEH50DEED',    serialPatternType: 'ge', tankSizeGallons: 50, fuelType: 'heat-pump', typicalLifeYears: 15, fairPriceRangeLow: 1750, fairPriceRangeHigh: 2350, manualUrl: 'https://www.geappliances.com', warrantyUrl: 'https://www.geappliances.com/warranty' },

  // ── American Water Heater ──────────────────────────────────────────────────
  // Serial: YYWW (same factory group as AO Smith / State)
  { brand: 'American', modelPrefix: 'G62-40',  modelFull: 'G62-40T40-3NV',   serialPatternType: 'american', tankSizeGallons: 40, fuelType: 'gas',      typicalLifeYears: 12, fairPriceRangeLow: 1300, fairPriceRangeHigh: 1700, manualUrl: 'https://www.americanwaterheater.com', warrantyUrl: null },
  { brand: 'American', modelPrefix: 'G62-50',  modelFull: 'G62-50T40-3NV',   serialPatternType: 'american', tankSizeGallons: 50, fuelType: 'gas',      typicalLifeYears: 12, fairPriceRangeLow: 1400, fairPriceRangeHigh: 1800, manualUrl: 'https://www.americanwaterheater.com', warrantyUrl: null },
  { brand: 'American', modelPrefix: 'E62-40',  modelFull: 'E62-40T40-3CV',   serialPatternType: 'american', tankSizeGallons: 40, fuelType: 'electric', typicalLifeYears: 12, fairPriceRangeLow: 1050, fairPriceRangeHigh: 1450, manualUrl: 'https://www.americanwaterheater.com', warrantyUrl: null },
  { brand: 'American', modelPrefix: 'E62-50',  modelFull: 'E62-50T40-3CV',   serialPatternType: 'american', tankSizeGallons: 50, fuelType: 'electric', typicalLifeYears: 12, fairPriceRangeLow: 1150, fairPriceRangeHigh: 1550, manualUrl: 'https://www.americanwaterheater.com', warrantyUrl: null },
  { brand: 'American', modelPrefix: 'NTGH',    modelFull: 'NTGH-50',         serialPatternType: 'american', tankSizeGallons: 50, fuelType: 'gas',      typicalLifeYears: 12, fairPriceRangeLow: 1450, fairPriceRangeHigh: 1850, manualUrl: 'https://www.americanwaterheater.com', warrantyUrl: null },
  { brand: 'American', modelPrefix: 'PCG2-50', modelFull: 'PCG2-50T40-3NV',  serialPatternType: 'american', tankSizeGallons: 50, fuelType: 'gas',      typicalLifeYears: 12, fairPriceRangeLow: 1500, fairPriceRangeHigh: 1900, manualUrl: 'https://www.americanwaterheater.com', warrantyUrl: null },
  { brand: 'American', modelPrefix: 'PCE2-50', modelFull: 'PCE2-50T40-3PV',  serialPatternType: 'american', tankSizeGallons: 50, fuelType: 'electric', typicalLifeYears: 12, fairPriceRangeLow: 1200, fairPriceRangeHigh: 1600, manualUrl: 'https://www.americanwaterheater.com', warrantyUrl: null },
  { brand: 'American', modelPrefix: 'HTR10',   modelFull: 'HTR10D',          serialPatternType: 'american', tankSizeGallons: 10, fuelType: 'electric', typicalLifeYears: 10, fairPriceRangeLow:  650, fairPriceRangeHigh:  950, manualUrl: 'https://www.americanwaterheater.com', warrantyUrl: null },

  // ── Whirlpool ──────────────────────────────────────────────────────────────
  // Serial: YYWW (manufactured by A.O. Smith factory)
  { brand: 'Whirlpool', modelPrefix: 'E2F40RD', modelFull: 'E2F40RD045V',    serialPatternType: 'whirlpool', tankSizeGallons: 40, fuelType: 'electric', typicalLifeYears: 12, fairPriceRangeLow: 1050, fairPriceRangeHigh: 1450, manualUrl: null, warrantyUrl: null },
  { brand: 'Whirlpool', modelPrefix: 'E2F50HD', modelFull: 'E2F50HD045V',    serialPatternType: 'whirlpool', tankSizeGallons: 50, fuelType: 'electric', typicalLifeYears: 12, fairPriceRangeLow: 1150, fairPriceRangeHigh: 1550, manualUrl: null, warrantyUrl: null },
  { brand: 'Whirlpool', modelPrefix: 'E2F80HD', modelFull: 'E2F80HD045V',    serialPatternType: 'whirlpool', tankSizeGallons: 80, fuelType: 'electric', typicalLifeYears: 12, fairPriceRangeLow: 1350, fairPriceRangeHigh: 1750, manualUrl: null, warrantyUrl: null },
  { brand: 'Whirlpool', modelPrefix: 'N40T61',  modelFull: 'N40T61-403',     serialPatternType: 'whirlpool', tankSizeGallons: 40, fuelType: 'gas',      typicalLifeYears: 12, fairPriceRangeLow: 1250, fairPriceRangeHigh: 1650, manualUrl: null, warrantyUrl: null },
  { brand: 'Whirlpool', modelPrefix: 'N50T61',  modelFull: 'N50T61-403',     serialPatternType: 'whirlpool', tankSizeGallons: 50, fuelType: 'gas',      typicalLifeYears: 12, fairPriceRangeLow: 1350, fairPriceRangeHigh: 1750, manualUrl: null, warrantyUrl: null },
  { brand: 'Whirlpool', modelPrefix: 'FG-1C50', modelFull: 'FG-1C5040-3NV',  serialPatternType: 'whirlpool', tankSizeGallons: 50, fuelType: 'gas',      typicalLifeYears: 12, fairPriceRangeLow: 1400, fairPriceRangeHigh: 1800, manualUrl: null, warrantyUrl: null },
  { brand: 'Whirlpool', modelPrefix: 'FG-1C40', modelFull: 'FG-1C4040-3NV',  serialPatternType: 'whirlpool', tankSizeGallons: 40, fuelType: 'gas',      typicalLifeYears: 12, fairPriceRangeLow: 1300, fairPriceRangeHigh: 1700, manualUrl: null, warrantyUrl: null },
  { brand: 'Whirlpool', modelPrefix: 'EE2H80',  modelFull: 'EE2H80HD045V',   serialPatternType: 'whirlpool', tankSizeGallons: 80, fuelType: 'heat-pump',typicalLifeYears: 15, fairPriceRangeLow: 2000, fairPriceRangeHigh: 2600, manualUrl: null, warrantyUrl: null },
]

// ─── Lookup Functions ─────────────────────────────────────────────────────────

/** Match by model prefix (case-insensitive). Returns first match or null. */
export function lookupByModelPrefix(model: string): WHLookupEntry | null {
  if (!model) return null
  const upper = model.toUpperCase().replace(/[\s\-]/g, '')
  return MODEL_TABLE.find(e => upper.startsWith(e.modelPrefix.toUpperCase().replace(/[\s\-]/g, ''))) ?? null
}

/** Match by exact brand + fallback to first entry for that brand. */
export function lookupBySerial(brand: string, _serial: string): WHLookupEntry | null {
  if (!brand) return null
  const upper = brand.toUpperCase()
  return MODEL_TABLE.find(e => e.brand.toUpperCase() === upper) ?? null
}

/** All entries for a given brand, or all entries if no brand specified. */
export function getAllCommonModels(brand?: string): WHLookupEntry[] {
  if (!brand) return MODEL_TABLE
  const upper = brand.toUpperCase()
  return MODEL_TABLE.filter(e => e.brand.toUpperCase() === upper)
}

/** Best price estimate string for display ("$1,400 – $1,800"). */
export function formatPriceRange(entry: WHLookupEntry): string {
  return `$${entry.fairPriceRangeLow.toLocaleString()} – $${entry.fairPriceRangeHigh.toLocaleString()}`
}
