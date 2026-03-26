/**
 * Production Vision Scanner - Single Pipeline Flow
 * Clean flow: preprocess → store-image → parallel-scan
 * Zero demo mode, production-ready architecture
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
  imageId?: string // optional: ID of saved image for AI model processing
}

const DEFAULT_CONFIG: OnDeviceConfig = {
  confidenceThreshold: 70,
  useFallback: true
}

/**
 * Main scan function - Clean single pipeline
 * Flow: preprocess → store-image → 3-tier processing → parallel-scan fallback
 * 
 * @param imageData - base64 image data or Blob
 * @param config - optional configuration with imageId for saved images
 * @returns ScanResult with extracted water heater data
 */
export async function scanWaterHeater(
  imageData: string | Blob,
  config: Partial<OnDeviceConfig> = {}
): Promise<ScanResult> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  
  try {
    console.log('[SCAN] Starting production scan pipeline...')
    
    // If imageId provided, use parallel-scan endpoint (image already stored in R2)
    if (finalConfig.imageId && finalConfig.useFallback) {
      console.log('[SCAN] Using parallel-scan with stored imageId:', finalConfig.imageId)
      return await scanWithParallelModels(finalConfig.imageId)
    }
    
    // Step 1: Preprocess image for optimal results
    console.log('[SCAN] Step 1: Preprocessing image...')
    const { preprocessImage } = await import('./image-preprocessor')
    const processedImage = await preprocessImage(imageData)
    
    // Step 2: Extract text with Tesseract.js OCR
    console.log('[SCAN] Step 2: Running OCR...')
    const ocrResult = await extractTextWithTesseract(processedImage)
    console.log('[SCAN] OCR complete. Confidence:', ocrResult.confidence)
    
    // Step 3: Try pattern matching (Tier 1 - fastest)
    console.log('[SCAN] Step 3: Pattern matching...')
    const result = await tryPatternExtraction(ocrResult.text)
    
    // Accept pattern results with confidence > 30
    if (result.success && result.confidence >= 30) {
      console.log('[SCAN] ✅ Pattern matching succeeded')
      return buildScanResult(result)
    }
    
    // Step 4: Fallback to parallel AI models if enabled and imageId available
    if (finalConfig.useFallback && finalConfig.imageId) {
      console.log('[SCAN] Step 4: Falling back to parallel AI models...')
      return await scanWithParallelModels(finalConfig.imageId)
    }
    
    // If no fallback available, throw descriptive error
    console.log('[SCAN] ❌ All processing methods exhausted')
    throw new Error("Unable to extract water heater information. Please ensure the data plate label is clearly visible and well-lit.")
    
  } catch (error) {
    console.error('[SCAN] Pipeline error:', error)
    throw error
  }
}

/**
 * Scan with parallel AI models (fetch from R2 via imageId)
 */
async function scanWithParallelModels(imageId: string): Promise<ScanResult> {
  console.log('[PARALLEL] Calling parallel-scan endpoint with imageId:', imageId)
  
  const formData = new FormData()
  formData.append('imageId', imageId)
  
  // 30-second timeout for Gemini API call
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)
  
  const response = await fetch('/api/consumer/smart-scan', {
    method: 'POST',
    body: formData,
    signal: controller.signal
  })
  
  clearTimeout(timeout)
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.message || error.error || 'Parallel scan failed')
  }
  
  const data = await response.json()
  
  // smart-scan returns data directly (already has all derived fields)
  return {
    brand: data.brand || 'Unknown',
    model: data.model || 'Unknown',
    serial: data.serial || '',
    manufactureDate: data.manufactureDate || '',
    age: data.age || 0,
    fuelType: data.fuelType || 'natural_gas',
    tankSizeGallons: data.tankSizeGallons || 40,
    expectedLifeYears: data.expectedLifeYears || 12,
    remainingYears: data.remainingYears || 0,
    estimatedCostMin: data.estimatedCostMin || 1500,
    estimatedCostMax: data.estimatedCostMax || 2000,
    confidence: data.confidence || 0,
    processingMethod: data.tier || 'gemini-flash-lite'
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
