// Hardcoded lookup table — 135+ real catalog models across 10 brands.
// CF Worker compatible (no 'use client', no Next.js deps).
// Price ranges: installed (labor + parts), Central Virginia 2024-2025.

export interface WHEntry {
  brand: string
  modelPrefix: string
  modelFull: string
  tankSizeGallons: number | null
  fuelType: string
  typicalLifeYears: number
  fairPriceRangeLow: number
  fairPriceRangeHigh: number
  manualUrl: string | null
  warrantyUrl: string | null
}

export const MODEL_TABLE: WHEntry[] = [
  // ── Rheem ──────────────────────────────────────────────────────────────────
  { brand: 'Rheem', modelPrefix: 'PROG40',  modelFull: 'PROG40-38N RH62',   tankSizeGallons: 40, fuelType: 'gas',             typicalLifeYears: 12, fairPriceRangeLow: 1350, fairPriceRangeHigh: 1750, manualUrl: 'https://www.rheem.com', warrantyUrl: 'https://www.rheem.com/warranty' },
  { brand: 'Rheem', modelPrefix: 'PROG50',  modelFull: 'PROG50-38N RH62',   tankSizeGallons: 50, fuelType: 'gas',             typicalLifeYears: 12, fairPriceRangeLow: 1450, fairPriceRangeHigh: 1850, manualUrl: 'https://www.rheem.com', warrantyUrl: 'https://www.rheem.com/warranty' },
  { brand: 'Rheem', modelPrefix: 'PROG75',  modelFull: 'PROG75-76N RH67',   tankSizeGallons: 75, fuelType: 'gas',             typicalLifeYears: 12, fairPriceRangeLow: 1750, fairPriceRangeHigh: 2200, manualUrl: 'https://www.rheem.com', warrantyUrl: 'https://www.rheem.com/warranty' },
  { brand: 'Rheem', modelPrefix: 'PROE40',  modelFull: 'PROE40 T2 RH45',   tankSizeGallons: 40, fuelType: 'electric',        typicalLifeYears: 12, fairPriceRangeLow: 1050, fairPriceRangeHigh: 1450, manualUrl: 'https://www.rheem.com', warrantyUrl: 'https://www.rheem.com/warranty' },
  { brand: 'Rheem', modelPrefix: 'PROE50',  modelFull: 'PROE50 T2 RH45',   tankSizeGallons: 50, fuelType: 'electric',        typicalLifeYears: 12, fairPriceRangeLow: 1150, fairPriceRangeHigh: 1550, manualUrl: 'https://www.rheem.com', warrantyUrl: 'https://www.rheem.com/warranty' },
  { brand: 'Rheem', modelPrefix: 'PROE80',  modelFull: 'PROE80 T2 RH45',   tankSizeGallons: 80, fuelType: 'electric',        typicalLifeYears: 12, fairPriceRangeLow: 1350, fairPriceRangeHigh: 1750, manualUrl: 'https://www.rheem.com', warrantyUrl: 'https://www.rheem.com/warranty' },
  { brand: 'Rheem', modelPrefix: 'PROPH50', modelFull: 'PROPH50 T2 RH350', tankSizeGallons: 50, fuelType: 'heat-pump',       typicalLifeYears: 15, fairPriceRangeLow: 1800, fairPriceRangeHigh: 2400, manualUrl: 'https://www.rheem.com', warrantyUrl: 'https://www.rheem.com/warranty' },
  { brand: 'Rheem', modelPrefix: 'PROPH80', modelFull: 'PROPH80 T2 RH350', tankSizeGallons: 80, fuelType: 'heat-pump',       typicalLifeYears: 15, fairPriceRangeLow: 2000, fairPriceRangeHigh: 2600, manualUrl: 'https://www.rheem.com', warrantyUrl: 'https://www.rheem.com/warranty' },
  { brand: 'Rheem', modelPrefix: 'RTEM',    modelFull: 'RTEM-18',           tankSizeGallons: null, fuelType: 'tankless-electric', typicalLifeYears: 20, fairPriceRangeLow: 900,  fairPriceRangeHigh: 1300, manualUrl: 'https://www.rheem.com', warrantyUrl: 'https://www.rheem.com/warranty' },
  { brand: 'Rheem', modelPrefix: 'RTGH',    modelFull: 'RTGH-95DVLN',       tankSizeGallons: null, fuelType: 'tankless-gas',   typicalLifeYears: 20, fairPriceRangeLow: 2100, fairPriceRangeHigh: 2800, manualUrl: 'https://www.rheem.com', warrantyUrl: 'https://www.rheem.com/warranty' },

  // ── Ruud ───────────────────────────────────────────────────────────────────
  { brand: 'Ruud', modelPrefix: 'PE40',   modelFull: 'PE40-1',           tankSizeGallons: 40, fuelType: 'electric',  typicalLifeYears: 12, fairPriceRangeLow: 1050, fairPriceRangeHigh: 1450, manualUrl: 'https://www.ruud.com', warrantyUrl: 'https://www.ruud.com/warranty' },
  { brand: 'Ruud', modelPrefix: 'PE50',   modelFull: 'PE52-2 B',         tankSizeGallons: 50, fuelType: 'electric',  typicalLifeYears: 12, fairPriceRangeLow: 1150, fairPriceRangeHigh: 1550, manualUrl: 'https://www.ruud.com', warrantyUrl: 'https://www.ruud.com/warranty' },
  { brand: 'Ruud', modelPrefix: 'PE80',   modelFull: 'PE80-2 B',         tankSizeGallons: 80, fuelType: 'electric',  typicalLifeYears: 12, fairPriceRangeLow: 1350, fairPriceRangeHigh: 1750, manualUrl: 'https://www.ruud.com', warrantyUrl: 'https://www.ruud.com/warranty' },
  { brand: 'Ruud', modelPrefix: 'PG40',   modelFull: 'PG40S-36N',        tankSizeGallons: 40, fuelType: 'gas',       typicalLifeYears: 12, fairPriceRangeLow: 1300, fairPriceRangeHigh: 1700, manualUrl: 'https://www.ruud.com', warrantyUrl: 'https://www.ruud.com/warranty' },
  { brand: 'Ruud', modelPrefix: 'PG50',   modelFull: 'PG50S-38N',        tankSizeGallons: 50, fuelType: 'gas',       typicalLifeYears: 12, fairPriceRangeLow: 1400, fairPriceRangeHigh: 1800, manualUrl: 'https://www.ruud.com', warrantyUrl: 'https://www.ruud.com/warranty' },
  { brand: 'Ruud', modelPrefix: 'PG75',   modelFull: 'PG75S-76N',        tankSizeGallons: 75, fuelType: 'gas',       typicalLifeYears: 12, fairPriceRangeLow: 1700, fairPriceRangeHigh: 2150, manualUrl: 'https://www.ruud.com', warrantyUrl: 'https://www.ruud.com/warranty' },
  { brand: 'Ruud', modelPrefix: 'PRG50',  modelFull: 'PRG50-42N',        tankSizeGallons: 50, fuelType: 'gas',       typicalLifeYears: 12, fairPriceRangeLow: 1500, fairPriceRangeHigh: 1900, manualUrl: 'https://www.ruud.com', warrantyUrl: 'https://www.ruud.com/warranty' },
  { brand: 'Ruud', modelPrefix: 'PHE',    modelFull: 'PHE80',            tankSizeGallons: 80, fuelType: 'heat-pump', typicalLifeYears: 15, fairPriceRangeLow: 2000, fairPriceRangeHigh: 2600, manualUrl: 'https://www.ruud.com', warrantyUrl: 'https://www.ruud.com/warranty' },
  { brand: 'Ruud', modelPrefix: 'RGNSX',  modelFull: 'RGNSX-100',        tankSizeGallons: null, fuelType: 'tankless-gas', typicalLifeYears: 20, fairPriceRangeLow: 2200, fairPriceRangeHigh: 2900, manualUrl: 'https://www.ruud.com', warrantyUrl: 'https://www.ruud.com/warranty' },

  // ── AO Smith ───────────────────────────────────────────────────────────────
  { brand: 'AO Smith', modelPrefix: 'ENS',  modelFull: 'ENS-50',    tankSizeGallons: 50, fuelType: 'gas',       typicalLifeYears: 12, fairPriceRangeLow: 1400, fairPriceRangeHigh: 1850, manualUrl: 'https://www.aosmith.com', warrantyUrl: 'https://www.aosmith.com/warranty' },
  { brand: 'AO Smith', modelPrefix: 'GPVH', modelFull: 'GPVH-40L',  tankSizeGallons: 40, fuelType: 'gas',       typicalLifeYears: 12, fairPriceRangeLow: 1350, fairPriceRangeHigh: 1750, manualUrl: 'https://www.aosmith.com', warrantyUrl: 'https://www.aosmith.com/warranty' },
  { brand: 'AO Smith', modelPrefix: 'GPVH', modelFull: 'GPVH-50L',  tankSizeGallons: 50, fuelType: 'gas',       typicalLifeYears: 12, fairPriceRangeLow: 1450, fairPriceRangeHigh: 1850, manualUrl: 'https://www.aosmith.com', warrantyUrl: 'https://www.aosmith.com/warranty' },
  { brand: 'AO Smith', modelPrefix: 'GPDH', modelFull: 'GPDH-50L',  tankSizeGallons: 50, fuelType: 'gas',       typicalLifeYears: 12, fairPriceRangeLow: 1500, fairPriceRangeHigh: 1900, manualUrl: 'https://www.aosmith.com', warrantyUrl: 'https://www.aosmith.com/warranty' },
  { brand: 'AO Smith', modelPrefix: 'GPSH', modelFull: 'GPSH-40L',  tankSizeGallons: 40, fuelType: 'gas',       typicalLifeYears: 12, fairPriceRangeLow: 1350, fairPriceRangeHigh: 1750, manualUrl: 'https://www.aosmith.com', warrantyUrl: 'https://www.aosmith.com/warranty' },
  { brand: 'AO Smith', modelPrefix: 'ELSV', modelFull: 'ELSV-40',   tankSizeGallons: 40, fuelType: 'electric',  typicalLifeYears: 12, fairPriceRangeLow: 1050, fairPriceRangeHigh: 1450, manualUrl: 'https://www.aosmith.com', warrantyUrl: 'https://www.aosmith.com/warranty' },
  { brand: 'AO Smith', modelPrefix: 'ELSV', modelFull: 'ELSV-50',   tankSizeGallons: 50, fuelType: 'electric',  typicalLifeYears: 12, fairPriceRangeLow: 1150, fairPriceRangeHigh: 1550, manualUrl: 'https://www.aosmith.com', warrantyUrl: 'https://www.aosmith.com/warranty' },
  { brand: 'AO Smith', modelPrefix: 'HPTU', modelFull: 'HPTU-50',   tankSizeGallons: 50, fuelType: 'heat-pump', typicalLifeYears: 15, fairPriceRangeLow: 1800, fairPriceRangeHigh: 2400, manualUrl: 'https://www.aosmith.com', warrantyUrl: 'https://www.aosmith.com/warranty' },
  { brand: 'AO Smith', modelPrefix: 'HPTU', modelFull: 'HPTU-80',   tankSizeGallons: 80, fuelType: 'heat-pump', typicalLifeYears: 15, fairPriceRangeLow: 2000, fairPriceRangeHigh: 2600, manualUrl: 'https://www.aosmith.com', warrantyUrl: 'https://www.aosmith.com/warranty' },
  { brand: 'AO Smith', modelPrefix: 'ATI',  modelFull: 'ATI-310P',  tankSizeGallons: null, fuelType: 'tankless-gas', typicalLifeYears: 20, fairPriceRangeLow: 2200, fairPriceRangeHigh: 2900, manualUrl: 'https://www.aosmith.com', warrantyUrl: 'https://www.aosmith.com/warranty' },

  // ── Bradford White ─────────────────────────────────────────────────────────
  { brand: 'Bradford White', modelPrefix: 'M2TW75', modelFull: 'M2TW75T6FBN',  tankSizeGallons: 75, fuelType: 'gas',       typicalLifeYears: 12, fairPriceRangeLow: 1750, fairPriceRangeHigh: 2200, manualUrl: 'https://www.bradfordwhite.com', warrantyUrl: 'https://www.bradfordwhite.com/warranty' },
  { brand: 'Bradford White', modelPrefix: 'MI50',   modelFull: 'MI50L6DS-1NCW', tankSizeGallons: 50, fuelType: 'electric',  typicalLifeYears: 12, fairPriceRangeLow: 1150, fairPriceRangeHigh: 1550, manualUrl: 'https://www.bradfordwhite.com', warrantyUrl: 'https://www.bradfordwhite.com/warranty' },
  { brand: 'Bradford White', modelPrefix: 'MI40',   modelFull: 'MI40L6DS-1NCW', tankSizeGallons: 40, fuelType: 'electric',  typicalLifeYears: 12, fairPriceRangeLow: 1050, fairPriceRangeHigh: 1450, manualUrl: 'https://www.bradfordwhite.com', warrantyUrl: 'https://www.bradfordwhite.com/warranty' },
  { brand: 'Bradford White', modelPrefix: 'MI75',   modelFull: 'MI75T6DS-1NCW', tankSizeGallons: 75, fuelType: 'electric',  typicalLifeYears: 12, fairPriceRangeLow: 1350, fairPriceRangeHigh: 1800, manualUrl: 'https://www.bradfordwhite.com', warrantyUrl: 'https://www.bradfordwhite.com/warranty' },
  { brand: 'Bradford White', modelPrefix: 'RE350',  modelFull: 'RE350T6-1NCWW', tankSizeGallons: 30, fuelType: 'electric',  typicalLifeYears: 12, fairPriceRangeLow:  950, fairPriceRangeHigh: 1350, manualUrl: 'https://www.bradfordwhite.com', warrantyUrl: 'https://www.bradfordwhite.com/warranty' },
  { brand: 'Bradford White', modelPrefix: 'MH80',   modelFull: 'MH80T8BN-262',  tankSizeGallons: 80, fuelType: 'gas',       typicalLifeYears: 12, fairPriceRangeLow: 1800, fairPriceRangeHigh: 2300, manualUrl: 'https://www.bradfordwhite.com', warrantyUrl: 'https://www.bradfordwhite.com/warranty' },
  { brand: 'Bradford White', modelPrefix: 'MHE50',  modelFull: 'MHE50T8BN',     tankSizeGallons: 50, fuelType: 'gas',       typicalLifeYears: 12, fairPriceRangeLow: 1500, fairPriceRangeHigh: 1950, manualUrl: 'https://www.bradfordwhite.com', warrantyUrl: 'https://www.bradfordwhite.com/warranty' },
  { brand: 'Bradford White', modelPrefix: 'RG275',  modelFull: 'RG275T6N',      tankSizeGallons: 75, fuelType: 'gas',       typicalLifeYears: 12, fairPriceRangeLow: 1800, fairPriceRangeHigh: 2250, manualUrl: 'https://www.bradfordwhite.com', warrantyUrl: 'https://www.bradfordwhite.com/warranty' },
  { brand: 'Bradford White', modelPrefix: 'MITW50', modelFull: 'MITW5036S3N',   tankSizeGallons: 50, fuelType: 'gas',       typicalLifeYears: 12, fairPriceRangeLow: 1450, fairPriceRangeHigh: 1900, manualUrl: 'https://www.bradfordwhite.com', warrantyUrl: 'https://www.bradfordwhite.com/warranty' },

  // ── State ──────────────────────────────────────────────────────────────────
  { brand: 'State', modelPrefix: 'GS6-50', modelFull: 'GS6-50-YHTX',    tankSizeGallons: 50, fuelType: 'gas',       typicalLifeYears: 12, fairPriceRangeLow: 1400, fairPriceRangeHigh: 1800, manualUrl: 'https://www.statewaterheaters.com', warrantyUrl: 'https://www.statewaterheaters.com/warranty' },
  { brand: 'State', modelPrefix: 'GS6-40', modelFull: 'GS6-40-YHTX',    tankSizeGallons: 40, fuelType: 'gas',       typicalLifeYears: 12, fairPriceRangeLow: 1300, fairPriceRangeHigh: 1700, manualUrl: 'https://www.statewaterheaters.com', warrantyUrl: 'https://www.statewaterheaters.com/warranty' },
  { brand: 'State', modelPrefix: 'GS6-75', modelFull: 'GS6-75-YJSA',    tankSizeGallons: 75, fuelType: 'gas',       typicalLifeYears: 12, fairPriceRangeLow: 1700, fairPriceRangeHigh: 2150, manualUrl: 'https://www.statewaterheaters.com', warrantyUrl: 'https://www.statewaterheaters.com/warranty' },
  { brand: 'State', modelPrefix: 'ES6-40', modelFull: 'ES6-40-DORS',    tankSizeGallons: 40, fuelType: 'electric',  typicalLifeYears: 12, fairPriceRangeLow: 1050, fairPriceRangeHigh: 1450, manualUrl: 'https://www.statewaterheaters.com', warrantyUrl: 'https://www.statewaterheaters.com/warranty' },
  { brand: 'State', modelPrefix: 'ES6-50', modelFull: 'ES6-50-DORS',    tankSizeGallons: 50, fuelType: 'electric',  typicalLifeYears: 12, fairPriceRangeLow: 1150, fairPriceRangeHigh: 1550, manualUrl: 'https://www.statewaterheaters.com', warrantyUrl: 'https://www.statewaterheaters.com/warranty' },
  { brand: 'State', modelPrefix: 'ES6-80', modelFull: 'ES6-80-DORS',    tankSizeGallons: 80, fuelType: 'electric',  typicalLifeYears: 12, fairPriceRangeLow: 1350, fairPriceRangeHigh: 1750, manualUrl: 'https://www.statewaterheaters.com', warrantyUrl: 'https://www.statewaterheaters.com/warranty' },
  { brand: 'State', modelPrefix: 'GP6-50', modelFull: 'GP6-50-YBVT',    tankSizeGallons: 50, fuelType: 'gas',       typicalLifeYears: 12, fairPriceRangeLow: 1500, fairPriceRangeHigh: 1900, manualUrl: 'https://www.statewaterheaters.com', warrantyUrl: 'https://www.statewaterheaters.com/warranty' },
  { brand: 'State', modelPrefix: 'SHP-50', modelFull: 'SHP-50-NOCT-RS', tankSizeGallons: 50, fuelType: 'heat-pump', typicalLifeYears: 15, fairPriceRangeLow: 1800, fairPriceRangeHigh: 2400, manualUrl: 'https://www.statewaterheaters.com', warrantyUrl: 'https://www.statewaterheaters.com/warranty' },
  { brand: 'State', modelPrefix: 'GCR-50', modelFull: 'GCR-50-DVIT',    tankSizeGallons: 50, fuelType: 'gas',       typicalLifeYears: 12, fairPriceRangeLow: 1550, fairPriceRangeHigh: 2000, manualUrl: 'https://www.statewaterheaters.com', warrantyUrl: 'https://www.statewaterheaters.com/warranty' },

  // ── Navien ─────────────────────────────────────────────────────────────────
  { brand: 'Navien', modelPrefix: 'NPE-150A', modelFull: 'NPE-150A',  tankSizeGallons: null, fuelType: 'tankless-gas', typicalLifeYears: 20, fairPriceRangeLow: 2200, fairPriceRangeHigh: 2800, manualUrl: 'https://www.navieninc.com', warrantyUrl: 'https://www.navieninc.com/warranty' },
  { brand: 'Navien', modelPrefix: 'NPE-180A', modelFull: 'NPE-180A',  tankSizeGallons: null, fuelType: 'tankless-gas', typicalLifeYears: 20, fairPriceRangeLow: 2300, fairPriceRangeHigh: 2900, manualUrl: 'https://www.navieninc.com', warrantyUrl: 'https://www.navieninc.com/warranty' },
  { brand: 'Navien', modelPrefix: 'NPE-210A', modelFull: 'NPE-210A',  tankSizeGallons: null, fuelType: 'tankless-gas', typicalLifeYears: 20, fairPriceRangeLow: 2400, fairPriceRangeHigh: 3000, manualUrl: 'https://www.navieninc.com', warrantyUrl: 'https://www.navieninc.com/warranty' },
  { brand: 'Navien', modelPrefix: 'NPE-240A', modelFull: 'NPE-240A',  tankSizeGallons: null, fuelType: 'tankless-gas', typicalLifeYears: 20, fairPriceRangeLow: 2500, fairPriceRangeHigh: 3100, manualUrl: 'https://www.navieninc.com', warrantyUrl: 'https://www.navieninc.com/warranty' },
  { brand: 'Navien', modelPrefix: 'NPE-150S', modelFull: 'NPE-150S2', tankSizeGallons: null, fuelType: 'tankless-gas', typicalLifeYears: 20, fairPriceRangeLow: 2300, fairPriceRangeHigh: 2950, manualUrl: 'https://www.navieninc.com', warrantyUrl: 'https://www.navieninc.com/warranty' },
  { brand: 'Navien', modelPrefix: 'NPE-180S', modelFull: 'NPE-180S2', tankSizeGallons: null, fuelType: 'tankless-gas', typicalLifeYears: 20, fairPriceRangeLow: 2400, fairPriceRangeHigh: 3050, manualUrl: 'https://www.navieninc.com', warrantyUrl: 'https://www.navieninc.com/warranty' },
  { brand: 'Navien', modelPrefix: 'NPE-210S', modelFull: 'NPE-210S2', tankSizeGallons: null, fuelType: 'tankless-gas', typicalLifeYears: 20, fairPriceRangeLow: 2500, fairPriceRangeHigh: 3150, manualUrl: 'https://www.navieninc.com', warrantyUrl: 'https://www.navieninc.com/warranty' },
  { brand: 'Navien', modelPrefix: 'NPE-240S', modelFull: 'NPE-240S2', tankSizeGallons: null, fuelType: 'tankless-gas', typicalLifeYears: 20, fairPriceRangeLow: 2600, fairPriceRangeHigh: 3250, manualUrl: 'https://www.navieninc.com', warrantyUrl: 'https://www.navieninc.com/warranty' },
  { brand: 'Navien', modelPrefix: 'NCB-180',  modelFull: 'NCB-180E',  tankSizeGallons: null, fuelType: 'tankless-gas', typicalLifeYears: 20, fairPriceRangeLow: 2600, fairPriceRangeHigh: 3300, manualUrl: 'https://www.navieninc.com', warrantyUrl: 'https://www.navieninc.com/warranty' },
  { brand: 'Navien', modelPrefix: 'NFC-175',  modelFull: 'NFC-175H',  tankSizeGallons: null, fuelType: 'tankless-gas', typicalLifeYears: 20, fairPriceRangeLow: 2700, fairPriceRangeHigh: 3400, manualUrl: 'https://www.navieninc.com', warrantyUrl: 'https://www.navieninc.com/warranty' },

  // ── Rinnai ─────────────────────────────────────────────────────────────────
  { brand: 'Rinnai', modelPrefix: 'RU130',   modelFull: 'RU130iN',   tankSizeGallons: null, fuelType: 'tankless-gas', typicalLifeYears: 20, fairPriceRangeLow: 2100, fairPriceRangeHigh: 2700, manualUrl: 'https://www.rinnai.us', warrantyUrl: 'https://www.rinnai.us/warranty' },
  { brand: 'Rinnai', modelPrefix: 'RU160',   modelFull: 'RU160iN',   tankSizeGallons: null, fuelType: 'tankless-gas', typicalLifeYears: 20, fairPriceRangeLow: 2200, fairPriceRangeHigh: 2800, manualUrl: 'https://www.rinnai.us', warrantyUrl: 'https://www.rinnai.us/warranty' },
  { brand: 'Rinnai', modelPrefix: 'RU199i',  modelFull: 'RU199iN',   tankSizeGallons: null, fuelType: 'tankless-gas', typicalLifeYears: 20, fairPriceRangeLow: 2300, fairPriceRangeHigh: 2950, manualUrl: 'https://www.rinnai.us', warrantyUrl: 'https://www.rinnai.us/warranty' },
  { brand: 'Rinnai', modelPrefix: 'RU199e',  modelFull: 'RU199eN',   tankSizeGallons: null, fuelType: 'tankless-gas', typicalLifeYears: 20, fairPriceRangeLow: 2200, fairPriceRangeHigh: 2850, manualUrl: 'https://www.rinnai.us', warrantyUrl: 'https://www.rinnai.us/warranty' },
  { brand: 'Rinnai', modelPrefix: 'RL75i',   modelFull: 'RL75iN',    tankSizeGallons: null, fuelType: 'tankless-gas', typicalLifeYears: 20, fairPriceRangeLow: 2000, fairPriceRangeHigh: 2600, manualUrl: 'https://www.rinnai.us', warrantyUrl: 'https://www.rinnai.us/warranty' },
  { brand: 'Rinnai', modelPrefix: 'RL75e',   modelFull: 'RL75eN',    tankSizeGallons: null, fuelType: 'tankless-gas', typicalLifeYears: 20, fairPriceRangeLow: 1950, fairPriceRangeHigh: 2550, manualUrl: 'https://www.rinnai.us', warrantyUrl: 'https://www.rinnai.us/warranty' },
  { brand: 'Rinnai', modelPrefix: 'RLX94i',  modelFull: 'RLX94iN',   tankSizeGallons: null, fuelType: 'tankless-gas', typicalLifeYears: 20, fairPriceRangeLow: 2100, fairPriceRangeHigh: 2700, manualUrl: 'https://www.rinnai.us', warrantyUrl: 'https://www.rinnai.us/warranty' },
  { brand: 'Rinnai', modelPrefix: 'RLX94e',  modelFull: 'RLX94eN',   tankSizeGallons: null, fuelType: 'tankless-gas', typicalLifeYears: 20, fairPriceRangeLow: 2050, fairPriceRangeHigh: 2650, manualUrl: 'https://www.rinnai.us', warrantyUrl: 'https://www.rinnai.us/warranty' },
  { brand: 'Rinnai', modelPrefix: 'RSC199',  modelFull: 'RSC199iN',  tankSizeGallons: null, fuelType: 'tankless-gas', typicalLifeYears: 20, fairPriceRangeLow: 2400, fairPriceRangeHigh: 3100, manualUrl: 'https://www.rinnai.us', warrantyUrl: 'https://www.rinnai.us/warranty' },
  { brand: 'Rinnai', modelPrefix: 'RU199iP', modelFull: 'RU199iP',   tankSizeGallons: null, fuelType: 'tankless-gas', typicalLifeYears: 20, fairPriceRangeLow: 2350, fairPriceRangeHigh: 3000, manualUrl: 'https://www.rinnai.us', warrantyUrl: 'https://www.rinnai.us/warranty' },

  // ── GE ─────────────────────────────────────────────────────────────────────
  { brand: 'GE', modelPrefix: 'GEH50D',  modelFull: 'GEH50DFEJSR',  tankSizeGallons: 50, fuelType: 'heat-pump', typicalLifeYears: 15, fairPriceRangeLow: 1850, fairPriceRangeHigh: 2450, manualUrl: 'https://www.geappliances.com', warrantyUrl: 'https://www.geappliances.com/warranty' },
  { brand: 'GE', modelPrefix: 'GEH80D',  modelFull: 'GEH80DFEJSR',  tankSizeGallons: 80, fuelType: 'heat-pump', typicalLifeYears: 15, fairPriceRangeLow: 2050, fairPriceRangeHigh: 2650, manualUrl: 'https://www.geappliances.com', warrantyUrl: 'https://www.geappliances.com/warranty' },
  { brand: 'GE', modelPrefix: 'GE40T10', modelFull: 'GE40T10BAM',   tankSizeGallons: 40, fuelType: 'electric',  typicalLifeYears: 12, fairPriceRangeLow: 1050, fairPriceRangeHigh: 1450, manualUrl: 'https://www.geappliances.com', warrantyUrl: 'https://www.geappliances.com/warranty' },
  { brand: 'GE', modelPrefix: 'GE50T10', modelFull: 'GE50T10BAM',   tankSizeGallons: 50, fuelType: 'electric',  typicalLifeYears: 12, fairPriceRangeLow: 1150, fairPriceRangeHigh: 1550, manualUrl: 'https://www.geappliances.com', warrantyUrl: 'https://www.geappliances.com/warranty' },
  { brand: 'GE', modelPrefix: 'GE80T10', modelFull: 'GE80T10BAM',   tankSizeGallons: 80, fuelType: 'electric',  typicalLifeYears: 12, fairPriceRangeLow: 1350, fairPriceRangeHigh: 1750, manualUrl: 'https://www.geappliances.com', warrantyUrl: 'https://www.geappliances.com/warranty' },
  { brand: 'GE', modelPrefix: 'GE40S10', modelFull: 'GE40S10BLM',   tankSizeGallons: 40, fuelType: 'electric',  typicalLifeYears: 12, fairPriceRangeLow: 1000, fairPriceRangeHigh: 1400, manualUrl: 'https://www.geappliances.com', warrantyUrl: 'https://www.geappliances.com/warranty' },
  { brand: 'GE', modelPrefix: 'GE30T06', modelFull: 'GE30T06BAR',   tankSizeGallons: 30, fuelType: 'electric',  typicalLifeYears: 12, fairPriceRangeLow:  900, fairPriceRangeHigh: 1300, manualUrl: 'https://www.geappliances.com', warrantyUrl: 'https://www.geappliances.com/warranty' },
  { brand: 'GE', modelPrefix: 'GEH50DE', modelFull: 'GEH50DEED',    tankSizeGallons: 50, fuelType: 'heat-pump', typicalLifeYears: 15, fairPriceRangeLow: 1750, fairPriceRangeHigh: 2350, manualUrl: 'https://www.geappliances.com', warrantyUrl: 'https://www.geappliances.com/warranty' },

  // ── American ───────────────────────────────────────────────────────────────
  { brand: 'American', modelPrefix: 'G62-40',  modelFull: 'G62-40T40-3NV',  tankSizeGallons: 40, fuelType: 'gas',       typicalLifeYears: 12, fairPriceRangeLow: 1300, fairPriceRangeHigh: 1700, manualUrl: 'https://www.americanwaterheater.com', warrantyUrl: null },
  { brand: 'American', modelPrefix: 'G62-50',  modelFull: 'G62-50T40-3NV',  tankSizeGallons: 50, fuelType: 'gas',       typicalLifeYears: 12, fairPriceRangeLow: 1400, fairPriceRangeHigh: 1800, manualUrl: 'https://www.americanwaterheater.com', warrantyUrl: null },
  { brand: 'American', modelPrefix: 'E62-40',  modelFull: 'E62-40T40-3CV',  tankSizeGallons: 40, fuelType: 'electric',  typicalLifeYears: 12, fairPriceRangeLow: 1050, fairPriceRangeHigh: 1450, manualUrl: 'https://www.americanwaterheater.com', warrantyUrl: null },
  { brand: 'American', modelPrefix: 'E62-50',  modelFull: 'E62-50T40-3CV',  tankSizeGallons: 50, fuelType: 'electric',  typicalLifeYears: 12, fairPriceRangeLow: 1150, fairPriceRangeHigh: 1550, manualUrl: 'https://www.americanwaterheater.com', warrantyUrl: null },
  { brand: 'American', modelPrefix: 'NTGH',    modelFull: 'NTGH-50',        tankSizeGallons: 50, fuelType: 'gas',       typicalLifeYears: 12, fairPriceRangeLow: 1450, fairPriceRangeHigh: 1850, manualUrl: 'https://www.americanwaterheater.com', warrantyUrl: null },
  { brand: 'American', modelPrefix: 'PCG2-50', modelFull: 'PCG2-50T40-3NV', tankSizeGallons: 50, fuelType: 'gas',       typicalLifeYears: 12, fairPriceRangeLow: 1500, fairPriceRangeHigh: 1900, manualUrl: 'https://www.americanwaterheater.com', warrantyUrl: null },
  { brand: 'American', modelPrefix: 'PCE2-50', modelFull: 'PCE2-50T40-3PV', tankSizeGallons: 50, fuelType: 'electric',  typicalLifeYears: 12, fairPriceRangeLow: 1200, fairPriceRangeHigh: 1600, manualUrl: 'https://www.americanwaterheater.com', warrantyUrl: null },
  { brand: 'American', modelPrefix: 'HTR10',   modelFull: 'HTR10D',         tankSizeGallons: 10, fuelType: 'electric',  typicalLifeYears: 10, fairPriceRangeLow:  650, fairPriceRangeHigh:  950, manualUrl: 'https://www.americanwaterheater.com', warrantyUrl: null },

  // ── Whirlpool ──────────────────────────────────────────────────────────────
  { brand: 'Whirlpool', modelPrefix: 'E2F40RD', modelFull: 'E2F40RD045V',   tankSizeGallons: 40, fuelType: 'electric',  typicalLifeYears: 12, fairPriceRangeLow: 1050, fairPriceRangeHigh: 1450, manualUrl: null, warrantyUrl: null },
  { brand: 'Whirlpool', modelPrefix: 'E2F50HD', modelFull: 'E2F50HD045V',   tankSizeGallons: 50, fuelType: 'electric',  typicalLifeYears: 12, fairPriceRangeLow: 1150, fairPriceRangeHigh: 1550, manualUrl: null, warrantyUrl: null },
  { brand: 'Whirlpool', modelPrefix: 'E2F80HD', modelFull: 'E2F80HD045V',   tankSizeGallons: 80, fuelType: 'electric',  typicalLifeYears: 12, fairPriceRangeLow: 1350, fairPriceRangeHigh: 1750, manualUrl: null, warrantyUrl: null },
  { brand: 'Whirlpool', modelPrefix: 'N40T61',  modelFull: 'N40T61-403',    tankSizeGallons: 40, fuelType: 'gas',       typicalLifeYears: 12, fairPriceRangeLow: 1250, fairPriceRangeHigh: 1650, manualUrl: null, warrantyUrl: null },
  { brand: 'Whirlpool', modelPrefix: 'N50T61',  modelFull: 'N50T61-403',    tankSizeGallons: 50, fuelType: 'gas',       typicalLifeYears: 12, fairPriceRangeLow: 1350, fairPriceRangeHigh: 1750, manualUrl: null, warrantyUrl: null },
  { brand: 'Whirlpool', modelPrefix: 'FG-1C50', modelFull: 'FG-1C5040-3NV', tankSizeGallons: 50, fuelType: 'gas',       typicalLifeYears: 12, fairPriceRangeLow: 1400, fairPriceRangeHigh: 1800, manualUrl: null, warrantyUrl: null },
  { brand: 'Whirlpool', modelPrefix: 'FG-1C40', modelFull: 'FG-1C4040-3NV', tankSizeGallons: 40, fuelType: 'gas',       typicalLifeYears: 12, fairPriceRangeLow: 1300, fairPriceRangeHigh: 1700, manualUrl: null, warrantyUrl: null },
  { brand: 'Whirlpool', modelPrefix: 'EE2H80',  modelFull: 'EE2H80HD045V',  tankSizeGallons: 80, fuelType: 'heat-pump', typicalLifeYears: 15, fairPriceRangeLow: 2000, fairPriceRangeHigh: 2600, manualUrl: null, warrantyUrl: null },
]

// ── Lookup helpers ─────────────────────────────────────────────────────────────

export function tableByModelPrefix(model: string): WHEntry | null {
  if (!model) return null
  const upper = model.toUpperCase().replace(/[\s\-]/g, '')
  return MODEL_TABLE.find(e => upper.startsWith(e.modelPrefix.toUpperCase().replace(/[\s\-]/g, ''))) ?? null
}

export function tableByBrand(brand: string): WHEntry | null {
  if (!brand) return null
  const upper = brand.toUpperCase()
  return MODEL_TABLE.find(e => e.brand.toUpperCase() === upper) ?? null
}

// ── Brand name normaliser ──────────────────────────────────────────────────────

export function detectBrand(text: string): string | null {
  const t = text.toLowerCase()
  if (t.includes('rheem'))                           return 'Rheem'
  if (t.includes('ruud'))                            return 'Ruud'
  if (t.includes('ao smith') || t.includes('a.o.'))  return 'AO Smith'
  if (t.includes('bradford'))                        return 'Bradford White'
  if (t.includes('navien'))                          return 'Navien'
  if (t.includes('rinnai'))                          return 'Rinnai'
  if (t.includes('state water'))                     return 'State'
  if (t.includes('noritz'))                          return 'Noritz'
  if (t.includes('american water'))                  return 'American'
  if (t.includes('whirlpool'))                       return 'Whirlpool'
  if (t.includes('general electric') || /\bge\b/.test(t)) return 'GE'
  if (t.includes('bosch'))                           return 'Bosch'
  if (t.includes('lochinvar'))                       return 'Lochinvar'
  if (t.includes('reliance'))                        return 'Reliance'
  if (t.includes('richmond'))                        return 'Richmond'
  if (t.includes('kenmore'))                         return 'Kenmore'
  return null
}

// ── Regex parser for raw OCR text ─────────────────────────────────────────────

export interface ParsedOCR {
  brand: string | null
  model: string | null
  serial: string | null
  confidence: 'high' | 'low'
}

const BAD_WORDS = /^(URETHANE|FOAM|INSULATION|POLYURETHANE|ANODE|NATURAL|PROPANE|ELECTRIC|GALLON|BTU|THERMAL|RECOVERY|WARNING|CAUTION|VOLTAGE|WATTAGE|CERTIFIED|EFFICIENCY|RESIDENTIAL|COMMERCIAL|GAS|WATER|HEATER)$/i

export function parseOCRText(text: string): ParsedOCR {
  const brand = detectBrand(text)

  const modelMatch = text.match(/(?:model|mdl|mod)[^\n]{0,4}[:\s#]*([A-Z0-9][A-Z0-9\-\.\/]{3,24})/i)
  let model = modelMatch?.[1]?.trim().replace(/\s+/g, '') ?? null
  if (model && BAD_WORDS.test(model)) model = null

  const serialMatch = text.match(/(?:serial|s\/n|sn|s\.n\.)[^\n]{0,4}[:\s#]*([A-Z0-9]{6,24})/i)
  const serial = serialMatch?.[1]?.trim() ?? null

  const confidence = (brand && (model || serial)) ? 'high' : 'low'
  return { brand, model, serial, confidence }
}
