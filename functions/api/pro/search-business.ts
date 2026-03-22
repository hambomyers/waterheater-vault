export const onRequest = async (context: any) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
  if (context.request.method === 'OPTIONS') return new Response(null, { headers: cors })

  const url = new URL(context.request.url)
  const query = url.searchParams.get('q')?.trim()
  const city = url.searchParams.get('city')?.trim() ?? ''

  if (!query || query.length < 2) {
    return new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json', ...cors } })
  }

  const braveKey = context.env.BRAVE_API_KEY
  if (!braveKey) {
    return new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json', ...cors } })
  }

  try {
    const searchQuery = city
      ? `${query} plumber water heater ${city} site:google.com/maps OR google.com/maps`
      : `${query} plumber water heater google business profile`

    const braveRes = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(searchQuery)}&count=6&search_lang=en&country=US`,
      { headers: { Accept: 'application/json', 'Accept-Encoding': 'gzip', 'X-Subscription-Token': braveKey } }
    )

    if (!braveRes.ok) {
      return new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json', ...cors } })
    }

    const data = await braveRes.json()
    const webResults: any[] = data?.web?.results ?? []

    const PHONE_RE = /\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}/

    const results = webResults
      .filter(r => r.title && r.url)
      .map(r => {
        const snippet: string = r.description ?? r.extra_snippets?.[0] ?? ''
        const phoneMatch = snippet.match(PHONE_RE)
        const isGbp = /google\.com\/maps|maps\.app\.goo\.gl|g\.page/i.test(r.url)
        return {
          title: r.title.replace(/\s*-\s*Google Maps.*$/i, '').replace(/\s*\|.*$/, '').trim(),
          url: r.url,
          snippet,
          phone: phoneMatch ? phoneMatch[0] : null,
          isGbp,
          gbpUrl: isGbp ? r.url : null,
          rating: null as number | null,
        }
      })
      .filter(r => r.title.length > 2)
      .slice(0, 5)

    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json', ...cors },
    })
  } catch (err: any) {
    console.error('search-business error:', err)
    return new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json', ...cors } })
  }
}
