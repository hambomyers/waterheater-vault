'use client'

/**
 * Pro Landing Page - Plumber marketing
 * $49/mo for geofenced zones (max 3 plumbers per zone)
 */

import Link from 'next/link'

export default function ProPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="max-w-2xl text-center">
        <h1 className="mb-4 text-4xl font-light tracking-tight">
          For Plumbers
        </h1>
        <p className="mb-8 text-xl font-light text-white/80">
          $49/month for geofenced zone access.
          <br />
          Receive full technical profiles from every homeowner scan in your area.
        </p>
        <Link
          href="/pro/claim"
          className="inline-block rounded-full bg-[#0066ff] px-8 py-4 font-medium text-white transition-transform hover:scale-105 active:scale-95"
        >
          Claim Your Zone
        </Link>
      </div>
    </main>
  )
}
