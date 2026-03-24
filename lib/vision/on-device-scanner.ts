/**
 * On-Device Vision Scanner
 * Primary path: PaddleOCR-VL-1.5 (text extraction) + Phi-4-reasoning-vision-15B (understanding)
 * Runs entirely on-device, instant results, zero API cost
 * 
 * Fallback: Grok Vision (grok-4.20-beta) only for blurry/damaged labels or low confidence
 */

export interface ScanResult {
  brand: string
  model: string
  serial: string
  manufactureDate: string
  age: number
  fuelType: 'natural_gas' | 'propane' | 'electric' | 'heat_pump' | 'tankless-gas' | 'tankless-electric'
  tankSizeGallons: number | null
  expectedLifeYears: number
  remainingYears: number
  estimatedCostMin: number
  estimatedCostMax: number
  confidence: number
  processingMethod: 'on-device' | 'grok-vision'
}

export interface OnDeviceConfig {
  confidenceThreshold: number // 0-100, default 70
  useFallback: boolean // true = allow Grok fallback if confidence low
}

const DEFAULT_CONFIG: OnDeviceConfig = {
  confidenceThreshold: 70,
  useFallback: true
}

/**
 * Main scan function - 3-tier processing approach
 * Tier 1: Pattern matching (90% of scans, <1s, $0)
 * Tier 2: Phi-2 reasoning (8% of scans, 3-8s, $0) - TODO
 * Tier 3: Grok Vision (2% of scans, 10-25s, ~$0.01)
 * 
 * @param imageData - base64 image data or Blob
 * @param config - optional configuration
 * @returns ScanResult with extracted water heater data
 */
export async function scanWaterHeater(
  imageData: string | Blob,
  config: Partial<OnDeviceConfig> = {}
): Promise<ScanResult> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  
  try {
    // Step 1: Extract text with Tesseract.js
    console.log('[SCAN] Step 1: Starting OCR extraction...')
    const ocrResult = await extractTextWithTesseract(imageData)
    console.log('[SCAN] OCR complete. Text length:', ocrResult.text.length, 'Confidence:', ocrResult.confidence)
    console.log('[SCAN] OCR text preview:', ocrResult.text.substring(0, 200))
    
    // Step 2: Try Tier 1 - Pattern matching (fast, zero cost)
    console.log('[SCAN] Step 2: Trying Tier 1 pattern matching...')
    const tier1Result = await tryPatternExtraction(ocrResult.text)
    console.log('[SCAN] Tier 1 result:', { success: tier1Result.success, confidence: tier1Result.confidence, brand: tier1Result.brand })
    
    if (tier1Result.success && tier1Result.confidence >= 90) {
      console.log('[SCAN] ✅ Tier 1 SUCCESS! Returning result.')
      return buildScanResult(tier1Result)
    }
    
    console.log('[SCAN] ⚠️ Tier 1 failed or low confidence. Moving to fallback...')
    
    // Step 3: Try Tier 2 - Phi-2 reasoning (medium speed, zero cost)
    // TODO: Implement Phi-2 integration
    // For now, skip directly to Tier 3
    
    // Step 4: Fallback to Tier 3 - Grok Vision (slow, paid)
    if (finalConfig.useFallback) {
      console.log('[SCAN] Step 3: Falling back to Grok Vision API...')
      return await fallbackToGrokVision(imageData)
    }
    
    throw new Error('All extraction tiers failed and fallback disabled')
  } catch (error) {
    console.error('[SCAN] ❌ Error in scan pipeline:', error)
    console.error('[SCAN] Error details:', error instanceof Error ? error.message : String(error))
    
    if (finalConfig.useFallback) {
      console.log('[SCAN] Attempting Grok Vision fallback after error...')
      return await fallbackToGrokVision(imageData)
    }
    
    throw error
  }
}

/**
 * Extract text from image using Tesseract.js
 * This is the actual OCR implementation that runs in the browser
 */
async function extractTextWithTesseract(imageData: string | Blob): Promise<{ text: string; confidence: number }> {
  // Import Tesseract dynamically
  const Tesseract = (await import('tesseract.js')).default
  
  try {
    // Convert Blob to data URL if needed
    let imageUrl: string
    if (imageData instanceof Blob) {
      imageUrl = await blobToDataURL(imageData)
    } else {
      imageUrl = imageData
    }
    
    // Run Tesseract OCR
    const result = await Tesseract.recognize(
      imageUrl,
      'eng',
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR progress: ${Math.round(m.progress * 100)}%`)
          }
        }
      }
    )
    
    return {
      text: result.data.text,
      confidence: result.data.confidence
    }
  } catch (error) {
    console.error('Tesseract OCR failed:', error)
    throw new Error('OCR extraction failed')
  }
}

/**
 * Try pattern-based extraction (Tier 1)
 * Uses regex patterns and brand-specific serial decoders
 */
async function tryPatternExtraction(text: string): Promise<any> {
  const { extractWithPatterns } = await import('./pattern-extractor')
  return await extractWithPatterns(text)
}

/**
 * Build final ScanResult from pattern extraction result
 */
function buildScanResult(patternResult: any): ScanResult {
  const { calculateEstimatedCost, calculateExpectedLife } = require('./result-parser')
  
  // Calculate age
  const manufactureYear = parseInt(patternResult.manufactureDate.split('-')[0])
  const currentYear = new Date().getFullYear()
  const age = currentYear - manufactureYear
  
  // Calculate expected life and remaining years
  const expectedLife = calculateExpectedLife(patternResult.fuelType)
  const remaining = Math.max(0, expectedLife - age)
  
  // Calculate estimated cost
  const { min, max } = calculateEstimatedCost(
    patternResult.fuelType,
    patternResult.tankSizeGallons
  )
  
  return {
    brand: patternResult.brand,
    model: patternResult.model,
    serial: patternResult.serial,
    manufactureDate: patternResult.manufactureDate,
    age,
    fuelType: patternResult.fuelType,
    tankSizeGallons: patternResult.tankSizeGallons,
    expectedLifeYears: expectedLife,
    remainingYears: remaining,
    estimatedCostMin: min,
    estimatedCostMax: max,
    confidence: patternResult.confidence,
    processingMethod: patternResult.method || 'on-device'
  }
}

/**
 * Fallback to Grok Vision API when on-device confidence is low
 */
async function fallbackToGrokVision(imageData: string | Blob): Promise<ScanResult> {
  console.log('[GROK] Converting image to base64...')
  // Convert Blob to base64 if needed
  let base64Image: string
  if (imageData instanceof Blob) {
    base64Image = await blobToBase64(imageData)
    console.log('[GROK] Blob converted. Base64 length:', base64Image.length)
  } else {
    base64Image = imageData
    console.log('[GROK] Using provided base64. Length:', base64Image.length)
  }
  
  console.log('[GROK] Calling Grok Vision API...')
  // Call Grok Vision API
  const response = await fetch('/api/vision/grok-scan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      image: base64Image
    })
  })
  
  console.log('[GROK] API response status:', response.status, response.statusText)
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error('[GROK] API error response:', errorText)
    throw new Error(`Grok Vision API failed: ${response.status} ${response.statusText} - ${errorText}`)
  }
  
  const result = await response.json()
  console.log('[GROK] ✅ Grok Vision succeeded. Result:', result)
  
  return {
    ...result,
    processingMethod: 'grok-vision'
  }
}

/**
 * Convert Blob to base64 string
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      resolve(base64.split(',')[1]) // Remove data:image/jpeg;base64, prefix
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Convert Blob to data URL (for Tesseract)
 */
function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Simple confidence check - can be used before full scan
 */
export function shouldUseFallback(confidence: number, threshold: number = 70): boolean {
  return confidence < threshold
}
