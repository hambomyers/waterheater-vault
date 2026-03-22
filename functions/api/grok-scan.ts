function userFriendlyError(status: number): string {
  switch (status) {
    case 401: return 'Invalid API key. Check GROK_API_KEY in Cloudflare Pages settings.'
    case 429: return 'Rate limit reached. Please wait a moment and try again.'
    case 404: return 'Grok model not found.'
    case 413: return 'Image too large. Try a lower-resolution photo.'
    default:  return `Grok API error (${status}). Please try again.`
  }
}

// ── Minimal label-reader prompt ───────────────────────────────────────────────
// Grok reads 7 fields only. All derived fields are computed server-side below.

const WH_SYSTEM = `You are a water heater data plate reader. Read ONLY what is physically printed on the label in the image.

Return ONLY valid JSON, no markdown, no explanation:
{
  "brand": "exact brand name (Rheem|AO Smith|Bradford White|Navien|Rinnai|State|Reliance|American|GE|Kenmore|Whirlpool|Lochinvar|Noritz|Bosch|Weil-McLain|other)",
  "model": "model number exactly as printed, or null",
  "serialNumber": "serial number exactly as printed — look for S/N, Serial No., standalone alphanumeric string 8-20 chars",
  "manufactureDate": "YYYY-MM decoded from serial — REQUIRED if serial present",
  "tankSizeGallons": capacity as integer (30/40/50/75/80) or null if tankless,
  "fuelType": "gas|electric|tankless-gas|tankless-electric|heat-pump|unknown",
  "confidence": 0.0-1.0
}

If not a water heater data plate: {"error":"not_wh","message":"brief description"}

SERIAL DATE DECODERS:
• Rheem/Ruud: pos1-2=week pos3-4=year e.g. "0115"=Jan2015. OR letter+2digit A=Jan…L=Dec e.g. "A15"=Jan2015
• AO Smith/American/Reliance/Whirlpool: pos1-2=year pos3-4=week e.g. "1506"=2015wk6≈Jun2015
• Bradford White: pos1=decade(A=2000s,B=2010s,C=2020s) pos2=yr(A=0…J=9) pos3=month(A=Jan…L=Dec) e.g. "BEF"=2014Jun
• State ProLine/Select: same as AO Smith (year+week)
• Navien NPE/NFC/NCB/NHB: YYWW e.g. "2312"=2023wk12≈Mar2023
• Rinnai RL/RU/RUR/i-series: YYMM e.g. "2308"=Aug2023
• Noritz: YYWW in first 4 chars
• Bosch: first 6 = YYYYWW
• GE: letter=factory next digit=year (A=2001,B=2002…)
• Lochinvar/Weil-McLain: first 2=year next 2=week
• Unknown: best YYYY-MM estimate with "(est)" appended`

// ── Review screening prompt (unchanged) ──────────────────────────────────────

const WH_REVIEW_SCREEN = `You are a quality-screening AI for WaterHeaterVault Pro — a platform that connects homeowners with trusted local water heater contractors.

You will receive the business name and Google Business Profile URL. Using the provided review data (passed as context), assess whether this business meets the 4.5+ star threshold.

Return ONLY a single valid JSON object:
{
  "approved": true or false,
  "rating": average star rating as a number (e.g. 4.7),
  "reviewCount": total number of reviews as integer,
  "sentiment": "positive" | "mixed" | "negative",
  "businessName": "exact business name",
  "summary": "1-2 sentence plain English summary of the review profile",
  "redFlags": ["array of specific issues if any"]
}

CRITICAL RULES:
1. approved = true ONLY if rating >= 4.5 AND no serious red flags.
2. approved = false if recent patterns of safety incidents, unlicensed work, fraud, or hostile owner responses.
3. redFlags = [] if no issues. Be objective — this gate protects homeowners.
`

// ── Server-side derived field computation ────────────────────────────────────
// Computes everything Grok doesn't need to — age, costs, warranty, docs, etc.

function computeDerivedFields(parsed: any): any {
  const currentYear = new Date().getFullYear()
  const fuel = (parsed.fuelType || 'unknown').toLowerCase()
  const brand = (parsed.brand || '').toLowerCase()
  const gal = parsed.tankSizeGallons || 0

  // Age from manufactureDate
  let mfgYear = 0
  if (parsed.manufactureDate) {
    mfgYear = parseInt(String(parsed.manufactureDate).replace(/\(.*\)/, '').trim().split('-')[0]) || 0
  }
  const ageYears = mfgYear > 1980 ? Math.max(0, currentYear - mfgYear) : 0

  // Expected lifespan
  let expectedLife = 10
  if (fuel.includes('tankless')) {
    expectedLife = (brand.includes('navien') || brand.includes('rinnai') || brand.includes('noritz')) ? 20 : 18
  } else if (fuel === 'electric') {
    expectedLife = 12
  } else if (fuel === 'heat-pump' || fuel === 'heat_pump') {
    expectedLife = 13
  }
  const remainingLifeYears = Math.max(0, expectedLife - ageYears)

  // Replacement cost
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

  // Warranty
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

  // Product label
  const b = parsed.brand || 'Water Heater'
  const m = parsed.model ? ` ${parsed.model}` : ''
  let pType = `${gal > 0 ? gal + '-Gal ' : ''}Gas Water Heater`
  if (fuel.includes('tankless')) pType = `Tankless ${fuel.includes('electric') ? 'Electric' : 'Gas'} Water Heater`
  else if (fuel === 'heat-pump' || fuel === 'heat_pump') pType = `${gal > 0 ? gal + '-Gal ' : ''}Heat Pump Water Heater`
  else if (fuel === 'electric') pType = `${gal > 0 ? gal + '-Gal ' : ''}Electric Water Heater`

  // Docs (template — Brave enriches URLs after)
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
    priceBreakdown: { unitLow, unitHigh, laborLow, laborHigh, emergencyPremiumLow: emLow, emergencyPremiumHigh: emHigh, nationalChainLow: ncLow, nationalChainHigh: ncHigh },
    docs,
  }
}

// ── JSON extraction ───────────────────────────────────────────────────────────
// Finds the outermost {...} block by counting brackets — handles nested objects.
function extractOutermostJson(text: string): string | null {
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
async function braveSearch(apiKey: string, query: string): Promise<string | null> {
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

// ── Grok API call ─────────────────────────────────────────────────────────────
async function callGrok(
  apiKey: string,
  shot1Base64: string,
  shot2Base64: string | null,
  categoryHint: string | null,
): Promise<Response> {
  const isTwoShot = Boolean(shot2Base64)

  const userContent: any[] = isTwoShot
    ? [
        { type: 'text', text: 'Shot 1 — DATA PLATE LABEL. This is the authoritative data source. Read every character with maximum precision: serial number, model number, brand, manufacture date, warranty info, BTU/wattage, tank capacity in gallons. All key output fields must come from this image.' },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${shot1Base64}`, detail: 'high' } },
        { type: 'text', text: 'Shot 2 — full unit overview for visual verification only. Does this physical unit appear to match the label data from Shot 1? Note condition, rust, or damage. If this image does NOT appear to be a water heater (e.g. it is a paper cup, a person, a random object), describe what it actually is in the shot1Note field.' },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${shot2Base64}`, detail: 'high' } },
      ]
    : [
        { type: 'text', text: 'Analyze this water heater image. Extract all data from the data plate label — serial number, model, brand, manufacture date, warranty, tank size.' },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${shot1Base64}`, detail: 'high' } },
      ]

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 28000)
  try {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'grok-4.20-beta',
        messages: [
          { role: 'system', content: WH_SYSTEM },
          { role: 'user', content: userContent },
        ],
        max_tokens: 500,
        temperature: 0.1,
      }),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    return res
  } catch (err: any) {
    clearTimeout(timeout)
    if (err.name === 'AbortError') throw new Error('Scan timed out — xAI API took too long. Please try again.')
    throw err
  }
}

// ── Review screening Grok call ───────────────────────────────────────────────
async function callGrokReviewScreen(
  apiKey: string,
  businessName: string,
  gbpUrl: string,
  reviewContext: string,
): Promise<Response> {
  return fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'grok-4.20-beta',
      messages: [
        { role: 'system', content: WH_REVIEW_SCREEN },
        {
          role: 'user',
          content: `Business: ${businessName}\nGoogle Business Profile URL: ${gbpUrl}\n\nReview context from Brave Search:\n${reviewContext}`,
        },
      ],
      max_tokens: 800,
      temperature: 0.1,
    }),
  })
}

// ── Request handler ───────────────────────────────────────────────────────────
export const onRequest = async (context: any) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  if (context.request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const formData = await context.request.formData()
    const shot1 = formData.get('image') as string
    const shot2 = formData.get('shot2') as string | null
    const categoryHint = formData.get('category') as string | null
    const mode = formData.get('mode') as string | null
    const serialHint = (formData.get('serialHint') as string | null)?.trim() || null

    // ── Serial cache: skip Grok if we've seen this serial before ──────────────
    if (serialHint && context.env.DB) {
      const cached = await context.env.DB.prepare(
        `SELECT grok_result_json FROM serial_cache WHERE serial_number = ?`
      ).bind(serialHint).first().catch(() => null)

      if (cached?.grok_result_json) {
        context.env.DB.prepare(
          `UPDATE serial_cache SET hit_count = hit_count + 1, last_hit_at = ? WHERE serial_number = ?`
        ).bind(new Date().toISOString(), serialHint).run().catch(() => {})
        return new Response(cached.grok_result_json as string, {
          headers: { 'Content-Type': 'application/json', ...corsHeaders, 'X-Cache': 'HIT' },
        })
      }
    }

    // ── Review screening mode ──
    if (mode === 'review-screen') {
      const gbpUrl = formData.get('gbpUrl') as string | null
      const businessName = formData.get('businessName') as string | null

      if (!gbpUrl || !businessName) {
        return new Response(JSON.stringify({ error: 'gbpUrl and businessName required for review-screen mode' }), {
          status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }

      const grokKey = context.env.GROK_API_KEY
      const braveKey = context.env.BRAVE_API_KEY

      if (!grokKey) {
        return new Response(
          JSON.stringify({ error: 'API key not configured', message: 'GROK_API_KEY is not set.' }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        )
      }

      // Use Brave to fetch review context for this business
      let reviewContext = 'No review data found via search.'
      if (braveKey) {
        const searchQuery = `${businessName} Google reviews rating plumber`
        const braveResult = await braveSearch(braveKey, searchQuery)
        if (braveResult) reviewContext = `Top search result URL: ${braveResult}`
      }

      const screenResponse = await callGrokReviewScreen(grokKey, businessName, gbpUrl, reviewContext)
      if (!screenResponse.ok) {
        return new Response(
          JSON.stringify({ error: 'grok_api_error', message: userFriendlyError(screenResponse.status) }),
          { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        )
      }

      const screenData = await screenResponse.json()
      const screenContent = screenData.choices?.[0]?.message?.content
      if (!screenContent) {
        return new Response(
          JSON.stringify({ error: 'empty_response', message: 'Grok returned empty screening response.' }),
          { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        )
      }

      const rawJson = extractOutermostJson(screenContent)
      if (!rawJson) {
        return new Response(
          JSON.stringify({ error: 'parse_error', message: 'Could not parse screening response.' }),
          { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        )
      }

      try {
        const parsed = JSON.parse(rawJson)
        return new Response(JSON.stringify(parsed), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      } catch {
        return new Response(
          JSON.stringify({ error: 'parse_error', message: 'Could not parse screening JSON.' }),
          { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        )
      }
    }

    // ── Standard scan mode ──
    if (!shot1) {
      return new Response(JSON.stringify({ error: 'No image provided' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const grokKey = context.env.GROK_API_KEY
    if (!grokKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured', message: 'GROK_API_KEY is not set in Cloudflare Pages environment variables.' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    // ── Step 1: Call Grok (single attempt — fast fail) ──
    let grokResponse: Response
    let lastStatus = 0
    try {
      grokResponse = await callGrok(grokKey, shot1, shot2, categoryHint)
      lastStatus = grokResponse.status
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: 'timeout', message: err.message || 'Scan timed out. Please try again.' }),
        { status: 504, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    if (!grokResponse || !grokResponse.ok) {
      const errorBody = await grokResponse?.text().catch(() => '')
      console.error(`Grok API error ${lastStatus}:`, errorBody)
      return new Response(
        JSON.stringify({ error: 'grok_api_error', status: lastStatus, message: userFriendlyError(lastStatus) }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const grokData = await grokResponse.json()
    const grokContent = grokData.choices?.[0]?.message?.content
    if (!grokContent) {
      return new Response(
        JSON.stringify({ error: 'empty_response', message: 'Grok returned an empty response.' }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const rawJson = extractOutermostJson(grokContent)
    if (!rawJson) {
      return new Response(
        JSON.stringify({ error: 'parse_error', message: 'Could not find JSON in response.', raw: grokContent }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    let parsed: any
    try { parsed = JSON.parse(rawJson) }
    catch {
      return new Response(
        JSON.stringify({ error: 'parse_error', message: 'Could not parse JSON.', raw: grokContent }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    if (parsed.error) {
      return new Response(JSON.stringify(parsed), { headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    // ── Step 2: Compute all derived fields server-side ──
    parsed = computeDerivedFields(parsed)

    // ── Step 3: Brave Search — enrich docs with verified URLs ──
    const braveKey = context.env.BRAVE_API_KEY
    if (braveKey && Array.isArray(parsed.docs)) {
      parsed.docs = await Promise.all(
        parsed.docs.slice(0, 5).map(async (doc: any) => {
          if (!doc.searchQuery) return { ...doc, url: null }
          const url = await braveSearch(braveKey, doc.searchQuery)
          return { type: doc.type, label: doc.label, url, searchQuery: doc.searchQuery }
        })
      )
    }

    // ── Step 4: Record scan event for pro dashboard ───────────────────────────
    if (context.env.DB && parsed.ageYears != null) {
      const cf = (context.request as any).cf ?? {}
      const zip = cf.postalCode ?? null
      context.env.DB.prepare(
        `INSERT INTO scan_events (id, zip, brand, age_years, fuel_type, remaining_life_years, scanned_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        crypto.randomUUID(),
        zip,
        parsed.brand ?? null,
        parsed.ageYears ?? null,
        parsed.fuelType ?? null,
        parsed.remainingLifeYears ?? null,
        new Date().toISOString()
      ).run().catch(() => { /* non-critical — don't fail the scan */ })
    }

    const finalJson = JSON.stringify(parsed)

    // ── Write to serial cache for future scans ────────────────────────────────
    if (context.env.DB && parsed.serialNumber) {
      context.env.DB.prepare(`
        INSERT INTO serial_cache (serial_number, grok_result_json, brand, hit_count, created_at, last_hit_at)
        VALUES (?, ?, ?, 1, ?, ?)
        ON CONFLICT(serial_number) DO UPDATE SET
          grok_result_json = excluded.grok_result_json,
          last_hit_at = excluded.last_hit_at
      `).bind(
        parsed.serialNumber,
        finalJson,
        parsed.brand || null,
        new Date().toISOString(),
        new Date().toISOString()
      ).run().catch(() => {})
    }

    return new Response(finalJson, {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })

  } catch (error: any) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'internal_error', message: error.message || 'An unexpected error occurred.' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }
}
