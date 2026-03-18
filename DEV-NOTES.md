# WarrantyFile — Dev Notes
**SINGLE SOURCE OF TRUTH. Read before every session. Update after every meaningful change.**

---

# ═══ PART 1 — VISION & STRATEGY ═══
*Changes only when a fundamental business decision changes.*

---

## What This Is

WarrantyFile is a **premium minimalist product lifecycle vault**. Snap a photo of anything you own — it becomes a verified, editable record with AI-extracted specs, current market value, official documentation links, and active warranty/recall tracking.

**Tagline:** *Warranties, manuals, pics.*

**One-sentence pitch (consumer):** *"It's like a CarFax for everything you own — it tells you when your warranty expires, when your stuff needs service, and if anything gets recalled."*

**One-sentence pitch (insurer):** *"Your policyholders get a 5% discount for documenting their belongings — you get verified pre-loss inventory that deters fraud and cuts claim settlement from 90 days to 5."*

---

## Business Model

### Layer 1 — Consumer (current)
| Tier | Price | What you get |
|------|-------|-------------|
| Free | $0 | Scan + file, up to 10 items |
| Guardian | $4.99/mo or $39/yr | Unlimited items · warranty expiry alerts · CPSC recall matching · service reminders · claim export PDF |

**Why people pay:** Not for storage. For the notification they didn't know they needed — a warranty expiring, a recall on their kid's stroller, a service interval overdue.

### Layer 2 — B2B Insurance (next phase)
Insurers offer a 5% contents-coverage discount to policyholders who use WarrantyFile. The insurer's math:

```
They give up:  $60/yr (5% of $1,200 avg premium)
They save:     ~$1,400 in deterred fraud per claim
               ~$320 in adjuster settlement costs
Net benefit:   ~$700/policy/year
```

Revenue structures:
- **White-label:** Insurer brands app as theirs. We charge $2-4/policyholder/month.
- **API verification:** Per-claim check — "was this item in the policyholder's vault pre-loss?" $5-15/call.
- **Data licensing:** Aggregate anonymized replacement cost database sold to Verisk/CoreLogic. Worth $1-5M/yr at scale.

### Layer 3 — Acquisition Exit
Target: **$2-10M acquisition** by an InsurTech within 12-18 months.

| Milestone | Price range unlocked |
|-----------|---------------------|
| 10k active users + recall alerts live | $1-3M |
| 25k users + Guardian MRR + press story | $3-5M |
| B2B pilot or MOU with one insurer | $5-10M |
| 50k users + signed B2B contract | $10-20M |

**Most likely acquirers:** Lemonade, Hippo, Encircle, Verisk, Branch.

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

## Core Architectural Pattern

**"AI understands → Brave verifies."**

This is the fundamental design principle of the enrichment pipeline:
- **Grok** understands what the product is, what the label says, what it's worth, and what documentation exists
- **Brave Search** finds live, verified URLs for everything Grok identifies — docs, serial decoders, support pages

Grok never hallucinates a URL. It only generates search queries. Brave finds the actual current page.
This pattern extends to every type of reference data: manuals, warranty terms, serial date decoders, support pages.

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

### Sprint 1 — Acquisition-ready features

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | **CPSC recall alerts** | ✅ Done | CF proxy + recallChecker + vault badges + item banner |
| 2 | **Manufacture date + serial decoder** | ✅ Done | Grok prompts, on-device parse (MFG label), results + vault UI, serialDecoder doc type |
| 3 | **Warranty expiry engine** | 🔲 Next | Parse warranty string → expiry date. Active/Expiring Soon/Expired badge. |
| 4 | **Vault total value display** | 🔲 | Sum valuations. "Your belongings: $43,200." Shareable. |
| 5 | **Immutable audit timestamp log** | 🔲 | Proves pre-loss to insurers. Simple field, high B2B value. |
| 6 | **Claim export PDF** | 🔲 | One button. Photos, serials, values, dates. The insurer demo. |

### Sprint 2 — Technical foundation

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 7 | **Merge recall check into grok-scan** | 🔲 | Run CPSC check in parallel with Brave Search. New items born with recall status. |
| 8 | **Thumbnail compression** | 🔲 | Canvas-resize to ~800px JPEG on save. Ticking time bomb at 30+ items. |
| 9 | **Vault search** | 🔲 | Filter by product/brand/model. Essential at 20+ items. |
| 10 | **Desktop drag-and-drop scan** | 🔲 | Desktop users can't use camera. File drop zone on /scan. |

### Sprint 3 — Monetization

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 11 | **PWA install prompt** | 🔲 | After first scan: "Add to home screen for recall alerts." |
| 12 | **Stripe + Guardian paywall** | 🔲 | Free: 10 items. Guardian: unlimited + Sprint 1 features. |
| 13 | **Service interval reminders** | 🔲 | User sets interval. App reminds. Core Guardian feature. |

### Sprint 4 — B2B unlock

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 14 | **User auth + cloud sync** | ✅ Done | Magic link (Resend), JWT session, D1 vault_items, IndexedDB sync queue, local-wins merge |
| 15 | **Insurer sharing layer** | 🔲 | Consent-based verified inventory report. Signed token. API endpoint. |

### Sprint 5 — Polish

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 16 | **First-run onboarding** | ✅ Done | One screen, once: logo + pitch + email magic link + Skip (local-only) |
| 17 | **Scan success moment** | 🔲 | 0.8s overlay: checkmark + product name post-save. |
| 18 | **Offline indicator** | 🔲 | "Online · Grok active" vs "Offline · On-device only" |
| 19 | **Guard /debug route** | 🔲 | NODE_ENV check. Currently writes to real vault in production. |
| 20 | **Security audit** | 🔲 | CF Function CORS, rate limiting, IndexedDB scope. |

---

## Target Acquirers

| Company | Why they'd buy | When to approach |
|---------|---------------|-----------------|
| **Lemonade** | Tech InsurTech, public, fraud-obsessed, perfect consumer fit | After CPSC press story |
| **Hippo** | "Proactive home protection" is their brand. We're the missing piece. | After Sprint 1 complete |
| **Encircle** | They own post-claim. We own pre-claim. Complementary stack. | After 25k users |
| **Verisk** | They want the aggregate replacement cost database | After 50k+ items |
| **Branch** | Fast-growing bundled insurer, tech-forward, smaller = faster deal | After Guardian live |

---

# ═══ PART 4 — CHANGE LOG ═══

### 2026-03-15 — Session 1
Full build phases 0–7.5. Two-shot scan, Tesseract OCR, Grok-4.20-beta, Brave Search docs, IndexedDB vault, edit/delete, WF logo, favicon, PWA manifest. Live at warrantyfile.com. Both API keys active.

### 2026-03-15 — Session 2
Desktop restyle (App Shell + TopNav), logo rework (WF+line, no rect), favicon strategy, full tree shake, DEV-NOTES restructured.

### 2026-03-15 — Session 3
Insurance B2B strategy. Guardian tier. CPSC recall hook. Acquisition path. Priority list reordered.

### 2026-03-16 — Session 5
- `ExtractedData` made fully flexible: `category?` + `customFields?: Record<string, string|number|null>` added
- `VaultEvent` interface added to `vault/private.ts` — unified event model for any category
- `events?: VaultEvent[]` added to `VaultItem` (optional, backward compat — defaults to [])
- `warranty` and `purchaseDate` made optional in `ExtractedData` (appliances have them, whisky doesn't)
- Both Grok system prompts now return `category` + `customFields` with category-specific examples
- `on-device.ts` and `router.ts` map the new fields through the full pipeline
- Vault item detail renders `customFields` dynamically — camelCase keys auto-formatted, category label as section header
- `OnDeviceExtractionResult` interface updated to match (category, customFields, optional fields)
- Architecture: "Everything Vault" vision documented — watches, whisky, wine, collectibles, instruments, vehicles all supported via the same flexible schema

### 2026-03-17 — Auth + Sync + Mfg Date
- Auth + cloud sync: magic link (Resend), JWT session cookie, D1 users/vault_items, CF Functions
- Onboarding: first-visit prompt on /, email input + Skip (local-only), stored in localStorage
- Vault sync: IndexedDB primary, cloud sync queue, mergeFromCloud on login, local-wins conflict
- Manufacture date: on-device parse (MFG label patterns), results page display, vault alwaysShow
- DEV-NOTES + README updated to reflect current state

### 2026-03-16 — Session 4
- CPSC recall alerts: CF proxy (`recall-check.ts`), `recallChecker.ts`, vault badges, item detail banner
- Valuation fix: `VALUATION_RULES` prompt block, `toNum()` helper, max_tokens 1500→2000
- `manufactureDate` field: added to ExtractedData, both Grok prompts, FIELDS in vault item
- Category map: 25 categories, `secondaryHint` added to all, `car/vehicle` category added, precise visual landmarks
- Router gap fixed: `onDeviceToExtractedData()` now passes `manufactureDate` through
- `serialDecoder` doc type: Grok adds this for water heaters/HVAC/furnaces so Brave finds the right decoder page
- Manufacture date prompt: 2-step logic (explicit label first → serial decode fallback → null if uncertain)
- DEV-NOTES: full rewrite — core architectural pattern documented ("AI understands → Brave verifies"), serial decoder pattern, near-term pipeline merge opportunity, file tree updated
