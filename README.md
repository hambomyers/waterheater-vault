# WaterHeaterVault

**Free AI water heater scanner for homeowners. SaaS platform for local pros.**

*Consumer product:* `scan.waterheaterplan.com` — free 60-second AI scan (age, life, cost, recalls, rebates, PDF)  
*Pro product:* `waterheaterplan.com/pro` — $49/mo white-label leads platform for screened local contractors

> **Entity note:** Operated by VaultPro LLC (new standalone entity, filed separately for legal/tax separation). All domains, branding, and code are unchanged.

---

## How It Works

```
Consumer scans heater (free)
       ↓
Results: age · life · cost · recalls · rebates · PDF
       ↓
"Invite my plumber → get branded reports" button  ← PRIMARY VIRAL LOOP
       ↓
Pro sees branded scan PDFs with their name/number
       ↓
Pro pays $49/mo at waterheaterplan.com/pro
       ↓
Auto-leads delivered when heater age > 8yr or life < 3yr
```

**Pro gate:** Grok AI screens Google Business Profile reviews (4.5+ stars required). Auto-pause if re-screen fails.

---

## What It Does

Two-shot guided camera scan — photo 1 is the unit overview, photo 2 targets the data plate. **Grok Vision AI** decodes the serial number (brand-specific manufacture date rules), estimates remaining life, calculates replacement cost, checks CPSC recall status, and surfaces real manual + warranty links via **Brave Search.**

Results page shows:
- Brand · Model · Serial · Manufacture Date
- Remaining Life Gauge (color-coded: green/amber/red)
- Price Surprise Calculator (replacement cost + emergency premium)
- Rebate Maximizer Card (live utility rebate via Brave Search)
- CPSC Recall Status
- One-click PDF Report Card (branded with pro name/number if applicable)
- **"Invite my plumber → get branded reports"** viral CTA
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
| `/scan` | Two-shot guided camera scan |
| `/results` | Scan results + rebate card + PDF + invite button + save |
| `/vault` | Saved heaters — recall badges, life gauge, list |
| `/vault/item?id=xxx` | Item detail — inline edit, recall banner, PDF, invite |
| `/pro` | **Pro marketing page** — how it works, pricing, quality gate |
| `/pro/onboard` | Pro signup: GBP URL → Grok AI screen → Stripe checkout |
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
# Run after cloning or adding new migrations:
wrangler d1 execute waterheater-vault --file=migrations/0001_auth_sync.sql --remote
wrangler d1 execute waterheater-vault --file=migrations/0002_leads.sql --remote
wrangler d1 execute waterheater-vault --file=migrations/0003_pros.sql --remote
```

`0003_pros.sql` status: ✅ run locally + remote (2026-03-21)

---

## Build Status

| Sprint | What | Status |
|--------|------|--------|
| Sprint 1 | Scanner, results, vault, auth, WHP integration | ✅ Live |
| Sprint 2 | InvitePlumberButton, PDF, RebateCard, /pro/onboard, /pro/directory, D1 pros table | ✅ Code complete — deploy after Stripe env vars |
| Sprint 3 | Stripe webhook, auto-leads, n8n re-screen, email capture | 🔲 Next |

---

## Business Model

| Layer | What | Revenue |
|-------|------|---------|
| Consumer | Free scanner — viral acquisition | $0 (growth engine) |
| Pro SaaS | $49/mo or $499/yr per contractor | MRR |
| Data moat | Anonymized heater registry | Strategic asset |

**Pro value prop:** Screened pros get white-label branding on every scan/PDF from homeowners in their area, plus auto-leads when heaters hit critical age. Multiple pros allowed per zip — competition is fine.

**Growth engine:** Every PDF report has the pro's name/number. Every scan has "Invite my plumber" → viral loop that signs up more pros.

---

See [DEV-NOTES.md](./DEV-NOTES.md) for full architecture, all decisions, and the build queue.
