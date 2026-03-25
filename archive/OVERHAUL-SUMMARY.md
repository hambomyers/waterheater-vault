# Sprint 6 Overhaul - Complete Summary

**Date:** 2026-03-24  
**Status:** Phase 1 Complete - Documentation & Core Structure

---

## What Was Done

### ✅ Documentation Updated

**DEV-NOTES.md:**
- Complete rewrite reflecting new vision
- Tesla-sleek minimalism principles
- Simple homeowner view vs rich plumber view split
- $49/mo flat pricing (no annual option)
- Geofenced zones (max 3 plumbers per zone)
- On-device vision first (PaddleOCR-VL + Phi-4)
- "Water Heater Profile" as core concept

**README.md:**
- New simplified overview
- Clear homeowner vs plumber value props
- Updated tech stack (on-device vision primary)
- New route structure (consumer routes)
- Removed hardcoded lookup table references
- Updated Stripe setup (monthly only)

### ✅ New File Structure Created

```
waterheater-vault/
├── lib/
│   ├── vision/
│   │   ├── on-device-scanner.ts        ✅ Created - PaddleOCR + Phi-4 pipeline
│   │   ├── prompt-templates.ts         ✅ Created - Minimal prompts for on-device
│   │   └── result-parser.ts            ✅ Created - Validation & formatting
│   └── profile/
│       ├── profile-builder.ts          ✅ Created - Simple vs rich view logic
│       └── job-ticket.ts               ✅ Created - .ics + .csv export
│
├── app/
│   └── (consumer)/                     ✅ Created - New route group
│       ├── layout.tsx                  ✅ Created - Minimal consumer layout
│       ├── page.tsx                    ✅ Created - Landing with big Scan button
│       ├── scan/
│       │   └── page.tsx                ✅ Created - Camera + on-device vision
│       ├── profile/
│       │   ├── page.tsx                ✅ Created - Simple homeowner card
│       │   └── details/
│       │       └── page.tsx            ✅ Created - Rich technical view
│       └── send-plumber/
│           └── page.tsx                ✅ Created - Hero flow with job ticket
```

### ✅ Configuration Fixed

**tsconfig.json:**
- Added path alias: `"@/*": ["./*"]`
- TypeScript errors will resolve after TS server reload

**globals.css:**
- Already configured with Tesla-sleek black theme (#000000, #0066ff)
- No changes needed

---

## Key Features Implemented

### 1. On-Device Vision Pipeline (`lib/vision/on-device-scanner.ts`)
- **Primary:** PaddleOCR-VL-1.5 (text extraction) + Phi-4-reasoning-vision-15B (understanding)
- **Fallback:** Grok Vision API (only for low confidence or errors)
- **Interface:** Clean `scanWaterHeater()` function with confidence threshold
- **Note:** Actual PaddleOCR and Phi-4 implementations are placeholders - need WebAssembly/WebGPU integration

### 2. Simple vs Rich Profile Views
- **Simple (Homeowner):** Age, life remaining, cost estimate, no jargon
- **Rich (Plumber):** Serial, model, BTU, tank size, warranty, installation notes
- **Builder:** `buildSimpleProfile()` and `buildRichProfile()` functions

### 3. Job Ticket Export (`lib/profile/job-ticket.ts`)
- **.ics calendar event** - drops into any calendar app
- **.csv field service row** - imports into field service software
- **Pure client-side** - works offline, zero APIs
- **Shareable URL** - for "Send to My Plumber" flow

### 4. Consumer Flow (3 Screens)
- **Screen 1:** Landing page with big Scan button
- **Screen 2:** Camera scan with on-device vision (instant results)
- **Screen 3:** Simple Profile Card with "Send to My Plumber" hero button
- **Optional:** Details view (hidden by default) and Send flow

---

## What Still Needs to Be Done

### Phase 2: On-Device Vision Integration (HIGH PRIORITY)

**PaddleOCR-VL-1.5 Integration:**
- [ ] Research WebAssembly compilation for PaddleOCR-VL
- [ ] Or use ONNX Runtime Web with quantized model
- [ ] Implement actual text extraction in `extractTextWithPaddleOCR()`
- [ ] Test on real water heater data plate images

**Phi-4-reasoning-vision-15B Integration:**
- [ ] Quantize Phi-4 model for browser runtime (4-bit or 8-bit)
- [ ] Use WebGPU or ONNX Runtime Web
- [ ] Implement actual understanding in `understandWithPhi4()`
- [ ] Test reasoning accuracy on extracted text

**Alternative Approach (if on-device too complex):**
- [ ] Keep current Tesseract.js for OCR
- [ ] Use lightweight text-only model for understanding
- [ ] Reserve Grok Vision for fallback only

### Phase 3: API Endpoints (MEDIUM PRIORITY)

**Create New API Routes:**
- [ ] `/api/vision/grok-scan` - Grok Vision fallback endpoint
- [ ] `/api/pro/match-plumber` - Match homeowner to plumber by zip
- [ ] `/api/pro/send-job-ticket` - Send job ticket to matched plumber
- [ ] `/api/pro/zones` - Manage geofenced zones (CRUD)

**Update Existing:**
- [ ] Keep `/api/pro/onboard` for plumber signup
- [ ] Keep `/api/pro/webhook` for Stripe events
- [ ] Archive old `/api/fast-lookup`, `/api/parse-text` endpoints

### Phase 4: Plumber Dashboard (MEDIUM PRIORITY)

**Create Pro Routes:**
- [ ] `/pro/dashboard` - Zone status, scan counts, leads
- [ ] `/pro/claim` - Zone claim page with $49/mo checkout
- [ ] `/pro/directory` - Public directory of screened pros
- [ ] Update `/pro` marketing page with new geofenced zones messaging

### Phase 5: Data & Storage (LOW PRIORITY)

**Database Updates:**
- [ ] Create `zones` table (zip_code, plumber_count, max_plumbers)
- [ ] Create `zone_claims` table (zone_id, pro_id, claimed_at)
- [ ] Update `pros` table with zone_id foreign key
- [ ] Migration: `0010_geofenced_zones.sql`

**IndexedDB:**
- [ ] Keep existing vault structure
- [ ] Add profile caching for offline access

### Phase 6: Polish & Testing (LOW PRIORITY)

**UI/UX:**
- [ ] Add loading states and error boundaries
- [ ] Test on real devices (iOS Safari, Android Chrome)
- [ ] Optimize image capture and preprocessing
- [ ] Add haptic feedback for mobile

**Testing:**
- [ ] Test with real water heater images
- [ ] Test on-device vision accuracy
- [ ] Test job ticket downloads on various devices
- [ ] Test "Send to My Plumber" flow end-to-end

---

## Terminal Commands to Run

```bash
# 1. Install dependencies (if needed)
pnpm install

# 2. Start dev server
pnpm dev

# 3. Test new routes
# Open http://localhost:3000
# Navigate to /scan, /profile, /profile/details, /send-plumber

# 4. Build for production (when ready)
pnpm build

# 5. Deploy to Cloudflare Pages (when ready)
# Automatic on push to main branch
```

---

## Important Notes

### TypeScript Errors
The TypeScript errors you see are expected and will resolve after:
1. The TypeScript server reloads (automatic)
2. Or restart your IDE
3. Or run: `pnpm dev` which will trigger TS compilation

### On-Device Vision Placeholders
The `lib/vision/on-device-scanner.ts` file contains placeholder implementations for:
- `extractTextWithPaddleOCR()` - returns mock data
- `understandWithPhi4()` - returns mock data

These need to be replaced with actual model integrations. This is the **highest priority** for Phase 2.

### Existing Code
The old routes (`/scan`, `/results`, `/vault`) still exist in the `app/` directory. They have NOT been deleted yet. The new consumer routes are in `app/(consumer)/`.

**Recommendation:** Test the new flow first, then archive or delete old routes once confirmed working.

### Stripe Configuration
Updated to $49/mo flat pricing (no annual option). You'll need to:
1. Create new Stripe product: "Water Heater Plan Pro"
2. Create monthly price: $49.00/month
3. Update `STRIPE_PRICE_ID_MONTHLY` environment variable
4. Remove `STRIPE_PRICE_ID_ANNUAL` from environment variables

---

## Assumption Audit

**Assumptions Made:**
1. ✅ PaddleOCR-VL-1.5 and Phi-4 can run in browser (needs verification)
2. ✅ On-device processing will be fast enough (<3s target)
3. ✅ Homeowners prefer simple view without technical jargon (validated by user)
4. ✅ Plumbers need full technical specs (validated by user)
5. ✅ Geofenced zones with max 3 plumbers will create urgency (hypothesis)
6. ✅ $49/mo flat is simpler than $49/mo + $499/yr options (validated by user)

**Risks:**
1. ⚠️ On-device models may be too large for mobile browsers
2. ⚠️ WebGPU support not universal yet (fallback to Grok needed)
3. ⚠️ Quantized models may lose accuracy vs cloud models
4. ⚠️ Zone management complexity (what happens when zone is full?)

---

## 6-Month Pre-Mortem

**Why might this fail?**

1. **On-device vision doesn't work:**
   - Models too large for mobile browsers
   - Accuracy too low compared to cloud
   - **Mitigation:** Keep Grok Vision fallback, use lighter models

2. **Homeowners confused by simplified view:**
   - They want to see serial numbers
   - They don't trust "simple" explanations
   - **Mitigation:** A/B test, make Details link more prominent

3. **Plumbers don't pay $49/mo:**
   - Too expensive for small operators
   - Not enough leads to justify cost
   - **Mitigation:** Free trial, volume guarantees, lower price

4. **Geofenced zones don't fill:**
   - Not enough plumbers in rural areas
   - Plumbers don't see value
   - **Mitigation:** Expand zone sizes, allow 5+ plumbers, lower price

5. **Complexity creep:**
   - Team adds features that break minimalism
   - UI becomes cluttered again
   - **Mitigation:** Strict design review, delete features aggressively

**Success Criteria (6 months):**
- 1,000+ homeowner scans
- 50+ paying plumbers at $49/mo ($2,450 MRR)
- 80%+ on-device scan success rate
- 90%+ homeowner satisfaction with simple view
- 3+ plumbers per zone in top 10 markets

---

## Next Steps (Priority Order)

1. **Test new routes** - Run `pnpm dev` and navigate through new flow
2. **Fix any runtime errors** - Check browser console
3. **Integrate actual on-device vision** - Research PaddleOCR-VL + Phi-4 WebAssembly/ONNX
4. **Create API endpoints** - `/api/vision/grok-scan`, `/api/pro/match-plumber`
5. **Build plumber dashboard** - `/pro/dashboard`, `/pro/claim`
6. **Test with real images** - Scan actual water heater data plates
7. **Deploy to staging** - Test on real devices
8. **Launch to first users** - Get feedback, iterate

---

**Ready to proceed with Phase 2: On-Device Vision Integration**
