// Debug endpoint — returns env var status WITHOUT calling any APIs
// GET /api/debug/env
export const onRequestGet = async (context: any) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  }

  const env = context.env

  return new Response(
    JSON.stringify({
      keysPresent: {
        OPENROUTER_API_KEY: !!env.OPENROUTER_API_KEY,
        GROK_API_KEY: !!env.GROK_API_KEY,
        GOOGLE_VISION_API_KEY: !!env.GOOGLE_VISION_API_KEY,
        BRAVE_API_KEY: !!env.BRAVE_API_KEY,
      },
      keyFirstChars: {
        OPENROUTER_API_KEY: env.OPENROUTER_API_KEY ? env.OPENROUTER_API_KEY.slice(0, 12) + '...' : null,
        GROK_API_KEY: env.GROK_API_KEY ? env.GROK_API_KEY.slice(0, 8) + '...' : null,
      },
    }, null, 2),
    { headers: corsHeaders }
  )
}
