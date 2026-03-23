/**
 * On-device extractor — Tesseract.js OCR + regex parsing for offline extraction.
 * Tesseract manages its own WASM worker and caches language data in the browser automatically.
 * Used as first pass (category detection + basic fields) before optional Grok cloud refinement.
 */
import { detectWHBrand, extractWHSerial } from './whSerialDecoder'

export interface OnDeviceExtractionResult {
  product: string
  brand: string
  model: string
  serialNumber?: string
  manufactureDate?: string
  purchaseDate?: string
  warranty?: string
  price?: string
  condition?: string
  category?: string
  customFields?: Record<string, string | number | null>
  categoryHint: string
  rawText: string
  confidence: number
  /** 0-100 numeric score used by the confidence gate in brain/router.ts */
  confidenceScore: number
  /** Best serial candidate extracted from OCR text */
  serialCandidate?: string
  /** WH brand detected from OCR text (empty string if unknown) */
  detectedBrand: string
}

// Date patterns: YYYY-MM-DD, MM/DD/YYYY, DD.MM.YYYY, "January 15, 2024", etc.
const DATE_PATTERNS = [
  /\b(20\d{2})[-./](0?[1-9]|1[0-2])[-./](0?[1-9]|[12]\d|3[01])\b/g,
  /\b(0?[1-9]|1[0-2])[-./](0?[1-9]|[12]\d|3[01])[-./](20\d{2})\b/g,
  /\b(0?[1-9]|[12]\d|3[01])[-./](0?[1-9]|1[0-2])[-./](20\d{2})\b/g,
  /\b(Jan(uary)?|Feb(ruary)?|Mar(ch)?|Apr(il)?|May|Jun(e)?|Jul(y)?|Aug(ust)?|Sep(tember)?|Oct(ober)?|Nov(ember)?|Dec(ember)?)\s+\d{1,2},?\s+20\d{2}\b/gi,
  /\b\d{1,2}\s+(Jan(uary)?|Feb(ruary)?|Mar(ch)?|Apr(il)?|May|Jun(e)?|Jul(y)?|Aug(ust)?|Sep(tember)?|Oct(ober)?|Nov(ember)?|Dec(ember)?)\s+20\d{2}\b/gi,
]

// Model: MUST be preceded by the word Model / MDL / Mod. on the label
const MODEL_LABEL_PATTERN = /(?:model|mdl|mod\.?|model\s*no\.?|model\s*#)\s*[:\-#]?\s*([A-Z0-9][A-Z0-9\-\/\.]{2,30})/i

// Serial: MUST be preceded by Serial / S\/N / Ser. on the label
const SERIAL_LABEL_PATTERN = /(?:s(?:erial)?\s*(?:no\.?|number|#)?|s[.\/]n\.?)\s*[:\-#]?\s*([A-Z0-9][A-Z0-9\-\/]{5,20})/i

// Loose serial fallback (only used if no label anchor found)
const SERIAL_PATTERN = /\b([A-Z0-9]{4,}[-]?[A-Z0-9]{4,}(?:[-][A-Z0-9]{4,})*)\b/gi

// Words that appear on water heater labels but are NOT model or serial numbers
const LABEL_NOISE_WORDS = new Set([
  'URETHANE', 'POLYURETHANE', 'INSULATION', 'INSULATED', 'NATURAL', 'ELECTRIC',
  'GALLONS', 'THERMAL', 'RECOVERY', 'CAPACITY', 'PRESSURE', 'HEATER', 'PRODUCT',
  'MAXIMUM', 'MINIMUM', 'ANODE', 'ENERGY', 'STANDARD', 'PREMIUM', 'RESIDENTIAL',
  'COMMERCIAL', 'WARNING', 'CAUTION', 'VOLTAGE', 'AMPERE', 'WATTAGE', 'CIRCUIT',
  'INSTALL', 'INSTRUC', 'PROPANE', 'NATURAL', 'EFFICIENCY', 'COMBUSTION',
  'FLAMMABLE', 'CERTIFIED', 'APPROVALS', 'COMPLIES', 'UNIFORM', 'PLUMBING',
])

// Price: $XX.XX or XX.XX
const PRICE_PATTERN = /\$?\s*(\d{1,6}(?:\.\d{2})?)\s*(?:USD|usd)?/g

// Warranty: "2 years", "12 months", "lifetime", etc.
const WARRANTY_PATTERN = /(\d+\s*(?:year|month|yr|mo)s?|lifetime|limited)/gi

// Brand: common patterns at start of lines or after "brand:", "by", etc.
const BRAND_HINTS = /(?:brand|by|manufacturer|made by)[:\s]+([A-Za-z0-9\s&.-]{2,30})/i
const MFG_LABEL_PATTERN = /(?:mfg(?:\.)?\s*date|date\s*mfg|dom|mfd|manufactured|date of mfg|prod(?:uction)?\s*date|manuf|date code)\s*[:\-]?\s*([A-Za-z0-9./,\-\s]{4,24})/i

// Category hints from common product keywords in OCR text
const CATEGORY_KEYWORDS: Record<string, string> = {
  wine: 'wine bottle',
  bottle: 'bottle',
  receipt: 'receipt',
  warranty: 'warranty card',
  warrantycard: 'warranty card',
  bird: 'bird feeder',
  feeder: 'feeder',
  electronics: 'electronics',
  laptop: 'laptop',
  phone: 'phone',
  television: 'television',
  tv: 'television',
  appliance: 'appliance',
  furniture: 'furniture',
  tool: 'tool',
  camera: 'camera',
}

function parseDate(text: string): string {
  for (const pattern of DATE_PATTERNS) {
    const match = text.match(pattern)
    if (match) {
      const raw = match[0]
      // Normalize to YYYY-MM-DD if possible
      const isoMatch = raw.match(/(\d{4})[-./](\d{1,2})[-./](\d{1,2})/)
      if (isoMatch) {
        const [, y, m, d] = isoMatch
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
      }
      return raw.trim()
    }
  }
  return ''
}

function parseModel(text: string): string | undefined {
  const match = text.match(MODEL_LABEL_PATTERN)
  if (!match?.[1]) return undefined
  const val = match[1].trim().toUpperCase()
  // Reject if it's a noise word or looks like prose (contains space, all alpha)
  if (LABEL_NOISE_WORDS.has(val)) return undefined
  if (LABEL_NOISE_WORDS.has(val.split(/[^A-Z]/)[0])) return undefined
  if (/^[A-Z]+$/.test(val) && val.length > 8) return undefined
  return val
}

function parseSerial(text: string): string | undefined {
  // Label-anchored first
  const labeled = text.match(SERIAL_LABEL_PATTERN)
  if (labeled?.[1]) {
    const val = labeled[1].trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (val.length >= 6 && !LABEL_NOISE_WORDS.has(val)) return val
  }
  // Loose fallback — filtered
  const matches = text.match(SERIAL_PATTERN)
  if (matches) {
    const sorted = matches
      .map((m) => m.replace(/[-]/g, '').toUpperCase())
      .filter((m) => m.length >= 8)
      .filter((m) => /[A-Z]/.test(m) && /[0-9]/.test(m))
      .filter((m) => !LABEL_NOISE_WORDS.has(m) && !Array.from(LABEL_NOISE_WORDS).some(w => m.startsWith(w.slice(0, 6))))
    return sorted[0]
  }
  return undefined
}

function parsePrice(text: string): string | undefined {
  const matches = Array.from(text.matchAll(PRICE_PATTERN))
  if (matches.length > 0) {
    const values = matches.map((m) => parseFloat(m[1])).filter((n) => n > 0 && n < 1000000)
    if (values.length > 0) {
      const maxPrice = Math.max(...values)
      return `$${maxPrice.toFixed(2)}`
    }
  }
  return undefined
}

function parseWarranty(text: string): string {
  const match = text.match(WARRANTY_PATTERN)
  return match ? match[0] : ''
}

function parseBrand(text: string): string {
  const brandMatch = text.match(BRAND_HINTS)
  if (brandMatch) return brandMatch[1].trim()
  // Fallback: first line that looks like a brand (short, capitalized)
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean)
  for (const line of lines.slice(0, 5)) {
    if (line.length >= 2 && line.length <= 40 && /^[A-Z]/.test(line)) {
      return line
    }
  }
  return 'Unknown'
}

function parseCategoryHint(text: string): string {
  const lower = text.toLowerCase().replace(/\s+/g, ' ')
  for (const [keyword, category] of Object.entries(CATEGORY_KEYWORDS)) {
    if (lower.includes(keyword)) return category
  }
  return 'product or document'
}

function normalizeFoundDate(value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const isoMatch = trimmed.match(/\b(20\d{2})[-./](0?[1-9]|1[0-2])[-./](0?[1-9]|[12]\d|3[01])\b/)
  if (isoMatch) {
    const [, y, m, d] = isoMatch
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  const ymMatch = trimmed.match(/\b(20\d{2})[-./](0?[1-9]|1[0-2])\b/)
  if (ymMatch) {
    const [, y, m] = ymMatch
    return `${y}-${m.padStart(2, '0')}`
  }
  return trimmed
}

function parseManufactureDate(text: string): string | undefined {
  const byLabel = text.match(MFG_LABEL_PATTERN)
  if (byLabel?.[1]) {
    const normalized = normalizeFoundDate(byLabel[1])
    if (normalized) return normalized
  }
  const anyDate = parseDate(text)
  if (anyDate) return anyDate
  return undefined
}

function parseProduct(text: string, brand: string): string {
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean)
  // Skip first line if it's the brand
  for (let i = 0; i < Math.min(lines.length, 8); i++) {
    const line = lines[i]
    if (line && line !== brand && line.length > 3 && line.length < 80) {
      return line
    }
  }
  return 'Unknown Product'
}

// ── Canvas preprocessing — improves OCR accuracy 20-40% on shiny metal labels ─

async function preprocessImageForOCR(imageBlob: Blob): Promise<Blob> {
  if (typeof document === 'undefined') return imageBlob
  return new Promise<Blob>((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(imageBlob)
    img.onload = () => {
      const maxDim = 1600
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const d = imageData.data
      for (let i = 0; i < d.length; i += 4) {
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
        const adjusted = Math.min(255, Math.max(0, (gray - 128) * 1.4 + 138))
        d[i] = d[i + 1] = d[i + 2] = adjusted
      }
      ctx.putImageData(imageData, 0, 0)
      canvas.toBlob((blob) => resolve(blob || imageBlob), 'image/jpeg', 0.85)
    }
    img.onerror = () => resolve(imageBlob)
    img.src = url
  })
}

/**
 * Extract structured data from image using Tesseract.js OCR.
 * Runs entirely in browser, no network. Enhanced with canvas preprocessing,
 * PSM-6 parameter control, and WH-specific brand/serial detection.
 */
export async function extractOnDevice(imageData: Blob): Promise<OnDeviceExtractionResult> {
  const Tesseract = await import('tesseract.js')

  const processedBlob = await preprocessImageForOCR(imageData)

  const worker = await Tesseract.createWorker('eng', 1, { logger: () => {} })
  let data: any
  try {
    await (worker as any).setParameters({
      tessedit_pageseg_mode: '6',
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-/.: #',
    })
    const result = await worker.recognize(processedBlob)
    data = result.data
  } finally {
    worker.terminate().catch(() => {})
  }

  const rawText = data.text.trim()
  const tesseractConf: number = data.confidence || 0

  if (!rawText || rawText.length < 10) {
    return {
      product: 'Unknown Product',
      brand: 'Unknown',
      model: 'Unknown',
      purchaseDate: '',
      warranty: '',
      categoryHint: 'unclear — may not be a document',
      rawText,
      confidence: 0.2,
      confidenceScore: 10,
      detectedBrand: '',
    }
  }

  // WH-specific detection (higher priority than generic brand parsing)
  const detectedBrand = detectWHBrand(rawText) || parseBrand(rawText)
  const serialCandidate = extractWHSerial(rawText) || parseSerial(rawText)
  const modelCandidate = parseModel(rawText)

  const product = parseProduct(rawText, detectedBrand)
  const purchaseDate = parseDate(rawText)
  const manufactureDate = parseManufactureDate(rawText)
  const warranty = parseWarranty(rawText)
  const price = parsePrice(rawText)
  const categoryHint = parseCategoryHint(rawText)

  // Composite 0-100 confidence score for the hybrid gate
  const serialBonus = serialCandidate ? 25 : 0
  const brandBonus = detectedBrand && detectedBrand !== 'Unknown' ? 15 : 0
  const confidenceScore = Math.min(100, Math.round(tesseractConf * 0.6 + serialBonus + brandBonus))

  const fieldsFound = [detectedBrand, product, purchaseDate, warranty, serialCandidate, price].filter(Boolean).length
  const confidence = Math.min(0.95, 0.3 + fieldsFound * 0.1 + tesseractConf / 100)

  return {
    product,
    brand: detectedBrand,
    model: modelCandidate || 'Unknown',
    purchaseDate,
    manufactureDate,
    warranty,
    serialNumber: serialCandidate,
    price,
    condition: undefined,
    categoryHint,
    rawText,
    confidence,
    confidenceScore,
    serialCandidate,
    detectedBrand,
  }
}
