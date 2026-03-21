'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'

type Step = 'form' | 'screening' | 'approved' | 'denied' | 'checkout' | 'error'

interface ScreenResult {
  approved: boolean
  rating: number
  reviewCount: number
  sentiment: string
  redFlags: string[]
  businessName: string
  summary: string
}

export default function ProOnboardPage() {
  const [step, setStep] = useState<Step>('form')
  const [gbpUrl, setGbpUrl] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [zip, setZip] = useState('')
  const [screenResult, setScreenResult] = useState<ScreenResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!gbpUrl.trim() || !name.trim() || !phone.trim() || !zip.trim()) return
    setStep('screening')

    try {
      const formData = new FormData()
      formData.append('mode', 'review-screen')
      formData.append('gbpUrl', gbpUrl.trim())
      formData.append('businessName', name.trim())

      const res = await fetch('/api/grok-scan', { method: 'POST', body: formData })
      if (!res.ok) throw new Error(`Screening failed (${res.status})`)
      const data = await res.json()

      if (data.error) throw new Error(data.message || data.error)

      const result: ScreenResult = {
        approved: data.approved ?? false,
        rating: data.rating ?? 0,
        reviewCount: data.reviewCount ?? 0,
        sentiment: data.sentiment ?? 'unknown',
        redFlags: data.redFlags ?? [],
        businessName: data.businessName || name,
        summary: data.summary ?? '',
      }
      setScreenResult(result)
      setStep(result.approved ? 'approved' : 'denied')
    } catch (err: any) {
      setErrorMsg(err.message || 'Screening failed. Please try again.')
      setStep('error')
    }
  }

  const handleCheckout = async () => {
    try {
      const res = await fetch('/api/pro/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: name,
          phone,
          zip,
          gbpUrl,
          rating: screenResult?.rating,
          billingCycle,
        }),
      })
      if (!res.ok) throw new Error('Checkout failed')
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not start checkout. Please try again.')
      setStep('error')
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-lg mx-auto px-6 py-12 md:py-20">

        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-white text-opacity-30 hover:text-opacity-60 text-sm font-light transition-colors mb-10">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Home
        </Link>

        {/* ── STEP: FORM ── */}
        {step === 'form' && (
          <div>
            <div className="mb-10">
              <div className="text-white text-opacity-30 text-xs font-light uppercase tracking-widest mb-3">WaterHeaterVault Pro</div>
              <h1 className="text-white text-3xl font-light mb-3">Join as a Pro</h1>
              <p className="text-white text-opacity-50 text-base font-light leading-relaxed">
                Get your name and number on every water heater scan in your area. Auto-leads when heaters are in the danger zone. $29/mo — no contracts.
              </p>
            </div>

            {/* Value props */}
            <div className="rounded-2xl border border-white border-opacity-8 overflow-hidden divide-y divide-white divide-opacity-5 mb-8">
              {[
                { icon: '📍', title: 'White-label branding', desc: 'Your name + number on every scan & PDF in your zip.' },
                { icon: '⚡', title: 'Auto-leads', desc: 'We notify you when a heater hits critical age in your area.' },
                { icon: '🔎', title: 'Directory listing', desc: 'Listed on waterheaterplan.com/pro/directory — SEO traffic.' },
                { icon: '✅', title: 'AI-screened quality gate', desc: '4.5+ stars on Google required. We verify. Homeowners trust it.' },
              ].map(item => (
                <div key={item.title} className="flex items-start gap-4 px-5 py-4">
                  <span className="text-xl mt-0.5" aria-hidden="true">{item.icon}</span>
                  <div>
                    <div className="text-white font-medium text-sm">{item.title}</div>
                    <div className="text-white text-opacity-45 text-sm font-light mt-0.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white text-opacity-50 text-xs font-light uppercase tracking-wider mb-2">Business Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Acme Plumbing & Heating"
                  required
                  className="w-full rounded-full border border-white border-opacity-15 bg-transparent px-5 py-3.5 text-white text-sm placeholder:text-white placeholder:text-opacity-25 focus:outline-none focus:border-blue-accent transition-colors"
                />
              </div>
              <div>
                <label className="block text-white text-opacity-50 text-xs font-light uppercase tracking-wider mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="(555) 000-0000"
                  required
                  className="w-full rounded-full border border-white border-opacity-15 bg-transparent px-5 py-3.5 text-white text-sm placeholder:text-white placeholder:text-opacity-25 focus:outline-none focus:border-blue-accent transition-colors"
                />
              </div>
              <div>
                <label className="block text-white text-opacity-50 text-xs font-light uppercase tracking-wider mb-2">Service Zip Code</label>
                <input
                  type="text"
                  value={zip}
                  onChange={e => setZip(e.target.value)}
                  placeholder="22401"
                  required
                  maxLength={5}
                  className="w-full rounded-full border border-white border-opacity-15 bg-transparent px-5 py-3.5 text-white text-sm placeholder:text-white placeholder:text-opacity-25 focus:outline-none focus:border-blue-accent transition-colors"
                />
              </div>
              <div>
                <label className="block text-white text-opacity-50 text-xs font-light uppercase tracking-wider mb-2">
                  Google Business Profile URL
                  <span className="ml-2 text-white text-opacity-25 normal-case tracking-normal">(required for AI screening)</span>
                </label>
                <input
                  type="url"
                  value={gbpUrl}
                  onChange={e => setGbpUrl(e.target.value)}
                  placeholder="https://maps.google.com/maps?cid=…"
                  required
                  className="w-full rounded-full border border-white border-opacity-15 bg-transparent px-5 py-3.5 text-white text-sm placeholder:text-white placeholder:text-opacity-25 focus:outline-none focus:border-blue-accent transition-colors"
                />
                <p className="text-white text-opacity-25 text-xs font-light mt-2 px-2">
                  Open Google Maps → find your business → Share → Copy link
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-4 px-8 bg-blue-accent text-white rounded-full font-medium text-base hover:bg-opacity-90 active:scale-[0.97] transition-all mt-2"
              >
                Screen My Reviews →
              </button>
              <p className="text-white text-opacity-25 text-xs text-center font-light">
                Grok AI screens your Google reviews. Takes ~15 seconds. 4.5+ stars required.
              </p>
            </form>
          </div>
        )}

        {/* ── STEP: SCREENING ── */}
        {step === 'screening' && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <div className="w-12 h-12 rounded-full border-2 border-blue-accent border-t-transparent animate-spin mb-6" aria-hidden="true" />
            <h2 className="text-white text-2xl font-light mb-3">Screening your reviews…</h2>
            <p className="text-white text-opacity-40 text-sm font-light max-w-sm">
              Grok AI is analyzing your Google Business Profile — rating, sentiment, and red flags. Usually takes 10–20 seconds.
            </p>
          </div>
        )}

        {/* ── STEP: APPROVED ── */}
        {step === 'approved' && screenResult && (
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-green-500 bg-opacity-20 border border-green-500 border-opacity-40 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div>
                <div className="text-green-400 font-medium">AI Screening Passed</div>
                <div className="text-white text-opacity-40 text-sm font-light">{screenResult.businessName}</div>
              </div>
            </div>

            {/* Review summary */}
            <div className="rounded-2xl border border-white border-opacity-8 p-6 mb-8 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white text-opacity-35 text-xs font-light uppercase tracking-wider mb-1">Google Rating</div>
                  <div className="text-white text-2xl font-light">
                    {'★'.repeat(Math.round(screenResult.rating))}{'☆'.repeat(5 - Math.round(screenResult.rating))}
                    <span className="text-white text-opacity-60 text-base font-light ml-2">{screenResult.rating.toFixed(1)} / 5</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white text-opacity-35 text-xs font-light uppercase tracking-wider mb-1">Reviews</div>
                  <div className="text-white text-lg font-light">{screenResult.reviewCount}</div>
                </div>
              </div>
              {screenResult.summary && (
                <p className="text-white text-opacity-50 text-sm font-light border-t border-white border-opacity-8 pt-4">
                  {screenResult.summary}
                </p>
              )}
            </div>

            {/* Billing toggle */}
            <div className="mb-6">
              <div className="text-white text-opacity-35 text-xs font-light uppercase tracking-wider mb-3">Choose your plan</div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`py-4 rounded-2xl border text-center transition-all ${
                    billingCycle === 'monthly'
                      ? 'border-blue-accent bg-blue-accent bg-opacity-10 text-white'
                      : 'border-white border-opacity-10 text-white text-opacity-50 hover:border-opacity-20'
                  }`}
                >
                  <div className="font-medium text-lg">$29</div>
                  <div className="text-sm font-light text-opacity-60">per month</div>
                </button>
                <button
                  onClick={() => setBillingCycle('annual')}
                  className={`py-4 rounded-2xl border text-center transition-all relative ${
                    billingCycle === 'annual'
                      ? 'border-blue-accent bg-blue-accent bg-opacity-10 text-white'
                      : 'border-white border-opacity-10 text-white text-opacity-50 hover:border-opacity-20'
                  }`}
                >
                  <div className="font-medium text-lg">$299</div>
                  <div className="text-sm font-light text-opacity-60">per year</div>
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-green-500 text-black text-xs font-medium px-2 py-0.5 rounded-full">
                    Save $49
                  </div>
                </button>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full py-4 px-8 bg-blue-accent text-white rounded-full font-medium text-base hover:bg-opacity-90 active:scale-[0.97] transition-all"
            >
              {billingCycle === 'annual' ? 'Start for $299/yr →' : 'Start for $29/mo →'}
            </button>
            <p className="text-white text-opacity-25 text-xs text-center font-light mt-3">
              Cancel anytime. Re-screened monthly. Branding activates instantly.
            </p>
          </div>
        )}

        {/* ── STEP: DENIED ── */}
        {step === 'denied' && screenResult && (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-red-500 bg-opacity-15 border border-red-500 border-opacity-30 flex items-center justify-center mx-auto mb-6">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </div>
            <h2 className="text-white text-2xl font-light mb-3">Screening Not Passed</h2>
            <div className="text-white text-opacity-50 text-base font-light mb-2">
              Rating: {screenResult.rating.toFixed(1)} / 5 ({screenResult.reviewCount} reviews)
            </div>
            <p className="text-white text-opacity-40 text-sm font-light mb-6 max-w-sm mx-auto">
              WaterHeaterVault Pro requires a 4.5+ star Google rating. This protects homeowners and keeps the platform trusted.
            </p>
            {screenResult.redFlags.length > 0 && (
              <div className="rounded-2xl border border-red-500 border-opacity-20 bg-red-500 bg-opacity-5 p-5 text-left mb-6">
                <div className="text-red-400 text-xs font-medium uppercase tracking-wider mb-3">Issues found</div>
                <ul className="space-y-2">
                  {screenResult.redFlags.map((f, i) => (
                    <li key={i} className="text-white text-opacity-55 text-sm font-light flex items-start gap-2">
                      <span className="text-red-400 shrink-0">·</span>{f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-white text-opacity-30 text-sm font-light">
              Work on your reviews and apply again anytime.
            </p>
            <button
              onClick={() => { setStep('form'); setScreenResult(null) }}
              className="mt-6 px-6 py-2.5 rounded-full border border-white border-opacity-10 text-white text-opacity-40 text-sm font-light hover:border-opacity-20 hover:text-opacity-60 transition-all"
            >
              Try again
            </button>
          </div>
        )}

        {/* ── STEP: ERROR ── */}
        {step === 'error' && (
          <div className="text-center">
            <div className="text-white text-opacity-50 mb-4">⚠ {errorMsg}</div>
            <button
              onClick={() => setStep('form')}
              className="px-6 py-2.5 rounded-full border border-white border-opacity-10 text-white text-opacity-40 text-sm font-light hover:border-opacity-20 hover:text-opacity-60 transition-all"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
