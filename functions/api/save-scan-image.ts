// /api/save-scan-image — store captured WH photo for verification
// Called after successful scan to preserve the original image

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export const onRequestPost = async ({ request, env }: any) => {
  // Non-critical endpoint - always return success to not block scans
  if (!env.DB) {
    console.warn('DB not configured, skipping image save')
    return Response.json({ success: false, reason: 'db_not_configured' }, { headers: CORS })
  }

  try {
    const { imageBase64, serialNumber, userId } = await request.json()

    if (!imageBase64) {
      return Response.json({ success: false, reason: 'no_image' }, { headers: CORS })
    }

    // Extract dimensions and calculate file size
    const base64Data = imageBase64.split(',')[1] || imageBase64
    const fileSizeKb = Math.round((base64Data.length * 3) / 4 / 1024)

    // Skip if image is too large (>5MB to avoid D1 limits)
    if (fileSizeKb > 5120) {
      console.warn(`Image too large: ${fileSizeKb}KB, skipping save`)
      return Response.json({ success: false, reason: 'image_too_large', fileSizeKb }, { headers: CORS })
    }

    const imageId = crypto.randomUUID()

    await env.DB.prepare(`
      INSERT INTO scan_images (id, user_id, serial_number, image_data, thumbnail_data, captured_at, file_size_kb)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      imageId,
      userId || null,
      serialNumber || null,
      base64Data,
      null, // thumbnail_data
      new Date().toISOString(),
      fileSizeKb
    ).run()

    return Response.json({ 
      success: true, 
      imageId,
      fileSizeKb 
    }, { headers: CORS })

  } catch (err: any) {
    // Log but don't fail - this is non-critical
    console.error('Save image error:', err)
    return Response.json(
      { success: false, reason: 'error', message: err.message },
      { headers: CORS }
    )
  }
}

export const onRequestOptions = () => new Response(null, { headers: CORS })
