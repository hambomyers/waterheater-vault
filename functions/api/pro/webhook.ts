// Stripe webhook — activates/deactivates pros automatically
// Events: checkout.session.completed → active=1, customer.subscription.deleted → active=0
// Setup: Stripe → Developers → Webhooks → https://waterheaterplan.com/api/pro/webhook
//        Events: checkout.session.completed, customer.subscription.deleted, customer.subscription.updated

async function verifyStripeSignature(
  payload: string,
  sigHeader: string,
  secret: string
): Promise<boolean> {
  const parts = sigHeader.split(',').reduce((acc: Record<string, string>, part) => {
    const [k, v] = part.split('=')
    acc[k] = v
    return acc
  }, {})
  const timestamp = parts['t']
  const signature = parts['v1']
  if (!timestamp || !signature) return false

  const signedPayload = `${timestamp}.${payload}`
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload))
  const expected = Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2, '0')).join('')
  return expected === signature
}

export const onRequest = async (context: any) => {
  const { request, env } = context

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const webhookSecret = env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), { status: 500 })
  }

  const sigHeader = request.headers.get('stripe-signature') || ''
  const payload = await request.text()

  const valid = await verifyStripeSignature(payload, sigHeader, webhookSecret)
  if (!valid) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 })
  }

  let event: any
  try { event = JSON.parse(payload) }
  catch { return new Response('Bad JSON', { status: 400 }) }

  if (!env.DB) return new Response(JSON.stringify({ received: true }), { status: 200 })

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const meta = session.metadata || {}
      const customerId = session.customer
      const subscriptionId = session.subscription

      if (meta.businessName && meta.phone && meta.zip) {
        await env.DB.prepare(`
          INSERT INTO pros (id, businessName, phone, zip, gbpUrl, rating, reviewCount, stripeCustomerId, stripeSubscriptionId, active, lastScreened, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, datetime('now'), datetime('now'))
          ON CONFLICT(id) DO UPDATE SET
            stripeCustomerId = excluded.stripeCustomerId,
            stripeSubscriptionId = excluded.stripeSubscriptionId,
            active = 1,
            updatedAt = datetime('now')
        `).bind(
          crypto.randomUUID(),
          meta.businessName,
          meta.phone,
          meta.zip,
          meta.gbpUrl || null,
          meta.rating ? parseFloat(meta.rating) : 0,
          0,
          customerId || null,
          subscriptionId || null,
          new Date().toISOString()
        ).run()
      }
    }

    if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
      const sub = event.data.object
      const isActive = sub.status === 'active' || sub.status === 'trialing'
      await env.DB.prepare(
        `UPDATE pros SET active = ?, updatedAt = datetime('now') WHERE stripeSubscriptionId = ?`
      ).bind(isActive ? 1 : 0, sub.id).run()
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    })
  } catch (err: any) {
    console.error('Webhook DB error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
