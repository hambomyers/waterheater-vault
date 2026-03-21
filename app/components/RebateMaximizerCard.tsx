'use client'

import { VaultDocItem } from '../../vault/private'

interface RebateMaximizerCardProps {
  rebateDoc?: VaultDocItem | null
  brand?: string
  fuelType?: string
}

export default function RebateMaximizerCard({ rebateDoc, brand, fuelType }: RebateMaximizerCardProps) {
  if (!rebateDoc) return null

  const isHeatPump = fuelType === 'electric' || brand?.toLowerCase().includes('heat pump')

  return (
    <div className="rounded-2xl border border-green-500 border-opacity-25 bg-green-500 bg-opacity-5 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-green-400 text-lg" aria-hidden="true">⚡</span>
          <span className="text-white font-medium text-sm">Rebate Maximizer</span>
        </div>
        <span className="text-green-400 text-xs font-light px-2 py-1 rounded-full border border-green-500 border-opacity-30">
          Save up to $2,000+
        </span>
      </div>

      <p className="text-white text-opacity-60 text-sm font-light leading-relaxed">
        {isHeatPump
          ? 'Heat pump water heaters qualify for federal tax credits and local utility rebates. Don\'t leave money on the table.'
          : 'Your utility may offer rebates for upgrading to a high-efficiency or heat pump water heater when yours needs replacement.'}
      </p>

      <div className="flex items-center justify-between pt-1">
        <div className="space-y-0.5">
          <div className="text-white text-opacity-40 text-xs font-light">Federal IRA tax credit</div>
          <div className="text-green-400 font-medium text-sm">Up to $600 (30%)</div>
        </div>
        <div className="space-y-0.5 text-right">
          <div className="text-white text-opacity-40 text-xs font-light">Local utility rebate</div>
          <div className="text-green-400 font-medium text-sm">Varies by zip</div>
        </div>
      </div>

      {rebateDoc.url ? (
        <a
          href={rebateDoc.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-full py-3 px-6 rounded-full border border-green-500 border-opacity-40 text-green-400 text-sm font-medium hover:bg-green-500 hover:bg-opacity-10 transition-all duration-200"
        >
          Check My Utility Rebates ↗
        </a>
      ) : (
        <a
          href={`https://www.google.com/search?q=${encodeURIComponent(`${brand || 'water heater'} utility rebate ${fuelType || ''} replace DSIRE`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-full py-3 px-6 rounded-full border border-white border-opacity-10 text-white text-opacity-40 text-sm font-light hover:border-opacity-20 hover:text-opacity-60 transition-all duration-200"
        >
          Search Available Rebates ↗
        </a>
      )}
    </div>
  )
}
