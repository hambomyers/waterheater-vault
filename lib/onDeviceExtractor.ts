/**
 * On-device extractor — Tesseract.js OCR + regex parsing for offline extraction.
 * Tesseract manages its own WASM worker and caches language data in the browser automatically.
 * Used as first pass (category detection + basic fields) before optional Grok cloud refinement.
 */

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
}

// Date patterns: YYYY-MM-DD, MM/DD/YYYY, DD.MM.YYYY, "January 15, 2024", etc.
const DATE_PATTERNS = [
  /\b(20\d{2})[-./](0?[1-9]|1[0-2])[-./](0?[1-9]|[12]\d|3[01])\b/g,
  /\b(0?[1-9]|1[0-2])[-./](0?[1-9]|[12]\d|3[01])[-./](20\d{2})\b/g,
  /\b(0?[1-9]|[12]\d|3[01])[-./](0?[1-9]|1[0-2])[-./](20\d{2})\b/g,
  /\b(Jan(uary)?|Feb(ruary)?|Mar(ch)?|Apr(il)?|May|Jun(e)?|Jul(y)?|Aug(ust)?|Sep(tember)?|Oct(ober)?|Nov(ember)?|Dec(ember)?)\s+\d{1,2},?\s+20\d{2}\b/gi,
  /\b\d{1,2}\s+(Jan(uary)?|Feb(ruary)?|Mar(ch)?|Apr(il)?|May|Jun(e)?|Jul(y)?|Aug(ust)?|Sep(tember)?|Oct(ober)?|Nov(ember)?|Dec(ember)?)\s+20\d{2}\b/gi,
]

// Serial: alphanumeric, often with dashes, 8+ chars
const SERIAL_PATTERN = /\b([A-Z0-9]{4,}[-]?[A-Z0-9]{4,}(?:[-][A-Z0-9]{4,})*)\b/gi

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

function parseSerial(text: string): string | undefined {
  const matches = text.match(SERIAL_PATTERN)
  if (matches) {
    // Prefer longer, alphanumeric-heavy strings (likely serials)
    const sorted = matches
      .map((m) => m.replace(/[-]/g, ''))
      .filter((m) => m.length >= 8)
    return sorted[0] || matches[0]
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

/**
 * Extract structured data from image using Tesseract.js OCR.
 * Runs entirely in browser, no network. Worker is cached after first load.
 */
export async function extractOnDevice(imageData: Blob): Promise<OnDeviceExtractionResult> {
  // Dynamic import to avoid SSR issues with Next.js
  const Tesseract = await import('tesseract.js')

  const { data } = await Tesseract.recognize(imageData, 'eng', {
    logger: () => {}, // Suppress console output
  })

  const rawText = data.text.trim()
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
    }
  }

  const brand = parseBrand(rawText)
  const product = parseProduct(rawText, brand)
  const purchaseDate = parseDate(rawText)
  const manufactureDate = parseManufactureDate(rawText)
  const warranty = parseWarranty(rawText)
  const serialNumber = parseSerial(rawText)
  const price = parsePrice(rawText)
  const categoryHint = parseCategoryHint(rawText)

  // Confidence based on how much we extracted
  const fieldsFound = [brand, product, purchaseDate, warranty, serialNumber, price].filter(Boolean).length
  const confidence = Math.min(0.95, 0.3 + fieldsFound * 0.1 + (data.confidence || 0) / 100)

  return {
    product,
    brand,
    model: 'Unknown',
    purchaseDate,
    manufactureDate,
    warranty,
    serialNumber,
    price,
    condition: undefined,
    categoryHint,
    rawText,
    confidence,
  }
}
