// Mirror of lib/whSerialDecoder.ts for CF Workers runtime.
// Keep in sync with the client-side version.

export function detectWHBrand(text: string): string {
  const lower = text.toLowerCase()
  const BRAND_MAP: [string, string[]][] = [
    ['Rheem',          ['rheem']],
    ['Ruud',           ['ruud']],
    ['AO Smith',       ['ao smith', 'a.o. smith', 'aosmith', 'a. o. smith']],
    ['Bradford White', ['bradford white', 'bradford-white', 'bradfordwhite']],
    ['Navien',         ['navien']],
    ['Rinnai',         ['rinnai']],
    ['State',          ['state select', 'state proline', 'state water heater', 'state water']],
    ['Reliance',       ['reliance water', 'reliance']],
    ['American',       ['american water heater', 'american standard water']],
    ['Noritz',         ['noritz']],
    ['Bosch',          ['bosch']],
    ['Lochinvar',      ['lochinvar']],
    ['Weil-McLain',    ['weil-mclain', 'weil mclain', 'weilmclain']],
    ['GE',             ['g.e. water', 'ge water', 'general electric water']],
    ['Kenmore',        ['kenmore']],
    ['Whirlpool',      ['whirlpool']],
    ['Richmond',       ['richmond water', 'richmond']],
    ['Takagi',         ['takagi']],
  ]
  for (const [brand, keywords] of BRAND_MAP) {
    if (keywords.some(k => lower.includes(k))) return brand
  }
  return ''
}

export function extractWHSerial(text: string): string | undefined {
  const upper = text.toUpperCase()
  const explicit = upper.match(/(?:S[/.]?N|SERIAL\s*(?:NO\.?|NUMBER)?|SER\.?\s*NO\.?)[:\s#]*([A-Z0-9]{6,20})/)
  if (explicit?.[1]) return explicit[1]
  const candidates = Array.from(upper.matchAll(/\b([A-Z][A-Z0-9]{7,19})\b/g))
    .map(m => m[1])
    .filter(c => /[A-Z]/.test(c) && /[0-9]/.test(c))
    .filter(c => c.length >= 8 && c.length <= 20)
    .filter(c => !['NATURAL', 'ELECTRIC', 'GALLONS', 'THERMAL', 'RECOVERY', 'CAPACITY',
                   'PRESSURE', 'HEATER', 'PRODUCT', 'MAXIMUM', 'MINIMUM'].some(
      w => c === w || c.startsWith(w.slice(0, 7))
    ))
  return candidates[0]
}

export interface SerialDecodeResult {
  year: number
  month: number
  manufactureDate: string
  patternType: string
}

export function decodeWHSerial(brand: string, serial: string): SerialDecodeResult | null {
  const b = brand.toLowerCase()
  const s = serial.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (s.length < 4) return null

  if (b.includes('rheem') || b.includes('ruud')) {
    // Handle RHLN format: brand prefix + space + WW + space + YY + space + sequence
    // Example: "RHLN 01 06 534307" = week 01, year 2006
    const rhlnMatch = s.match(/RHLN(\d{2})(\d{2})/)
    if (rhlnMatch) {
      const week = parseInt(rhlnMatch[1])
      const year = 2000 + parseInt(rhlnMatch[2])
      if (week >= 1 && week <= 52 && year >= 2000 && year <= 2040) {
        return { year, month: wk(week), manufactureDate: fmt(year, wk(week)), patternType: 'WWYY' }
      }
    }
    
    // Handle letter-month format: A=Jan, B=Feb, etc.
    const letterMonth = s.match(/^([A-L])(\d{2})/)
    if (letterMonth) {
      const month = letterMonth[1].charCodeAt(0) - 64
      const year = 2000 + parseInt(letterMonth[2])
      if (year >= 2000 && year <= 2040) return { year, month, manufactureDate: fmt(year, month), patternType: 'LETTER_YY' }
    }
    
    // Handle standard WWYY format
    const week = parseInt(s.slice(0, 2))
    const year = 2000 + parseInt(s.slice(2, 4))
    if (week >= 1 && week <= 52 && year >= 2000 && year <= 2040) {
      return { year, month: wk(week), manufactureDate: fmt(year, wk(week)), patternType: 'WWYY' }
    }
  }

  if (b.includes('ao smith') || b.includes('a.o.') || b.includes('american') ||
      b.includes('reliance') || b.includes('state') || b.includes('whirlpool') || b.includes('richmond')) {
    const year = 2000 + parseInt(s.slice(0, 2))
    const week = parseInt(s.slice(2, 4))
    if (year >= 2000 && year <= 2040 && week >= 1 && week <= 52) {
      return { year, month: wk(week), manufactureDate: fmt(year, wk(week)), patternType: 'YYWW' }
    }
  }

  if (b.includes('bradford') && s.length >= 3) {
    const decades: Record<string, number> = { A: 2000, B: 2010, C: 2020, D: 2030 }
    const decade = decades[s[0]]
    if (decade !== undefined) {
      const yearOffset = s.charCodeAt(1) - 65
      const month = s.charCodeAt(2) - 64
      if (yearOffset >= 0 && yearOffset <= 9 && month >= 1 && month <= 12) {
        return { year: decade + yearOffset, month, manufactureDate: fmt(decade + yearOffset, month), patternType: 'BWL' }
      }
    }
  }

  if (b.includes('navien') || b.includes('noritz') || b.includes('lochinvar') || b.includes('weil')) {
    const year = 2000 + parseInt(s.slice(0, 2))
    const week = parseInt(s.slice(2, 4))
    if (year >= 2000 && year <= 2040 && week >= 1 && week <= 52) {
      return { year, month: wk(week), manufactureDate: fmt(year, wk(week)), patternType: 'YYWW' }
    }
  }

  if (b.includes('rinnai') || b.includes('takagi')) {
    const year = 2000 + parseInt(s.slice(0, 2))
    const month = parseInt(s.slice(2, 4))
    if (year >= 2000 && year <= 2040 && month >= 1 && month <= 12) {
      return { year, month, manufactureDate: fmt(year, month), patternType: 'YYMM' }
    }
  }

  if (b.includes('bosch') && /^\d{6}/.test(s)) {
    const year = parseInt(s.slice(0, 4))
    const week = parseInt(s.slice(4, 6))
    if (year >= 2000 && year <= 2040 && week >= 1 && week <= 52) {
      return { year, month: wk(week), manufactureDate: fmt(year, wk(week)), patternType: 'YYYYWW' }
    }
  }

  if ((b.includes('ge') || b.includes('kenmore')) && /^[A-Z]\d/.test(s)) {
    const year = 2000 + parseInt(s[1])
    if (year >= 2000 && year <= 2040) {
      return { year, month: 1, manufactureDate: fmt(year, 1), patternType: 'LETTER_YY' }
    }
  }

  return null
}

function wk(week: number): number { return Math.min(12, Math.max(1, Math.ceil(week / 4.33))) }
function fmt(year: number, month: number): string { return `${year}-${String(month).padStart(2, '0')}` }
