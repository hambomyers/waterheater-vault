export const onRequest = async (context: any) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  if (context.request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const db = context.env.DB
    if (!db) {
      // DB not yet configured — return empty array gracefully
      return new Response(JSON.stringify([]), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const { results } = await db
      .prepare(
        `SELECT id, businessName, phone, zip, rating, reviewCount, active
         FROM pros
         WHERE active = 1
         ORDER BY rating DESC, reviewCount DESC
         LIMIT 200`
      )
      .all()

    return new Response(JSON.stringify(results ?? []), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (err: any) {
    console.error('Directory function error:', err)
    // Table may not exist yet — return empty array rather than 500
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
}
