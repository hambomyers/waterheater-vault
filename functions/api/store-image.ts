/**
 * Store Image Endpoint
 * Saves uploaded image to D1 and returns image ID
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
    
    // Check DB binding
    if (!env.DB) {
      console.error('[STORE-IMAGE] No DB binding found')
      return Response.json(
        { error: 'Database not configured', details: 'No DB binding in environment' },
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

    // Generate unique image ID
    const imageId = crypto.randomUUID()
    const timestamp = new Date().toISOString()
    console.log('[STORE-IMAGE] Generated imageId:', imageId)

    // Store image in D1
    console.log('[STORE-IMAGE] Storing in D1...')
    try {
      await env.DB.prepare(`
        INSERT INTO scan_images (
          id, 
          user_id,
          serial_number,
          image_data, 
          captured_at
        ) VALUES (?, ?, ?, ?, ?)
      `).bind(
        imageId,
        null, // anonymous scan
        null, // serial not known yet
        imageBase64,
        timestamp
      ).run()
      
      console.log('[STORE-IMAGE] Successfully stored in D1')
    } catch (dbErr: any) {
      console.error('[STORE-IMAGE] Database error:', dbErr)
      return Response.json(
        { error: 'Database error', message: dbErr.message, details: dbErr.stack },
        { status: 500, headers: CORS }
      )
    }

    // Return image ID and metadata
    const response = {
      imageId,
      timestamp,
      size: imageBase64.length,
      message: 'Image saved successfully'
    }
    console.log('[STORE-IMAGE] Returning success response:', { imageId, size: imageBase64.length })
    
    return Response.json(response, { headers: CORS })
  } catch (err: any) {
    console.error('[STORE-IMAGE] Unexpected error:', err)
    return Response.json(
      { error: 'Failed to store image', message: err.message, stack: err.stack },
      { status: 500, headers: CORS }
    )
  }
}
