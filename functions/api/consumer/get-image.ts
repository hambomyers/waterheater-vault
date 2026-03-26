/**
 * Get Image Endpoint
 * Fetches saved image from D1 by imageId
 * Used by AI models to process the same saved image
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export const onRequestOptions = async () => {
  return new Response(null, { headers: CORS })
}

export const onRequestGet = async ({ request, env }: any) => {
  try {
    const url = new URL(request.url)
    const imageId = url.searchParams.get('id')
    
    if (!imageId) {
      return Response.json(
        { error: 'imageId required' },
        { status: 400, headers: CORS }
      )
    }

    // Fetch image from D1
    if (!env.DB) {
      return Response.json(
        { error: 'Database not configured' },
        { status: 500, headers: CORS }
      )
    }

    const result = await env.DB.prepare(
      `SELECT image_data, captured_at FROM scan_images WHERE id = ?`
    ).bind(imageId).first()

    if (!result) {
      return Response.json(
        { error: 'Image not found' },
        { status: 404, headers: CORS }
      )
    }

    // Return image data
    return Response.json(
      {
        imageId,
        imageBase64: result.image_data,
        capturedAt: result.captured_at
      },
      { headers: CORS }
    )
  } catch (err: any) {
    console.error('Get image error:', err)
    return Response.json(
      { error: 'Failed to fetch image', message: err.message },
      { status: 500, headers: CORS }
    )
  }
}
