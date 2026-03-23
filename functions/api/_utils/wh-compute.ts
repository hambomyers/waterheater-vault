// Shared water-heater compute utilities used by grok-scan, parse-text, and fast-lookup.

// ── Prompts ───────────────────────────────────────────────────────────────────

export const WH_SYSTEM = `You are a water heater data plate reader. Read ONLY what is physically printed on the label in the image.

Return ONLY valid JSON, no markdown, no explanation:
{
  "brand": "exact brand name (Rheem|Ruud|AO Smith|Bradford White|Navien|Rinnai|State|Reliance|American|GE|Kenmore|Whirlpool|Lochinvar|Noritz|Takagi|Bosch|Weil-McLain|other)",
  "model": "model number — ONLY extract what immediately follows the word 'Model', 'Model No.', 'MDL', or 'Mod.' on the label. Return null if no Model keyword exists.",
  "serialNumber": "serial number — ONLY extract what immediately follows 'Serial', 'Serial No.', 'Ser.', 'S/N', or 'S.N.' on the label. Must be 6-20 alphanumeric chars.",
  "manufactureDate": "YYYY-MM decoded from serial — REQUIRED if serial present",
  "tankSizeGallons": capacity as integer (30/40/50/75/80) or null if tankless,
  "fuelType": "gas|electric|tankless-gas|tankless-electric|heat-pump|unknown",
  "confidence": 0.0-1.0
}

CRITICAL — NEVER return these as model or serial: URETHANE, FOAM, INSULATION, INSULATED, POLYURETHANE, ANODE, NATURAL GAS, PROPANE, ELECTRIC, GALLON, THERMAL, BTU, RECOVERY, WARNING, CAUTION, VOLTAGE, WATTAGE, CERTIFIED, COMPLIES, EFFICIENCY, RESIDENTIAL, COMMERCIAL, or any other descriptive label text.

If not a water heater data plate: {"error":"not_wh","message":"brief description"}

SERIAL DATE DECODERS:
• Rheem/Ruud: pos1-2=week pos3-4=year e.g. "0115"=Jan2015. OR letter+2digit A=Jan…L=Dec e.g. "A15"=Jan2015
• AO Smith/American/Reliance/Whirlpool/State/Richmond: pos1-2=year pos3-4=week e.g. "1506"=2015wk6≈Jun2015
• Bradford White: pos1=decade(A=2000s,B=2010s,C=2020s) pos2=yr(A=0…J=9) pos3=month(A=Jan…L=Dec) e.g. "BEF"=2014Jun
• Navien NPE/NFC/NCB/NHB: YYYYMM e.g. "202103"=March2021 (4-digit year + 2-digit month)
• Rinnai RL/RU/RUR/i-series: YYMM e.g. "2308"=Aug2023
• Noritz: YYWW in first 4 chars
• Bosch: first 6 = YYYYWW
• GE: letter=factory next digit=year (A=2001,B=2002…)
• Lochinvar/Weil-McLain: first 2=year next 2=week
• Unknown: best YYYY-MM estimate with "(est)" appended`

export const WH_TEXT_SYSTEM = `You are a water heater data plate OCR parser. The input is raw OCR text extracted from a physical water heater label — it may contain noise, OCR errors, and line-break artifacts.

Return ONLY valid JSON, no markdown, no explanation:
{
  "brand": "exact brand name (Rheem|Ruud|AO Smith|Bradford White|Navien|Rinnai|State|Reliance|American|GE|Kenmore|Whirlpool|Lochinvar|Noritz|Takagi|Bosch|Weil-McLain|other)",
  "model": "Extract the model number. FIRST look for anything after 'Model', 'Model No.', 'MDL', or 'Mod.' on the label. If that keyword is missing or garbled, look for any alphanumeric string that starts with a known water heater model prefix: NPE, NFC, NCB, RU, RLX, V53/V65/V75/V94, NRC, EZ, CB, TH3, TK, PROE, PROG, PROT, PROH, PROU, GPVH, GPDH, HPTU, MI, RE, XCR, ENS, G6, G8. Return the full model string including suffix (e.g. NPE-240A2, RU199iN, PROE50T2). Return null only if nothing plausible exists.",
  "serialNumber": "Extract the serial number. Look for anything after SN, S/N, S.N., SERIAL, SERIAL NO., or SER. — including 'SN 2021031234' with a space. Also accept any 8-20 char alphanumeric string that looks like a serial (mix of letters and digits). Return null only if truly nothing found.",
  "manufactureDate": "YYYY-MM decoded from serial using brand rules below — REQUIRED if serial present",
  "tankSizeGallons": capacity as integer (30/40/50/75/80) or null if tankless,
  "fuelType": "gas|electric|tankless-gas|tankless-electric|heat-pump|unknown",
  "confidence": 0.0-1.0
}

If text clearly has no water heater data: {"error":"not_wh","message":"brief description"}

CRITICAL — NEVER return these as model or serial values: URETHANE, FOAM, INSULATION, INSULATED, POLYURETHANE, ANODE, NATURAL GAS, PROPANE, ELECTRIC, GALLON, THERMAL, BTU, RECOVERY, WARNING, CAUTION, VOLTAGE, WATTAGE, CERTIFIED, COMPLIES, EFFICIENCY, RESIDENTIAL, COMMERCIAL, or any other descriptive words from the label. If a string after 'Model' looks like a description word rather than a part number, return null.

OCR NOISE RULES: Common errors on metal labels: 0↔O, 1↔I↔L, 8↔B, 5↔S. Ignore stray punctuation. Model numbers are typically 6-20 chars mixing letters and digits (e.g. PROE50T2, NPE-240A2, MI50L). Serial numbers are 8-20 alphanumeric chars.

SERIAL DATE DECODERS:
• Rheem/Ruud: pos1-2=week pos3-4=year e.g. "0115"=Jan2015. OR letter+2digit A=Jan…L=Dec e.g. "A15"=Jan2015
• AO Smith/American/Reliance/Whirlpool/State/Richmond: pos1-2=year pos3-4=week e.g. "1506"=2015wk6≈Jun2015
• Bradford White: pos1=decade(A=2000s,B=2010s,C=2020s) pos2=yr(A=0…J=9) pos3=month(A=Jan…L=Dec) e.g. "BEF"=2014Jun
• Navien NPE/NFC/NCB/NHB: YYYYMM e.g. "202103"=March2021 (4-digit year + 2-digit month)
• Rinnai RL/RU/RUR/i-series: YYMM e.g. "2308"=Aug2023
• Noritz: YYWW in first 4 chars
• Bosch: first 6 = YYYYWW
• GE: letter=factory next digit=year (A=2001,B=2002…)
• Lochinvar/Weil-McLain: first 2=year next 2=week
• Unknown: best YYYY-MM estimate with "(est)" appended`

// ── JSON extractor ────────────────────────────────────────────────────────────

export function extractOutermostJson(text: string): string | null {
  const start = text.indexOf('{')
  if (start === -1) return null
  let depth = 0
  let inString = false
  let escape = false
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (escape) { escape = false; continue }
    if (ch === '\\' && inString) { escape = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue
    if (ch === '{') depth++
    if (ch === '}') { depth--; if (depth === 0) return text.slice(start, i + 1) }
  }
  return null
}

// ── Brave Search ──────────────────────────────────────────────────────────────

export async function braveSearch(apiKey: string, query: string): Promise<string | null> {
  try {
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=3&search_lang=en`
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': apiKey,
      },
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!res.ok) return null
    const data: any = await res.json()
    return data?.web?.results?.[0]?.url ?? null
  } catch {
    return null
  }
}

// ── Derived field computation ─────────────────────────────────────────────────

export function computeDerivedFields(parsed: any): any {
  const currentYear = new Date().getFullYear()
  const fuel = (parsed.fuelType || 'unknown').toLowerCase()
  const brand = (parsed.brand || '').toLowerCase()
  const gal = parsed.tankSizeGallons || 0

  let mfgYear = 0
  if (parsed.manufactureDate) {
    mfgYear = parseInt(String(parsed.manufactureDate).replace(/\(.*\)/, '').trim().split('-')[0]) || 0
  }
  const ageYears = mfgYear > 1980 ? Math.max(0, currentYear - mfgYear) : 0

  let expectedLife = 10
  if (fuel.includes('tankless')) {
    expectedLife = (brand.includes('navien') || brand.includes('rinnai') || brand.includes('noritz')) ? 20 : 18
  } else if (fuel === 'electric') {
    expectedLife = 12
  } else if (fuel === 'heat-pump' || fuel === 'heat_pump') {
    expectedLife = 13
  }
  const remainingLifeYears = Math.max(0, expectedLife - ageYears)

  let costMid = 1150, unitLow = 700, unitHigh = 1100, laborLow = 400, laborHigh = 800
  let emLow = 400, emHigh = 700, ncLow = 2200, ncHigh = 3400
  if (fuel.includes('tankless')) {
    if (fuel.includes('electric')) {
      costMid = 1150; unitLow = 600; unitHigh = 1000; laborLow = 500; laborHigh = 900; emLow = 450; emHigh = 800; ncLow = 2400; ncHigh = 3800
    } else {
      costMid = 2000; unitLow = 900; unitHigh = 1800; laborLow = 600; laborHigh = 1000; emLow = 500; emHigh = 900; ncLow = 2800; ncHigh = 4200
    }
  } else if (fuel === 'heat-pump' || fuel === 'heat_pump') {
    costMid = 1600; unitLow = 900; unitHigh = 1400; laborLow = 600; laborHigh = 900; emLow = 500; emHigh = 800; ncLow = 2600; ncHigh = 4000
  } else if (fuel === 'electric') {
    costMid = 950; unitLow = 500; unitHigh = 900; laborLow = 350; laborHigh = 700; emLow = 350; emHigh = 600; ncLow = 1800; ncHigh = 2800
  } else if (gal >= 50) {
    costMid = 1450; unitLow = 800; unitHigh = 1300; laborLow = 450; laborHigh = 850; emLow = 450; emHigh = 750; ncLow = 2500; ncHigh = 3700
  }

  let warranty = 'See manufacturer documentation'
  if (brand.includes('navien')) warranty = '12-year heat exchanger, 5-year parts, 1-year labor'
  else if (brand.includes('rinnai')) warranty = '12-year heat exchanger, 5-year parts, 1-year labor'
  else if (brand.includes('noritz')) warranty = '12-year heat exchanger, 5-year parts, 1-year labor'
  else if (brand.includes('bosch')) warranty = '15-year heat exchanger, 6-year parts'
  else if (brand.includes('lochinvar')) warranty = '10-year heat exchanger, 5-year parts'
  else if (brand.includes('bradford')) warranty = '6-year tank, 1-year parts'
  else if (brand.includes('rheem') || brand.includes('ruud')) warranty = '6-year tank, 1-year parts'
  else if (brand.includes('ao smith') || brand.includes('a.o. smith')) warranty = '6–12-year tank (model dependent)'
  else if (brand.includes('state') || brand.includes('american') || brand.includes('reliance')) warranty = '6-year tank, 1-year parts'
  else if (brand.includes('ge') || brand.includes('kenmore') || brand.includes('whirlpool')) warranty = '6-year tank, 1-year parts'

  const b = parsed.brand || 'Water Heater'
  const m = parsed.model ? ` ${parsed.model}` : ''
  let pType = `${gal > 0 ? gal + '-Gal ' : ''}Gas Water Heater`
  if (fuel.includes('tankless')) pType = `Tankless ${fuel.includes('electric') ? 'Electric' : 'Gas'} Water Heater`
  else if (fuel === 'heat-pump' || fuel === 'heat_pump') pType = `${gal > 0 ? gal + '-Gal ' : ''}Heat Pump Water Heater`
  else if (fuel === 'electric') pType = `${gal > 0 ? gal + '-Gal ' : ''}Electric Water Heater`

  const bq = parsed.brand || 'water heater'
  const mq = parsed.model || ''
  const fq = fuel.includes('gas') ? 'gas' : 'electric'
  const docs = [
    { type: 'serialDecoder', label: 'Serial Date Decoder', searchQuery: `${bq} water heater serial number manufacture date decoder` },
    { type: 'ownerManual',   label: 'Owner Manual',        searchQuery: `${bq} ${mq} water heater owner manual PDF`.trim() },
    { type: 'warrantyTerms', label: 'Warranty Terms',      searchQuery: `${bq} water heater warranty terms ${mq}`.trim() },
    { type: 'recallCheck',   label: 'CPSC Recall Check',   searchQuery: `${bq} ${mq} water heater recall site:cpsc.gov`.trim() },
    { type: 'utilityRebate', label: 'Utility Rebate',      searchQuery: `${fq} water heater utility rebate DSIRE energystar` },
  ]

  return {
    ...parsed,
    product: `${b}${m} ${pType}`,
    fuelType: fuel,
    ageYears,
    remainingLifeYears,
    estimatedReplacementCost: costMid,
    currentWarranty: parsed.currentWarranty || warranty,
    depreciationRate: expectedLife > 0 ? parseFloat((1 / expectedLife).toFixed(3)) : 0.1,
    shot1Note: parsed.shot1Note || null,
    priceBreakdown: {
      unitLow, unitHigh, laborLow, laborHigh,
      emergencyPremiumLow: emLow, emergencyPremiumHigh: emHigh,
      nationalChainLow: ncLow, nationalChainHigh: ncHigh,
    },
    docs,
  }
}

// ── Self-improving: record each scan to build pattern + model confidence ──────
// Called after every successful LLM parse. Non-blocking (never throws).

export async function learnFromScan(db: any, parsed: any): Promise<void> {
  if (!db || !parsed) return
  try {
    const rawBrand = (parsed.brand || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
    const brand = normalizeBrand(rawBrand)
    const model = (parsed.model || '').toUpperCase().trim()
    const serial = (parsed.serialNumber || '').toUpperCase().trim()

    if (!brand || !serial) return

    const patternType = getBrandPatternType(brand)
    const mfgYear = parsed.manufactureDate
      ? parseInt(String(parsed.manufactureDate).split('-')[0]) : 0
    const decodedCorrectly = mfgYear >= 2000 && mfgYear <= 2040 ? 1 : 0

    await db.prepare(`
      INSERT INTO serial_patterns (brand, pattern_type, sample_count, correct_count, confidence, last_updated)
      VALUES (?, ?, 1, ?, ?, ?)
      ON CONFLICT(brand) DO UPDATE SET
        pattern_type  = excluded.pattern_type,
        sample_count  = sample_count + 1,
        correct_count = correct_count + ?,
        confidence    = CAST((correct_count + ?) AS REAL) / (sample_count + 1),
        last_updated  = excluded.last_updated
    `).bind(
      brand, patternType, decodedCorrectly,
      (decodedCorrectly * 1.0).toFixed(3),
      new Date().toISOString(),
      decodedCorrectly, decodedCorrectly,
    ).run().catch(() => {})

    if (model.length >= 4) {
      const prefix = model.slice(0, 8)
      const fuel = (parsed.fuelType || '').toLowerCase() || null
      const gal = parsed.tankSizeGallons || null
      const life = (parsed.remainingLifeYears != null && parsed.ageYears != null)
        ? (parsed.remainingLifeYears + parsed.ageYears) : null

      await db.prepare(`
        INSERT INTO model_catalog (brand, model_prefix, fuel_type, tank_size_gallons, expected_life_years, sample_count, last_seen)
        VALUES (?, ?, ?, ?, ?, 1, ?)
        ON CONFLICT(brand, model_prefix) DO UPDATE SET
          sample_count        = sample_count + 1,
          last_seen           = excluded.last_seen,
          fuel_type           = COALESCE(excluded.fuel_type, fuel_type),
          tank_size_gallons   = COALESCE(excluded.tank_size_gallons, tank_size_gallons),
          expected_life_years = COALESCE(excluded.expected_life_years, expected_life_years)
      `).bind(brand, prefix, fuel, gal, life, new Date().toISOString()).run().catch(() => {})
    }
  } catch {
    // non-critical — never fail the scan
  }
}

export function normalizeBrand(raw: string): string {
  const r = raw.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
  if (r.includes('rheem')) return 'rheem'
  if (r.includes('ruud')) return 'ruud'
  if (r.includes('ao smith') || r.includes('a o smith') || r.includes('aosmith')) return 'ao smith'
  if (r.includes('bradford')) return 'bradford white'
  if (r.includes('navien')) return 'navien'
  if (r.includes('rinnai')) return 'rinnai'
  if (r.includes('state')) return 'state'
  if (r.includes('reliance')) return 'reliance'
  if (r.includes('american')) return 'american'
  if (r.includes('noritz')) return 'noritz'
  if (r.includes('bosch')) return 'bosch'
  if (r.includes('lochinvar')) return 'lochinvar'
  if (r.includes('weil')) return 'weil-mclain'
  if (r.includes('kenmore')) return 'kenmore'
  if (r.includes('whirlpool')) return 'whirlpool'
  if (r.includes('richmond')) return 'richmond'
  if (r.includes('takagi')) return 'takagi'
  if (r.includes('ge') || r.includes('general electric')) return 'ge'
  return r
}

export function getBrandPatternType(brand: string): string {
  const b = brand.toLowerCase()
  if (b === 'rheem' || b === 'ruud') return 'WWYY'
  if (b === 'ao smith' || b === 'american' || b === 'reliance' || b === 'state' || b === 'whirlpool' || b === 'richmond') return 'YYWW'
  if (b === 'bradford white') return 'BWL'
  if (b === 'navien' || b === 'noritz' || b === 'lochinvar' || b === 'weil-mclain') return 'YYWW'
  if (b === 'rinnai' || b === 'takagi') return 'YYMM'
  if (b === 'bosch') return 'YYYYWW'
  if (b === 'ge' || b === 'kenmore') return 'LETTER_YY'
  return 'UNKNOWN'
}
