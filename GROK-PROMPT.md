# WaterHeaterVault — AI Consultation Context

Paste this entire document into Grok (or any AI) and ask for implementation guidance, architectural suggestions, or code review. This is the single source of truth for the current project state.

---

## What This Is

**WaterHeaterVault** is a free AI-powered PWA that tells homeowners the exact age, warranty status, replacement cost, and recall status of their water heater in 60 seconds from a photo.

It is **not** a general warranty app. It is a **single-purpose water heater scanner** that functions as the demand-capture layer for `waterheaterplan.com` — a local water heater maintenance plan business in Central Virginia.

**The flywheel:**
```
User scans water heater → Grok decodes serial → Shows age + remaining life + cost
→ "Book Service" CTA → waterheaterplan.com/book?brand=Rheem&age=9&cost=1800...
→ $159–$319/yr maintenance plan customer
```

**Owner:** H and H Myers Investments LLC · DBA: Water Heater Plan · Central Virginia  
**Live URL:** scan.waterheaterplan.com (Cloudflare Pages)  
**Repo:** hambomyers/waterheater-vault

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14, `output: 'export'`, all `use client` |
| Styling | Tailwind CSS — `#000000` black, white text, `#0066ff` blue |
| On-device AI | Tesseract.js OCR (offline fallback, ~4MB) |
| Cloud AI | Grok Vision (xAI API) |
| Docs search | Brave Search API — live verified URLs, never hardcoded |
| Storage | IndexedDB (offline-first) + Cloudflare D1 (cloud sync) |
| Auth | Magic-link via Resend + JWT (no OAuth, no Clerk) |
| Deployment | Cloudflare Pages — static export + CF Pages Functions |
| PWA | Service worker + manifest |

**Design:** Pure black `#000000`, white SF Pro text, single blue `#0066ff` accent. No gradients. No shadows. Pill buttons. Confidence through emptiness.

---

## Current State — What's Built and Working

Everything listed below is **live and functional** at scan.waterheaterplan.com.

### Core Scanner (Sprint 1 — COMPLETE ✅)
- Two-shot guided camera scan: Shot 1 (overview) → Shot 2 (data plate label)
- `functions/api/grok-scan.ts` — CF Pages Function: Grok Vision + Brave Search enrichment, retry on 429, `extractOutermostJson()` parser
- Grok prompt includes: `WH_SERIAL_DECODERS`, `WH_LIFESPAN_RULES`, `WH_WARRANTY_GUIDE`, `WH_DOCS_INSTRUCTIONS`
- Brand-specific serial decoding for manufacture date (Rheem, Bradford White, AO Smith, State, Whirlpool, etc.)
- Brave Search finds live URLs for: owner manual, warranty terms, serial decoder page, support page
- `functions/api/recall-check.ts` — CPSC SaferProducts API proxy (handles CORS), 7-day cache, conservative 2-field brand+model match
- `lib/recallChecker.ts` — recall badge logic, `needsRecallCheck()`, `checkItemForRecalls()`

### Results Page (COMPLETE ✅)
- Brand · Model · Serial · Manufacture Date · Age · Fuel Type · Tank Size
- **Remaining Life Gauge** — color-coded progress bar (green >5yr, amber 2-5yr, red <2yr)
- **Price Surprise Calculator** — estimated replacement cost + emergency premium estimate
- CPSC recall status indicator
- Docs links: owner manual, warranty terms, serial decoder, support page (all live via Brave)
- **"Book Professional Service Now →"** → `waterheaterplan.com/book?brand=X&model=Y&age=N&fuel=F&cost=C&remaining=R`
- **"Get Protection Plan →"** → `waterheaterplan.com/protection?[same params]`
- "Save to Vault" → IndexedDB

### Vault (COMPLETE ✅)
- `vault/page.tsx` — list with recall badges, remaining life bar, sort
- `vault/item/page.tsx` — full detail, inline edit, recall banner, delete
- `vault/private.ts` — IndexedDB v2: CRUD + `getStats()` + `syncQueue` + `mergeFromCloud()`
- Cloud sync via magic-link auth: `functions/api/vault/sync.ts`, `item/[id].ts`

### Auth (COMPLETE ✅)
- `functions/api/auth/send-magic-link.ts` — Resend email + JWT token
- `functions/api/auth/verify.ts` — validate token, set session cookie, create user in D1
- `functions/api/auth/me.ts` — return user from session cookie
- `lib/auth.ts` — `bootstrapAuthAndSync()`, onboarding flags, sync mode

### waterheaterplan.com Integration (COMPLETE ✅)
- `book.html` — personalized quote form, pre-filled from scan URL params
- `protection.html` — plan comparison with scan context (age, remaining life, cost)
- All 4 CTAs in results + vault item pass full context as URL query params

---

## File Structure

```
waterheater-vault/
├── app/
│   ├── layout.tsx              Root layout, metadata, TopNav
│   ├── globals.css             Tailwind base, black theme, SF Pro
│   ├── page.tsx                Home: Logo + tagline + Scan + Vault CTAs
│   ├── scan/page.tsx           Two-shot: idle→cam1→scanning1→guide→cam2→processing
│   ├── results/page.tsx        Extracted data + Docs + Gauge + Calculator + CTAs + Save
│   ├── vault/
│   │   ├── page.tsx            List + background recall check + recall badges
│   │   └── item/page.tsx       Detail + inline edit + recall banner + delete
│   ├── debug/page.tsx          Pipeline test (needs NODE_ENV guard)
│   └── components/
│       ├── Logo.tsx            SVG: WH text y=42 + thin line y=82
│       └── TopNav.tsx          Fixed desktop nav: logo + Vault + Scan pill
│
├── brain/
│   ├── on-device.ts            extractFromTwoShots() → POST /api/grok-scan
│   └── router.ts               BrainRouter singleton
│
├── lib/
│   ├── onDeviceExtractor.ts    Tesseract.js + regex (offline fallback)
│   ├── recallChecker.ts        CPSC recall check + conservative brand/model match
│   └── auth.ts                 Magic-link auth, sync mode, bootstrapAuthAndSync
│
├── vault/
│   └── private.ts              IndexedDB v2: VaultItem, CRUD, syncQueue, mergeFromCloud
│
├── functions/api/
│   ├── grok-scan.ts            Grok Vision + Brave Search + serial decoder pattern
│   ├── recall-check.ts         CPSC SaferProducts proxy
│   ├── auth/                   send-magic-link · verify · me
│   └── vault/                  sync (GET/POST) · item/[id] (DELETE)
│
├── migrations/0001_auth_sync.sql   users + vault_items D1 schema
├── wrangler.toml               CF Pages project: waterheater-vault, D1 binding DB
└── next.config.mjs             output: 'export', images.unoptimized: true
```

---

## What's NOT Built Yet (Sprint 2 — Current Priority)

| # | Feature | Notes |
|---|---------|-------|
| 10 | **Post-scan email capture** | After results: "Email me this report." One field. No auth friction. |
| 11 | **CF Worker: lead intake** | POST {email, scan data} → D1 `leads` table + Resend trigger |
| 12 | **Resend drip sequence** | Day 0 PDF report · Day 3 urgency · Day 14 social proof · Anniversary |
| 13 | **PWA install prompt** | After first scan: "Add to home screen for recall alerts." |
| 14 | **/debug route guard** | NODE_ENV check — currently exposes debug pipeline in production |

---

## Business Model Context

### Phase 1 — NOW (Local Service)
- Service area: Waynesboro · Staunton · Harrisonburg · Charlottesville VA
- Partner: Hamilton Plumbing handles service delivery
- Plans: Basic $159/yr · Advanced $249/yr · Elite $319/yr
- Unit economics: CAC ~$0 (organic scan intent) · Avg plan $220 · Gross margin ~60% · 3yr LTV ~$660

### Phase 2 — Month 2–6 (B2B)
- Home inspectors: $49/mo unlimited scans + branded PDF report
- Real estate agents: $25/scan "Water Heater Report Card"
- Property managers: fleet scan + annual service contracts

### Phase 3 — Month 6–12 (Franchise)
- White-labeled scanner app (their brand, phone, booking URL)
- $299/mo per territory · 50 licensees = $15K MRR

### Data Moat (Long-term)
Every scan creates `{brand, model, serial, age, fuelType, zip, manufactureDate}`.
Strategic buyers: Dominion Energy (rebate targeting), AHS/home warranty cos (pre-policy risk), Rheem/Bradford White (replacement timing), Zillow/Redfin (listing disclosure).

---

## Core Architecture Principle

**"AI understands → Brave verifies."**
Grok generates search queries. Brave finds the live page. Never a hardcoded URL.
This applies to: manuals, warranty terms, recall pages, serial decoder pages.

---

## Questions for AI Review

1. **Lead capture UX:** Best way to present the email capture on results page without killing conversion — inline field vs modal vs sticky footer?
2. **Email drip personalization:** Given `{brand, age, fuelType, remainingLife, replacementCost}`, what's the highest-converting Day 3 urgency email subject line and hook?
3. **PWA install prompt timing:** Should the "Add to home screen" prompt appear (a) after results load, (b) after save to vault, or (c) on second visit?
4. **D1 leads table schema:** What fields should I capture at email submission time? (`email, brand, model, serial, manufactureDate, ageYears, fuelType, remainingLifeYears, estimatedCost, zip, scannedAt, source`)
5. **Recall alert push notifications:** Is there a practical way to send push notifications when a new CPSC recall matches a saved vault item, given this is a static CF Pages site with no persistent server?
6. **Conversion optimization:** Looking at the funnel (scan → results → CTA click → book.html → form submit), where is the biggest drop-off likely to be and what would you fix first?
7. **Sprint 2 sequencing:** Given the business goal is "get to 10 signed plans," should I do email capture first or PWA install prompt first?
8. **AI agent stack:** For the 6-agent operations team (Intake, Scheduler, Nurture, Content, Bookkeeper, Analyst) — n8n self-hosted vs Make.com hosted, given this is a solo founder with ~$50/mo budget for automation?
