# Water Heater Plan — Dev Notes
**SINGLE SOURCE OF TRUTH. Read before every session. Update after every meaningful change.**
*Owner: H and H Myers Investments LLC · DBA: Water Heater Plan · Central Virginia*
*Last updated: 2026-03-24 — COMPLETE OVERHAUL: Tesla-sleek minimalism, simple homeowner view, on-device vision first, $49/mo plumber geofenced zones.*

---

# ═══ PART 1 — VISION & STRATEGY ═══
*Changes only when a fundamental business decision changes.*

---

## What This Is

**Water Heater Plan** is a Tesla-sleek, on-device AI scanner that creates a simple "Water Heater Profile" for homeowners — showing how much life is left and connecting them to screened local plumbers with one tap.

**waterheaterplan.com** — Free for homeowners, always. Simple, jargon-free interface. No shop talk on main screens.
**waterheaterplan.com/pro** — $49/month for plumbers to access geofenced zones (max 3 screened plumbers per zone) and receive rich technical data.

**Entity:** VaultPro LLC. Domains, product names, and branding unchanged.

**Core Concept:** "Water Heater Profile" — a clean digital record for each unit. Simple card for homeowners, rich technical details for plumbers.

**Tagline:** *Your Water Heater's Digital Profile*

**One-sentence pitch (homeowner):** *"Scan your water heater, see how much life it has left, and send the profile to a screened plumber with one tap."*

**One-sentence pitch (plumber):** *"$49/month gets you a geofenced zone with max 3 plumbers — you receive full technical profiles and job tickets from every homeowner scan in your area."*

**One-sentence pitch (investor):** *"The seed of the Residential Mechanical Longevity OS — free consumer trust layer, SaaS plumber revenue, longitudinal data asset."*

---

## Business Model

### Layer 1 — Homeowners (Free, Always)
Completely free. Simple, jargon-free interface. No shop talk on main screens.

**What homeowners see:**
- Simple "Water Heater Profile" card: age, life remaining (in plain English), estimated replacement cost
- One big button: **"Send to My Plumber"** — hero action, one-tap PDF + job ticket
- Optional "Details" link for those who want technical specs (but hidden by default)
- No serial numbers, BTUs, glass lining, or technical jargon on main screen

**What homeowners get:**
- Instant scan results (on-device vision, no waiting)
- Clean profile card they can understand
- Easy connection to screened local plumbers
- Free forever — no upsells, no manipulation

### Layer 2 — Plumbers ($49/month)
Screened local plumbers pay $49/month for geofenced zone access.

**Geofenced Zones:**
- Max 3 screened plumbers per geographic zone
- First-come, first-served until zone is full
- Quality maintained through ongoing review screening

**What plumbers get:**
- Full technical data: serial numbers, model specs, BTU ratings, tank size, manufacture date, warranty status
- Rich "Details" view that homeowners don't see
- Job tickets with complete technical specifications
- Auto-notifications when heaters in their zone are in danger zone (age > 8yr or remaining < 3yr)
- Directory listing on waterheaterplan.com/pro/directory

**Unit economics:**
- Price: $49/mo flat (no annual option — keep it simple)
- CAC: ~$0 (viral "Send to My Plumber" loop)
- Gross margin: ~95% (pure SaaS)
- LTV: $588/year per plumber
- No service delivery, no local ops, no wrenches

**Pro gate:** AI screens Google Business Profile reviews
- 4.5+ stars required → Stripe checkout → active
- Re-screen every 30 days
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
Homeowner scans → simple Profile card → big "Send to My Plumber" button
       ↓
Plumber receives PDF + job ticket with full technical details
       ↓
Plumber sees value → visits /pro to claim their zone
       ↓
4.5+ stars → Stripe $49/mo → zone activated
       ↓
Plumber shares app with every customer → more scans → more zone claims
       ↓
Geofenced zones fill up (max 3 per zone) → creates urgency for other plumbers
```

**Secondary growth:** Targeted outreach to plumbers in unfilled zones. Ads on "water heater age check" keywords.

---

## Design Rules (locked — never break)

**Tesla-Sleek Minimalism:**
- Background: pure black `#000000` always
- Text: white, SF Pro font stack, `font-light` body, `font-medium` emphasis
- Accent: blue `#0066ff` — sparingly (scan button, active states, critical info)
- Form follows function: delete anything that is not essential
- Max 3 elements per viewport on mobile
- 44px minimum touch targets
- No gradients. No heavy shadows. Clean lines only.
- Buttons: `rounded-full` pill style, `touch-manipulation` on mobile

**Homeowner View (Simple):**
- No serial numbers on main screen
- No BTU ratings, glass lining, or technical jargon
- Plain English only: "8 years old" not "Manufactured 2018"
- "~4 years remaining" not "Expected life: 12 years, current age: 8 years"
- Big, clear actions: "Send to My Plumber" as hero button
- Technical details hidden behind "Details" link

**Plumber View (Rich):**
- Full technical specifications
- Serial numbers, model codes, BTU ratings, tank size
- Manufacture date, warranty status, installation specs
- Everything a plumber needs for accurate quoting

**Universal:**
- No mock data — real errors shown to user
- No `alert()` — all feedback is inline state
- No loading spinners that spin forever — show progress or fail fast

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

**"On-device first. Cloud only when necessary."**

Primary path: PaddleOCR-VL-1.5 (text extraction) + Phi-4-reasoning-vision-15B (understanding) — runs on-device, instant results, zero API cost.

Fallback path: Grok Vision (grok-4.20-beta) — only for blurry/damaged labels or when on-device confidence is low.

Brave Search: Optional manual lookup for warranty docs, manuals, rebate programs. Not required for basic scan results.

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

## Scan Pipeline — 3-Tier Hybrid Architecture (LIVE as of Sprint 5)

Every single-shot scan runs through a confidence gate. The tier is chosen automatically based on OCR quality and learned D1 patterns. **No code changes needed as the system improves — it gets faster on its own.**

```
Camera ──▶ Canvas preprocessing (grayscale + contrast, max 1600px)
              │
              ▼
        Tesseract OCR (PSM-6, alphanumeric whitelist)
        Outputs: rawText · tesseractConf (0-100) · detectedBrand · serialCandidate
              │
              ▼
        confidenceScore = tesseractConf×0.6 + serialBonus(25) + brandBonus(15)
              │
      ┌───────┴────────┐
      │ score ≥ 70     │ score < 70
      │ + serialFound  │ OR no serial
      ▼                ▼
  ┌──────────┐    ┌───────────────────────────────────────┐
  │ TIER 1   │    │ TIER 3: /api/grok-scan (vision)       │
  │ fast-    │    │ model: grok-4.20-beta                  │
  │ lookup   │    │ ~10-25s · fallback only               │
  │ <100ms   │    │ Last resort for blurry/glare labels    │
  │ no LLM   │    └───────────────────────────────────────┘
  └────┬─────┘
       │ D1 hit? ── yes ──▶ return immediately
       │ miss?
       ▼
  ┌──────────────────────────────────────────┐
  │ TIER 2: /api/parse-text (text LLM)       │
  │ model: grok-2-1212 (text-only)           │
  │ ~1-2s · primary path for 80%+ of scans   │
  │ WH_TEXT_SYSTEM prompt + serial rules     │
  └──────────────────────────────────────────┘
       │
       ▼ (all cloud paths)
  learnFromScan() ──▶ serial_patterns + model_catalog (D1)
                      Makes Tier 1 hit rate grow over time
```

**Processing methods exposed in `ProcessingResult.processingMethod`:**
- `'fast-lookup'` — zero LLM, D1 pattern decode (<100ms)
- `'text-parse'`  — text LLM, raw OCR text (~1-2s)
- `'grok-vision'` — vision LLM, full image (~10-25s)
- `'on-device'`   — offline, Tesseract only

---

## Self-Improving Flywheel (LIVE as of Sprint 5)

Every successful cloud scan calls `learnFromScan()` which populates two D1 tables:

**`serial_patterns`** — one row per brand, tracks decode confidence
```
brand         | pattern_type | sample_count | confidence
rheem         | WWYY         | 342          | 0.997
ao smith      | YYWW         | 127          | 0.984
bradford white| BWL          | 89           | 0.978
navien        | YYWW         | 44           | 0.955
```
When `confidence ≥ 0.9` AND `sample_count ≥ 10` → `/api/fast-lookup` decodes serials for that brand in <100ms with zero LLM cost.

**`model_catalog`** — one row per (brand, model_prefix), stores fuel + tank specs
```
brand   | model_prefix | fuel_type | tank_size_gallons | sample_count
rheem   | XR40T06EC    | gas       | 40                | 23
navien  | NPE-240A2    | tankless-gas | null            | 17
```
Once a model prefix is in the catalog, the `/api/fast-lookup` response includes full specs without asking the LLM.

**Projected improvement curve:**
```
Week 1:  0% fast-lookup · 60% text-parse · 40% vision
Month 1: 30% fast-lookup · 50% text-parse · 20% vision
Month 6: 70% fast-lookup · 25% text-parse · 5% vision
Year 1:  85% fast-lookup · 12% text-parse · 3% vision  ← ~zero LLM cost for top brands
```

---

## CF Function Enrichment Pipeline

```
POST /api/fast-lookup  (Tier 1 — no LLM)
  Body: { serial, brand, model? }
  1. serial_cache exact match → return if hit
  2. serial_patterns lookup → if confidence < 0.9 or samples < 10 → 404
  3. decodeWHSerial(brand, serial) → manufactureDate
  4. model_catalog lookup → fuelType, tankSizeGallons
  5. computeDerivedFields() → full result
  Returns: full result with source='fast-lookup' | 404 {source:'miss'}

POST /api/parse-text  (Tier 2 — text LLM)
  Body: { rawText, brandHint }
  1. serial_cache exact match → return if hit
  2. xAI grok-2-1212 (text-only) · WH_TEXT_SYSTEM prompt · max_tokens:400
  3. computeDerivedFields() → full result
  4. braveSearch(doc.searchQuery) × 5 docs (parallel, 4s timeout)
  5. serial_cache write + scan_events write
  6. learnFromScan() → serial_patterns + model_catalog (non-blocking)
  Returns: full result with source='text-parse'

POST /api/grok-scan  (Tier 3 — vision LLM)
  FormData: image (base64), shot2? (base64), category? (string)
  1. serial_cache check (serialHint param)
  2. callGrok(shot1, shot2?, category?) · model: grok-4.20-beta · vision
  3. computeDerivedFields() → full result
  4. braveSearch() × 5 docs + scan_events write
  5. learnFromScan() → serial_patterns + model_catalog
  6. serial_cache write
  Returns: full result with source='grok-vision'

GET /api/recall-check
  Params: brand, model
  Proxies: saferproducts.gov CPSC API (public, no auth)
  Returns: raw CPSC recall array
  Client filters with conservative 2-field match (brand + model)
```

---

## Shared Utilities (`functions/api/_utils/`)

| File | Exports | Used by |
|------|---------|---------|
| `wh-compute.ts` | `computeDerivedFields`, `extractOutermostJson`, `braveSearch`, `learnFromScan`, `WH_SYSTEM`, `WH_TEXT_SYSTEM`, `normalizeBrand`, `getBrandPatternType` | grok-scan, parse-text, fast-lookup |
| `whSerialDecoder.ts` | `detectWHBrand`, `extractWHSerial`, `decodeWHSerial` | fast-lookup |
| `auth.ts` | `requireSessionUser`, `signJwt`, `verifyJwt`, etc. | auth routes |
| `http.ts` | `CORS_HEADERS`, `jsonResponse` | auth + vault routes |

Client mirrors: `lib/whSerialDecoder.ts` (same decoder, browser runtime)

---

## Long-term: B2B insurance architecture
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

## File Structure (current, accurate as of Sprint 6 - 2026-03-24)

```
waterheater-vault/
├── app/
│   ├── (consumer)/                 ✅ NEW - Tesla-sleek consumer routes
│   │   ├── layout.tsx              Minimal consumer layout (black bg, no nav)
│   │   ├── page.tsx                Landing: big Scan button, simple value prop
│   │   ├── scan/
│   │   │   └── page.tsx            Camera interface + on-device vision (Tesseract + pattern matching)
│   │   ├── profile/
│   │   │   ├── page.tsx            Simple homeowner card (age, life, cost - NO jargon)
│   │   │   └── details/
│   │   │       └── page.tsx        Rich technical view (serial, BTU, specs - for plumbers)
│   │   └── send-plumber/
│   │       └── page.tsx            Hero flow: TCPA consent + job ticket generation
│   │
│   ├── pro/                        ✅ KEPT - Plumber routes (will update Phase 3)
│   │   ├── page.tsx                Pro marketing: $49/mo, geofenced zones
│   │   ├── claim/page.tsx          Zone claim page
│   │   ├── onboard/page.tsx        Pro signup: GBP screen → Stripe checkout
│   │   ├── directory/page.tsx      Public directory of screened pros
│   │   └── dashboard/page.tsx      Pro dashboard
│   │
│   ├── layout.tsx                  ✅ UPDATED - Root layout (no TopNav, minimal)
│   └── globals.css                 ✅ KEPT - Tailwind base, black theme
│
├── lib/
│   ├── vision/                     ✅ NEW - 3-tier vision pipeline
│   │   ├── on-device-scanner.ts    Main scanner: Tesseract → Tier 1 → Tier 2 → Tier 3
│   │   ├── pattern-extractor.ts    Tier 1: Pattern matching (90% of scans, <1s, $0)
│   │   │                            - Brand detection (10 brands)
│   │   │                            - Serial extraction & decoding (8 formats)
│   │   │                            - Model/fuel/tank extraction
│   │   ├── prompt-templates.ts     Minimal prompts for on-device models
│   │   └── result-parser.ts        Validation, normalization, formatting
│   │
│   ├── profile/                    ✅ NEW - Profile system
│   │   ├── profile-builder.ts      buildSimpleProfile() + buildRichProfile() + buildJobTicket()
│   │   └── job-ticket.ts           Pure client-side .ics + .csv export (works offline)
│   │
│   ├── auth.ts                     ✅ KEPT - Magic-link auth
│   ├── recallChecker.ts            ✅ KEPT - CPSC recall checking
│   └── types.ts                    ✅ KEPT - Type definitions
│
├── vault/
│   └── private.ts                  ✅ KEPT - IndexedDB vault implementation
│
├── functions/api/
│   ├── vision/                     ✅ NEW - Sprint 6 vision endpoints
│   │   └── grok-scan.ts            Tier 3: Grok Vision fallback (blurry/damaged labels)
│   │                                POST /api/vision/grok-scan
│   │                                Logs to D1 scan_events for analytics
│   │
│   ├── _utils/                     ✅ KEPT - Shared utilities
│   │   ├── wh-compute.ts           Shared: computeDerivedFields · braveSearch (old system)
│   │   ├── whSerialDecoder.ts      CF Workers serial decoder (old system)
│   │   ├── auth.ts                 requireSessionUser · signJwt · verifyJwt
│   │   └── http.ts                 CORS_HEADERS · jsonResponse
│   │
│   ├── recall-check.ts             ✅ KEPT - CPSC SaferProducts API proxy
│   ├── capture-lead.ts             ✅ KEPT - POST: save lead to D1
│   ├── detect-location.ts          ✅ KEPT - CF Worker geolocation → zip
│   │
│   ├── fast-lookup.ts              ⚠️ OLD - Tier 1 from Sprint 5 (not used by new consumer routes)
│   ├── parse-text.ts               ⚠️ OLD - Tier 2 from Sprint 5 (not used by new consumer routes)
│   ├── grok-scan.ts                ⚠️ OLD - Tier 3 from Sprint 5 (moved to /api/vision/grok-scan)
│   ├── pro/                        ✅ KEPT - Plumber endpoints
│   │   ├── checkout.ts             Stripe checkout ($49/mo only in Sprint 6)
│   │   ├── claim.ts                Free plumber claim → pro_claims D1
│   │   ├── directory.ts            GET screened pros (public)
│   │   ├── search-business.ts      Brave Search GBP lookup
│   │   ├── stats.ts                GET /api/pro/stats?zip=
│   │   └── webhook.ts              Stripe webhook handler
│   ├── auth/                       ✅ KEPT - Authentication
│   │   ├── send-magic-link.ts      Resend email + signed JWT
│   │   ├── verify.ts               Validate token, set session cookie
│   │   └── me.ts                   Return user from session
│   └── vault/                      ✅ KEPT - Vault sync
│       ├── sync.ts                 GET all items / POST upsert (authed)
│       └── item/[id].ts            DELETE item (authed)
│
├── workers/
│   └── reminder-cron.ts            Cloudflare Cron Worker: quarterly lead reminders via Resend
│
├── archive/                        ✅ NEW - Sprint 6 tree-shake
│   ├── app-scan-old/               Old scan route (Tesseract + brain router)
│   ├── app-results-old/            Old results page
│   ├── app-vault-old/              Old vault implementation
│   ├── app-debug-old/              Old debug page
│   ├── app-components-old/         Old components (TopNav, Logo, InvitePlumberButton, etc.)
│   ├── app-page-old.tsx            Old landing page
│   ├── brain-old/                  Old 3-tier router (on-device.ts + router.ts)
│   ├── lib-onDeviceExtractor-old.ts    Old Tesseract implementation
│   ├── lib-wh-lookup-old.ts        Old hardcoded lookup table (33KB)
│   ├── lib-whSerialDecoder-old.ts  Old serial decoder
│   └── lib-exportJobTicket-old.ts  Old job ticket exporter
│
├── migrations/                     All applied to remote D1
│   ├── 0001_auth_sync.sql          users + vault_items
│   ├── 0002_leads.sql              leads table
│   ├── 0003_pros.sql               pros table
│   ├── 0004_scan_events.sql        anonymous scan events
│   ├── 0005_pro_claims.sql         pro_claims table
│   ├── 0006_leads_sms.sql          adds phone + sms_consent to leads
│   ├── 0007_serial_cache.sql       serial_cache table (exact-hit cost control)
│   ├── 0008_leads_reminder.sql     adds last_reminded_at to leads
│   └── 0009_learn.sql              serial_patterns + model_catalog (self-improving flywheel)
│
├── public/                         favicon.ico · icons/192+512 · manifest.json · sw.js · _redirects
├── scripts/generate-icons.js       SVG → sharp → 192/512/favicon PNGs
├── next.config.mjs                 output: 'export', images.unoptimized: true
├── tailwind.config.ts              black/white/blue-accent + pulse-glow keyframes
├── wrangler.toml                   CF Pages binding: DB (D1) + env vars
├── wrangler.workers.toml           CF Cron Worker config for reminder-cron.ts
└── package.json                    Next 14 · React 18 · TS · Tailwind · Tesseract.js
```

---

## Lookup Table Spec (`lib/wh-lookup.ts`)

Ships in the app bundle — no network, no D1, works fully offline. Primary decode path for 90%+ of US installs.

### Interfaces

```typescript
export interface BrandSpec {
  brand: string
  aliases: string[]         // all names this brand appears as on labels
  serialPattern: 'WWYY' | 'YYWW' | 'BWL' | 'YYMM' | 'YYYYWW' | 'YYYYMM' | 'LETTER_YY'
  serialOffset: number      // char position to start reading the date code
}

export interface ModelSpec {
  brand: string
  modelPrefix: string       // match first N chars of scanned model number (case-insensitive)
  description: string
  tankGallons: number | null  // null for tankless
  fuelType: 'natural_gas' | 'propane' | 'electric' | 'heat_pump'
  inputBtuOrWatts: number
  firstHourRating: number   // gallons/hr
  expectedLifeYears: number
  unitCostMin: number       // total installed USD (national avg)
  unitCostMax: number
  laborHours: number
}
```

### Brand Serial Rules

| Brand | Aliases | Pattern | Offset | Notes |
|-------|---------|---------|--------|-------|
| Rheem | Ruud | `WWYY` | 2 | Chars 3-4=week, 5-6=year |
| A.O. Smith | State, American, Whirlpool (OEM) | `YYWW` | 0 | Chars 1-2=year, 3-4=week |
| Bradford White | — | `BWL` | 1 | Char 2=year letter (A-Z cycles 20yr), 3-4=week |
| Navien | — | `YYYYMM` | 0 | Chars 1-4=year, 5-6=month |
| Rinnai | — | `YYMM` | 2 | Chars 3-4=year, 5-6=month |
| Noritz | — | `YYWW` | 0 | Chars 1-2=year, 3-4=week |
| Bosch | — | `YYYYWW` | 0 | Chars 1-4=year, 5-6=week |
| GE / GEO | Hotpoint | `LETTER_YY` | 0 | Char 1=month letter, 2-3=year |

Bradford White year letters (20-yr cycle, second cycle starts 2004):
```
A=1984/2004  B=1985/2005  C=1986/2006  D=1987/2007  E=1988/2008
F=1989/2009  G=1990/2010  H=1991/2011  J=1992/2012  K=1993/2013
L=1994/2014  M=1995/2015  N=1996/2016  P=1997/2017  R=1998/2018
S=1999/2019  T=2000/2020  V=2001/2021  W=2002/2022  X=2003/2023
Y=2004/2024  Z=2005/2025
```

GE month letters: `A=Jan B=Feb C=Mar D=Apr E=May F=Jun G=Jul H=Aug J=Sep K=Oct L=Nov M=Dec`

### `lookupBySerial(serial, brand)` Logic

```
1. Normalize brand → canonical name via aliases
2. Find BrandSpec → read date code from serialOffset using pattern
3. Convert week/month + year → manufactureDate string (YYYY-MM)
4. Find ModelSpec by longest matching modelPrefix (case-insensitive)
5. If no model match → return brand + date only (partial hit)
6. Compute ageYears, remainingLifeYears, cost range
7. Return full ModelSpec + computed fields
```

---

## Export Job Ticket Spec (`lib/exportJobTicket.ts`)

Pure string builders. Zero dependencies. Works offline after scan completes.

### `exportICS(data: ExportData): void`

```typescript
interface ExportData {
  brand: string
  model: string
  serial: string
  ageYears: number
  remainingLifeYears: number
  fuelType: string
  tankGallons: number | null
  costMin: number
  costMax: number
  manualUrl: string
  recallStatus: string
  zip?: string
}
```

Generates RFC 5545 compliant `.ics`:
- `SUMMARY`: `💧 Water Heater Service — {Brand} {Model} (Age {N}yr)`
- `DTSTART`: today + 7 days, 9:00 AM local
- `DTEND`: today + 7 days, 11:00 AM local
- `DESCRIPTION`: full report text (serial, age, cost, manual, recall)
- `LOCATION`: zip if available
- `UID`: `WH-{serial}-{timestamp}@waterheaterplan.com`

Trigger: creates `<a href="data:text/calendar;...">` and clicks it programmatically.  
File: `WaterHeater-Job-{serial}.ics`

### `exportCSV(data: ExportData): void`

Single-row CSV with header, ready for paste into Housecall Pro / Jobber / ServiceTitan:

```
Type,Zip,Brand,Model,Serial,Est.Install Year,Age (yr),Remaining (yr),Fuel,Gallons,Cost Min,Cost Max,Manual URL,Recall,Source
Water Heater,{zip},{brand},{model},{serial},{year},{age},{remaining},{fuel},{gal},{min},{max},{url},{recall},WaterHeaterVault
```

Trigger: same `<a download>` pattern.  
File: `WaterHeater-Job-{serial}.csv`

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
| 28 | **`lib/wh-lookup.ts`** | 🔲 NEXT | Hardcoded lookup: 10 brands + ~500 models. `ModelSpec` + `BrandSpec` interfaces. Brand serial decode rules (WWYY/YYWW/BWL/YYMM/YYYYWW/YYYYMM/LETTER_YY). Ships in app bundle — zero network. |
| 29 | **`lib/exportJobTicket.ts`** | 🔲 NEXT | `exportICS(data)` + `exportCSV(data)` — pure string builders, `<a download>` trigger. Zero deps. Works offline. |
| 30 | **Wire lookup to router** | 🔲 | `brain/router.ts`: Tier 0 — lookup table check before fast-lookup D1. If match + confidence, skip all LLM. |
| 31 | **Export Job Ticket on results page** | 🔲 | Hero button on `/results`. Two download links: `.ics` + `.csv`. Above the PDF button. |
| 32 | **Lookup table fallback** | 🔲 | If lookup miss: fall through to existing 3-tier hybrid (fast-lookup D1 → text-parse LLM → vision). |
| 33 | **`/debug` NODE_ENV guard** | 🔲 | Add `if (process.env.NODE_ENV !== 'development') notFound()` |

**What is FORBIDDEN in Sprint 6:**
- Expansion beyond water heaters
- File storage / uploads
- National pro directory until local business is profitable
- Any feature that adds friction to: scan → instant result → export → text plumber

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

### Sprint 6 — Offline Core + Export Job Ticket + Scan Reliability (SHIPPED 2026-03-23)

**Objective:** Reliable scans every time. Plumber gets a job ticket in one tap. Lookup table enriches results offline.

**SHIPPED:**
- `lib/wh-lookup.ts` — 135+ real models across 10 brands. `lookupByModelPrefix()` + `lookupBySerial()` + `getAllCommonModels()`. Ships in app bundle — zero network.
- `lib/exportJobTicket.ts` — `exportICS(data)` + `exportCSV(data)`. RFC 5545 compliant. Two calendar events (service + annual check). Housecall Pro / Jobber / ServiceTitan CSV format. Zero deps. Works fully offline.
- `app/results/page.tsx` — Export Job Ticket buttons (`.ics` + `.csv`) wired. Lookup table client-side merge for price range + life enrichment + manual/warranty links.
- **Scan reliability fixes** — three root causes eliminated:
  - Brave Search timeout 4s → 2s, capped at 3 docs (was 5) — prevents CF 30s wall-clock overflow
  - Image capture quality 0.72 → 0.85, max width 1024px → 1280px — better Grok accuracy on faded labels
  - Auto-retry on transient 5xx errors in `brain/on-device.ts` — 1.5s delay + second attempt before surfacing error
  - Brand-only Level 2 gate removed — partial results (brand found, no serial) now flow through instead of erroring
  - Processing animation 5s → 18s, copy updated to "Reading label with Grok Vision… 8-15 seconds"

**60-Day Plan:**
- Days 1–10: lookup table + export wired + verified <3s offline
- Days 11–20: scan-to-result UX polished, PDF embeds job ticket data
- Days 21–40: local market (yard signs, Nextdoor, 1 zip code)
- Days 41–60: second zip, first $49/mo paying plumber confirmed

**FORBIDDEN:** expansion beyond water heaters · file uploads · national pro directory until profitable · any friction in scan→result→export→text flow

---

### 2026-03-22 (night) — Sprint 5: Hybrid Pipeline + Self-Improving Flywheel

**SHIPPED**
- **3-tier hybrid scan architecture** (`brain/router.ts`) — confidence gate routes every scan: Tier 1 fast-lookup (<100ms, no LLM) → Tier 2 text-parse (~1-2s, text LLM) → Tier 3 grok-vision (~10-25s, fallback only). Eliminates 30s timeouts permanently.
- **Self-improving flywheel** (`migrations/0009_learn.sql`) — two new D1 tables: `serial_patterns` (brand → decode pattern + confidence, updated after every scan) and `model_catalog` (brand+model_prefix → fuel/tank specs). When brand has ≥10 samples at ≥90% confidence, future scans skip the LLM entirely.
- **`/api/fast-lookup`** (`functions/api/fast-lookup.ts`) — new CF Function: serial_cache exact match OR pattern decode + model catalog → full result in <100ms with zero LLM cost.
- **`/api/parse-text`** (`functions/api/parse-text.ts`) — new CF Function: receives raw OCR text, calls `grok-2-1212` (text-only), 10× faster + 20× cheaper than vision. Writes to serial_cache + calls `learnFromScan()`.
- **Canvas OCR preprocessing** (`lib/onDeviceExtractor.ts`) — grayscale + contrast enhancement before Tesseract. PSM-6 + char whitelist via worker API. Adds `confidenceScore` (0-100), `serialCandidate`, `detectedBrand` to `OnDeviceExtractionResult`. +20-40% accuracy on shiny labels.
- **JS serial decoder** (`lib/whSerialDecoder.ts`, `functions/api/_utils/whSerialDecoder.ts`) — client + CF Worker brand detection + date decode for all major brands (Rheem WWYY, AO Smith YYWW, Bradford White BWL, Navien/Noritz YYWW, Rinnai YYMM, Bosch YYYYWW, GE LETTER_YY).
- **Shared CF utilities** (`functions/api/_utils/wh-compute.ts`) — `computeDerivedFields`, `extractOutermostJson`, `braveSearch`, `learnFromScan`, `normalizeBrand`, `getBrandPatternType`, `WH_SYSTEM`, `WH_TEXT_SYSTEM` extracted from grok-scan.ts. All three scan endpoints share the same logic.
- **`brain/on-device.ts`** — added `extractFromText()` (calls /api/parse-text) and `extractFastLookup()` (calls /api/fast-lookup, returns null on miss).
- **`grok-scan.ts`** refactored — imports from `_utils/wh-compute`, adds `learnFromScan()` call after every successful vision scan. ~150 lines removed (DRY).

**All migrations applied remotely ✅** — 0001 through 0009 live in D1.

---

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
