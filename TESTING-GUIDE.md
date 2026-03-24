# Testing Guide - Phase 2 Complete

**Date:** 2026-03-24  
**Status:** 3-Tier Vision System Implemented

---

## What's Ready to Test

### ✅ Tier 1: Pattern Matching (Implemented)
- Tesseract.js OCR extraction
- Brand detection (10 major brands)
- Serial number extraction (brand-specific patterns)
- Model number extraction
- Serial decoding to manufacture date
- Fuel type detection
- Tank size extraction
- **Target:** 90% of scans, <3s, $0 cost

### ✅ Tier 2: Phi-2 Reasoning (Placeholder)
- Reserved for future implementation
- Will use Transformers.js with Phi-2 model
- **Target:** 8% of scans, 3-8s, $0 cost

### ✅ Tier 3: Grok Vision Fallback (Endpoint Needed)
- API endpoint needs to be created
- Will use existing Grok Vision integration
- **Target:** 2% of scans, 10-25s, ~$0.01 cost

---

## Terminal Commands to Run

### 1. Install Dependencies (if needed)

```bash
# Make sure tesseract.js is installed
pnpm install

# Check if tesseract.js is in package.json
# If not, add it:
pnpm add tesseract.js
```

### 2. Start Development Server

```bash
pnpm dev
```

### 3. Open Browser and Test

Navigate to: `http://localhost:3000`

**Test Flow:**
1. Click big Scan button on home page
2. Allow camera access
3. Point camera at water heater data plate (or use test image)
4. Capture photo
5. Watch console for processing logs:
   - "Starting OCR extraction..."
   - "OCR complete: [text preview]"
   - "Trying Tier 1: Pattern matching..."
   - "Tier 1 success! Confidence: 95" (if successful)
   - OR "Tier 1 failed or low confidence: 0"
   - "Falling back to Tier 3: Grok Vision..." (if Tier 1 fails)
6. View simple Profile Card with results
7. Test "View Technical Details" link
8. Test "Send to My Plumber" flow

---

## Test Cases

### Test Case 1: Rheem Water Heater (Should use Tier 1)

**Mock OCR Text:**
```
RHEEM
MODEL: XG50T12EC38U0
SERIAL: 0423A12345
INPUT: 40,000 BTU
CAPACITY: 50 GAL
NATURAL GAS
```

**Expected Result:**
- Brand: Rheem
- Model: XG50T12EC38U0
- Serial: 0423A12345
- Manufacture Date: 2023-04-01 (Week 04, 2023)
- Age: 3 years
- Fuel Type: Natural Gas
- Tank Size: 50 gallons
- Confidence: 95
- Processing Method: pattern-match

### Test Case 2: A.O. Smith Water Heater (Should use Tier 1)

**Mock OCR Text:**
```
A.O. SMITH
SIGNATURE SERIES
MODEL: GPVH-50
SERIAL NO: 2404123456
50 GALLON
NATURAL GAS
40,000 BTU INPUT
```

**Expected Result:**
- Brand: A.O. Smith
- Model: GPVH-50
- Serial: 2404123456
- Manufacture Date: 2024-04-01 (2024 Week 04)
- Age: 2 years
- Fuel Type: Natural Gas
- Tank Size: 50 gallons
- Confidence: 95
- Processing Method: pattern-match

### Test Case 3: Blurry/Damaged Label (Should fallback to Tier 3)

**Mock OCR Text:**
```
[garbled text]
BR... WHI...
MOD... MI40...
SER... [unreadable]
```

**Expected Result:**
- Tier 1 fails (confidence: 0)
- Tier 2 skipped (not implemented yet)
- Tier 3 called (Grok Vision API)
- Processing Method: grok-vision

---

## Browser Console Logs to Watch For

### Successful Tier 1 Scan:
```
Starting OCR extraction...
OCR progress: 25%
OCR progress: 50%
OCR progress: 75%
OCR progress: 100%
OCR complete: RHEEM
MODEL: XG50T12EC38U0
SERIAL: 0423A12345...
Trying Tier 1: Pattern matching...
Tier 1 success! Confidence: 95
```

### Failed Tier 1, Fallback to Tier 3:
```
Starting OCR extraction...
OCR complete: [garbled text]...
Trying Tier 1: Pattern matching...
Pattern extraction failed: Brand not detected
Tier 1 failed or low confidence: 0
Falling back to Tier 3: Grok Vision...
```

---

## Known Issues & Limitations

### Current Limitations:

1. **No Grok Vision API Endpoint Yet**
   - Tier 3 fallback will fail with 404
   - Need to create `/api/vision/grok-scan` endpoint
   - For now, test with clear images that Tier 1 can handle

2. **Tesseract.js First Load**
   - First scan takes 5-10s to download Tesseract WASM
   - Subsequent scans are fast (<3s)
   - Consider preloading Tesseract on app start

3. **Camera Permissions**
   - Must allow camera access in browser
   - iOS Safari requires HTTPS (use localhost for testing)

4. **Brand Coverage**
   - Currently supports 10 major brands
   - Unknown brands will fail Tier 1
   - Need to add more brands or improve fallback

### Browser Compatibility:

- ✅ Chrome/Edge (desktop & mobile)
- ✅ Firefox (desktop & mobile)
- ✅ Safari (desktop & iOS) - requires HTTPS
- ⚠️ Older browsers may not support camera API

---

## Next Steps After Testing

### If Tier 1 Works Well (90%+ success):
1. ✅ Keep current implementation
2. Create Grok Vision fallback API endpoint
3. Add more brand patterns
4. Test with real water heater images
5. Deploy to staging

### If Tier 1 Needs Improvement:
1. Add preprocessing to improve OCR quality
2. Implement Tier 2 (Phi-2 reasoning)
3. Fine-tune confidence thresholds
4. Add more serial number patterns

### Priority Tasks:
1. **HIGH:** Create `/api/vision/grok-scan` endpoint (Tier 3 fallback)
2. **HIGH:** Test with 20+ real water heater images
3. **MEDIUM:** Add preprocessing (contrast, grayscale, resize)
4. **MEDIUM:** Implement Tier 2 (Phi-2 with Transformers.js)
5. **LOW:** Add more brand patterns (expand from 10 to 20+ brands)

---

## Performance Targets

| Metric | Target | Current Status |
|--------|--------|----------------|
| Tier 1 Success Rate | 90% | ⏳ Needs testing |
| Tier 1 Speed | <3s | ✅ Expected |
| Overall Accuracy | 95% | ⏳ Needs testing |
| Cost per Scan | <$0.005 | ✅ Expected |
| Mobile Performance | <5s | ⏳ Needs testing |

---

## Debugging Tips

### If OCR Fails:
- Check browser console for Tesseract errors
- Verify image is clear and well-lit
- Try different camera angles
- Check if Tesseract WASM loaded successfully

### If Pattern Matching Fails:
- Check console log: "Pattern extraction failed: [reason]"
- Verify brand is in BRAND_PATTERNS list
- Check if serial number matches expected pattern
- Look at raw OCR text output

### If Everything Fails:
- Check if fallback is enabled (config.useFallback = true)
- Verify Grok Vision API endpoint exists
- Check network tab for API errors
- Try with mock data first

---

## Mock Data for Testing

Create a test file: `test-water-heater-data.txt`

```
RHEEM PERFORMANCE SERIES
MODEL: XG50T12EC38U0
SERIAL NUMBER: 0423A12345
INPUT: 40,000 BTU
CAPACITY: 50 GALLONS
NATURAL GAS WATER HEATER
FHR: 90 GALLONS
WARRANTY: 12 YEARS
```

You can paste this into a text file, take a photo of it, and test the scan flow.

---

**Ready to test! Run `pnpm dev` and navigate to http://localhost:3000** 🚀
