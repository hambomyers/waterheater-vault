// /api/save-scan-image — store captured WH photo for verification
// Called after successful scan to preserve the original image

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export const onRequestPost = async ({ request, env }: any) => {
  if (!env.DB) {
    return Response.json({ error: 'Database not configured' }, { status: 500, headers: CORS })
  }

  try {
    const { imageBase64, serialNumber, userId } = await request.json()

    if (!imageBase64) {
      return Response.json({ error: 'imageBase64 required' }, { status: 400, headers: CORS })
    }

    // Extract dimensions and calculate file size
    const base64Data = imageBase64.split(',')[1] || imageBase64
    const fileSizeKb = Math.round((base64Data.length * 3) / 4 / 1024)

    // Generate thumbnail (simplified - just store original for now, can add resize later)
    const thumbnailData = null

    const imageId = crypto.randomUUID()

    await env.DB.prepare(`
      INSERT INTO scan_images (id, user_id, serial_number, image_data, thumbnail_data, captured_at, file_size_kb)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      imageId,
      userId || null,
      serialNumber || null,
      base64Data,
      thumbnailData,
      new Date().toISOString(),
      fileSizeKb
    ).run()

    return Response.json({ 
      success: true, 
      imageId,
      fileSizeKb 
    }, { headers: CORS })

  } catch (err: any) {
    console.error('Save image error:', err)
    return Response.json(
      { error: 'internal_error', message: err.message || 'Failed to save image' },
      { status: 500, headers: CORS }
    )
  }
}

export const onRequestOptions = () => new Response(null, { headers: CORS })
