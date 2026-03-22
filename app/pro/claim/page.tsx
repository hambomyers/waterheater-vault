'use client'
import { useState, FormEvent, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ClaimPageInner() {
  const params = useSearchParams()
  const brand = params.get('brand') || 'water heater'
  const model = params.get('model') || null
  const age = params.get('age') ? Number(params.get('age')) : null
  const remaining = params.get('remaining') ? Number(params.get('remaining')) : null
  const ref = params.get('ref') || null

  const [businessName, setBusinessName] = useState('')
  const [phone, setPhone] = useState('')
  const [zip, setZip] = useState('')
  const [gbpUrl, setGbpUrl] = useState('')
  const [smsConsent, setSmsConsent] = useState(false)
  const [step, setStep] = useState<'form' | 'loading' | 'success'>('form')
  const [error, setError] = useState('')

  const urgentLabel = remaining != null && remaining < 3 ? '⚠️ Replacement window open' :
                      age != null && age > 8 ? '⏱ Aging — service recommended' : null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!businessName.trim() || !phone.trim() || !zip.trim()) return
    setStep('loading')
    setError('')
    try {
      const res = await fetch('/api/pro/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: businessName.trim(),
          phone: phone.trim(),
          zip: zip.trim(),
          gbpUrl: gbpUrl.trim() || null,
          brand: brand !== 'water heater' ? brand : null,
          model,
          ageYears: age,
          remainingLifeYears: remaining,
          smsConsent,
          ref,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      setStep('success')
    } catch {
      setError('Something went wrong — please try again.')
      setStep('form')
    }
  }

  return (
    <div className="min-h-screen bg-black px-5 py-12 max-w-md mx-auto">

      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="text-white text-opacity-30 text-sm font-light">← waterheaterplan.com</Link>
      </div>

      {step !== 'success' ? (
        <>
          {/* Context card */}
          <div className="rounded-2xl border border-white border-opacity-10 bg-white bg-opacity-5 p-5 mb-8">
            <p className="text-white text-opacity-40 text-xs font-light uppercase tracking-widest mb-3">Report shared with you</p>
            <p className="text-white text-lg font-light mb-1">
              {brand}{model && model !== 'Unknown' ? ` ${model}` : ''}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {age != null && age > 0 && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-white bg-opacity-8 text-white text-opacity-50 font-light">{age} years old</span>
              )}
              {remaining != null && remaining > 0 && (
                <span className={`text-xs px-2.5 py-1 rounded-full font-light ${
                  remaining < 3 ? 'bg-red-500 bg-opacity-20 text-red-400' :
                  remaining < 5 ? 'bg-amber-500 bg-opacity-20 text-amber-400' :
                  'bg-green-500 bg-opacity-20 text-green-400'
                }`}>~{remaining} yrs left</span>
              )}
              {urgentLabel && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500 bg-opacity-15 text-blue-400 font-light">{urgentLabel}</span>
              )}
            </div>
          </div>

          {/* Pitch */}
          <div className="mb-8">
            <h1 className="text-white text-2xl font-light mb-3">Claim this unit — free</h1>
            <p className="text-white text-opacity-50 text-sm font-light leading-relaxed">
              Stay in the loop on service timing. We'll send you annual reminders before this heater needs attention — and when the replacement window opens, you get first notice.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              placeholder="Business name *"
              required
              className="w-full rounded-full border border-white border-opacity-20 bg-transparent px-4 py-3 text-white text-sm placeholder:text-white placeholder:text-opacity-30 focus:outline-none focus:border-blue-accent"
            />
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="Your mobile number *"
              required
              className="w-full rounded-full border border-white border-opacity-20 bg-transparent px-4 py-3 text-white text-sm placeholder:text-white placeholder:text-opacity-30 focus:outline-none focus:border-blue-accent"
            />
            <input
              type="text"
              value={zip}
              onChange={e => setZip(e.target.value)}
              placeholder="Your service zip code *"
              required
              className="w-full rounded-full border border-white border-opacity-20 bg-transparent px-4 py-3 text-white text-sm placeholder:text-white placeholder:text-opacity-30 focus:outline-none focus:border-blue-accent"
            />
            <input
              type="url"
              value={gbpUrl}
              onChange={e => setGbpUrl(e.target.value)}
              placeholder="Google Business Profile URL (optional)"
              className="w-full rounded-full border border-white border-opacity-20 bg-transparent px-4 py-3 text-white text-sm placeholder:text-white placeholder:text-opacity-30 focus:outline-none focus:border-blue-accent"
            />

            <label className="flex items-start gap-2.5 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={smsConsent}
                onChange={e => setSmsConsent(e.target.checked)}
                className="mt-0.5 accent-blue-500 w-4 h-4 shrink-0"
              />
              <span className="text-white text-opacity-35 text-xs font-light leading-relaxed">
                Text me when this heater needs service — I consent to receive automated reminder texts from WaterHeaterPlan. Msg &amp; data rates may apply. Reply STOP anytime.
              </span>
            </label>

            {error && <p className="text-red-300 text-sm font-light">{error}</p>}

            <button
              type="submit"
              disabled={step === 'loading'}
              className="w-full mt-2 py-4 px-8 bg-blue-accent text-white rounded-full font-medium text-base active:scale-[0.97] disabled:opacity-60 touch-manipulation"
            >
              {step === 'loading' ? 'Saving…' : 'Claim this unit — free →'}
            </button>
            <p className="text-white text-opacity-20 text-xs text-center font-light">No payment. No commitment. Cancel anytime.</p>
          </form>
        </>
      ) : (
        /* Success state */
        <div className="space-y-6">
          {/* Report card — what the homeowner already saw */}
          <div className="rounded-2xl border border-white border-opacity-10 bg-white bg-opacity-5 overflow-hidden">
            <div className="px-5 py-3 border-b border-white border-opacity-5">
              <span className="text-white text-opacity-40 text-xs font-light uppercase tracking-wider">Homeowner's scan report</span>
            </div>
            <div className="divide-y divide-white divide-opacity-5">
              <div className="flex justify-between items-center px-5 py-3.5">
                <span className="text-white text-opacity-50 text-sm font-light">Unit</span>
                <span className="text-white text-sm font-light">{brand}{model && model !== 'Unknown' ? ` ${model}` : ''}</span>
              </div>
              {age != null && age > 0 && (
                <div className="flex justify-between items-center px-5 py-3.5">
                  <span className="text-white text-opacity-50 text-sm font-light">Age</span>
                  <span className="text-white text-sm font-light">{age} years</span>
                </div>
              )}
              {remaining != null && (
                <div className="flex justify-between items-center px-5 py-3.5">
                  <span className="text-white text-opacity-50 text-sm font-light">Remaining life</span>
                  <span className={`text-sm font-medium ${remaining < 3 ? 'text-red-400' : remaining < 5 ? 'text-amber-400' : 'text-green-400'}`}>
                    ~{remaining} yr{remaining === 1 ? '' : 's'}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center px-5 py-3.5 bg-blue-accent bg-opacity-5">
                <span className="text-white text-sm font-light">Reminder opt-in</span>
                <span className="text-green-400 text-sm font-medium">✓ Opted in</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-green-500 border-opacity-30 bg-green-500 bg-opacity-8 px-5 py-4">
            <div className="text-green-400 font-medium text-sm mb-1">✓ You own this relationship</div>
            <div className="text-white text-opacity-50 text-sm font-light leading-relaxed">
              This homeowner has already opted in to service reminders. You'll get first notice when this {brand} needs attention{remaining != null && remaining < 3 ? ' — replacement window is open now' : age != null && age > 8 ? ' — service is overdue' : ''}.
            </div>
          </div>

          {/* Upsell */}
          <div className="rounded-2xl border border-white border-opacity-10 bg-white bg-opacity-5 p-6 space-y-4">
            <div>
              <p className="text-white text-opacity-40 text-xs font-light uppercase tracking-widest mb-2">Want more?</p>
              <h2 className="text-white text-xl font-light">Get leads from every scan in your zip</h2>
              <p className="text-white text-opacity-50 text-sm font-light leading-relaxed mt-2">
                For $49/mo your name and number appear on every water heater scan from homeowners in your service area — with auto-leads when a heater hits critical age.
              </p>
            </div>
            <div className="space-y-2 text-sm">
              {[
                'White-label branding on every scan result',
                'Auto-leads when heater age >8yr or <3yr left',
                'Listed on waterheaterplan.com/pro/directory',
                'AI-screened quality gate (4.5+ Google stars)',
              ].map(f => (
                <div key={f} className="flex items-start gap-2 text-white text-opacity-50 font-light">
                  <span className="text-blue-accent mt-0.5">✓</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>
            <Link
              href="/pro/onboard"
              className="block w-full text-center py-3.5 px-8 bg-blue-accent text-white rounded-full font-medium text-sm active:scale-[0.97]"
            >
              Join Pro — $49/mo →
            </Link>
            <p className="text-white text-opacity-20 text-xs text-center font-light">No contracts. Cancel anytime.</p>
          </div>

          <Link href="/" className="block text-center text-white text-opacity-25 text-sm font-light">
            ← Back to scanner
          </Link>
        </div>
      )}
    </div>
  )
}

export default function ClaimPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <ClaimPageInner />
    </Suspense>
  )
}
