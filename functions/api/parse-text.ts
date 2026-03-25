// /api/parse-text — text-only LLM endpoint (primary scan path).
// Receives raw Tesseract OCR text, returns full water heater result.
// ~10x faster and ~20x cheaper than vision. Feeds the self-improving flywheel.

import { computeDerivedFields, extractOutermostJson, braveSearch, learnFromScan, WH_TEXT_SYSTEM } from './_utils/wh-compute'
import { extractWHSerial } from './_utils/whSerialDecoder'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const TEXT_MODEL = 'grok-beta'

export const onRequestPost = async ({ request, env }: any) => {
  try {
    const { rawText, brandHint } = await request.json()

    if (!rawText || String(rawText).trim().length < 5) {
      return Response.json({ error: 'rawText required' }, { status: 400, headers: CORS })
    }

    // ── Serial cache: skip LLM if we've seen this serial before ──────────────
    const serialCandidate = extractWHSerial(String(rawText).toUpperCase())
    if (serialCandidate && env.DB) {
      const cached = await env.DB.prepare(
        `SELECT grok_result_json FROM serial_cache WHERE serial_number = ?`
      ).bind(serialCandidate).first().catch(() => null)

      if (cached?.grok_result_json) {
        env.DB.prepare(
          `UPDATE serial_cache SET hit_count = hit_count + 1, last_hit_at = ? WHERE serial_number = ?`
        ).bind(new Date().toISOString(), serialCandidate).run().catch(() => {})

        const result = JSON.parse(cached.grok_result_json as string)
        result.source = 'serial-cache'
        return new Response(cached.grok_result_json as string, {
          headers: { 'Content-Type': 'application/json', ...CORS, 'X-Cache': 'HIT', 'X-Path': 'text-parse' },
        })
      }
    }

    const grokKey = env.GROK_API_KEY
    if (!grokKey) {
      return Response.json(
        { error: 'API key not configured', message: 'GROK_API_KEY not set.' },
        { status: 500, headers: CORS }
      )
    }

    // ── Call text-only model ──────────────────────────────────────────────────
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    let grokRes: Response
    try {
      grokRes = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${grokKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: TEXT_MODEL,
          max_tokens: 400,
          temperature: 0.1,
          messages: [
            { role: 'system', content: WH_TEXT_SYSTEM },
            {
              role: 'user',
              content: `Brand hint: ${brandHint || 'unknown'}\n\nRaw OCR text:\n${rawText}`,
            },
          ],
        }),
        signal: controller.signal,
      })
    } catch (err: any) {
      clearTimeout(timeout)
      if (err.name === 'AbortError') {
        return Response.json(
          { error: 'timeout', message: 'Text parse timed out — falling back to vision.' },
          { status: 504, headers: CORS }
        )
      }
      throw err
    }
    clearTimeout(timeout)

    if (!grokRes.ok) {
      return Response.json(
        { error: 'text_parse_error', message: `xAI API error ${grokRes.status}` },
        { status: 502, headers: CORS }
      )
    }

    const grokData = await grokRes.json()
    const content = grokData.choices?.[0]?.message?.content
    if (!content) {
      return Response.json({ error: 'empty_response' }, { status: 502, headers: CORS })
    }

    const rawJson = extractOutermostJson(content)
    if (!rawJson) {
      return Response.json({ error: 'parse_error', raw: content }, { status: 502, headers: CORS })
    }

    let parsed: any
    try { parsed = JSON.parse(rawJson) }
    catch { return Response.json({ error: 'json_error' }, { status: 502, headers: CORS }) }

    if (parsed.error) {
      return Response.json({ ...parsed, source: 'text-parse' }, { headers: CORS })
    }

    // ── Compute derived fields server-side ────────────────────────────────────
    parsed = computeDerivedFields(parsed)
    parsed.source = 'text-parse'

    // ── Brave Search — enrich docs with verified URLs ─────────────────────────
    const braveKey = env.BRAVE_API_KEY
    if (braveKey && Array.isArray(parsed.docs)) {
      parsed.docs = await Promise.all(
        parsed.docs.slice(0, 5).map(async (doc: any) => {
          if (!doc.searchQuery) return { ...doc, url: null }
          const url = await braveSearch(braveKey, doc.searchQuery)
          return { type: doc.type, label: doc.label, url, searchQuery: doc.searchQuery }
        })
      )
    }

    const finalJson = JSON.stringify(parsed)

    // ── Cache by serial number ────────────────────────────────────────────────
    if (env.DB && parsed.serialNumber) {
      env.DB.prepare(`
        INSERT INTO serial_cache (serial_number, grok_result_json, brand, hit_count, created_at, last_hit_at)
        VALUES (?, ?, ?, 1, ?, ?)
        ON CONFLICT(serial_number) DO UPDATE SET
          grok_result_json = excluded.grok_result_json,
          last_hit_at      = excluded.last_hit_at
      `).bind(
        parsed.serialNumber, finalJson, parsed.brand || null,
        new Date().toISOString(), new Date().toISOString()
      ).run().catch(() => {})
    }

    // ── Record scan event ─────────────────────────────────────────────────────
    if (env.DB && parsed.ageYears != null) {
      const cf = (request as any).cf ?? {}
      env.DB.prepare(
        `INSERT INTO scan_events (id, zip, brand, age_years, fuel_type, remaining_life_years, scanned_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        crypto.randomUUID(), cf.postalCode ?? null,
        parsed.brand ?? null, parsed.ageYears ?? null,
        parsed.fuelType ?? null, parsed.remainingLifeYears ?? null,
        new Date().toISOString()
      ).run().catch(() => {})
    }

    // ── Learn from this scan ──────────────────────────────────────────────────
    learnFromScan(env.DB, parsed).catch(() => {})

    return new Response(finalJson, {
      headers: { 'Content-Type': 'application/json', ...CORS, 'X-Path': 'text-parse' },
    })
  } catch (err: any) {
    return Response.json(
      { error: 'internal_error', message: err.message || 'Unexpected error' },
      { status: 500, headers: CORS }
    )
  }
}

export const onRequestOptions = () => new Response(null, { headers: CORS })
