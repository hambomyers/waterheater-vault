'use client'

// ─── Pricing Config ────────────────────────────────────────────────────────────
// Edit this object to update for inflation, new markets, or labor rate changes.
// baseMsrp in ModelSpec is the manufacturer unit cost (relatively stable).
// Final installed price = (baseMsrp × markup + labor + permit) × regional multiplier.

export interface PricingConfig {
  laborRatePerHour: number      // $/hr billed labor in this market
  unitMarkupPercent: number     // plumber margin on equipment (e.g. 25 = 25%)
  permitCost: number            // typical local permit, USD
  inflationFactor: number       // 1.0 = 2024 baseline; bump ~3% per year
  regionalMultiplier: number    // 1.0 = national avg; 0.85 = rural VA; 1.3 = DC/NYC
}

export const DEFAULT_PRICING: PricingConfig = {
  laborRatePerHour: 95,
  unitMarkupPercent: 25,
  permitCost: 75,
  inflationFactor: 1.0,
  regionalMultiplier: 0.95,     // Central Virginia is ~5% below national avg
}

// Regional presets — add a new entry when expanding to a new market
export const REGION_PRICING: Record<string, PricingConfig> = {
  'central-va': { laborRatePerHour: 95,  unitMarkupPercent: 25, permitCost: 75,  inflationFactor: 1.0, regionalMultiplier: 0.95 },
  'northern-va': { laborRatePerHour: 115, unitMarkupPercent: 25, permitCost: 100, inflationFactor: 1.0, regionalMultiplier: 1.2  },
  'richmond-va': { laborRatePerHour: 98,  unitMarkupPercent: 25, permitCost: 80,  inflationFactor: 1.0, regionalMultiplier: 0.98 },
  'national-avg': { laborRatePerHour: 100, unitMarkupPercent: 25, permitCost: 85, inflationFactor: 1.0, regionalMultiplier: 1.0  },
}

// ─── Interfaces ────────────────────────────────────────────────────────────────

export interface BrandSpec {
  brand: string
  aliases: string[]
  serialPattern: 'WWYY' | 'YYWW' | 'BWL' | 'YYMM' | 'YYYYWW' | 'YYYYMM' | 'LETTER_YY'
  serialOffset: number
  similarUnitsBase: number      // estimated US installed base for "Based on N units" copy
}

export interface ModelSpec {
  brand: string
  modelPrefix: string           // match first N chars of scanned model number (case-insensitive)
  description: string
  tankGallons: number | null    // null = tankless
  fuelType: 'natural_gas' | 'propane' | 'electric' | 'heat_pump'
  inputBtuOrWatts: number       // BTU/hr for gas; watts for electric
  firstHourRating: number       // gallons in first hour (GPM×60 for tankless)
  expectedLifeYears: number
  baseMsrp: number              // manufacturer unit cost, USD — update via inflationFactor
  laborHours: number
}

export interface JobCost {
  unitCost: number              // baseMsrp + markup
  laborCost: number
  permitCost: number
  totalMin: number              // -10% variance
  totalMax: number              // +10% variance
  perYear: number               // amortized annual cost over expected life
}

export interface LookupResult {
  brand: string
  serialPattern: BrandSpec['serialPattern']
  manufactureDate: string       // YYYY-MM
  manufactureYear: number
  ageYears: number
  remainingLifeYears: number
  model: ModelSpec | null
  jobCost: JobCost | null       // null on partial hit
  partial: boolean              // true = brand+date only, no model prefix match
  similarUnitsCount: number     // for "Based on N similar units" trust copy
}

// ─── Brand Specs ───────────────────────────────────────────────────────────────

export const BRAND_SPECS: BrandSpec[] = [
  {
    brand: 'Rheem',
    aliases: ['rheem', 'ruud', 'richmond'],
    serialPattern: 'WWYY',
    serialOffset: 2,
    similarUnitsBase: 3800000,
  },
  {
    brand: 'A.O. Smith',
    aliases: ['ao smith', 'a.o. smith', 'a.o smith', 'aosmith', 'american water heater', 'whirlpool'],
    serialPattern: 'YYWW',
    serialOffset: 0,
    similarUnitsBase: 2600000,
  },
  {
    brand: 'Bradford White',
    aliases: ['bradford white', 'bradford-white', 'bw'],
    serialPattern: 'BWL',
    serialOffset: 1,
    similarUnitsBase: 1800000,
  },
  {
    brand: 'State',
    aliases: ['state', 'state water heaters', 'state industries'],
    serialPattern: 'YYWW',
    serialOffset: 0,
    similarUnitsBase: 1200000,
  },
  {
    brand: 'Navien',
    aliases: ['navien', 'navien inc'],
    serialPattern: 'YYYYMM',
    serialOffset: 0,
    similarUnitsBase: 280000,
  },
  {
    brand: 'Rinnai',
    aliases: ['rinnai', 'rinnai america', 'rinnai corp'],
    serialPattern: 'YYMM',
    serialOffset: 2,
    similarUnitsBase: 210000,
  },
  {
    brand: 'Noritz',
    aliases: ['noritz', 'noritz america'],
    serialPattern: 'YYWW',
    serialOffset: 0,
    similarUnitsBase: 140000,
  },
  {
    brand: 'Bosch',
    aliases: ['bosch', 'bosch thermotechnology', 'buderus'],
    serialPattern: 'YYYYWW',
    serialOffset: 0,
    similarUnitsBase: 95000,
  },
  {
    brand: 'GE',
    aliases: ['ge', 'geo', 'general electric', 'ge appliances', 'hotpoint'],
    serialPattern: 'LETTER_YY',
    serialOffset: 0,
    similarUnitsBase: 320000,
  },
  {
    brand: 'Kenmore',
    aliases: ['kenmore', 'sears'],
    serialPattern: 'YYWW',
    serialOffset: 0,
    similarUnitsBase: 480000,
  },
]

// Bradford White year-letter decode table (20-yr cycle; letters skip I, O, Q, U)
const BW_YEAR_LETTERS: Record<string, number> = {
  A: 2004, B: 2005, C: 2006, D: 2007, E: 2008, F: 2009, G: 2010, H: 2011,
  J: 2012, K: 2013, L: 2014, M: 2015, N: 2016, P: 2017, R: 2018, S: 2019,
  T: 2020, V: 2021, W: 2022, X: 2023, Y: 2024, Z: 2025,
}
// For units manufactured 1984-2003 (second cycle starts 2004)
const BW_YEAR_LETTERS_LEGACY: Record<string, number> = {
  A: 1984, B: 1985, C: 1986, D: 1987, E: 1988, F: 1989, G: 1990, H: 1991,
  J: 1992, K: 1993, L: 1994, M: 1995, N: 1996, P: 1997, R: 1998, S: 1999,
  T: 2000, V: 2001, W: 2002, X: 2003,
}

// GE month-letter decode (skips I)
const GE_MONTH_LETTERS: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, J: 9, K: 10, L: 11, M: 12,
}

// ─── Model Specs ───────────────────────────────────────────────────────────────
// Full data for top 3 brands (~80% of US residential installs).
// Other brands return partial hits (brand + date decode only).
// baseMsrp = unit only, USD, 2024 baseline. Adjust via DEFAULT_PRICING.inflationFactor.
// Sorted: longest prefix first within each brand so prefix matching is greedy.

export const MODEL_SPECS: ModelSpec[] = [

  // ── Rheem / Ruud ─────────────────────────────────────────────────────────────
  // Performance Plus Gas
  { brand: 'Rheem', modelPrefix: 'PROE80', description: 'Professional 80gal NG',       tankGallons: 80, fuelType: 'natural_gas', inputBtuOrWatts: 76000, firstHourRating: 180, expectedLifeYears: 14, baseMsrp: 920,  laborHours: 4   },
  { brand: 'Rheem', modelPrefix: 'PROE75', description: 'Professional 75gal NG',       tankGallons: 75, fuelType: 'natural_gas', inputBtuOrWatts: 76000, firstHourRating: 168, expectedLifeYears: 14, baseMsrp: 880,  laborHours: 4   },
  { brand: 'Rheem', modelPrefix: 'PROE50', description: 'Professional 50gal NG',       tankGallons: 50, fuelType: 'natural_gas', inputBtuOrWatts: 42000, firstHourRating: 96,  expectedLifeYears: 14, baseMsrp: 720,  laborHours: 3.5 },
  { brand: 'Rheem', modelPrefix: 'PROE40', description: 'Professional 40gal NG',       tankGallons: 40, fuelType: 'natural_gas', inputBtuOrWatts: 42000, firstHourRating: 88,  expectedLifeYears: 14, baseMsrp: 680,  laborHours: 3.5 },
  { brand: 'Rheem', modelPrefix: 'PROH80', description: 'Professional 80gal Electric', tankGallons: 80, fuelType: 'electric',     inputBtuOrWatts: 5500,  firstHourRating: 93,  expectedLifeYears: 14, baseMsrp: 680,  laborHours: 3   },
  { brand: 'Rheem', modelPrefix: 'PROH50', description: 'Professional 50gal Electric', tankGallons: 50, fuelType: 'electric',     inputBtuOrWatts: 5500,  firstHourRating: 80,  expectedLifeYears: 14, baseMsrp: 620,  laborHours: 2.5 },
  { brand: 'Rheem', modelPrefix: 'PROH40', description: 'Professional 40gal Electric', tankGallons: 40, fuelType: 'electric',     inputBtuOrWatts: 5500,  firstHourRating: 72,  expectedLifeYears: 14, baseMsrp: 580,  laborHours: 2.5 },
  // ProTerra Heat Pump
  { brand: 'Rheem', modelPrefix: 'PROPH8', description: 'ProTerra Heat Pump 80gal',    tankGallons: 80, fuelType: 'heat_pump',    inputBtuOrWatts: 4500,  firstHourRating: 110, expectedLifeYears: 15, baseMsrp: 1250, laborHours: 4.5 },
  { brand: 'Rheem', modelPrefix: 'PROPH5', description: 'ProTerra Heat Pump 50gal',    tankGallons: 50, fuelType: 'heat_pump',    inputBtuOrWatts: 4500,  firstHourRating: 80,  expectedLifeYears: 15, baseMsrp: 1150, laborHours: 4   },
  { brand: 'Rheem', modelPrefix: 'PROPH4', description: 'ProTerra Heat Pump 40gal',    tankGallons: 40, fuelType: 'heat_pump',    inputBtuOrWatts: 4500,  firstHourRating: 70,  expectedLifeYears: 15, baseMsrp: 1100, laborHours: 4   },
  // Performance Plus Gas
  { brand: 'Rheem', modelPrefix: 'XR75',  description: 'Performance Plus 75gal NG',   tankGallons: 75, fuelType: 'natural_gas', inputBtuOrWatts: 75000, firstHourRating: 156, expectedLifeYears: 13, baseMsrp: 820,  laborHours: 4   },
  { brand: 'Rheem', modelPrefix: 'XR50T', description: 'Performance Plus 50gal LP',   tankGallons: 50, fuelType: 'propane',      inputBtuOrWatts: 38000, firstHourRating: 90,  expectedLifeYears: 13, baseMsrp: 680,  laborHours: 3   },
  { brand: 'Rheem', modelPrefix: 'XR50',  description: 'Performance Plus 50gal NG',   tankGallons: 50, fuelType: 'natural_gas', inputBtuOrWatts: 38000, firstHourRating: 90,  expectedLifeYears: 13, baseMsrp: 650,  laborHours: 3   },
  { brand: 'Rheem', modelPrefix: 'XR40T', description: 'Performance Plus 40gal LP',   tankGallons: 40, fuelType: 'propane',      inputBtuOrWatts: 38000, firstHourRating: 82,  expectedLifeYears: 13, baseMsrp: 640,  laborHours: 3   },
  { brand: 'Rheem', modelPrefix: 'XR40',  description: 'Performance Plus 40gal NG',   tankGallons: 40, fuelType: 'natural_gas', inputBtuOrWatts: 38000, firstHourRating: 82,  expectedLifeYears: 13, baseMsrp: 610,  laborHours: 3   },
  // Performance Plus Electric
  { brand: 'Rheem', modelPrefix: 'XH80',  description: 'Performance Plus 80gal Elec', tankGallons: 80, fuelType: 'electric',     inputBtuOrWatts: 5500,  firstHourRating: 88,  expectedLifeYears: 12, baseMsrp: 580,  laborHours: 3   },
  { brand: 'Rheem', modelPrefix: 'XH50',  description: 'Performance Plus 50gal Elec', tankGallons: 50, fuelType: 'electric',     inputBtuOrWatts: 5500,  firstHourRating: 75,  expectedLifeYears: 12, baseMsrp: 520,  laborHours: 2.5 },
  { brand: 'Rheem', modelPrefix: 'XH40',  description: 'Performance Plus 40gal Elec', tankGallons: 40, fuelType: 'electric',     inputBtuOrWatts: 5500,  firstHourRating: 70,  expectedLifeYears: 12, baseMsrp: 490,  laborHours: 2.5 },
  // Performance Gas
  { brand: 'Rheem', modelPrefix: 'XG50T', description: 'Performance 50gal LP',         tankGallons: 50, fuelType: 'propane',      inputBtuOrWatts: 36000, firstHourRating: 87,  expectedLifeYears: 12, baseMsrp: 580,  laborHours: 3   },
  { brand: 'Rheem', modelPrefix: 'XG50',  description: 'Performance 50gal NG',          tankGallons: 50, fuelType: 'natural_gas', inputBtuOrWatts: 36000, firstHourRating: 87,  expectedLifeYears: 12, baseMsrp: 550,  laborHours: 3   },
  { brand: 'Rheem', modelPrefix: 'XG40T', description: 'Performance 40gal LP',         tankGallons: 40, fuelType: 'propane',      inputBtuOrWatts: 36000, firstHourRating: 79,  expectedLifeYears: 12, baseMsrp: 540,  laborHours: 3   },
  { brand: 'Rheem', modelPrefix: 'XG40',  description: 'Performance 40gal NG',          tankGallons: 40, fuelType: 'natural_gas', inputBtuOrWatts: 36000, firstHourRating: 79,  expectedLifeYears: 12, baseMsrp: 510,  laborHours: 3   },
  { brand: 'Rheem', modelPrefix: 'XG30',  description: 'Performance 30gal NG',          tankGallons: 30, fuelType: 'natural_gas', inputBtuOrWatts: 30000, firstHourRating: 58,  expectedLifeYears: 12, baseMsrp: 440,  laborHours: 3   },
  // Performance Electric
  { brand: 'Rheem', modelPrefix: 'XE80',  description: 'Performance 80gal Electric',   tankGallons: 80, fuelType: 'electric',     inputBtuOrWatts: 5500,  firstHourRating: 80,  expectedLifeYears: 11, baseMsrp: 520,  laborHours: 3   },
  { brand: 'Rheem', modelPrefix: 'XE50',  description: 'Performance 50gal Electric',   tankGallons: 50, fuelType: 'electric',     inputBtuOrWatts: 4500,  firstHourRating: 67,  expectedLifeYears: 11, baseMsrp: 450,  laborHours: 2.5 },
  { brand: 'Rheem', modelPrefix: 'XE40',  description: 'Performance 40gal Electric',   tankGallons: 40, fuelType: 'electric',     inputBtuOrWatts: 4500,  firstHourRating: 63,  expectedLifeYears: 11, baseMsrp: 420,  laborHours: 2.5 },
  { brand: 'Rheem', modelPrefix: 'XE30',  description: 'Performance 30gal Electric',   tankGallons: 30, fuelType: 'electric',     inputBtuOrWatts: 4500,  firstHourRating: 56,  expectedLifeYears: 11, baseMsrp: 380,  laborHours: 2.5 },
  // Ruud (same specs, Rheem brand OEM)
  { brand: 'Rheem', modelPrefix: 'PG50',  description: 'Ruud Classic 50gal NG',         tankGallons: 50, fuelType: 'natural_gas', inputBtuOrWatts: 36000, firstHourRating: 87,  expectedLifeYears: 12, baseMsrp: 550,  laborHours: 3   },
  { brand: 'Rheem', modelPrefix: 'PG40',  description: 'Ruud Classic 40gal NG',         tankGallons: 40, fuelType: 'natural_gas', inputBtuOrWatts: 36000, firstHourRating: 79,  expectedLifeYears: 12, baseMsrp: 510,  laborHours: 3   },
  { brand: 'Rheem', modelPrefix: 'PG30',  description: 'Ruud Classic 30gal NG',         tankGallons: 30, fuelType: 'natural_gas', inputBtuOrWatts: 30000, firstHourRating: 58,  expectedLifeYears: 12, baseMsrp: 440,  laborHours: 3   },
  { brand: 'Rheem', modelPrefix: 'PE50',  description: 'Ruud Classic 50gal Electric',  tankGallons: 50, fuelType: 'electric',     inputBtuOrWatts: 4500,  firstHourRating: 67,  expectedLifeYears: 11, baseMsrp: 450,  laborHours: 2.5 },
  { brand: 'Rheem', modelPrefix: 'PE40',  description: 'Ruud Classic 40gal Electric',  tankGallons: 40, fuelType: 'electric',     inputBtuOrWatts: 4500,  firstHourRating: 63,  expectedLifeYears: 11, baseMsrp: 420,  laborHours: 2.5 },
  { brand: 'Rheem', modelPrefix: 'PE30',  description: 'Ruud Classic 30gal Electric',  tankGallons: 30, fuelType: 'electric',     inputBtuOrWatts: 4500,  firstHourRating: 56,  expectedLifeYears: 11, baseMsrp: 380,  laborHours: 2.5 },

  // ── A.O. Smith ────────────────────────────────────────────────────────────────
  // Voltex Heat Pump
  { brand: 'A.O. Smith', modelPrefix: 'HPTU-80', description: 'Voltex Heat Pump 80gal',     tankGallons: 80, fuelType: 'heat_pump',    inputBtuOrWatts: 4500,  firstHourRating: 105, expectedLifeYears: 15, baseMsrp: 1200, laborHours: 4.5 },
  { brand: 'A.O. Smith', modelPrefix: 'HPTU-50', description: 'Voltex Heat Pump 50gal',     tankGallons: 50, fuelType: 'heat_pump',    inputBtuOrWatts: 4500,  firstHourRating: 75,  expectedLifeYears: 15, baseMsrp: 1100, laborHours: 4   },
  { brand: 'A.O. Smith', modelPrefix: 'HPTU-40', description: 'Voltex Heat Pump 40gal',     tankGallons: 40, fuelType: 'heat_pump',    inputBtuOrWatts: 4500,  firstHourRating: 65,  expectedLifeYears: 15, baseMsrp: 1050, laborHours: 4   },
  // Vertex High-Efficiency Gas
  { brand: 'A.O. Smith', modelPrefix: 'GPHE-50', description: 'Vertex 50gal NG High-Eff',  tankGallons: 50, fuelType: 'natural_gas',  inputBtuOrWatts: 76000, firstHourRating: 120, expectedLifeYears: 15, baseMsrp: 950,  laborHours: 4   },
  // ProLine Power Vent Gas
  { brand: 'A.O. Smith', modelPrefix: 'GPDH-75', description: 'ProLine PwrVent 75gal NG',  tankGallons: 75, fuelType: 'natural_gas',  inputBtuOrWatts: 76000, firstHourRating: 165, expectedLifeYears: 13, baseMsrp: 860,  laborHours: 4.5 },
  { brand: 'A.O. Smith', modelPrefix: 'GPDH-50', description: 'ProLine PwrVent 50gal NG',  tankGallons: 50, fuelType: 'natural_gas',  inputBtuOrWatts: 40000, firstHourRating: 96,  expectedLifeYears: 13, baseMsrp: 720,  laborHours: 4   },
  { brand: 'A.O. Smith', modelPrefix: 'GPDH-40', description: 'ProLine PwrVent 40gal NG',  tankGallons: 40, fuelType: 'natural_gas',  inputBtuOrWatts: 40000, firstHourRating: 87,  expectedLifeYears: 13, baseMsrp: 680,  laborHours: 4   },
  // ProLine Gas
  { brand: 'A.O. Smith', modelPrefix: 'GPSH-50', description: 'ProLine 50gal NG',           tankGallons: 50, fuelType: 'natural_gas',  inputBtuOrWatts: 38000, firstHourRating: 92,  expectedLifeYears: 13, baseMsrp: 650,  laborHours: 3   },
  { brand: 'A.O. Smith', modelPrefix: 'GPSH-40', description: 'ProLine 40gal NG',           tankGallons: 40, fuelType: 'natural_gas',  inputBtuOrWatts: 38000, firstHourRating: 82,  expectedLifeYears: 13, baseMsrp: 610,  laborHours: 3   },
  { brand: 'A.O. Smith', modelPrefix: 'GCSH-50', description: 'ProLine 50gal LP',           tankGallons: 50, fuelType: 'propane',       inputBtuOrWatts: 38000, firstHourRating: 92,  expectedLifeYears: 13, baseMsrp: 660,  laborHours: 3   },
  { brand: 'A.O. Smith', modelPrefix: 'GCSH-40', description: 'ProLine 40gal LP',           tankGallons: 40, fuelType: 'propane',       inputBtuOrWatts: 38000, firstHourRating: 82,  expectedLifeYears: 13, baseMsrp: 625,  laborHours: 3   },
  // Signature Gas
  { brand: 'A.O. Smith', modelPrefix: 'GPVH-50', description: 'Signature 50gal NG',         tankGallons: 50, fuelType: 'natural_gas',  inputBtuOrWatts: 36000, firstHourRating: 87,  expectedLifeYears: 12, baseMsrp: 560,  laborHours: 3   },
  { brand: 'A.O. Smith', modelPrefix: 'GPVH-40', description: 'Signature 40gal NG',         tankGallons: 40, fuelType: 'natural_gas',  inputBtuOrWatts: 36000, firstHourRating: 79,  expectedLifeYears: 12, baseMsrp: 520,  laborHours: 3   },
  { brand: 'A.O. Smith', modelPrefix: 'GPVH-30', description: 'Signature 30gal NG',         tankGallons: 30, fuelType: 'natural_gas',  inputBtuOrWatts: 30000, firstHourRating: 60,  expectedLifeYears: 12, baseMsrp: 450,  laborHours: 3   },
  { brand: 'A.O. Smith', modelPrefix: 'GCVH-50', description: 'Signature 50gal LP',         tankGallons: 50, fuelType: 'propane',       inputBtuOrWatts: 36000, firstHourRating: 87,  expectedLifeYears: 12, baseMsrp: 570,  laborHours: 3   },
  { brand: 'A.O. Smith', modelPrefix: 'GCVH-40', description: 'Signature 40gal LP',         tankGallons: 40, fuelType: 'propane',       inputBtuOrWatts: 36000, firstHourRating: 79,  expectedLifeYears: 12, baseMsrp: 530,  laborHours: 3   },
  // ProLine Electric
  { brand: 'A.O. Smith', modelPrefix: 'ESST-80', description: 'ProLine 80gal Electric',     tankGallons: 80, fuelType: 'electric',      inputBtuOrWatts: 5500,  firstHourRating: 88,  expectedLifeYears: 12, baseMsrp: 580,  laborHours: 3   },
  { brand: 'A.O. Smith', modelPrefix: 'ESST-50', description: 'ProLine 50gal Electric',     tankGallons: 50, fuelType: 'electric',      inputBtuOrWatts: 5500,  firstHourRating: 75,  expectedLifeYears: 12, baseMsrp: 520,  laborHours: 2.5 },
  { brand: 'A.O. Smith', modelPrefix: 'ESST-40', description: 'ProLine 40gal Electric',     tankGallons: 40, fuelType: 'electric',      inputBtuOrWatts: 5500,  firstHourRating: 70,  expectedLifeYears: 12, baseMsrp: 490,  laborHours: 2.5 },
  // Signature Electric
  { brand: 'A.O. Smith', modelPrefix: 'EES-80',  description: 'Signature 80gal Electric',   tankGallons: 80, fuelType: 'electric',      inputBtuOrWatts: 5500,  firstHourRating: 80,  expectedLifeYears: 11, baseMsrp: 520,  laborHours: 3   },
  { brand: 'A.O. Smith', modelPrefix: 'EES-50',  description: 'Signature 50gal Electric',   tankGallons: 50, fuelType: 'electric',      inputBtuOrWatts: 4500,  firstHourRating: 67,  expectedLifeYears: 11, baseMsrp: 450,  laborHours: 2.5 },
  { brand: 'A.O. Smith', modelPrefix: 'EES-40',  description: 'Signature 40gal Electric',   tankGallons: 40, fuelType: 'electric',      inputBtuOrWatts: 4500,  firstHourRating: 63,  expectedLifeYears: 11, baseMsrp: 420,  laborHours: 2.5 },
  { brand: 'A.O. Smith', modelPrefix: 'EES-30',  description: 'Signature 30gal Electric',   tankGallons: 30, fuelType: 'electric',      inputBtuOrWatts: 4500,  firstHourRating: 56,  expectedLifeYears: 11, baseMsrp: 380,  laborHours: 2.5 },

  // ── Bradford White ────────────────────────────────────────────────────────────
  // Heat Pump
  { brand: 'Bradford White', modelPrefix: 'AEPHE8', description: 'AeroTherm HP 80gal',      tankGallons: 80, fuelType: 'heat_pump',    inputBtuOrWatts: 4500,  firstHourRating: 108, expectedLifeYears: 15, baseMsrp: 1200, laborHours: 4.5 },
  { brand: 'Bradford White', modelPrefix: 'AEPHE5', description: 'AeroTherm HP 50gal',      tankGallons: 50, fuelType: 'heat_pump',    inputBtuOrWatts: 4500,  firstHourRating: 77,  expectedLifeYears: 15, baseMsrp: 1100, laborHours: 4   },
  // Power Vent Gas
  { brand: 'Bradford White', modelPrefix: 'PDV50',  description: 'Power Direct Vent 50gal', tankGallons: 50, fuelType: 'natural_gas',  inputBtuOrWatts: 40000, firstHourRating: 97,  expectedLifeYears: 13, baseMsrp: 740,  laborHours: 4   },
  { brand: 'Bradford White', modelPrefix: 'PDV40',  description: 'Power Direct Vent 40gal', tankGallons: 40, fuelType: 'natural_gas',  inputBtuOrWatts: 40000, firstHourRating: 87,  expectedLifeYears: 13, baseMsrp: 700,  laborHours: 4   },
  { brand: 'Bradford White', modelPrefix: 'PVG50',  description: 'Power Vent 50gal NG',     tankGallons: 50, fuelType: 'natural_gas',  inputBtuOrWatts: 40000, firstHourRating: 97,  expectedLifeYears: 13, baseMsrp: 720,  laborHours: 4   },
  { brand: 'Bradford White', modelPrefix: 'PVG40',  description: 'Power Vent 40gal NG',     tankGallons: 40, fuelType: 'natural_gas',  inputBtuOrWatts: 40000, firstHourRating: 87,  expectedLifeYears: 13, baseMsrp: 680,  laborHours: 4   },
  // AeroTherm Gas — LP
  { brand: 'Bradford White', modelPrefix: 'MH50L',  description: 'AeroTherm 50gal LP Tall', tankGallons: 50, fuelType: 'propane',       inputBtuOrWatts: 36000, firstHourRating: 88,  expectedLifeYears: 12, baseMsrp: 600,  laborHours: 3   },
  { brand: 'Bradford White', modelPrefix: 'MH40L',  description: 'AeroTherm 40gal LP Tall', tankGallons: 40, fuelType: 'propane',       inputBtuOrWatts: 36000, firstHourRating: 80,  expectedLifeYears: 12, baseMsrp: 560,  laborHours: 3   },
  { brand: 'Bradford White', modelPrefix: 'MH30S',  description: 'AeroTherm 30gal LP',      tankGallons: 30, fuelType: 'propane',       inputBtuOrWatts: 30000, firstHourRating: 59,  expectedLifeYears: 12, baseMsrp: 480,  laborHours: 3   },
  // AeroTherm Gas — NG
  { brand: 'Bradford White', modelPrefix: 'MI75',   description: 'AeroTherm 75gal NG',      tankGallons: 75, fuelType: 'natural_gas',  inputBtuOrWatts: 76000, firstHourRating: 162, expectedLifeYears: 13, baseMsrp: 840,  laborHours: 4   },
  { brand: 'Bradford White', modelPrefix: 'MI50L',  description: 'AeroTherm 50gal NG Tall', tankGallons: 50, fuelType: 'natural_gas',  inputBtuOrWatts: 36000, firstHourRating: 88,  expectedLifeYears: 12, baseMsrp: 580,  laborHours: 3   },
  { brand: 'Bradford White', modelPrefix: 'MI50S',  description: 'AeroTherm 50gal NG',      tankGallons: 50, fuelType: 'natural_gas',  inputBtuOrWatts: 36000, firstHourRating: 88,  expectedLifeYears: 12, baseMsrp: 580,  laborHours: 3   },
  { brand: 'Bradford White', modelPrefix: 'MI40L',  description: 'AeroTherm 40gal NG Tall', tankGallons: 40, fuelType: 'natural_gas',  inputBtuOrWatts: 36000, firstHourRating: 80,  expectedLifeYears: 12, baseMsrp: 540,  laborHours: 3   },
  { brand: 'Bradford White', modelPrefix: 'MI40S',  description: 'AeroTherm 40gal NG',      tankGallons: 40, fuelType: 'natural_gas',  inputBtuOrWatts: 36000, firstHourRating: 80,  expectedLifeYears: 12, baseMsrp: 540,  laborHours: 3   },
  { brand: 'Bradford White', modelPrefix: 'MI30S',  description: 'AeroTherm 30gal NG',      tankGallons: 30, fuelType: 'natural_gas',  inputBtuOrWatts: 30000, firstHourRating: 59,  expectedLifeYears: 12, baseMsrp: 460,  laborHours: 3   },
  // Super Saver Electric
  { brand: 'Bradford White', modelPrefix: 'ES280',  description: 'Super Saver 80gal Elec',  tankGallons: 80, fuelType: 'electric',      inputBtuOrWatts: 5500,  firstHourRating: 85,  expectedLifeYears: 12, baseMsrp: 560,  laborHours: 3   },
  { brand: 'Bradford White', modelPrefix: 'ES250',  description: 'Super Saver 50gal Elec',  tankGallons: 50, fuelType: 'electric',      inputBtuOrWatts: 5500,  firstHourRating: 78,  expectedLifeYears: 12, baseMsrp: 510,  laborHours: 2.5 },
  { brand: 'Bradford White', modelPrefix: 'ES240',  description: 'Super Saver 40gal Elec',  tankGallons: 40, fuelType: 'electric',      inputBtuOrWatts: 5500,  firstHourRating: 71,  expectedLifeYears: 12, baseMsrp: 480,  laborHours: 2.5 },
  { brand: 'Bradford White', modelPrefix: 'ES230',  description: 'Super Saver 30gal Elec',  tankGallons: 30, fuelType: 'electric',      inputBtuOrWatts: 5500,  firstHourRating: 60,  expectedLifeYears: 12, baseMsrp: 430,  laborHours: 2.5 },
  // Standard Electric
  { brand: 'Bradford White', modelPrefix: 'RE280',  description: 'Standard 80gal Electric', tankGallons: 80, fuelType: 'electric',      inputBtuOrWatts: 4500,  firstHourRating: 82,  expectedLifeYears: 11, baseMsrp: 510,  laborHours: 3   },
  { brand: 'Bradford White', modelPrefix: 'RE250',  description: 'Standard 50gal Electric', tankGallons: 50, fuelType: 'electric',      inputBtuOrWatts: 4500,  firstHourRating: 68,  expectedLifeYears: 11, baseMsrp: 450,  laborHours: 2.5 },
  { brand: 'Bradford White', modelPrefix: 'RE240',  description: 'Standard 40gal Electric', tankGallons: 40, fuelType: 'electric',      inputBtuOrWatts: 4500,  firstHourRating: 64,  expectedLifeYears: 11, baseMsrp: 420,  laborHours: 2.5 },
  { brand: 'Bradford White', modelPrefix: 'RE230',  description: 'Standard 30gal Electric', tankGallons: 30, fuelType: 'electric',      inputBtuOrWatts: 4500,  firstHourRating: 57,  expectedLifeYears: 11, baseMsrp: 380,  laborHours: 2.5 },
]
// NOTE: State, Navien, Rinnai, Noritz, Bosch, GE, Kenmore return partial hits
// (brand + manufacture date only). Add ModelSpec rows here to upgrade any brand.

// ─── Compute Job Cost ──────────────────────────────────────────────────────────
// Call with a region key from REGION_PRICING, or pass a custom PricingConfig.
// To update for inflation: bump DEFAULT_PRICING.inflationFactor (e.g. 1.06 = +6%).

export function computeJobCost(model: ModelSpec, pricing: PricingConfig = DEFAULT_PRICING): JobCost {
  const unitCost   = Math.round(model.baseMsrp * pricing.inflationFactor * (1 + pricing.unitMarkupPercent / 100))
  const laborCost  = Math.round(pricing.laborRatePerHour * model.laborHours * pricing.regionalMultiplier)
  const permitCost = Math.round(pricing.permitCost * pricing.regionalMultiplier)
  const base       = unitCost + laborCost + permitCost
  const totalMin   = Math.round(base * 0.92)
  const totalMax   = Math.round(base * 1.08)
  const perYear    = Math.round(base / model.expectedLifeYears)
  return { unitCost, laborCost, permitCost, totalMin, totalMax, perYear }
}

// ─── Brand Lookup ──────────────────────────────────────────────────────────────

export function lookupBrand(hint: string): BrandSpec | null {
  if (!hint) return null
  const h = hint.toLowerCase().trim()
  return (
    BRAND_SPECS.find(b =>
      b.brand.toLowerCase() === h ||
      b.aliases.some(a => h === a || h.includes(a) || a.includes(h))
    ) ?? null
  )
}

// ─── Serial Date Decoder ───────────────────────────────────────────────────────

function decodeSerialDate(
  serial: string,
  spec: BrandSpec,
): { manufactureDate: string; manufactureYear: number } | null {
  const s   = serial.replace(/\s/g, '').toUpperCase()
  const off = spec.serialOffset

  try {
    switch (spec.serialPattern) {

      case 'WWYY': {
        // Rheem: chars at offset = WW (week) + YY (year)
        const ww   = parseInt(s.slice(off, off + 2), 10)
        const yy   = parseInt(s.slice(off + 2, off + 4), 10)
        if (isNaN(ww) || isNaN(yy) || ww < 1 || ww > 53) return null
        const year = yy + (yy >= 80 ? 1900 : 2000)
        const month = Math.min(12, Math.max(1, Math.ceil(ww / 4.33)))
        return { manufactureDate: `${year}-${String(month).padStart(2, '0')}`, manufactureYear: year }
      }

      case 'YYWW': {
        // A.O. Smith, State, Noritz, Kenmore: chars at offset = YY + WW
        const yy   = parseInt(s.slice(off, off + 2), 10)
        const ww   = parseInt(s.slice(off + 2, off + 4), 10)
        if (isNaN(yy) || isNaN(ww) || ww < 1 || ww > 53) return null
        const year = yy + (yy >= 80 ? 1900 : 2000)
        const month = Math.min(12, Math.max(1, Math.ceil(ww / 4.33)))
        return { manufactureDate: `${year}-${String(month).padStart(2, '0')}`, manufactureYear: year }
      }

      case 'BWL': {
        // Bradford White: char at offset+1 = year letter, next 2 = week
        const letter = s[off]
        const ww     = parseInt(s.slice(off + 1, off + 3), 10)
        if (!letter || isNaN(ww) || ww < 1 || ww > 53) return null
        // Prefer the more recent cycle (post-2004) unless age would be >30yr
        const yearRecent = BW_YEAR_LETTERS[letter]
        const yearLegacy = BW_YEAR_LETTERS_LEGACY[letter]
        const now        = new Date().getFullYear()
        let year: number
        if (yearRecent && now - yearRecent <= 30) {
          year = yearRecent
        } else if (yearLegacy && now - yearLegacy <= 30) {
          year = yearLegacy
        } else {
          year = yearRecent ?? yearLegacy ?? now
        }
        const month = Math.min(12, Math.max(1, Math.ceil(ww / 4.33)))
        return { manufactureDate: `${year}-${String(month).padStart(2, '0')}`, manufactureYear: year }
      }

      case 'YYYYMM': {
        // Navien: chars 0-3 = year, 4-5 = month
        const year  = parseInt(s.slice(off, off + 4), 10)
        const month = parseInt(s.slice(off + 4, off + 6), 10)
        if (isNaN(year) || isNaN(month) || month < 1 || month > 12) return null
        return { manufactureDate: `${year}-${String(month).padStart(2, '0')}`, manufactureYear: year }
      }

      case 'YYMM': {
        // Rinnai: chars at offset = YY + MM
        const yy    = parseInt(s.slice(off, off + 2), 10)
        const month = parseInt(s.slice(off + 2, off + 4), 10)
        if (isNaN(yy) || isNaN(month) || month < 1 || month > 12) return null
        const year = yy + (yy >= 80 ? 1900 : 2000)
        return { manufactureDate: `${year}-${String(month).padStart(2, '0')}`, manufactureYear: year }
      }

      case 'YYYYWW': {
        // Bosch: chars 0-3 = year, 4-5 = week
        const year = parseInt(s.slice(off, off + 4), 10)
        const ww   = parseInt(s.slice(off + 4, off + 6), 10)
        if (isNaN(year) || isNaN(ww) || ww < 1 || ww > 53) return null
        const month = Math.min(12, Math.max(1, Math.ceil(ww / 4.33)))
        return { manufactureDate: `${year}-${String(month).padStart(2, '0')}`, manufactureYear: year }
      }

      case 'LETTER_YY': {
        // GE: char 0 = month letter, chars 1-2 = year
        const letter = s[off]
        const yy     = parseInt(s.slice(off + 1, off + 3), 10)
        const month  = GE_MONTH_LETTERS[letter]
        if (!month || isNaN(yy)) return null
        const year = yy + (yy >= 80 ? 1900 : 2000)
        return { manufactureDate: `${year}-${String(month).padStart(2, '0')}`, manufactureYear: year }
      }

      default:
        return null
    }
  } catch {
    return null
  }
}

// ─── Primary Export: lookupBySerial ───────────────────────────────────────────
// Returns full LookupResult if brand is recognized.
// partial=true means brand+date decoded but no model prefix matched.
// Returns null only if brand is completely unrecognized or serial too short.

export function lookupBySerial(
  serial: string,
  brandHint: string,
  pricing: PricingConfig = DEFAULT_PRICING,
): LookupResult | null {
  const brandSpec = lookupBrand(brandHint)
  if (!brandSpec) return null

  const s = serial.replace(/\s/g, '').toUpperCase()
  if (s.length < 4) return null

  const dateResult = decodeSerialDate(s, brandSpec)
  if (!dateResult) return null

  const { manufactureDate, manufactureYear } = dateResult
  const now          = new Date().getFullYear()
  const ageYears     = now - manufactureYear

  // Greedy prefix match: try longest prefix first
  const candidates = MODEL_SPECS
    .filter(m => m.brand === brandSpec.brand)
    .sort((a, b) => b.modelPrefix.length - a.modelPrefix.length)

  // modelHint is not always available from serial alone — caller should also pass model string
  // This function matches against serial prefix as fallback
  const matched = candidates.find(m =>
    s.startsWith(m.modelPrefix.toUpperCase().replace(/[^A-Z0-9]/g, ''))
  ) ?? null

  const remainingLifeYears = matched
    ? Math.max(0, matched.expectedLifeYears - ageYears)
    : 0

  return {
    brand: brandSpec.brand,
    serialPattern: brandSpec.serialPattern,
    manufactureDate,
    manufactureYear,
    ageYears,
    remainingLifeYears,
    model: matched,
    jobCost: matched ? computeJobCost(matched, pricing) : null,
    partial: matched === null,
    similarUnitsCount: brandSpec.similarUnitsBase,
  }
}

// ─── Secondary Export: lookupByModel ──────────────────────────────────────────
// Use when OCR gives you the model number directly (most common case).
// Pass brandHint + modelNumber, optionally manufactureYear from serial decode.

export function lookupByModel(
  modelNumber: string,
  brandHint: string,
  manufactureYear?: number,
  pricing: PricingConfig = DEFAULT_PRICING,
): LookupResult | null {
  const brandSpec = lookupBrand(brandHint)
  if (!brandSpec) return null

  const m = modelNumber.replace(/\s/g, '').toUpperCase()

  const candidates = MODEL_SPECS
    .filter(spec => spec.brand === brandSpec.brand)
    .sort((a, b) => b.modelPrefix.length - a.modelPrefix.length)

  const matched = candidates.find(spec =>
    m.startsWith(spec.modelPrefix.toUpperCase().replace(/[^A-Z0-9]/g, ''))
  ) ?? null

  const now              = new Date().getFullYear()
  const mfgYear          = manufactureYear ?? now
  const ageYears         = now - mfgYear
  const remainingLife    = matched ? Math.max(0, matched.expectedLifeYears - ageYears) : 0
  const mfgDateStr       = manufactureYear ? `${manufactureYear}-01` : ''

  return {
    brand: brandSpec.brand,
    serialPattern: brandSpec.serialPattern,
    manufactureDate: mfgDateStr,
    manufactureYear: mfgYear,
    ageYears,
    remainingLifeYears: remainingLife,
    model: matched,
    jobCost: matched ? computeJobCost(matched, pricing) : null,
    partial: matched === null || !manufactureYear,
    similarUnitsCount: brandSpec.similarUnitsBase,
  }
}
