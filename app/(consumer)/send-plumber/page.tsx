'use client'

/**
 * Send to My Plumber Page - Hero flow for connecting homeowners to plumbers
 * One-tap PDF + job ticket generation
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ScanResult } from '@/lib/vision/on-device-scanner'
import { buildJobTicket } from '@/lib/profile/profile-builder'
import { downloadJobTicket } from '@/lib/profile/job-ticket'
import type { JobTicketData } from '@/lib/profile/profile-builder'

type SendState = 'form' | 'sending' | 'sent' | 'error'

export default function SendPlumberPage() {
  const router = useRouter()
  const [state, setState] = useState<SendState>('form')
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [jobTicket, setJobTicket] = useState<JobTicketData | null>(null)
  
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [zip, setZip] = useState('')
  const [consent, setConsent] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('scanResult')
    if (!stored) {
      router.push('/scan')
      return
    }

    const result: ScanResult = JSON.parse(stored)
    setScanResult(result)
  }, [router])

  const handleSend = async () => {
    if (!scanResult || !consent) return

    setState('sending')

    try {
      // Build job ticket with customer info
      const ticket = buildJobTicket(scanResult, {
        email,
        phone,
        zip
      })
      
      setJobTicket(ticket)

      // Download job ticket files
      downloadJobTicket(ticket)

      // TODO: Send to matched plumber via API
      // For now, just simulate sending
      await new Promise(resolve => setTimeout(resolve, 1000))

      setState('sent')
    } catch (error) {
      console.error('Send failed:', error)
      setState('error')
    }
  }

  if (!scanResult) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[#0066ff]" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-black px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="text-white/60 hover:text-white"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-light">Send to Plumber</h1>
        <div className="w-6" />
      </div>

      <div className="mx-auto max-w-md">
        {state === 'form' && (
          <>
            {/* Info */}
            <div className="mb-8 text-center">
              <p className="mb-2 text-sm font-light text-white/80">
                We'll send your water heater profile to a screened local plumber
              </p>
              <p className="text-xs font-light text-white/60">
                They'll receive full technical details and can contact you directly
              </p>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-light text-white/60">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-[#0066ff] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-light text-white/60">
                  Phone (optional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-[#0066ff] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-light text-white/60">
                  Zip Code
                </label>
                <input
                  type="text"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  placeholder="12345"
                  maxLength={5}
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-[#0066ff] focus:outline-none"
                />
              </div>

              {/* TCPA Consent */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-1 mr-3 h-4 w-4 rounded border-white/20 bg-white/10 text-[#0066ff] focus:ring-[#0066ff]"
                  />
                  <span className="text-xs font-light text-white/80">
                    I consent to be contacted by Water Heater Plan and matched plumbers via email, phone, or SMS regarding my water heater service request. Standard message rates may apply. I understand I can opt out at any time.
                  </span>
                </label>
              </div>

              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={!email || !zip || !consent}
                className="w-full rounded-full bg-[#0066ff] py-4 text-center text-lg font-medium text-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
              >
                Send Profile
              </button>
            </div>
          </>
        )}

        {state === 'sending' && (
          <div className="py-16 text-center">
            <div className="mb-4 flex justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-[#0066ff]" />
            </div>
            <p className="text-lg font-light text-white/80">
              Sending to plumber...
            </p>
          </div>
        )}

        {state === 'sent' && (
          <div className="py-16 text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="mb-3 text-2xl font-light">Sent!</h2>
            <p className="mb-8 text-sm font-light text-white/80">
              A screened local plumber will contact you soon.
              <br />
              Job ticket files have been downloaded.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/')}
                className="w-full rounded-full bg-[#0066ff] py-3 text-center font-medium text-white transition-transform hover:scale-105 active:scale-95"
              >
                Done
              </button>
              <button
                onClick={() => router.push('/profile')}
                className="w-full rounded-full border border-white/20 py-3 text-center font-light text-white/80 transition-colors hover:border-white/40 hover:text-white"
              >
                Back to Profile
              </button>
            </div>
          </div>
        )}

        {state === 'error' && (
          <div className="py-16 text-center">
            <div className="mb-6 flex justify-center">
              <svg className="h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="mb-3 text-2xl font-light">Send Failed</h2>
            <p className="mb-8 text-sm font-light text-white/80">
              Something went wrong. Please try again.
            </p>
            <button
              onClick={() => setState('form')}
              className="w-full rounded-full bg-[#0066ff] py-3 text-center font-medium text-white transition-transform hover:scale-105 active:scale-95"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
