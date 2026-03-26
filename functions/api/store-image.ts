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

export const onRequestPost = async ({ request, env }: any) => {
  try {
    console.log('[STORE-IMAGE] Request received')
    
    // Check required bindings
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
    
    console.log('[STORE-IMAGE] DB binding found, parsing form data...')
    const formData = await request.formData()
    const imageBase64 = formData.get('image') as string
    
    console.log('[STORE-IMAGE] Image data length:', imageBase64?.length || 0)
    
    if (!imageBase64) {
      console.error('[STORE-IMAGE] No image provided in form data')
      return Response.json(
        { error: 'No image provided', details: 'Form data missing image field' },
        { status: 400, headers: CORS }
      )
    }

    // Generate unique image ID and keys
    const imageId = crypto.randomUUID()
    const timestamp = new Date().toISOString()
    const r2Key = `scans/${imageId}.jpg`
    const imageHash = await hashImage(imageBase64)
    console.log('[STORE-IMAGE] Generated imageId:', imageId)

    // Convert base64 to buffer for R2 upload
    const imageBuffer = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0))
    
    // Upload full image to R2
    console.log('[STORE-IMAGE] Uploading to R2...')
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
      console.log('[STORE-IMAGE] Successfully uploaded to R2:', r2Key)
    } catch (r2Err: any) {
      console.error('[STORE-IMAGE] R2 upload error:', r2Err)
      return Response.json(
        { error: 'Storage error', message: r2Err.message },
        { status: 500, headers: CORS }
      )
    }

    // Create preview thumbnail (first 2KB base64 for quick preview)
    const previewData = imageBase64.substring(0, 2048)
    
    // Store metadata in D1 (no full image data)
    console.log('[STORE-IMAGE] Storing metadata in D1...')
    try {
      await env.DB.prepare(`
        INSERT INTO scan_images (
          id, 
          user_id,
          serial_number,
          r2_key,
          image_hash,
          image_preview,
          file_size,
          captured_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        imageId,
        null, // anonymous scan
        null, // serial not known yet
        r2Key,
        imageHash,
        previewData,
        imageBuffer.length,
        timestamp
      ).run()
      
      console.log('[STORE-IMAGE] Successfully stored metadata in D1')
    } catch (dbErr: any) {
      console.error('[STORE-IMAGE] Database error:', dbErr)
      // Try to cleanup R2 object if DB fails
      try {
        await env.BUCKET.delete(r2Key)
        console.log('[STORE-IMAGE] Cleaned up R2 object after DB error')
      } catch {}
      
      return Response.json(
        { error: 'Database error', message: dbErr.message },
        { status: 500, headers: CORS }
      )
    }

    // Return image ID and metadata
    const response = {
      imageId,
      timestamp,
      size: imageBuffer.length,
      r2Key,
      hash: imageHash,
      message: 'Image uploaded to R2 and metadata saved to D1'
    }
    console.log('[STORE-IMAGE] Success:', { imageId, size: imageBuffer.length, r2Key })
    
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
