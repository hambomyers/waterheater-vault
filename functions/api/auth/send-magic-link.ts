import { jsonResponse, CORS_HEADERS } from '../_utils/http'
import { signJwt } from '../_utils/auth'

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export const onRequest = async (context: any) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }
  if (context.request.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405)
  }

  const resendKey = context.env.RESEND_API_KEY
  const jwtSecret = context.env.JWT_SECRET
  if (!resendKey || !jwtSecret) {
    return jsonResponse({ error: 'missing_env', message: 'RESEND_API_KEY or JWT_SECRET not configured.' }, 500)
  }

  try {
    const body = await context.request.json()
    const email = String(body?.email || '').trim().toLowerCase()
    if (!isValidEmail(email)) {
      return jsonResponse({ error: 'invalid_email' }, 400)
    }

    const now = Math.floor(Date.now() / 1000)
    const token = await signJwt(
      {
        type: 'magic_link',
        email,
        jti: crypto.randomUUID(),
        exp: now + 60 * 15,
      },
      jwtSecret
    )

    const verifyUrl = new URL('/api/auth/verify', context.request.url)
    verifyUrl.searchParams.set('token', token)

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'WarrantyFile <onboarding@resend.dev>',
        to: [email],
        subject: 'Sign in to WarrantyFile',
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.5">
            <h2>Sign in to WarrantyFile</h2>
            <p>Tap the button below to securely sign in. This link expires in 15 minutes.</p>
            <p>
              <a href="${verifyUrl.toString()}" style="display:inline-block;padding:10px 16px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:9999px">Sign in with magic link</a>
            </p>
            <p>If you did not request this, you can ignore this email.</p>
          </div>
        `,
      }),
    })

    if (!resendRes.ok) {
      const errorBody = await resendRes.text().catch(() => '')
      return jsonResponse({ error: 'resend_error', message: errorBody || 'Failed to send email.' }, 502)
    }

    return jsonResponse({ ok: true })
  } catch (error: any) {
    return jsonResponse({ error: 'internal_error', message: error?.message || 'Unexpected error.' }, 500)
  }
}
