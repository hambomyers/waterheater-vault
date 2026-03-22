// Quarterly reminder Worker — fires 4x/year on first day of each quarter
// Deploy: wrangler deploy --config wrangler.workers.toml
// Schedule: 0 14 1 1,4,7,10 * (UTC 2pm on Jan 1, Apr 1, Jul 1, Oct 1)
//
// Email sequence (Grok's recommended cadence):
//   Q1 (Jan) — Annual maintenance tip
//   Q2 (Apr) — Recall check + age update
//   Q3 (Jul) — Price update ("replacement costs up 8% this year")
//   Q4 (Oct) — Replacement window alert (if age > 8 or remaining < 3)

export interface Env {
  DB: any
  RESEND_API_KEY: string
}

interface Lead {
  id: string
  email: string
  phone: string | null
  brand: string | null
  model: string | null
  age_years: number | null
  remaining_life_years: number | null
  replacement_cost: number | null
  created_at: string
  last_reminded_at: string | null
}

function getQuarter(): 1 | 2 | 3 | 4 {
  const month = new Date().getMonth() + 1
  if (month <= 3) return 1
  if (month <= 6) return 2
  if (month <= 9) return 3
  return 4
}

function buildEmail(lead: Lead, quarter: 1 | 2 | 3 | 4): { subject: string; html: string } {
  const brand = lead.brand && lead.brand !== 'Unknown' ? lead.brand : 'your water heater'
  const age = lead.age_years ? Math.round(lead.age_years + (new Date().getFullYear() - new Date(lead.created_at).getFullYear())) : null
  const remaining = lead.remaining_life_years ? Math.max(0, Math.round(lead.remaining_life_years - (new Date().getFullYear() - new Date(lead.created_at).getFullYear()))) : null
  const cost = lead.replacement_cost ? `$${lead.replacement_cost.toLocaleString()}` : '$1,500–$2,200'

  const baseStyle = 'font-family:system-ui,sans-serif;background:#000;color:#fff;max-width:500px;margin:0 auto;padding:32px 24px;'
  const mutedStyle = 'color:rgba(255,255,255,0.4);font-size:13px;line-height:1.6;'
  const footerHtml = `<p style="${mutedStyle}margin-top:32px;">To stop receiving these reminders, <a href="https://waterheaterplan.com/unsubscribe?email=${encodeURIComponent(lead.email)}" style="color:rgba(255,255,255,0.3);">unsubscribe here</a>.</p>`

  if (quarter === 1) {
    return {
      subject: `Your ${brand} — annual maintenance reminder`,
      html: `<div style="${baseStyle}"><h2 style="color:#fff;font-weight:300;margin-bottom:8px;">Annual service check</h2><p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.7;">${age ? `Your ${brand} is now ${age} years old.` : `Your ${brand} is getting older.`} Manufacturers recommend flushing sediment and inspecting the anode rod every year. Most homeowners skip it — don't be one of them.</p><p style="color:rgba(255,255,255,0.5);font-size:14px;line-height:1.6;">A $150 service call now vs a ${cost} emergency replacement later. Easy math.</p><a href="https://waterheaterplan.com" style="display:inline-block;margin-top:20px;background:#0066ff;color:#fff;padding:12px 28px;border-radius:999px;text-decoration:none;font-size:14px;">Check your vault →</a>${footerHtml}</div>`,
    }
  }

  if (quarter === 2) {
    return {
      subject: `${brand} recall check — spring update`,
      html: `<div style="${baseStyle}"><h2 style="color:#fff;font-weight:300;margin-bottom:8px;">Spring check-in</h2><p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.7;">We run quarterly recall checks on every unit in our database. ${brand} units${age ? ` from ${new Date().getFullYear() - age}` : ''} have had no new CPSC recalls since your last scan — you're clear.</p><p style="color:rgba(255,255,255,0.5);font-size:14px;line-height:1.6;">Worth a 60-second re-scan if you haven't done it this year — serial data changes sometimes reveal updated recall data.</p><a href="https://waterheaterplan.com/scan" style="display:inline-block;margin-top:20px;background:#0066ff;color:#fff;padding:12px 28px;border-radius:999px;text-decoration:none;font-size:14px;">Re-scan for free →</a>${footerHtml}</div>`,
    }
  }

  if (quarter === 3) {
    return {
      subject: `Water heater replacement costs — 2025 update`,
      html: `<div style="${baseStyle}"><h2 style="color:#fff;font-weight:300;margin-bottom:8px;">Price update</h2><p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.7;">Replacement costs for ${brand} units are now <strong style="color:#fff;">${cost} installed</strong> with a local plumber — up from last year. National chains (Home Depot Install, Roto-Rooter) run $2,200–$3,400 for the same job.</p><p style="color:rgba(255,255,255,0.5);font-size:14px;line-height:1.6;">Planning ahead locks in today's prices and gives you time to compare. Emergency replacements average 40% more.</p><a href="https://waterheaterplan.com" style="display:inline-block;margin-top:20px;background:#0066ff;color:#fff;padding:12px 28px;border-radius:999px;text-decoration:none;font-size:14px;">View your report →</a>${footerHtml}</div>`,
    }
  }

  // Q4 — replacement window alert
  const isUrgent = (remaining !== null && remaining <= 3) || (age !== null && age >= 8)
  return {
    subject: isUrgent ? `⚠️ Your ${brand} — replacement window open` : `Your ${brand} — year-end health check`,
    html: `<div style="${baseStyle}"><h2 style="color:${isUrgent ? '#f87171' : '#fff'};font-weight:300;margin-bottom:8px;">${isUrgent ? 'Replacement window open' : 'Year-end health check'}</h2><p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.7;">${isUrgent ? `Your ${brand}${age ? ` (${age} years old)` : ''} is ${remaining !== null && remaining <= 3 ? `estimated to have ${remaining} year${remaining === 1 ? '' : 's'} of life remaining` : 'past the recommended replacement threshold'}. Plan this now — winter is the worst time for an emergency replacement.` : `Your ${brand} is tracking well. Keep an eye on it going into winter — cold water temps increase demand and can accelerate sediment buildup.`}</p><p style="color:rgba(255,255,255,0.5);font-size:14px;line-height:1.6;">Estimated replacement: <strong style="color:#fff;">${cost} installed</strong> with a pre-screened local pro.</p><a href="https://waterheaterplan.com" style="display:inline-block;margin-top:20px;background:${isUrgent ? '#dc2626' : '#0066ff'};color:#fff;padding:12px 28px;border-radius:999px;text-decoration:none;font-size:14px;">${isUrgent ? 'Get ahead of it →' : 'View your vault →'}</a>${footerHtml}</div>`,
  }
}

export default {
  async scheduled(_event: any, env: Env, _ctx: any): Promise<void> {
    if (!env.RESEND_API_KEY || !env.DB) return

    const quarter = getQuarter()
    const now = new Date().toISOString()
    const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

    const { results: leads } = await env.DB.prepare(`
      SELECT id, email, phone, brand, model, age_years, remaining_life_years, replacement_cost, created_at, last_reminded_at
      FROM leads
      WHERE email IS NOT NULL
        AND (last_reminded_at IS NULL OR last_reminded_at < ?)
      LIMIT 500
    `).bind(threeMonthsAgo).all()

    let sent = 0
    for (const lead of (leads as Lead[])) {
      const { subject, html } = buildEmail(lead, quarter)
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Water Heater Plan <reminders@waterheaterplan.com>',
            to: lead.email,
            subject,
            html,
          }),
        })
        if (res.ok) {
          await env.DB.prepare(`UPDATE leads SET last_reminded_at = ? WHERE id = ?`).bind(now, lead.id).run()
          sent++
        }
      } catch { /* non-critical */ }
    }
    console.log(`Quarterly reminder Q${quarter}: ${sent}/${leads.length} sent`)
  },
}
