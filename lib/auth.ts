import { privateVault } from '../vault/private'

export interface AuthUser {
  id: string
  email: string
}

const ONBOARDING_SEEN_KEY = 'wf_onboarding_seen'
const SYNC_MODE_KEY = 'wf_sync_mode'

let currentUser: AuthUser | null = null
const listeners = new Set<(user: AuthUser | null) => void>()

function notify(user: AuthUser | null) {
  currentUser = user
  listeners.forEach((listener) => listener(user))
}

export function hasSeenOnboarding(): boolean {
  if (typeof window === 'undefined') return true
  return localStorage.getItem(ONBOARDING_SEEN_KEY) === '1'
}

export function markOnboardingSeen(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ONBOARDING_SEEN_KEY, '1')
}

export function setLocalOnlyMode(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SYNC_MODE_KEY, 'local-only')
  markOnboardingSeen()
}

export function setCloudSyncMode(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SYNC_MODE_KEY, 'cloud')
  markOnboardingSeen()
}

export function isLocalOnlyMode(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(SYNC_MODE_KEY) === 'local-only'
}

export async function sendMagicLink(email: string): Promise<void> {
  const response = await fetch('/api/auth/send-magic-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.message || 'Failed to send magic link.')
  }
}

export async function refreshAuthState(): Promise<AuthUser | null> {
  const response = await fetch('/api/auth/me', { credentials: 'include' })
  if (!response.ok) {
    notify(null)
    return null
  }
  const data = await response.json()
  const user = data?.user ?? null
  notify(user)
  return user
}

export function getCachedAuthUser(): AuthUser | null {
  return currentUser
}

export function subscribeAuth(listener: (user: AuthUser | null) => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export async function bootstrapAuthAndSync(): Promise<AuthUser | null> {
  const user = await refreshAuthState()
  if (user && !isLocalOnlyMode()) {
    await privateVault.mergeFromCloud()
    await privateVault.flushSyncQueue()
  }
  return user
}
