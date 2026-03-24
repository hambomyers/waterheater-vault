'use client'

/**
 * Scan Page - Camera interface with on-device vision
 * Desktop: File upload
 * Mobile: Camera capture
 */

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { scanWaterHeater } from '@/lib/vision/on-device-scanner'
import type { ScanResult } from '@/lib/vision/on-device-scanner'

type ScanState = 'idle' | 'camera' | 'processing' | 'error'

export default function ScanPage() {
  const router = useRouter()
  const [state, setState] = useState<ScanState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Detect if mobile device
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      const mobile = /iphone|ipad|ipod|android|webos|blackberry|windows phone/i.test(userAgent)
      setIsMobile(mobile)
    }
    checkMobile()
  }, [])

  const startCamera = async () => {
    try {
      setState('camera')
      setError(null)

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch (err) {
      console.error('Camera error:', err)
      setError('Camera access denied. Please allow camera access and try again.')
      setState('error')
    }
  }

  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current) return

    setState('processing')

    try {
      // Capture frame from video
      const canvas = canvasRef.current
      const video = videoRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas context not available')

      ctx.drawImage(video, 0, 0)

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Failed to create blob'))),
          'image/jpeg',
          0.9
        )
      })

      // Stop camera
      stopCamera()

      // Scan with on-device vision
      const result = await scanWaterHeater(blob, {
        confidenceThreshold: 70,
        useFallback: true
      })

      // Store result and navigate to profile
      sessionStorage.setItem('scanResult', JSON.stringify(result))
      router.push('/profile')
    } catch (err) {
      console.error('Scan error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Scan failed. Please try again with better lighting.'
      setError(errorMessage)
      setState('error')
      stopCamera()
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }

  const retry = () => {
    setError(null)
    setState('idle')
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setState('processing')

    try {
      // Scan the uploaded file
      const result = await scanWaterHeater(file, {
        confidenceThreshold: 70,
        useFallback: true
      })

      // Store result and navigate to profile
      sessionStorage.setItem('scanResult', JSON.stringify(result))
      router.push('/profile')
    } catch (err) {
      console.error('Scan error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Scan failed. Please try again with a clearer photo.'
      setError(errorMessage)
      setState('error')
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-black">
      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <button
          onClick={() => {
            stopCamera()
            router.back()
          }}
          className="text-white/60 hover:text-white"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-light">Scan Water Heater</h1>
        <div className="w-6" />
      </div>

      {/* Camera View */}
      <div className="relative flex flex-1 items-center justify-center">
        {state === 'idle' && (
          <div className="text-center px-6">
            <div className="mb-8 flex justify-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-white/20">
                <svg className="h-12 w-12 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            <p className="mb-8 text-lg font-light text-white/80">
              {isMobile ? (
                <>
                  Point your camera at the
                  <br />
                  water heater data plate
                </>
              ) : (
                <>
                  Upload a photo of your
                  <br />
                  water heater data plate
                </>
              )}
            </p>
            {isMobile ? (
              <button
                onClick={startCamera}
                className="rounded-full bg-[#0066ff] px-8 py-3 font-medium text-white transition-transform hover:scale-105 active:scale-95"
              >
                Open Camera
              </button>
            ) : (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-full bg-[#0066ff] px-8 py-3 font-medium text-white transition-transform hover:scale-105 active:scale-95"
                >
                  Choose Photo
                </button>
              </>
            )}
          </div>
        )}

        {state === 'camera' && (
          <>
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Capture Button - Prominent and visible */}
            <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-3">
              <button
                onClick={captureAndScan}
                className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-white shadow-2xl transition-transform hover:scale-105 active:scale-95"
                aria-label="Capture photo"
              >
                <div className="h-16 w-16 rounded-full bg-[#0066ff]" />
              </button>
              <p className="text-sm font-medium text-white drop-shadow-lg">Tap to Capture</p>
            </div>

            {/* Guide Overlay */}
            <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 rounded-2xl border-2 border-white/40 p-4">
              <p className="text-center text-sm text-white/80">
                Center the data plate label
              </p>
            </div>
          </>
        )}

        {state === 'processing' && (
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-[#0066ff]" />
            </div>
            <p className="text-lg font-light text-white/80">
              Analyzing...
            </p>
          </div>
        )}

        {state === 'error' && (
          <div className="max-w-sm text-center">
            <div className="mb-4 flex justify-center">
              <svg className="h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="mb-6 text-lg font-light text-white/80">
              {error}
            </p>
            <button
              onClick={retry}
              className="rounded-full bg-[#0066ff] px-8 py-3 font-medium text-white transition-transform hover:scale-105 active:scale-95"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
