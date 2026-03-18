# Grok Architecture Prompt for WarrantyFile — Phase 3

Copy this entire prompt into Grok and ask for implementation guidance.

---

## Context

I'm building **WarrantyFile** — a PWA that lets users snap a photo of a warranty, receipt, or product and instantly extracts structured data + current market valuation into a personal vault (like a spreadsheet of everything you own). Deployed on **Cloudflare Pages** (static export).

### Stack
- **Framework:** Next.js 14 with `output: 'export'` (static HTML/CSS/JS in `out/` directory)
- **Hosting:** Cloudflare Pages at warrantyfile.pages.dev / warrantyfile.com
- **Storage:** IndexedDB on-device (offline-first), `vault/private.ts` using `PrivateVault` class
- **UI:** TailwindCSS, pure black `#000000` minimalist design, white text, single blue accent `#0066ff`, SF Pro font
- **PWA:** Service worker (network-first HTML, cached static assets) + manifest

### Design Language
Tesla/SpaceX-inspired extreme minimalism. Mobile home screen has exactly 3 elements centered on black: "WF" text logo, blue "Snap a photo" oval pill button, white "Vault" oval pill button. No gradients, no heavy shadows, no clutter. Confidence through emptiness.

---

## Current State — Honest Audit

### What WORKS
- **Scan flow:** Mobile camera capture on tap, desktop drag-and-drop file import. Both convert image to Blob and call `brainRouter.processImage(blob)`.
- **Results page:** Shows extracted data fields (product, brand, model, date, warranty, serial, price, valuation) and a "Save to Vault" button.
- **IndexedDB vault:** `vault/private.ts` has full CRUD — `addItem()`, `getItems()`, `updateItem()`, `deleteItem()`, `getStats()`. Items include `extractedData`, `valuation`, `imageData` (base64 string), `tags`, `notes`.
- **Layout:** `app/layout.tsx` renders a `BottomNav` component (white oval "Vault" button fixed at bottom, hidden on home page, visible on `/scan` and `/results`).
- **Build:** `pnpm build` passes with zero errors, static export to `out/`.

### What's COMPLETELY MOCK / FAKE
1. **`brain/on-device.ts`** — `extractFromImage()` tries to `fetch('/api/grok-scan')` but **that endpoint doesn't exist** (the `app/api/` directory was deleted). It always catches the error and falls back to `getMockResult()` which returns `"Sample Product" / "Unknown Brand" / all zeros`. Every scan produces the same fake data.
2. **`brain/cloud.ts`** — `refreshValuation()` is a placeholder that returns zeros. Not wired to anything.
3. **`loop/aggregator.ts`**, **`loop/refiner.ts`**, **`loop/cron.ts`** — Entire self-improvement pipeline is scaffold only with `// TODO: Phase 3` everywhere. In-memory signals, localStorage prompts, no real Grok calls.
4. **`vault/shared.ts`** — `SharedVault` stores signals in-memory only, no Cloudflare KV.
5. **`config/models.ts`** — `BITNET_CONFIG` points to non-existent ONNX model file. `ModelRegistry` is in-memory only.

### What's BROKEN
1. **Icon:** `public/icons/192x192.png` exists but browser console says: `Error while trying to use the following icon from the Manifest: https://warrantyfile.com/icons/192x192.png (Download error or resource isn't a valid image)`. The PNG is probably corrupt or placeholder.
2. **No vault page:** The "Vault" button on the home page links to `/` (itself). There is **no vault contents view** — users can save items to IndexedDB but have no way to see them. This is the biggest UX gap.
3. **No API endpoint:** `on-device.ts` calls `fetch('/api/grok-scan')` but no such route exists. Needs a CF Pages Function.

### File-by-File Summary
```
app/
  layout.tsx          — Root layout, imports BottomNav, wraps children in pb-16 div
  page.tsx            — Home: WF logo text, blue "Snap a photo" oval, white "Vault" oval
                        Also has desktop marketing layout with vault stats cards
  scan/page.tsx       — Camera capture (mobile) + drag-drop (desktop), calls brainRouter
  results/page.tsx    — Shows extracted data + "Save to Vault" + "Scan Another" buttons
  components/
    BottomNav.tsx     — White oval "Vault" button, fixed bottom, hidden on home page

brain/
  on-device.ts        — extractFromImage(): tries /api/grok-scan, falls back to mock
  cloud.ts            — refreshValuation(): returns zeros (placeholder)
  router.ts           — BrainRouter.processImage(): calls on-device.ts, wraps result

vault/
  private.ts          — IndexedDB PrivateVault: full CRUD, getStats(), works correctly
  shared.ts           — In-memory SharedVault: scaffold only

loop/
  aggregator.ts       — SignalAggregator: scaffold with TODOs
  refiner.ts          — PromptRefiner: scaffold with TODOs
  cron.ts             — SelfImprovementCron: scaffold with TODOs

config/models.ts      — ModelConfig types + registry, all in-memory
public/manifest.json  — PWA manifest, references possibly-corrupt icons
public/sw.js          — Service worker, network-first HTML, cache static
```

---

## What I Need — Prioritized

### Priority 1: Wire up real Grok Vision API
The most important thing is making the scan actually work. When a user snaps a photo, I need real data back.

**Current flow:** Scan page → `brainRouter.processImage(blob)` → `on-device.ts` → `fetch('/api/grok-scan')` → 404 → mock data.

**Desired flow:** Scan page → `brainRouter.processImage(blob)` → `on-device.ts` → `fetch('/api/grok-scan')` → **CF Pages Function** → **Grok Vision API** → structured JSON back to client → display on results page → save to IndexedDB vault.

I need:
- **Which Grok model supports vision?** (`grok-2-vision-latest`? what's current?)
- **Exact API request format** for sending a base64 image to Grok Vision
- **A system prompt** that tells Grok: "Look at this photo of a product/receipt/warranty. Extract structured data AND estimate current market value. Return clean JSON only."
- **A CF Pages Function** at `functions/api/grok-scan.ts` that:
  - Accepts base64 image from the client POST
  - Reads `GROK_API_KEY` from CF environment secrets
  - Calls Grok Vision API
  - Returns the structured JSON
- **How to set `GROK_API_KEY`** as a secret in Cloudflare Pages dashboard

The `on-device.ts` already has the client-side code to call `/api/grok-scan` and parse the response — I just need the server function to exist.

### Priority 2: Build a Vault Contents Page
Users can save to vault but can't see what's in it. I need a `/vault` page (or make the home page show vault contents) that:
- Lists all saved items from IndexedDB as clean rows (like a spreadsheet)
- Shows: product name, brand, date added, estimated value
- Tapping a row shows the full detail (photo thumbnail, all fields)
- Clean minimalist design matching the rest of the app
- Maybe a total value summary at the top

The `vault/private.ts` already has `getItems()` and `getStats()` — the data layer is ready, just needs UI.

### Priority 3: Fix Button Consistency
On mobile home screen, the "Snap a photo" button and "Vault" button should be **identical size**. Currently:
- "Snap a photo": `py-5 px-10 text-lg border-2 border-blue-accent rounded-full`
- "Vault": `py-5 px-10 text-lg border-2 border-white border-opacity-20 rounded-full`

They have the same classes but I want to make sure they render the exact same dimensions and don't overlap. Also the BottomNav "Vault" button on scan/results pages should not overlap with page content.

### Priority 4: Fix PWA Icon
The `192x192.png` icon is corrupt or placeholder. I need a simple clean "WF" favicon — white text on black background, square. What's the simplest way to generate valid PNG icons programmatically or with a tool?

### Priority 5: Self-Improvement Loop (Future)
The `loop/` directory has the scaffold for daily self-improvement:
1. Users optionally correct AI mistakes → anonymized signals stored
2. Daily CF cron aggregates signals
3. Grok refines its own extraction prompt based on error patterns
4. New prompt version deployed

This is Phase 3+ and can wait, but I want the architecture to support it. The key question: should the extraction prompt be stored in CF KV and loaded by the CF Function on each call? That way the cron can update it without redeploying.

---

## Questions for Grok

1. What's the exact Grok Vision API endpoint, model name, and request format for sending a base64 image?
2. Can you write me the CF Pages Function (`functions/api/grok-scan.ts`) that proxies to Grok Vision?
3. What should the system prompt be to get both extraction + valuation in one call as clean JSON?
4. For the vault page — should it be a new route `/vault` or should the home page `/` show vault contents when items exist and the marketing view when empty?
5. What's the best way to generate simple "WF" PNG icons at 192x192 and 512x512?
6. For the self-improvement loop — should the prompt live in CF KV so it can be hot-swapped by the cron?

### What I Want Back
- Working CF Pages Function code for `functions/api/grok-scan.ts`
- The exact Grok Vision API request with a tuned system prompt
- A vault page component design (React + Tailwind) that reads from IndexedDB
- Architecture recommendation: where to put the prompt, how to version it
- Any gotchas with CF Pages Functions + Grok Vision API (size limits, timeouts, costs)
