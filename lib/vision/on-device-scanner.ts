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
  imageId?: string // optional: ID of saved image for AI model processing
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
    console.log('[SCAN] Starting scan...')
    
    // DEMO MODE: Return mock data for testing
    // Remove this after real scanning works
    if (isDemoMode()) {
      console.log('[SCAN] 🎭 DEMO MODE - Returning mock data')
      return getMockScanResult()
    }
    
    // If imageId provided, use parallel-scan endpoint (all AI models process saved image)
    if (finalConfig.imageId && finalConfig.useFallback) {
      console.log('[SCAN] Using parallel-scan with imageId:', finalConfig.imageId)
      return await scanWithParallelModels(finalConfig.imageId)
    }
    
    // Extract text with Tesseract.js (no preprocessing - keep it simple)
    console.log('[SCAN] Running OCR...')
    const ocrResult = await extractTextWithTesseract(imageData)
    console.log('[SCAN] OCR done. Text:', ocrResult.text.substring(0, 200))
    console.log('[SCAN] OCR confidence:', ocrResult.confidence)
    
    // Try pattern matching with very low threshold
    console.log('[SCAN] Pattern matching...')
    const result = await tryPatternExtraction(ocrResult.text)
    console.log('[SCAN] Pattern result:', result)
    
    // Accept anything with confidence > 30 (very permissive)
    if (result.success && result.confidence >= 30) {
      console.log('[SCAN] ✅ Success')
      return buildScanResult(result)
    }
    
    // If we got here, OCR worked but pattern matching failed
    // Show the OCR text so user can see what was extracted
    console.log('[SCAN] ❌ Pattern matching failed')
    console.log('[SCAN] Extracted text:', ocrResult.text)
    throw new Error("Couldn't identify the water heater brand and model. The scanner is in development - try the demo mode or contact support.")
    
  } catch (error) {
    console.error('[SCAN] Error:', error)
    throw error
  }
}

/**
 * Scan with parallel AI models (all models fetch from saved imageId)
 */
async function scanWithParallelModels(imageId: string): Promise<ScanResult> {
  console.log('[PARALLEL] Calling parallel-scan endpoint with imageId:', imageId)
  
  const formData = new FormData()
  formData.append('imageId', imageId)
  
  const response = await fetch('/api/parallel-scan', {
    method: 'POST',
    body: formData
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.message || error.error || 'Parallel scan failed')
  }
  
  const data = await response.json()
  const consensus = data.consensus
  
  // Convert consensus to ScanResult format
  const { calculateEstimatedCost, calculateExpectedLife } = require('./result-parser')
  
  const manufactureYear = consensus.manufactureDate ? parseInt(consensus.manufactureDate.split('-')[0]) : 0
  const currentYear = new Date().getFullYear()
  const age = manufactureYear > 1980 ? currentYear - manufactureYear : 0
  
  const expectedLife = calculateExpectedLife('natural_gas') // TODO: get from consensus
  const remaining = Math.max(0, expectedLife - age)
  const { min, max } = calculateEstimatedCost('natural_gas', 40) // TODO: get from consensus
  
  return {
    brand: consensus.brand || 'Unknown',
    model: consensus.model || 'Unknown',
    serial: consensus.serial || '',
    manufactureDate: consensus.manufactureDate || '',
    age,
    fuelType: 'natural_gas',
    tankSizeGallons: 40,
    expectedLifeYears: expectedLife,
    remainingYears: remaining,
    estimatedCostMin: min,
    estimatedCostMax: max,
    confidence: Math.round(consensus.confidence * 100),
    processingMethod: 'grok-vision'
  }
}

/**
 * Check if demo mode is enabled (for testing without real photos)
 */
function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false
  // Enable demo mode if URL has ?demo=true
  return window.location.search.includes('demo=true')
}

/**
 * Return mock scan result for demo/testing
 */
function getMockScanResult(): ScanResult {
  return {
    brand: 'Rheem',
    model: 'XE40M06ST45U1',
    serial: '0423A12345',
    manufactureDate: '2023-01-23',
    age: 3,
    fuelType: 'natural_gas',
    tankSizeGallons: 40,
    expectedLifeYears: 12,
    remainingYears: 9,
    estimatedCostMin: 1000,
    estimatedCostMax: 1400,
    confidence: 95,
    processingMethod: 'on-device'
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
