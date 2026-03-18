/**
 * CPSC recall checker — pure client-side module.
 *
 * Calls /api/recall-check (CF proxy) with brand + model,
 * then filters results using conservative two-field matching
 * to avoid false positive safety alerts.
 *
 * Conservative rule: brand must match AND model number must match.
 * Single-field matches are silently ignored.
 */

import { VaultItem, ActiveRecall } from '../vault/private'

const RECHECK_MS = 7 * 24 * 60 * 60 * 1000

export function needsRecallCheck(item: VaultItem): boolean {
  if (!item.lastRecallCheck) return true
  return Date.now() - new Date(item.lastRecallCheck).getTime() > RECHECK_MS
}

function isConfidentMatch(recall: any, brand: string, model: string): boolean {
  const b = brand.toLowerCase()
  const m = model.toLowerCase()

  const brandMatch = recall.Manufacturers?.some((mfr: any) => {
    const name = (mfr.Name || '').toLowerCase()
    return name.includes(b) || b.includes(name.split(' ')[0])
  }) ?? false

  if (!brandMatch || !m) return false

  const modelMatch =
    recall.Products?.some((p: any) =>
      (p.Model || '').toLowerCase().includes(m) ||
      m.includes((p.Model || '').toLowerCase())
    ) ||
    (recall.Title || '').toLowerCase().includes(m)

  return Boolean(modelMatch)
}

function toActiveRecall(r: any): ActiveRecall {
  return {
    recallNumber: r.RecallNumber || '',
    title: r.Title || 'Active recall notice',
    url: r.URL || `https://www.cpsc.gov/Recalls/${r.RecallNumber || ''}`,
    hazard: r.Hazards?.[0]?.Name || 'See recall notice',
    remedy: r.Remedies?.[0]?.Name || 'See recall notice',
    date: r.RecallDate || '',
  }
}

export async function checkItemForRecalls(item: VaultItem): Promise<ActiveRecall[]> {
  const brand = item.extractedData.brand
  const model = item.extractedData.model

  const b = (brand && brand !== 'Unknown') ? brand.trim() : ''
  const m = (model && model !== 'Unknown') ? model.trim() : ''

  if (!b && !m) return []

  try {
    const params = new URLSearchParams()
    if (b) params.set('brand', b)
    if (m) params.set('model', m)

    const res = await fetch(`/api/recall-check?${params}`, {
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) return []

    const recalls: any[] = await res.json()
    if (!Array.isArray(recalls) || recalls.length === 0) return []

    return recalls
      .filter((r) => isConfidentMatch(r, b, m))
      .map(toActiveRecall)
  } catch {
    return []
  }
}