'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface StatsData {
  zip: string
  thisWeek: number
  lastWeek: number
  criticalThisWeek: number
  recentScans: { brand: string; age_years: number; remaining_life_years: number; scanned_at: string }[]
}

function Trend({ now, prev }: { now: number; prev: number }) {
  if (prev === 0 && now === 0) return null
  if (prev === 0) return <span className="text-green-400 text-xs font-light">new ↑</span>
  const pct = Math.round(((now - prev) / prev) * 100)
  const up = pct >= 0
  return (
    <span className={`text-xs font-light ${up ? 'text-green-400' : 'text-red-400'}`}>
      {up ? '↑' : '↓'} {Math.abs(pct)}% vs last week
    </span>
  )
}

export default function ProDashboardPage() {
  const [zip, setZip] = useState('')
  const [inputZip, setInputZip] = useState('')
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('whv-dashboard-zip')
    if (saved) { setZip(saved); setInputZip(saved) }
  }, [])

  useEffect(() => {
    if (!zip) return
    setLoading(true)
    setError('')
    fetch(`/api/pro/stats?zip=${encodeURIComponent(zip)}`)
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(data => setStats(data))
      .catch(() => setError('Could not load stats. Check your zip or try again.'))
      .finally(() => setLoading(false))
  }, [zip])

  const handleZipSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const z = inputZip.trim()
    if (!z) return
    localStorage.setItem('whv-dashboard-zip', z)
    setZip(z)
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-lg mx-auto px-6 py-12 md:py-20">

        <Link href="/" className="inline-flex items-center gap-1.5 text-white text-opacity-30 hover:text-opacity-60 text-sm font-light transition-colors mb-10">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Home
        </Link>

        <div className="mb-8">
          <div className="text-white text-opacity-30 text-xs font-light uppercase tracking-widest mb-3">Pro Dashboard</div>
          <h1 className="text-white text-3xl font-light mb-2">Scans in your zip</h1>
          <p className="text-white text-opacity-40 text-sm font-light">Homeowners scanning in your service area — this week vs last.</p>
        </div>

        {/* Zip input */}
        <form onSubmit={handleZipSubmit} className="flex gap-2 mb-8">
          <input
            type="text"
            value={inputZip}
            onChange={e => setInputZip(e.target.value)}
            placeholder="Enter your service zip"
            maxLength={5}
            className="flex-1 rounded-full border border-white border-opacity-15 bg-transparent px-5 py-3 text-white text-sm placeholder:text-white placeholder:text-opacity-25 focus:outline-none focus:border-blue-accent transition-colors"
          />
          <button
            type="submit"
            className="rounded-full bg-blue-accent px-5 py-3 text-white text-sm font-medium hover:bg-opacity-90 transition-colors"
          >
            View →
          </button>
        </form>

        {loading && (
          <div className="flex items-center gap-3 text-white text-opacity-40 text-sm font-light py-8">
            <div className="w-4 h-4 rounded-full border border-blue-accent border-t-transparent animate-spin" />
            Loading…
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-500 border-opacity-20 bg-red-500 bg-opacity-5 px-5 py-4 text-red-300 text-sm font-light">
            {error}
          </div>
        )}

        {stats && !loading && (
          <div className="space-y-4">

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'This week', value: stats.thisWeek, sub: <Trend now={stats.thisWeek} prev={stats.lastWeek} /> },
                { label: 'Last week', value: stats.lastWeek, sub: <span className="text-white text-opacity-25 text-xs">baseline</span> },
                { label: 'Critical age', value: stats.criticalThisWeek, sub: <span className="text-red-400 text-xs font-light">{stats.criticalThisWeek > 0 ? '⚡ hot leads' : 'none this week'}</span> },
              ].map(card => (
                <div key={card.label} className="rounded-2xl border border-white border-opacity-8 bg-white bg-opacity-[0.02] p-4 text-center">
                  <div className="text-white text-2xl font-light mb-1">{card.value}</div>
                  <div className="text-white text-opacity-35 text-xs font-light mb-1">{card.label}</div>
                  {card.sub}
                </div>
              ))}
            </div>

            {/* Critical lead prompt */}
            {stats.criticalThisWeek > 0 && (
              <div className="rounded-2xl border border-red-500 border-opacity-25 bg-red-500 bg-opacity-5 px-5 py-4">
                <div className="text-red-400 font-medium text-sm mb-1">
                  ⚡ {stats.criticalThisWeek} critical heater{stats.criticalThisWeek > 1 ? 's' : ''} scanned in {stats.zip} this week
                </div>
                <div className="text-white text-opacity-45 text-sm font-light">
                  These homeowners have &lt;3 years of life remaining. They're in buying mode.
                </div>
              </div>
            )}

            {/* Recent scans */}
            {stats.recentScans.length > 0 && (
              <div className="rounded-2xl border border-white border-opacity-8 overflow-hidden divide-y divide-white divide-opacity-5">
                <div className="px-5 py-3 text-white text-opacity-30 text-xs font-light uppercase tracking-widest">
                  Recent scans in {stats.zip}
                </div>
                {stats.recentScans.map((s, i) => {
                  const isCritical = s.remaining_life_years <= 3
                  const date = new Date(s.scanned_at)
                  const ago = Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60))
                  const agoLabel = ago < 24 ? `${ago}h ago` : `${Math.round(ago / 24)}d ago`
                  return (
                    <div key={i} className="px-5 py-3.5 flex items-center justify-between">
                      <div>
                        <span className="text-white text-sm font-light">{s.brand || 'Unknown'}</span>
                        <span className="text-white text-opacity-35 text-sm font-light"> · {s.age_years} yr old</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {isCritical && <span className="text-red-400 text-xs">⚡ critical</span>}
                        <span className="text-white text-opacity-25 text-xs font-light">{agoLabel}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {stats.thisWeek === 0 && stats.lastWeek === 0 && (
              <div className="rounded-2xl border border-white border-opacity-8 bg-white bg-opacity-[0.02] px-5 py-8 text-center">
                <div className="text-white text-opacity-30 text-sm font-light mb-2">No scans yet in zip {stats.zip}</div>
                <div className="text-white text-opacity-20 text-xs font-light">Share your invite link to get homeowners scanning in your area.</div>
              </div>
            )}

            <div className="pt-2">
              <Link href="/pro/onboard" className="text-white text-opacity-25 text-xs font-light hover:text-opacity-50 transition-colors">
                Not a Pro yet? Join for $29/mo →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
