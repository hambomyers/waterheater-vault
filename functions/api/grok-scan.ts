const MAX_RETRIES = 2

function userFriendlyError(status: number): string {
  switch (status) {
    case 401: return 'Invalid API key. Check GROK_API_KEY in Cloudflare Pages settings.'
    case 429: return 'Rate limit reached. Please wait a moment and try again.'
    case 404: return 'Grok model not found. The model name may have changed — check xAI docs.'
    case 413: return 'Image too large. Please use a smaller photo (under 20MB).'
    default:  return `Grok API error (${status}). Please try again.`
  }
}

// ── Water Heater System Prompts ───────────────────────────────────────────────

const WH_SERIAL_DECODERS = `
BRAND SERIAL NUMBER DECODE RULES (use to determine manufactureDate from serialNumber):
- Rheem / Ruud: positions 1-4 = week+year e.g. "0115" = Jan 2015. Or "F15" = June 2015 (A=Jan…L=Dec).
- AO Smith / American / State / Reliance / Whirlpool WH: 2-digit year + 2-digit week in positions 1-4, e.g. "1506" = 2015 week 6.
- Bradford White: position 1 = decade code (A=00s,B=10s,C=20s), position 2 = year within decade (A=0,B=1…J=9), position 3 = month (A=Jan…L=Dec). e.g. "BEF..." = 2014 June.
- Navien: "YY" + "WW" encoded in first 4 chars. e.g. "2312" = 2023 week 12.
- Rinnai: 4-digit year+month in first 4 chars e.g. "2308" = Aug 2023.
- GE / GE Appliances: letter-number-letter format, year = position 2 (A=2001, B=2002…).
- Kenmore (Sears): first 3 digits are factory code; date encoded varies — use brand-specific decoder.
- Lochinvar / Weil-McLain: first 2 digits = year, next 2 = week.
- If serial is ambiguous: return your best YYYY-MM estimate with note "(from serial — verify)".
`

const WH_LIFESPAN_RULES = `
LIFESPAN + REPLACEMENT COST RULES:
- Gas tank water heater: typical lifespan 8–12 years. Use 10 as midpoint.
- Electric tank water heater: typical lifespan 10–15 years. Use 12 as midpoint.
- Tankless (gas or electric): typical lifespan 15–20 years. Use 18 as midpoint.
- Heat pump water heater: typical lifespan 10–15 years. Use 13 as midpoint.
- remainingLifeYears = max(0, expectedLifespan - ageYears). Adjust down if unit shows signs of age/corrosion.
- estimatedReplacementCost:
    Gas tank 30-50 gal: $900–$1,400 installed
    Gas tank 50-75 gal: $1,100–$1,800 installed
    Electric tank: $700–$1,200 installed
    Tankless gas: $1,500–$2,500 installed
    Tankless electric: $800–$1,500 installed
    Heat pump: $1,200–$2,000 installed
  Use the midpoint of the applicable range.
`

const WH_WARRANTY_GUIDE = `
COMMON WATER HEATER WARRANTY PERIODS (use if label is unclear):
- Rheem Professional / Marathon: 6-year or 10-year tank warranty
- Bradford White: 6-year residential tank, 1-year parts
- AO Smith Signature: 6-year or 12-year depending on model
- Navien / Rinnai tankless: 12–15 year heat exchanger, 5-year parts
- State Select: 6-year tank, 1-year parts
- Kenmore: 6-year tank
Return the warranty string exactly as printed on the label if visible. Otherwise use the above guide.
`

const WH_DOCS_INSTRUCTIONS = `
Always return a "docs" array. For water heaters, ALWAYS include ALL of:
1. { "type": "serialDecoder", "label": "Serial Date Decoder", "searchQuery": "[Brand] water heater serial number manufacture date decoder" }
2. { "type": "ownerManual", "label": "Owner Manual", "searchQuery": "[Brand] [Model] water heater owner manual PDF" }
3. { "type": "warrantyTerms", "label": "Warranty Terms", "searchQuery": "[Brand] water heater warranty terms [Model]" }
4. { "type": "recallCheck", "label": "CPSC Recall Check", "searchQuery": "[Brand] [Model] water heater CPSC recall site:cpsc.gov" }
5. { "type": "utilityRebate", "label": "Utility Rebate Programs", "searchQuery": "water heater utility rebate [fuelType] [zip] DSIRE energystar" }
Replace [Brand], [Model], [fuelType], and [zip] with actual detected/inferred values.
`

// ── Pro Review Screening Prompt ───────────────────────────────────────────────

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
  "redFlags": ["array of specific issues if any — e.g. 'Multiple recent 1-star reviews about no-shows', 'Owner responds aggressively to complaints'"]
}

CRITICAL RULES:
1. approved = true ONLY if rating >= 4.5 AND no serious red flags (safety complaints, fraud, aggressive behavior).
2. Even with 4.5+ stars, approved = false if there are recent patterns of: safety incidents, unlicensed work claims, fraud allegations, or hostile owner responses.
3. redFlags array must be empty [] if there are no issues.
4. Be objective. This gate protects homeowners.
`

const WH_SYSTEM = `You are WaterHeaterVault's expert AI — the world's best water heater identification and analysis engine.
You ONLY analyze water heaters. You know every major brand's serial number encoding system by heart.

${WH_SERIAL_DECODERS}

${WH_LIFESPAN_RULES}

${WH_WARRANTY_GUIDE}

Return ONLY a single valid JSON object. No markdown, no text before or after:
{
  "product": "Water Heater (e.g. 'Rheem 40-Gal Gas Water Heater')",
  "brand": "exact brand name (Rheem|AO Smith|Bradford White|GE|Navien|Rinnai|State|Reliance|American|Kenmore|Whirlpool|Lochinvar|Noritz|Bosch|Weil-McLain|other)",
  "model": "model number from label or null",
  "serialNumber": "full serial number exactly as printed",
  "manufactureDate": "YYYY-MM decoded from serial or label — REQUIRED, use decoder rules above",
  "tankSizeGallons": tank capacity as integer (e.g. 40, 50, 75) or null if tankless,
  "fuelType": "gas|electric|tankless|unknown",
  "ageYears": calculated as (current year - manufacture year) as number,
  "remainingLifeYears": calculated remaining life as number (see lifespan rules),
  "estimatedReplacementCost": estimated installed replacement cost in USD as integer (see cost rules),
  "currentWarranty": "warranty as printed on label or inferred from brand guide",
  "confidence": overall extraction confidence 0.0-1.0,
  "shot1Note": "optional — only populate if Shot 2 (overview) does not match label data or is not a water heater. E.g. 'Shot 2 appears to be a paper cup, not a water heater.' or 'Unit appears heavily corroded — may affect remaining life estimate.' Leave null if no issues.",
  "priceBreakdown": {
    "unitLow": low end unit-only cost in USD (e.g. 700),
    "unitHigh": high end unit-only cost in USD (e.g. 1400),
    "laborLow": low end labor+permits in USD (e.g. 400),
    "laborHigh": high end labor+permits in USD (e.g. 800),
    "emergencyPremiumLow": low end emergency surcharge in USD (e.g. 400),
    "emergencyPremiumHigh": high end emergency surcharge in USD (e.g. 700),
    "nationalChainLow": low end national chain (Home Depot Install / Roto-Rooter) total in USD (e.g. 2200),
    "nationalChainHigh": high end national chain total in USD (e.g. 3400)
  },
  "docs": [ ... always 4 entries per docs instructions above ... ]
}

CRITICAL RULES:
1. manufactureDate is REQUIRED — always decode from serial using brand rules above. Never return null if you have a serial number.
2. ageYears and remainingLifeYears are REQUIRED — always calculate them.
3. estimatedReplacementCost is REQUIRED — always return a realistic integer.
4. In two-shot mode: Shot 1 (label) is AUTHORITATIVE. Shot 2 (overview) is verification only — never override label data with overview guesses.
5. If Shot 1 (label) shows something other than a water heater data plate: { "error": "not_a_water_heater", "message": "This appears to be a [X], not a water heater data plate." }
6. If Shot 2 (overview) doesn't match the label — paper cup, wrong object, etc. — extract normally from Shot 1 and put the observation in shot1Note. Never fail the scan because of a bad Shot 2.

${WH_DOCS_INSTRUCTIONS}`

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

  return fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'grok-4.20-beta',
      messages: [
        { role: 'system', content: WH_SYSTEM },
        { role: 'user', content: userContent },
      ],
      max_tokens: 2000,
      temperature: 0.1,
    }),
  })
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

    // ── Step 1: Call Grok ──
    let grokResponse: Response | null = null
    let lastStatus = 0
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      grokResponse = await callGrok(grokKey, shot1, shot2, categoryHint)
      lastStatus = grokResponse.status
      if (grokResponse.status === 429 && attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1500 * attempt))
        continue
      }
      break
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

    if (parsed.error === 'not_a_water_heater' || parsed.error) {
      return new Response(JSON.stringify(parsed), { headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    // ── Step 2: Brave Search — enrich each doc with a verified URL ──
    const braveKey = context.env.BRAVE_API_KEY
    const rawDocs: any[] = Array.isArray(parsed.docs) ? parsed.docs : []

    if (braveKey && rawDocs.length > 0) {
      const enriched = await Promise.all(
        rawDocs.slice(0, 5).map(async (doc: any) => {
          if (!doc.searchQuery) return { ...doc, url: null }
          const url = await braveSearch(braveKey, doc.searchQuery)
          return { type: doc.type, label: doc.label, url, searchQuery: doc.searchQuery }
        })
      )
      parsed.docs = enriched
    } else {
      // No Brave key or no docs — keep stubs with null URLs so frontend can show Google fallback
      parsed.docs = rawDocs.map((doc: any) => ({
        type: doc.type,
        label: doc.label,
        url: null,
        searchQuery: doc.searchQuery,
      }))
    }

    // ── Step 3: Record scan event for pro dashboard ──────────────────────────
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
