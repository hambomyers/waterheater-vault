# Backend Configuration - Clean & Ready

**Date:** 2026-03-24  
**Status:** ✅ Wrangler configured for new architecture

---

## Cloudflare Configuration

### wrangler.toml (Updated)
- ✅ D1 database binding configured
- ✅ Environment variables documented
- ✅ Comments updated for 3-tier architecture
- ✅ Removed old API key references (Google Vision, OpenRouter)

### Required Environment Variables

Set these in **Cloudflare Pages → Settings → Environment Variables:**

| Variable | Purpose | Required |
|----------|---------|----------|
| `GROK_API_KEY` | Grok Vision (Tier 3 fallback, ~2% of scans) | ✅ Yes |
| `RESEND_API_KEY` | Email delivery (magic links, job tickets) | ✅ Yes |
| `JWT_SECRET` | Token signing (32+ chars) | ✅ Yes |
| `STRIPE_SECRET_KEY` | Stripe checkout sessions | ✅ Yes |
| `STRIPE_PRICE_ID_MONTHLY` | Stripe Price ID for $49/mo | ✅ Yes |
| `BRAVE_API_KEY` | Brave Search (optional, for manual docs) | ⚠️ Optional |

---

## API Endpoints

### New Endpoints (Sprint 6)

**`/api/vision/grok-scan` (Tier 3 Fallback)** ✅ Created
- POST endpoint for Grok Vision API
- Only called when Tier 1 and Tier 2 fail
- Handles blurry/damaged labels
- Logs to D1 for analytics
- Returns full ScanResult

### Existing Endpoints (Keep)

**Auth:**
- `/api/auth/login` - Magic link login
- `/api/auth/verify` - Verify JWT token
- `/api/auth/logout` - Logout

**Pro:**
- `/api/pro/onboard` - Plumber signup with GBP screening
- `/api/pro/webhook` - Stripe webhook handler
- `/api/pro/directory` - Public directory of screened pros
- `/api/pro/dashboard` - Pro dashboard data

**Utility:**
- `/api/capture-lead` - Lead capture from results page
- `/api/recall-check` - CPSC recall checking
- `/api/detect-location` - Zip code from IP

### Deprecated Endpoints (Archive Later)

**Old Vision Pipeline:**
- ❌ `/api/fast-lookup` - Old Tier 1 (D1 pattern decode)
- ❌ `/api/parse-text` - Old Tier 2 (text LLM)
- ❌ `/api/grok-scan` - Old Tier 3 (moved to `/api/vision/grok-scan`)

**Note:** These still exist but are not used by new consumer routes. Can archive after testing confirms new flow works.

---

## Database (D1)

### Existing Tables (Keep All)
- `users` - User accounts
- `vault_items` - Saved water heaters
- `leads` - Lead captures
- `pros` - Plumber accounts
- `pro_claims` - Plumber zone claims
- `scan_events` - Anonymous scan analytics
- `serial_cache` - Serial number cache
- `serial_patterns` - Self-learning patterns (old system)
- `model_catalog` - Model specifications (old system)

### Migrations Status
All migrations applied (0001-0009). No new migrations needed for Sprint 6.

### Future Tables (Phase 3)
- `zones` - Geofenced zones (zip_code, max_plumbers)
- `zone_claims` - Zone ownership (zone_id, pro_id, claimed_at)

---

## Deployment

### Cloudflare Pages (Automatic)
- Deploys on push to `main` branch
- Static export from Next.js (`out/` directory)
- Functions in `functions/` directory auto-deployed

### Manual Deploy (if needed)
```bash
# Build static export
pnpm build

# Deploy to Cloudflare Pages (automatic on git push)
# Or manual: wrangler pages deploy out
```

### Workers (Cron Jobs)
```bash
# Deploy reminder cron worker
wrangler deploy --config wrangler.workers.toml

# Set secrets (one-time)
wrangler secret put RESEND_API_KEY --config wrangler.workers.toml
```

---

## Testing Backend

### Test Tier 3 Fallback
```bash
# Test Grok Vision endpoint
curl -X POST https://waterheaterplan.com/api/vision/grok-scan \
  -H "Content-Type: application/json" \
  -d '{"image": "base64_image_data_here"}'
```

### Test Pro Endpoints
```bash
# Test directory
curl https://waterheaterplan.com/api/pro/directory

# Test onboard (requires GBP URL)
curl -X POST https://waterheaterplan.com/api/pro/onboard \
  -H "Content-Type: application/json" \
  -d '{"gbpUrl": "https://g.co/kgs/..."}'
```

### Check D1 Database
```bash
# List tables
wrangler d1 execute waterheater-vault --command "SELECT name FROM sqlite_master WHERE type='table';" --remote

# Check scan events
wrangler d1 execute waterheater-vault --command "SELECT * FROM scan_events ORDER BY created_at DESC LIMIT 10;" --remote

# Check pros
wrangler d1 execute waterheater-vault --command "SELECT name, zip, active FROM pros;" --remote
```

---

## Architecture Flow

### Client-Side (On-Device)
```
User captures image
       ↓
Tesseract.js OCR (browser)
       ↓
Tier 1: Pattern matching (browser)
       ↓
Success? → Return result
       ↓
Fail? → Call /api/vision/grok-scan
```

### Server-Side (Cloudflare)
```
/api/vision/grok-scan receives image
       ↓
Call Grok Vision API (xAI)
       ↓
Parse JSON response
       ↓
Calculate derived fields
       ↓
Log to D1 (scan_events)
       ↓
Return ScanResult to client
```

---

## Cost Estimates

### Per 1,000 Scans
- **Tier 1 (90%):** 900 scans × $0 = $0
- **Tier 2 (8%):** 80 scans × $0 = $0 (TODO)
- **Tier 3 (2%):** 20 scans × $0.01 = $0.20

**Total:** ~$0.20 per 1,000 scans (0.02¢ per scan)

### Monthly at Scale
- 10,000 scans/month = $2
- 100,000 scans/month = $20
- 1,000,000 scans/month = $200

**Plus:**
- Cloudflare Pages: Free (100,000 requests/day)
- Cloudflare D1: Free (5GB storage, 5M reads/day)
- Cloudflare Workers: Free (100,000 requests/day)

---

## Security Notes

### API Keys
- ✅ All keys stored as environment variables (not in code)
- ✅ Never committed to git
- ✅ Separate keys for dev/staging/production

### Authentication
- ✅ JWT-based auth (no sessions)
- ✅ Magic links via Resend (no passwords)
- ✅ Tokens expire after 7 days

### Rate Limiting
- ⏭️ TODO: Add rate limiting to vision endpoints
- ⏭️ TODO: Add CORS headers for production domain only

---

## Next Steps

1. ✅ Wrangler.toml updated
2. ✅ Grok Vision endpoint created
3. ⏭️ Test new flow end-to-end
4. ⏭️ Deploy to staging
5. ⏭️ Monitor Tier 3 usage (should be <5%)
6. ⏭️ Add rate limiting
7. ⏭️ Create zone management endpoints (Phase 3)

---

**Backend is clean and ready for new architecture.** 🚀
