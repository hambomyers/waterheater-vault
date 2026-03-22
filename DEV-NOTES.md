# WaterHeaterVault — Dev Notes
**SINGLE SOURCE OF TRUTH. Read before every session. Update after every meaningful change.**
*Owner: H and H Myers Investments LLC · DBA: Water Heater Plan · Central Virginia*
*Last updated: 2026-03-22 — Full session: label-first scan, TCPA consent, $49/mo, /pro/claim page, PriceBreakdownCard, auto-lead trigger, pro_claims migration, GROK-PROMPT.md + OnboardingPrompt deleted.*

---

# ═══ PART 1 — VISION & STRATEGY ═══
*Changes only when a fundamental business decision changes.*

---

## What This Is

**WaterHeaterVault** is a free AI scanner that tells homeowners the exact age, warranty status, replacement cost, recall status, and available utility rebates for their water heater — in 60 seconds, from a photo.

**waterheaterplan.com** is the homeowner-first entry point. The free scanner IS the growth engine.
**waterheaterplan.com/pro** is the SaaS platform that converts scanner traffic into paying pro customers — $49/mo for white-label branding, auto-leads, and a public directory listing.

**Entity:** VaultPro LLC (new standalone LLC filed for legal/tax separation). Domains, product names, and branding are 100% unchanged.

**Tagline:** *AI Water Heater Scanner for Homeowners & Pros*

**One-sentence pitch (consumer):** *"Point your phone at your water heater's data plate — we'll tell you how old it is, how much life it has left, what it'll cost to replace, and whether it's been recalled."*

**One-sentence pitch (pro):** *"For $49/mo your name and number appear on every water heater scan in your area — with auto-leads when the heater is in the danger zone."*

**One-sentence pitch (investor):** *"The Carfax of water heaters — free to the homeowner, SaaS to the pro, data asset to the enterprise."*

---

## Business Model

### Layer 1 — Consumer (Free, Always)
Free scanner builds trust + organic traffic. No service delivery. No local ops.

| What | Value |
|------|-------|
| 60-second AI scan | Age, life, cost, recalls, rebates |
| PDF Report Card | Branded with matched local pro |
| Invite My Plumber button | Viral pro acquisition loop |
| Vault | Saved heaters + recall monitoring |

### Layer 2 — Pro SaaS (NOW — Primary Revenue)
Screened local contractors pay flat $49/mo. No wrenches. Pure software.

| Feature | What pros get |
|---------|---------------|
| White-label branding | Name + number on every scan/PDF in their area |
| Auto-leads | Notified when heater age > 8yr or remaining < 3yr |
| Directory listing | `waterheaterplan.com/pro/directory` — SEO-indexed |
| Multiple pros per zip | Competition is fine — more pros = more coverage |

**Unit economics:**
- CAC: ~$0 (viral invite loop) or cheap text/email blast
- Price: $49/mo or $499/yr
- Gross margin: ~95% (pure SaaS)
- 12-mo LTV: $499–$588
- No service delivery, no Hamilton Plumbing, no local ops

**Pro gate:** Grok AI screens Google Business Profile reviews.
- 4.5+ stars → Stripe checkout → active
- Re-screen every 30 days (n8n cron)
- Below 4.5 → auto-paused, email notification

### Layer 3 — B2B Verticals (MONTH 2–6)
| Customer | Product | Price |
|----------|---------|-------|
| Home inspectors | Certified AI scan + branded PDF | $49/mo unlimited |
| Real estate agents | "Water Heater Report Card" per listing | $25/scan |
| Property managers | Fleet scan + ongoing monitoring | Custom |

### Layer 4 — Enterprise / Data (MONTH 6+)
Every scan builds `{brand, model, serial, age, fuelType, zip, manufactureDate}` — a database that doesn't exist anywhere else.

Strategic buyers: Dominion Energy (rebate targeting), AHS/home warranty cos (pre-policy risk), Rheem/Bradford White (replacement timing), Zillow/Redfin (listing disclosure).

### Viral Growth Loop
```
Homeowner scans → results page → "Invite my plumber → get branded reports"
       ↓
Pro gets invite link → visits /pro/onboard → Grok screens reviews
       ↓
4.5+ stars → Stripe $49/mo → branding activated
       ↓
Every scan in their area now shows their name/number
       ↓
Pro sends the app to every customer → more scans → more invites
```

**Secondary growth:** Cheap targeted text/email blasts to local plumbers. Ads on "water heater age check" keywords.

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

## The Long Horizon — What We Are Actually Building

*This does not change daily operations. It changes how we evaluate every design decision.*

**We are not building a water heater scanner.**
We are building the first scalable, permissioned, longitudinal digital-twin layer
for America's aging residential mechanical infrastructure —
the operating system for the slow-motion renewal of the largest pool of
depreciating capital assets on Earth.

The water heater data plate is the single best entry point in the entire economy:

```
  ✓  Machine-readable serial + manufacture date  →  Grok reads it in one shot, >99% accuracy
  ✓  Predictable failure physics                 →  anode depletion, sediment, 8–12yr MTTF
  ✓  High-consequence failure                    →  flooding, $2k–3k emergency, insurance claim
  ✓  Short enough cycle for data flywheel        →  continuous scans, true longitudinal records
  ✓  No other home system has all four at once
```

America's 140 million homes are entering a 15–25 year mechanical renewal supercycle.
The current system for managing it — Google searches, plumber roulette, Sunday floods —
is medieval. Insurance carriers lose $13B+/yr on water damage alone.
Utilities need flexible load data as electrification accelerates.
Real estate, lenders, manufacturers, and home robots all need the same thing:
accurate, continuously updated prediction of when each physical system will fail.

Every scan is a new node in the Residential Mechanical Longevity OS.

### Two North Stars (resolve every design decision)
```
  1.  Maximum homeowner trust + lifelong relationship
      → They must voluntarily keep scanning every new appliance, forever.
      → Free always. No paywall. No manipulation. Real data only.

  2.  Maximum purity + quantity of longitudinal serial-level data per home
      → Every scan captures: serial · model · brand · age · fuel · zip · home_id
      → Clean D1 records. Serial cache. No guessed fields.
```

### The Expansion Path
```
  Year 1   Water heaters     Wedge. Standardized serials. Nail it completely.
  Year 2   HVAC units        Furnaces + AC. Data plates. Same scan flow.
           Tankless water     Already a variant we handle.
  Year 3   Water softeners   Salt systems. Predictable service cycle.
  Year 5   Electrical panels Harder. Requires licensed inspector layer.
           Roofs              No serial — but zip + material + age = actuarial data.

  Each category: same scanner · same annual loop · same data moat
  Plumbers → HVAC techs → electricians → roofers
  One OS. Different trade verticals.
```

### What the Current Product Actually Is
The scanner, the plumber invite, the annual email loop, the $49/mo subscription —
these are the **first blood test** in what becomes a full Home Mechanical Health Platform.

Plumbers and early revenue are oxygen for years 1–3.
They are not the company we are building.
The company we are building is the central nervous system
for residential physical longevity in the 21st century.

*"Energy + AI is enough — if the energy is pointed at the right horizon."*

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
│  waterheaterplan.com  (homeowner landing → /scan → /results)        │
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
│              │  📧 Email capture → leads    │                       │
│              │  📄 PDF Report Card          │                       │
│              │  🔋 Rebate Maximizer Card    │                       │
│              └──────────┬───────────────────┘                       │
│                         │                                            │
│              ┌──────────▼───────────────────┐                       │
│              │  "Invite my plumber"         │                       │
│              │  → waterheaterplan.com/pro   │  ← VIRAL LOOP         │
│              │  (homeowner → / → /scan)     │  ← ENTRY POINT        │
│              └──────────────────────────────┘                       │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│  LAYER 2 — PRO SAAS                                                  │
│  waterheaterplan.com/pro                                             │
│                                                                      │
│  /pro/onboard ──▶ GBP URL → Grok AI screen → Stripe checkout        │
│  /pro/directory ──▶ public searchable directory of screened pros    │
│                                                                      │
│  Pro record: {name, phone, gbpUrl, rating, zip, stripeId, active}   │
│  Stored: Cloudflare D1 (pros table)                                  │
│  Payments: Stripe $49/mo or $499/yr                                  │
│  Re-screen: every 30 days via n8n cron                               │
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
║   │  Camera  │───▶│           /scan  (label-first)       │    ║
║   │  or File │    │                                      │    ║
║   └──────────┘    │  1. Shot 1 — DATA PLATE LABEL        │    ║
║                   │     (serial, model, brand, date)     │    ║
║                   │     ← GROUND TRUTH, always first     │    ║
║                   │     ← results ready after this shot  │    ║
║                   │                                      │    ║
║                   │  2. Shot 2 — full unit overview      │    ║
║                   │     (OPTIONAL verification)          │    ║
║                   │     ← Grok checks: does unit match   │    ║
║                   │       label? visual condition notes  │    ║
║                   │     ← flags paper cup / wrong unit   │    ║
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
waterheater-vault/
├── app/
│   ├── layout.tsx              Root layout, metadata, TopNav
│   ├── globals.css             Tailwind base, black theme, SF Pro
│   ├── page.tsx                Homeowner landing: headline + Scan CTA + proof pills + pro link
│   ├── scan/page.tsx           Two-shot: idle→camera-1→scanning-1→guide→camera-2→processing
│   ├── results/page.tsx        Extracted data + Docs + Save to Vault (inline error state)
│   ├── vault/
│   │   ├── page.tsx            List + background recall check + recall badges
│   │   └── item/page.tsx       Detail + inline edit + recall banner + delete
│   ├── pro/
│   │   ├── page.tsx            Pro marketing: how it works, pricing, quality gate, directory link
│   │   ├── onboard/page.tsx    Pro signup: GBP URL → Grok AI screen → Stripe checkout
│   │   ├── directory/page.tsx  Public searchable directory of screened pros
│   │   └── dashboard/page.tsx  Pro weekly scan counts by zip
│   ├── debug/page.tsx          Pipeline test (needs NODE_ENV guard)
│   └── components/
│       ├── Logo.tsx            SVG: WH text y=42 + thin line y=82
│       ├── TopNav.tsx          Fixed desktop nav: logo + Vault + Scan pill
│       ├── InvitePlumberButton.tsx  Share URL via native share / clipboard copy
│       ├── RebateMaximizerCard.tsx  Shows utility rebate doc from Grok/Brave
│       └── PDFReportGenerator.tsx  html2canvas + jsPDF client-side report card
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
│   │                            Serial decoder + utilityRebate doc type
│   │                            mode=review-screen → Grok AI pro review gate
│   ├── recall-check.ts         CF Function: CPSC SaferProducts API proxy (handles CORS)
│   ├── pro/
│   │   ├── screen.ts           Grok AI review screening (GBP URL → rating/sentiment → approve/deny)
│   │   ├── checkout.ts         Stripe checkout session creation
│   │   └── stats.ts            GET /api/pro/stats?zip= → thisWeek/lastWeek/critical counts
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

### Sprint 2 — Pro SaaS Launch ✅ CODE COMPLETE — awaiting Stripe env vars

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 10 | **InvitePlumberButton** | ✅ | Native share / clipboard. On results + vault item. |
| 11 | **PDFReportGenerator** | ✅ | html2canvas + jsPDF lazy-loaded. Pro branding slot built in. |
| 12 | **RebateMaximizerCard** | ✅ | utilityRebate doc type + Brave-verified link on results page. |
| 13 | **/pro/onboard page** | ✅ | Form → Grok AI screen → approved/denied → Stripe checkout. |
| 14 | **/pro/directory page** | ✅ | Public searchable list from D1 pros table. Empty-state CTA. |
| 15 | **Stripe CF Function** | ✅ | `/api/pro/checkout` creates Stripe Checkout session (sub). |
| 16 | **D1 pros table** | ✅ | `0003_pros.sql` run locally + remote. Table live. |
| 17 | **Post-scan email capture** | 🔲 NEXT | "Email me this report" → D1 leads table + Resend |
| 18 | **/debug route guard** | 🔲 | NODE_ENV check |
| 19 | **Add Stripe env vars → deploy** | 🔲 BLOCKING | See Stripe Setup section below |

### Sprint 2.5 — Scan Quality + UX (IN PROGRESS)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 20 | **Label-first scan** | 🔲 NEXT | Reverse shot order: data plate first → unit overview second (optional). Label = ground truth. |
| 21 | **Single-shot fast path** | 🔲 | If Shot 1 label is clean → show results immediately. Shot 2 is optional "verify unit" step. |
| 22 | **shot1Note mismatch field** | 🔲 | Grok returns `shot1Note` if overview doesn't match label data (paper cup detection). Show on results. |
| 23 | **Doc links Google fallback** | 🔲 | When Brave URL is null, show `google.com/search?q=...` fallback link instead of dead row. |
| 24 | **GROK_API_KEY restored** | ✅ | `wrangler pages secret put` — live in production. |
| 25 | **Button UX** | ✅ | Blue camera primary + 70%-opacity gallery pill, mt-14 spacing, fat-finger safe. |

---

## Stripe Setup (one-time — required before /pro/onboard works end-to-end)

**Step 1 — Create products in Stripe Dashboard**
1. Go to [dashboard.stripe.com/products](https://dashboard.stripe.com/products)
2. **Add product** → Name: `WaterHeaterVault Pro`
3. Add price: **$49.00 / month** (recurring) → copy `price_...` ID → this is `STRIPE_PRICE_ID_MONTHLY`
4. Add price: **$499.00 / year** (recurring) → copy `price_...` ID → this is `STRIPE_PRICE_ID_ANNUAL`

**Step 2 — Get your secret key**
- [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys) → Reveal secret key → `sk_live_...`

**Step 3 — Add to Cloudflare Pages**
- CF Dashboard → waterheater-vault project → Settings → Environment Variables → Add:

| Variable | Value |
|----------|-------|
| `STRIPE_SECRET_KEY` | `sk_live_...` |
| `STRIPE_PRICE_ID_MONTHLY` | `price_...` (the $49/mo price) |
| `STRIPE_PRICE_ID_ANNUAL` | `price_...` (the $499/yr price) |

**Step 4 — Deploy**
- Push to `main` or trigger a manual redeploy in CF Pages.
- `/pro/onboard` will be fully functional after deploy.

**Step 5 — Set up Stripe webhook (for subscription activation)**
- Stripe Dashboard → Developers → Webhooks → Add endpoint
- URL: `https://scan.waterheaterplan.com/api/pro/webhook` *(build this in Sprint 3)*
- Events to listen for: `checkout.session.completed`, `customer.subscription.deleted`
- This activates/deactivates pros in D1 automatically after payment.

> **Testing first?** Use `sk_test_...` keys and Stripe test mode. Test card: `4242 4242 4242 4242`.

---

### Sprint 3 — Pro Growth (MONTH 1–2)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 19 | **n8n 30-day re-screen cron** | 🔲 | Re-run Grok review screen on every active pro monthly |
| 20 | **Auto-lead delivery** | 🔲 | CF Worker: when scan age>8yr or remaining<3yr → email matched zip pros |
| 21 | **Sensor upsell** | 🔲 | Drop-ship thermometer/leak detector. ~20% margin. Shown in PDF + vault. |
| 22 | **Home inspector tier** | 🔲 | $49/mo unlimited scans + branded PDF |
| 23 | **Content Agent** | 🔲 | Weekly Claude blog post → SEO publishing |

### Sprint 4 — Enterprise / Data (MONTH 3+)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 24 | **Anonymized heater registry export** | 🔲 | D1 → CSV/API for enterprise buyers |
| 25 | **Utility rebate partnership** | 🔲 | Dominion Energy pilot — age map → rebate targeting |
| 26 | **Home warranty API** | 🔲 | AHS / Cinch — pre-policy risk score per heater |
| 27 | **Real estate embed** | 🔲 | Listing disclosure widget for Zillow/Redfin |

---

## Milestones

| Milestone | Unlocks |
|-----------|---------|
| 10 active pros | Proof of concept. $490/mo MRR. |
| 50 active pros | $2,450/mo. Pitch home inspector tier. |
| 200 active pros | $9,800/mo. Hire first VA for pro support. |
| 500 active pros | $24,500/mo. Consider raise or acquisition conversation. |
| 10K scans in D1 | Data moat pitch to Dominion Energy + home warranty cos. |

---

# ═══ PART 4 — CHANGE LOG ═══

### 2026-03-22 (evening) — Full Build Sprint

**SHIPPED**
- **`/pro/claim` page** (`app/pro/claim/page.tsx`) — free unit claim for invited plumbers. Shows heater summary from URL params, form (businessName/phone/zip/gbpUrl optional), TCPA consent checkbox, success state + $49/mo upsell card. No Stripe on first touch.
- **`/api/pro/claim` endpoint** (`functions/api/pro/claim.ts`) — saves to `pro_claims` D1 table.
- **`migrations/0005_pro_claims.sql`** — new `pro_claims` table (id, business_name, phone, zip, gbp_url, brand, model, age_years, remaining_life_years, sms_consent, ref, status, created_at).
- **`migrations/0006_leads_sms.sql`** — adds `phone` + `sms_consent` columns to `leads` table.
- **`PriceBreakdownCard`** (inline `app/results/page.tsx`) — shows fair price breakdown when Grok returns `priceBreakdown`: unit cost, labor, planned total (green), emergency total (red), national chain reference (dimmed). Shows in both mobile + desktop layouts.
- **Grok schema** (`functions/api/grok-scan.ts`) — added `priceBreakdown` object with unitLow/unitHigh/laborLow/laborHigh/emergencyPremiumLow/emergencyPremiumHigh/nationalChainLow/nationalChainHigh.
- **`PriceBreakdown` interface** (`brain/on-device.ts`) — new exported interface. Added optional `priceBreakdown` to `ExtractedData`. Passes through in `extractFromTwoShots`. Flows to `ProcessingResult` automatically via `extractedData`.
- **Auto-lead trigger** (`functions/api/capture-lead.ts`) — when homeowner submits email + age>8 OR remaining<3, queries active pros in same zip, sends them a lead notification email via Resend. Non-critical (never fails the scan).
- **TCPA consent gate** (`app/results/page.tsx` `EmailCapture`) — SMS opt-in checkbox + phone field + explicit written consent language. `smsConsent` + `phone` sent to capture-lead API.
- **Pricing** — $29/mo → $49/mo, $299/yr → $499/yr across all 5 files.
- **Deleted** — `GROK-PROMPT.md` (stale, superseded by DEV-NOTES) + `app/components/OnboardingPrompt.tsx` (dead code, never imported).

**PENDING — user action required**
- Run `wrangler d1 execute waterheater-vault --file=migrations/0005_pro_claims.sql` to create pro_claims table
- Run `wrangler d1 execute waterheater-vault --file=migrations/0006_leads_sms.sql` to add phone/sms_consent to leads
- Update Stripe prices to $49/mo + $499/yr in dashboard, update CF Pages env vars

---

### 2026-03-22 (afternoon) — Vision & Method Evolution

#### What Changed in Our Thinking Today

**SCAN ARCHITECTURE — shipped**
- Label-first: Shot 1 = data plate (authoritative, REQUIRED). Shot 2 = full unit (OPTIONAL verification).
- Single-shot fast path: "Skip — show my results now" button on guide card. Processes Shot 1 alone via `brainRouter.processImage`.
- `shot1Note` field: Grok flags mismatches on Shot 2 (paper cup, wrong object). Surfaces as subtle "AI observed:" card on results. Never fails the scan.
- Idle phase now says "Snap the data plate →" not "Snap the whole unit →".

**INVITE BUTTON — shipped**
- Old message: sales pitch to plumber ("get your name on reports for $29/mo").
- New message: homeowner-to-plumber personal invite ("thought you'd want the report and stay in the loop on service timing").
- URL embedded in share text — no more double-URL from Web Share API.
- Button label: "Text my plumber this report" not "Invite my plumber".

**PRODUCT STRATEGY — decided, not yet built**

| Decision | Old Thinking | New Thinking |
|---|---|---|
| Pro pricing | $29/mo | $49/mo flat · $499/yr · credible trade tool price, still 30x cheaper than Angi |
| First plumber touch | Straight to Stripe | Free unit claim → taste value → upsell |
| Invite vs directory | Two separate flows | One product: invite = free entry + viral, directory = paid upsell |
| Shot 2 | Required two-shot | Optional, skip button, single-shot fast path |
| SMS/email reminders | Not considered | TCPA explicit consent required (2025 FCC rules, $500–$1,500/violation) |
| Grok role | Vision + data extraction | Decision layer only — Workers execute (Grok never calls Stripe/Resend directly) |
| API cost at scale | Not tracked | ~$2–5k/month at 10K scans — mitigate with D1 serial cache |
| Long-term business | Pro SaaS revenue | Data moat — scan DB (brand/model/age/zip) is the unique asset |

**FAIR PRICE ENGINE — decided, not yet built**
- Grok returns `unitCostRange / laborRange / emergencyPremium` breakdown.
- Brave anchors with live Angi cost guide + Home Depot Install price for that brand.
- Display: national chain prices as high anchor, local pro as obvious winner.
- Core homeowner value: "You just saved $400–700 by knowing NOW vs. Sunday night."

**ANNUAL LOOP — decided, not yet built**
- This is the actual moat. Not the scan. Not the directory.
- Year 0: scan → text plumber → claim
- Year 1: "Your Navien turns 8 today. [Mike's Plumbing] recommends a check." → $200 service call
- Year 3: "Replacement window open. Fair price: $1,700–$2,100. Mike has 3 openings." → $2,000 planned job
- WHP sends the email. Mike pays $49/mo. Nobody gets surprised on a Sunday.

**ARCHITECTURE PRINCIPLE — locked**
- Grok = reasoning and decision layer (what to do, what to charge, what to write)
- Cloudflare Workers = execution layer (actually calls Stripe, Resend, SMS)
- Never conflate the two. Grok outputs instructions. Workers act on them.

---

### 2026-03-22 — Label-First Architecture + Homepage Strategy
- **Scan flow redesign (planned):** Reverse shot order — data plate label FIRST (ground truth), unit overview SECOND (optional verification). Label gives Grok everything it needs in one shot. Overview becomes prank detection + condition check. Single-shot fast path if label is clean.
- **Homepage:** `app/page.tsx` rewritten homeowner-first — headline, single blue CTA, 4 proof pills, pro link at bottom. TopNav hides on `/`.
- **`/pro` marketing page:** `app/pro/page.tsx` created — full pro pitch, pricing, quality gate, directory link. TopNav hides on `/pro`.
- **Button UX:** Single blue camera button + smaller `bg-opacity-70` gallery pill with `mt-14` spacing (fat-finger safe). Gallery uses separate `galleryInputRef` (no `capture` attr) → direct to photo library.
- **GROK_API_KEY:** Restored via `wrangler pages secret put` after consolidation caused CF Pages env loss.
- **`scan_events` D1 table:** `0004_scan_events.sql` migration live. `grok-scan.ts` records brand/zip/age/fuel per scan for pro dashboard.
- **`/pro/dashboard`:** New page shows weekly scan counts by zip for active pros.
- **`/api/pro/stats`:** GET endpoint for pro dashboard data.

### 2026-03-21 — MAJOR PIVOT: Pure SaaS + New LLC
- **Strategic shift:** Dropped local service model entirely. No Hamilton Plumbing. No service delivery. Pure SaaS.
- **Entity:** VaultPro LLC filed (new standalone entity for legal/tax separation). Domains/branding unchanged.
- **New features added:**
  - `InvitePlumberButton.tsx` — primary viral loop. Native share / clipboard. On results + vault.
  - `PDFReportGenerator.tsx` — html2canvas + jsPDF client-side report card. Branded when pro active in zip.
  - `RebateMaximizerCard.tsx` — live utility rebate via Brave-verified `utilityRebate` doc type.
  - `app/pro/onboard/page.tsx` — 90-second pro signup: GBP URL → Grok AI screen → Stripe checkout.
  - `app/pro/directory/page.tsx` — public searchable directory of screened pros.
- **Grok prompt updates:** Added `utilityRebate` doc type. Added `WH_REVIEW_SCREEN` prompt for `mode=review-screen`.
- **New env vars:** `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID_MONTHLY`, `STRIPE_PRICE_ID_ANNUAL`.
- **New npm packages:** `html2canvas`, `jspdf`, `@stripe/stripe-js`.
- **Treeshaked:** All "Book Professional Service" / "Get Protection Plan" CTAs removed from results + vault. All Hamilton Plumbing refs removed.
- **README + DEV-NOTES:** Full rewrite for new SaaS model.

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
