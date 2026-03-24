# Water Heater Plan

**Your Water Heater's Digital Profile**

Tesla-sleek, on-device AI scanner that creates a simple "Water Heater Profile" for homeowners — showing how much life is left and connecting them to screened local plumbers with one tap.

**For Homeowners:** Completely free. Scan your water heater, see how much life it has left in plain English, send the profile to a screened plumber with one button.

**For Plumbers:** $49/month for geofenced zone access (max 3 plumbers per zone). Receive full technical profiles and job tickets from every homeowner scan in your area.

**The Long Game:** The seed of the Residential Mechanical Longevity OS — free consumer trust layer, SaaS plumber revenue, longitudinal data asset.

---

## How It Works

### For Homeowners (Simple View)

```
1. Scan → Point phone at water heater data plate
   ↓
2. On-device vision (PaddleOCR-VL + Phi-4) extracts info instantly
   ↓
3. Simple Profile Card appears:
   • "8 years old"
   • "~4 years remaining"
   • "Estimated replacement: $1,800–$2,400"
   ↓
4. Big button: "Send to My Plumber"
   ↓
5. One tap → PDF + job ticket sent to screened local plumber
   ↓
6. Done. No jargon. No confusion. Just clear info and easy next step.
```

**Optional:** "Details" link reveals full technical specs for those who want them.

### For Plumbers (Rich View)

```
1. Receive PDF + job ticket from homeowner
   ↓
2. See full technical profile:
   • Serial number, model code, manufacture date
   • BTU rating, tank size, fuel type
   • Warranty status, installation specs
   • Everything needed for accurate quote
   ↓
3. Visit /pro to claim geofenced zone
   ↓
4. $49/mo → receive all scans in your zone
   ↓
5. Auto-notifications when heaters hit danger zone (age > 8yr)
```

**The moat:** Annual reminder loop + longitudinal data. Every scan is a node in the Residential Mechanical Longevity OS.

---

## What Homeowners See

**Simple Profile Card (No Jargon):**
- Age in plain English: "8 years old"
- Life remaining: "~4 years remaining" (color-coded gauge: green/amber/red)
- Estimated replacement cost: "$1,800–$2,400"
- Recall status: "No active recalls" or "⚠️ Recall Alert"
- One big button: **"Send to My Plumber"**

**Hidden Behind "Details" Link:**
- Brand, model, serial number
- Manufacture date, fuel type, tank size
- BTU rating, warranty status
- Manual links, technical specs

## What Plumbers Get

**Full Technical Profile:**
- Complete serial number and model code
- Manufacture date and age calculation
- Fuel type, BTU rating, tank size (gallons)
- Warranty status and expected life
- Installation specifications
- Recall status and safety notes
- Job ticket ready for field service app

**Plus:**
- PDF report with all technical details
- .ics calendar event for scheduling
- .csv export for field service software
- Auto-notifications for danger zone heaters in their zone

---

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 — static export, all `use client` |
| Styling | Tailwind CSS — `#000000` black, white text, `#0066ff` blue accent |
| **Primary Vision** | **PaddleOCR-VL-1.5** (text extraction) + **Phi-4-reasoning-vision-15B** (understanding) — on-device, instant, zero API cost |
| Fallback Vision | Grok Vision (grok-4.20-beta) — only for blurry/damaged labels or low confidence |
| Optional Search | Brave Search API — manual lookup for warranty docs, manuals, rebates (not required for basic scan) |
| Storage | IndexedDB (offline-first) + Cloudflare D1 (cloud sync + leads + pros) |
| Auth | Magic-link via Resend + JWT (no Clerk, no OAuth) |
| Payments | Stripe Checkout — Pro $49/mo flat |
| Export | `lib/profile/job-ticket.ts` — pure client-side `.ics` + `.csv` download, zero APIs, works offline |
| PDF | html2canvas + jsPDF — client-side report card generation |
| Deployment | Cloudflare Pages — static export + CF Pages Functions |
| PWA | Service worker + manifest, installable on iOS/Android |

---

## Core Flow (3 screens max)

```
Screen 1 — Scan
  Camera opens → user points at data plate
  On-device vision (PaddleOCR-VL + Phi-4) extracts info instantly
  No waiting, no spinners (on-device = instant)

Screen 2 — Simple Profile Card (homeowner view)
  • "8 years old"
  • "~4 years remaining" (color gauge)
  • "Estimated replacement: $1,800–$2,400"
  • [Send to My Plumber]  ← BIG hero button
  • [Details]             ← small link (reveals technical specs)

Screen 3 — Send to My Plumber
  One tap → PDF + job ticket generated
  Plumber receives full technical profile
  Homeowner sees confirmation
  Done.
```

**Optional Screens:**
- **Details View:** Full technical specs for curious homeowners or DIYers
- **Vault:** Saved profiles with recall monitoring and annual reminders

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

## Routes

**Consumer Routes (Simple, Jargon-Free):**

| Route | What it does |
|-------|-------------|
| `/` | Landing page — big Scan button, simple value prop |
| `/scan` | Camera scan with on-device vision |
| `/profile` | Simple Profile Card — age, life remaining, cost estimate, "Send to My Plumber" button |
| `/profile/details` | Rich technical view (hidden by default) — serial, model, BTU, specs |
| `/send-plumber` | One-tap send flow — generates PDF + job ticket |

**Pro Routes:**

| Route | What it does |
|-------|-------------|
| `/pro` | Pro marketing — $49/mo, geofenced zones, how it works |
| `/pro/claim` | Zone claim page — plumber claims their geofenced zone |
| `/pro/dashboard` | Pro dashboard — scan counts, leads, zone status |
| `/pro/directory` | Public directory of screened pros |

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
| `DB` | Cloudflare D1 binding |

### Stripe Setup

1. [dashboard.stripe.com/products](https://dashboard.stripe.com/products) → **Add product** → `Water Heater Plan Pro`
2. Price: **$49.00/month** recurring → copy `price_...` → `STRIPE_PRICE_ID_MONTHLY`
3. [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys) → `STRIPE_SECRET_KEY`
4. Webhook: `https://scan.waterheaterplan.com/api/pro/webhook`
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
| Sprint 1-5 | Original architecture (Tesseract + Grok hybrid, complex flows) | ✅ Archived |
| **Sprint 6** | **COMPLETE OVERHAUL: Tesla-sleek minimalism, on-device vision first** | 🔄 In Progress |
| | • Documentation updated (DEV-NOTES.md, README.md) | ✅ Done |
| | • New file structure: app/(consumer) with simple/rich view split | 🔲 Next |
| | • On-device vision: PaddleOCR-VL + Phi-4 pipeline | 🔲 Next |
| | • Simple Profile Card (homeowner view, no jargon) | 🔲 Next |
| | • Rich Details view (plumber view, full specs) | 🔲 Next |
| | • "Send to My Plumber" hero flow | 🔲 Next |

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
