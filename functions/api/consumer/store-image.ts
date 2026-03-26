/**
 * Store Image Endpoint - Production Grade
 * Uploads full image to R2 bucket + stores metadata in D1
 * Returns imageId for AI model processing via R2 URLs
 * This must run BEFORE any AI model processing
 *
 * Preferred client: POST raw body with Content-Type: image/jpeg | image/png | image/webp
 * Legacy: multipart field "image" (base64) or JSON { "image": "<base64>" }
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

function extensionForContentType(ct: string): string {
  const t = ct.split(';')[0].trim().toLowerCase()
  if (t === 'image/png') return 'png'
  if (t === 'image/webp') return 'webp'
  return 'jpg'
}

function previewBase64FromBytes(buf: Uint8Array, maxBytes: number): string {
  const slice = buf.byteLength <= maxBytes ? buf : buf.subarray(0, maxBytes)
  let binary = ''
  const chunk = 8192
  for (let i = 0; i < slice.length; i += chunk) {
    binary += String.fromCharCode.apply(null, slice.subarray(i, i + chunk) as unknown as number[])
  }
  return btoa(binary)
}

async function hashBytes(buf: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buf)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
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

    const contentType = request.headers.get('content-type') || ''
    let imageBuffer: Uint8Array
    let objectContentType: string
    let previewData: string

    if (contentType.includes('application/json')) {
      const body = (await request.json()) as { image?: string }
      const raw = body?.image
      if (typeof raw !== 'string' || !raw.trim()) {
        return Response.json(
          { error: 'No image provided', details: 'JSON body missing image string' },
          { status: 400, headers: CORS }
        )
      }
      const imageBase64 = normalizeBase64Image(raw)
      if (!imageBase64) {
        return Response.json(
          { error: 'Invalid image data', details: 'Empty base64 payload' },
          { status: 400, headers: CORS }
        )
      }
      try {
        imageBuffer = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0))
      } catch {
        return Response.json(
          { error: 'Invalid image data', details: 'Could not decode base64' },
          { status: 400, headers: CORS }
        )
      }
      objectContentType = 'image/jpeg'
      previewData = imageBase64.substring(0, 2048)
    } else if (contentType.includes('multipart/form-data')) {
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
      try {
        imageBuffer = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0))
      } catch {
        return Response.json(
          { error: 'Invalid image data', details: 'Could not decode base64' },
          { status: 400, headers: CORS }
        )
      }
      objectContentType = 'image/jpeg'
      previewData = imageBase64.substring(0, 2048)
    } else if (/^\s*image\/(jpeg|jpg|png|webp)/i.test(contentType)) {
      const ab = await request.arrayBuffer()
      if (!ab || ab.byteLength === 0) {
        return Response.json(
          { error: 'No image provided', details: 'Empty request body' },
          { status: 400, headers: CORS }
        )
      }
      imageBuffer = new Uint8Array(ab)
      const ct = contentType.split(';')[0].trim().toLowerCase()
      objectContentType = ct === 'image/jpg' ? 'image/jpeg' : ct
      previewData = previewBase64FromBytes(imageBuffer, 1536)
    } else {
      return Response.json(
        {
          error: 'Unsupported content type',
          details:
            'Send Content-Type: image/jpeg, image/png, or image/webp with raw bytes, or multipart/JSON with base64',
        },
        { status: 415, headers: CORS }
      )
    }

    const imageId = crypto.randomUUID()
    const timestamp = new Date().toISOString()
    const ext = extensionForContentType(objectContentType)
    const r2Key = `scans/${imageId}.${ext}`
    const imageHash = await hashBytes(imageBuffer)

    try {
      await env.BUCKET.put(r2Key, imageBuffer, {
        httpMetadata: {
          contentType: objectContentType,
        },
      })
    } catch (r2Err: any) {
      console.error('[STORE-IMAGE] R2 upload error:', r2Err)
      return Response.json(
        { error: 'Storage error', message: r2Err?.message ?? String(r2Err) },
        { status: 500, headers: CORS }
      )
    }

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
        {
          error: 'Database error',
          message: dbErr?.message ?? String(dbErr),
        },
        { status: 500, headers: CORS }
      )
    }

    return Response.json(
      {
        imageId,
        timestamp,
        size: imageBuffer.length,
        r2Key,
        hash: imageHash,
        message: 'Image uploaded to R2 and metadata saved to D1',
      },
      { headers: CORS }
    )
  } catch (err: any) {
    console.error('[STORE-IMAGE] Unexpected error:', err)
    return Response.json(
      {
        error: 'Failed to store image',
        message: err?.message ?? String(err),
      },
      { status: 500, headers: CORS }
    )
  }
}
