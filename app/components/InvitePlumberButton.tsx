'use client'

import { useState } from 'react'
import { ExtractedData } from '../../brain/on-device'

interface InvitePlumberButtonProps {
  extractedData?: ExtractedData
  className?: string
}

export default function InvitePlumberButton({ extractedData, className = '' }: InvitePlumberButtonProps) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'shared'>('idle')

  const buildInviteUrl = () => {
    const base = 'https://waterheaterplan.com/pro/onboard'
    const p = new URLSearchParams()
    p.set('ref', 'invite')
    if (extractedData?.brand && extractedData.brand !== 'Unknown') p.set('brand', extractedData.brand)
    if (extractedData?.ageYears && extractedData.ageYears > 0) p.set('age', String(extractedData.ageYears))
    if (extractedData?.remainingLifeYears != null) p.set('remaining', String(extractedData.remainingLifeYears))
    return `${base}?${p.toString()}`
  }

  const buildShareText = () => {
    if (!extractedData) return 'I scanned my water heater with WaterHeaterVault — you should get your plumber listed on it. Free leads from homeowners.'
    const age = extractedData.ageYears > 0 ? `${extractedData.ageYears}-year-old ` : ''
    const brand = extractedData.brand !== 'Unknown' ? `${extractedData.brand} ` : ''
    return `I just scanned my ${age}${brand}water heater with WaterHeaterVault — get your name on reports like mine for $29/mo. Free leads from homeowners in your area.`
  }

  const handleInvite = async () => {
    const url = buildInviteUrl()
    const text = buildShareText()

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Join WaterHeaterVault Pro', text, url })
        setStatus('shared')
        setTimeout(() => setStatus('idle'), 3000)
      } catch {
        // User cancelled share — fallback to copy
        await copyToClipboard(url)
      }
    } else {
      await copyToClipboard(url)
    }
  }

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setStatus('copied')
      setTimeout(() => setStatus('idle'), 3000)
    } catch {
      // Last resort: open in new tab
      window.open(url, '_blank')
    }
  }

  const label =
    status === 'copied' ? '✓ Link copied — send it to your plumber' :
    status === 'shared' ? '✓ Sent!' :
    'Invite my plumber → get branded reports'

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
