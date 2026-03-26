'use client'

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'

type Step = 'form' | 'screening' | 'approved' | 'denied' | 'success' | 'error'

interface ScreenResult {
  approved: boolean
  rating: number
  reviewCount: number
  sentiment: string
  redFlags: string[]
  businessName: string
  summary: string
}

interface BusinessSuggestion {
  title: string
  url: string
  snippet: string
  phone: string | null
  isGbp: boolean
  gbpUrl: string | null
}

const PRO_PROFILE_KEY = 'whv-pro-profile'

export default function ProOnboardPage() {
  const [step, setStep] = useState<Step>('form')
  const [gbpUrl, setGbpUrl] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [zip, setZip] = useState('')
  const [screenResult, setScreenResult] = useState<ScreenResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')

  // IP geo-detect
  const [detectedCity, setDetectedCity] = useState<string | null>(null)
  const [cityDismissed, setCityDismissed] = useState(false)

  // Business autocomplete
  const [suggestions, setSuggestions] = useState<BusinessSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const autocompleteDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  // ── On mount: check ?success=1 and IP detect ────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === '1') {
      setStep('success')
      return
    }

    fetch('/api/consumer/detect-location')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.postalCode) setZip(data.postalCode)
        if (data?.city) setDetectedCity(`${data.city}${data.region ? ', ' + data.region : ''}`)
      })
      .catch(() => { /* non-critical */ })
  }, [])

  // ── Business name autocomplete (debounced 350ms) ─────────────────────────
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) { setSuggestions([]); setShowSuggestions(false); return }
    setSuggestionsLoading(true)
    try {
      const res = await fetch(`/api/pro/search-business?q=${encodeURIComponent(query)}&zip=${encodeURIComponent(zip)}`)
      const data: BusinessSuggestion[] = res.ok ? await res.json() : []
      setSuggestions(data)
      setShowSuggestions(data.length > 0)
    } catch {
      setSuggestions([])
    } finally {
      setSuggestionsLoading(false)
    }
  }, [zip])

  useEffect(() => {
    if (autocompleteDebounce.current) clearTimeout(autocompleteDebounce.current)
    autocompleteDebounce.current = setTimeout(() => fetchSuggestions(name), 350)
    return () => { if (autocompleteDebounce.current) clearTimeout(autocompleteDebounce.current) }
  }, [name, fetchSuggestions])

  const applyAutoFill = (s: BusinessSuggestion) => {
    setName(s.title)
    if (s.phone) setPhone(s.phone)
    if (s.gbpUrl) setGbpUrl(s.gbpUrl)
    setSuggestions([])
    setShowSuggestions(false)
    nameInputRef.current?.blur()
  }

  // ── Form submit ──────────────────────────────────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!gbpUrl.trim() || !name.trim() || !phone.trim() || !zip.trim()) return
    setStep('screening')

    try {
      const formData = new FormData()
      formData.append('mode', 'review-screen')
      formData.append('gbpUrl', gbpUrl.trim())
      formData.append('businessName', name.trim())

      const res = await fetch('/api/consumer/grok-scan', { method: 'POST', body: formData })
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
      // Persist profile so success page can offer JSON download
      const profile = { businessName: name, phone, zip, gbpUrl, rating: screenResult?.rating, billingCycle, screenedAt: new Date().toISOString() }
      sessionStorage.setItem(PRO_PROFILE_KEY, JSON.stringify(profile))

      const res = await fetch('/api/pro/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      if (!res.ok) throw new Error('Checkout failed')
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not start checkout. Please try again.')
      setStep('error')
    }
  }

  const handleDownloadProfile = () => {
    const raw = sessionStorage.getItem(PRO_PROFILE_KEY)
    if (!raw) return
    const blob = new Blob([raw], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `WaterHeaterVault_Pro_Profile.json`
    a.click()
    URL.revokeObjectURL(url)
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
                Get your name and number on every water heater scan in your area. Auto-leads when heaters are in the danger zone. $49/mo — no contracts.
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
              {/* ZIP first — drives accurate autocomplete */}
              <div>
                <label className="block text-white text-opacity-50 text-xs font-light uppercase tracking-wider mb-2">
                  Service Zip Code
                  {detectedCity && zip && <span className="ml-2 text-blue-accent text-opacity-60 normal-case tracking-normal font-light">auto-filled — correct if wrong</span>}
                </label>
                <input
                  type="text"
                  value={zip}
                  onChange={e => setZip(e.target.value)}
                  placeholder="22401"
                  required
                  maxLength={5}
                  autoFocus
                  className="w-full rounded-full border border-white border-opacity-15 bg-transparent px-5 py-3.5 text-white text-sm placeholder:text-white placeholder:text-opacity-25 focus:outline-none focus:border-blue-accent transition-colors"
                />
              </div>

              {/* Business name with autocomplete — uses typed zip for location accuracy */}
              <div className="relative">
                <label className="block text-white text-opacity-50 text-xs font-light uppercase tracking-wider mb-2">
                  Business Name
                  {suggestionsLoading && <span className="ml-2 text-white text-opacity-25 normal-case tracking-normal">searching…</span>}
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={name}
                  onChange={e => { setName(e.target.value); setShowSuggestions(true) }}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  placeholder="Acme Plumbing & Heating"
                  required
                  autoComplete="off"
                  disabled={zip.length < 5}
                  className="w-full rounded-full border border-white border-opacity-15 bg-transparent px-5 py-3.5 text-white text-sm placeholder:text-white placeholder:text-opacity-25 focus:outline-none focus:border-blue-accent transition-colors disabled:opacity-40"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-2xl border border-white border-opacity-10 bg-black shadow-2xl overflow-hidden">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onMouseDown={() => applyAutoFill(s)}
                        className="w-full text-left px-5 py-3.5 hover:bg-white hover:bg-opacity-5 border-b border-white border-opacity-5 last:border-0 transition-colors"
                      >
                        <div className="text-white text-sm font-medium truncate">{s.title}</div>
                        {(s.phone || s.isGbp) && (
                          <div className="flex gap-3 mt-0.5">
                            {s.phone && <span className="text-blue-accent text-xs font-light">{s.phone}</span>}
                            {s.isGbp && <span className="text-green-400 text-xs font-light">✓ Google listing</span>}
                          </div>
                        )}
                      </button>
                    ))}
                    <div className="px-5 py-2 text-white text-opacity-20 text-xs font-light">Tap a result to auto-fill</div>
                  </div>
                )}
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
                  <div className="font-medium text-lg">$49</div>
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
                  <div className="font-medium text-lg">$499</div>
                  <div className="text-sm font-light text-opacity-60">per year</div>
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-green-500 text-black text-xs font-medium px-2 py-0.5 rounded-full">
                    Save $89
                  </div>
                </button>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full py-4 px-8 bg-blue-accent text-white rounded-full font-medium text-base hover:bg-opacity-90 active:scale-[0.97] transition-all"
            >
              {billingCycle === 'annual' ? 'Start for $499/yr →' : 'Start for $49/mo →'}
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

        {/* ── STEP: SUCCESS (post-Stripe ?success=1) ── */}
        {step === 'success' && (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-green-500 bg-opacity-15 border border-green-500 border-opacity-30 flex items-center justify-center mx-auto mb-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 className="text-white text-2xl font-light mb-3">You're in.</h2>
            <p className="text-white text-opacity-50 text-base font-light mb-8 max-w-sm mx-auto">
              Your branding is activating across scans in your zip. You'll get a notification when a heater in your area hits critical age.
            </p>
            <div className="rounded-2xl border border-white border-opacity-8 bg-white bg-opacity-[0.02] p-6 text-left space-y-3 mb-8">
              {[
                { icon: '📍', text: 'White-label branding active on local scans' },
                { icon: '⚡', text: 'Auto-leads enabled for critical age heaters' },
                { icon: '🌐', text: 'Directory listing published' },
                { icon: '🔄', text: 'Monthly re-screen scheduled' },
              ].map(item => (
                <div key={item.icon} className="flex items-center gap-3">
                  <span className="text-base">{item.icon}</span>
                  <span className="text-white text-opacity-55 text-sm font-light">{item.text}</span>
                </div>
              ))}
            </div>
            <button
              onClick={handleDownloadProfile}
              className="w-full py-4 px-8 border border-white border-opacity-15 text-white text-opacity-60 rounded-full font-light text-sm hover:border-opacity-25 hover:text-opacity-80 active:scale-[0.97] transition-all"
            >
              ↓ Download my business profile as JSON
            </button>
            <p className="text-white text-opacity-20 text-xs font-light mt-3">
              Local backup of your Pro profile
            </p>
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
