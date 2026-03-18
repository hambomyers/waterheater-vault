import { requireSessionUser } from '../../_utils/auth'
import { CORS_HEADERS, jsonResponse } from '../../_utils/http'

export const onRequest = async (context: any) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  if (context.request.method !== 'DELETE') {
    return jsonResponse({ error: 'method_not_allowed' }, 405)
  }

  const jwtSecret = context.env.JWT_SECRET
  const db = context.env.DB
  if (!jwtSecret || !db) return jsonResponse({ error: 'missing_env' }, 500)

  const user = await requireSessionUser(context.request, jwtSecret)
  if (!user) return jsonResponse({ error: 'unauthorized' }, 401)

  const itemId = context.params?.id
  if (!itemId) return jsonResponse({ error: 'missing_id' }, 400)

  await db
    .prepare('DELETE FROM vault_items WHERE id = ? AND user_id = ?')
    .bind(itemId, user.id)
    .run()

  return jsonResponse({ ok: true })
}
