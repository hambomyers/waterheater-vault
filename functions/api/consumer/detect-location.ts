export const onRequest = async (context: any) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
  if (context.request.method === 'OPTIONS') return new Response(null, { headers: cors })

  const cf = (context.request as any).cf ?? {}

  return new Response(
    JSON.stringify({
      city: cf.city ?? null,
      postalCode: cf.postalCode ?? null,
      region: cf.region ?? null,
      country: cf.country ?? null,
    }),
    { headers: { 'Content-Type': 'application/json', ...cors } }
  )
}
