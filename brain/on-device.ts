// Image extraction module — calls CF Pages Function → Grok Vision API
// No mock fallback. If the API fails, the error is real and visible.

/** Safe numeric coercion — avoids `Number(null) || 0` silently hiding real zeros */
function toNum(val: unknown): number {
  if (val == null) return 0
  const n = Number(val)
  return isNaN(n) ? 0 : n
}

export interface ExtractedData {
  // ── Core fields (universal — apply to every category) ──────────────────────
  product: string
  brand: string
  model: string
  serialNumber?: string
  manufactureDate?: string
  purchaseDate?: string
  warranty?: string
  price?: string
  condition?: string
  // ── Category intelligence ───────────────────────────────────────────────────
  // e.g. "appliance" | "watch" | "whisky" | "vehicle" | "collectible" | "instrument"
  category?: string
  // Category-specific fields Grok populates dynamically.
  // Examples: watch → { reference, movement, complication }
  //           whisky → { distillery, ageStatement, caskType, batchNumber }
  //           collectible → { grade, population, year, publisher }
  //           vehicle → { vin, mileage, trim }
  customFields?: Record<string, string | number | null>
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

  if (data.error === 'not_a_product') {
    throw new Error(data.message || 'This does not appear to be a product, receipt, or warranty image.')
  }

  if (data.error) {
    throw new Error(data.message || data.error)
  }

  return {
    extractedData: {
      product: data.product || 'Unknown Product',
      brand: data.brand || 'Unknown',
      model: data.model || 'Unknown',
      serialNumber: data.serialNumber || undefined,
      manufactureDate: data.manufactureDate || undefined,
      purchaseDate: data.purchaseDate || undefined,
      warranty: data.warranty || undefined,
      price: data.price || undefined,
      condition: data.condition || undefined,
      category: data.category || undefined,
      customFields: (data.customFields && typeof data.customFields === 'object')
        ? data.customFields : undefined,
    },
    valuation: {
      currentValue: toNum(data.currentValue),
      originalPrice: toNum(data.originalPrice),
      depreciationRate: toNum(data.depreciationRate),
      marketTrend: data.marketTrend || 'stable',
      confidence: toNum(data.confidence) || 0.5,
    },
    docs: Array.isArray(data.docs) ? data.docs : [],
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

  if (data.error === 'not_a_product') {
    throw new Error(data.message || 'This does not appear to be a product, receipt, or warranty image.')
  }
  if (data.error) {
    throw new Error(data.message || data.error)
  }

  return {
    extractedData: {
      product: data.product || 'Unknown Product',
      brand: data.brand || 'Unknown',
      model: data.model || 'Unknown',
      serialNumber: data.serialNumber || undefined,
      manufactureDate: data.manufactureDate || undefined,
      purchaseDate: data.purchaseDate || undefined,
      warranty: data.warranty || undefined,
      price: data.price || undefined,
      condition: data.condition || undefined,
      category: data.category || undefined,
      customFields: (data.customFields && typeof data.customFields === 'object')
        ? data.customFields : undefined,
    },
    valuation: {
      currentValue: toNum(data.currentValue),
      originalPrice: toNum(data.originalPrice),
      depreciationRate: toNum(data.depreciationRate),
      marketTrend: data.marketTrend || 'stable',
      confidence: toNum(data.confidence) || 0.5,
    },
    docs: Array.isArray(data.docs) ? data.docs : [],
  }
}
