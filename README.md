# WarrantyFile

**Warranties, manuals, pics.**

Snap a photo. It's filed forever.

---

## What it is

A minimalist PWA that turns photos of warranties, receipts, and product labels into a clean, editable vault. Works offline. No password — optional magic-link sync keeps your vault on any device. Local-only by default.

Two-shot guided scan: first photo identifies the product, second targets the serial/model label. Grok-4 handles precise extraction, valuation, and surfacing real manual/warranty links via Brave Search. Tesseract OCR handles basic offline extraction when you're not connected.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 — static export, all `use client` |
| Styling | Tailwind CSS — `#000000` black, white text, `#0066ff` blue |
| On-device AI | Tesseract.js OCR (offline, ~4MB, instant) |
| Cloud AI | Grok-4.20-beta via xAI API |
| Docs search | Brave Search API — live verified manual/warranty URLs |
| Storage | IndexedDB — private, offline-first; optional D1 cloud sync via magic-link auth |
| Deployment | Cloudflare Pages — static site + CF Pages Functions |
| PWA | Service worker + manifest, installable on iOS/Android |

## Routes

| Route | What it does |
|-------|-------------|
| `/` | Home — WF logo, Scan, Vault |
| `/scan` | Two-shot guided camera scan |
| `/results` | Extracted data + docs links + save |
| `/vault` | Saved items (mobile cards / desktop table) |
| `/vault/item?id=xxx` | Item detail, inline editing, delete |
| `/debug` | Dev tool — full pipeline test with step logs |

## Dev commands

```bash
pnpm install
pnpm dev          # localhost:3000
pnpm build        # Static export → out/
pnpm icons        # Regenerate all icons from SVG (run after logo changes)
```

## Deployment

Cloudflare Pages auto-deploys from `main`.

**Required secrets in CF Pages → Settings → Environment Variables:**

| Key | What it does |
|-----|-------------|
| `GROK_API_KEY` | xAI Grok Vision API key |
| `BRAVE_API_KEY` | Brave Search API key (manual/warranty link enrichment) |
| `RESEND_API_KEY` | Resend.com — magic link emails (for auth/sync) |
| `JWT_SECRET` | Sign/verify tokens (32+ chars) |
| D1 binding `DB` | Cloudflare D1 — users + vault_items (see wrangler.toml) |

---

See [DEV-NOTES.md](./DEV-NOTES.md) for full architecture, decisions, and progress.
