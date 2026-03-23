# WaterHeaterVault

**The seed of the Residential Mechanical Longevity OS.**  
*One photo of any data plate today becomes the first node in every American home's mechanical digital twin.*

America's 140 million homes are entering a 15–25 year mechanical renewal supercycle. The system for managing it — Google searches, plumber roulette, Sunday floods — is medieval. We are building the digital-twin layer that maps the failure curves of every mechanical system in every home, starting with the easiest serial number on Earth: the water heater data plate.

Every scan is a new node. Every node is permanent. The homeowner owns it forever.

*Early revenue:* `waterheaterplan.com/pro` — $49/mo white-label leads for screened local contractors  
*The company:* longitudinal serial-level data on every major home system, queryable by insurers, utilities, manufacturers, and home robots

---

## How It Works

```
Homeowner points phone at data plate (free, always, works offline)
       ↓
Tesseract OCR → hardcoded lookup table → instant decode in <3s (90% of scans)
       ↓
Age · life · fair price · recalls · rebates · manual links — all local, no API wait
       ↓
Hero CTA: "Export Job Ticket" → .ics drops into any calendar / field service app
       ↓
"Text my plumber this report" → plumber gets personal invite link
       ↓
Plumber visits /pro/claim → free unit claim → taste value → $49/mo leads
       ↓
Year 1 reminder: "Your Navien turns 8. Mike's Plumbing recommends a check."
Year 3 alert:    "Replacement window open. Fair price: $1,700–$2,100."
```

**The moat is not the scanner. It is the annual loop and the longitudinal data it produces.**  
**Pro gate:** Grok AI screens Google Business Profile reviews (4.5+ stars required). Auto-pause if re-screen fails.

---

## What It Does

**Offline-first** scan — data plate photo → hardcoded lookup table decodes serial + model in <3s for 90% of scans. Grok/Gemini Flash handles the remaining 10% (unknown models, blurry labels). Brave Search fetches live manual + warranty URLs (cached after first lookup).

Results page shows:
- Brand · Model · Serial · Manufacture Date · Age · Fuel Type
- Remaining Life Gauge (color-coded: green/amber/red)
- **Fair Price Breakdown** — unit cost, labor, planned total (green) vs emergency total (red) vs national chain reference
- Rebate Maximizer Card (live utility rebate via Brave Search)
- CPSC Recall Status
- One-click PDF Report Card (branded with matched pro)
- **"Export Job Ticket"** — hero button: `.ics` calendar event + `.csv` field service row (works offline, zero APIs)
- **"Text my plumber this report"** — personal homeowner invite (not a sales pitch)
- TCPA-compliant email/SMS capture — explicit written consent checkbox, phone field
- Direct links: owner manual, warranty terms, serial decoder, rebate program

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 — static export, all `use client` |
| Styling | Tailwind CSS — `#000000` black, white text, `#0066ff` blue accent |
| On-device AI | Tesseract.js OCR — canvas preprocessing, PSM-6, brand/serial detection |
| **Primary path** | **Hardcoded lookup table** — `lib/wh-lookup.ts` — top 10 brands, ~500 models, offline, <3s |
| Cloud AI | Grok-2 text / Gemini Flash — **fallback only** (unknown model or low OCR confidence) |
| Docs search | Brave Search API — live verified URLs, cached in serial_cache after first fetch |
| Storage | IndexedDB (offline-first) + Cloudflare D1 (cloud sync + leads + pros) |
| Auth | Magic-link via Resend + JWT (no Clerk, no OAuth) |
| Payments | Stripe Checkout — Pro $49/mo or $499/yr |
| Export | `lib/exportJobTicket.ts` — pure client-side `.ics` + `.csv` download, zero APIs, works offline |
| PDF | html2canvas + jsPDF — client-side report card generation |
| Deployment | Cloudflare Pages — static export + CF Pages Functions |
| PWA | Service worker + manifest, installable on iOS/Android |

---

## Core Flow (4 screens max)

```
Screen 1 — Scan
  Camera opens → user points at data plate
  Tesseract OCR runs on-device (canvas preprocessing)
  Brand + serial detected → lookup table hit in <3s for 90% of scans

Screen 2 — Results (instant for 90%)
  Age · remaining life · fair price · recall status · rebate
  [Export Job Ticket]  ← hero button
  [Text my plumber]    ← primary CTA
  [Save to Vault]      ← secondary

Screen 3 — Job Ticket Export
  .ics → Google Calendar, Apple Calendar, Outlook, Housecall Pro, Jobber
  .csv → any field service app
  Zero APIs — pure client-side, works offline after scan

Screen 4 — Vault
  Saved heaters with recall badges, life gauge, annual reminders
```

---

## Export Job Ticket

**The hero feature.** One tap from the results page creates two files — no API, works offline.

### `.ics` Calendar Event

```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//WaterHeaterVault//EN
BEGIN:VEVENT
UID:WH-{serial}-{timestamp}@waterheaterplan.com
SUMMARY:💧 Water Heater Service — {Brand} {Model} (Age {N}yr)
DTSTART:{today+7days}T090000
DTEND:{today+7days}T110000
DESCRIPTION:Serial: {serial}\nAge: {N} years | Remaining: ~{R} years
  \nFuel: {fuel} | Tank: {gallons}gal\nFair Price: ${min}–${max} installed
  \nManual: {url}\nRecall: {status}\n\n— WaterHeaterVault.com
LOCATION:{zip}
END:VEVENT
END:VCALENDAR
```

File: `WaterHeater-Job-{Serial}.ics`  
Drops into: **Google Calendar · Apple Calendar · Outlook · Housecall Pro · Jobber · ServiceTitan · any .ics reader**

### `.csv` Field Service Row

```
Type,Zip,Brand,Model,Serial,Est.Install Year,Age,Remaining Life,Fuel,Gallons,Cost Min,Cost Max,Manual URL,Recall,Notes
Water Heater,{zip},{brand},{model},{serial},{year},{age}yr,{remaining}yr,{fuel},{gal},{min},{max},{url},{recall},WaterHeaterVault
```

File: `WaterHeater-Job-{Serial}.csv`

---

## Hardcoded Lookup Table

`lib/wh-lookup.ts` — ships with the app bundle, zero network required. ~500 models covering 90%+ of US installed base.

### Brand Serial Decode Rules

| Brand | Aliases | Pattern | Decode |
|-------|---------|---------|--------|
| Rheem | Ruud | `WWYY` at pos 2 | `04**24***` → Wk 04, 2024 |
| A.O. Smith | State, American | `YYWW` at pos 0 | `2404*****` → 2024 wk 04 |
| Bradford White | — | `BWL` — char 2=year letter, 3-4=week | `MF42*` → 2006+cycle, wk 42 |
| Navien | — | `YYYYMM` at pos 0 | `202403***` → Mar 2024 |
| Rinnai | — | `YYMM` at pos 2 | `**2403**` → Mar 2024 |
| Noritz | — | `YYWW` at pos 0 | `2404****` → 2024 wk 04 |
| Bosch | — | `YYYYWW` at pos 0 | `202404**` → 2024 wk 04 |
| GE / GEO | — | `LETTER_YY` at pos 0 | `D24*****` → Apr 2024 |

Bradford White year letter (cycles every 20yr): `A=1984/2004, B=1985/2005, C=1986/2006… Z=2003/2023`  
GE month letter: `A=Jan B=Feb C=Mar D=Apr E=May F=Jun G=Jul H=Aug J=Sep K=Oct L=Nov M=Dec`

### Model Spec Schema (`lib/wh-lookup.ts`)

```typescript
export interface ModelSpec {
  brand: string
  modelPrefix: string       // match first N chars of scanned model number
  description: string
  tankGallons: number | null  // null for tankless
  fuelType: 'natural_gas' | 'propane' | 'electric' | 'heat_pump'
  inputBtuOrWatts: number
  firstHourRating: number
  expectedLifeYears: number
  unitCostMin: number       // total installed USD
  unitCostMax: number
  laborHours: number
}

export interface BrandSpec {
  brand: string
  aliases: string[]
  serialPattern: 'WWYY' | 'YYWW' | 'BWL' | 'YYMM' | 'YYYYWW' | 'YYYYMM' | 'LETTER_YY'
  serialOffset: number
}
```

### Seed Data (top models — expand to ~500 in implementation)

| Brand | Prefix | Description | Gal | Fuel | Life | Cost Range |
|-------|--------|-------------|-----|------|------|-----------|
| Rheem | XG40 | Performance 40gal gas | 40 | NG | 12yr | $900–$1,200 |
| Rheem | XG50 | Performance 50gal gas | 50 | NG | 12yr | $1,000–$1,300 |
| Rheem | XR50 | Performance Plus 50gal | 50 | NG | 13yr | $1,100–$1,450 |
| Rheem | PROE50 | Professional 50gal | 50 | NG | 14yr | $1,200–$1,600 |
| Rheem | XE40 | Performance 40gal electric | 40 | Elec | 11yr | $700–$950 |
| Rheem | XE50 | Performance 50gal electric | 50 | Elec | 11yr | $750–$1,000 |
| A.O. Smith | GPVH-40 | Signature 40gal gas | 40 | NG | 12yr | $900–$1,200 |
| A.O. Smith | GPVH-50 | Signature 50gal gas | 50 | NG | 12yr | $1,000–$1,350 |
| A.O. Smith | GPSH-50 | ProLine 50gal gas | 50 | NG | 13yr | $1,100–$1,450 |
| A.O. Smith | GPHE-50 | Vertex 50gal high-eff | 50 | NG | 15yr | $1,400–$1,800 |
| A.O. Smith | EES-40 | Signature 40gal electric | 40 | Elec | 11yr | $700–$950 |
| Bradford White | MI30S6 | AeroTherm 30gal gas | 30 | NG | 12yr | $850–$1,100 |
| Bradford White | MI40L6 | AeroTherm 40gal gas | 40 | NG | 12yr | $950–$1,250 |
| Bradford White | MI50L6 | AeroTherm 50gal gas | 50 | NG | 12yr | $1,050–$1,350 |
| Bradford White | RE240 | 40gal electric | 40 | Elec | 11yr | $700–$950 |
| Navien | NPE-240A | Condensing tankless 11.2 GPM | — | NG | 20yr | $2,800–$3,800 |
| Navien | NHB-150H | Condensing combo boiler | — | NG | 20yr | $3,200–$4,500 |
| Rinnai | V65EP | Tankless 6.5 GPM propane | — | LP | 20yr | $1,800–$2,400 |
| Rinnai | RL75EP | Tankless 7.5 GPM propane | — | LP | 20yr | $2,000–$2,600 |
| Rinnai | RU199iN | Ultra 9.8 GPM gas | — | NG | 20yr | $2,400–$3,200 |
| Noritz | NRC661-DV | Condensing tankless | — | NG | 20yr | $2,000–$2,700 |
| Bosch | ES8 | 8gal point-of-use electric | 8 | Elec | 10yr | $500–$700 |
| State | GP6-40 | ProLine 40gal gas | 40 | NG | 12yr | $900–$1,200 |
| State | GP6-50 | ProLine 50gal gas | 50 | NG | 12yr | $1,000–$1,300 |

---

## Routes

| Route | What it does |
|-------|-------------|
| `/` | Homeowner landing — headline + Scan CTA + proof pills + pro link |
| `/scan` | Label-first guided scan — data plate required, unit overview optional |
| `/results` | Results: gauge, price, rebate, **Export Job Ticket**, PDF, invite, TCPA |
| `/vault` | Saved heaters — recall badges, life gauge, list |
| `/vault/item?id=xxx` | Item detail — inline edit, recall banner, PDF, invite |
| `/pro` | Pro marketing — $49/mo, how it works, quality gate |
| `/pro/claim` | Free plumber claim — invited plumber claims unit, TCPA consent, upsell |
| `/pro/onboard` | Full pro signup: GBP URL → Grok AI screen → Stripe $49/mo checkout |
| `/pro/directory` | Public searchable directory of screened pros |
| `/pro/dashboard` | Pro weekly scan counts by zip |
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

## Deployment

Cloudflare Pages auto-deploys from `main` branch.  
Primary URL: **waterheaterplan.com**  
Alias: **scan.waterheaterplan.com** → same app

**Required secrets — CF Pages → Settings → Environment Variables:**

| Key | Purpose |
|-----|---------|
| `GROK_API_KEY` | Grok — fallback LLM for unknown models + pro review screening |
| `BRAVE_API_KEY` | Brave Search — live manual, warranty, rebate URLs |
| `RESEND_API_KEY` | Resend.com — magic link + lead emails |
| `JWT_SECRET` | Sign/verify tokens (32+ chars) |
| `STRIPE_SECRET_KEY` | Stripe — create checkout sessions |
| `STRIPE_PRICE_ID_MONTHLY` | Stripe Price ID for $49/mo Pro plan |
| `STRIPE_PRICE_ID_ANNUAL` | Stripe Price ID for $499/yr Pro plan |
| `DB` | Cloudflare D1 binding |

### Stripe Setup

1. [dashboard.stripe.com/products](https://dashboard.stripe.com/products) → **Add product** → `WaterHeaterVault Pro`
2. Price: **$49.00/month** recurring → copy `price_...` → `STRIPE_PRICE_ID_MONTHLY`
3. Price: **$499.00/year** recurring → copy `price_...` → `STRIPE_PRICE_ID_ANNUAL`
4. [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys) → `STRIPE_SECRET_KEY`
5. Webhook: `https://scan.waterheaterplan.com/api/pro/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.deleted`

> Testing? Use `sk_test_...` keys. Test card: `4242 4242 4242 4242`.

### D1 Migrations

```bash
# Run in order after cloning (use --command for each if --file fails auth):
wrangler d1 execute waterheater-vault --file=migrations/0001_auth_sync.sql --remote
wrangler d1 execute waterheater-vault --file=migrations/0002_leads.sql --remote
wrangler d1 execute waterheater-vault --file=migrations/0003_pros.sql --remote
wrangler d1 execute waterheater-vault --file=migrations/0004_scan_events.sql --remote
wrangler d1 execute waterheater-vault --file=migrations/0005_pro_claims.sql --remote
wrangler d1 execute waterheater-vault --file=migrations/0006_leads_sms.sql --remote
wrangler d1 execute waterheater-vault --file=migrations/0007_serial_cache.sql --remote
wrangler d1 execute waterheater-vault --file=migrations/0008_leads_reminder.sql --remote
wrangler d1 execute waterheater-vault --file=migrations/0009_learn.sql --remote
```

| Migration | What | Status |
|-----------|------|--------|
| `0001_auth_sync.sql` | users + vault_items | ✅ applied |
| `0002_leads.sql` | leads table | ✅ applied |
| `0003_pros.sql` | pros table | ✅ applied |
| `0004_scan_events.sql` | anonymous scan events | ✅ applied |
| `0005_pro_claims.sql` | pro_claims table | ✅ applied |
| `0006_leads_sms.sql` | phone + sms_consent on leads | ✅ applied |
| `0007_serial_cache.sql` | serial_cache (cost control) | ✅ applied |
| `0008_leads_reminder.sql` | last_reminded_at on leads | ✅ applied |
| `0009_learn.sql` | serial_patterns + model_catalog (flywheel) | ✅ applied 2026-03-22 |

---

## 60-Day Local-First Plan

| Days | Focus | Deliverable |
|------|-------|-------------|
| 1–10 | **Ship the offline core** | `lib/wh-lookup.ts` (10 brands, ~500 models) + `lib/exportJobTicket.ts` (.ics + .csv) wired to results page |
| 11–20 | **Instant results UX** | Scan-to-result confirmed <3s, owner company auto-routing in InvitePlumberButton, PDF embeds job ticket data |
| 21–40 | **Local market** | Yard signs, Nextdoor, local Facebook ads — drive scans in 1 zip code |
| 41–60 | **Polish + second zip** | Tighten lead delivery, confirm first $49/mo plumber paying, expand to zip #2 |

**What is FORBIDDEN:**
- Expansion beyond water heaters
- File storage / uploads
- National pro directory until local business is profitable
- Any feature that adds friction to: scan → instant result → export → text plumber

---

## Build Status

| Sprint | What | Status |
|--------|------|--------|
| Sprint 1 | Scanner, results, vault, auth, recall, rebates, PDF | ✅ Live |
| Sprint 2 | InvitePlumberButton, /pro/onboard, /pro/directory, Stripe | ✅ Code complete |
| Sprint 3 | Label-first scan, single-shot fast path, Google doc fallback | ✅ Shipped |
| Sprint 4 | TCPA gate, $49 pricing, /pro/claim, PriceBreakdownCard, auto-lead trigger | ✅ Shipped 2026-03-22 |
| Sprint 5 | 3-tier hybrid scan, self-improving flywheel, canvas OCR preprocessing | ✅ Shipped 2026-03-22 |
| Sprint 6 | Hardcoded lookup table (~500 models) + Export Job Ticket (.ics + .csv) | 🔲 Next |

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

**Early revenue scaffolding:**
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
