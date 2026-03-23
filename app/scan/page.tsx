'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { brainRouter } from '../../brain/router'

/**
 * Scan flow phases:
 *   idle       → Snap button shown
 *   camera-1   → Live viewfinder, capture button
 *   processing → Grok Vision running, auto-redirects to /results
 */
type Phase = 'idle' | 'camera-1' | 'processing'

function friendlyError(msg: string): string {
  if (msg.includes('401') || msg.toLowerCase().includes('api key'))
    return 'Cloud scan unavailable — API key issue. Saved on-device data.'
  if (msg.includes('429') || msg.toLowerCase().includes('rate limit'))
    return 'Rate limit reached. Wait a moment and try again.'
  if (msg.includes('404') || msg.toLowerCase().includes('model not found'))
    return 'Cloud model error. Saved on-device data.'
  if (msg.includes('413') || msg.toLowerCase().includes('too large'))
    return 'Image too large. Try a lower-resolution photo.'
  return msg
}

export default function ScanPage() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [shotUrl, setShotUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [isDragging, setIsDragging] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const shotBlobRef = useRef<Blob | null>(null)
  const phaseRef = useRef<Phase>('idle')

  useEffect(() => { phaseRef.current = phase }, [phase])

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const up = () => setIsOnline(true)
    const dn = () => setIsOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', dn)

    const handleOrientationChange = () => {
      if (phaseRef.current !== 'camera-1') return
      setTimeout(() => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop())
          streamRef.current = null
        }
        navigator.mediaDevices
          .getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } })
          .then((stream) => {
            streamRef.current = stream
            if (videoRef.current) videoRef.current.srcObject = stream
          })
          .catch(() => {})
      }, 350)
    }
    window.addEventListener('orientationchange', handleOrientationChange)
    screen.orientation?.addEventListener('change', handleOrientationChange)
    return () => {
      window.removeEventListener('online', up)
      window.removeEventListener('offline', dn)
      window.removeEventListener('orientationchange', handleOrientationChange)
      screen.orientation?.removeEventListener('change', handleOrientationChange)
      stopCamera()
    }
  }, [])

  // ── Camera helpers ──────────────────────────────────────────────────────────

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }

  const openCamera = async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      })
      streamRef.current = stream
      setPhase('camera-1')
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream
      }, 50)
    } catch {
      fileInputRef.current?.click()
    }
  }

  const captureFromCamera = () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const MAX_W = 1024
    const scale = Math.min(1, MAX_W / video.videoWidth)
    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (!blob) return
      stopCamera()
      shotBlobRef.current = blob
      setShotUrl(URL.createObjectURL(blob))
      runScan(blob)
    }, 'image/jpeg', 0.72)
  }

  // ── File import ─────────────────────────────────────────────────────────────

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, WebP)')
      return
    }
    const objectUrl = URL.createObjectURL(file)
    const img = new window.Image()
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const MAX_W = 1024
      const scale = Math.min(1, MAX_W / img.width)
      const cv = document.createElement('canvas')
      cv.width = Math.round(img.width * scale)
      cv.height = Math.round(img.height * scale)
      const ctx = cv.getContext('2d')
      if (!ctx) return
      ctx.drawImage(img, 0, 0, cv.width, cv.height)
      cv.toBlob((blob) => {
        if (!blob) return
        shotBlobRef.current = blob
        setShotUrl(URL.createObjectURL(blob))
        runScan(blob)
      }, 'image/jpeg', 0.72)
    }
    img.src = objectUrl
  }

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }, [])
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false) }, [])
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [])

  // ── Scan: Grok Vision fires immediately on capture, auto-redirects ──────────

  const runScan = async (blob: Blob) => {
    setPhase('processing')
    setError(null)
    try {
      const result = await brainRouter.processImage(blob, { useCloud: isOnline })
      sessionStorage.setItem('scan-result', JSON.stringify(result))
      window.location.href = '/results'
    } catch (err) {
      setError(err instanceof Error ? friendlyError(err.message) : 'Processing failed. Check connection and try again.')
      setPhase('idle')
    }
  }

  const handleReset = () => {
    stopCamera()
    setPhase('idle')
    setShotUrl(null)
    setError(null)
    shotBlobRef.current = null
  }

  const cameraActive = phase === 'camera-1'

  // ── UI ──────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black overflow-hidden">

      {/* Offline banner — fixed top, full width */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 bg-opacity-20 border-b border-yellow-500 border-opacity-40 px-4 py-2 text-center text-yellow-200 text-xs font-medium">
          Offline — basic extraction only. Connect for Grok accuracy + valuation.
        </div>
      )}

      {/* CAMERA */}
      {cameraActive && (
        <div className="fixed inset-0 z-[60] bg-black">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
            <button onClick={handleReset} className="text-white text-opacity-70 font-light text-sm bg-black bg-opacity-40 px-4 py-2 rounded-full touch-manipulation">
              Cancel
            </button>
            <span className="text-white text-opacity-60 text-xs font-light bg-black bg-opacity-40 px-3 py-1 rounded-full">
              Snap the data plate label
            </span>
          </div>
          <p className="absolute left-6 right-6 top-[max(4rem,calc(env(safe-area-inset-top)+3rem))] text-center text-white text-opacity-40 text-xs font-light">
            Any angle — just keep it in frame 🙂
          </p>
          <div className="absolute left-0 right-0 flex justify-center" style={{ bottom: 'max(2rem, calc(env(safe-area-inset-bottom) + 1.5rem))' }}>
            <button
              onClick={captureFromCamera}
              className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-2xl active:scale-95 focus:outline-none touch-manipulation"
              aria-label="Capture photo"
            >
              <div className="w-16 h-16 rounded-full bg-white border-4 border-gray-300" />
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════ MOBILE ════════════════════ */}
      <div className={`md:hidden flex flex-col min-h-screen ${!isOnline ? 'pt-8' : ''}`}>

        {/* ── Header: back + vault link (always visible, never conflicts with camera) ── */}
        {!cameraActive && (
          <div className="flex items-center justify-between px-6 pt-8 pb-4 shrink-0">
            <Link href="/" className="flex items-center text-white text-opacity-60 min-h-[44px] touch-manipulation">
              <span className="text-lg mr-2">←</span>
              <span className="font-light">Back</span>
            </Link>
            <Link href="/vault" className="text-white text-opacity-50 font-light text-sm min-h-[44px] flex items-center touch-manipulation">
              Vault
            </Link>
          </div>
        )}

        {/* ── Error banner ── */}
        {error && !cameraActive && (
          <div className="mx-6 mb-4 p-4 rounded-xl bg-red-500 bg-opacity-20 border border-red-500 border-opacity-30 text-red-200 text-sm leading-relaxed shrink-0">
            {error}
          </div>
        )}

        {/* ── Main content area ── */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-6">

          {/* IDLE */}
          {phase === 'idle' && (
            <div className="w-full max-w-sm space-y-8 text-center">
              <div>
                <p className="text-white text-opacity-60 font-light text-sm mb-1">Point at the data plate</p>
                <p className="text-white text-lg font-light">The silver sticker on the side of your tank</p>
                <p className="text-white text-opacity-40 text-sm mt-2 font-light">
                  Has brand, model, serial, and date — one shot, instant results.
                </p>
              </div>
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={openCamera}
                  className="w-full min-h-[56px] py-5 px-10 bg-blue-accent text-white rounded-full font-medium text-lg active:scale-[0.97] focus:outline-none touch-manipulation"
                >
                  Snap the data plate →
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-1/2 py-2.5 px-6 bg-blue-accent bg-opacity-70 text-white rounded-full font-light text-sm active:scale-[0.97] focus:outline-none touch-manipulation"
                >
                  Photo Gallery
                </button>
              </div>
            </div>
          )}

          {/* PROCESSING */}
          {phase === 'processing' && (
            <div className="text-center space-y-6 w-full max-w-xs">
              {shotUrl && (
                <div className="w-48 h-48 rounded-2xl overflow-hidden mx-auto">
                  <img src={shotUrl} alt="Label" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="space-y-3">
                <div className="relative w-full h-px bg-white bg-opacity-10 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-blue-accent rounded-full"
                    style={{ animation: 'scanProgress 5s cubic-bezier(0.4,0,0.6,1) forwards' }}
                  />
                </div>
                <p className="animate-pulse text-white text-opacity-50 text-sm font-light">
                  Analysing…
                </p>
              </div>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFileSelect(f)
            e.target.value = ''
          }}
          className="hidden"
        />
      </div>

      {/* ════════════════════ DESKTOP ════════════════════ */}
      <div className={`hidden md:flex min-h-screen ${!isOnline ? 'pt-8' : ''}`}>
        <div className="flex-1 flex flex-col justify-center items-center px-20 py-16">
          <div className="max-w-lg w-full space-y-8">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center text-white text-opacity-60 hover:text-opacity-90 transition-all">
                <span className="text-xl mr-3">←</span>
                <span className="font-light text-lg">Back</span>
              </Link>
              <div className="flex items-center gap-4">
                <Link href="/vault" className="text-white text-opacity-40 hover:text-opacity-70 font-light text-sm transition-all">Vault</Link>
                <Link href="/debug" className="text-white text-opacity-30 hover:text-opacity-60 font-light text-xs transition-all">Debug</Link>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-500 bg-opacity-20 border border-red-500 border-opacity-30 text-red-200 text-sm leading-relaxed">
                {error}
              </div>
            )}

            {/* Drop zone */}
            {phase === 'idle' && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`aspect-video rounded-3xl border-2 border-dashed transition-all flex items-center justify-center cursor-pointer ${
                  isDragging ? 'border-blue-accent bg-blue-accent bg-opacity-5' : 'border-white border-opacity-20 bg-white bg-opacity-[0.02] hover:border-opacity-40'
                }`}
              >
                <div className="text-center">
                    <div className="text-5xl mb-4">{isDragging ? '📥' : '📄'}</div>
                    <div className="text-white text-lg font-light mb-2">{isDragging ? 'Drop here' : 'Drop the data plate photo'}</div>
                    <div className="text-white text-opacity-40 text-sm">or click to browse</div>
                  </div>
              </div>
            )}

            {phase === 'processing' && (
              <div className="aspect-video rounded-3xl border border-white border-opacity-10 flex items-center justify-center">
                <div className="text-center animate-pulse">
                  <div className="text-4xl mb-4">🔍</div>
                  <div className="text-white text-opacity-60 font-light">Analysing…</div>
                  <div className="text-white text-opacity-30 text-sm mt-1">~2–5 seconds</div>
                </div>
              </div>
            )}

            {phase === 'idle' && (
              <button onClick={handleReset} className="py-3 px-6 text-white text-opacity-40 font-light text-sm hover:text-opacity-70">
                Reset
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFileSelect(f)
                e.target.value = ''
              }}
              className="hidden"
            />
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex flex-col justify-center px-20 py-16">
          <div className="max-w-md space-y-6">
            <h2 className="text-white text-4xl font-light">
              Water heater<br />
              <span className="text-blue-accent">instant scan</span>
            </h2>
            <p className="text-white text-opacity-40 font-light">
              One photo of the data plate label — brand, model, serial, age, cost. Done.
            </p>
            <div className="bg-white bg-opacity-5 rounded-2xl border border-white border-opacity-10 p-5">
              <h4 className="text-white font-medium mb-1 text-sm">Connection</h4>
              <p className={`text-sm font-medium ${isOnline ? 'text-blue-accent' : 'text-yellow-400'}`}>
                {isOnline ? '● Online — full accuracy' : '● Offline — on-device only'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
