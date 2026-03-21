import type { Metadata, Viewport } from 'next'
import './globals.css'
import TopNav from './components/TopNav'

export const viewport: Viewport = {
  themeColor: '#000000',
}

export const metadata: Metadata = {
  title: 'WaterHeaterVault',
  description: 'AI Water Heater Scanner for Homeowners & Pros. Know your water heater\'s age, warranty, recall status, rebates, and replacement cost — free in 60 seconds.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48', type: 'image/x-icon' },
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/icons/192x192.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white font-sans antialiased">
        <TopNav />
        <div className="md:pt-14">
          {children}
        </div>
      </body>
    </html>
  )
}
