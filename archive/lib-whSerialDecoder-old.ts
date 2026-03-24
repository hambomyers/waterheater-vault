// Water heater brand detection + JS serial date decoder.
// Runs entirely client-side — no network, no LLM.
// Same logic is mirrored in functions/api/_utils/whSerialDecoder.ts for CF Workers.

// ── Brand detection ───────────────────────────────────────────────────────────

const BRAND_MAP: [string, string[]][] = [
  // Partial/OCR-error keywords come after the canonical name — catches cut-off labels
  ['Navien',         ['navien', 'navien inc', 'navien america', 'npe-', ' npe ', 'navie', 'avien', 'n vien']],
  ['Rheem',          ['rheem', 'rhe em', 'rhem']],
  ['Ruud',           ['ruud', 'ruu d']],
  ['AO Smith',       ['ao smith', 'a.o. smith', 'aosmith', 'a. o. smith', 'ao smi']],
  ['Bradford White', ['bradford white', 'bradford-white', 'bradfordwhite', 'bradford w', 'bradfor']],
  ['Rinnai',         ['rinnai', 'rinnai america', 'rinnai corp', 'rinai', 'rinn ai', 'rinnal']],
  ['State',          ['state select', 'state proline', 'state water heater', 'state water']],
  ['Reliance',       ['reliance water', 'reliance']],
  ['American',       ['american water heater', 'american standard water']],
  ['Noritz',         ['noritz', 'norit z']],
  ['Bosch',          ['bosch']],
  ['Lochinvar',      ['lochinvar']],
  ['Weil-McLain',    ['weil-mclain', 'weil mclain', 'weilmclain']],
  ['GE',             ['g.e. water', 'ge water', 'general electric water']],
  ['Kenmore',        ['kenmore']],
  ['Whirlpool',      ['whirlpool']],
  ['Richmond',       ['richmond water', 'richmond']],
  ['Takagi',         ['takagi']],
  ['Polaris',        ['polaris']],
]

/** Detects water heater brand from raw OCR text. Returns brand string or empty string. */
export function detectWHBrand(text: string): string {
  const lower = text.toLowerCase()
  for (const [brand, keywords] of BRAND_MAP) {
    if (keywords.some(k => lower.includes(k))) return brand
  }
  return ''
}

// ── Serial candidate extraction ───────────────────────────────────────────────

/** Extracts the most likely serial number candidate from raw OCR text. */
export function extractWHSerial(text: string): string | undefined {
  const upper = text.toUpperCase().replace(/\s+/g, ' ')

  // Explicit label anchor — try all real-world variations of S/N prefix
  const labelPatterns = [
    /(?:SERIAL\s*(?:NO\.?|NUMBER|#)?|SER\.?\s*NO\.?)[:\s#]*([A-Z0-9]{6,20})/,
    /S\/N[:\s#]*([A-Z0-9]{6,20})/,
    /S\.N\.[:\s#]*([A-Z0-9]{6,20})/,
    /\bSN[:\s]+([A-Z0-9]{6,20})/,     // "SN 2021031234" or "SN: 2021031234"
    /\bS N[:\s]+([A-Z0-9]{6,20})/,    // "S N 2021031234" (space OCR artifact)
  ]
  for (const re of labelPatterns) {
    const m = upper.match(re)
    if (m?.[1]) return m[1].trim()
  }

  // Alphanumeric candidates: mixed letters+digits, 8-20 chars
  const candidates = Array.from(upper.matchAll(/\b([A-Z][A-Z0-9]{7,19})\b/g))
    .map(m => m[1])
    .filter(c => /[A-Z]/.test(c) && /[0-9]/.test(c))
    .filter(c => c.length >= 8 && c.length <= 20)
    // Filter out common label words that match the pattern
    .filter(c => ![
      'NATURAL', 'ELECTRIC', 'GALLONS', 'THERMAL', 'RECOVERY', 'CAPACITY',
      'PRESSURE', 'HEATER', 'PRODUCT', 'MAXIMUM', 'MINIMUM',
      'URETHANE', 'POLYURET', 'INSULATI', 'INSULATD', 'ANODE', 'ENERGY',
      'STANDARD', 'PREMIUM', 'RESIDENT', 'COMMERCI', 'WARNING', 'CAUTION',
      'VOLTAGE', 'AMPERE', 'WATTAGE', 'CIRCUIT', 'INSTALL', 'INSTRUC',
      'PROPANE', 'EFFICIEN', 'COMBUSTI', 'FLAMMBLE', 'CERTIFIE', 'APPROVALS',
      'COMPLIES', 'UNIFORM', 'PLUMBING', 'WARRANTY', 'INSULATE', 'FOAMEDUR',
    ].some(w => c === w || c.startsWith(w.slice(0, 7))))

  return candidates[0]
}

// ── Serial date decoder ───────────────────────────────────────────────────────

export interface SerialDecodeResult {
  year: number
  month: number
  manufactureDate: string  // 'YYYY-MM'
  patternType: string
}

/**
 * Decodes manufacture date from a water heater serial number using brand-specific rules.
 * Returns null if brand is unknown or serial doesn't match the expected pattern.
 */
export function decodeWHSerial(brand: string, serial: string): SerialDecodeResult | null {
  const b = brand.toLowerCase()
  const s = serial.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (s.length < 4) return null

  // ── Rheem / Ruud ──────────────────────────────────────────────────────────
  if (b.includes('rheem') || b.includes('ruud')) {
    // Format 1: Letter month + 2-digit year (e.g. A15 = Jan 2015)
    const letterMonth = s.match(/^([A-L])(\d{2})/)
    if (letterMonth) {
      const month = letterMonth[1].charCodeAt(0) - 64
      const year = 2000 + parseInt(letterMonth[2])
      if (year >= 2000 && year <= 2040) {
        return { year, month, manufactureDate: fmt(year, month), patternType: 'LETTER_YY' }
      }
    }
    // Format 2: WWYY (week 01-52, year 2-digit)
    const week = parseInt(s.slice(0, 2))
    const year = 2000 + parseInt(s.slice(2, 4))
    if (week >= 1 && week <= 52 && year >= 2000 && year <= 2040) {
      return { year, month: weekToMonth(week), manufactureDate: fmt(year, weekToMonth(week)), patternType: 'WWYY' }
    }
  }

  // ── AO Smith / American / Reliance / State / Whirlpool / Richmond ─────────
  if (b.includes('ao smith') || b.includes('a.o.') || b.includes('american') ||
      b.includes('reliance') || b.includes('state') || b.includes('whirlpool') ||
      b.includes('richmond')) {
    const year = 2000 + parseInt(s.slice(0, 2))
    const week = parseInt(s.slice(2, 4))
    if (year >= 2000 && year <= 2040 && week >= 1 && week <= 52) {
      return { year, month: weekToMonth(week), manufactureDate: fmt(year, weekToMonth(week)), patternType: 'YYWW' }
    }
  }

  // ── Bradford White ────────────────────────────────────────────────────────
  if (b.includes('bradford')) {
    const decades: Record<string, number> = { A: 2000, B: 2010, C: 2020, D: 2030 }
    const decade = decades[s[0]]
    if (decade !== undefined && s.length >= 3) {
      const yearOffset = s.charCodeAt(1) - 65  // A=0 … J=9
      const month = s.charCodeAt(2) - 64       // A=1 … L=12
      if (yearOffset >= 0 && yearOffset <= 9 && month >= 1 && month <= 12) {
        return { year: decade + yearOffset, month, manufactureDate: fmt(decade + yearOffset, month), patternType: 'BWL' }
      }
    }
  }

  // ── Navien NPE-series: plant letter + two-digit year suffix (e.g. A19=2019, C14=2014) ───
  if (b.includes('navien')) {
    const match = s.match(/[A-Z](\d{2})/)
    if (match) {
      const year = 2000 + parseInt(match[1])
      if (year >= 2000 && year <= 2040) {
        return { year, month: 1, manufactureDate: fmt(year, 1), patternType: 'NAVIEN_LETTER_YY' }
      }
    }
  }

  // ── Noritz / Lochinvar / Weil-McLain (YYWW) ────────────────────────────────
  if (b.includes('noritz') || b.includes('lochinvar') || b.includes('weil')) {
    const year = 2000 + parseInt(s.slice(0, 2))
    const week = parseInt(s.slice(2, 4))
    if (year >= 2000 && year <= 2040 && week >= 1 && week <= 52) {
      return { year, month: weekToMonth(week), manufactureDate: fmt(year, weekToMonth(week)), patternType: 'YYWW' }
    }
  }

  // ── Rinnai / Takagi (YYMM) ───────────────────────────────────────────────
  if (b.includes('rinnai') || b.includes('takagi')) {
    const year = 2000 + parseInt(s.slice(0, 2))
    const month = parseInt(s.slice(2, 4))
    if (year >= 2000 && year <= 2040 && month >= 1 && month <= 12) {
      return { year, month, manufactureDate: fmt(year, month), patternType: 'YYMM' }
    }
  }

  // ── Bosch (YYYYWW, 6 leading digits) ─────────────────────────────────────
  if (b.includes('bosch') && /^\d{6}/.test(s)) {
    const year = parseInt(s.slice(0, 4))
    const week = parseInt(s.slice(4, 6))
    if (year >= 2000 && year <= 2040 && week >= 1 && week <= 52) {
      return { year, month: weekToMonth(week), manufactureDate: fmt(year, weekToMonth(week)), patternType: 'YYYYWW' }
    }
  }

  // ── GE / Kenmore (factory-letter + year-digit) ───────────────────────────
  if ((b.includes('ge') || b.includes('kenmore')) && /^[A-Z]\d/.test(s)) {
    const year = 2000 + parseInt(s[1])
    if (year >= 2000 && year <= 2040) {
      return { year, month: 1, manufactureDate: fmt(year, 1), patternType: 'LETTER_YY' }
    }
  }

  return null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function weekToMonth(week: number): number {
  return Math.min(12, Math.max(1, Math.ceil(week / 4.33)))
}

function fmt(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}
