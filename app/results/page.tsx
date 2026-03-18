'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ProcessingResult } from '../../brain/router'
import { privateVault, normalizeDocs } from '../../vault/private'

export default function ResultsPage() {
  const [scanResult, setScanResult] = useState<ProcessingResult | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    const storedResult = sessionStorage.getItem('scan-result')
    if (storedResult) {
      try {
        const result: ProcessingResult = JSON.parse(storedResult)
        setScanResult(result)
      } catch {
        // Corrupted session data — nothing actionable to show
      }
    }
  }, [])

  const handleSaveToVault = async () => {
    if (!scanResult) return
    setIsSaving(true)
    setSaveError(null)
    try {
      await privateVault.addItem({
        extractedData: scanResult.extractedData,
        valuation: scanResult.valuation,
        docs: scanResult.docs,
        imageData: scanResult.imageBase64 || undefined,
        tags: [],
        notes: `Processed via ${scanResult.processingMethod}`
      })
      sessionStorage.removeItem('scan-result')
      window.location.href = '/vault'
    } catch {
      setSaveError('Save failed — please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleScanAnother = () => {
    sessionStorage.removeItem('scan-result')
    window.location.href = '/scan'
  }

  if (!scanResult) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-white text-opacity-60 text-center">
          <div className="text-2xl mb-2">⚠️</div>
          <div>No scan data found</div>
          <Link href="/scan" className="text-blue-accent hover:underline mt-4 block">
            Go back to scan
          </Link>
        </div>
      </div>
    )
  }

  const { extractedData, valuation, processingMethod, confidence } = scanResult
  const docs = normalizeDocs(scanResult.docs)

  return (
    <div className="min-h-screen bg-black">
      {/* Mobile Layout */}
      <div className="md:hidden min-h-screen px-6 py-8">
        <div className="max-w-sm mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-1 text-white text-opacity-50 hover:text-opacity-90 transition-all min-h-[44px]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
              <span className="text-sm font-light">Home</span>
            </Link>
            <h1 className="text-white font-light text-xl">Results</h1>
          </div>

          {/* Photo Preview - Mobile */}
          {scanResult.imageBase64 && (
            <div className="w-full aspect-video bg-white bg-opacity-5 rounded-2xl border border-white border-opacity-10 overflow-hidden">
              <img src={scanResult.imageBase64} alt="Scanned item" className="w-full h-full object-cover" />
            </div>
          )}

          {/* Extracted Data Card - Mobile */}
          <div className="bg-white bg-opacity-5 rounded-2xl border border-white border-opacity-10 p-6 space-y-4 hover:bg-opacity-8 hover:border-opacity-20 transition-all duration-500">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-medium text-lg">Product Information</h2>
              <span className="text-xs px-2 py-1 rounded-full bg-blue-accent bg-opacity-20 text-blue-accent">
                AI Extracted
              </span>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-white text-opacity-60 font-light">Product</span>
                <span className="text-white font-medium">{extractedData.product}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white text-opacity-60 font-light">Brand</span>
                <span className="text-white font-medium">{extractedData.brand}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white text-opacity-60 font-light">Model</span>
                <span className="text-white font-medium">{extractedData.model}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white text-opacity-60 font-light">Purchase Date</span>
                <span className="text-white font-medium">{extractedData.purchaseDate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white text-opacity-60 font-light">Manufacture Date</span>
                <span className="text-white font-medium">{extractedData.manufactureDate || '—'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white text-opacity-60 font-light">Warranty</span>
                <span className="text-white font-medium">{extractedData.warranty}</span>
              </div>
              {extractedData.serialNumber && (
                <div className="flex justify-between items-center">
                  <span className="text-white text-opacity-60 font-light">Serial</span>
                  <span className="text-white text-xs font-mono">{extractedData.serialNumber}</span>
                </div>
              )}
              <div className="flex justify-between items-center border-t border-white border-opacity-10 pt-4">
                <span className="text-white text-opacity-60 font-light">Est. Value</span>
                <span className="text-blue-accent font-semibold text-lg">
                  {valuation ? `$${valuation.currentValue.toFixed(2)}` : extractedData.price || 'N/A'}
                </span>
              </div>
              {valuation && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white text-opacity-60 font-light">Confidence</span>
                  <span className="text-white font-medium">{(confidence * 100).toFixed(0)}%</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm">
                <span className="text-white text-opacity-60 font-light">Processing</span>
                <span className="text-white font-medium">{processingMethod === 'grok-vision' ? 'Grok Cloud' : 'On-Device'}</span>
              </div>
            </div>
          </div>

          {/* Docs & Links - Mobile */}
          {docs.length > 0 && (
            <div className="bg-white bg-opacity-5 rounded-2xl border border-white border-opacity-10 overflow-hidden divide-y divide-white divide-opacity-5">
              <div className="px-5 py-3 text-white text-opacity-40 text-xs font-light uppercase tracking-wider">
                Docs &amp; Links
              </div>
              {docs.map((doc, i) => (
                <div key={doc.type + i} className="px-5 py-4 flex items-center justify-between">
                  <span className="text-white text-opacity-60 text-sm font-light">{doc.label}</span>
                  {doc.url ? (
                    <a href={doc.url} target="_blank" rel="noopener noreferrer"
                      className="text-blue-accent text-sm font-light hover:underline">
                      Open ↗
                    </a>
                  ) : (
                    <a href={`https://www.google.com/search?q=${encodeURIComponent((doc.searchQuery || `${extractedData.brand} ${extractedData.model} ${doc.label}`))}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-white text-opacity-30 text-sm font-light hover:text-opacity-60">
                      Search ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Actions - Mobile */}
          <div className="space-y-4">
            {saveError && (
              <div className="px-4 py-3 rounded-2xl bg-red-500 bg-opacity-15 text-red-300 text-sm font-light text-center">
                {saveError}
              </div>
            )}
            <button
              onClick={handleSaveToVault}
              disabled={isSaving}
              className="w-full py-4 px-8 bg-blue-accent text-white rounded-full font-medium text-lg transition-all duration-500 hover:bg-opacity-90 hover:animate-pulse-glow disabled:opacity-30 disabled:cursor-not-allowed active:scale-98"
            >
              {isSaving ? 'Saving…' : 'Save to Vault'}
            </button>
            <button
              onClick={handleScanAnother}
              className="w-full py-4 px-8 bg-transparent border-2 border-white border-opacity-20 text-white rounded-full font-medium text-lg hover:border-opacity-40 hover:bg-white hover:bg-opacity-5 transition-all duration-500 active:scale-98"
            >
              Scan Another
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block min-h-screen">
        <div className="max-w-3xl mx-auto px-8 py-12">

          {/* Back */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-white text-opacity-40 hover:text-opacity-75 text-sm font-light transition-colors duration-200 mb-10"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Home
          </Link>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-white text-4xl font-light mb-1">{extractedData.product}</h1>
            <p className="text-white text-opacity-40 text-base font-light">
              {extractedData.brand}
              {extractedData.model && extractedData.model !== 'Unknown' && ` · ${extractedData.model}`}
            </p>
          </div>

          {/* Photo */}
          {scanResult.imageBase64 && (
            <div className="w-full aspect-video bg-white bg-opacity-4 rounded-2xl border border-white border-opacity-7 overflow-hidden mb-6">
              <img src={scanResult.imageBase64} alt="Scanned item" className="w-full h-full object-contain" />
            </div>
          )}

          {/* Fields */}
          <div className="rounded-2xl border border-white border-opacity-8 overflow-hidden divide-y divide-white divide-opacity-5 mb-5">
            <div className="flex items-center justify-between px-6 py-3">
              <span className="text-white text-opacity-30 text-xs font-light uppercase tracking-widest">Product Details</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-accent bg-opacity-15 text-blue-accent font-light">
                AI Extracted
              </span>
            </div>
            <div className="grid grid-cols-2 divide-x divide-white divide-opacity-5">
              {[
                { label: 'Brand', value: extractedData.brand },
                { label: 'Model', value: extractedData.model },
                { label: 'Purchase Date', value: extractedData.purchaseDate },
                  { label: 'Manufacture Date', value: extractedData.manufactureDate },
                { label: 'Warranty', value: extractedData.warranty },
                ...(extractedData.serialNumber ? [{ label: 'Serial', value: extractedData.serialNumber }] : []),
                { label: 'Est. Value', value: valuation ? `$${valuation.currentValue.toFixed(0)}` : extractedData.price || '—' },
                ...(valuation ? [{ label: 'Confidence', value: `${(confidence * 100).toFixed(0)}%` }] : []),
                { label: 'Processing', value: processingMethod === 'grok-vision' ? 'Grok Cloud' : 'On-Device' },
              ].map((row) => (
                <div key={row.label} className="px-6 py-4 border-b border-white border-opacity-5">
                  <div className="text-white text-opacity-35 text-xs font-light mb-1">{row.label}</div>
                  <div className={`text-sm font-light ${row.label === 'Est. Value' ? 'text-blue-accent font-medium' : 'text-white'}`}>
                    {row.value || <span className="text-white text-opacity-20">—</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Docs */}
          {docs.length > 0 && (
            <div className="rounded-2xl border border-white border-opacity-8 overflow-hidden divide-y divide-white divide-opacity-5 mb-6">
              <div className="px-6 py-3 text-white text-opacity-30 text-xs font-light uppercase tracking-widest">
                Docs &amp; Links
              </div>
              {docs.map((doc, i) => (
                <div key={doc.type + i} className="flex items-center justify-between px-6 py-4">
                  <span className="text-white text-opacity-55 text-sm font-light">{doc.label}</span>
                  {doc.url ? (
                    <a href={doc.url} target="_blank" rel="noopener noreferrer"
                      className="text-blue-accent text-sm font-light hover:underline">
                      Open ↗
                    </a>
                  ) : (
                    <a href={`https://www.google.com/search?q=${encodeURIComponent((doc.searchQuery || `${extractedData.brand} ${extractedData.model} ${doc.label}`))}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-white text-opacity-30 text-sm font-light hover:text-opacity-60 transition-colors">
                      Search ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          {saveError && (
            <div className="mb-4 px-4 py-3 rounded-2xl bg-red-500 bg-opacity-15 text-red-300 text-sm font-light">
              {saveError}
            </div>
          )}
          <div className="flex gap-4">
            <button
              onClick={handleSaveToVault}
              disabled={isSaving}
              className="flex-1 py-3.5 rounded-full bg-blue-accent text-white text-sm font-medium hover:bg-opacity-90 transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving…' : 'Save to Vault'}
            </button>
            <button
              onClick={handleScanAnother}
              className="flex-1 py-3.5 rounded-full border border-white border-opacity-15 text-white text-opacity-60 text-sm font-light hover:border-opacity-30 hover:text-opacity-90 transition-all duration-200"
            >
              Scan Another
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
