import Link from 'next/link'

export default function HomePage() {
  const proofs = [
    'Exact age & remaining life',
    'Replacement cost estimate',
    'CPSC recall check',
    'Free PDF report card',
  ]

  return (
    <div style={{
      minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '40px 24px',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif",
      color: '#fff', textAlign: 'center',
    }}>

      {/* Wordmark */}
      <div style={{ fontSize: 13, fontWeight: 500, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 64 }}>
        Water Heater Plan
      </div>

      {/* Headline */}
      <h1 style={{ fontSize: 'clamp(2rem, 7vw, 3.6rem)', fontWeight: 300, lineHeight: 1.15, margin: '0 0 20px', maxWidth: 720, letterSpacing: '-0.02em' }}>
        Know your water heater's age,<br />life, and cost in{' '}
        <span style={{ color: '#0066ff' }}>60 seconds.</span>
      </h1>

      <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', color: 'rgba(255,255,255,0.4)', fontWeight: 300, margin: '0 0 48px', maxWidth: 480 }}>
        Free. No signup. Just point your phone at the data plate.
      </p>

      {/* Primary CTA */}
      <Link href="/scan" style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        background: '#0066ff', color: '#fff', borderRadius: 999,
        padding: '16px 40px', fontSize: 17, fontWeight: 500,
        textDecoration: 'none', marginBottom: 56, transition: 'opacity 0.2s',
      }}>
        Scan my water heater &rarr;
      </Link>

      {/* Proof points */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 72, maxWidth: 560 }}>
        {proofs.map(p => (
          <div key={p} style={{
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999,
            padding: '8px 16px', fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 300,
          }}>
            {p}
          </div>
        ))}
      </div>

      {/* Pro link */}
      <Link href="/pro" style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', textDecoration: 'none', letterSpacing: '0.06em', transition: 'color 0.2s' }}>
        Plumber or contractor? Join the Pro platform &rarr;
      </Link>

    </div>
  )
}
