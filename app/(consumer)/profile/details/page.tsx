'use client'

/**
 * Profile Details Page - Rich technical view for plumbers
 * Full specifications, serial numbers, BTU ratings, etc.
 * Hidden from main homeowner view
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ScanResult } from '@/lib/vision/on-device-scanner'
import { buildRichProfile } from '@/lib/profile/profile-builder'
import type { RichProfile } from '@/lib/profile/profile-builder'

export default function ProfileDetailsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<RichProfile | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('scanResult')
    if (!stored) {
      router.push('/scan')
      return
    }

    const result: ScanResult = JSON.parse(stored)
    setProfile(buildRichProfile(result))
  }, [router])

  if (!profile) {
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
        <h1 className="text-lg font-light">Technical Details</h1>
        <div className="w-6" />
      </div>

      {/* Rich Technical Profile */}
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Basic Info */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-white/60">
            Basic Information
          </h2>
          <div className="space-y-3">
            <DetailRow label="Brand" value={profile.brand} />
            <DetailRow label="Model" value={profile.model} />
            <DetailRow label="Serial Number" value={profile.serial} mono />
            <DetailRow label="Manufacture Date" value={profile.manufactureDate} />
            <DetailRow label="Age" value={profile.ageYears} />
          </div>
        </section>

        {/* Specifications */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-white/60">
            Specifications
          </h2>
          <div className="space-y-3">
            <DetailRow label="Fuel Type" value={profile.fuelType} />
            <DetailRow label="Tank Size" value={profile.tankSizeDisplay} />
            {typeof profile.inputBTU === 'number' && !isNaN(profile.inputBTU) && (
              <DetailRow label="Input BTU" value={profile.inputBTU.toLocaleString()} />
            )}
            {typeof profile.inputWatts === 'number' && !isNaN(profile.inputWatts) && (
              <DetailRow label="Input Watts" value={profile.inputWatts.toLocaleString()} />
            )}
          </div>
        </section>

        {/* Life & Cost */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-white/60">
            Life & Cost Estimate
          </h2>
          <div className="space-y-3">
            <DetailRow label="Expected Life" value={`${profile.expectedLifeYears} years`} />
            <DetailRow label="Remaining Life" value={`${profile.remainingYears} years`} />
            <DetailRow label="Estimated Cost" value={profile.costRange} highlight />
            <DetailRow label="Warranty Status" value={profile.warrantyStatus} />
          </div>
        </section>

        {/* Installation Notes */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-white/60">
            Installation Notes
          </h2>
          <ul className="space-y-2">
            {profile.installationNotes.map((note, index) => (
              <li key={index} className="flex items-start text-sm text-white/80">
                <span className="mr-2 mt-1 text-[#0066ff]">•</span>
                <span className="font-light">{note}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Scan Metadata */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-white/60">
            Scan Information
          </h2>
          <div className="space-y-3">
            <DetailRow label="Processing Method" value={profile.processingMethod} />
            <DetailRow label="Confidence" value={`${profile.confidence}%`} />
          </div>
        </section>

        {/* Actions */}
        <div className="space-y-3 pt-4">
          <button
            onClick={() => router.push('/send-plumber')}
            className="w-full rounded-full bg-[#0066ff] py-4 text-center text-lg font-medium text-white transition-transform hover:scale-105 active:scale-95"
          >
            Send to My Plumber
          </button>

          <button
            onClick={() => {
              // Copy all details to clipboard
              const text = `
Water Heater Technical Details
==============================
Brand: ${profile.brand}
Model: ${profile.model}
Serial: ${profile.serial}
Manufacture Date: ${profile.manufactureDate}
Age: ${profile.ageYears}
Fuel Type: ${profile.fuelType}
Tank Size: ${profile.tankSizeDisplay}
Expected Life: ${profile.expectedLifeYears} years
Remaining Life: ${profile.remainingYears} years
Estimated Cost: ${profile.costRange}
Warranty: ${profile.warrantyStatus}
              `.trim()

              navigator.clipboard.writeText(text)
              alert('Details copied to clipboard')
            }}
            className="w-full rounded-full border border-white/20 py-3 text-center text-sm font-light text-white/80 transition-colors hover:border-white/40 hover:text-white"
          >
            Copy Details
          </button>
        </div>
      </div>
    </main>
  )
}

function DetailRow({
  label,
  value,
  mono = false,
  highlight = false
}: {
  label: string
  value: string | number
  mono?: boolean
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-light text-white/60">{label}</span>
      <span
        className={`text-sm ${mono ? 'font-mono' : 'font-light'} ${
          highlight ? 'text-[#0066ff]' : 'text-white'
        }`}
      >
        {value}
      </span>
    </div>
  )
}
