'use client'

import { useState } from 'react'
import { ExtractedData } from '../../brain/on-device'

interface ProBranding {
  name: string
  phone: string
  logoUrl?: string
}

interface PDFReportGeneratorProps {
  extractedData: ExtractedData
  remainingLifeYears?: number
  imageBase64?: string
  proBranding?: ProBranding | null
  className?: string
}

export default function PDFReportGenerator({
  extractedData,
  remainingLifeYears,
  imageBase64,
  proBranding,
  className = '',
}: PDFReportGeneratorProps) {
  const [status, setStatus] = useState<'idle' | 'generating' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleGenerate = async () => {
    setStatus('generating')
    setErrorMsg('')

    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])

      const el = document.getElementById('pdf-report-canvas')
      if (!el) throw new Error('Report element not found')

      const canvas = await html2canvas(el, {
        backgroundColor: '#000000',
        scale: 2,
        useCORS: true,
        logging: false,
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)

      const brand = extractedData.brand !== 'Unknown' ? extractedData.brand : 'WaterHeater'
      const age = extractedData.ageYears > 0 ? `_${extractedData.ageYears}yr` : ''
      pdf.save(`WaterHeater_Report_${brand}${age}.pdf`)
      setStatus('done')
      setTimeout(() => setStatus('idle'), 3000)
    } catch (err: any) {
      setStatus('error')
      setErrorMsg(err.message || 'PDF generation failed. Please try again.')
      setTimeout(() => setStatus('idle'), 4000)
    }
  }

  const life = remainingLifeYears ?? extractedData.remainingLifeYears
  const urgency = life < 2 ? 'critical' : life < 5 ? 'aging' : 'healthy'
  const urgencyColor = urgency === 'critical' ? '#ef4444' : urgency === 'aging' ? '#f59e0b' : '#22c55e'
  const urgencyLabel = urgency === 'critical' ? 'Replace Soon' : urgency === 'aging' ? 'Aging — Monitor' : 'Healthy'

  return (
    <div className={className}>
      {/* Hidden render target for html2canvas */}
      <div
        id="pdf-report-canvas"
        className="absolute -left-[9999px] -top-[9999px] pointer-events-none"
        aria-hidden="true"
        style={{
          width: '794px',
          background: '#000000',
          color: '#ffffff',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
          padding: '48px',
        }}
      >
        {/* Header */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '24px', marginBottom: '32px' }}>
          <div style={{ fontSize: '13px', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>
            WATERHEATER VAULT
          </div>
          <div style={{ fontSize: '28px', fontWeight: 300, marginBottom: '4px' }}>
            Water Heater Report Card
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
            Generated {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Status badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '8px 16px', borderRadius: '999px',
          border: `1px solid ${urgencyColor}40`,
          background: `${urgencyColor}15`,
          marginBottom: '32px',
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: urgencyColor }} />
          <span style={{ color: urgencyColor, fontSize: '14px', fontWeight: 500 }}>{urgencyLabel}</span>
        </div>

        {/* Data grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', marginBottom: '32px' }}>
          {[
            { label: 'Brand', value: extractedData.brand },
            { label: 'Model', value: extractedData.model },
            { label: 'Serial Number', value: extractedData.serialNumber },
            { label: 'Manufacture Date', value: extractedData.manufactureDate },
            { label: 'Fuel Type', value: extractedData.fuelType },
            { label: 'Tank Size', value: extractedData.tankSizeGallons ? `${extractedData.tankSizeGallons} gal` : null },
            { label: 'Age', value: extractedData.ageYears > 0 ? `${extractedData.ageYears} years` : null },
            { label: 'Estimated Life Remaining', value: life > 0 ? `~${life} years` : '< 1 year' },
            { label: 'Replacement Cost', value: extractedData.estimatedReplacementCost > 0 ? `$${extractedData.estimatedReplacementCost.toLocaleString()} installed` : null },
            { label: 'Warranty', value: extractedData.currentWarranty },
          ].filter(r => r.value).map((row) => (
            <div key={row.label} style={{ padding: '14px 18px', background: 'rgba(255,255,255,0.04)', marginBottom: '2px' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {row.label}
              </div>
              <div style={{ fontSize: '15px', color: row.label === 'Replacement Cost' ? '#0066ff' : '#ffffff', fontWeight: row.label === 'Replacement Cost' ? 600 : 300 }}>
                {row.value}
              </div>
            </div>
          ))}
        </div>

        {/* Life gauge bar */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Estimated remaining life</span>
            <span style={{ fontSize: '12px', color: urgencyColor, fontWeight: 500 }}>{life} yr · {urgencyLabel}</span>
          </div>
          <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              borderRadius: '4px',
              background: urgencyColor,
              width: `${Math.max(3, Math.min(100, (life / (life + extractedData.ageYears)) * 100))}%`,
            }} />
          </div>
        </div>

        {/* Pro branding footer or default CTA */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          {proBranding ? (
            <>
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '4px' }}>SERVICE PROVIDED BY</div>
                <div style={{ fontSize: '18px', fontWeight: 500 }}>{proBranding.name}</div>
                <div style={{ fontSize: '14px', color: '#0066ff', marginTop: '2px' }}>{proBranding.phone}</div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>
                Screened & verified by<br />WaterHeaterVault Pro
              </div>
            </>
          ) : (
            <>
              <div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Need service?</div>
                <div style={{ fontSize: '15px', color: '#0066ff', marginTop: '2px' }}>waterheaterplan.com/pro</div>
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>scan.waterheaterplan.com</div>
            </>
          )}
        </div>
      </div>

      {/* Visible button */}
      <button
        onClick={handleGenerate}
        disabled={status === 'generating'}
        className={`flex items-center justify-center gap-2 w-full py-4 px-8 bg-transparent border-2 border-white border-opacity-15 text-white rounded-full font-medium text-base disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] transition-all duration-200 hover:border-opacity-30 ${className}`}
      >
        {status === 'generating' ? (
          <>
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            Generating PDF…
          </>
        ) : status === 'done' ? (
          '✓ PDF Downloaded'
        ) : status === 'error' ? (
          `⚠ ${errorMsg}`
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            Download PDF Report Card
          </>
        )}
      </button>
    </div>
  )
}
