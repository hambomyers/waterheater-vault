// Brain router — hybrid: on-device first (offline), Grok cloud for refinement + valuation (online)
import { extractFromImage, extractFromTwoShots, extractFromText, extractFastLookup, ExtractedData, GrokScanResult } from './on-device'
import { extractOnDevice, OnDeviceExtractionResult } from '../lib/onDeviceExtractor'
import { lookupByModel, lookupBySerial, LookupResult, DEFAULT_PRICING } from '../lib/wh-lookup'
import { VaultDocs } from '../vault/private'

export interface ValuationData {
  currentValue: number
  originalPrice: number
  depreciationRate: number
  marketTrend: 'up' | 'down' | 'stable'
  confidence: number
  lastUpdated: string
}

export interface ProcessingResult {
  extractedData: ExtractedData
  valuation: ValuationData
  docs?: VaultDocs
  processingMethod: 'on-device' | 'text-parse' | 'fast-lookup' | 'grok-vision'
  confidence: number
  imageBase64?: string
  shot1Note?: string | null
}

export interface OnDevicePreview {
  extractedData: ExtractedData
  categoryHint: string
  confidence: number
  rawText: string
  /** Gate fields — carried through to avoid re-running Tesseract in processImage */
  confidenceScore: number
  serialCandidate?: string
  detectedBrand: string
}

/** Infer brand from model number prefix — catches cut-off labels where brand text is unreadable */
function inferBrandFromModel(model?: string): string {
  if (!model) return ''
  const m = model.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (m.startsWith('NPE') || m.startsWith('NFC') || m.startsWith('NCB') || m.startsWith('NHB')) return 'Navien'
  if (m.startsWith('RU') || m.startsWith('RLX') || /^V[5-9]/.test(m)) return 'Rinnai'
  if (m.startsWith('NRC') || m.startsWith('EZ') || /^CB[0-9]/.test(m)) return 'Noritz'
  if (m.startsWith('TH') || m.startsWith('TK')) return 'Takagi'
  if (m.startsWith('PROE') || m.startsWith('PROG') || m.startsWith('PROT') || m.startsWith('XCR')) return 'Rheem'
  if (m.startsWith('PROU') || m.startsWith('PROH')) return 'Ruud'
  if (m.startsWith('GPVH') || m.startsWith('GPDH') || m.startsWith('HPTU') || m.startsWith('ENS')) return 'AO Smith'
  if (m.startsWith('MI') || m.startsWith('RE2') || m.startsWith('AW') || m.startsWith('ES')) return 'Bradford White'
  return ''
}

function onDeviceToExtractedData(r: OnDeviceExtractionResult): ExtractedData {
  return {
    product: r.product || 'Water Heater',
    brand: r.brand || 'Unknown',
    model: r.model || 'Unknown',
    serialNumber: r.serialNumber || '',
    manufactureDate: r.manufactureDate || '',
    tankSizeGallons: undefined,
    fuelType: 'unknown',
    ageYears: 0,
    remainingLifeYears: 0,
    estimatedReplacementCost: 0,
    currentWarranty: r.warranty || '',
  }
}

class BrainRouter {
  /**
   * Step 1: On-device extraction (always runs, works offline).
   * Returns preview for conversational confirmation.
   */
  async extractOnDevicePreview(imageData: Blob): Promise<OnDevicePreview> {
    const result = await extractOnDevice(imageData)
    return {
      extractedData: onDeviceToExtractedData(result),
      categoryHint: result.categoryHint,
      confidence: result.confidence,
      rawText: result.rawText,
      confidenceScore: result.confidenceScore,
      serialCandidate: result.serialCandidate,
      detectedBrand: result.detectedBrand,
    }
  }

  /**
   * Step 2: Full processing with 3-tier hybrid confidence gate.
   *
   * Tier 1 (fast-lookup)  — zero LLM, <100ms — D1 learned patterns, serial+brand known
   * Tier 2 (text-parse)   — text LLM,  ~1-2s  — OCR text sent to fast text model
   * Tier 3 (grok-vision)  — vision LLM, ~15s  — full image sent to Grok (fallback only)
   * Offline               — on-device result from enhanced OCR
   *
   * Every successful cloud parse feeds serial_patterns + model_catalog,
   * making Tier 1 hits more frequent over time.
   */
  async processImage(
    imageData: Blob,
    options?: { useCloud?: boolean; onDevicePreview?: OnDevicePreview }
  ): Promise<ProcessingResult> {
    const preview = options?.onDevicePreview
    const [imageBase64, ocrResult] = await Promise.all([
      this.blobToDataUrl(imageData),
      // Reuse preview's OCR data if available — avoids running Tesseract twice
      preview?.rawText
        ? Promise.resolve({
            product: preview.extractedData.product || 'Water Heater',
            brand: preview.extractedData.brand || 'Unknown',
            model: preview.extractedData.model || 'Unknown',
            serialNumber: preview.extractedData.serialNumber,
            manufactureDate: preview.extractedData.manufactureDate,
            warranty: preview.extractedData.currentWarranty,
            rawText: preview.rawText,
            confidence: preview.confidence,
            confidenceScore: preview.confidenceScore ?? 0,
            serialCandidate: preview.serialCandidate,
            detectedBrand: preview.detectedBrand ?? '',
            categoryHint: preview.categoryHint,
          } as OnDeviceExtractionResult)
        : extractOnDevice(imageData),
    ])

    const isOnline = typeof navigator !== 'undefined' && navigator.onLine

    // Offline — return enhanced on-device result
    if (!isOnline || options?.useCloud === false) {
      return this.onDeviceResult(ocrResult, imageBase64)
    }

    const { confidenceScore, serialCandidate, detectedBrand, rawText } = ocrResult
    const modelCandidate = ocrResult.model || preview?.extractedData.model

    const highConfidence = confidenceScore >= 55 && !!serialCandidate

    // ── Tier 0: hardcoded lookup table (zero network, <5ms) ──────────────────────
    // Use detected brand OR infer brand from model prefix (catches cut-off labels)
    const effectiveBrand = (detectedBrand && detectedBrand !== 'Unknown')
      ? detectedBrand
      : inferBrandFromModel(modelCandidate || undefined)

    if (effectiveBrand) {
      const tier0 = modelCandidate
        ? lookupByModel(modelCandidate, effectiveBrand, undefined, DEFAULT_PRICING)
        : serialCandidate
          ? lookupBySerial(serialCandidate, effectiveBrand, DEFAULT_PRICING)
          : null

      if (tier0 && !tier0.partial) {
        return this.lookupResultToProcessingResult(tier0, imageBase64, serialCandidate)
      }
    }

    // ── Tier 1: fast-lookup (zero LLM) ─────────────────────────────────────────
    if (highConfidence) {
      try {
        const fast = await extractFastLookup(
          serialCandidate!,
          detectedBrand || 'Unknown',
        )
        if (fast) {
          return {
            extractedData: fast.extractedData,
            valuation: { ...fast.valuation, lastUpdated: new Date().toISOString() },
            docs: fast.docs,
            processingMethod: 'fast-lookup',
            confidence: fast.valuation.confidence,
            imageBase64,
          }
        }
      } catch { /* fall through to Tier 2 */ }
    }

    // ── Tier 2: text-parse (fast text LLM) ─────────────────────────────────────
    if (highConfidence && rawText.length > 20) {
      try {
        const textResult = await extractFromText(rawText, detectedBrand || '')
        return {
          extractedData: textResult.extractedData,
          valuation: { ...textResult.valuation, lastUpdated: new Date().toISOString() },
          docs: textResult.docs,
          processingMethod: 'text-parse',
          confidence: textResult.valuation.confidence,
          imageBase64,
        }
      } catch { /* fall through to Tier 3 */ }
    }

    // ── Tier 3: Grok vision (fallback for low-confidence / difficult labels) ───
    try {
      const result: GrokScanResult = await extractFromImage(imageData)
      return {
        extractedData: result.extractedData,
        valuation: { ...result.valuation, lastUpdated: new Date().toISOString() },
        docs: result.docs,
        processingMethod: 'grok-vision',
        confidence: result.valuation.confidence,
        imageBase64,
      }
    } catch (err) {
      // All cloud paths failed — return on-device result
      if (options?.onDevicePreview) {
        return this.onDeviceResult(ocrResult, imageBase64)
      }
      throw err
    }
  }

  private lookupResultToProcessingResult(r: LookupResult, imageBase64: string, serialCandidate?: string): ProcessingResult {
    const m = r.model!
    const fuelMap: Record<string, ExtractedData['fuelType']> = {
      natural_gas: 'gas', propane: 'gas', electric: 'electric', heat_pump: 'electric',
    }
    const extractedData: ExtractedData = {
      product: 'Water Heater',
      brand: r.brand,
      model: m.modelPrefix,
      serialNumber: serialCandidate || '',
      manufactureDate: r.manufactureDate,
      tankSizeGallons: m.tankGallons ?? undefined,
      fuelType: fuelMap[m.fuelType] ?? 'unknown',
      ageYears: r.ageYears,
      remainingLifeYears: r.remainingLifeYears,
      estimatedReplacementCost: r.jobCost?.totalMin ?? 0,
      currentWarranty: '',
    }
    return {
      extractedData,
      valuation: {
        currentValue: r.jobCost ? Math.round((r.jobCost.totalMin + r.jobCost.totalMax) / 2) : 0,
        originalPrice: r.jobCost?.totalMin ?? 0,
        depreciationRate: m.expectedLifeYears > 0 ? Math.round(100 / m.expectedLifeYears) : 10,
        marketTrend: 'stable',
        confidence: 90,
        lastUpdated: new Date().toISOString(),
      },
      processingMethod: 'fast-lookup',
      confidence: 90,
      imageBase64,
    }
  }

  private onDeviceResult(ocrResult: OnDeviceExtractionResult, imageBase64: string): ProcessingResult {
    const extractedData = onDeviceToExtractedData(ocrResult)
    return {
      extractedData,
      valuation: {
        currentValue: 0,
        originalPrice: 0,
        depreciationRate: 0,
        marketTrend: 'stable',
        confidence: ocrResult.confidence,
        lastUpdated: new Date().toISOString(),
      },
      processingMethod: 'on-device',
      confidence: ocrResult.confidence,
      imageBase64,
    }
  }

  /**
   * Two-shot processing: overview (shot1) + targeted serial label (shot2).
   * Sends both images in one Grok API call for best accuracy.
   */
  async processTwoShots(
    shot1: Blob,
    shot2: Blob,
    categoryHint: string
  ): Promise<ProcessingResult> {
    const imageBase64 = await this.blobToDataUrl(shot1)
    const result: GrokScanResult = await extractFromTwoShots(shot1, shot2, categoryHint)
    return {
      extractedData: result.extractedData,
      valuation: { ...result.valuation, lastUpdated: new Date().toISOString() },
      docs: result.docs,
      processingMethod: 'grok-vision',
      confidence: result.valuation.confidence,
      imageBase64,
      shot1Note: result.shot1Note ?? null,
    }
  }

  private async blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }
}

export const brainRouter = new BrainRouter()
