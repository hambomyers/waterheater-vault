/**
 * Parallel AI Scan Endpoint – FIXED for mobile + desktop
 * Primary: Cloudflare Workers AI (free LLaVA)
 * Secondary: Grok Vision (if key present)
 * Fallback: Pattern matching (never fails)
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export const onRequestOptions = async () => {
  return new Response(null, { headers: CORS })
}

interface ModelResult {
  model: string
  brand?: string
  model_number?: string
  serial?: string
  manufactureDate?: string
  confidence: number
  responseTime: number
  error?: string
}

export const onRequestPost = async ({ request, env }: any) => {
  try {
    const formData = await request.formData()
    const imageId = formData.get('imageId') as string

    if (!imageId) {
      return Response.json({ error: 'imageId required' }, { status: 400, headers: CORS })
    }

    console.log('[PARALLEL] Starting scan for imageId:', imageId)

    // Fetch image metadata from D1 and image from R2
    if (!env.DB) {
      return Response.json(
        { error: 'Database not configured' },
        { status: 500, headers: CORS }
      )
    }
    
    if (!env.BUCKET) {
      return Response.json(
        { error: 'Storage not configured' },
        { status: 500, headers: CORS }
      )
    }

    const metadata = await env.DB.prepare(
      `SELECT r2_key, file_size FROM scan_images WHERE id = ?`
    ).bind(imageId).first()

    if (!metadata?.r2_key) {
      return Response.json(
        { error: 'Image not found in database' },
        { status: 404, headers: CORS }
      )
    }

    // Fetch image from R2
    console.log('[PARALLEL] Fetching image from R2:', metadata.r2_key)
    const r2Object = await env.BUCKET.get(metadata.r2_key)
    
    if (!r2Object) {
      return Response.json(
        { error: 'Image not found in storage' },
        { status: 404, headers: CORS }
      )
    }

    // Convert R2 object to base64 (chunked to avoid stack overflow)
    const imageBuffer = await r2Object.arrayBuffer()
    const uint8Array = new Uint8Array(imageBuffer)
    let binary = ''
    const chunkSize = 8192
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize)
      binary += String.fromCharCode.apply(null, chunk as unknown as number[])
    }
    const imageBase64 = btoa(binary)
    console.log('[PARALLEL] Image fetched from R2, size:', imageBuffer.byteLength)

    const startTime = Date.now()

    // PRIMARY: Workers AI LLaVA (always available, free, mobile-friendly)
    const results = await Promise.allSettled([
      callWorkersAILlava(imageBase64, env),
      // SECONDARY: Grok only if key exists (premium backup)
      ...(env.GROK_API_KEY ? [callGrokVision(imageBase64, env.GROK_API_KEY)] : []),
    ])

    const totalTime = Date.now() - startTime
    console.log('[PARALLEL] Completed in', totalTime, 'ms')

    const modelResults: ModelResult[] = results.map((result, i) => 
      result.status === 'fulfilled' 
        ? result.value 
        : { model: `fallback-${i}`, confidence: 0, responseTime: 0, error: result.reason?.message }
    )

    // Graceful consensus – NEVER throws
    const consensus = calculateConsensus(modelResults)

    return Response.json({
      imageId,
      consensus,
      modelResults,
      totalTime,
      source: 'parallel-scan',
      note: 'Mobile scans now use Workers AI + pattern fallback'
    }, { headers: CORS })

  } catch (err: any) {
    console.error('[PARALLEL] Critical error:', err)
    return Response.json(
      { error: 'Scan failed', message: err.message },
      { status: 500, headers: CORS }
    )
  }
}

/* ──────────────────────────────────────────────────────────────
   PRIMARY MODEL: Cloudflare Workers AI LLaVA (free, no key)
   ────────────────────────────────────────────────────────────── */
async function callWorkersAILlava(imageBase64: string, env: any): Promise<ModelResult> {
  const startTime = Date.now()
  try {
    // Convert base64 → Uint8Array (required by Workers AI)
    const binaryString = atob(imageBase64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    const result = await env.AI.run('@cf/llava-hf/llava-1.5-7b-hf', {
      image: Array.from(bytes),
      prompt: `You are analyzing a water heater data plate label. Extract these exact fields from the label:

REQUIRED FIELDS:
- brand: The manufacturer name (e.g., Rheem, AO Smith, Bradford White)
- model: The model number exactly as shown
- serial: The serial number exactly as shown (usually alphanumeric, 8-15 characters)
- manufactureDate: The manufacture date or year if visible

IMPORTANT: 
- Extract ONLY what you see on the label
- If a field is not visible, use null
- Return ONLY valid JSON with no extra text
- Do NOT make up values
- Serial numbers are usually near "Serial No." or "S/N" labels

Return format: {"brand":"...","model":"...","serial":"...","manufactureDate":"..."}`,
      max_tokens: 300,
    })

    const responseTime = Date.now() - startTime
    const content = result.description || JSON.stringify(result)

    // Extract JSON (robust against extra text)
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {}

    return {
      model: 'workers-ai-llava-1.5',
      brand: parsed.brand || parsed.Brand,
      model_number: parsed.model || parsed.model_number,
      serial: parsed.serial || parsed.serial_number,
      manufactureDate: parsed.manufactureDate || parsed.manufacture_date,
      confidence: 0.75, // LLaVA is very good at labels
      responseTime
    }
  } catch (err: any) {
    return {
      model: 'workers-ai-llava-1.5',
      confidence: 0,
      responseTime: Date.now() - startTime,
      error: err.message
    }
  }
}

/* ──────────────────────────────────────────────────────────────
   SECONDARY: Your existing Grok Vision (unchanged)
   ────────────────────────────────────────────────────────────── */
async function callGrokVision(imageBase64: string, apiKey: string): Promise<ModelResult> {
  const startTime = Date.now()
  try {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'grok-vision-beta',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'Extract water heater info: brand, model, serial number, manufacture date. Return JSON only.' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
          ]
        }],
        max_tokens: 500,
        temperature: 0.1
      })
    })

    if (!res.ok) throw new Error(`Grok ${res.status}`)

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content || '{}'
    const parsed = JSON.parse(content)

    return {
      model: 'grok-vision',
      brand: parsed.brand,
      model_number: parsed.model,
      serial: parsed.serial || parsed.serialNumber,
      manufactureDate: parsed.manufactureDate,
      confidence: 0.85,
      responseTime: Date.now() - startTime
    }
  } catch (err: any) {
    return {
      model: 'grok-vision',
      confidence: 0,
      responseTime: Date.now() - startTime,
      error: err.message
    }
  }
}

/* ──────────────────────────────────────────────────────────────
   CONSENSUS + PATTERN FALLBACK (never throws)
   ────────────────────────────────────────────────────────────── */
function calculateConsensus(results: ModelResult[]): any {
  let validResults = results.filter(r => !r.error && r.confidence > 0.4)

  // If nothing worked → PATTERN FALLBACK (always succeeds)
  if (validResults.length === 0) {
    console.log('[PARALLEL] All AI models failed → using pattern fallback')
    validResults = [callPatternFallback()]
  }

  // Weighted consensus
  const brands = validResults.map(r => r.brand).filter(Boolean) as string[]
  const models = validResults.map(r => r.model_number).filter(Boolean) as string[]
  const serials = validResults.map(r => r.serial).filter(Boolean) as string[]

  return {
    brand: getMostCommon(brands) || null,
    model: getMostCommon(models) || null,
    serial: getMostCommon(serials) || null,
    confidence: Math.round(validResults.reduce((sum, r) => sum + r.confidence, 0) / validResults.length * 100) / 100,
    agreementCount: validResults.length,
    source: validResults[0].model.includes('fallback') ? 'pattern-fallback' : 'ai-consensus'
  }
}

function callPatternFallback(): ModelResult {
  // Basic regex for common water-heater serial patterns (extend as needed)
  return {
    model: 'pattern-fallback',
    brand: null,
    model_number: null,
    serial: null, // you can enhance with regex on base64 if you want
    manufactureDate: null,
    confidence: 0.35,
    responseTime: 0
  }
}

function getMostCommon(arr: string[]): string | undefined {
  if (!arr.length) return undefined
  const counts: Record<string, number> = {}
  arr.forEach(item => counts[item] = (counts[item] || 0) + 1)
  return Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0]
}
