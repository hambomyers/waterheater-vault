/**
 * Job Ticket Export - generates .ics and .csv files for plumbers
 * Pure client-side, works offline, zero APIs
 */

import type { JobTicketData } from './profile-builder'

/**
 * Generate .ics calendar event for job ticket
 */
export function generateICS(jobTicket: JobTicketData): string {
  const now = new Date()
  const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  
  // Schedule for 7 days from now, 9am-11am
  const scheduledDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const startDate = new Date(scheduledDate.setHours(9, 0, 0, 0))
  const endDate = new Date(scheduledDate.setHours(11, 0, 0, 0))
  
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }
  
  const uid = `WH-${jobTicket.heaterSerial}-${timestamp}@waterheaterplan.com`
  const summary = `💧 Water Heater Service — ${jobTicket.heaterBrand} ${jobTicket.heaterModel} (Age ${jobTicket.heaterAge}yr)`
  
  const description = [
    `Serial: ${jobTicket.heaterSerial}`,
    `Age: ${jobTicket.heaterAge} years`,
    `Fuel: ${jobTicket.heaterFuelType}`,
    `Tank: ${jobTicket.heaterTankSize}`,
    `Estimated Cost: ${jobTicket.estimatedCost}`,
    `Urgency: ${jobTicket.urgency.toUpperCase()}`,
    '',
    jobTicket.notes,
    '',
    '— Water Heater Plan',
    'waterheaterplan.com'
  ].join('\\n')
  
  const location = jobTicket.customerZip || 'TBD'
  
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Water Heater Plan//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${timestamp}`,
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(endDate)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'STATUS:TENTATIVE',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n')
  
  return ics
}

/**
 * Generate .csv field service row for job ticket
 */
export function generateCSV(jobTicket: JobTicketData): string {
  const headers = [
    'Type',
    'Customer Name',
    'Customer Email',
    'Customer Phone',
    'Zip',
    'Brand',
    'Model',
    'Serial',
    'Age',
    'Fuel Type',
    'Tank Size',
    'Est. Cost',
    'Urgency',
    'Notes',
    'Source'
  ]
  
  const row = [
    'Water Heater Service',
    jobTicket.customerName || '',
    jobTicket.customerEmail || '',
    jobTicket.customerPhone || '',
    jobTicket.customerZip || '',
    jobTicket.heaterBrand,
    jobTicket.heaterModel,
    jobTicket.heaterSerial,
    `${jobTicket.heaterAge} years`,
    jobTicket.heaterFuelType,
    jobTicket.heaterTankSize,
    jobTicket.estimatedCost,
    jobTicket.urgency.toUpperCase(),
    jobTicket.notes.replace(/\n/g, ' '),
    'Water Heater Plan'
  ]
  
  // Escape CSV values
  const escapedRow = row.map(value => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  })
  
  return [headers.join(','), escapedRow.join(',')].join('\n')
}

/**
 * Download .ics file
 */
export function downloadICS(jobTicket: JobTicketData): void {
  const ics = generateICS(jobTicket)
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `WaterHeater-Job-${jobTicket.heaterSerial}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

/**
 * Download .csv file
 */
export function downloadCSV(jobTicket: JobTicketData): void {
  const csv = generateCSV(jobTicket)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `WaterHeater-Job-${jobTicket.heaterSerial}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

/**
 * Download both .ics and .csv files
 */
export function downloadJobTicket(jobTicket: JobTicketData): void {
  downloadICS(jobTicket)
  
  // Delay CSV download slightly to avoid browser blocking
  setTimeout(() => {
    downloadCSV(jobTicket)
  }, 100)
}

/**
 * Generate shareable job ticket URL (for "Send to My Plumber" flow)
 */
export function generateShareableURL(jobTicket: JobTicketData): string {
  const params = new URLSearchParams({
    brand: jobTicket.heaterBrand,
    model: jobTicket.heaterModel,
    serial: jobTicket.heaterSerial,
    age: jobTicket.heaterAge.toString(),
    fuel: jobTicket.heaterFuelType,
    tank: jobTicket.heaterTankSize,
    cost: jobTicket.estimatedCost,
    urgency: jobTicket.urgency
  })
  
  if (jobTicket.customerZip) {
    params.set('zip', jobTicket.customerZip)
  }
  
  return `${window.location.origin}/pro/claim?${params.toString()}`
}
