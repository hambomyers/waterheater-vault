'use client'

/**
 * Pro Layout - Plumber dashboard route group
 * $49/mo subscription, geofenced zones
 */

export default function ProLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-black text-white">
      {children}
    </div>
  )
}
