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
    const formData = await request.formData()
    const imageBase64 = formData.get('image') as string
    
    if (!imageBase64) {
      return Response.json(
        { error: 'No image provided' },
        { status: 400, headers: CORS }
      )
    }

    // Generate unique image ID
    const imageId = crypto.randomUUID()
    const timestamp = new Date().toISOString()

    // Get client info for tracking
    const cf = (request as any).cf ?? {}
    const zip = cf.postalCode ?? null
    const country = cf.country ?? null

    // Store image in D1 (using existing scan_images table)
    if (env.DB) {
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
    }

    // Return image ID and metadata
    return Response.json(
      {
        imageId,
        timestamp,
        size: imageBase64.length,
        message: 'Image saved successfully'
      },
      { headers: CORS }
    )
  } catch (err: any) {
    console.error('Store image error:', err)
    return Response.json(
      { error: 'Failed to store image', message: err.message },
      { status: 500, headers: CORS }
    )
  }
}
