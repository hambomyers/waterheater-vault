'use client'

/**
 * Consumer Home Page - Landing page with big Scan button
 * Tesla-sleek, minimal, clear value prop
 */

import Link from 'next/link'

export default function ConsumerHome() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="mb-12">
        <h1 className="text-4xl font-light tracking-tight">
          Water Heater Plan
        </h1>
        <div className="mt-2 h-px w-full bg-white/20" />
      </div>

      {/* Value Prop */}
      <div className="mb-12 max-w-md text-center">
        <p className="text-xl font-light text-white/90">
          Scan your water heater.
          <br />
          See how much life it has left.
          <br />
          Connect to a screened plumber.
        </p>
      </div>

      {/* Big Scan Button */}
      <Link
        href="/scan"
        className="group relative mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-[#0066ff] transition-transform hover:scale-105 active:scale-95"
      >
        <svg
          className="h-16 w-16 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </Link>

      <p className="mb-16 text-sm font-light text-white/60">
        Tap to scan
      </p>

      {/* Footer */}
      <div className="absolute bottom-8 text-center">
        <p className="mb-2 text-sm text-white/40">
          Free for homeowners, always
        </p>
        <Link
          href="/pro"
          className="text-sm text-white/60 underline decoration-white/20 underline-offset-4 hover:text-white/90"
        >
          Are you a plumber?
        </Link>
      </div>
    </main>
  )
}
