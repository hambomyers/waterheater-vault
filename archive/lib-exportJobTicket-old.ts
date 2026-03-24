'use client'

// ─── Export Job Ticket ────────────────────────────────────────────────────────
// Pure string builders. Zero dependencies. Works fully offline.
// Triggers browser download via <a download> — no server, no API, no storage.
//
// Two exports:
//   exportICS(data)  → WaterHeater-Job-{serial}.ics
//                      TWO VEVENTs: near-term service + 364-day annual check
//   exportCSV(data)  → WaterHeater-Job-{serial}.csv
//                      Single data row, ready for Housecall Pro / Jobber / ServiceTitan

export interface ExportData {
  brand: string
  model: string
  serial: string
  ageYears: number
  remainingLifeYears: number
  fuelType: string
  tankGallons: number | null
  costMin: number
  costMax: number
  installYear: number
  manualUrl?: string
  recallStatus?: string
  zip?: string
  techName?: string            // plumber name, pre-fills if passed
  techPhone?: string           // plumber phone
  similarUnitsCount?: number   // for "Based on N similar units" copy
}

// ─── ICS Export ───────────────────────────────────────────────────────────────

export function exportICS(data: ExportData): void {
  const ics   = buildICS(data)
  const name  = `WaterHeater-Job-${sanitizeFilename(data.serial)}.ics`
  triggerDownload(ics, name, 'text/calendar;charset=utf-8')
}

function buildICS(data: ExportData): string {
  const now    = new Date()
  const uid1   = `WH-SERVICE-${data.serial}-${now.getTime()}@waterheaterplan.com`
  const uid2   = `WH-ANNUAL-${data.serial}-${now.getTime()}@waterheaterplan.com`
  const stamp  = formatICSDate(now)

  // Event 1: near-term service call (today + 14 days, 9am–11am)
  const serviceDate  = addDays(now, 14)
  const serviceStart = formatICSDateTime(serviceDate, 9)
  const serviceEnd   = formatICSDateTime(serviceDate, 11)

  // Event 2: annual reminder (today + 364 days, 9am–10am)
  const annualDate  = addDays(now, 364)
  const annualStart = formatICSDateTime(annualDate, 9)
  const annualEnd   = formatICSDateTime(annualDate, 10)

  const techLine  = data.techName  ? `\\nTechnician: ${data.techName}` : ''
  const phoneLine = data.techPhone ? `\\nPhone: ${data.techPhone}` : ''
  const unitCount = data.similarUnitsCount
    ? `Based on ${data.similarUnitsCount.toLocaleString()} similar units.`
    : ''

  const desc1 = [
    `Water Heater Service Report`,
    `Brand: ${data.brand}`,
    `Model: ${data.model}`,
    `Serial: ${data.serial}`,
    `Installed: ~${data.installYear}  (Age: ${data.ageYears} yr)`,
    `Remaining Life: ~${data.remainingLifeYears} yr`,
    `Fuel: ${formatFuel(data.fuelType)}`,
    data.tankGallons ? `Tank: ${data.tankGallons} gal` : `Type: Tankless`,
    `Fair Replacement Cost: $${data.costMin.toLocaleString()}–$${data.costMax.toLocaleString()} installed`,
    unitCount,
    data.manualUrl   ? `Manual: ${data.manualUrl}` : '',
    data.recallStatus ? `Recall: ${data.recallStatus}` : '',
    techLine,
    phoneLine,
    `Source: WaterHeaterVault.com`,
  ].filter(Boolean).join('\\n')

  const desc2 = [
    `Annual Water Heater Check — powered by WaterHeaterVault.com`,
    `Unit: ${data.brand} ${data.model} (Serial: ${data.serial})`,
    `Installed: ~${data.installYear}`,
    `Scan your label at WaterHeaterVault.com for an updated report.`,
    techLine,
    phoneLine,
  ].filter(Boolean).join('\\n')

  const location = data.zip ? `ZIP ${data.zip}` : ''
  const summary1 = `Water Heater Service — ${data.brand} ${data.model} (Age ${data.ageYears}yr)`
  const summary2 = `Annual Water Heater Check — ${data.brand} ${data.model}`

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//WaterHeaterVault//WaterHeaterVault//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    '',
    'BEGIN:VEVENT',
    `UID:${uid1}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${serviceStart}`,
    `DTEND:${serviceEnd}`,
    `SUMMARY:${summary1}`,
    `DESCRIPTION:${desc1}`,
    location ? `LOCATION:${location}` : '',
    'STATUS:TENTATIVE',
    'END:VEVENT',
    '',
    'BEGIN:VEVENT',
    `UID:${uid2}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${annualStart}`,
    `DTEND:${annualEnd}`,
    `SUMMARY:${summary2}`,
    `DESCRIPTION:${desc2}`,
    location ? `LOCATION:${location}` : '',
    'STATUS:CONFIRMED',
    'END:VEVENT',
    '',
    'END:VCALENDAR',
  ].filter(line => line !== null).join('\r\n')
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

export function exportCSV(data: ExportData): void {
  const csv  = buildCSV(data)
  const name = `WaterHeater-Job-${sanitizeFilename(data.serial)}.csv`
  triggerDownload(csv, name, 'text/csv;charset=utf-8')
}

function buildCSV(data: ExportData): string {
  const headers = [
    'Type', 'ZIP', 'Brand', 'Model', 'Serial',
    'Est.Install Year', 'Age (yr)', 'Remaining Life (yr)',
    'Fuel', 'Tank (gal)', 'Cost Min', 'Cost Max',
    'Manual URL', 'Recall Status', 'Tech Name', 'Tech Phone', 'Source',
  ]

  const row = [
    'Water Heater',
    data.zip             ?? '',
    data.brand,
    data.model,
    data.serial,
    data.installYear,
    data.ageYears,
    data.remainingLifeYears,
    formatFuel(data.fuelType),
    data.tankGallons     ?? 'Tankless',
    data.costMin,
    data.costMax,
    data.manualUrl       ?? '',
    data.recallStatus    ?? 'Not checked',
    data.techName        ?? '',
    data.techPhone       ?? '',
    'WaterHeaterVault.com',
  ]

  return [
    headers.map(csvEscape).join(','),
    row.map(csvEscape).join(','),
  ].join('\r\n')
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z'
}

function formatICSDateTime(date: Date, hour: number): string {
  const d = new Date(date)
  d.setHours(hour, 0, 0, 0)
  // Use local floating time (no Z) so calendar app honors the user's local timezone
  const y  = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const dy = String(d.getDate()).padStart(2, '0')
  const hr = String(hour).padStart(2, '0')
  return `${y}${mo}${dy}T${hr}0000`
}

function formatFuel(fuelType: string): string {
  const map: Record<string, string> = {
    natural_gas: 'Natural Gas',
    propane:     'Propane',
    electric:    'Electric',
    heat_pump:   'Heat Pump (Electric)',
  }
  return map[fuelType] ?? fuelType
}

function sanitizeFilename(s: string): string {
  return s.replace(/[^A-Za-z0-9\-_]/g, '').slice(0, 20)
}

function csvEscape(value: string | number): string {
  const s = String(value)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}
