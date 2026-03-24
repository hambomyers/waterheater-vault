import { computeDerivedFields, extractOutermostJson, braveSearch, learnFromScan, WH_SYSTEM } from './_utils/wh-compute'

function userFriendlyError(status: number): string {
  switch (status) {
    case 401: return 'Invalid API key. Check GROK_API_KEY in Cloudflare Pages settings.'
    case 429: return 'Rate limit reached. Please wait a moment and try again.'
    case 404: return 'Grok model not found.'
    case 413: return 'Image too large. Try a lower-resolution photo.'
    default:  return `Grok API error (${status}). Please try again.`
  }
}

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


// ── Grok API call ─────────────────────────────────────────────────────────────
async function callGrok(
  apiKey: string,
  shot1Base64: string,
  shot2Base64: string | null,
  categoryHint: string | null,
): Promise<string> {
  const isTwoShot = Boolean(shot2Base64)

  const userContent: any[] = isTwoShot
    ? [
        { type: 'text', text: 'Shot 1 — DATA PLATE LABEL. This is the authoritative data source. Read every character with maximum precision: serial number, model number, brand, manufacture date, warranty info, BTU/wattage, tank capacity in gallons. All key output fields must come from this image.' },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${shot1Base64}`, detail: 'auto' } },
        { type: 'text', text: 'Shot 2 — full unit overview for visual verification only. Does this physical unit appear to match the label data from Shot 1? Note condition, rust, or damage. If this image does NOT appear to be a water heater (e.g. it is a paper cup, a person, a random object), describe what it actually is in the shot1Note field.' },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${shot2Base64}`, detail: 'auto' } },
      ]
    : [
        { type: 'text', text: 'This is a water heater or tankless water heater / combi-boiler data plate label. Extract every readable field: brand, model number, serial number, manufacture date, tank size or tankless indicator, fuel type.' },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${shot1Base64}`, detail: 'auto' } },
      ]

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 28000)
  try {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'grok-2-vision-1212',
        messages: [
          { role: 'system', content: WH_SYSTEM },
          { role: 'user', content: userContent },
        ],
        max_tokens: 300,
        temperature: 0.1,
        stream: true,
      }),
      signal: controller.signal,
    })

    if (!res.ok) {
      clearTimeout(timeout)
      const errStatus = res.status
      throw Object.assign(new Error(userFriendlyError(errStatus)), { status: errStatus })
    }

    // Read SSE stream — bytes flow after ~4s, defeating the CF 30s wall-clock timeout
    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let content = ''
    let buffer = ''

    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') break
        try {
          const chunk = JSON.parse(data)
          const delta = chunk.choices?.[0]?.delta?.content
          if (delta) content += delta
        } catch { /* partial SSE chunk — ignore */ }
      }
    }

    clearTimeout(timeout)
    return content
  } catch (err: any) {
    clearTimeout(timeout)
    if (err.name === 'AbortError') throw new Error('Scan timed out — please try again.')
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

    // ── Step 1: Call Grok (streaming — bytes flow immediately, prevents CF 504) ──
    let grokContent: string
    try {
      grokContent = await callGrok(grokKey, shot1, shot2, categoryHint)
    } catch (err: any) {
      const httpStatus = (err as any).status
      return new Response(
        JSON.stringify({ error: 'api_error', message: err.message || 'Scan timed out. Please try again.' }),
        { status: httpStatus === 401 || httpStatus === 429 || httpStatus === 404 ? 502 : 504,
          headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

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

    // ── Level 1: clearly not a water heater ──────────────────────────────────
    const hasAnyData = (parsed.brand && parsed.brand !== 'Unknown' && parsed.brand !== 'other')
      || parsed.serialNumber
      || parsed.model
    if (!hasAnyData && (parsed.confidence ?? 1) < 0.25) {
      const jokes = [
        "That looks like it could be a lot of things — but not a water heater label 😄 Point at the silver data plate sticker on the side of your unit!",
        "We think you got distracted 🙂 Your water heater is waiting patiently — find that silver label on the tank and snap it!",
        "Nice photo, wrong appliance 😄 The silver data plate is on the side or front of your water heater — give it another shot!",
        "Your water heater called and it feels left out 😅 Photograph the silver sticker on the side of the unit!",
        "That's not a water heater — but we like the confidence 😄 Find the metal label on your tank and try again!",
      ]
      const msg = jokes[Math.floor(Math.random() * jokes.length)]
      return new Response(
        JSON.stringify({ error: 'not_a_water_heater', message: msg }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    // ── Level 2: looks like WH but serial + model both missing ───────────────
    const hasBrand = parsed.brand && parsed.brand !== 'Unknown' && parsed.brand !== 'other'
    if (hasBrand && !parsed.serialNumber && !parsed.model) {
      const nudges = [
        `Looks like a ${parsed.brand} — but we need to see the serial number and model. Move a little closer to the data plate and try again 📸`,
        `We see ${parsed.brand} but can't read the label clearly. Get a bit closer to the silver sticker — model and serial should be visible 🙂`,
        `Almost! We spotted ${parsed.brand} but the serial and model aren't readable. Inch closer to the data plate for a sharper shot!`,
      ]
      const msg = nudges[Math.floor(Math.random() * nudges.length)]
      return new Response(
        JSON.stringify({ error: 'not_a_water_heater', message: msg }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
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

    // ── Learn from this scan ──────────────────────────────────────────────────
    learnFromScan(context.env.DB, parsed).catch(() => {})

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
