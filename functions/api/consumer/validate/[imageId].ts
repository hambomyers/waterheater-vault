/**
 * Validation Endpoint - Brave Search API validation for water heater scans
 * Runs in background after initial scan to validate Gemini extraction
 */

import { braveSearch } from '../../_utils/wh-compute'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export const onRequestOptions = async () => {
  return new Response(null, { headers: CORS })
}

export const onRequestPost = async ({ request, env, params }: any) => {
  try {
    const { imageId } = params
    const { extraction } = await request.json()

    if (!imageId || !extraction) {
      return Response.json({ error: 'imageId and extraction required' }, { status: 400, headers: CORS })
    }

    if (!env.BRAVE_API_KEY) {
      console.log('[VALIDATION] Brave API key not configured, skipping validation')
      return Response.json({ skipped: true }, { headers: CORS })
    }

    console.log('[VALIDATION] Starting Brave validation for imageId:', imageId)

    // Build search query for validation
    const searchQuery = `${extraction.brand} ${extraction.model} water heater specifications`
    
    // Perform Brave search
    const searchResult = await braveSearch(env.BRAVE_API_KEY, searchQuery)
    
    // Calculate validation score based on search results
    const validationScore = calculateValidationScore(extraction, searchResult)
    
    // Determine verified vs questionable fields
    const { verifiedFields, questionableFields } = analyzeFields(extraction, searchResult)
    
    // Update scan_results with validation data
    await env.DB.prepare(`
      UPDATE scan_results 
      SET validation_score = ?, verified_fields = ?, questionable_fields = ?,
          search_query = ?, search_results = ?, validation_status = 'complete',
          validation_completed_at = ?
      WHERE image_id = ?
    `).bind(
      validationScore,
      JSON.stringify(verifiedFields),
      JSON.stringify(questionableFields),
      searchQuery,
      JSON.stringify(searchResult),
      new Date().toISOString(),
      imageId
    ).run()

    console.log('[VALIDATION] Complete for imageId:', imageId, 'Score:', validationScore)

    return Response.json({
      validationScore,
      verifiedFields,
      questionableFields,
      searchQuery,
      validationComplete: true
    }, { headers: CORS })

  } catch (err: any) {
    console.error('[VALIDATION] Error:', err)
    return Response.json(
      { error: 'Validation failed', message: err.message },
      { status: 500, headers: CORS }
    )
  }
}

export const onRequestGet = async ({ request, env, params }: any) => {
  try {
    const { imageId } = params

    const result = await env.DB.prepare(`
      SELECT validation_status, validation_score, verified_fields, questionable_fields,
             validation_completed_at, base_confidence
      FROM scan_results 
      WHERE image_id = ?
    `).bind(imageId).first()

    if (!result) {
      return Response.json({ error: 'Scan not found' }, { status: 404, headers: CORS })
    }

    return Response.json({
      validationStatus: result.validation_status,
      validationScore: result.validation_score,
      baseConfidence: result.base_confidence,
      verifiedFields: result.verified_fields ? JSON.parse(result.verified_fields) : [],
      questionableFields: result.questionable_fields ? JSON.parse(result.questionable_fields) : [],
      validationCompletedAt: result.validation_completed_at
    }, { headers: CORS })

  } catch (err: any) {
    console.error('[VALIDATION GET] Error:', err)
    return Response.json(
      { error: 'Failed to get validation status' },
      { status: 500, headers: CORS }
    )
  }
}

function calculateValidationScore(extraction: any, searchResult: string | null): number {
  let score = 5 // Base score of 5/10
  
  if (!searchResult) return score

  const searchLower = searchResult.toLowerCase()
  
  // Check brand match (+2)
  if (extraction.brand && searchLower.includes(extraction.brand.toLowerCase())) {
    score += 2
  }
  
  // Check model match (+2)
  if (extraction.model && searchLower.includes(extraction.model.toLowerCase())) {
    score += 2
  }
  
  // Check capacity match (+1)
  if (extraction.tankSizeGallons && 
      searchLower.includes(`${extraction.tankSizeGallons} gallon`)) {
    score += 1
  }
  
  // Check fuel type consistency (+1)
  if (extraction.fuelType) {
    const fuelWords: string[] = extraction.fuelType.toLowerCase().split(' ')
    if (fuelWords.some((word: string) => searchLower.includes(word))) {
      score += 1
    }
  }
  
  return Math.min(10, Math.max(1, score))
}

function analyzeFields(extraction: any, searchResult: string | null): {
  verifiedFields: string[]
  questionableFields: string[]
} {
  const verifiedFields: string[] = []
  const questionableFields: string[] = []
  
  if (!searchResult) {
    return { verifiedFields, questionableFields: ['brand', 'model', 'capacity'] }
  }

  const searchLower = searchResult.toLowerCase()
  
  // Verify brand
  if (extraction.brand && searchLower.includes(extraction.brand.toLowerCase())) {
    verifiedFields.push('brand')
  } else if (extraction.brand) {
    questionableFields.push('brand')
  }
  
  // Verify model
  if (extraction.model && searchLower.includes(extraction.model.toLowerCase())) {
    verifiedFields.push('model')
  } else if (extraction.model) {
    questionableFields.push('model')
  }
  
  // Verify capacity
  if (extraction.tankSizeGallons && 
      searchLower.includes(`${extraction.tankSizeGallons} gallon`)) {
    verifiedFields.push('capacity')
  } else if (extraction.tankSizeGallons) {
    questionableFields.push('capacity')
  }
  
  return { verifiedFields, questionableFields }
}
