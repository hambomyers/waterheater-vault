import { makeSessionCookie, signJwt, verifyJwt } from '../_utils/auth'

export const onRequest = async (context: any) => {
  if (context.request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 })
  }

  const jwtSecret = context.env.JWT_SECRET
  const db = context.env.DB
  if (!jwtSecret || !db) {
    return new Response('Missing JWT_SECRET or DB binding.', { status: 500 })
  }

  const url = new URL(context.request.url)
  const token = url.searchParams.get('token')
  if (!token) {
    return new Response('Invalid link.', { status: 400 })
  }

  const payload = await verifyJwt<{ type: string; email: string; exp: number }>(token, jwtSecret)
  if (!payload || payload.type !== 'magic_link' || !payload.email) {
    return new Response('Magic link is invalid or expired.', { status: 401 })
  }

  const email = payload.email.toLowerCase()
  let user = await db.prepare('SELECT id, email FROM users WHERE email = ?').bind(email).first()

  if (!user) {
    const newId = crypto.randomUUID()
    await db.prepare('INSERT INTO users (id, email) VALUES (?, ?)').bind(newId, email).run()
    user = { id: newId, email }
  }

  const now = Math.floor(Date.now() / 1000)
  const sessionToken = await signJwt(
    {
      sub: user.id,
      email: user.email,
      type: 'session',
      exp: now + 60 * 60 * 24 * 30,
    },
    jwtSecret
  )

  const redirectTo = new URL('/', context.request.url)
  redirectTo.searchParams.set('auth', 'success')

  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectTo.toString(),
      'Set-Cookie': makeSessionCookie(sessionToken),
    },
  })
}
