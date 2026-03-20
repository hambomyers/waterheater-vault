# WaterHeaterVault — Dev Notes
**SINGLE SOURCE OF TRUTH. Read before every session. Update after every meaningful change.**
*Owner: H and H Myers Investments LLC · DBA: Water Heater Plan · Central Virginia*
*Last updated: 2026-03-20*

---

# ═══ PART 1 — VISION & STRATEGY ═══
*Changes only when a fundamental business decision changes.*

---

## What This Is

**WaterHeaterVault** is a free AI scanner that tells homeowners the exact age, warranty status, replacement cost, and recall status of their standard residential storage-tank water heater — in 60 seconds, from a photo.

**waterheaterplan.com** is the service business that converts those scans into $159–$319/year maintenance plan customers.

Together they form a **two-sided demand machine** that no local service competitor can replicate.

**Tagline:** *Know your water heater's age, warranty & recall status.*

**One-sentence pitch (consumer):** *"Point your phone at your water heater's data plate — we'll tell you how old it is, how much life it has left, what it'll cost to replace, and whether it's been recalled."*

**One-sentence pitch (service business):** *"We are the Jiffy Lube for the one appliance that fails silently, costs $1,500 overnight, and that 90% of homeowners have never thought about — until water is on the floor."*

**One-sentence pitch (franchise):** *"A turnkey AI-powered customer acquisition machine for water heater service companies. You do the service work. We supply the customers."*

---

## Business Model — Three Phases

### Phase 1 — Local Service (NOW)
The scanner generates high-intent leads. waterheaterplan.com converts them.

| Plan | Price | Notes |
|------|-------|-------|
| Basic | $159/yr | Annual inspection + flush. Valley discount. |
| Advanced | $249/yr | Bi-annual + water quality test. Most popular. |
| Elite | $319/yr | Advanced + Wi-Fi sensor + real-time alerts. |

**Unit economics:**
- CAC via app scan: ~$0 (organic intent)
- Average plan: ~$220/yr
- Gross margin: ~60%
- 3-yr LTV: ~$660
- LTV:CAC: 11:1

**Service area:** Waynesboro · Staunton · Harrisonburg · Charlottesville (expanding)
**Partner:** Hamilton Plumbing handles service delivery

### Phase 2 — B2B Vertical (MONTH 2–6)
| Customer | Product | Price |
|----------|---------|-------|
| Home inspectors | Certified AI scan + branded PDF report | $49/mo unlimited |
| Real estate agents | "Water Heater Report Card" per listing | $25/scan |
| Property managers | Fleet scan + annual service contracts | Custom |

### Phase 3 — Franchise Kit (MONTH 6–12)
License the entire system to water heater service companies in other markets.
- White-labeled scanner app (their brand, their phone number, their booking URL)
- Pre-built booking flow + email urgency sequences
- Operational playbook ("here's exactly how we get a customer from scan to signed")
- **Price: $299/mo per territory**
- **50 licensees = $15K MRR without touching a single water heater**

### The Data Moat (LONG TERM)
Every scan creates: `{brand, model, serial, age, fuelType, zip, manufactureDate}`.
This database does not exist anywhere — not at manufacturers, not at utilities, not at insurers.

**Strategic value:**
- Dominion Energy: age map of every water heater in their service area → rebate targeting
- Home warranty cos (AHS, etc.): pre-policy risk assessment
- Real estate platforms: listing disclosure tool
- Manufacturers (Rheem, Bradford White): warranty planning + replacement timing

---

## Design Rules (locked — never break)

- Background: pure black `#000000` always
- Text: white, SF Pro font stack, `font-light` body, `font-medium` emphasis
- Accent: blue `#0066ff` — sparingly (scan button, active states, dollar values)
- Logo: WF text upper portion (y=42) + thin white line (y=82), no background rect — the page IS the canvas
- Mobile: full screen, max 3 elements per viewport, no clutter, 44px min touch targets
- Desktop: App Shell (fixed TopNav), centered content columns, spacious, subtle hover states
- No gradients. No heavy shadows. `animate-pulse-glow` only.
- Buttons: `rounded-full` pill, `touch-manipulation` on mobile
- No mock data — real errors shown to user
- No `alert()` — all feedback is inline state

---

# ═══ PART 2 — TECHNICAL ARCHITECTURE ═══
*Changes when a stack decision changes.*

---

## Core Principle

**"AI understands → Brave verifies."**
Grok never hallucinates a URL. It generates search queries. Brave finds the live page.
This extends to every reference: serial decoders, warranty terms, manuals, recall pages.

---

## Full System Architecture

```
╔══════════════════════════════════════════════════════════════════════╗
║                    THE WATERHEATERPLAN ECOSYSTEM                     ║
╚══════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────┐
│  LAYER 1 — DEMAND CAPTURE                                            │
│  scan.waterheaterplan.com  (WaterHeaterVault PWA)                   │
│                                                                      │
│  [Camera] ──▶ [Two-Shot Scan] ──▶ [Grok Vision AI]                 │
│                                         │                            │
│                    ┌────────────────────┤                            │
│                    ▼                    ▼                            │
│             [Serial Decoder]    [Brave Search]                       │
│             (brand-specific     (live docs, recall                   │
│              mfg date rules)     pages, manuals)                     │
│                    │                    │                            │
│                    └────────┬───────────┘                            │
│                             ▼                                        │
│              ┌──────────────────────────────┐                       │
│              │  /results                    │                       │
│              │  Brand · Model · Age         │                       │
│              │  Remaining Life Gauge        │                       │
│              │  Price Surprise Calculator   │                       │
│              │  CPSC Recall Status          │                       │
│              │  📧 Email capture → CRM      │  ← THE MISSING PIECE  │
│              └──────────┬───────────────────┘                       │
│                         │                                            │
│              ┌──────────▼───────────────────┐                       │
│              │  "Book Now" CTA              │                       │
│              │  waterheaterplan.com/book    │                       │
│              │  ?brand=Rheem&age=9          │                       │
│              │  &fuel=gas&cost=1800         │                       │
│              │  &remaining=2               │                       │
│              └──────────────────────────────┘                       │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│  LAYER 2 — SERVICE CONVERSION                                        │
│  waterheaterplan.com                                                 │
│                                                                      │
│  /book ──▶ personalized quote (scan data pre-filled)                │
│  /protection ──▶ plan comparison with scan context                  │
│  /pricing ──▶ Basic $159 · Advanced $249 · Elite $319               │
│  /blog ──▶ SEO content engine (AI-generated, human-reviewed)        │
│                                                                      │
│  Lead captured: {email, brand, age, fuel, cost, remaining, zip}     │
│  Stored: Cloudflare D1                                               │
│  Triggered: Resend email drip sequence                               │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│  LAYER 3 — AI OPERATIONS TEAM  (The Unfair Advantage)               │
│  Powered by: Claude API + n8n + Cloudflare Workers + Resend         │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  AGENT 1: INTAKE                                            │    │
│  │  Trigger: new lead form submission                          │    │
│  │  Action: Claude reads lead data → scores urgency (1-10)    │    │
│  │          → drafts personalized reply email                  │    │
│  │          → flags Critical leads (remaining < 2 yrs)        │    │
│  └─────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  AGENT 2: SCHEDULER                                         │    │
│  │  Trigger: lead replies "yes" or clicks confirm              │    │
│  │  Action: reads available slots from Cal.com API             │    │
│  │          → proposes 3 times → books on confirmation         │    │
│  │          → sends reminder 24h before + day-of               │    │
│  └─────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  AGENT 3: NURTURE                                           │    │
│  │  Trigger: lead scanned but did not book                     │    │
│  │  Sequence:                                                  │    │
│  │    Day 0:  "Here's your water heater report" (PDF)          │    │
│  │    Day 3:  Urgency email (age-specific copy)                │    │
│  │    Day 14: Social proof + seasonal angle                    │    │
│  │    Year N: "Your heater just turned [age+1]" (anniversary)  │    │
│  └─────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  AGENT 4: CONTENT                                           │    │
│  │  Trigger: weekly cron                                       │    │
│  │  Action: Claude writes 1 SEO blog post                     │    │
│  │          Topics: "how old is my [brand] water heater"       │    │
│  │                  "water heater age [city VA]"               │    │
│  │          → staged for human review → published on approval  │    │
│  └─────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  AGENT 5: BOOKKEEPER                                        │    │
│  │  Trigger: daily                                             │    │
│  │  Action: reads Stripe/payment events                        │    │
│  │          → categorizes revenue by plan tier                 │    │
│  │          → flags overdue renewals                           │    │
│  │          → generates weekly P&L summary → emails owner      │    │
│  └─────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  AGENT 6: ANALYST                                           │    │
│  │  Trigger: weekly Sunday                                     │    │
│  │  Action: scans + leads + bookings + revenue data            │    │
│  │          → Claude writes plain-English business report      │    │
│  │          → highlights top opportunity for the week          │    │
│  │          → emails owner: "Here's what happened + what next" │    │
│  └─────────────────────────────────────────────────────────────┘    │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│  LAYER 4 — DATA MOAT  (The Long-Term Asset)                         │
│  Cloudflare D1 (SQLite at the edge)                                 │
│                                                                      │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────────────┐  │
│  │    leads     │  │   customers   │  │    heater_registry       │  │
│  │ ──────────── │  │ ──────────── │  │ ────────────────────── │  │
│  │ email        │  │ plan_tier     │  │ brand · model · serial   │  │
│  │ brand        │  │ amount        │  │ age · fuel · zip_code    │  │
│  │ model        │  │ started_at    │  │ remaining_life           │  │
│  │ age          │  │ renewed_at    │  │ scanned_at               │  │
│  │ fuel         │  │ next_service  │  │ (anonymized — the asset) │  │
│  │ cost         │  │ hamilton_tech │  │                          │  │
│  │ remaining    │  │               │  │ Strategic buyers:        │  │
│  │ zip          │  │               │  │ Dominion Energy          │  │
│  │ scanned_at   │  │               │  │ AHS / Cinch warranty cos │  │
│  └──────────────┘  └───────────────┘  │ Rheem / Bradford White   │  │
│                                        │ Zillow / Redfin          │  │
│                                        └──────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## AI Agent Tech Stack

| Agent | Trigger | Brain | Delivery |
|-------|---------|-------|----------|
| Intake | Webhook (CF Worker) | Claude API | Resend email |
| Scheduler | Reply webhook | Claude + Cal.com API | Resend + Cal invite |
| Nurture | Resend sequence | Claude (template vars) | Resend drip |
| Content | Weekly cron (CF Cron) | Claude API | Staged HTML → git PR |
| Bookkeeper | Daily cron | Claude + Stripe events | Email digest |
| Analyst | Sunday cron | Claude | Email report |

**Orchestration:** n8n (self-hosted on a $6/mo VPS) or Make.com (hosted)
**Cost:** ~$20–50/mo total to run all 6 agents at current scale

---

## System Architecture

```
╔═══════════════════════════════════════════════════════════════╗
║                        USER'S DEVICE                          ║
║                                                               ║
║   ┌──────────┐    ┌─────────────────────────────────────┐    ║
║   │  Camera  │───▶│           /scan  (two-shot)          │    ║
║   │  or File │    │                                      │    ║
║   └──────────┘    │  1. Shot 1 — overview photo          │    ║
║                   │  2. Tesseract.js OCR  ◀── offline    │    ║
║                   │  3. Category detect → categoryMap    │    ║
║                   │  4. Guide screen with location hint  │    ║
║                   │     + secondary hint ("Can't find?") │    ║
║                   │  5. Shot 2 — serial/model label      │    ║
║                   └──────────────┬──────────────────────┘    ║
║                                  │                           ║
║              ┌───────────────────┤                           ║
║              │  online?          │  offline?                 ║
║              ▼                   ▼                           ║
║   ┌──────────────────┐   ┌──────────────────┐               ║
║   │  /api/grok-scan  │   │  On-device data  │               ║
║   │  (CF Function)   │   │  from Shot 1     │               ║
║   └────────┬─────────┘   └────────┬─────────┘               ║
║            │                      │                          ║
╚════════════│══════════════════════│══════════════════════════╝
             │ (cloud enrichment)   │ (offline fallback)
             │                      │
    ┌────────┴──────────┐           │
    │  AI understands   │           │
    ▼                   ▼           │
┌──────────┐   ┌────────────┐      │
│  xAI     │   │  Brave     │      │
│  Grok    │   │  Search    │      │
│  4.20β   │   │  API       │      │
└────┬─────┘   └─────┬──────┘      │
     │  queries       │  verifies   │
     └───────┬─────────┘            │
             │ enriched JSON        │
             └──────────┬───────────┘
                        │
╔═══════════════════════╪═══════════════════════════════════════╗
║                       ▼                                       ║
║   /results                                                    ║
║   Product · Brand · Model · Serial · Mfg Date · Warranty     ║
║   Est. Value · Depreciation · Market trend                    ║
║   Docs: Manual · Warranty Terms · Serial Decoder · Support   ║
║                       │  "Save to Vault"                      ║
║                       ▼                                       ║
║   IndexedDB Vault                                             ║
║   VaultItem {                                                 ║
║     id, extractedData, valuation, docs[],                     ║
║     imageData, notes, tags, dateAdded, lastUpdated,           ║
║     recallStatus, lastRecallCheck, activeRecalls[]            ║
║   }                                                           ║
║                       │                                       ║
║   Background: recall check on vault load (7-day cache)        ║
║                       │                                       ║
║         /vault (list) · /vault/item (detail+edit)             ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## CF Function Enrichment Pipeline (current)

```
POST /api/grok-scan
  FormData: image (base64), shot2? (base64), category? (string)
  │
  ├─▶ callGrok(shot1, shot2?, category?)
  │     model: grok-4.20-beta · max_tokens: 2000 · temperature: 0.1
  │     Returns: {
  │       product, brand, model, serialNumber,
  │       manufactureDate,        ← explicit label OR "(from serial)" if decoded
  │       purchaseDate, warranty, price, condition,
  │       currentValue, originalPrice, depreciationRate,
  │       marketTrend, confidence,
  │       docs: [{ type, label, searchQuery }]
  │     }
  │     Grok doc types it can return:
  │       "ownerManual"       — owner's guide PDF
  │       "warrantyTerms"     — official warranty page
  │       "supportPage"       — manufacturer support/registration
  │       "installationManual"— install guide (appliances, HVAC)
  │       "serviceManual"     — service/repair manual (tools, HVAC)
  │       "serialDecoder"     — decode serial → manufacture date
  │                             (water heaters, HVAC, furnaces, boilers)
  │
  └─▶ braveSearch(doc.searchQuery) × N docs  (parallel, 4s timeout each)
        For each doc: finds live verified URL
        Returns enriched: docs[{ type, label, url, searchQuery }]

GET /api/recall-check
  Params: brand, model
  Proxies: saferproducts.gov CPSC API (public, no auth)
  Returns: raw CPSC recall array
  Client filters with conservative 2-field match (brand + model)
```

---

## The Serial Decoder Pattern

For products where the manufacture date is encoded in the serial number
(water heaters, HVAC, furnaces, commercial appliances), Grok adds a
`serialDecoder` doc entry. Brave Search finds the right decoder page.

```
Example: Bradford White water heater
  serialNumber: "FH5436789"
  manufactureDate: null   ← Grok uncertain about this brand's encoding
  docs: [
    { type: "serialDecoder",
      label: "Serial Date Decoder",
      url: "https://waterheaterrescue.com/bradford-white..."
      searchQuery: "Bradford White serial number manufacture date decoder" }
  ]

User experience:
  Manufacture Date    —  [tap Edit to add]
  Serial Date Decoder  Open ↗  → authoritative decoder page
```

This is better than Grok guessing because:
- Decoder sites (waterheaterrescue.com etc.) are maintained and accurate
- Works for every brand including obscure regional ones
- Gives auditable source — important for insurance claims
- No lookup tables to maintain

---

## Architectural Evolution (future — not yet built)

### Near-term: Unified enrichment (merge recall into scan CF Function)

Currently recall check runs as background async on vault load.
Better: run it in parallel inside `/api/grok-scan` alongside Brave Search.
Result: every newly scanned item is born with recall status already set.
Existing items still need the background check, but new items never do.

```
Current:  Grok → Brave (serial) → return → [background: recall check]
Future:   Grok → [Brave (docs)] + [CPSC recall check]  ← parallel
                  └──────────────────────────────────→ return complete item
```

### Long-term: B2B insurance architecture
```
Current:  Device → IndexedDB (offline cache)
                 → Cloudflare D1 (cloud sync, opt-in)  ← LIVE
                 → Magic-link auth (Resend + JWT, no Clerk)

Still needed: Immutable audit log (timestamp chain — proves pre-loss)
              Consent + sharing layer (user generates verified report)
              Insurer API (per-claim verification endpoint)
              SOC 2 Type II compliance (6-12 month process)
```

---

## File Structure (current, accurate)

```
WARRANTYFILE/
├── app/
│   ├── layout.tsx              Root layout, metadata, TopNav
│   ├── globals.css             Tailwind base, black theme, SF Pro
│   ├── page.tsx                Home: Logo + tagline + Scan + Vault CTAs
│   ├── scan/page.tsx           Two-shot: idle→camera-1→scanning-1→guide→camera-2→processing
│   ├── results/page.tsx        Extracted data + Docs + Save to Vault (inline error state)
│   ├── vault/
│   │   ├── page.tsx            List + background recall check + recall badges
│   │   └── item/page.tsx       Detail + inline edit + recall banner + delete
│   ├── debug/page.tsx          Pipeline test (needs NODE_ENV guard)
│   └── components/
│       ├── Logo.tsx            SVG: WF y=42 + line y=82, no background rect
│       ├── TopNav.tsx          Fixed desktop nav: logo + Vault + Scan pill
│       └── OnboardingPrompt.tsx First-visit: logo + pitch + magic link + Skip
│
├── brain/
│   ├── on-device.ts            extractFromImage(), extractFromTwoShots() → /api/grok-scan
│   └── router.ts               BrainRouter singleton: preview + processImage + processTwoShots
│
├── lib/
│   ├── onDeviceExtractor.ts    Tesseract.js + regex: date/serial/price/warranty/manufactureDate
│   ├── categoryMap.ts          25 categories → { locationHint, secondaryHint, instruction, keywords }
│   ├── recallChecker.ts        CPSC recall check: needsRecallCheck() + checkItemForRecalls()
│   │                            Conservative 2-field match (brand + model required)
│   └── auth.ts                 Magic-link auth, onboarding flags, sync mode, bootstrapAuthAndSync
│
├── vault/
│   └── private.ts              IndexedDB v2: CRUD + getStats + syncQueue + mergeFromCloud
│                                VaultItem, VaultDocs[], VaultDocItem, ActiveRecall, normalizeDocs()
│
├── functions/api/
│   ├── grok-scan.ts            CF Function: Grok vision + Brave Search enrichment
│   │                            Retry on 429, extractOutermostJson() parser
│   │                            Serial decoder doc type for water heaters / HVAC
│   ├── recall-check.ts         CF Function: CPSC SaferProducts API proxy (handles CORS)
│   ├── auth/
│   │   ├── send-magic-link.ts  Resend email + JWT token
│   │   ├── verify.ts           Validate token, set session cookie, create user in D1
│   │   └── me.ts               Return user from session cookie
│   └── vault/
│       ├── sync.ts             GET all items, POST upsert (authed)
│       └── item/[id].ts        DELETE item (authed)
│
├── migrations/
│   └── 0001_auth_sync.sql      users + vault_items D1 schema
│
├── public/                     favicon.ico, icons/, manifest.json, sw.js
├── scripts/generate-icons.js   SVG_ICON (192/512) + SVG_SMALL (favicons) via sharp
├── next.config.mjs             output: 'export', images.unoptimized: true
├── tailwind.config.ts          black/white/blue-accent + pulse-glow
└── package.json                Next 14, React 18, TS, Tailwind, Tesseract.js, sharp (dev)
```

---

## Environment Variables

| Key | Where | Purpose |
|-----|-------|---------|
| `GROK_API_KEY` | CF Pages Secrets | xAI Grok Vision API |
| `BRAVE_API_KEY` | CF Pages Secrets | Brave Search for live doc + decoder URLs |
| `RESEND_API_KEY` | CF Pages Secrets | Resend.com — magic link emails |
| `JWT_SECRET` | CF Pages Secrets | Sign/verify magic link + session tokens (32+ chars) |
| `DB` | wrangler.toml D1 binding | Cloudflare D1 — users + vault_items |

---

## Permanent Dev Rules

1. `pnpm build` must pass — zero TS errors — before every `git push`
2. No mock data — real API failures show real errors
3. All pages `'use client'` — static export, no server components
4. AI is swappable in one file: `brain/on-device.ts`
5. Extreme minimalism — when in doubt, remove it
6. No `alert()` — inline state only
7. Update DEV-NOTES.md after every meaningful session
8. Grok generates search queries. Brave finds URLs. Never hardcode URLs.

---

## Key Decisions

| Decision | Reason |
|----------|--------|
| Static export (no SSR) | CF Pages is static. All data is client-side IndexedDB. |
| Single Grok call for two images | 35% cheaper, higher accuracy, simpler code |
| Tesseract not ONNX/Transformers | 100MB+ model impractical for PWA. Tesseract is ~4MB. |
| `/vault/item?id=xxx` not `/vault/[id]` | Static export can't pre-render UUID dynamic routes |
| TopNav replaces BottomNav | BottomNav never rendered anywhere — dead code |
| WF + thin line, no rect | Page IS the canvas. Text + line imply the square. |
| Brave Search for all live URLs | Grok generates queries, never URLs. Live beats stale training data. |
| `serialDecoder` as a doc type | Authoritative decoder pages beat Grok guessing brand-specific serial formats |
| CPSC recall as separate CF proxy | CORS + consistent pattern. Runs background on vault load, 7-day cache. |
| Conservative 2-field recall match | Brand + model both required. Single field = too many false positives. |
| Dynamic docs[] not fixed object | Flexible — laptop ≠ dishwasher ≠ water heater |
| `manufactureDate` always shown in vault | User sees if app found it or not. "—" is honest. Field is always editable. |
| Deleted loop/, config/, cloud.ts, shared.ts | TODO-only scaffolding, 515 lines of dead weight |

---

# ═══ PART 3 — ACTION LIST ═══
*Updated every session. Ordered by exit-strategy impact.*

---

## Build Queue

### Sprint 1 — Close the Loop (DONE ✅)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | CPSC recall alerts | ✅ | CF proxy + recallChecker + vault badges |
| 2 | Serial decoder + manufacture date | ✅ | Grok brand-specific rules, Brave finds decoder page |
| 3 | Water-heater-only hard lock | ✅ | categoryMap deleted, scan hard-coded |
| 4 | Remaining Life Gauge | ✅ | Color-coded progress bar on results + vault item |
| 5 | Price Surprise Calculator | ✅ | Replacement cost + emergency premium |
| 6 | Lead-gen CTAs with URL params | ✅ | `waterheaterplan.com/book?brand=X&age=N...` |
| 7 | book.html + protection.html | ✅ | Personalized quote, plan recommendation, form |
| 8 | scan.waterheaterplan.com live | ✅ | Cloudflare Pages, custom domain wired |
| 9 | Auth/onboarding removed | ✅ | No friction. Straight to scan. |

### Sprint 2 — Lead Capture (THIS WEEK)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 10 | **Post-scan email capture** | 🔲 NEXT | After results: "Email me this report." One field. No auth. |
| 11 | **CF Worker: lead intake** | 🔲 | POST {email, scan data} → Cloudflare D1 + Resend trigger |
| 12 | **Resend drip sequence** | 🔲 | Day 0 report · Day 3 urgency · Day 14 social proof · Anniversary |
| 13 | **PWA install prompt** | 🔲 | After first scan: "Add to home screen for recall alerts." |
| 14 | **/debug route guard** | 🔲 | NODE_ENV check — currently writes to real vault in production |

### Sprint 3 — AI Agent Team (MONTH 1–2)

| # | Agent | Status | Notes |
|---|-------|--------|-------|
| 15 | **Intake Agent** | 🔲 | Claude API + CF Worker webhook → scores lead urgency → drafts reply |
| 16 | **Scheduler Agent** | 🔲 | Cal.com API → proposes 3 slots → books on confirmation |
| 17 | **Nurture Agent** | 🔲 | Resend sequences, Claude-personalized copy per heater age/brand |
| 18 | **Content Agent** | 🔲 | Weekly Claude blog post → staged for review → SEO publishing |
| 19 | **Bookkeeper Agent** | 🔲 | Stripe events → P&L digest → emails owner daily |
| 20 | **Analyst Agent** | 🔲 | Weekly Sunday report: scans + leads + revenue + top opportunity |

### Sprint 4 — B2B Verticals (MONTH 2–3)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 21 | **Heater Report Card PDF** | 🔲 | Shareable 1-pager: brand, age, urgency, CTA. For real estate + inspectors. |
| 22 | **Home inspector portal** | 🔲 | $49/mo, unlimited scans, branded PDF output |
| 23 | **Waterheaterplan.com → Next.js** | 🔲 | Dynamic routing, shared stack, real booking backend |
| 24 | **Stripe payment** | 🔲 | Plan signup flow. Webhooks → D1 customer record. |

### Sprint 5 — Franchise Kit (MONTH 6+)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 25 | **White-label config** | 🔲 | Scanner app parameterized: brand name, CTA URLs, accent color |
| 26 | **Franchisee dashboard** | 🔲 | Leads, bookings, revenue per territory |
| 27 | **Onboarding playbook** | 🔲 | Written doc: how to go from 0 → 25 plans in 90 days |
| 28 | **Utility partnership pitch deck** | 🔲 | Dominion Energy — age map → rebate targeting |

---

## Milestones

| Milestone | Unlocks |
|-----------|---------|
| 10 plans signed | Proof of concept. Start B2B outreach. |
| 25 plans signed | Home inspector pilot ($49/mo). |
| 100 plans signed | Franchise kit v1. Approach 2–3 plumbers in other markets. |
| 5 franchisees | $1,500 MRR passive. Proof of scale. |
| 50 franchisees | $15K MRR. Consider acquisition conversation or raise. |
| 10K scans in D1 | Data moat pitch to Dominion Energy. |

---

# ═══ PART 4 — CHANGE LOG ═══

### 2026-03-20 — Ecosystem Integration + Strategy Rewrite
- `waterheaterplan.com`: added `book.html` (personalized scan-data quote form), `protection.html` (plan comparison + cost math), `_redirects` for clean URLs, hero CTA → scanner
- `app/results/page.tsx`: `buildWHPUrl()` helper — all 4 CTAs now pass brand/model/age/fuel/cost/remaining as URL params
- `app/page.tsx`: removed auth/onboarding entirely — straight to scan, no friction
- `app/components/OnboardingPrompt.tsx`: updated branding to WaterHeaterVault
- `wrangler.toml`: renamed project from `warrantyfile` → `waterheater-vault`
- Deployed `scan.waterheaterplan.com` on Cloudflare Pages (hambomyers/waterheater-vault)
- Deployed `waterheaterplan.com` updates on Cloudflare Pages (hambomyers/WATERHEATERPLAN)
- `DEV-NOTES.md`: complete strategic rewrite — WaterHeaterVault ecosystem vision, 4-layer architecture ASCII, 6-agent AI operations team, 3-phase business model, franchise kit plan, data moat strategy, updated build queue

### 2026-03-18 — WaterHeaterVault Fork (Sessions 5–6)
**PROJECT RENAMED: WarrantyFile → WaterHeaterVault**

#### Branding
- `package.json`: name → `waterheater-vault`, description updated
- `app/layout.tsx`: metadata title/description → WaterHeaterVault + new tagline
- `app/components/Logo.tsx`: SVG text "WF" → "WH", aria-label updated
- `app/page.tsx`: all homepage text rewritten for WaterHeaterVault, new tagline, new scan button text
- `app/components/TopNav.tsx`: brand name → WaterHeaterVault
- `public/manifest.json`: name/short_name/description → WaterHeaterVault
- `vault/private.ts`: IndexedDB name `warrantyfile-vault` → `waterheater-vault`

#### Hard-Lock to Water Heaters
- `lib/categoryMap.ts`: **deleted** — no multi-category logic exists anymore
- `app/scan/page.tsx`: removed `categoryInfo` state + `getCategoryInfo` call + Grok identify mode; hard-coded water heater data plate guidance; `processTwoShots` hint hardcoded to `'water heater'`

#### ExtractedData Interface (water-heater-only)
Old generic interface replaced in `brain/on-device.ts`:
```ts
interface ExtractedData {
  product, brand, model, serialNumber, manufactureDate,
  tankSizeGallons?, fuelType, ageYears, remainingLifeYears,
  estimatedReplacementCost, currentWarranty
}
```

#### Grok Prompt — Water Heater Expert
`functions/api/grok-scan.ts`: WH_SERIAL_DECODERS, WH_LIFESPAN_RULES, WH_WARRANTY_GUIDE, WH_DOCS_INSTRUCTIONS. Identify mode removed.

#### New UI Components
- `RemainingLifeGauge`: color-coded progress bar on results + vault item
- `PriceSurpriseCalculator`: replacement cost + emergency premium on vault item

### 2026-03-17 — Auth + Sync + Mfg Date (WarrantyFile era)
Magic link auth, JWT session, D1 cloud sync, IndexedDB sync queue, manufacture date parsing.

### 2026-03-15 — Sessions 1–4 (WarrantyFile era)
Full build phases 0–7.5. Two-shot scan, Tesseract OCR, Grok-4.20-beta, Brave Search docs, IndexedDB vault, edit/delete, WF logo, favicon, PWA manifest. CPSC recall alerts. Desktop restyle. Insurance B2B strategy (since pivoted).

#### Lead-Gen CTAs (waterheaterplan.com)
Added to both `results/page.tsx` and `vault/item/page.tsx` (mobile + desktop):
- "Book Professional Service Now →" → `waterheaterplan.com/book?[url params]`
- "Get Protection Plan →" → `waterheaterplan.com/protection?[url params]`
