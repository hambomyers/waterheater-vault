// /api/fast-lookup — zero-LLM path for known brand/serial combinations.
// Returns a full result in <100ms using D1 learned patterns + model catalog.
// Called FIRST before text-parse or vision. Returns 404 if confidence is too low.

import { computeDerivedFields, normalizeBrand } from '../_utils/wh-compute'
import { decodeWHSerial } from '../_utils/whSerialDecoder'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export const onRequestPost = async ({ request, env }: any) => {
  if (!env.DB) return Response.json({ source: 'miss', reason: 'no-db' }, { status: 404, headers: CORS })

  try {
    const { serial, brand, model } = await request.json()

    // ── 1. Exact serial cache ─────────────────────────────────────────────────
    if (serial) {
      const cached = await env.DB.prepare(
        `SELECT grok_result_json FROM serial_cache WHERE serial_number = ?`
      ).bind(serial.toUpperCase()).first().catch(() => null)

      if (cached?.grok_result_json) {
        env.DB.prepare(
          `UPDATE serial_cache SET hit_count = hit_count + 1, last_hit_at = ? WHERE serial_number = ?`
        ).bind(new Date().toISOString(), serial.toUpperCase()).run().catch(() => {})

        const result = JSON.parse(cached.grok_result_json as string)
        result.source = 'serial-cache'
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json', ...CORS, 'X-Cache': 'HIT' },
        })
      }
    }

    // ── 2. Pattern-based decode (requires learned brand confidence) ───────────
    if (!serial || !brand) {
      return Response.json({ source: 'miss', reason: 'insufficient-input' }, { status: 404, headers: CORS })
    }

    const brandKey = normalizeBrand(brand)

    const pattern = await env.DB.prepare(
      `SELECT pattern_type, sample_count, confidence FROM serial_patterns WHERE brand = ?`
    ).bind(brandKey).first().catch(() => null)

    // Require ≥ 10 confirmed samples and ≥ 90% confidence before trusting pattern
    if (!pattern || (pattern.confidence as number) < 0.9 || (pattern.sample_count as number) < 10) {
      return Response.json(
        { source: 'miss', reason: 'low-confidence', brand: brandKey, samples: pattern?.sample_count ?? 0 },
        { status: 404, headers: CORS }
      )
    }

    // Decode serial date using brand's known pattern
    const decoded = decodeWHSerial(brand, serial)
    if (!decoded) {
      return Response.json({ source: 'miss', reason: 'decode-failed' }, { status: 404, headers: CORS })
    }

    // ── 3. Model catalog lookup ───────────────────────────────────────────────
    const modelPrefix = (model || '').toUpperCase().slice(0, 8)
    let modelSpecs: any = null
    if (modelPrefix.length >= 4) {
      modelSpecs = await env.DB.prepare(
        `SELECT fuel_type, tank_size_gallons, expected_life_years FROM model_catalog WHERE brand = ? AND model_prefix = ?`
      ).bind(brandKey, modelPrefix).first().catch(() => null)
    }

    // ── 4. Assemble + compute derived fields ──────────────────────────────────
    const parsed: any = {
      brand,
      model: model || null,
      serialNumber: serial.toUpperCase(),
      manufactureDate: decoded.manufactureDate,
      fuelType: modelSpecs?.fuel_type || 'unknown',
      tankSizeGallons: modelSpecs?.tank_size_gallons || null,
      confidence: pattern.confidence,
    }

    const fullResult = computeDerivedFields(parsed)
    fullResult.source = 'fast-lookup'
    fullResult.patternType = decoded.patternType
    fullResult.patternSamples = pattern.sample_count
    fullResult.patternConfidence = pattern.confidence

    // Record hit to update model_catalog sample count
    if (modelPrefix.length >= 4) {
      env.DB.prepare(
        `UPDATE model_catalog SET sample_count = sample_count + 1, last_seen = ? WHERE brand = ? AND model_prefix = ?`
      ).bind(new Date().toISOString(), brandKey, modelPrefix).run().catch(() => {})
    }

    return new Response(JSON.stringify(fullResult), {
      headers: { 'Content-Type': 'application/json', ...CORS, 'X-Path': 'fast-lookup' },
    })
  } catch (err: any) {
    return Response.json(
      { source: 'miss', reason: 'error', message: err.message },
      { status: 500, headers: CORS }
    )
  }
}

export const onRequestOptions = () => new Response(null, { headers: CORS })
