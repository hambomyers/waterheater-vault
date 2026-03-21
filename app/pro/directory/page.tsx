'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Pro {
  id: string
  businessName: string
  phone: string
  zip: string
  rating: number
  reviewCount: number
  active: boolean
}

export default function ProDirectoryPage() {
  const [pros, setPros] = useState<Pro[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/pro/directory')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: Pro[]) => { setPros(data); setLoading(false) })
      .catch(() => { setError('Could not load directory.'); setLoading(false) })
  }, [])

  const filtered = pros.filter(p => {
    const q = search.toLowerCase()
    return !q || p.businessName.toLowerCase().includes(q) || p.zip.includes(q)
  })

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-3xl mx-auto px-6 py-12 md:py-16">

        {/* Header */}
        <div className="mb-10">
          <div className="text-white text-opacity-30 text-xs font-light uppercase tracking-widest mb-3">WaterHeaterVault Pro</div>
          <h1 className="text-white text-3xl font-light mb-3">Screened Pro Directory</h1>
          <p className="text-white text-opacity-45 text-base font-light">
            Every pro is AI-screened for 4.5+ stars on Google. Re-verified monthly.
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or zip code…"
            className="w-full rounded-full border border-white border-opacity-15 bg-transparent px-5 py-3.5 text-white text-sm placeholder:text-white placeholder:text-opacity-30 focus:outline-none focus:border-blue-accent transition-colors"
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-blue-accent border-t-transparent animate-spin mb-4" aria-hidden="true" />
            <div className="text-white text-opacity-40 text-sm font-light">Loading directory…</div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="text-white text-opacity-40 text-center py-16 text-sm font-light">{error}</div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-white text-opacity-30 text-sm font-light mb-4">
              {search ? `No pros found matching "${search}"` : 'No pros listed yet.'}
            </div>
            <Link
              href="/pro/onboard"
              className="inline-flex px-6 py-3 rounded-full border border-blue-accent text-white text-sm font-medium hover:bg-blue-accent hover:bg-opacity-10 transition-all"
            >
              Be the first pro in your area →
            </Link>
          </div>
        )}

        {/* Pro list */}
        {!loading && !error && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map(pro => (
              <div
                key={pro.id}
                className="rounded-2xl border border-white border-opacity-8 p-6 flex items-center justify-between gap-4 hover:border-opacity-15 transition-all"
              >
                <div className="min-w-0">
                  <div className="text-white font-medium truncate">{pro.businessName}</div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-white text-opacity-40 text-sm font-light">
                      {'★'.repeat(Math.round(pro.rating))}
                      <span className="ml-1">{pro.rating.toFixed(1)}</span>
                      <span className="text-white text-opacity-25 ml-1">({pro.reviewCount})</span>
                    </span>
                    <span className="text-white text-opacity-20 text-sm font-light">·</span>
                    <span className="text-white text-opacity-40 text-sm font-light">Zip {pro.zip}</span>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500" title="AI-verified active" />
                  <a
                    href={`tel:${pro.phone}`}
                    className="px-5 py-2.5 rounded-full bg-blue-accent text-white text-sm font-medium hover:bg-opacity-90 transition-colors"
                  >
                    Call
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer CTA */}
        <div className="mt-16 pt-8 border-t border-white border-opacity-8 flex items-center justify-between">
          <p className="text-white text-opacity-25 text-sm font-light">
            Are you a plumber or HVAC tech?
          </p>
          <Link
            href="/pro/onboard"
            className="px-5 py-2.5 rounded-full border border-white border-opacity-10 text-white text-opacity-40 text-sm font-light hover:border-opacity-20 hover:text-opacity-60 transition-all"
          >
            Join as a Pro →
          </Link>
        </div>
      </div>
    </div>
  )
}
