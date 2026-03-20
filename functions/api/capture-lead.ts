interface LeadPayload {
  email: string
  brand?: string
  model?: string
  serialNumber?: string
  manufactureDate?: string
  ageYears?: number
  fuelType?: string
  estimatedReplacementCost?: number
  remainingLifeYears?: number
}

function urgencyLabel(remaining: number): { label: string; color: string; copy: string } {
  if (remaining < 2) return {
    label: 'CRITICAL',
    color: '#ef4444',
    copy: `Your heater has roughly ${remaining} year${remaining === 1 ? '' : 's'} left. When a water heater this age fails, it usually fails overnight — and emergency replacement runs 30% higher than a planned one. Now is the time to act.`
  }
  if (remaining < 5) return {
    label: 'AGING',
    color: '#f59e0b',
    copy: `Your heater is in its final years. Most homeowners in your situation wait until there's water on the floor. A planned replacement on your schedule saves $400–$600 vs an emergency call.`
  }
  return {
    label: 'HEALTHY',
    color: '#22c55e',
    copy: `Your heater still has plenty of life. A simple annual flush now extends that lifespan by 2–3 years and keeps the warranty valid. We'll remind you as you approach the 10-year mark.`
  }
}

function buildDayZeroEmail(lead: LeadPayload): string {
  const remaining = lead.remainingLifeYears ?? 5
  const age = lead.ageYears ?? 0
  const brand = lead.brand && lead.brand !== 'Unknown' ? lead.brand : 'Your'
  const model = lead.model && lead.model !== 'Unknown' ? ` ${lead.model}` : ''
  const cost = lead.estimatedReplacementCost ? `$${lead.estimatedReplacementCost.toLocaleString()}` : '~$1,500–$2,200'
  const fuel = lead.fuelType && lead.fuelType !== 'unknown' ? lead.fuelType.charAt(0).toUpperCase() + lead.fuelType.slice(1) : 'Standard'
  const { label, color, copy } = urgencyLabel(remaining)
  const bookUrl = `https://waterheaterplan.com/book?brand=${encodeURIComponent(lead.brand || '')}&age=${age}&fuel=${encodeURIComponent(lead.fuelType || '')}&cost=${lead.estimatedReplacementCost || ''}&remaining=${remaining}`
  const totalLife = age + remaining
  const pct = totalLife > 0 ? Math.round((remaining / totalLife) * 100) : 50
  const barFilled = Math.round(pct / 5)
  const bar = '█'.repeat(barFilled) + '░'.repeat(20 - barFilled)

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Header -->
        <tr><td style="padding-bottom:32px;border-bottom:1px solid #222;">
          <p style="margin:0;color:#0066ff;font-size:13px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;">Water Heater Plan</p>
          <p style="margin:4px 0 0;color:#888;font-size:13px;font-weight:300;">Central Virginia · waterheaterplan.com</p>
        </td></tr>

        <!-- Title -->
        <tr><td style="padding:32px 0 24px;">
          <h1 style="margin:0 0 6px;color:#fff;font-size:28px;font-weight:300;letter-spacing:-0.5px;">${brand}${model} Report</h1>
          <p style="margin:0;color:#666;font-size:15px;font-weight:300;">${fuel} water heater · ${age} years old · Scanned today</p>
        </td></tr>

        <!-- Life Gauge -->
        <tr><td style="background:#111;border:1px solid #222;border-radius:16px;padding:24px;margin-bottom:24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="color:#aaa;font-size:13px;font-weight:300;">Estimated remaining life</td>
              <td align="right" style="color:${color};font-size:13px;font-weight:500;">${remaining} yr · ${label}</td>
            </tr>
            <tr><td colspan="2" style="padding-top:10px;">
              <p style="margin:0;font-family:monospace;font-size:13px;color:${color};letter-spacing:1px;">${bar}</p>
            </td></tr>
            <tr><td colspan="2" style="padding-top:6px;">
              <table width="100%"><tr>
                <td style="color:#444;font-size:11px;">Age: ${age} yr</td>
                <td align="right" style="color:#444;font-size:11px;">Remaining: ${remaining} yr</td>
              </tr></table>
            </td></tr>
          </table>
        </td></tr>

        <!-- Key Facts -->
        <tr><td style="padding:24px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #222;border-radius:16px;overflow:hidden;">
            <tr style="border-bottom:1px solid #1a1a1a;">
              <td style="padding:14px 20px;color:#555;font-size:13px;font-weight:300;">Brand</td>
              <td style="padding:14px 20px;color:#fff;font-size:13px;font-weight:400;" align="right">${brand}</td>
            </tr>
            ${lead.model && lead.model !== 'Unknown' ? `<tr style="border-bottom:1px solid #1a1a1a;">
              <td style="padding:14px 20px;color:#555;font-size:13px;font-weight:300;">Model</td>
              <td style="padding:14px 20px;color:#fff;font-size:13px;font-weight:400;" align="right">${lead.model}</td>
            </tr>` : ''}
            <tr style="border-bottom:1px solid #1a1a1a;">
              <td style="padding:14px 20px;color:#555;font-size:13px;font-weight:300;">Age</td>
              <td style="padding:14px 20px;color:#fff;font-size:13px;font-weight:400;" align="right">${age} years</td>
            </tr>
            <tr>
              <td style="padding:14px 20px;color:#555;font-size:13px;font-weight:300;">Replacement cost</td>
              <td style="padding:14px 20px;color:#0066ff;font-size:13px;font-weight:500;" align="right">${cost} installed</td>
            </tr>
          </table>
        </td></tr>

        <!-- Urgency Copy -->
        <tr><td style="padding:0 0 32px;">
          <p style="margin:0;color:#aaa;font-size:15px;font-weight:300;line-height:1.7;">${copy}</p>
        </td></tr>

        <!-- CTA -->
        <tr><td align="center" style="padding-bottom:40px;">
          <a href="${bookUrl}" style="display:inline-block;background:#0066ff;color:#fff;text-decoration:none;font-size:15px;font-weight:500;padding:16px 40px;border-radius:100px;">
            Schedule Service Before It Fails →
          </a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="border-top:1px solid #1a1a1a;padding-top:24px;">
          <p style="margin:0 0 4px;color:#444;font-size:12px;font-weight:300;">Water Heater Plan · Central Virginia</p>
          <p style="margin:0;color:#333;font-size:12px;font-weight:300;">You received this because you scanned your water heater at scan.waterheaterplan.com. We'll send one reminder when your heater approaches its 10-year mark — that's it.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export const onRequest = async (context: any) => {
  const { request, env } = context

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  }

  try {
    const lead: LeadPayload = await request.json()

    if (!lead.email || !lead.email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Invalid email address.' }), { status: 400, headers: corsHeaders })
    }

    const email = lead.email.toLowerCase().trim()

    if (env.DB) {
      await env.DB.prepare(`
        INSERT OR IGNORE INTO leads
          (id, email, brand, model, serial_number, manufacture_date, age_years, fuel_type, replacement_cost, remaining_life_years, source, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scan', ?)
      `).bind(
        crypto.randomUUID(),
        email,
        lead.brand || null,
        lead.model || null,
        lead.serialNumber || null,
        lead.manufactureDate || null,
        lead.ageYears ?? null,
        lead.fuelType || null,
        lead.estimatedReplacementCost ?? null,
        lead.remainingLifeYears ?? null,
        new Date().toISOString()
      ).run()
    }

    if (env.RESEND_API_KEY) {
      const brand = lead.brand && lead.brand !== 'Unknown' ? lead.brand : 'Water Heater'
      const age = lead.ageYears ?? 0
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Water Heater Plan <reports@waterheaterplan.com>',
          to: email,
          subject: `Your ${brand} Report — ${age} years old`,
          html: buildDayZeroEmail(lead),
        }),
      })
    }

    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders })

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: corsHeaders })
  }
}
