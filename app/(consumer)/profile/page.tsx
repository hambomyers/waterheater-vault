'use client'

/**
 * Profile Page - Simple homeowner view
 * No jargon, no serial numbers on main screen
 * Big "Send to My Plumber" button as hero action
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { ScanResult } from '@/lib/vision/on-device-scanner'
import { buildSimpleProfile } from '@/lib/profile/profile-builder'
import type { SimpleProfile } from '@/lib/profile/profile-builder'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<SimpleProfile | null>(null)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)

  useEffect(() => {
    // Load scan result from session storage
    const stored = sessionStorage.getItem('scanResult')
    if (!stored) {
      router.push('/scan')
      return
    }

    const result: ScanResult = JSON.parse(stored)
    setScanResult(result)
    setProfile(buildSimpleProfile(result))
  }, [router])

  if (!profile || !scanResult) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[#0066ff]" />
      </div>
    )
  }

  const gaugeColor = {
    green: 'bg-green-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500'
  }[profile.remainingColor]

  return (
    <main className="min-h-screen bg-black px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <button
          onClick={() => router.push('/')}
          className="text-white/60 hover:text-white"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h1 className="text-lg font-light">Your Water Heater</h1>
        <div className="w-6" />
      </div>

      {/* Simple Profile Card */}
      <div className="mx-auto max-w-md">
        {/* Age */}
        <div className="mb-8 text-center">
          <p className="mb-2 text-sm font-light text-white/60">Age</p>
          <p className="text-3xl font-light">{profile.age}</p>
        </div>

        {/* Life Remaining Gauge */}
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-light text-white/60">Life Remaining</p>
            <p className="text-sm font-medium text-white">{profile.remaining}</p>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full ${gaugeColor} transition-all duration-500`}
              style={{
                width: `${Math.max(5, (scanResult.remainingYears / scanResult.expectedLifeYears) * 100)}%`
              }}
            />
          </div>
        </div>

        {/* Estimated Cost */}
        <div className="mb-8 text-center">
          <p className="mb-2 text-sm font-light text-white/60">Estimated Replacement</p>
          <p className="text-2xl font-light text-[#0066ff]">{profile.cost}</p>
        </div>

        {/* Recall Status */}
        <div className="mb-12 rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
          <p className="text-sm font-light text-white/80">{profile.recallStatus}</p>
        </div>

        {/* Danger Zone Alert */}
        {profile.isDangerZone && (
          <div className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
            <div className="mb-2 flex items-center justify-center">
              <svg className="h-5 w-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <p className="text-center text-sm font-light text-amber-200">
              Consider planning replacement soon
            </p>
          </div>
        )}

        {/* Hero Button: Send to My Plumber */}
        <Link
          href="/send-plumber"
          className="mb-4 block w-full rounded-full bg-[#0066ff] py-4 text-center text-lg font-medium text-white transition-transform hover:scale-105 active:scale-95"
        >
          Send to My Plumber
        </Link>

        {/* Secondary Actions */}
        <div className="space-y-3">
          <Link
            href="/profile/details"
            className="block w-full rounded-full border border-white/20 py-3 text-center text-sm font-light text-white/80 transition-colors hover:border-white/40 hover:text-white"
          >
            View Technical Details
          </Link>

          <button
            onClick={() => {
              // TODO: Implement save to vault
              alert('Save to vault feature coming soon')
            }}
            className="block w-full rounded-full border border-white/20 py-3 text-center text-sm font-light text-white/80 transition-colors hover:border-white/40 hover:text-white"
          >
            Save to Vault
          </button>
        </div>

        {/* Summary */}
        <div className="mt-8 text-center">
          <p className="text-sm font-light text-white/60">{profile.summary}</p>
        </div>
      </div>
    </main>
  )
}
