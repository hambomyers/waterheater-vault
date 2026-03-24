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

async function attemptGrokScan(base64: string): Promise<Response> {
  const formData = new FormData()
  formData.append('image', base64)
  return fetch('/api/grok-scan', { method: 'POST', body: formData })
}

export async function extractFromImage(imageData: Blob): Promise<GrokScanResult> {
  const base64 = await blobToBase64(imageData)

  let response = await attemptGrokScan(base64)

  // Auto-retry once on transient server errors (504, 502, 503) or network failure
  if (!response.ok && (response.status >= 500 || response.status === 0)) {
    await new Promise(r => setTimeout(r, 1500))
    response = await attemptGrokScan(base64)
  }

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

