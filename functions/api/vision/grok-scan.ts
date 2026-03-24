/**
 * Grok Vision API Endpoint (Tier 3 Fallback)
 * Only called when Tier 1 (pattern matching) and Tier 2 (Phi-2) fail
 * Handles ~2% of scans with blurry/damaged labels
 */

interface Env {
  GROK_API_KEY: string
  DB: D1Database
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context

  try {
    // Parse request body
    const body = await request.json() as { image: string }
    
    if (!body.image) {
      return new Response(JSON.stringify({ error: 'Image data required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Call Grok Vision API
    const grokResponse = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.GROK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'grok-2-vision-1212',
        messages: [
          {
            role: 'system',
            content: GROK_VISION_SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract water heater information from this data plate image.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${body.image}`
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      })
    })

    if (!grokResponse.ok) {
      const errorText = await grokResponse.text()
      console.error('Grok API error:', {
        status: grokResponse.status,
        statusText: grokResponse.statusText,
        body: errorText
      })
      throw new Error(`Grok API failed: ${grokResponse.status} ${grokResponse.statusText} - ${errorText}`)
    }

    const grokData = await grokResponse.json()
    const content = grokData.choices[0]?.message?.content

    if (!content) {
      throw new Error('No content in Grok response')
    }

    // Parse JSON from response
    const extracted = extractJSON(content)
    
    // Calculate derived fields
    const result = calculateDerivedFields(extracted)

    // Log to D1 for analytics
    await logScanEvent(env.DB, {
      processingMethod: 'grok-vision',
      confidence: result.confidence,
      brand: result.brand,
      success: true
    })

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Grok Vision scan failed:', error)
    
    return new Response(JSON.stringify({ 
      error: 'Vision scan failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

/**
 * System prompt for Grok Vision
 */
const GROK_VISION_SYSTEM_PROMPT = `You are an expert at reading water heater data plates and extracting technical specifications.

Analyze the image and extract:
1. Brand/manufacturer
2. Model number (complete, including all letters and numbers)
3. Serial number
4. Manufacture date (decode from serial using brand-specific patterns)
5. Fuel type (natural_gas, propane, electric, heat_pump, tankless-gas, or tankless-electric)
6. Tank size in gallons (or null for tankless)
7. Input BTU (gas) or watts (electric)

Serial number decode patterns by brand:
- Rheem/Ruud: WWYY at position 2 (week, year) - e.g., 0423 = week 04, 2023
- A.O. Smith/State/American: YYWW at position 0 - e.g., 2404 = 2024 week 04
- Bradford White: BWL format (letter=year, numbers=week)
- Navien: YYYYMM at position 0 - e.g., 202403 = March 2024
- Rinnai: YYMM at position 2
- Noritz: YYWW at position 0
- Bosch: YYYYWW at position 0
- GE/GEO: LETTER_YY (A=Jan, B=Feb, etc.)

Return ONLY valid JSON with this exact structure:
{
  "brand": "string",
  "model": "string",
  "serial": "string",
  "manufactureDate": "YYYY-MM-DD",
  "fuelType": "natural_gas|propane|electric|heat_pump|tankless-gas|tankless-electric",
  "tankSizeGallons": number or null,
  "inputBTU": number or null,
  "confidence": 0-100
}

Be precise. If you cannot read a field clearly, set confidence lower.`

/**
 * Extract JSON from Grok response (may have markdown formatting)
 */
function extractJSON(text: string): any {
  // Remove markdown code blocks if present
  let cleaned = text.trim()
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '')
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/```\n?/g, '')
  }
  
  // Find JSON object
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('No JSON found in response')
  }
  
  return JSON.parse(jsonMatch[0])
}

/**
 * Calculate derived fields (age, remaining life, cost)
 */
function calculateDerivedFields(data: any): any {
  const currentYear = new Date().getFullYear()
  const manufactureYear = parseInt(data.manufactureDate.split('-')[0])
  const age = currentYear - manufactureYear
  
  // Expected life based on fuel type
  const expectedLife = data.fuelType.includes('tankless') ? 20 : 
                       data.fuelType === 'heat_pump' ? 15 :
                       data.fuelType.includes('gas') ? 12 : 11
  
  const remaining = Math.max(0, expectedLife - age)
  
  // Estimated cost based on fuel type and tank size
  let costMin = 1000
  let costMax = 1500
  
  if (data.fuelType.includes('tankless')) {
    costMin = data.fuelType === 'tankless-gas' ? 2000 : 1500
    costMax = data.fuelType === 'tankless-gas' ? 3500 : 2500
  } else if (data.fuelType === 'heat_pump') {
    costMin = 1800
    costMax = 3000
  } else if (data.fuelType.includes('gas')) {
    const size = data.tankSizeGallons || 50
    costMin = size <= 40 ? 900 : size <= 50 ? 1000 : size <= 75 ? 1300 : 1600
    costMax = size <= 40 ? 1200 : size <= 50 ? 1400 : size <= 75 ? 1800 : 2200
  } else {
    const size = data.tankSizeGallons || 50
    costMin = size <= 40 ? 700 : size <= 50 ? 750 : size <= 75 ? 1000 : 1200
    costMax = size <= 40 ? 950 : size <= 50 ? 1100 : size <= 75 ? 1400 : 1700
  }
  
  return {
    brand: data.brand,
    model: data.model,
    serial: data.serial,
    manufactureDate: data.manufactureDate,
    age,
    fuelType: data.fuelType,
    tankSizeGallons: data.tankSizeGallons,
    expectedLifeYears: expectedLife,
    remainingYears: remaining,
    estimatedCostMin: costMin,
    estimatedCostMax: costMax,
    confidence: data.confidence || 85,
    processingMethod: 'grok-vision'
  }
}

/**
 * Log scan event to D1 for analytics
 */
async function logScanEvent(db: D1Database, event: any): Promise<void> {
  try {
    await db.prepare(`
      INSERT INTO scan_events (
        processing_method,
        confidence,
        brand,
        success,
        created_at
      ) VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(
      event.processingMethod,
      event.confidence,
      event.brand,
      event.success ? 1 : 0
    ).run()
  } catch (error) {
    console.error('Failed to log scan event:', error)
    // Don't throw - logging failure shouldn't break the scan
  }
}
