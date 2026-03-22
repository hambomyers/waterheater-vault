'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { ProcessingResult } from '../../brain/router'
import { privateVault, normalizeDocs } from '../../vault/private'
import { ExtractedData } from '../../brain/on-device'
import InvitePlumberButton from '../components/InvitePlumberButton'
import PDFReportGenerator from '../components/PDFReportGenerator'
import RebateMaximizerCard from '../components/RebateMaximizerCard'

function RemainingLifeGauge({ remainingLifeYears, ageYears }: { remainingLifeYears: number; ageYears: number }) {
  const totalLife = ageYears + remainingLifeYears
  const pct = totalLife > 0 ? Math.max(0, Math.min(100, (remainingLifeYears / totalLife) * 100)) : 0
  const color = remainingLifeYears < 2 ? '#ef4444' : remainingLifeYears < 5 ? '#f59e0b' : '#22c55e'
  const label = remainingLifeYears < 2 ? 'Critical' : remainingLifeYears < 5 ? 'Aging' : 'Healthy'
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-white text-opacity-60 text-sm font-light">Estimated remaining life</span>
        <span className="font-medium text-sm" style={{ color }}>{remainingLifeYears} yr · {label}</span>
      </div>
      <div className="h-2 rounded-full bg-white bg-opacity-10 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <div className="flex justify-between text-white text-opacity-25 text-xs font-light">
        <span>Age: {ageYears} yr</span>
        <span>Remaining: {remainingLifeYears} yr</span>
      </div>
    </div>
  )
}

function EmailCapture({ extractedData }: { extractedData: ExtractedData }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    try {
      const res = await fetch('/api/capture-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          brand: extractedData.brand,
          model: extractedData.model,
          serialNumber: extractedData.serialNumber,
          manufactureDate: extractedData.manufactureDate,
          ageYears: extractedData.ageYears,
          fuelType: extractedData.fuelType,
          estimatedReplacementCost: extractedData.estimatedReplacementCost,
          remainingLifeYears: extractedData.remainingLifeYears,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      setStatus('done')
    } catch {
      setStatus('error')
      setErrorMsg('Could not send — please try again.')
    }
  }

  if (status === 'done') {
    return (
      <div className="rounded-2xl border border-green-500 border-opacity-30 bg-green-500 bg-opacity-10 p-5 text-center">
        <div className="text-green-400 font-medium mb-1">✓ Report sent to your inbox</div>
        <div className="text-white text-opacity-50 text-sm font-light">We'll remind you before your heater fails.</div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white border-opacity-10 bg-white bg-opacity-5 p-5">
      <div className="text-white font-medium mb-1">📧 Email me this report</div>
      <div className="text-white text-opacity-50 text-sm font-light mb-4">Free copy + a reminder before your heater fails.</div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@email.com"
          required
          className="flex-1 rounded-full border border-white border-opacity-20 bg-transparent px-4 py-2.5 text-white text-sm placeholder:text-white placeholder:text-opacity-30 focus:outline-none focus:border-blue-accent"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="rounded-full bg-blue-accent px-5 py-2.5 text-white text-sm font-medium disabled:opacity-60 whitespace-nowrap"
        >
          {status === 'loading' ? '…' : 'Send →'}
        </button>
      </form>
      {status === 'error' && <p className="mt-2 text-red-300 text-sm font-light">{errorMsg}</p>}
    </div>
  )
}

function SocialShare({ extractedData }: { extractedData: ExtractedData }) {
  const [copied, setCopied] = useState(false)
  const scanUrl = 'https://scan.waterheaterplan.com'
  const msg = `My ${extractedData.brand} water heater is ${extractedData.ageYears} years old with ~${extractedData.remainingLifeYears} years left. Found out in 60 seconds: ${scanUrl}`
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(scanUrl)}&quote=${encodeURIComponent(msg)}`
  const smsUrl = `sms:?body=${encodeURIComponent(msg)}`

  const copyNextdoor = async () => {
    try {
      await navigator.clipboard.writeText(`${msg}\n\nFree for everyone — no signup needed.`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch { /* clipboard blocked */ }
  }

  return (
    <div className="rounded-2xl border border-white border-opacity-10 bg-white bg-opacity-5 p-5">
      <div className="text-white font-medium text-sm mb-1">Share your results</div>
      <div className="text-white text-opacity-45 text-xs font-light mb-4">Let your neighbors know — most people have no idea how old their heater is.</div>
      <div className="flex gap-2 flex-wrap">
        <a href={smsUrl} className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-white border-opacity-15 text-white text-opacity-70 text-sm font-light hover:border-opacity-30 transition-colors">
          💬 Text
        </a>
        <a href={fbUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-white border-opacity-15 text-white text-opacity-70 text-sm font-light hover:border-opacity-30 transition-colors">
          Facebook
        </a>
        <button onClick={copyNextdoor} className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-white border-opacity-15 text-white text-opacity-70 text-sm font-light hover:border-opacity-30 transition-colors">
          {copied ? '✓ Copied for Nextdoor' : 'Nextdoor'}
        </button>
      </div>
    </div>
  )
}

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

  const { extractedData, processingMethod, confidence } = scanResult
  const docs = normalizeDocs(scanResult.docs)

  const rebateDoc = docs.find(d => d.type === 'utilityRebate') ?? null

  return (
    <div className="min-h-screen bg-black">
      {/* Mobile Layout */}
      <div className="md:hidden min-h-screen px-6 py-8">
        <div className="max-w-sm mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-1 text-white text-opacity-50 min-h-[44px]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
              <span className="text-sm font-light">Home</span>
            </Link>
            <h1 className="text-white font-light text-xl">Results</h1>
          </div>

          {/* Photo */}
          {scanResult.imageBase64 && (
            <div className="w-full aspect-video bg-white bg-opacity-5 rounded-2xl border border-white border-opacity-10 overflow-hidden">
              <img src={scanResult.imageBase64} alt="Scanned water heater" className="w-full h-full object-cover" />
            </div>
          )}

          {/* Remaining Life Gauge */}
          <div className="bg-white bg-opacity-5 rounded-2xl border border-white border-opacity-10 p-5">
            <RemainingLifeGauge remainingLifeYears={extractedData.remainingLifeYears} ageYears={extractedData.ageYears} />
          </div>

          {/* Data Card */}
          <div className="bg-white bg-opacity-5 rounded-2xl border border-white border-opacity-10 p-5 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-white font-medium">Water Heater Details</h2>
              <span className="text-xs px-2 py-1 rounded-full bg-blue-accent bg-opacity-20 text-blue-accent">
                {processingMethod === 'grok-vision' ? 'Grok AI' : 'On-Device'}
              </span>
            </div>
            {[
              { label: 'Brand', value: extractedData.brand },
              { label: 'Model', value: extractedData.model },
              { label: 'Serial', value: extractedData.serialNumber },
              { label: 'Manufactured', value: extractedData.manufactureDate },
              { label: 'Fuel Type', value: extractedData.fuelType },
              { label: 'Tank Size', value: extractedData.tankSizeGallons ? `${extractedData.tankSizeGallons} gal` : null },
              { label: 'Warranty', value: extractedData.currentWarranty },
              { label: 'Replacement Cost', value: extractedData.estimatedReplacementCost ? `$${extractedData.estimatedReplacementCost.toLocaleString()}` : null },
              { label: 'Confidence', value: `${(confidence * 100).toFixed(0)}%` },
            ].filter(r => r.value).map((row) => (
              <div key={row.label} className="flex justify-between items-center border-t border-white border-opacity-5 pt-3">
                <span className="text-white text-opacity-50 text-sm font-light">{row.label}</span>
                <span className={`text-sm font-medium ${row.label === 'Replacement Cost' ? 'text-blue-accent' : 'text-white'}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* Manufacturer Service Reminder */}
          <div className="rounded-2xl border border-blue-accent border-opacity-20 bg-blue-accent bg-opacity-5 px-5 py-4">
            <p className="text-white text-sm font-light leading-relaxed">
              <span className="text-blue-accent font-medium">Your manufacturer requires yearly professional service</span>
              {extractedData.fuelType === 'tankless' ? ' (tankless units often need two per year)' : ''}.
              {' '}Most homeowners have never done it once. You just checked — good move.
            </p>
          </div>

          {/* Rebate Maximizer */}
          <RebateMaximizerCard rebateDoc={rebateDoc} brand={extractedData.brand} fuelType={extractedData.fuelType} />

          {/* Viral CTA + PDF */}
          <div className="space-y-3">
            <InvitePlumberButton extractedData={extractedData} />
            <PDFReportGenerator extractedData={extractedData} imageBase64={scanResult.imageBase64 ?? undefined} />
          </div>

          {/* Social Share */}
          <SocialShare extractedData={extractedData} />

          {/* Shot 1 Observation Note */}
          {scanResult.shot1Note && (
            <div className="rounded-2xl border border-white border-opacity-10 bg-white bg-opacity-5 px-5 py-4">
              <p className="text-white text-opacity-40 text-xs font-light leading-relaxed">
                <span className="text-white text-opacity-60 font-medium">AI observed: </span>
                {scanResult.shot1Note}
              </p>
            </div>
          )}

          {/* Email Capture */}
          <EmailCapture extractedData={extractedData} />

          {/* Docs */}
          {docs.length > 0 && (
            <div className="bg-white bg-opacity-5 rounded-2xl border border-white border-opacity-10 overflow-hidden divide-y divide-white divide-opacity-5">
              <div className="px-5 py-3 text-white text-opacity-40 text-xs font-light uppercase tracking-wider">Docs &amp; Links</div>
              {docs.map((doc, i) => (
                <div key={doc.type + i} className="px-5 py-4 flex items-center justify-between">
                  <span className="text-white text-opacity-60 text-sm font-light">{doc.label}</span>
                  {doc.url ? (
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-accent text-sm font-light hover:underline">Open ↗</a>
                  ) : (
                    <a href={`https://www.google.com/search?q=${encodeURIComponent(doc.searchQuery || `${extractedData.brand} ${extractedData.model} ${doc.label}`)}`}
                      target="_blank" rel="noopener noreferrer" className="text-white text-opacity-30 text-sm font-light hover:text-opacity-60">Search ↗</a>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Vault Actions */}
          <div className="space-y-3 pt-2">
            {saveError && <div className="px-4 py-3 rounded-2xl bg-red-500 bg-opacity-15 text-red-300 text-sm font-light text-center">{saveError}</div>}
            <button onClick={handleSaveToVault} disabled={isSaving}
              className="w-full py-4 px-8 bg-white bg-opacity-10 text-white rounded-full font-medium text-base disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.97] transition-all">
              {isSaving ? 'Saving…' : 'Save to Vault'}
            </button>
            <button onClick={handleScanAnother}
              className="w-full py-3 text-white text-opacity-40 font-light text-sm">
              Scan Another
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block min-h-screen">
        <div className="max-w-3xl mx-auto px-8 py-12">
          <Link href="/" className="inline-flex items-center gap-1.5 text-white text-opacity-40 hover:text-opacity-75 text-sm font-light transition-colors duration-200 mb-10">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Home
          </Link>

          <div className="mb-8">
            <h1 className="text-white text-4xl font-light mb-1">{extractedData.product}</h1>
            <p className="text-white text-opacity-40 text-base font-light">
              {extractedData.brand}{extractedData.model && extractedData.model !== 'Unknown' && ` · ${extractedData.model}`}
            </p>
          </div>

          {scanResult.imageBase64 && (
            <div className="w-full aspect-video bg-white bg-opacity-4 rounded-2xl border border-white border-opacity-7 overflow-hidden mb-6">
              <img src={scanResult.imageBase64} alt="Scanned water heater" className="w-full h-full object-contain" />
            </div>
          )}

          {/* Remaining Life Gauge */}
          <div className="rounded-2xl border border-white border-opacity-8 p-6 mb-5">
            <RemainingLifeGauge remainingLifeYears={extractedData.remainingLifeYears} ageYears={extractedData.ageYears} />
          </div>

          {/* Fields */}
          <div className="rounded-2xl border border-white border-opacity-8 overflow-hidden divide-y divide-white divide-opacity-5 mb-5">
            <div className="flex items-center justify-between px-6 py-3">
              <span className="text-white text-opacity-30 text-xs font-light uppercase tracking-widest">Water Heater Details</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-accent bg-opacity-15 text-blue-accent font-light">
                {processingMethod === 'grok-vision' ? 'Grok AI' : 'On-Device'}
              </span>
            </div>
            <div className="grid grid-cols-2 divide-x divide-white divide-opacity-5">
              {[
                { label: 'Brand', value: extractedData.brand },
                { label: 'Model', value: extractedData.model },
                { label: 'Serial Number', value: extractedData.serialNumber },
                { label: 'Manufacture Date', value: extractedData.manufactureDate },
                { label: 'Fuel Type', value: extractedData.fuelType },
                { label: 'Tank Size', value: extractedData.tankSizeGallons ? `${extractedData.tankSizeGallons} gal` : null },
                { label: 'Warranty', value: extractedData.currentWarranty },
                { label: 'Replacement Cost', value: extractedData.estimatedReplacementCost ? `$${extractedData.estimatedReplacementCost.toLocaleString()} installed` : null },
                { label: 'Confidence', value: `${(confidence * 100).toFixed(0)}%` },
                { label: 'Processing', value: processingMethod === 'grok-vision' ? 'Grok Cloud' : 'On-Device' },
              ].filter(r => r.value).map((row) => (
                <div key={row.label} className="px-6 py-4 border-b border-white border-opacity-5">
                  <div className="text-white text-opacity-35 text-xs font-light mb-1">{row.label}</div>
                  <div className={`text-sm font-light ${row.label === 'Replacement Cost' ? 'text-blue-accent font-medium' : 'text-white'}`}>
                    {row.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Manufacturer Service Reminder */}
          <div className="rounded-2xl border border-blue-accent border-opacity-20 bg-blue-accent bg-opacity-5 px-6 py-4 mb-5">
            <p className="text-white text-sm font-light leading-relaxed">
              <span className="text-blue-accent font-medium">Your manufacturer requires yearly professional service</span>
              {extractedData.fuelType === 'tankless' ? ' (tankless units often need two per year)' : ''}.
              {' '}Most homeowners have never done it once. You just checked — good move.
            </p>
          </div>

          {/* Rebate Maximizer */}
          <div className="mb-5">
            <RebateMaximizerCard rebateDoc={rebateDoc} brand={extractedData.brand} fuelType={extractedData.fuelType} />
          </div>

          {/* Viral CTA + PDF */}
          <div className="flex gap-4 mb-6">
            <InvitePlumberButton extractedData={extractedData} />
            <PDFReportGenerator extractedData={extractedData} imageBase64={scanResult.imageBase64 ?? undefined} />
          </div>

          {/* Social Share */}
          <div className="mb-6">
            <SocialShare extractedData={extractedData} />
          </div>

          {/* Shot 1 Observation Note */}
          {scanResult.shot1Note && (
            <div className="rounded-2xl border border-white border-opacity-8 bg-white bg-opacity-3 px-6 py-4 mb-5">
              <p className="text-white text-opacity-40 text-xs font-light leading-relaxed">
                <span className="text-white text-opacity-55 font-medium">AI observed: </span>
                {scanResult.shot1Note}
              </p>
            </div>
          )}

          {/* Email Capture */}
          <div className="mb-6">
            <EmailCapture extractedData={extractedData} />
          </div>

          {/* Docs */}
          {docs.length > 0 && (
            <div className="rounded-2xl border border-white border-opacity-8 overflow-hidden divide-y divide-white divide-opacity-5 mb-6">
              <div className="px-6 py-3 text-white text-opacity-30 text-xs font-light uppercase tracking-widest">Docs &amp; Links</div>
              {docs.map((doc, i) => (
                <div key={doc.type + i} className="flex items-center justify-between px-6 py-4">
                  <span className="text-white text-opacity-55 text-sm font-light">{doc.label}</span>
                  {doc.url ? (
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-accent text-sm font-light hover:underline">Open ↗</a>
                  ) : (
                    <a href={`https://www.google.com/search?q=${encodeURIComponent(doc.searchQuery || `${extractedData.brand} ${extractedData.model} ${doc.label}`)}`}
                      target="_blank" rel="noopener noreferrer" className="text-white text-opacity-30 text-sm font-light hover:text-opacity-60 transition-colors">Search ↗</a>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          {saveError && <div className="mb-4 px-4 py-3 rounded-2xl bg-red-500 bg-opacity-15 text-red-300 text-sm font-light">{saveError}</div>}
          <div className="flex gap-4">
            <button onClick={handleSaveToVault} disabled={isSaving}
              className="flex-1 py-3.5 rounded-full bg-white bg-opacity-10 text-white text-sm font-medium hover:bg-opacity-15 transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed">
              {isSaving ? 'Saving…' : 'Save to Vault'}
            </button>
            <button onClick={handleScanAnother}
              className="flex-1 py-3.5 rounded-full border border-white border-opacity-15 text-white text-opacity-60 text-sm font-light hover:border-opacity-30 hover:text-opacity-90 transition-all duration-200">
              Scan Another
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
