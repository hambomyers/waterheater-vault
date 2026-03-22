export const onRequest = async (context: any) => {
  const { request, env } = context

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: { ...corsHeaders, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }
    })
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders })
  }

  try {
    const body = await request.json()
    const { businessName, phone, zip, gbpUrl, brand, model, ageYears, remainingLifeYears, smsConsent, ref } = body

    if (!businessName?.trim() || !phone?.trim()) {
      return new Response(JSON.stringify({ error: 'Business name and phone are required.' }), { status: 400, headers: corsHeaders })
    }

    if (env.DB) {
      await env.DB.prepare(`
        INSERT INTO pro_claims (id, business_name, phone, zip, gbp_url, brand, model, age_years, remaining_life_years, sms_consent, ref, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'claimed', ?)
      `).bind(
        crypto.randomUUID(),
        businessName.trim(),
        phone.trim(),
        zip || null,
        gbpUrl || null,
        brand || null,
        model || null,
        ageYears ?? null,
        remainingLifeYears ?? null,
        smsConsent ? 1 : 0,
        ref || null,
        new Date().toISOString()
      ).run()
    }

    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders })

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: corsHeaders })
  }
}
