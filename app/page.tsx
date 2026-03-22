import Link from 'next/link'

export default function HomePage() {
  return (
    <>
      <style>{`
        .mkt *,
        .mkt *::before,
        .mkt *::after { box-sizing: border-box; }
        .mkt { --blue: #0066ff; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; font-weight: 300; line-height: 1.6; }
        .mkt a { color: inherit; text-decoration: none; }
        .mkt .container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }

        /* NAV */
        .mkt nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; border-bottom: 1px solid rgba(255,255,255,0.06); background: rgba(0,0,0,0.85); backdrop-filter: blur(12px); }
        .mkt .nav-inner { display: flex; align-items: center; justify-content: space-between; height: 60px; }
        .mkt .nav-logo { font-size: 15px; font-weight: 500; letter-spacing: 0.06em; }
        .mkt .nav-logo span { color: rgba(255,255,255,0.35); font-weight: 300; }
        .mkt .nav-links { display: flex; align-items: center; gap: 32px; }
        .mkt .nav-links a { font-size: 13px; color: rgba(255,255,255,0.45); transition: color 0.2s; }
        .mkt .nav-links a:hover { color: #fff; }
        .mkt .nav-cta { font-size: 13px; font-weight: 500; padding: 8px 20px; border-radius: 999px; background: var(--blue); color: #fff; transition: opacity 0.2s; }
        .mkt .nav-cta:hover { opacity: 0.85; }
        @media(max-width:640px) { .mkt .nav-links { display: none; } }

        /* HERO */
        .mkt .hero { padding: 140px 0 100px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .mkt .hero-eyebrow { font-size: 11px; font-weight: 500; letter-spacing: 0.2em; color: var(--blue); text-transform: uppercase; margin-bottom: 24px; }
        .mkt .hero-title { font-size: clamp(2.2rem, 6vw, 4rem); font-weight: 300; line-height: 1.15; margin-bottom: 24px; max-width: 800px; margin-left: auto; margin-right: auto; }
        .mkt .hero-title strong { font-weight: 600; }
        .mkt .hero-sub { font-size: clamp(1rem, 2vw, 1.2rem); color: rgba(255,255,255,0.45); max-width: 560px; margin: 0 auto 44px; font-weight: 300; }
        .mkt .hero-actions { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
        .mkt .btn-primary { display: inline-flex; align-items: center; gap: 8px; padding: 14px 32px; border-radius: 999px; background: var(--blue); color: #fff; font-size: 15px; font-weight: 500; transition: opacity 0.2s; }
        .mkt .btn-primary:hover { opacity: 0.85; }
        .mkt .btn-ghost { display: inline-flex; align-items: center; gap: 8px; padding: 14px 32px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.15); color: rgba(255,255,255,0.6); font-size: 15px; font-weight: 300; transition: border-color 0.2s, color 0.2s; }
        .mkt .btn-ghost:hover { border-color: rgba(255,255,255,0.35); color: #fff; }
        .mkt .hero-note { margin-top: 20px; font-size: 12px; color: rgba(255,255,255,0.2); }

        /* STATS */
        .mkt .stats { padding: 60px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .mkt .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 2px; }
        .mkt .stat { padding: 32px 24px; background: rgba(255,255,255,0.02); text-align: center; }
        .mkt .stat-number { font-size: 2.2rem; font-weight: 300; color: #fff; margin-bottom: 6px; }
        .mkt .stat-label { font-size: 12px; color: rgba(255,255,255,0.35); letter-spacing: 0.06em; }

        /* SECTIONS */
        .mkt .section { padding: 96px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .mkt .section-label { font-size: 11px; font-weight: 500; letter-spacing: 0.2em; color: rgba(255,255,255,0.3); text-transform: uppercase; margin-bottom: 16px; }
        .mkt .section-title { font-size: clamp(1.6rem, 3vw, 2.4rem); font-weight: 300; margin-bottom: 16px; }
        .mkt .section-sub { font-size: 15px; color: rgba(255,255,255,0.4); max-width: 480px; font-weight: 300; }
        .mkt .steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 2px; margin-top: 56px; }
        .mkt .step { padding: 36px 32px; background: rgba(255,255,255,0.02); }
        .mkt .step-num { font-size: 11px; font-weight: 500; color: var(--blue); letter-spacing: 0.15em; margin-bottom: 20px; }
        .mkt .step-title { font-size: 17px; font-weight: 500; margin-bottom: 10px; }
        .mkt .step-desc { font-size: 14px; color: rgba(255,255,255,0.45); line-height: 1.65; font-weight: 300; }

        /* FEATURES */
        .mkt .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 2px; margin-top: 56px; }
        .mkt .feature { padding: 32px; background: rgba(255,255,255,0.02); }
        .mkt .feature-icon { font-size: 22px; margin-bottom: 16px; }
        .mkt .feature-title { font-size: 15px; font-weight: 500; margin-bottom: 8px; }
        .mkt .feature-desc { font-size: 13px; color: rgba(255,255,255,0.4); line-height: 1.65; font-weight: 300; }

        /* PRICING */
        .mkt .pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 2px; margin-top: 56px; max-width: 680px; }
        .mkt .price-card { padding: 40px 36px; background: rgba(255,255,255,0.02); position: relative; }
        .mkt .price-card.featured { background: rgba(0,102,255,0.08); border: 1px solid rgba(0,102,255,0.25); }
        .mkt .price-badge { position: absolute; top: -12px; left: 36px; background: var(--blue); color: #fff; font-size: 11px; font-weight: 500; padding: 4px 12px; border-radius: 999px; letter-spacing: 0.08em; }
        .mkt .price-cycle { font-size: 12px; color: rgba(255,255,255,0.3); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 12px; }
        .mkt .price-amount { font-size: 3rem; font-weight: 300; line-height: 1; margin-bottom: 6px; }
        .mkt .price-amount span { font-size: 1rem; color: rgba(255,255,255,0.4); margin-left: 4px; }
        .mkt .price-save { font-size: 12px; color: #22c55e; margin-bottom: 28px; }
        .mkt .price-features { list-style: none; padding: 0; margin-bottom: 32px; }
        .mkt .price-features li { font-size: 13px; color: rgba(255,255,255,0.5); padding: 7px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-weight: 300; }
        .mkt .price-features li::before { content: '✓ '; color: var(--blue); font-weight: 500; }
        .mkt .price-note { font-size: 11px; color: rgba(255,255,255,0.2); margin-top: 16px; font-weight: 300; }

        /* GATE */
        .mkt .gate-card { margin-top: 56px; padding: 40px 48px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); display: flex; gap: 48px; flex-wrap: wrap; align-items: center; }
        .mkt .gate-icon { font-size: 2.5rem; flex-shrink: 0; }
        .mkt .gate-title { font-size: 18px; font-weight: 500; margin-bottom: 8px; }
        .mkt .gate-desc { font-size: 14px; color: rgba(255,255,255,0.45); line-height: 1.65; font-weight: 300; max-width: 560px; }

        /* HOMEOWNER STRIP */
        .mkt .homeowner-strip { padding: 72px 0; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .mkt .homeowner-strip h2 { font-size: clamp(1.4rem, 3vw, 2rem); font-weight: 300; margin-bottom: 12px; }
        .mkt .homeowner-strip p { font-size: 15px; color: rgba(255,255,255,0.4); margin-bottom: 32px; font-weight: 300; }

        /* FOOTER */
        .mkt footer { padding: 48px 0; border-top: 1px solid rgba(255,255,255,0.06); }
        .mkt .footer-inner { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 32px; }
        .mkt .footer-brand { font-size: 14px; font-weight: 500; letter-spacing: 0.06em; margin-bottom: 8px; }
        .mkt .footer-entity { font-size: 11px; color: rgba(255,255,255,0.2); line-height: 1.8; font-weight: 300; }
        .mkt .footer-links { display: flex; gap: 24px; flex-wrap: wrap; }
        .mkt .footer-links a { font-size: 12px; color: rgba(255,255,255,0.3); transition: color 0.2s; }
        .mkt .footer-links a:hover { color: rgba(255,255,255,0.7); }
      `}</style>

      <div className="mkt">

        {/* NAV */}
        <nav>
          <div className="container">
            <div className="nav-inner">
              <div className="nav-logo">Water Heater Plan <span>· Pro Platform</span></div>
              <div className="nav-links">
                <a href="#how-it-works">How it works</a>
                <a href="#pricing">Pricing</a>
                <Link href="/pro/directory">Directory</Link>
                <Link href="/scan" style={{color:'rgba(255,255,255,0.3)'}}>Homeowner scan ↗</Link>
              </div>
              <Link href="/pro/onboard" className="nav-cta">Join as a Pro</Link>
            </div>
          </div>
        </nav>

        <main>

          {/* HERO */}
          <section className="hero">
            <div className="container">
              <div className="hero-eyebrow">WaterHeaterVault Pro</div>
              <h1 className="hero-title">Your name on every water heater<br /><strong>scan in your area.</strong></h1>
              <p className="hero-sub">Homeowners scan their water heater free. When theirs is aging out, you get the lead. $29/mo — no contracts, no wrenches, pure software.</p>
              <div className="hero-actions">
                <Link href="/pro/onboard" className="btn-primary">Join as a Pro →</Link>
                <Link href="/pro/directory" className="btn-ghost">Browse directory</Link>
              </div>
              <p className="hero-note">AI-screened · 4.5+ star Google rating required · Cancel anytime</p>
            </div>
          </section>

          {/* STATS */}
          <section className="stats">
            <div className="container">
              <div className="stats-grid">
                {[
                  { n: '60s', l: 'Average scan time' },
                  { n: '$1,500+', l: 'Avg replacement job value' },
                  { n: '8yr', l: 'Lead trigger threshold' },
                  { n: '$29', l: 'Per month, flat rate' },
                ].map(s => (
                  <div key={s.l} className="stat">
                    <div className="stat-number">{s.n}</div>
                    <div className="stat-label">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* HOW IT WORKS */}
          <section className="section" id="how-it-works">
            <div className="container">
              <div className="section-label">How it works</div>
              <h2 className="section-title">Three steps. Zero cold calls.</h2>
              <p className="section-sub">Every lead comes from a homeowner who already knows their heater is aging — they asked for it.</p>
              <div className="steps">
                {[
                  { n: 'STEP 01', t: 'Homeowner scans free', d: 'They point their phone at the data plate. Grok Vision AI decodes the serial number, calculates exact age, remaining life, replacement cost, and recall status. Takes 60 seconds.' },
                  { n: 'STEP 02', t: 'Your name appears', d: 'Results show your business name and phone number. Every scan in your zip shows your branding. Every PDF they download has your contact info on it.' },
                  { n: 'STEP 03', t: 'You get the lead', d: 'When their heater hits critical age (>8yr) or less than 3 years of life remaining, we send you an auto-lead. They already know the cost. You just close.' },
                ].map(s => (
                  <div key={s.n} className="step">
                    <div className="step-num">{s.n}</div>
                    <div className="step-title">{s.t}</div>
                    <div className="step-desc">{s.d}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* WHAT PROS GET */}
          <section className="section" style={{borderTop:'none'}}>
            <div className="container">
              <div className="section-label">What you get</div>
              <h2 className="section-title">Everything. $29/mo.</h2>
              <p className="section-sub">No per-lead fees. No setup fees. No territory exclusivity.</p>
              <div className="features-grid">
                {[
                  { i: '📍', t: 'White-label branding', d: 'Your name and phone number on every scan result and PDF report card from homeowners in your service zip codes.' },
                  { i: '⚡', t: 'Auto-leads', d: 'Instant notification when a scanned heater in your area hits critical age (>8yr) or has <3 years of life remaining.' },
                  { i: '🌐', t: 'Directory listing', d: 'Listed on waterheaterplan.com/pro/directory — a public, SEO-indexed page homeowners find when searching for local pros.' },
                  { i: '📄', t: 'Branded PDF reports', d: 'Every one-click PDF Report Card the homeowner downloads shows your business name and number. Walking business cards.' },
                  { i: '🔗', t: 'Viral invite loop', d: 'Homeowners can share the scanner with their own plumber — who then joins and tags their customers. Organic growth built in.' },
                  { i: '🔄', t: 'Multiple pros per zip', d: "We don't lock territories. Competition keeps quality high. The more pros active in an area, the more homeowners scan." },
                ].map(f => (
                  <div key={f.t} className="feature">
                    <div className="feature-icon">{f.i}</div>
                    <div className="feature-title">{f.t}</div>
                    <div className="feature-desc">{f.d}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* PRICING */}
          <section className="section" id="pricing">
            <div className="container">
              <div className="section-label">Pricing</div>
              <h2 className="section-title">Flat rate. No surprises.</h2>
              <p className="section-sub">One product. One price. Cancel anytime — no lock-in, no setup fee.</p>
              <div className="pricing-grid">
                <div className="price-card">
                  <div className="price-cycle">Monthly</div>
                  <div className="price-amount">$29<span>/ mo</span></div>
                  <div className="price-save">&nbsp;</div>
                  <ul className="price-features">
                    {['White-label branding in your zip','Auto-leads (age >8yr or life <3yr)','Directory listing','Branded PDF reports','AI-screened quality badge'].map(l => <li key={l}>{l}</li>)}
                  </ul>
                  <Link href="/pro/onboard" className="btn-ghost" style={{width:'100%',justifyContent:'center'}}>Get started →</Link>
                </div>
                <div className="price-card featured">
                  <div className="price-badge">Save $49</div>
                  <div className="price-cycle">Annual</div>
                  <div className="price-amount">$299<span>/ yr</span></div>
                  <div className="price-save">2 months free vs monthly</div>
                  <ul className="price-features">
                    {['Everything in monthly','Priority listing in directory','Early access to new features','Annual re-screen included','Lock in current price forever'].map(l => <li key={l}>{l}</li>)}
                  </ul>
                  <Link href="/pro/onboard" className="btn-primary" style={{width:'100%',justifyContent:'center'}}>Get started →</Link>
                  <p className="price-note">Most popular with established contractors</p>
                </div>
              </div>
            </div>
          </section>

          {/* QUALITY GATE */}
          <section className="section" style={{borderTop:'none',paddingTop:0}}>
            <div className="container">
              <div className="gate-card">
                <div className="gate-icon">🛡️</div>
                <div>
                  <div className="gate-title">AI Quality Gate — 4.5+ stars required</div>
                  <div className="gate-desc">Every pro is screened by Grok AI before joining. We check your Google Business Profile reviews for rating, sentiment, and red flags. Below 4.5 stars? Application denied. Re-screened every 30 days. This isn't gatekeeping — it's what makes homeowners trust the platform. Your listing carries a "Verified by WaterHeaterVault" badge.</div>
                </div>
              </div>
            </div>
          </section>

          {/* HOMEOWNER STRIP */}
          <div className="homeowner-strip">
            <div className="container">
              <h2>Not a plumber?</h2>
              <p>The free scanner is for homeowners. Know your water heater&apos;s exact age, remaining life, replacement cost, and recall status — in 60 seconds.</p>
              <Link href="/scan" className="btn-ghost">Scan my water heater free →</Link>
            </div>
          </div>

        </main>

        {/* FOOTER */}
        <footer>
          <div className="container">
            <div className="footer-inner">
              <div>
                <div className="footer-brand">Water Heater Plan</div>
                <div className="footer-entity">
                  Operated by VaultPro LLC<br />
                  info@waterheaterplan.com<br />
                  &copy; 2026 All rights reserved.
                </div>
              </div>
              <div className="footer-links">
                <Link href="/pro/onboard">Join as a Pro</Link>
                <Link href="/pro/directory">Directory</Link>
                <Link href="/scan">Free Scanner</Link>
                <a href="mailto:info@waterheaterplan.com">Contact</a>
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  )
}
