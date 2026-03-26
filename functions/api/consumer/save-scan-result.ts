/**
 * Save Scan Result Endpoint
 * Updates scan_images table with extracted serial number and metadata
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export const onRequestOptions = async () => {
  return new Response(null, { headers: CORS })
}

export const onRequestPost = async ({ request, env }: any) => {
  try {
    if (!env.DB) {
      return Response.json(
        { error: 'Database not configured' },
        { status: 500, headers: CORS }
      )
    }

    const { imageId, serialNumber, brand, model, manufactureDate, confidence } = await request.json()

    if (!imageId) {
      return Response.json(
        { error: 'imageId required' },
        { status: 400, headers: CORS }
      )
    }

    // Update the scan record with extracted information
    const result = await env.DB.prepare(`
      UPDATE scan_images 
      SET serial_number = ?, 
          brand = ?, 
          model = ?, 
          manufacture_date = ?,
          confidence = ?,
          processed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      serialNumber || null,
      brand || null,
      model || null,
      manufactureDate || null,
      confidence || null,
      imageId
    ).run()

    if (result.changes === 0) {
      return Response.json(
        { error: 'Scan record not found' },
        { status: 404, headers: CORS }
      )
    }

    return Response.json(
      { 
        success: true, 
        message: 'Scan result saved successfully',
        updated: {
          imageId,
          serialNumber,
          brand,
          model,
          manufactureDate,
          confidence
        }
      },
      { headers: CORS }
    )
  } catch (err: any) {
    console.error('[SAVE-SCAN-RESULT] Error:', err)
    return Response.json(
      { error: 'Failed to save scan result', message: err.message },
      { status: 500, headers: CORS }
    )
  }
}
