'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Logo from '../components/Logo'
import { privateVault, VaultItem } from '../../vault/private'
import { checkItemForRecalls, needsRecallCheck } from '../../lib/recallChecker'

// Minimal camera icon — inline so no extra dep
function CameraIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  )
}

export default function VaultPage() {
  const [items, setItems] = useState<VaultItem[]>([])
  const [totalValue, setTotalValue] = useState(0)
  const [loading, setLoading] = useState(true)
  const [recallAlertCount, setRecallAlertCount] = useState(0)

  useEffect(() => { loadVault() }, [])

  const loadVault = async () => {
    try {
      const vaultItems = await privateVault.getItems()
      const stats = await privateVault.getStats()
      setItems(vaultItems)
      setTotalValue(stats.totalValue)
      setRecallAlertCount(vaultItems.filter((i) => i.recallStatus === 'recalled').length)
      // Background recall checks — silent, runs after UI renders
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        runBackgroundRecallChecks(vaultItems)
      }
    } catch {
      // Vault load failure is silent — items just don't appear
    } finally {
      setLoading(false)
    }
  }

  const runBackgroundRecallChecks = async (vaultItems: VaultItem[]) => {
    const stale = vaultItems.filter(needsRecallCheck)
    if (stale.length === 0) return

    await Promise.allSettled(
      stale.map(async (item) => {
        try {
          const recalls = await checkItemForRecalls(item)
          await privateVault.updateItem(item.id, {
            recallStatus: recalls.length > 0 ? 'recalled' : 'safe',
            lastRecallCheck: new Date().toISOString(),
            activeRecalls: recalls,
          })
        } catch {
          // Silently skip — item keeps its existing recallStatus
        }
      })
    )

    // Re-fetch to show any newly found recall badges
    const refreshed = await privateVault.getItems()
    setItems(refreshed)
    setRecallAlertCount(refreshed.filter((i) => i.recallStatus === 'recalled').length)
  }

  return (
    <div className="min-h-screen bg-black">

      {/* ── MOBILE ── */}
      <div className="md:hidden min-h-screen flex flex-col">

        {/* Top bar: Home · Logo · Camera */}
        <div className="flex items-center justify-between px-6 pt-10 pb-6 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-1 text-white text-opacity-50 hover:text-opacity-90 transition-all min-h-[44px] touch-manipulation"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            <span className="text-sm font-light">Home</span>
          </Link>

          {/* Logo — center */}
          <Logo size={44} />

          {/* Scan shortcut — right */}
          <Link
            href="/scan"
            className="flex items-center justify-center w-[44px] h-[44px] rounded-full border border-white border-opacity-20 text-white text-opacity-50 hover:text-opacity-90 hover:border-opacity-40 transition-all touch-manipulation"
            aria-label="Scan new item"
          >
            <CameraIcon />
          </Link>
        </div>

        {/* Vault title + count — centered */}
        <div className="text-center pb-6 shrink-0">
          <h1 className="text-white text-2xl font-light tracking-wide">Vault</h1>
          <div className="text-white text-opacity-40 text-sm font-light mt-1">
            {loading ? '…' : (
              <>
                {items.length} {items.length === 1 ? 'item' : 'items'}
                {totalValue > 0 && (
                  <span className="text-blue-accent ml-2">${totalValue.toFixed(0)}</span>
                )}
                {recallAlertCount > 0 && (
                  <span className="ml-2 text-red-400">· {recallAlertCount} recall{recallAlertCount > 1 ? 's' : ''}</span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Item list */}
        <div className="flex-1 overflow-y-auto px-6 pb-10">
          {loading ? (
            <div className="text-white text-opacity-30 text-center py-20 font-light animate-pulse">
              Loading…
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-6">
              <div className="text-white text-opacity-25 text-sm font-light text-center">
                Nothing here yet.
              </div>
              <Link
                href="/scan"
                className="py-4 px-10 border-2 border-blue-accent text-white rounded-full font-medium text-base transition-all active:scale-95 touch-manipulation"
              >
                Snap a photo
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={`/vault/item?id=${item.id}`}
                  className="flex items-center justify-between bg-white bg-opacity-5 rounded-2xl border border-white border-opacity-8 px-5 py-4 hover:bg-opacity-8 hover:border-opacity-15 active:scale-[0.99] transition-all duration-200 touch-manipulation"
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <div className="flex items-center gap-2">
                      <div className="text-white font-medium text-sm truncate">
                        {item.extractedData.product}
                      </div>
                      {item.recallStatus === 'recalled' && (
                        <span className="shrink-0 text-xs font-medium px-1.5 py-0.5 rounded-full bg-red-500 bg-opacity-20 text-red-400 border border-red-500 border-opacity-30">
                          ⚠ Recalled
                        </span>
                      )}
                    </div>
                    <div className="text-white text-opacity-35 text-xs font-light mt-0.5 truncate">
                      {item.extractedData.brand}
                      {item.extractedData.model && item.extractedData.model !== 'Unknown' && ` · ${item.extractedData.model}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      {item.valuation && item.valuation.currentValue > 0 ? (
                        <div className="text-blue-accent text-sm font-medium">
                          ${item.valuation.currentValue.toFixed(0)}
                        </div>
                      ) : (
                        <div className="text-white text-opacity-20 text-xs">—</div>
                      )}
                      <div className="text-white text-opacity-25 text-xs font-light">
                        {new Date(item.dateAdded).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <span className="text-white text-opacity-20 text-xl leading-none">›</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── DESKTOP ── */}
      <div className="hidden md:block min-h-screen px-8 py-12">
        <div className="max-w-5xl mx-auto">

          {/* Page title row */}
          <div className="flex items-baseline justify-between mb-10">
            <div className="flex items-center gap-4">
              <h1 className="text-white text-3xl font-light">Vault</h1>
              {recallAlertCount > 0 && (
                <span className="text-sm font-medium px-2.5 py-1 rounded-full bg-red-500 bg-opacity-15 text-red-400 border border-red-500 border-opacity-25">
                  ⚠ {recallAlertCount} active recall{recallAlertCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            {!loading && items.length > 0 && (
              <div className="text-white text-opacity-35 text-sm font-light">
                {items.length} {items.length === 1 ? 'item' : 'items'}
                {totalValue > 0 && (
                  <span className="text-blue-accent ml-3">${totalValue.toFixed(0)}</span>
                )}
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-white text-opacity-30 text-center py-20 font-light animate-pulse">Loading…</div>
          ) : items.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-white text-opacity-25 font-light mb-8 text-sm">
                Your vault is empty.
              </div>
              <Link
                href="/scan"
                className="px-10 py-3 rounded-full border border-blue-accent text-white text-sm font-medium hover:bg-blue-accent hover:bg-opacity-10 transition-all duration-200"
              >
                Start scanning
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-white border-opacity-8 overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white border-opacity-8 text-white text-opacity-30 text-xs font-light uppercase tracking-widest">
                <div className="col-span-4">Product</div>
                <div className="col-span-2">Brand</div>
                <div className="col-span-2">Model</div>
                <div className="col-span-2">Date</div>
                <div className="col-span-2 text-right">Value</div>
              </div>
              {/* Rows */}
              {items.map((item, i) => (
                <Link
                  key={item.id}
                  href={`/vault/item?id=${item.id}`}
                  className={`grid grid-cols-12 gap-4 px-6 py-4 hover:bg-white hover:bg-opacity-4 transition-colors duration-150 group ${
                    i < items.length - 1 ? 'border-b border-white border-opacity-5' : ''
                  }`}
                >
                  <div className="col-span-4 flex items-center gap-2 min-w-0">
                    <span className="text-white text-sm truncate group-hover:text-blue-accent transition-colors duration-150">
                      {item.extractedData.product}
                    </span>
                    {item.recallStatus === 'recalled' && (
                      <span className="shrink-0 text-xs font-medium px-1.5 py-0.5 rounded-full bg-red-500 bg-opacity-15 text-red-400 border border-red-500 border-opacity-25">
                        ⚠ Recalled
                      </span>
                    )}
                  </div>
                  <div className="col-span-2 text-white text-opacity-50 text-sm truncate">
                    {item.extractedData.brand}
                  </div>
                  <div className="col-span-2 text-white text-opacity-50 text-sm truncate">
                    {item.extractedData.model}
                  </div>
                  <div className="col-span-2 text-white text-opacity-30 text-sm">
                    {new Date(item.dateAdded).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="col-span-2 text-right">
                    {item.valuation && item.valuation.currentValue > 0 ? (
                      <span className="text-blue-accent text-sm font-medium">
                        ${item.valuation.currentValue.toFixed(0)}
                      </span>
                    ) : (
                      <span className="text-white text-opacity-20 text-sm">—</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
