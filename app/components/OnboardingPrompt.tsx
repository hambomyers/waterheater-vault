'use client'

import { FormEvent, useState } from 'react'
import Logo from './Logo'
import { sendMagicLink, setCloudSyncMode, setLocalOnlyMode } from '../../lib/auth'

interface OnboardingPromptProps {
  onDone: () => void
}

export default function OnboardingPrompt({ onDone }: OnboardingPromptProps) {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSend = async (event: FormEvent) => {
    event.preventDefault()
    if (!email.trim()) return
    setSending(true)
    setError(null)
    try {
      await sendMagicLink(email.trim())
      setCloudSyncMode()
      setMessage('Magic link sent. Check your inbox to finish sign in.')
      onDone()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send magic link.'
      setError(msg)
    } finally {
      setSending(false)
    }
  }

  const handleSkip = () => {
    setLocalOnlyMode()
    onDone()
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-white border-opacity-10 bg-white bg-opacity-[0.03] p-6 md:p-8">
        <div className="flex flex-col items-center text-center gap-4">
          <Logo size={64} />
          <h1 className="text-white text-2xl font-light tracking-wide">WarrantyFile</h1>
          <p className="text-white text-opacity-70 font-light leading-relaxed">
            Keep warranties, manuals, and receipts in one private vault.
            <br />
            Sign in once to sync across all your devices.
          </p>
        </div>

        <form onSubmit={handleSend} className="mt-8 space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="w-full rounded-full border border-white border-opacity-20 bg-transparent px-5 py-3 text-white placeholder:text-white placeholder:text-opacity-30 focus:outline-none focus:border-blue-accent"
            required
          />
          <button
            type="submit"
            disabled={sending}
            className="w-full rounded-full bg-blue-accent px-5 py-3 text-white font-medium disabled:opacity-60"
          >
            {sending ? 'Sending…' : 'Send magic link'}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center text-sm text-blue-300">{message}</p>
        )}
        {error && (
          <p className="mt-4 text-center text-sm text-red-300">{error}</p>
        )}

        <button
          onClick={handleSkip}
          className="mt-6 w-full text-center text-sm text-white text-opacity-50 hover:text-opacity-80"
        >
          Skip - keep on this device only
        </button>
      </div>
    </div>
  )
}
