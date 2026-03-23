// Brain router — hybrid: on-device first (offline), Grok cloud for refinement + valuation (online)
import { extractFromImage, ExtractedData, GrokScanResult } from './on-device'
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
   * Full processing: Grok Vision always (when online) — no OCR on cloud path.
   * Offline falls back to on-device Tesseract.
   */
  async processImage(
    imageData: Blob,
    options?: { useCloud?: boolean; onDevicePreview?: OnDevicePreview }
  ): Promise<ProcessingResult> {
    const isOnline = typeof navigator !== 'undefined' && navigator.onLine

    // Offline: use preview OCR data or run Tesseract
    if (!isOnline || options?.useCloud === false) {
      const imageBase64 = await this.blobToDataUrl(imageData)
      const preview = options?.onDevicePreview
      const ocrResult: OnDeviceExtractionResult = preview?.rawText
        ? {
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
          } as OnDeviceExtractionResult
        : await extractOnDevice(imageData)
      return this.onDeviceResult(ocrResult, imageBase64)
    }

    // Online: Grok Vision + base64 encode fire in parallel — no OCR
    const [imageBase64, result] = await Promise.all([
      this.blobToDataUrl(imageData),
      extractFromImage(imageData),
    ])
    return {
      extractedData: result.extractedData,
      valuation: { ...result.valuation, lastUpdated: new Date().toISOString() },
      docs: result.docs,
      processingMethod: 'grok-vision',
      confidence: result.valuation.confidence,
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
