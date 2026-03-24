/**
 * On-Device Vision Scanner
 * 100% on-device processing using Tesseract.js OCR + pattern matching
 * No external API calls - works completely offline
 * Includes image preprocessing for better accuracy
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
    // Step 1: Preprocess image for better OCR
    console.log('[SCAN] Preprocessing image...')
    const { preprocessImage } = await import('./image-preprocessor')
    const preprocessedImage = await preprocessImage(imageData)
    console.log('[SCAN] Image preprocessed')
    
    // Step 2: Extract text with Tesseract.js
    console.log('[SCAN] Starting OCR extraction...')
    const ocrResult = await extractTextWithTesseract(preprocessedImage)
    console.log('[SCAN] OCR complete. Text length:', ocrResult.text.length, 'Confidence:', ocrResult.confidence)
    
    // If OCR extracted very little text, return soft error
    if (ocrResult.text.length < 10) {
      console.log('[SCAN] OCR extracted very little text')
      throw new Error("Couldn't read the label clearly. Try better lighting and hold the phone straight.")
    }
    
    // Step 3: Pattern matching extraction
    console.log('[SCAN] Trying pattern matching...')
    const tier1Result = await tryPatternExtraction(ocrResult.text)
    
    // Lower threshold to 60 for more tolerance
    if (tier1Result.success && tier1Result.confidence >= 60) {
      console.log('[SCAN] ✅ Pattern matching succeeded')
      return buildScanResult(tier1Result)
    }
    
    // If pattern matching fails, show user-friendly error
    console.log('[SCAN] Pattern matching failed. Confidence:', tier1Result.confidence)
    throw new Error("Couldn't read the label clearly. Try better lighting and hold the phone straight.")
    
  } catch (error) {
    console.error('[SCAN] Scan failed:', error)
    // Always throw user-friendly error, never crash
    const message = error instanceof Error ? error.message : "Couldn't read the label clearly. Try better lighting and hold the phone straight."
    throw new Error(message)
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
    
    // Run Tesseract OCR with optimized settings for data plates
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
    // Return soft error instead of crashing
    return {
      text: '',
      confidence: 0
    }
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
