'use client'

import Link from 'next/link'
import Logo from './components/Logo'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black">

      {/* ── Mobile ── */}
      <div className="md:hidden min-h-screen flex flex-col items-center justify-center px-6">
        <div className="flex flex-col items-center space-y-8 max-w-sm w-full">

          {/* Logo + name + tagline */}
          <div className="flex flex-col items-center space-y-3">
            <Logo size={64} />
            <span className="text-white text-base font-medium tracking-[0.18em] select-none">
              WaterHeaterVault
            </span>
            <span className="text-white text-opacity-35 text-sm font-light">
              Know your water heater's age, warranty & recall status.
            </span>
          </div>

          {/* Scan */}
          <Link
            href="/scan"
            className="w-full max-w-xs py-5 px-10 bg-transparent border-2 border-blue-accent text-white rounded-full text-center font-medium text-lg transition-all duration-500 hover:bg-blue-accent hover:bg-opacity-8 hover:border-opacity-80 active:scale-95 focus:outline-none"
          >
            Scan Water Heater
          </Link>

          {/* Vault */}
          <Link
            href="/vault"
            className="w-full max-w-xs py-5 px-10 bg-transparent border-2 border-white border-opacity-20 text-white rounded-full text-center font-medium text-lg transition-all duration-500 hover:bg-white hover:bg-opacity-5 hover:border-opacity-40 active:scale-95 focus:outline-none"
          >
            Vault
          </Link>
        </div>
      </div>

      {/* ── Desktop ── */}
      <div className="hidden md:flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center text-center gap-9">
          <Logo size={72} />
          <div className="space-y-2">
            <div className="text-white text-2xl font-light tracking-[0.1em]">WaterHeaterVault</div>
            <div className="text-white text-opacity-35 text-base font-light">Know your water heater's age, warranty &amp; recall status.</div>
          </div>
          <Link
            href="/scan"
            className="px-10 py-3 rounded-full border border-blue-accent text-white text-sm font-medium hover:bg-blue-accent hover:bg-opacity-10 transition-all duration-200 focus:outline-none"
          >
            Scan Water Heater
          </Link>
          <Link
            href="/vault"
            className="text-white text-opacity-25 text-sm font-light hover:text-opacity-60 transition-colors duration-200"
          >
            View vault →
          </Link>
        </div>
      </div>
    </div>
  )
}
