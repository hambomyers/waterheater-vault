export const onRequest = async (context: any) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  if (context.request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const body = await context.request.json()
    const { businessName, phone, zip, gbpUrl, rating, billingCycle } = body

    if (!businessName || !phone || !zip) {
      return new Response(
        JSON.stringify({ error: 'businessName, phone, and zip are required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const stripeKey = context.env.STRIPE_SECRET_KEY
    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: 'Stripe not configured', message: 'STRIPE_SECRET_KEY is not set.' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const priceId = billingCycle === 'annual'
      ? context.env.STRIPE_PRICE_ID_ANNUAL
      : context.env.STRIPE_PRICE_ID_MONTHLY

    if (!priceId) {
      return new Response(
        JSON.stringify({ error: 'Price not configured', message: `STRIPE_PRICE_ID_${(billingCycle || 'monthly').toUpperCase()} is not set.` }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const origin = context.request.headers.get('origin') || 'https://waterheaterplan.com'

    const params = new URLSearchParams({
      mode: 'subscription',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      success_url: `${origin}/pro/onboard?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pro/onboard?cancelled=1`,
      'metadata[businessName]': businessName,
      'metadata[phone]': phone,
      'metadata[zip]': zip,
      'metadata[gbpUrl]': gbpUrl || '',
      'metadata[rating]': String(rating || ''),
    })

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    if (!stripeRes.ok) {
      const errBody = await stripeRes.text()
      console.error('Stripe error:', errBody)
      return new Response(
        JSON.stringify({ error: 'stripe_error', message: 'Could not create checkout session.' }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const session = await stripeRes.json()
    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  } catch (err: any) {
    console.error('Checkout function error:', err)
    return new Response(
      JSON.stringify({ error: 'internal_error', message: err.message || 'Unexpected error.' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }
}
