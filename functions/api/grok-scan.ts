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

// ── System prompts ────────────────────────────────────────────────────────────

const DOCS_PROMPT = `
After extracting product details, determine what official documentation realistically exists for this specific product.
Return a "docs" array. Each entry must have:
  - "type": one of "ownerManual" | "warrantyTerms" | "supportPage" | "installationManual" | "quickStart" | "serviceManual" | "serialDecoder"
  - "label": human-readable name (e.g. "Owner Manual", "Serial Date Decoder")
  - "searchQuery": a precise web search query to find the official document or page

Only include types that genuinely apply. Examples:
  Laptop: ownerManual, warrantyTerms, supportPage
  Dishwasher: ownerManual, installationManual, warrantyTerms, supportPage
  Water heater / furnace / HVAC / boiler: ownerManual, installationManual, warrantyTerms, serialDecoder
  USB cable: omit docs entirely or return empty array

For "serialDecoder": use searchQuery "[Brand] serial number manufacture date decoder"
  Water heaters, HVAC, furnaces, and boilers almost always need this — their manufacture dates
  are encoded in the serial number using brand-specific letter/number tables.

Good searchQuery examples:
  "Apple MacBook Pro 14-inch M3 user guide PDF site:support.apple.com"
  "Bradford White water heater serial number manufacture date decoder"
  "Carrier HVAC serial number year decoder"
  "LG LRFXS2503S refrigerator installation guide site:lg.com"
`

const VALUATION_RULES = `
VALUATION RULES (currentValue is REQUIRED — never return null or 0):
- Use current used-market prices as your reference (eBay sold listings, Amazon used, Back Market).
- If you know the brand and rough category but not exact model: estimate by category and age.
- If you cannot identify the product at all: return 1 as a placeholder, not null.
- Laptop examples: budget $80-200, mid-range $200-600, premium $600-1800
- Smartphone examples: budget $50-150, mid $150-400, flagship $400-900
- TV examples: 43" budget $80-200, 55" mid $200-500, 65" OLED $600-1400
- Appliance examples: small $20-80, medium $100-300, large $300-800
- Always provide a specific integer or decimal, never null, never 0 unless the item is genuinely worthless.`

const SINGLE_SHOT_SYSTEM = `You are a precise warranty and product data extraction assistant.
Analyze this product, receipt, or warranty image carefully.

Return ONLY a single valid JSON object. No markdown, no text before or after. Use null for unknown string fields:
{
  "product": "full product name",
  "brand": "manufacturer or brand",
  "model": "model number or null",
  "serialNumber": "serial number if visible, or null",
  "manufactureDate": "manufacture date as YYYY-MM or YYYY-MM-DD if visible on label, or null",
  "purchaseDate": "YYYY-MM-DD or null",
  "warranty": "warranty period e.g. '2 years', or null",
  "price": "$XX.XX or null",
  "condition": "new|like-new|good|fair|poor",
  "category": "one of: appliance|vehicle|watch|whisky|wine|collectible|instrument|electronics|tool|other",
  "customFields": {
    // Include ONLY fields meaningful for this category. Omit or return {} for generic electronics/appliances.
    // watch:       { "reference": "...", "movement": "...", "complication": "..." }
    // whisky/wine: { "distillery": "...", "ageStatement": "...", "caskType": "...", "vintage": "..." }
    // collectible: { "grade": "...", "gradingCompany": "PSA|BGS|CGC", "population": "...", "year": "..." }
    // vehicle:     { "vin": "...", "trim": "...", "mileage": "..." }
    // instrument:  { "year": "...", "finish": "...", "country": "..." }
  },
  "currentValue": current used-market value in USD as a number (REQUIRED — see rules below),
  "originalPrice": original retail price as number or null,
  "depreciationRate": depreciation as decimal 0.0-1.0 or null,
  "marketTrend": "up|down|stable",
  "confidence": overall extraction confidence 0.0-1.0,
  "docs": [
    { "type": "ownerManual", "label": "Owner Manual", "searchQuery": "Brand Model owner manual PDF site:brand.com" }
  ]
}
MANUFACTURE DATE RULES:
1. First look for explicit label text: "MFG DATE", "DATE MFG", "DOM", "MFD", "MFG.", "FABR", "PROD DATE", "DATE CODE", "MANUF", "DATE OF MFG", "MANUFACTURED".
2. If not found as label text, examine the serialNumber you extracted. Many manufacturers encode the manufacture date in their serial format — use your training knowledge of brand-specific serial encodings to decode it (e.g. Samsung appliances encode year in position 5 as a letter, LG in position 2, Whirlpool in positions 3-4, etc.).
3. If you decode a date from the serial, return it as "YYYY-MM (from serial)" so the user knows it was inferred.
4. If genuinely not determinable: return null. Do not guess.
${VALUATION_RULES}
${DOCS_PROMPT}
If not a product/warranty/receipt image: { "error": "not_a_product", "message": "brief description" }`

const TWO_SHOT_SYSTEM = `You are a precise warranty data extraction assistant.
Two images with DIFFERENT roles:
- Shot 1 = wide overview. Look ONLY at the physical shape, form, and object type. IGNORE all text, screens, labels, papers. Use it for category and brand context from the object's appearance.
- Shot 2 = close-up of serial/model label. Authoritative for ALL text: serial, model, warranty, purchase date. Focus ONLY on reading the characters and numbers on the label.

Return ONLY a single valid JSON object. No markdown, no text before or after. Use null for unknown string fields:
{
  "product": "full product name",
  "brand": "manufacturer or brand",
  "model": "model number or null",
  "serialNumber": "serial number",
  "manufactureDate": "manufacture date as YYYY-MM or YYYY-MM-DD if visible on label, or null",
  "purchaseDate": "YYYY-MM-DD or null",
  "warranty": "warranty period e.g. '2 years', or null",
  "price": "$XX.XX or null",
  "condition": "new|like-new|good|fair|poor",
  "category": "one of: appliance|vehicle|watch|whisky|wine|collectible|instrument|electronics|tool|other",
  "customFields": {
    // Include ONLY fields meaningful for this category. Omit or return {} for generic electronics/appliances.
    // watch:       { "reference": "...", "movement": "...", "complication": "..." }
    // whisky/wine: { "distillery": "...", "ageStatement": "...", "caskType": "...", "vintage": "..." }
    // collectible: { "grade": "...", "gradingCompany": "PSA|BGS|CGC", "population": "...", "year": "..." }
    // vehicle:     { "vin": "...", "trim": "...", "mileage": "..." }
    // instrument:  { "year": "...", "finish": "...", "country": "..." }
  },
  "currentValue": current used-market value in USD as a number (REQUIRED — see rules below),
  "originalPrice": original retail price as number or null,
  "depreciationRate": depreciation as decimal 0.0-1.0 or null,
  "marketTrend": "up|down|stable",
  "confidence": overall extraction confidence 0.0-1.0,
  "docs": [
    { "type": "ownerManual", "label": "Owner Manual", "searchQuery": "Brand Model owner manual PDF site:brand.com" }
  ]
}
MANUFACTURE DATE RULES:
1. First look for explicit label text: "MFG DATE", "DATE MFG", "DOM", "MFD", "MFG.", "FABR", "PROD DATE", "DATE CODE", "MANUF", "DATE OF MFG", "MANUFACTURED".
2. If not found as label text, examine the serialNumber you extracted. Many manufacturers encode the manufacture date in their serial format — use your training knowledge of brand-specific serial encodings to decode it (e.g. Samsung appliances encode year in position 5 as a letter, LG in position 2, Whirlpool in positions 3-4, etc.).
3. If you decode a date from the serial, return it as "YYYY-MM (from serial)" so the user knows it was inferred.
4. If genuinely not determinable: return null. Do not guess.
${VALUATION_RULES}
${DOCS_PROMPT}`

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
  const systemPrompt = isTwoShot ? TWO_SHOT_SYSTEM : SINGLE_SHOT_SYSTEM

  const userContent: any[] = isTwoShot
    ? [
        { type: 'text', text: `Shot 1 — overview. Look at SHAPE and FORM only, ignore text. Category hint: ${categoryHint || 'unknown'}. What object is this?` },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${shot1Base64}`, detail: 'high' } },
        { type: 'text', text: 'Shot 2 — close-up of serial/model label. Read ONLY the characters and numbers. Extract serial, model, warranty, purchase date from this label.' },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${shot2Base64}`, detail: 'high' } },
      ]
    : [
        { type: 'text', text: 'Extract all warranty and product data from this image.' },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${shot1Base64}`, detail: 'high' } },
      ]

  return fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'grok-4.20-beta',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      max_tokens: 2000,
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

    // ── Identify mode — lightweight category detection for Shot 1 guide screen ──
    // Cheap: 100 tokens max. SHAPE ONLY — ignore all text (screens, labels, papers).
    if (mode === 'identify') {
      const identifySystem = `Look ONLY at the physical shape, form, and silhouette of the object. IGNORE all text, labels, screens, papers, documents, and on-screen content. Identify what TYPE of product this is by its physical appearance.
Return ONLY valid JSON with exactly these fields:
{"category":"appliance|vehicle|watch|electronics|instrument|whisky|wine|collectible|tool|other","brand":"brand name or null","product":"2-3 word description"}
No markdown. No other fields.`
      const res = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${grokKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'grok-4.20-beta',
          messages: [
            { role: 'system', content: identifySystem },
            { role: 'user', content: [
              { type: 'text', text: 'Identify by shape and form only — ignore any text. What physical object is this?' },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${shot1}`, detail: 'low' } },
            ]},
          ],
          max_tokens: 100,
          temperature: 0.1,
        }),
      })
      if (!res.ok) return new Response('{}', { headers: { 'Content-Type': 'application/json', ...corsHeaders } })
      const d = await res.json()
      const content = d.choices?.[0]?.message?.content || '{}'
      const raw = extractOutermostJson(content)
      return new Response(raw || '{}', { headers: { 'Content-Type': 'application/json', ...corsHeaders } })
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

    if (parsed.error) {
      return new Response(JSON.stringify(parsed), { headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    // ── Step 2: Brave Search — enrich each doc with a verified URL ──
    const braveKey = context.env.BRAVE_API_KEY
    const rawDocs: any[] = Array.isArray(parsed.docs) ? parsed.docs : []

    if (braveKey && rawDocs.length > 0) {
      const enriched = await Promise.all(
        rawDocs.slice(0, 4).map(async (doc: any) => {
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

    return new Response(JSON.stringify(parsed), {
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
