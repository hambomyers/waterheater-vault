# Phase 2: On-Device Vision Research & Implementation Plan

**Date:** 2026-03-24  
**Goal:** Replace placeholder implementations with actual on-device vision models

---

## Research: Browser-Based Vision Options

### Option 1: PaddleOCR-VL-1.5 + Phi-4-reasoning-vision-15B (Original Plan)

**PaddleOCR-VL-1.5:**
- ❌ **Problem:** Not designed for browser runtime
- ❌ **Problem:** Requires Python runtime and CUDA/CPU backend
- ❌ **Problem:** No official WebAssembly or ONNX export
- ⚠️ **Workaround:** Would need custom WASM compilation (weeks of work)

**Phi-4-reasoning-vision-15B:**
- ❌ **Problem:** 15B parameters = ~30GB unquantized, ~8GB at 4-bit
- ❌ **Problem:** Too large for mobile browsers (most have <4GB RAM)
- ❌ **Problem:** WebGPU support still limited (Safari, older Android)
- ⚠️ **Workaround:** Extreme quantization (2-bit) would lose too much accuracy

**Verdict:** ❌ Not practical for browser runtime. Would work server-side only.

---

### Option 2: Tesseract.js + Lightweight Text Model (RECOMMENDED)

**Tesseract.js (OCR):**
- ✅ Already integrated in project
- ✅ Runs in browser via WebAssembly
- ✅ ~2-3s processing time on mobile
- ✅ Good accuracy on printed text (data plates)
- ✅ Works offline
- ⚠️ Confidence can be low on blurry/glare images

**Lightweight Text Model Options:**

**A) TinyBERT (110M params, ~50MB quantized):**
- ✅ Runs in browser via ONNX Runtime Web
- ✅ Fast inference (<500ms on mobile)
- ✅ Good for text classification/extraction
- ⚠️ Limited reasoning capability
- ⚠️ Would need fine-tuning on water heater data

**B) DistilGPT-2 (82M params, ~40MB quantized):**
- ✅ Runs in browser via Transformers.js
- ✅ Better reasoning than BERT
- ✅ Can follow prompts
- ⚠️ Slower than BERT (~1-2s)
- ⚠️ May hallucinate without grounding

**C) Phi-2 (2.7B params, ~1.5GB at 4-bit):**
- ✅ Excellent reasoning capability
- ✅ Runs in browser via WebGPU (Transformers.js)
- ⚠️ Large model size (slow initial load)
- ⚠️ Requires WebGPU (not universal yet)
- ✅ Good fallback between Tesseract and Grok

**Verdict:** ✅ **Use Tesseract.js + Phi-2 (with WebGPU check)**

---

### Option 3: Hybrid Approach (RECOMMENDED IMPLEMENTATION)

**Tier 1: Tesseract.js + Pattern Matching (90% of scans)**
- Extract text with Tesseract.js
- Use regex patterns to extract brand, model, serial
- Use brand-specific serial decoders (already implemented)
- Calculate age, life, cost from lookup tables
- **Speed:** <3s, **Cost:** $0, **Accuracy:** 85-90%

**Tier 2: Tesseract.js + Phi-2 (8% of scans)**
- When pattern matching fails or confidence low
- Use Phi-2 to reason about extracted text
- Structured output with JSON schema
- **Speed:** 3-8s, **Cost:** $0, **Accuracy:** 90-95%

**Tier 3: Grok Vision API (2% of scans)**
- When both Tier 1 and Tier 2 fail
- Blurry images, damaged labels, unknown brands
- Full vision model with image input
- **Speed:** 10-25s, **Cost:** ~$0.01/scan, **Accuracy:** 95-99%

**Verdict:** ✅ **Best balance of speed, cost, and accuracy**

---

## Implementation Plan

### Step 1: Enhance Tesseract.js OCR ✅ (Already exists)
- Keep existing `lib/onDeviceExtractor.ts`
- Improve preprocessing (contrast, grayscale, resize)
- Add confidence scoring
- Extract brand, model, serial with regex

### Step 2: Add Pattern-Based Extraction (Tier 1)
- Create `lib/vision/pattern-extractor.ts`
- Use brand-specific serial decoders
- Match model numbers against known patterns
- Calculate derived fields (age, life, cost)
- Return high confidence if successful

### Step 3: Add Phi-2 Text Understanding (Tier 2)
- Install Transformers.js: `pnpm add @xenova/transformers`
- Create `lib/vision/phi2-extractor.ts`
- Load Phi-2 model with WebGPU (if available)
- Fallback to WASM if no WebGPU
- Use structured prompts for water heater data
- Return medium confidence

### Step 4: Create Grok Vision Fallback API (Tier 3)
- Create `functions/api/vision/grok-scan.ts`
- Use existing Grok Vision integration
- Return low confidence (triggers fallback)

### Step 5: Update Router Logic
- Modify `lib/vision/on-device-scanner.ts`
- Implement 3-tier routing logic
- Try Tier 1 → Tier 2 → Tier 3 in sequence
- Return first successful result above threshold

---

## Detailed Implementation

### Pattern Extractor (Tier 1)

```typescript
// lib/vision/pattern-extractor.ts

interface PatternResult {
  brand: string
  model: string
  serial: string
  confidence: number
  success: boolean
}

export async function extractWithPatterns(text: string): Promise<PatternResult> {
  // 1. Detect brand (case-insensitive search)
  const brand = detectBrand(text)
  if (!brand) return { success: false, confidence: 0 }
  
  // 2. Extract serial number (brand-specific patterns)
  const serial = extractSerial(text, brand)
  if (!serial) return { success: false, confidence: 0 }
  
  // 3. Extract model number (alphanumeric patterns)
  const model = extractModel(text, brand)
  if (!model) return { success: false, confidence: 0 }
  
  // 4. Decode manufacture date from serial
  const manufactureDate = decodeSerial(serial, brand)
  if (!manufactureDate) return { success: false, confidence: 0 }
  
  // Success! High confidence
  return {
    brand,
    model,
    serial,
    confidence: 95,
    success: true
  }
}
```

### Phi-2 Extractor (Tier 2)

```typescript
// lib/vision/phi2-extractor.ts
import { pipeline } from '@xenova/transformers'

let textGenerator: any = null

export async function extractWithPhi2(text: string): Promise<any> {
  // Lazy load model
  if (!textGenerator) {
    textGenerator = await pipeline(
      'text-generation',
      'microsoft/phi-2',
      { device: 'webgpu' } // Falls back to WASM if no WebGPU
    )
  }
  
  const prompt = `Extract water heater info from this text:
${text}

Return JSON:
{
  "brand": "...",
  "model": "...",
  "serial": "...",
  "fuelType": "natural_gas|propane|electric|heat_pump",
  "tankSizeGallons": number or null
}`

  const result = await textGenerator(prompt, {
    max_new_tokens: 200,
    temperature: 0.1,
    do_sample: false
  })
  
  // Parse JSON from output
  const json = extractJSON(result[0].generated_text)
  
  return {
    ...json,
    confidence: 85,
    success: true
  }
}
```

### Updated Router (3-Tier)

```typescript
// lib/vision/on-device-scanner.ts (updated)

export async function scanWaterHeater(
  imageData: string | Blob,
  config: Partial<OnDeviceConfig> = {}
): Promise<ScanResult> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  
  // Step 1: Extract text with Tesseract.js
  const ocrResult = await extractTextWithTesseract(imageData)
  
  // Step 2: Try Tier 1 - Pattern matching
  const tier1Result = await extractWithPatterns(ocrResult.text)
  if (tier1Result.success && tier1Result.confidence >= 90) {
    return buildScanResult(tier1Result, 'pattern-match')
  }
  
  // Step 3: Try Tier 2 - Phi-2 reasoning
  if (checkWebGPUSupport()) {
    const tier2Result = await extractWithPhi2(ocrResult.text)
    if (tier2Result.success && tier2Result.confidence >= 80) {
      return buildScanResult(tier2Result, 'phi2-reasoning')
    }
  }
  
  // Step 4: Fallback to Tier 3 - Grok Vision
  if (finalConfig.useFallback) {
    return await fallbackToGrokVision(imageData)
  }
  
  throw new Error('All extraction methods failed')
}
```

---

## Dependencies to Add

```bash
# Transformers.js for Phi-2
pnpm add @xenova/transformers

# ONNX Runtime Web (backup)
pnpm add onnxruntime-web

# Already have Tesseract.js
# Already have existing serial decoders
```

---

## Testing Plan

1. **Test Tier 1 (Pattern Matching):**
   - Use mock OCR text from known brands
   - Verify serial decoding accuracy
   - Target: 90%+ success rate on clear images

2. **Test Tier 2 (Phi-2):**
   - Test with ambiguous/partial OCR text
   - Verify JSON parsing and field extraction
   - Target: 85%+ success rate on medium-quality images

3. **Test Tier 3 (Grok Vision):**
   - Test with blurry/damaged label images
   - Verify fallback triggers correctly
   - Target: 95%+ success rate on all images

4. **Performance Testing:**
   - Measure load time for Phi-2 model (~3-5s first load)
   - Measure inference time per scan (<8s total)
   - Test on mobile devices (iOS Safari, Android Chrome)

---

## Success Metrics

- **Speed:** 80% of scans complete in <3s (Tier 1)
- **Accuracy:** 90%+ correct extractions across all tiers
- **Cost:** <$0.005 average per scan (mostly Tier 1/2, rare Tier 3)
- **Offline:** Tier 1 and 2 work completely offline
- **Fallback:** Tier 3 catches remaining 2-5% of difficult scans

---

## Next Steps

1. ✅ Create this research document
2. ⏭️ Implement pattern-extractor.ts (Tier 1)
3. ⏭️ Install Transformers.js and implement phi2-extractor.ts (Tier 2)
4. ⏭️ Create Grok Vision API endpoint (Tier 3)
5. ⏭️ Update on-device-scanner.ts with 3-tier routing
6. ⏭️ Test with real water heater images
7. ⏭️ Deploy and monitor success rates

**Estimated Time:** 4-6 hours of focused implementation
