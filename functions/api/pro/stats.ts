export const onRequest = async (context: any) => {
  const { request, env } = context

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: { ...corsHeaders, 'Access-Control-Allow-Methods': 'GET, OPTIONS' } })
  }

  const url = new URL(request.url)
  const zip = url.searchParams.get('zip')?.trim()

  if (!zip) {
    return new Response(JSON.stringify({ error: 'zip required' }), { status: 400, headers: corsHeaders })
  }

  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'DB not available' }), { status: 503, headers: corsHeaders })
  }

  try {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()

    const [thisWeek, lastWeek, critical, recent] = await Promise.all([
      env.DB.prepare(
        `SELECT COUNT(*) as count FROM scan_events WHERE zip = ? AND scanned_at >= ?`
      ).bind(zip, weekAgo).first() as Promise<{ count: number } | null>,

      env.DB.prepare(
        `SELECT COUNT(*) as count FROM scan_events WHERE zip = ? AND scanned_at >= ? AND scanned_at < ?`
      ).bind(zip, twoWeeksAgo, weekAgo).first() as Promise<{ count: number } | null>,

      env.DB.prepare(
        `SELECT COUNT(*) as count FROM scan_events WHERE zip = ? AND scanned_at >= ? AND remaining_life_years <= 3`
      ).bind(zip, weekAgo).first() as Promise<{ count: number } | null>,

      env.DB.prepare(
        `SELECT brand, age_years, remaining_life_years, scanned_at
         FROM scan_events WHERE zip = ? ORDER BY scanned_at DESC LIMIT 10`
      ).bind(zip).all(),
    ])

    return new Response(JSON.stringify({
      zip,
      thisWeek: thisWeek?.count ?? 0,
      lastWeek: lastWeek?.count ?? 0,
      criticalThisWeek: critical?.count ?? 0,
      recentScans: recent?.results ?? [],
    }), { headers: corsHeaders })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders })
  }
}
