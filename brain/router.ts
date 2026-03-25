// Brain router — hybrid: on-device first (offline), Grok cloud for refinement + valuation (online)
import { extractFromImage, extractFromTwoShots, extractFromText, extractFastLookup, extractFromParallelSquad, ExtractedData, GrokScanResult } from './on-device'
import { extractOnDevice, OnDeviceExtractionResult } from '../lib/onDeviceExtractor'
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
   * Step 2: Full processing with parallel firing squad.
   *
   * Primary: Parallel Squad — fires to 5+ models simultaneously, weighted consensus, 1-3s
   * Fallback 1: fast-lookup — zero LLM, <100ms — D1 learned patterns (if serial+brand known)
   * Fallback 2: text-parse  — text LLM, ~1-2s — OCR text sent to fast text model
   * Offline: on-device result from enhanced OCR
   *
   * Every successful cloud parse feeds serial_patterns + model_catalog.
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

    // ── Primary: Parallel Firing Squad (5+ models simultaneously) ────────────
    try {
      const result: GrokScanResult = await extractFromParallelSquad(imageData)
      return {
        extractedData: result.extractedData,
        valuation: { ...result.valuation, lastUpdated: new Date().toISOString() },
        docs: result.docs,
        processingMethod: 'grok-vision', // will show as 'parallel-squad' in result.source
        confidence: result.valuation.confidence,
        imageBase64,
      }
    } catch (squadErr) {
      console.warn('Parallel squad failed, trying fallbacks:', squadErr)
      
      const highConfidence = confidenceScore >= 70 && !!serialCandidate

      // ── Fallback 1: fast-lookup (zero LLM) ────────────────────────────────
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
        } catch { /* fall through */ }
      }

      // ── Fallback 2: text-parse (fast text LLM) ────────────────────────────
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
        } catch { /* fall through */ }
      }

      // ── All cloud paths failed — return on-device result ──────────────────
      if (options?.onDevicePreview) {
        return this.onDeviceResult(ocrResult, imageBase64)
      }
      throw squadErr
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
