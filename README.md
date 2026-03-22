# WaterHeaterVault

**The seed of the Residential Mechanical Longevity OS.**  
*One photo of any data plate today becomes the first node in every American home's mechanical digital twin.*

America's 140 million homes are entering a 15–25 year mechanical renewal supercycle. The system for managing it — Google searches, plumber roulette, Sunday floods — is medieval. We are building the digital-twin layer that maps the failure curves of every mechanical system in every home, starting with the easiest serial number on Earth: the water heater data plate.

Every scan is a new node. Every node is permanent. The homeowner owns it forever.

*Early revenue:* `waterheaterplan.com/pro` — $49/mo white-label leads for screened local contractors  
*The company:* longitudinal serial-level data on every major home system, queryable by insurers, utilities, manufacturers, and home robots

---

## How It Works (Year 1 — Water Heater Wedge)

```
Homeowner points phone at data plate (free, always)
       ↓
Grok reads serial → age · life · fair price breakdown · recalls · rebates
       ↓
First node in home's mechanical digital twin saved to D1
       ↓
"Text my plumber this report" → plumber gets personal invite link
       ↓
Plumber visits /pro/claim → free unit claim → taste value
       ↓
Upsell: $49/mo → leads from every scan in their zip
       ↓
Year 1 reminder: "Your Navien turns 8. Mike's Plumbing recommends a check."
Year 3 alert:    "Replacement window open. Fair price: $1,700–$2,100."
```

**The moat is not the scanner. It is the annual loop and the longitudinal data it produces.**  
**Pro gate:** Grok AI screens Google Business Profile reviews (4.5+ stars required). Auto-pause if re-screen fails.

---

## What It Does

**Label-first** two-shot scan — Shot 1 is the data plate (authoritative, required). Shot 2 is the full unit (optional, skip button available). **Grok Vision AI** decodes the serial number using brand-specific manufacture date rules, estimates remaining life, calculates a full price breakdown, checks CPSC recall status, and surfaces real manual + warranty links via **Brave Search.**

Results page shows:
- Brand · Model · Serial · Manufacture Date · Age · Fuel Type
- Remaining Life Gauge (color-coded: green/amber/red)
- **Fair Price Breakdown** — unit cost, labor, planned total (green) vs emergency total (red) vs national chain reference
- Rebate Maximizer Card (live utility rebate via Brave Search)
- CPSC Recall Status
- One-click PDF Report Card (branded with matched pro)
- **"Text my plumber this report"** — personal homeowner invite (not a sales pitch)
- TCPA-compliant email/SMS capture — explicit written consent checkbox, phone field
- Direct links: owner manual, warranty terms, serial decoder, rebate program

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 — static export, all `use client` |
| Styling | Tailwind CSS — `#000000` black, white text, `#0066ff` blue accent |
| On-device AI | Tesseract.js OCR (offline fallback, ~4MB) |
| Cloud AI | Grok Vision (xAI API) — serial decode, age, cost, docs, review screening |
| Docs search | Brave Search API — live verified URLs (never hardcoded) |
| Storage | IndexedDB (offline-first) + Cloudflare D1 (cloud sync + leads + pros) |
| Auth | Magic-link via Resend + JWT (no Clerk, no OAuth) |
| Payments | Stripe Checkout — Pro $49/mo or $499/yr |
| PDF | html2canvas + jsPDF — client-side report card generation |
| Deployment | Cloudflare Pages — static export + CF Pages Functions |
| PWA | Service worker + manifest, installable on iOS/Android |

---

## Routes

| Route | What it does |
|-------|-------------|
| `/` | **Homeowner landing** — headline + Scan CTA + proof pills + pro link |
| `/scan` | Label-first guided scan — data plate required, unit overview optional |
| `/results` | Results: gauge, price breakdown, rebate card, PDF, invite, TCPA capture |
| `/vault` | Saved heaters — recall badges, life gauge, list |
| `/vault/item?id=xxx` | Item detail — inline edit, recall banner, PDF, invite |
| `/pro` | **Pro marketing page** — $49/mo, how it works, pricing, quality gate |
| `/pro/claim` | **Free plumber claim** — invited plumber claims unit, TCPA consent, upsell |
| `/pro/onboard` | Full pro signup: GBP URL → Grok AI screen → Stripe $49/mo checkout |
| `/pro/directory` | Public searchable directory of screened pros |
| `/pro/dashboard` | Pro sees weekly scan counts by zip |
| `/debug` | Dev pipeline test (NODE_ENV guard needed) |

---

## Dev Commands

```bash
pnpm install
pnpm dev          # localhost:3000
pnpm build        # Static export → out/
pnpm icons        # Regenerate all icons from SVG (run after logo changes)
```

---

## New npm Packages Required

```bash
pnpm add html2canvas jspdf
pnpm add @stripe/stripe-js
```

---

## Deployment

Cloudflare Pages auto-deploys from `main` branch.  
Primary URL: **waterheaterplan.com** (homeowner landing at `/`, pro marketing at `/pro`)  
Alias: **scan.waterheaterplan.com** → same app

**Required secrets — CF Pages → Settings → Environment Variables:**

| Key | Purpose |
|-----|---------|
| `GROK_API_KEY` | xAI Grok Vision API + review screening |
| `BRAVE_API_KEY` | Brave Search — live doc, decoder, rebate, review URLs |
| `RESEND_API_KEY` | Resend.com — magic link + lead emails |
| `JWT_SECRET` | Sign/verify tokens (32+ chars) |
| `STRIPE_SECRET_KEY` | Stripe server-side — create checkout sessions |
| `STRIPE_PRICE_ID_MONTHLY` | Stripe Price ID for $49/mo Pro plan |
| `STRIPE_PRICE_ID_ANNUAL` | Stripe Price ID for $499/yr Pro plan |
| `DB` | Cloudflare D1 binding — users, vault_items, leads, pros |

### Stripe Setup (one-time — required before `/pro/onboard` works)

1. [dashboard.stripe.com/products](https://dashboard.stripe.com/products) → **Add product** → `WaterHeaterVault Pro`
2. Add price: **$49.00 / month** recurring → copy `price_...` → `STRIPE_PRICE_ID_MONTHLY`
3. Add price: **$499.00 / year** recurring → copy `price_...` → `STRIPE_PRICE_ID_ANNUAL`
4. [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys) → copy secret key → `STRIPE_SECRET_KEY`
5. Add all three to CF Pages env vars → redeploy

> Testing? Use `sk_test_...` keys. Test card: `4242 4242 4242 4242`.

**Stripe webhook** (Sprint 3 — activates/deactivates pros automatically):
- Stripe → Developers → Webhooks → `https://scan.waterheaterplan.com/api/pro/webhook`
- Events: `checkout.session.completed`, `customer.subscription.deleted`

### D1 Migrations

```bash
# Run in order after cloning:
wrangler d1 execute waterheater-vault --file=migrations/0001_auth_sync.sql --remote
wrangler d1 execute waterheater-vault --file=migrations/0002_leads.sql --remote
wrangler d1 execute waterheater-vault --file=migrations/0003_pros.sql --remote
wrangler d1 execute waterheater-vault --file=migrations/0004_scan_events.sql --remote
wrangler d1 execute waterheater-vault --file=migrations/0005_pro_claims.sql --remote
wrangler d1 execute waterheater-vault --file=migrations/0006_leads_sms.sql --remote
```

| Migration | What | Status |
|-----------|------|--------|
| `0001_auth_sync.sql` | users table | ✅ run |
| `0002_leads.sql` | leads table | ✅ run |
| `0003_pros.sql` | pros table | ✅ run (2026-03-21) |
| `0004_scan_events.sql` | anonymous scan events | ✅ run |
| `0005_pro_claims.sql` | free plumber claims | 🔲 **needs run** |
| `0006_leads_sms.sql` | adds phone + sms_consent to leads | 🔲 **needs run** |

---

## Build Status

| Sprint | What | Status |
|--------|------|--------|
| Sprint 1 | Scanner, results, vault, auth, recall, rebates, PDF | ✅ Live |
| Sprint 2 | InvitePlumberButton, /pro/onboard, /pro/directory, Stripe integration | ✅ Code complete |
| Sprint 3 | Label-first scan, shot1Note, single-shot fast path, Google doc fallback | ✅ Shipped |
| Sprint 4 | TCPA gate, $49 pricing, /pro/claim, PriceBreakdownCard, auto-lead trigger, treeshake | ✅ Shipped 2026-03-22 |
| Sprint 5 | 3-tier hybrid scan pipeline, self-improving flywheel (serial_patterns + model_catalog), canvas OCR preprocessing | ✅ Shipped 2026-03-22 |
| Sprint 6 | Stripe webhook, n8n monthly re-screen, home_id schema | 🔲 Next |

---

## Business Model

| Layer | Time horizon | What | Revenue |
|-------|-------------|------|--------|
| Scanner + annual loop | Now | Free homeowner tool — maximum trust, lifelong relationship | $0 — growth engine |
| Pro SaaS | Years 1–3 | $49/mo white-label leads for screened contractors | MRR — oxygen |
| B2B data | Years 2–5 | Anonymized scan DB (brand · model · age · zip · serial) | License fees |
| OS layer | Years 3–10 | Plug-in API for insurers, utilities, manufacturers, home robots | The company |

**The only two north stars** (resolve every design decision):
1. Maximum homeowner trust + lifelong relationship — free always, no manipulation, real data only
2. Maximum purity + quantity of longitudinal serial-level data per home

**Early revenue scaffolding (correct first step, not the destination):**
- Screened pros pay $49/mo for white-label branding + auto-leads in their zip
- Plumber invite → `/pro/claim` (free) → upsell to $49/mo — invite seeds the directory organically
- Auto-lead fires when homeowner opts in + age>8yr or remaining<3yr — Resend notifies matched pros

**The expansion path:**
```
Year 1   Water heaters   — nail it completely
Year 2   HVAC + tankless — same scan flow, same annual loop
Year 3   Water softeners — predictable salt/service cycle
Year 5   Panels + roofs  — harder, but same data moat logic

One OS. Different trade verticals. Same homeowner relationship.
```

---

See [DEV-NOTES.md](./DEV-NOTES.md) for full architecture, all decisions, and the build queue.
