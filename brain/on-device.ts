// Image extraction module — calls CF Pages Function → Grok Vision API
// No mock fallback. If the API fails, the error is real and visible.

/** Safe numeric coercion — avoids `Number(null) || 0` silently hiding real zeros */
function toNum(val: unknown): number {
  if (val == null) return 0
  const n = Number(val)
  return isNaN(n) ? 0 : n
}

export interface PriceBreakdown {
  unitLow: number
  unitHigh: number
  laborLow: number
  laborHigh: number
  emergencyPremiumLow: number
  emergencyPremiumHigh: number
  nationalChainLow: number
  nationalChainHigh: number
}

export interface ExtractedData {
  product: string
  brand: string
  model: string
  serialNumber: string
  manufactureDate: string
  tankSizeGallons?: number
  fuelType: 'gas' | 'electric' | 'tankless' | 'unknown'
  ageYears: number
  remainingLifeYears: number
  estimatedReplacementCost: number
  currentWarranty: string
  priceBreakdown?: PriceBreakdown
}

interface GrokDocItem {
  type: string
  label: string
  url: string | null
  searchQuery?: string
}

type GrokDocs = GrokDocItem[]

export interface GrokScanResult {
  extractedData: ExtractedData
  valuation: {
    currentValue: number
    originalPrice: number
    depreciationRate: number
    marketTrend: 'up' | 'down' | 'stable'
    confidence: number
  }
  docs: GrokDocs
  shot1Note?: string | null
}

// Convert Blob to base64 string (without data URL prefix)
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUrl = reader.result as string
      const base64 = dataUrl.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export async function extractFromImage(imageData: Blob): Promise<GrokScanResult> {
  const base64 = await blobToBase64(imageData)

  const formData = new FormData()
  formData.append('image', base64)
  // (single-shot call — no shot2)

  const response = await fetch('/api/grok-scan', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unknown error')
    let message = `API error ${response.status}`
    try {
      const parsed = JSON.parse(errorBody)
      message = parsed.error || parsed.message || message
    } catch { /* use default message */ }
    throw new Error(message)
  }

  const data = await response.json()

  if (data.error === 'not_a_water_heater' || data.error === 'not_a_product') {
    throw new Error(data.message || 'This does not appear to be a water heater. Please photograph your water heater\'s data plate.')
  }

  if (data.error) {
    throw new Error(data.message || data.error)
  }

  return {
    extractedData: {
      product: data.product || 'Water Heater',
      brand: data.brand || 'Unknown',
      model: data.model || 'Unknown',
      serialNumber: data.serialNumber || '',
      manufactureDate: data.manufactureDate || '',
      tankSizeGallons: data.tankSizeGallons ? toNum(data.tankSizeGallons) : undefined,
      fuelType: data.fuelType || 'unknown',
      ageYears: toNum(data.ageYears),
      remainingLifeYears: toNum(data.remainingLifeYears),
      estimatedReplacementCost: toNum(data.estimatedReplacementCost),
      currentWarranty: data.currentWarranty || data.warranty || '',
    },
    valuation: {
      currentValue: toNum(data.estimatedReplacementCost),
      originalPrice: toNum(data.estimatedReplacementCost),
      depreciationRate: toNum(data.depreciationRate),
      marketTrend: 'stable' as const,
      confidence: toNum(data.confidence) || 0.7,
    },
    docs: Array.isArray(data.docs) ? data.docs : [],
  }
}

/** Text-only parse: sends raw OCR text to fast text LLM — primary path, ~1-2s */
export async function extractFromText(
  rawText: string,
  brandHint: string,
): Promise<GrokScanResult> {
  const response = await fetch('/api/parse-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawText, brandHint }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    let message = `API error ${response.status}`
    try { message = JSON.parse(body).message || message } catch { /* use default */ }
    throw new Error(message)
  }

  const data = await response.json()
  if (data.error) throw new Error(data.message || data.error)

  return {
    extractedData: {
      product: data.product || 'Water Heater',
      brand: data.brand || 'Unknown',
      model: data.model || 'Unknown',
      serialNumber: data.serialNumber || '',
      manufactureDate: data.manufactureDate || '',
      tankSizeGallons: data.tankSizeGallons ? toNum(data.tankSizeGallons) : undefined,
      fuelType: data.fuelType || 'unknown',
      ageYears: toNum(data.ageYears),
      remainingLifeYears: toNum(data.remainingLifeYears),
      estimatedReplacementCost: toNum(data.estimatedReplacementCost),
      currentWarranty: data.currentWarranty || data.warranty || '',
      priceBreakdown: data.priceBreakdown ? {
        unitLow: toNum(data.priceBreakdown.unitLow),
        unitHigh: toNum(data.priceBreakdown.unitHigh),
        laborLow: toNum(data.priceBreakdown.laborLow),
        laborHigh: toNum(data.priceBreakdown.laborHigh),
        emergencyPremiumLow: toNum(data.priceBreakdown.emergencyPremiumLow),
        emergencyPremiumHigh: toNum(data.priceBreakdown.emergencyPremiumHigh),
        nationalChainLow: toNum(data.priceBreakdown.nationalChainLow),
        nationalChainHigh: toNum(data.priceBreakdown.nationalChainHigh),
      } : undefined,
    },
    valuation: {
      currentValue: toNum(data.estimatedReplacementCost),
      originalPrice: toNum(data.estimatedReplacementCost),
      depreciationRate: toNum(data.depreciationRate),
      marketTrend: 'stable' as const,
      confidence: toNum(data.confidence) || 0.8,
    },
    docs: Array.isArray(data.docs) ? data.docs : [],
  }
}

/**
 * Fast lookup: zero-LLM path using D1 learned patterns.
 * Returns null (not an Error) if patterns aren't confident enough — caller falls through.
 */
export async function extractFastLookup(
  serial: string,
  brand: string,
  model?: string,
): Promise<GrokScanResult | null> {
  try {
    const response = await fetch('/api/fast-lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serial, brand, model: model || null }),
    })

    if (response.status === 404) return null
    if (!response.ok) return null

    const data = await response.json()
    if (data.source === 'miss' || data.error) return null

    return {
      extractedData: {
        product: data.product || 'Water Heater',
        brand: data.brand || 'Unknown',
        model: data.model || 'Unknown',
        serialNumber: data.serialNumber || '',
        manufactureDate: data.manufactureDate || '',
        tankSizeGallons: data.tankSizeGallons ? toNum(data.tankSizeGallons) : undefined,
        fuelType: data.fuelType || 'unknown',
        ageYears: toNum(data.ageYears),
        remainingLifeYears: toNum(data.remainingLifeYears),
        estimatedReplacementCost: toNum(data.estimatedReplacementCost),
        currentWarranty: data.currentWarranty || '',
        priceBreakdown: data.priceBreakdown ? {
          unitLow: toNum(data.priceBreakdown.unitLow),
          unitHigh: toNum(data.priceBreakdown.unitHigh),
          laborLow: toNum(data.priceBreakdown.laborLow),
          laborHigh: toNum(data.priceBreakdown.laborHigh),
          emergencyPremiumLow: toNum(data.priceBreakdown.emergencyPremiumLow),
          emergencyPremiumHigh: toNum(data.priceBreakdown.emergencyPremiumHigh),
          nationalChainLow: toNum(data.priceBreakdown.nationalChainLow),
          nationalChainHigh: toNum(data.priceBreakdown.nationalChainHigh),
        } : undefined,
      },
      valuation: {
        currentValue: toNum(data.estimatedReplacementCost),
        originalPrice: toNum(data.estimatedReplacementCost),
        depreciationRate: toNum(data.depreciationRate),
        marketTrend: 'stable' as const,
        confidence: toNum(data.patternConfidence) || toNum(data.confidence) || 0.9,
      },
      docs: Array.isArray(data.docs) ? data.docs : [],
    }
  } catch {
    return null
  }
}

/** Two-shot call: sends both overview + targeted images in one Grok request */
export async function extractFromTwoShots(
  shot1: Blob,
  shot2: Blob,
  categoryHint: string
): Promise<GrokScanResult> {
  const [base64shot1, base64shot2] = await Promise.all([
    blobToBase64(shot1),
    blobToBase64(shot2),
  ])

  const formData = new FormData()
  formData.append('image', base64shot1)
  formData.append('shot2', base64shot2)
  formData.append('category', categoryHint)

  const response = await fetch('/api/grok-scan', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unknown error')
    let message = `API error ${response.status}`
    try {
      const parsed = JSON.parse(errorBody)
      message = parsed.message || parsed.error || message
    } catch { /* use default */ }
    throw new Error(message)
  }

  const data = await response.json()

  if (data.error === 'not_a_water_heater' || data.error === 'not_a_product') {
    throw new Error(data.message || 'This does not appear to be a water heater. Please photograph your water heater\'s data plate.')
  }
  if (data.error) {
    throw new Error(data.message || data.error)
  }

  return {
    shot1Note: data.shot1Note || null,
    extractedData: {
      product: data.product || 'Water Heater',
      brand: data.brand || 'Unknown',
      model: data.model || 'Unknown',
      serialNumber: data.serialNumber || '',
      manufactureDate: data.manufactureDate || '',
      tankSizeGallons: data.tankSizeGallons ? toNum(data.tankSizeGallons) : undefined,
      fuelType: data.fuelType || 'unknown',
      ageYears: toNum(data.ageYears),
      remainingLifeYears: toNum(data.remainingLifeYears),
      estimatedReplacementCost: toNum(data.estimatedReplacementCost),
      currentWarranty: data.currentWarranty || data.warranty || '',
      priceBreakdown: data.priceBreakdown ? {
        unitLow: toNum(data.priceBreakdown.unitLow),
        unitHigh: toNum(data.priceBreakdown.unitHigh),
        laborLow: toNum(data.priceBreakdown.laborLow),
        laborHigh: toNum(data.priceBreakdown.laborHigh),
        emergencyPremiumLow: toNum(data.priceBreakdown.emergencyPremiumLow),
        emergencyPremiumHigh: toNum(data.priceBreakdown.emergencyPremiumHigh),
        nationalChainLow: toNum(data.priceBreakdown.nationalChainLow),
        nationalChainHigh: toNum(data.priceBreakdown.nationalChainHigh),
      } : undefined,
    },
    valuation: {
      currentValue: toNum(data.estimatedReplacementCost),
      originalPrice: toNum(data.estimatedReplacementCost),
      depreciationRate: toNum(data.depreciationRate),
      marketTrend: 'stable' as const,
      confidence: toNum(data.confidence) || 0.7,
    },
    docs: Array.isArray(data.docs) ? data.docs : [],
  }
}
