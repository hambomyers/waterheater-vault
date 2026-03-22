'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { brainRouter, OnDevicePreview } from '../../brain/router'

/**
 * Scan flow phases:
 *   idle        → Open Camera button shown
 *   camera-1    → Live viewfinder, floating Capture button
 *   scanning-1  → Tesseract OCR + optional Grok identify running on Shot 1
 *   guide       → Category identified — "Looks like a laptop, snap the bottom sticker"
 *   camera-2    → Live viewfinder for targeted close-up shot
 *   processing  → Both shots sent to Grok — animated progress bar shown
 */
type Phase =
  | 'idle'
  | 'camera-1'
  | 'scanning-1'
  | 'guide'
  | 'camera-2'
  | 'processing'

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
  const [shot1Url, setShot1Url] = useState<string | null>(null)
  const [onDevicePreview, setOnDevicePreview] = useState<OnDevicePreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [isDragging, setIsDragging] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const shot1BlobRef = useRef<Blob | null>(null)
  const shot2BlobRef = useRef<Blob | null>(null)
  const filePickerShotRef = useRef<1 | 2>(1)
  // Track phase + active shot in refs so orientation listener can read them
  const phaseRef = useRef<Phase>('idle')
  const activeShotRef = useRef<1 | 2>(1)

  // Keep phaseRef in sync so the orientation listener can read it
  useEffect(() => { phaseRef.current = phase }, [phase])

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const up = () => setIsOnline(true)
    const dn = () => setIsOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', dn)

    // When the phone rotates while the camera is open, restart the stream
    // instead of losing it — keeps the scan flow uninterrupted
    const handleOrientationChange = () => {
      const p = phaseRef.current
      if (p === 'camera-1' || p === 'camera-2') {
        const shot = activeShotRef.current
        // Small delay to let the screen finish rotating before restarting
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
            .catch(() => {
              // Camera failed to restart after rotation — let user retry
            })
        }, 350)
      }
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

  const openCamera = async (forShot: 1 | 2) => {
    setError(null)
    activeShotRef.current = forShot
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      })
      streamRef.current = stream
      setPhase(forShot === 1 ? 'camera-1' : 'camera-2')
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream
      }, 50)
    } catch {
      filePickerShotRef.current = forShot
      fileInputRef.current?.click()
    }
  }

  const captureFromCamera = (forShot: 1 | 2) => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        stopCamera()
        if (forShot === 1) {
          shot1BlobRef.current = blob
          setShot1Url(URL.createObjectURL(blob))
          runOnDeviceExtraction(blob)
        } else {
          shot2BlobRef.current = blob
          processTwoShots()
        }
      },
      'image/jpeg',
      0.92
    )
  }

  // ── File import (desktop) ───────────────────────────────────────────────────

  const handleFileSelect = (file: File, forShot: 1 | 2) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, WebP)')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      if (forShot === 1) setShot1Url(dataUrl)
      fetch(dataUrl).then((r) => r.blob()).then((blob) => {
        if (forShot === 1) {
          shot1BlobRef.current = blob
          runOnDeviceExtraction(blob)
        } else {
          shot2BlobRef.current = blob
          processTwoShots()
        }
      })
    }
    reader.readAsDataURL(file)
  }

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }, [])
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false) }, [])
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file, filePickerShotRef.current)
  }, [])

  // ── Processing ──────────────────────────────────────────────────────────────

  const runOnDeviceExtraction = async (blob: Blob) => {
    setPhase('scanning-1')
    setError(null)
    try {
      const preview = await brainRouter.extractOnDevicePreview(blob)
      setOnDevicePreview(preview)
      setPhase('guide')
    } catch {
      setPhase('guide')
    }
  }

  const processTwoShots = async () => {
    const s1 = shot1BlobRef.current
    const s2 = shot2BlobRef.current
    if (!s1 || !s2) return

    stopCamera()
    setPhase('processing')
    setError(null)

    if (!isOnline) {
      // Offline: save on-device data from Shot 1 only
      try {
        const result = await brainRouter.processImage(s1, {
          useCloud: false,
          onDevicePreview: onDevicePreview ?? undefined,
        })
        sessionStorage.setItem('scan-result', JSON.stringify(result))
        window.location.href = '/results'
      } catch (err) {
        setError(err instanceof Error ? friendlyError(err.message) : 'Processing failed.')
        setPhase('guide')
      }
      return
    }

    try {
      const result = await brainRouter.processTwoShots(s1, s2, 'water heater')
      sessionStorage.setItem('scan-result', JSON.stringify(result))
      window.location.href = '/results'
    } catch (err) {
      const msg = err instanceof Error ? friendlyError(err.message) : 'Processing failed.'
      setError(msg)
      // Fall back to on-device if we have it
      if (onDevicePreview) {
        try {
          const fallback = await brainRouter.processImage(s1, { useCloud: false, onDevicePreview })
          sessionStorage.setItem('scan-result', JSON.stringify(fallback))
          window.location.href = '/results'
        } catch {
          setPhase('guide')
        }
      } else {
        setPhase('guide')
      }
    }
  }

  const handleReset = () => {
    stopCamera()
    setPhase('idle')
    setShot1Url(null)
    setOnDevicePreview(null)
    setError(null)
    shot1BlobRef.current = null
    shot2BlobRef.current = null
  }

  const cameraActive = phase === 'camera-1' || phase === 'camera-2'

  // ── UI ──────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black overflow-hidden">

      {/* Offline banner — fixed top, full width */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 bg-opacity-20 border-b border-yellow-500 border-opacity-40 px-4 py-2 text-center text-yellow-200 text-xs font-medium">
          Offline — basic extraction only. Connect for Grok accuracy + valuation.
        </div>
      )}

      {/* CAMERA — outside layout split so it stays visible in landscape (md:hidden would hide it) */}
      {cameraActive && (
        <div className="fixed inset-0 z-[60] bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
            <button
              onClick={handleReset}
              className="text-white text-opacity-70 font-light text-sm bg-black bg-opacity-40 px-4 py-2 rounded-full touch-manipulation"
            >
              Cancel
            </button>
            <span className="text-white text-opacity-60 text-xs font-light bg-black bg-opacity-40 px-3 py-1 rounded-full">
              {phase === 'camera-1' ? 'Shot 1 — Overview' : 'Shot 2 — Label Close-up'}
            </span>
          </div>
          <p className="absolute left-6 right-6 top-[max(4rem,calc(env(safe-area-inset-top)+3rem))] text-center text-white text-opacity-40 text-xs font-light">
            Any angle, upside down — just clear 🙂
          </p>
          {phase === 'camera-2' && (
            <div className="absolute left-4 right-4 bottom-36 bg-black bg-opacity-75 rounded-2xl p-4 text-center">
              <p className="text-white text-sm font-light">
                📍 <span className="font-medium">Find the silver data plate on the side or front of the tank.</span>
              </p>
            </div>
          )}
          <div
            className="absolute left-0 right-0 flex justify-center"
            style={{ bottom: 'max(2rem, calc(env(safe-area-inset-bottom) + 1.5rem))' }}
          >
            <button
              onClick={() => captureFromCamera(phase === 'camera-1' ? 1 : 2)}
              className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-2xl active:scale-95 focus:outline-none touch-manipulation"
              aria-label="Capture photo"
              style={{ zIndex: 30 }}
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
                <p className="text-white text-opacity-60 font-light text-sm mb-1">Step 1 of 2</p>
                <p className="text-white text-lg font-light">Snap an overview photo</p>
                <p className="text-white text-opacity-40 text-sm mt-2 font-light">
                  Any angle, upside down — just clear 🙂 We'll tell you what to snap next.
                </p>
              </div>
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={() => openCamera(1)}
                  className="w-full min-h-[56px] py-5 px-10 bg-blue-accent text-white rounded-full font-medium text-lg active:scale-[0.97] focus:outline-none touch-manipulation"
                >
                  Scan my water heater →
                </button>
                <button
                  onClick={() => { filePickerShotRef.current = 1; galleryInputRef.current?.click() }}
                  className="w-3/4 min-h-[44px] py-3 px-8 border border-white border-opacity-20 text-white text-opacity-40 rounded-full font-light text-sm active:scale-[0.97] focus:outline-none touch-manipulation"
                >
                  Photo Gallery
                </button>
              </div>
            </div>
          )}

          {/* SCANNING SHOT 1 */}
          {phase === 'scanning-1' && (
            <div className="text-center space-y-4">
              {shot1Url && (
                <div className="w-48 h-48 rounded-2xl overflow-hidden mx-auto">
                  <img src={shot1Url} alt="Shot 1" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="animate-pulse text-white text-opacity-60 font-light">
                Identifying product…
              </div>
            </div>
          )}

          {/* GUIDE — between Shot 1 and Shot 2 */}
          {phase === 'guide' && (
            <div className="w-full max-w-sm space-y-6">
              {/* Shot 1 thumbnail */}
              {shot1Url && (
                <div className="w-full aspect-video rounded-2xl overflow-hidden border border-white border-opacity-10">
                  <img src={shot1Url} alt="Overview" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Guided instruction card */}
              <div className="bg-white bg-opacity-5 rounded-2xl border border-white border-opacity-10 p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="text-white font-medium text-base">
                      Got it! Now snap the{' '}
                      <span className="text-blue-accent">data plate label</span>.
                    </p>
                    <p className="text-white text-opacity-60 font-light text-sm mt-1 leading-relaxed">
                      It's the silver sticker on the side or front of the tank — has brand, model, serial number, and manufacture date.
                    </p>
                  </div>
                </div>
                {onDevicePreview?.extractedData.brand &&
                  onDevicePreview.extractedData.brand !== 'Unknown' && (
                    <div className="flex gap-2 pt-1">
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-accent bg-opacity-20 text-blue-accent">
                        {onDevicePreview.extractedData.brand}
                      </span>
                    </div>
                  )}
                <div className="pt-1 border-t border-white border-opacity-8">
                  <p className="text-white text-opacity-35 text-xs font-light leading-relaxed">
                    <span className="text-white text-opacity-50">Can't find it?</span>{' '}
                    Try the top of the unit or look for a cardboard tag near the base.
                  </p>
                </div>
              </div>

              <div className="text-white text-opacity-40 text-xs text-center font-light">
                Step 2 of 2
              </div>
              <p className="text-white text-opacity-35 text-xs text-center font-light -mt-1">
                Any angle, upside down — just clear 🙂
              </p>

              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={() => openCamera(2)}
                  className="w-full min-h-[56px] py-5 px-10 bg-blue-accent text-white rounded-full font-medium text-lg active:scale-[0.97] focus:outline-none touch-manipulation"
                >
                  Scan the data plate →
                </button>
                <button
                  onClick={() => { filePickerShotRef.current = 2; galleryInputRef.current?.click() }}
                  className="w-3/4 min-h-[44px] py-3 px-8 border border-white border-opacity-20 text-white text-opacity-40 rounded-full font-light text-sm active:scale-[0.97] focus:outline-none touch-manipulation"
                >
                  Photo Gallery
                </button>
              </div>

              {!isOnline && (
                <button
                  onClick={async () => {
                    if (!shot1BlobRef.current) return
                    setPhase('processing')
                    try {
                      const result = await brainRouter.processImage(shot1BlobRef.current, {
                        useCloud: false,
                        onDevicePreview: onDevicePreview ?? undefined,
                      })
                      sessionStorage.setItem('scan-result', JSON.stringify(result))
                      window.location.href = '/results'
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Failed')
                      setPhase('guide')
                    }
                  }}
                  className="w-full min-h-[48px] py-4 border border-white border-opacity-20 text-white text-opacity-60 rounded-full font-light text-sm touch-manipulation"
                >
                  Save On-Device Data Only
                </button>
              )}

              <button
                onClick={handleReset}
                className="w-full min-h-[44px] py-3 text-white text-opacity-40 font-light text-sm touch-manipulation"
              >
                Start Over
              </button>
            </div>
          )}

          {/* PROCESSING */}
          {phase === 'processing' && (
            <div className="text-center space-y-8 w-full max-w-xs">
              {shot1Url && (
                <div className="w-24 h-24 rounded-xl overflow-hidden mx-auto opacity-50">
                  <img src={shot1Url} alt="Shot 1" className="w-full h-full object-cover" />
                </div>
              )}
              {/* Animated progress bar — fills in ~5s, then pulses */}
              <div className="space-y-3">
                <div className="relative w-full h-px bg-white bg-opacity-10 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-blue-accent rounded-full"
                    style={{ animation: 'scanProgress 5s cubic-bezier(0.4,0,0.6,1) forwards' }}
                  />
                </div>
                <p className="text-white text-opacity-35 text-xs font-light tracking-wide">
                  Analysing…
                </p>
              </div>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFileSelect(f, filePickerShotRef.current)
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
                <Link href="/vault" className="text-white text-opacity-40 hover:text-opacity-70 font-light text-sm transition-all">
                  Vault
                </Link>
                <Link href="/debug" className="text-white text-opacity-30 hover:text-opacity-60 font-light text-xs transition-all">
                  Debug
                </Link>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-500 bg-opacity-20 border border-red-500 border-opacity-30 text-red-200 text-sm leading-relaxed">
                {error}
              </div>
            )}

            {/* Step indicator */}
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 text-sm font-medium ${phase === 'idle' || phase === 'camera-1' || phase === 'scanning-1' ? 'text-blue-accent' : 'text-white text-opacity-40'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${phase === 'idle' || phase === 'camera-1' || phase === 'scanning-1' ? 'border-blue-accent bg-blue-accent bg-opacity-20' : 'border-white border-opacity-20'}`}>1</span>
                Overview photo
              </div>
              <div className="flex-1 h-px bg-white bg-opacity-10" />
              <div className={`flex items-center gap-2 text-sm font-medium ${phase === 'guide' || phase === 'camera-2' || phase === 'processing' ? 'text-blue-accent' : 'text-white text-opacity-40'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${phase === 'guide' || phase === 'camera-2' || phase === 'processing' ? 'border-blue-accent bg-blue-accent bg-opacity-20' : 'border-white border-opacity-20'}`}>2</span>
                Serial / label
              </div>
            </div>

            {/* Drop zone — adapts to phase */}
            {(phase === 'idle' || phase === 'guide' || phase === 'scanning-1') && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => {
                  filePickerShotRef.current = phase === 'guide' ? 2 : 1
                  fileInputRef.current?.click()
                }}
                className={`aspect-video rounded-3xl border-2 border-dashed transition-all flex items-center justify-center cursor-pointer ${
                  isDragging
                    ? 'border-blue-accent bg-blue-accent bg-opacity-5'
                    : 'border-white border-opacity-20 bg-white bg-opacity-[0.02] hover:border-opacity-40'
                }`}
              >
                {phase === 'scanning-1' ? (
                  <div className="text-center animate-pulse">
                    <div className="text-4xl mb-3">🔍</div>
                    <div className="text-white text-opacity-60 font-light">Identifying product…</div>
                  </div>
                ) : phase === 'guide' ? (
                  <div className="text-center p-8">
                    <div className="text-4xl mb-4">📍</div>
                    <div className="text-white text-lg font-light mb-2">Now drop the data plate photo (Shot 2)</div>
                    <div className="text-white text-opacity-40 text-sm">Drop Shot 2 here or click to browse</div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-5xl mb-4">{isDragging ? '📥' : '📄'}</div>
                    <div className="text-white text-lg font-light mb-2">
                      {isDragging ? 'Drop here' : 'Drop overview photo here'}
                    </div>
                    <div className="text-white text-opacity-40 text-sm">or click to browse</div>
                  </div>
                )}
              </div>
            )}

            {/* Guide card on desktop */}
            {phase === 'guide' && shot1Url && (
              <div className="bg-white bg-opacity-5 rounded-2xl border border-white border-opacity-10 p-6 flex gap-5 items-start">
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                  <img src={shot1Url} alt="Shot 1" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-white font-medium">
                    ✅ Got overview. Now snap the <span className="text-blue-accent">data plate</span>
                  </p>
                  <p className="text-white text-opacity-60 text-sm font-light mt-1">Silver sticker on the side or front of the tank — brand, model, serial, manufacture date.</p>
                </div>
              </div>
            )}

            {phase === 'processing' && (
              <div className="aspect-video rounded-3xl border border-white border-opacity-10 flex items-center justify-center animate-pulse">
                <div className="text-center">
                  <div className="text-4xl mb-4">🔍</div>
                  <div className="text-white text-opacity-60 font-light">Analysing water heater data…</div>
                  <div className="text-white text-opacity-30 text-sm mt-1">3–5 seconds</div>
                </div>
              </div>
            )}

            {(phase === 'guide' || phase === 'idle') && (
              <div className="flex gap-3">
                {phase === 'guide' && !isOnline && (
                  <button
                    onClick={async () => {
                      if (!shot1BlobRef.current) return
                      setPhase('processing')
                      const result = await brainRouter.processImage(shot1BlobRef.current, {
                        useCloud: false, onDevicePreview: onDevicePreview ?? undefined,
                      })
                      sessionStorage.setItem('scan-result', JSON.stringify(result))
                      window.location.href = '/results'
                    }}
                    className="flex-1 min-h-[48px] py-3 border border-white border-opacity-20 text-white text-opacity-60 rounded-full font-light text-sm hover:border-opacity-40"
                  >
                    Save On-Device Only
                  </button>
                )}
                {(phase === 'guide') && (
                  <button onClick={handleReset} className="py-3 px-6 text-white text-opacity-40 font-light text-sm hover:text-opacity-70">
                    Start Over
                  </button>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFileSelect(f, filePickerShotRef.current)
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
              <span className="text-blue-accent">precision scan</span>
            </h2>
            <p className="text-white text-opacity-40 font-light">
              Shot 1 — overview of the unit. Shot 2 — the silver data plate with serial number. Grok sees both for maximum accuracy.
            </p>
            <div className="space-y-4">
              <div className="bg-white bg-opacity-5 rounded-2xl border border-white border-opacity-10 p-5">
                <h4 className="text-white font-medium mb-1 text-sm">Connection</h4>
                <p className={`text-sm font-medium ${isOnline ? 'text-blue-accent' : 'text-yellow-400'}`}>
                  {isOnline ? '● Online — full Grok accuracy' : '● Offline — on-device only'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
