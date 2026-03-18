// Brain router — hybrid: on-device first (offline), Grok cloud for refinement + valuation (online)
import { extractFromImage, extractFromTwoShots, ExtractedData, GrokScanResult } from './on-device'
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
  processingMethod: 'on-device' | 'grok-vision'
  confidence: number
  imageBase64?: string
}

export interface OnDevicePreview {
  extractedData: ExtractedData
  categoryHint: string
  confidence: number
  rawText: string
}

function onDeviceToExtractedData(r: OnDeviceExtractionResult): ExtractedData {
  return {
    product: r.product,
    brand: r.brand,
    model: r.model,
    serialNumber: r.serialNumber,
    manufactureDate: r.manufactureDate,
    purchaseDate: r.purchaseDate,
    warranty: r.warranty,
    price: r.price,
    condition: r.condition,
    category: r.category,
    customFields: r.customFields,
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
    }
  }

  /**
   * Step 2: Full processing — on-device first, then Grok if online and user confirmed.
   */
  async processImage(
    imageData: Blob,
    options?: { useCloud?: boolean; onDevicePreview?: OnDevicePreview }
  ): Promise<ProcessingResult> {
    const imageBase64 = await this.blobToDataUrl(imageData)
    const isOnline = typeof navigator !== 'undefined' && navigator.onLine

    // If we have on-device preview and user chose not to use cloud (or offline), use it
    if (options?.onDevicePreview && !options?.useCloud && !isOnline) {
      const { extractedData, confidence } = options.onDevicePreview
      return {
        extractedData,
        valuation: {
          currentValue: 0,
          originalPrice: 0,
          depreciationRate: 0,
          marketTrend: 'stable',
          confidence,
          lastUpdated: new Date().toISOString(),
        },
        processingMethod: 'on-device',
        confidence,
        imageBase64,
      }
    }

    // If online and (useCloud requested or no preview), call Grok
    if (isOnline && (options?.useCloud ?? true)) {
      try {
        const result: GrokScanResult = await extractFromImage(imageData)
        return {
          extractedData: result.extractedData,
          valuation: {
            ...result.valuation,
            lastUpdated: new Date().toISOString(),
          },
          docs: result.docs,
          processingMethod: 'grok-vision',
          confidence: result.valuation.confidence,
          imageBase64,
        }
      } catch (err) {
        // Fall back to on-device if Grok fails and we have preview
        if (options?.onDevicePreview) {
          const { extractedData, confidence } = options.onDevicePreview
          return {
            extractedData,
            valuation: {
              currentValue: 0,
              originalPrice: 0,
              depreciationRate: 0,
              marketTrend: 'stable',
              confidence,
              lastUpdated: new Date().toISOString(),
            },
            processingMethod: 'on-device',
            confidence,
            imageBase64,
          }
        }
        throw err
      }
    }

    // Offline and no preview — run on-device now
    const onDeviceResult = await extractOnDevice(imageData)
    return {
      extractedData: onDeviceToExtractedData(onDeviceResult),
      valuation: {
        currentValue: 0,
        originalPrice: 0,
        depreciationRate: 0,
        marketTrend: 'stable',
        confidence: onDeviceResult.confidence,
        lastUpdated: new Date().toISOString(),
      },
      processingMethod: 'on-device',
      confidence: onDeviceResult.confidence,
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
