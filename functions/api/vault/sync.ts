import { requireSessionUser } from '../_utils/auth'
import { CORS_HEADERS, jsonResponse } from '../_utils/http'

export const onRequest = async (context: any) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  const jwtSecret = context.env.JWT_SECRET
  const db = context.env.DB
  if (!jwtSecret || !db) return jsonResponse({ error: 'missing_env' }, 500)

  const user = await requireSessionUser(context.request, jwtSecret)
  if (!user) return jsonResponse({ error: 'unauthorized' }, 401)

  if (context.request.method === 'GET') {
    const rows = await db
      .prepare('SELECT id, data, created_at, updated_at FROM vault_items WHERE user_id = ? ORDER BY updated_at DESC')
      .bind(user.id)
      .all()

    const items = (rows.results || [])
      .map((row: any) => {
        try {
          const parsed = JSON.parse(row.data)
          return {
            ...parsed,
            id: row.id,
            dateAdded: parsed.dateAdded || row.created_at,
            lastUpdated: parsed.lastUpdated || row.updated_at,
          }
        } catch {
          return null
        }
      })
      .filter(Boolean)

    return jsonResponse({ items })
  }

  if (context.request.method === 'POST') {
    const body = await context.request.json().catch(() => null)
    const item = body?.item
    if (!item?.id) {
      return jsonResponse({ error: 'invalid_item' }, 400)
    }

    const now = new Date().toISOString()
    const dateAdded = item.dateAdded || now
    const lastUpdated = item.lastUpdated || now
    const serialized = JSON.stringify({ ...item, dateAdded, lastUpdated })

    await db
      .prepare(
        `INSERT INTO vault_items (id, user_id, data, created_at, updated_at)
         VALUES (?, ?, json(?), ?, ?)
         ON CONFLICT(user_id, id) DO UPDATE SET
           data = excluded.data,
           updated_at = excluded.updated_at`
      )
      .bind(item.id, user.id, serialized, dateAdded, lastUpdated)
      .run()

    return jsonResponse({ ok: true })
  }

  return jsonResponse({ error: 'method_not_allowed' }, 405)
}
