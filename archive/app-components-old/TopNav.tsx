'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Logo from './Logo'

export default function TopNav() {
  const pathname = usePathname()

  if (pathname === '/' || pathname === '/pro') return null

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  return (
    <header className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-14 items-center px-8 bg-black border-b border-white border-opacity-8">
      {/* Brand */}
      <Link href="/" className="flex items-center gap-3 group">
        <Logo size={28} />
        <span className="text-white text-sm font-medium tracking-[0.18em] group-hover:text-white group-hover:text-opacity-70 transition-colors duration-200">
          WaterHeaterVault
        </span>
      </Link>

      <div className="flex-1" />

      {/* Nav */}
      <nav className="flex items-center gap-8">
        <Link
          href="/vault"
          className={`text-sm font-light transition-colors duration-200 ${
            isActive('/vault')
              ? 'text-white'
              : 'text-white text-opacity-40 hover:text-opacity-75'
          }`}
        >
          Vault
        </Link>
        <Link
          href="/scan"
          className="text-sm font-medium px-5 py-2 rounded-full border border-blue-accent text-white hover:bg-blue-accent hover:bg-opacity-10 transition-all duration-200"
        >
          Scan
        </Link>
      </nav>
    </header>
  )
}
