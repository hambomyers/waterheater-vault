'use client'

import { useState } from 'react'
import { ExtractedData } from '../../brain/on-device'

interface InvitePlumberButtonProps {
  extractedData?: ExtractedData
  className?: string
}

export default function InvitePlumberButton({ extractedData, className = '' }: InvitePlumberButtonProps) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'shared'>('idle')

  const buildSharePayload = () => {
    const brand = extractedData?.brand && extractedData.brand !== 'Unknown' ? extractedData.brand : 'water heater'
    const age = extractedData?.ageYears && extractedData.ageYears > 0 ? `, ${extractedData.ageYears} years old` : ''
    const remaining = extractedData?.remainingLifeYears != null && extractedData.remainingLifeYears > 0
      ? ` (~${extractedData.remainingLifeYears} yrs left)`
      : ''

    const p = new URLSearchParams()
    p.set('ref', 'plumber-invite')
    if (extractedData?.brand && extractedData.brand !== 'Unknown') p.set('brand', extractedData.brand)
    if (extractedData?.model && extractedData.model !== 'Unknown') p.set('model', extractedData.model)
    if (extractedData?.ageYears && extractedData.ageYears > 0) p.set('age', String(extractedData.ageYears))
    if (extractedData?.remainingLifeYears != null) p.set('remaining', String(extractedData.remainingLifeYears))
    const url = `https://waterheaterplan.com/pro?${p.toString()}`

    const text = `Hey! I just scanned my ${brand}${age}${remaining} with an AI water heater scanner — thought you'd want the report and stay in the loop on service timing. The manufacturer recommends yearly service. Here's the info:\n\n${url}\n\n(There's also a spot to get your name on scans in your area if you're interested.)`

    return { text, url }
  }

  const handleInvite = async () => {
    const { text, url } = buildSharePayload()

    if (navigator.share) {
      try {
        await navigator.share({ text })
        setStatus('shared')
        setTimeout(() => setStatus('idle'), 3000)
      } catch {
        await copyToClipboard(text)
      }
    } else {
      await copyToClipboard(url)
    }
  }

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setStatus('copied')
      setTimeout(() => setStatus('idle'), 3000)
    } catch {
      window.open('https://waterheaterplan.com/pro?ref=plumber-invite', '_blank')
    }
  }

  const label =
    status === 'copied' ? '✓ Copied — paste into your text app' :
    status === 'shared' ? '✓ Sent!' :
    'Text my plumber this report'

  return (
    <button
      onClick={handleInvite}
      className={`flex items-center justify-center gap-2 w-full py-4 px-8 bg-blue-accent text-white rounded-full font-medium text-base active:scale-[0.97] transition-all duration-200 ${
        status !== 'idle' ? 'opacity-80' : 'hover:bg-opacity-90'
      } ${className}`}
    >
      {status === 'idle' && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
          <polyline points="16 6 12 2 8 6"/>
          <line x1="12" y1="2" x2="12" y2="15"/>
        </svg>
      )}
      <span>{label}</span>
    </button>
  )
}
