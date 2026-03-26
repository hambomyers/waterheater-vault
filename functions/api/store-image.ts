/**
 * Store Image Endpoint - Production Grade
 * Uploads full image to R2 bucket + stores metadata in D1
 * Returns imageId for AI model processing via R2 URLs
 * This must run BEFORE any AI model processing
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export const onRequestOptions = async () => {
  return new Response(null, { headers: CORS })
}

function normalizeBase64Image(raw: string): string {
  const trimmed = raw.trim()
  const payload = trimmed.includes('base64,')
    ? trimmed.split('base64,').pop()!
    : trimmed
  return payload.replace(/\s/g, '')
}

export const onRequestPost = async ({ request, env }: any) => {
  try {
    if (!env.DB) {
      console.error('[STORE-IMAGE] No DB binding found')
      return Response.json(
        { error: 'Database not configured', details: 'No DB binding in environment' },
        { status: 500, headers: CORS }
      )
    }

    if (!env.BUCKET) {
      console.error('[STORE-IMAGE] No R2 bucket binding found')
      return Response.json(
        { error: 'Storage not configured', details: 'No BUCKET binding in environment' },
        { status: 500, headers: CORS }
      )
    }

    const formData = await request.formData()
    const rawImage = formData.get('image')

    if (typeof rawImage !== 'string' || !rawImage.trim()) {
      return Response.json(
        { error: 'No image provided', details: 'Form data missing image field' },
        { status: 400, headers: CORS }
      )
    }

    const imageBase64 = normalizeBase64Image(rawImage)
    if (!imageBase64) {
      return Response.json(
        { error: 'Invalid image data', details: 'Empty base64 payload' },
        { status: 400, headers: CORS }
      )
    }

    // Generate unique image ID and keys
    const imageId = crypto.randomUUID()
    const timestamp = new Date().toISOString()
    const r2Key = `scans/${imageId}.jpg`
    const imageHash = await hashImage(imageBase64)

    let imageBuffer: Uint8Array
    try {
      imageBuffer = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0))
    } catch {
      return Response.json(
        { error: 'Invalid image data', details: 'Could not decode base64' },
        { status: 400, headers: CORS }
      )
    }

    try {
      await env.BUCKET.put(r2Key, imageBuffer, {
        httpMetadata: {
          contentType: 'image/jpeg',
        },
        customMetadata: {
          imageId,
          uploadedAt: timestamp,
        },
      })
    } catch (r2Err: any) {
      console.error('[STORE-IMAGE] R2 upload error:', r2Err)
      return Response.json(
        { error: 'Storage error', message: r2Err.message },
        { status: 500, headers: CORS }
      )
    }

    const previewData = imageBase64.substring(0, 2048)

    // image_data is NOT NULL in schema; full JPEG lives in R2 only
    const imageDataPlaceholder = ''

    try {
      await env.DB.prepare(`
        INSERT INTO scan_images (
          id,
          user_id,
          serial_number,
          image_data,
          r2_key,
          image_hash,
          image_preview,
          file_size,
          captured_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
        .bind(
          imageId,
          null,
          null,
          imageDataPlaceholder,
          r2Key,
          imageHash,
          previewData,
          imageBuffer.length,
          timestamp
        )
        .run()
    } catch (dbErr: any) {
      console.error('[STORE-IMAGE] Database error:', dbErr)
      try {
        await env.BUCKET.delete(r2Key)
      } catch {}

      return Response.json(
        { error: 'Database error', message: dbErr.message },
        { status: 500, headers: CORS }
      )
    }

    const response = {
      imageId,
      timestamp,
      size: imageBuffer.length,
      r2Key,
      hash: imageHash,
      message: 'Image uploaded to R2 and metadata saved to D1',
    }
    return Response.json(response, { headers: CORS })
  } catch (err: any) {
    console.error('[STORE-IMAGE] Unexpected error:', err)
    return Response.json(
      { error: 'Failed to store image', message: err.message, stack: err.stack },
      { status: 500, headers: CORS }
    )
  }
}

/**
 * Generate SHA-256 hash of image data for deduplication
 */
async function hashImage(base64Data: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(base64Data)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
