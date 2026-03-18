import { clearSessionCookie, requireSessionUser } from '../_utils/auth'
import { CORS_HEADERS, jsonResponse } from '../_utils/http'

export const onRequest = async (context: any) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }
  if (context.request.method !== 'GET') {
    return jsonResponse({ error: 'method_not_allowed' }, 405)
  }

  const jwtSecret = context.env.JWT_SECRET
  if (!jwtSecret) return jsonResponse({ error: 'missing_env' }, 500)

  const user = await requireSessionUser(context.request, jwtSecret)
  if (!user) {
    return jsonResponse({ user: null }, 401, { 'Set-Cookie': clearSessionCookie() })
  }

  return jsonResponse({ user })
}
