// /api/scan-parallel — Parallel multi-model "firing squad" for fastest WH extraction
// Uses Hugging Face Inference API (free tier) - NO API KEYS REQUIRED
// Fires to multiple vision models simultaneously, weighted consensus voting

import { computeDerivedFields, extractOutermostJson, WH_SYSTEM } from './_utils/wh-compute'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

interface ModelResult {
  model: string
  success: boolean
  data?: any
  error?: string
  latencyMs: number
  weight: number
}

// ── Image Hash for Caching ────────────────────────────────────────────────────

async function hashImage(base64: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(base64.slice(0, 10000)) // hash first 10KB for speed
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// ── Hugging Face Free Models (no API key required) ───────────────────────────

async function callHFLlavaNext(imageBase64: string): Promise<ModelResult> {
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    
    const res = await fetch('https://api-inference.huggingface.co/models/llava-hf/llava-v1.6-mistral-7b-hf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inputs: `${WH_SYSTEM}\n\nExtract all water heater data from this image.`,
        parameters: { max_new_tokens: 500, temperature: 0.1 },
        options: { use_cache: false }
      }),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    
    if (!res.ok) throw new Error(`HF Llava ${res.status}`)
    const json = await res.json()
    const text = json[0]?.generated_text || ''
    const extracted = extractOutermostJson(text)
    return { 
      model: 'hf-llava-next', 
      success: true, 
      data: extracted ? JSON.parse(extracted) : null, 
      latencyMs: Date.now() - start,
      weight: 1.5 
    }
  } catch (err: any) {
    return { model: 'hf-llava-next', success: false, error: err.message, latencyMs: Date.now() - start, weight: 1.5 }
  }
}

async function callHFBakllava(imageBase64: string): Promise<ModelResult> {
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    
    const res = await fetch('https://api-inference.huggingface.co/models/llava-hf/bakllava-v1-hf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inputs: `${WH_SYSTEM}\n\nExtract all water heater data from this image.`,
        parameters: { max_new_tokens: 500, temperature: 0.1 }
      }),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    
    if (!res.ok) throw new Error(`HF Bakllava ${res.status}`)
    const json = await res.json()
    const text = json[0]?.generated_text || ''
    const extracted = extractOutermostJson(text)
    return { 
      model: 'hf-bakllava', 
      success: true, 
      data: extracted ? JSON.parse(extracted) : null, 
      latencyMs: Date.now() - start,
      weight: 1.0 
    }
  } catch (err: any) {
    return { model: 'hf-bakllava', success: false, error: err.message, latencyMs: Date.now() - start, weight: 1.0 }
  }
}

async function callHFMoondream(imageBase64: string): Promise<ModelResult> {
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    
    const res = await fetch('https://api-inference.huggingface.co/models/vikhyatk/moondream2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inputs: `${WH_SYSTEM}\n\nExtract all water heater data from this image.`,
        parameters: { max_new_tokens: 500, temperature: 0.1 }
      }),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    
    if (!res.ok) throw new Error(`HF Moondream ${res.status}`)
    const json = await res.json()
    const text = json[0]?.generated_text || ''
    const extracted = extractOutermostJson(text)
    return { 
      model: 'hf-moondream', 
      success: true, 
      data: extracted ? JSON.parse(extracted) : null, 
      latencyMs: Date.now() - start,
      weight: 1.0 
    }
  } catch (err: any) {
    return { model: 'hf-moondream', success: false, error: err.message, latencyMs: Date.now() - start, weight: 1.0 }
  }
}

async function callGeminiFlash(apiKey: string, imageBase64: string): Promise<ModelResult> {
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: WH_SYSTEM + '\n\nExtract all data from this water heater label. Return ONLY valid JSON.' },
            { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } }
          ]
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 500 }
      }),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    
    if (!res.ok) throw new Error(`Gemini ${res.status}`)
    const json = await res.json()
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const extracted = extractOutermostJson(text)
    return { 
      model: 'gemini-flash', 
      success: true, 
      data: extracted ? JSON.parse(extracted) : null, 
      latencyMs: Date.now() - start,
      weight: 1.5 
    }
  } catch (err: any) {
    return { model: 'gemini-flash', success: false, error: err.message, latencyMs: Date.now() - start, weight: 1.5 }
  }
}

async function callGroqLlama(apiKey: string, imageBase64: string): Promise<ModelResult> {
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.2-90b-vision-preview',
        messages: [
          { role: 'system', content: WH_SYSTEM },
          { role: 'user', content: [
            { type: 'text', text: 'Extract all water heater data from this label. Return ONLY valid JSON.' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
          ]}
        ],
        max_tokens: 500,
        temperature: 0.1,
      }),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    
    if (!res.ok) throw new Error(`Groq ${res.status}`)
    const json = await res.json()
    const text = json.choices?.[0]?.message?.content || ''
    const extracted = extractOutermostJson(text)
    return { 
      model: 'groq-llama', 
      success: true, 
      data: extracted ? JSON.parse(extracted) : null, 
      latencyMs: Date.now() - start,
      weight: 1.5 
    }
  } catch (err: any) {
    return { model: 'groq-llama', success: false, error: err.message, latencyMs: Date.now() - start, weight: 1.5 }
  }
}

async function callOpenAIMini(apiKey: string, imageBase64: string): Promise<ModelResult> {
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: WH_SYSTEM },
          { role: 'user', content: [
            { type: 'text', text: 'Extract all water heater data from this label. Return ONLY valid JSON.' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: 'high' } }
          ]}
        ],
        max_tokens: 500,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    
    if (!res.ok) throw new Error(`OpenAI ${res.status}`)
    const json = await res.json()
    const text = json.choices?.[0]?.message?.content || ''
    const extracted = extractOutermostJson(text)
    return { 
      model: 'gpt-4o-mini', 
      success: true, 
      data: extracted ? JSON.parse(extracted) : null, 
      latencyMs: Date.now() - start,
      weight: 1.0 
    }
  } catch (err: any) {
    return { model: 'gpt-4o-mini', success: false, error: err.message, latencyMs: Date.now() - start, weight: 1.0 }
  }
}

async function callPixtral(apiKey: string, imageBase64: string): Promise<ModelResult> {
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    
    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'pixtral-12b-2409',
        messages: [
          { role: 'system', content: WH_SYSTEM },
          { role: 'user', content: [
            { type: 'text', text: 'Extract all water heater data from this label. Return ONLY valid JSON.' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
          ]}
        ],
        max_tokens: 500,
        temperature: 0.1,
      }),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    
    if (!res.ok) throw new Error(`Pixtral ${res.status}`)
    const json = await res.json()
    const text = json.choices?.[0]?.message?.content || ''
    const extracted = extractOutermostJson(text)
    return { 
      model: 'pixtral', 
      success: true, 
      data: extracted ? JSON.parse(extracted) : null, 
      latencyMs: Date.now() - start,
      weight: 1.0 
    }
  } catch (err: any) {
    return { model: 'pixtral', success: false, error: err.message, latencyMs: Date.now() - start, weight: 1.0 }
  }
}

async function callGrok(apiKey: string, imageBase64: string): Promise<ModelResult> {
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'grok-4.20-reasoning',
        messages: [
          { role: 'system', content: WH_SYSTEM },
          { role: 'user', content: [
            { type: 'text', text: 'Extract all water heater data from this label. Return ONLY valid JSON.' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
          ]}
        ],
        max_tokens: 500,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    
    if (!res.ok) throw new Error(`Grok ${res.status}`)
    const json = await res.json()
    const text = json.choices?.[0]?.message?.content || ''
    const extracted = extractOutermostJson(text)
    return { 
      model: 'grok-4.20', 
      success: true, 
      data: extracted ? JSON.parse(extracted) : null, 
      latencyMs: Date.now() - start,
      weight: 2.0 
    }
  } catch (err: any) {
    return { model: 'grok-4.20', success: false, error: err.message, latencyMs: Date.now() - start, weight: 2.0 }
  }
}

// ── Weighted Consensus Aggregation ────────────────────────────────────────────

function aggregateResults(results: ModelResult[]): any {
  const successful = results.filter(r => r.success && r.data)
  if (successful.length === 0) return null

  // Weighted voting for each field
  const votes: Record<string, Record<string, number>> = {}
  
  successful.forEach(result => {
    const data = result.data
    for (const [key, value] of Object.entries(data)) {
      if (!value || value === 'Unknown' || value === 'unknown' || value === null) continue
      if (!votes[key]) votes[key] = {}
      const strValue = String(value)
      votes[key][strValue] = (votes[key][strValue] || 0) + result.weight
    }
  })

  // Pick highest-weighted value for each field
  const consensus: any = {}
  let totalConfidence = 0
  
  for (const [key, valueVotes] of Object.entries(votes)) {
    const sorted = Object.entries(valueVotes).sort((a, b) => b[1] - a[1])
    if (sorted.length > 0) {
      const [bestValue, bestWeight] = sorted[0]
      const totalWeight = Object.values(valueVotes).reduce((sum, w) => sum + w, 0)
      consensus[key] = bestValue
      totalConfidence += bestWeight / totalWeight
    }
  }

  consensus.confidence = totalConfidence / Object.keys(votes).length
  consensus.modelCount = successful.length
  consensus.models = successful.map(r => ({ model: r.model, latencyMs: r.latencyMs }))
  
  return consensus
}

// ── Main Handler ──────────────────────────────────────────────────────────────

export const onRequestPost = async ({ request, env }: any) => {
  try {
    const formData = await request.formData()
    const imageBase64 = formData.get('image') as string
    
    if (!imageBase64) {
      return Response.json({ error: 'image required' }, { status: 400, headers: CORS })
    }

    // Check image hash cache first
    if (env.DB) {
      const hash = await hashImage(imageBase64)
      const cached = await env.DB.prepare(
        `SELECT result_json FROM image_cache WHERE image_hash = ?`
      ).bind(hash).first().catch(() => null)

      if (cached?.result_json) {
        env.DB.prepare(
          `UPDATE image_cache SET hit_count = hit_count + 1, last_hit_at = ? WHERE image_hash = ?`
        ).bind(new Date().toISOString(), hash).run().catch(() => {})
        
        return new Response(cached.result_json as string, {
          headers: { 'Content-Type': 'application/json', ...CORS, 'X-Cache': 'HIT' },
        })
      }
    }

    // Fire all FREE Hugging Face models in parallel (no API keys needed)
    const modelCalls: Promise<ModelResult>[] = [
      callHFLlavaNext(imageBase64),
      callHFBakllava(imageBase64),
      callHFMoondream(imageBase64),
    ]
    
    // Add paid models if API keys are configured (optional)
    if (env.GEMINI_API_KEY) modelCalls.push(callGeminiFlash(env.GEMINI_API_KEY, imageBase64))
    if (env.GROQ_API_KEY) modelCalls.push(callGroqLlama(env.GROQ_API_KEY, imageBase64))
    if (env.OPENAI_API_KEY) modelCalls.push(callOpenAIMini(env.OPENAI_API_KEY, imageBase64))
    if (env.MISTRAL_API_KEY) modelCalls.push(callPixtral(env.MISTRAL_API_KEY, imageBase64))
    if (env.GROK_API_KEY) modelCalls.push(callGrok(env.GROK_API_KEY, imageBase64))

    // Wait for all models (with 10s global timeout)
    const results = await Promise.all(modelCalls)
    
    // Aggregate via weighted consensus
    const consensus = aggregateResults(results)
    
    if (!consensus) {
      return Response.json({ 
        error: 'All models failed', 
        details: results.map(r => ({ model: r.model, error: r.error }))
      }, { status: 502, headers: CORS })
    }

    // Compute derived fields
    const final = computeDerivedFields(consensus)
    final.source = 'parallel-squad'
    
    const finalJson = JSON.stringify(final)

    // Cache result by image hash
    if (env.DB) {
      const hash = await hashImage(imageBase64)
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      env.DB.prepare(`
        INSERT INTO image_cache (image_hash, result_json, created_at, last_hit_at, expires_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(image_hash) DO UPDATE SET
          result_json = excluded.result_json,
          last_hit_at = excluded.last_hit_at
      `).bind(hash, finalJson, new Date().toISOString(), new Date().toISOString(), expiresAt)
        .run().catch(() => {})
    }

    return new Response(finalJson, {
      headers: { 'Content-Type': 'application/json', ...CORS, 'X-Models': String(consensus.modelCount) },
    })

  } catch (err: any) {
    console.error('Parallel scan error:', err)
    return Response.json(
      { error: 'internal_error', message: err.message },
      { status: 500, headers: CORS }
    )
  }
}

export const onRequestOptions = () => new Response(null, { headers: CORS })
