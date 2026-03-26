/**
 * Parallel AI Scan Endpoint
 * Fires multiple AI models simultaneously and returns weighted consensus
 * All models fetch from the SAME saved imageId
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
      return Response.json(
        { error: 'imageId required' },
        { status: 400, headers: CORS }
      )
    }

    console.log('[PARALLEL] Starting parallel scan for imageId:', imageId)

    // Fetch saved image from D1
    if (!env.DB) {
      return Response.json(
        { error: 'Database not configured' },
        { status: 500, headers: CORS }
      )
    }

    const stored = await env.DB.prepare(
      `SELECT image_data FROM scan_images WHERE id = ?`
    ).bind(imageId).first()

    if (!stored?.image_data) {
      return Response.json(
        { error: 'Image not found' },
        { status: 404, headers: CORS }
      )
    }

    const imageBase64 = stored.image_data as string
    console.log('[PARALLEL] Image fetched, size:', imageBase64.length)

    // Fire all models in parallel
    const startTime = Date.now()
    const results = await Promise.allSettled([
      callGrokVision(imageBase64, env.GROK_API_KEY),
      // Add more models here:
      // callGemini(imageBase64, env.GEMINI_API_KEY),
      // callLlama(imageBase64, env.GROQ_API_KEY),
      // callGPT4oMini(imageBase64, env.OPENAI_API_KEY),
    ])

    const totalTime = Date.now() - startTime
    console.log('[PARALLEL] All models completed in', totalTime, 'ms')

    // Process results
    const modelResults: ModelResult[] = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        return {
          model: `model-${index}`,
          confidence: 0,
          responseTime: 0,
          error: result.reason?.message || 'Unknown error'
        }
      }
    })

    // Calculate weighted consensus
    const consensus = calculateConsensus(modelResults)

    return Response.json(
      {
        imageId,
        consensus,
        modelResults,
        totalTime,
        source: 'parallel-scan'
      },
      { headers: CORS }
    )
  } catch (err: any) {
    console.error('[PARALLEL] Error:', err)
    return Response.json(
      { error: 'Parallel scan failed', message: err.message },
      { status: 500, headers: CORS }
    )
  }
}

/**
 * Call Grok Vision API
 */
async function callGrokVision(imageBase64: string, apiKey: string): Promise<ModelResult> {
  const startTime = Date.now()
  
  try {
    // 12-second timeout for external API call
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000)
    
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'grok-4.20-reasoning',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extract water heater info: brand, model, serial number, manufacture date. Return JSON only.' },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.1
      })
    })
    
    clearTimeout(timeout)

    const responseTime = Date.now() - startTime

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || '{}'
    
    // Parse JSON from response
    const parsed = JSON.parse(content)

    return {
      model: 'grok-vision',
      brand: parsed.brand,
      model_number: parsed.model,
      serial: parsed.serial || parsed.serialNumber,
      manufactureDate: parsed.manufactureDate,
      confidence: parsed.confidence || 0.8,
      responseTime
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

/**
 * Calculate weighted consensus from multiple model results
 */
function calculateConsensus(results: ModelResult[]): any {
  const validResults = results.filter(r => !r.error && r.confidence > 0.5)
  
  if (validResults.length === 0) {
    throw new Error('All models failed')
  }

  // Simple majority vote for now
  const brands = validResults.map(r => r.brand).filter((b): b is string => Boolean(b))
  const serials = validResults.map(r => r.serial).filter((s): s is string => Boolean(s))
  const models = validResults.map(r => r.model_number).filter((m): m is string => Boolean(m))

  const mostCommonBrand = getMostCommon(brands)
  const mostCommonSerial = getMostCommon(serials)
  const mostCommonModel = getMostCommon(models)

  const avgConfidence = validResults.reduce((sum, r) => sum + r.confidence, 0) / validResults.length

  return {
    brand: mostCommonBrand,
    model: mostCommonModel,
    serial: mostCommonSerial,
    confidence: avgConfidence,
    agreementCount: validResults.length
  }
}

function getMostCommon(arr: string[]): string | undefined {
  if (arr.length === 0) return undefined
  
  const counts: Record<string, number> = {}
  for (const item of arr) {
    counts[item] = (counts[item] || 0) + 1
  }
  
  let maxCount = 0
  let mostCommon = arr[0]
  for (const [item, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count
      mostCommon = item
    }
  }
  
  return mostCommon
}
