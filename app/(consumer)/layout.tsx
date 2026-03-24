'use client'

/**
 * Consumer Layout - Simple, jargon-free interface for homeowners
 * Tesla-sleek minimalism, max 3 elements per viewport
 */

export default function ConsumerLayout({
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
