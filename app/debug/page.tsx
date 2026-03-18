'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { brainRouter } from '../../brain/router'
import { privateVault } from '../../vault/private'

type TestStep =
  | 'idle'
  | 'on-device-running'
  | 'on-device-done'
  | 'grok-running'
  | 'grok-done'
  | 'saving'
  | 'saved'
  | 'error'

interface StepLog {
  step: string
  status: 'ok' | 'fail' | 'info'
  detail: string
  ms?: number
}

export default function DebugPage() {
  const [testStep, setTestStep] = useState<TestStep>('idle')
  const [logs, setLogs] = useState<StepLog[]>([])
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [vaultCount, setVaultCount] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const blobRef = useRef<Blob | null>(null)

  const addLog = (step: string, status: StepLog['status'], detail: string, ms?: number) => {
    setLogs((prev) => [...prev, { step, status, detail, ms }])
  }

  const clearLogs = () => {
    setLogs([])
    setCapturedImage(null)
    blobRef.current = null
    setTestStep('idle')
    setVaultCount(null)
  }

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      addLog('File', 'fail', 'Not an image file')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setCapturedImage(dataUrl)
      addLog('Image loaded', 'ok', `${file.name} (${(file.size / 1024).toFixed(0)} KB, ${file.type})`)
    }
    reader.readAsDataURL(file)
    blobRef.current = file
  }

  const runFullTest = async () => {
    const blob = blobRef.current
    if (!blob) {
      addLog('Test', 'fail', 'No image selected. Choose an image first.')
      return
    }

    setLogs([])
    addLog('Test started', 'info', `Online: ${navigator.onLine}`)

    // Step 1: On-device extraction
    setTestStep('on-device-running')
    const t1 = Date.now()
    let preview: any = null
    try {
      preview = await brainRouter.extractOnDevicePreview(blob)
      const ms1 = Date.now() - t1
      setTestStep('on-device-done')
      addLog('On-device OCR', 'ok', `Product: "${preview.extractedData.product}" | Category: ${preview.categoryHint} | Date: ${preview.extractedData.purchaseDate || 'none'} | Confidence: ${(preview.confidence * 100).toFixed(0)}%`, ms1)
    } catch (err: any) {
      addLog('On-device OCR', 'fail', err.message || 'Failed')
      setTestStep('error')
      return
    }

    if (!navigator.onLine) {
      addLog('Cloud scan', 'info', 'Skipped — offline')
    } else {
      // Step 2: Grok cloud
      setTestStep('grok-running')
      const t2 = Date.now()
      try {
        const result = await brainRouter.processImage(blob, { useCloud: true, onDevicePreview: preview })
        const ms2 = Date.now() - t2
        setTestStep('grok-done')
        addLog('Grok cloud', 'ok', `Product: "${result.extractedData.product}" | Value: $${result.valuation.currentValue} | Confidence: ${(result.confidence * 100).toFixed(0)}% | Method: ${result.processingMethod}`, ms2)

        // Step 3: Save to vault
        setTestStep('saving')
        const t3 = Date.now()
        try {
          await privateVault.addItem({
            extractedData: result.extractedData,
            valuation: result.valuation,
            docs: result.docs,
            imageData: result.imageBase64,
            tags: ['debug-test'],
            notes: 'Saved from debug test page',
          })
          const ms3 = Date.now() - t3
          const stats = await privateVault.getStats()
          setVaultCount(stats.totalItems)
          setTestStep('saved')
          addLog('Vault save', 'ok', `Saved. Vault now has ${stats.totalItems} item(s).`, ms3)
        } catch (err: any) {
          addLog('Vault save', 'fail', err.message || 'IndexedDB write failed')
          setTestStep('error')
        }
      } catch (err: any) {
        addLog('Grok cloud', 'fail', err.message || 'Grok API call failed')
        setTestStep('error')
      }
    }

    addLog('Test complete', 'info', testStep === 'error' ? 'Finished with errors.' : 'All steps passed.')
  }

  const statusColor = (s: StepLog['status']) => {
    if (s === 'ok') return 'text-green-400'
    if (s === 'fail') return 'text-red-400'
    return 'text-white text-opacity-60'
  }

  const statusIcon = (s: StepLog['status']) => {
    if (s === 'ok') return '✓'
    if (s === 'fail') return '✗'
    return '·'
  }

  const isRunning = testStep === 'on-device-running' || testStep === 'grok-running' || testStep === 'saving'

  return (
    <div className="min-h-screen bg-black px-6 py-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/scan" className="flex items-center text-white text-opacity-60 hover:text-opacity-90 transition-all">
            <span className="text-lg mr-2">←</span>
            <span className="font-light">Back to Scan</span>
          </Link>
          <span className="text-white text-opacity-30 text-sm font-mono">debug</span>
        </div>

        <div>
          <h1 className="text-white text-2xl font-light mb-1">Test Scan</h1>
          <p className="text-white text-opacity-40 text-sm font-light">
            Runs the full flow: on-device OCR → Grok cloud → IndexedDB save
          </p>
        </div>

        {/* Status */}
        <div className="flex items-center gap-3">
          <span className={`text-sm font-medium ${navigator.onLine ? 'text-blue-accent' : 'text-yellow-400'}`}>
            {typeof navigator !== 'undefined' && navigator.onLine ? '● Online' : '● Offline'}
          </span>
          {vaultCount !== null && (
            <span className="text-white text-opacity-40 text-sm">
              Vault: {vaultCount} item(s)
            </span>
          )}
        </div>

        {/* Image picker */}
        <div>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="aspect-video rounded-2xl border-2 border-dashed border-white border-opacity-20 hover:border-opacity-40 bg-white bg-opacity-[0.02] flex items-center justify-center cursor-pointer transition-all overflow-hidden"
          >
            {capturedImage ? (
              <img src={capturedImage} alt="Test image" className="w-full h-full object-contain" />
            ) : (
              <div className="text-center">
                <div className="text-4xl mb-3">📄</div>
                <div className="text-white text-opacity-50 text-sm">Click to select test image</div>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }}
            className="hidden"
          />
        </div>

        {/* Run button */}
        <div className="flex gap-3">
          <button
            onClick={runFullTest}
            disabled={isRunning || !blobRef.current}
            className="flex-1 min-h-[52px] py-4 px-8 bg-blue-accent text-white rounded-full font-medium disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] focus:outline-none"
          >
            {isRunning ? (
              <span className="animate-pulse">
                {testStep === 'on-device-running' && 'Running on-device OCR…'}
                {testStep === 'grok-running' && 'Calling Grok…'}
                {testStep === 'saving' && 'Saving to vault…'}
              </span>
            ) : (
              'Run Full Test'
            )}
          </button>
          {logs.length > 0 && (
            <button
              onClick={clearLogs}
              className="min-h-[52px] py-4 px-6 border border-white border-opacity-20 text-white text-opacity-60 rounded-full font-light text-sm hover:border-opacity-40"
            >
              Clear
            </button>
          )}
        </div>

        {/* Log output */}
        {logs.length > 0 && (
          <div className="bg-white bg-opacity-[0.03] rounded-2xl border border-white border-opacity-10 p-5 space-y-3 font-mono text-sm">
            {logs.map((log, i) => (
              <div key={i} className="space-y-0.5">
                <div className="flex items-start gap-2">
                  <span className={`font-medium shrink-0 ${statusColor(log.status)}`}>
                    {statusIcon(log.status)} {log.step}
                    {log.ms !== undefined && (
                      <span className="text-white text-opacity-30 font-normal ml-2">{log.ms}ms</span>
                    )}
                  </span>
                </div>
                <div className="text-white text-opacity-50 text-xs pl-4 break-all leading-relaxed">
                  {log.detail}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick links */}
        <div className="flex gap-4 text-sm text-white text-opacity-30 font-light border-t border-white border-opacity-10 pt-6">
          <Link href="/" className="hover:text-opacity-60 transition-all">Home</Link>
          <Link href="/vault" className="hover:text-opacity-60 transition-all">Vault</Link>
          <Link href="/scan" className="hover:text-opacity-60 transition-all">Scan</Link>
        </div>
      </div>
    </div>
  )
}
