/**
 * Profile Builder - creates simple vs rich views of water heater profiles
 * Simple view: homeowner-friendly, no jargon
 * Rich view: full technical specs for plumbers
 */

import type { ScanResult } from '../vision/on-device-scanner'
import {
  formatAgeSimple,
  formatRemainingSimple,
  formatCostRange,
  formatFuelType,
  getRemainingLifeColor,
  isDangerZone
} from '../vision/result-parser'

/**
 * Simple profile card data for homeowners
 * No serial numbers, BTUs, or technical jargon
 */
export interface SimpleProfile {
  age: string // "8 years old"
  remaining: string // "~4 years remaining"
  remainingColor: 'green' | 'amber' | 'red'
  cost: string // "$1,800–$2,400"
  recallStatus: string // "No active recalls" or "⚠️ Recall Alert"
  isDangerZone: boolean
  summary: string // One-sentence plain English summary
}

/**
 * Rich technical profile for plumbers
 * All the details needed for accurate quoting
 */
export interface RichProfile {
  brand: string
  model: string
  serial: string
  manufactureDate: string
  age: number
  ageYears: string
  fuelType: string
  fuelTypeRaw: ScanResult['fuelType']
  tankSizeGallons: number | null
  tankSizeDisplay: string
  expectedLifeYears: number
  remainingYears: number
  estimatedCostMin: number
  estimatedCostMax: number
  costRange: string
  inputBTU?: number
  inputWatts?: number
  warrantyStatus: string
  installationNotes: string[]
  confidence: number
  processingMethod: string
  validationStatus?: 'verifying' | 'complete' | 'failed'
  validationScore?: number
  questionableFields?: string
}

/**
 * Build simple profile for homeowner view
 */
export function buildSimpleProfile(result: ScanResult): SimpleProfile {
  const age = formatAgeSimple(result.age)
  const remaining = formatRemainingSimple(result.remainingYears)
  const cost = formatCostRange(result.estimatedCostMin, result.estimatedCostMax)
  const color = getRemainingLifeColor(result.remainingYears, result.expectedLifeYears)
  const dangerZone = isDangerZone(result.age, result.remainingYears)
  
  // Simple summary in plain English
  let summary = `${age}. ${remaining}.`
  if (dangerZone) {
    summary += ' Consider planning replacement soon.'
  }
  
  return {
    age,
    remaining,
    remainingColor: color,
    cost,
    recallStatus: 'No active recalls', // TODO: integrate with recall check
    isDangerZone: dangerZone,
    summary
  }
}

/**
 * Build rich technical profile for plumber view
 */
export function buildRichProfile(result: ScanResult): RichProfile {
  const fuelTypeDisplay = formatFuelType(result.fuelType)
  const tankDisplay = result.tankSizeGallons 
    ? `${result.tankSizeGallons} gallons` 
    : 'Tankless'
  
  // Warranty status calculation
  const warrantyYears = result.fuelType.includes('tankless') ? 15 : 6
  const warrantyRemaining = warrantyYears - result.age
  const warrantyStatus = warrantyRemaining > 0
    ? `${warrantyRemaining} years remaining`
    : 'Out of warranty'
  
  // Installation notes based on fuel type
  const installationNotes: string[] = []
  
  if (result.fuelType === 'natural_gas' || result.fuelType === 'propane') {
    installationNotes.push('Gas line connection required')
    installationNotes.push('Venting system required (B-vent or direct vent)')
    installationNotes.push('CO detector recommended within 10 feet')
  }
  
  if (result.fuelType === 'electric') {
    installationNotes.push('240V electrical connection required')
    installationNotes.push('30-50 amp breaker depending on wattage')
  }
  
  if (result.fuelType === 'heat_pump') {
    installationNotes.push('Requires 10x10x7 ft minimum clearance')
    installationNotes.push('Condensate drain required')
    installationNotes.push('Not suitable for cold spaces (<40°F)')
  }
  
  if (result.fuelType.includes('tankless')) {
    installationNotes.push('Minimum flow rate: 0.5 GPM')
    installationNotes.push('Descaling maintenance required annually')
    installationNotes.push('May require gas line upgrade for high BTU models')
  }
  
  installationNotes.push('Expansion tank recommended')
  installationNotes.push('Pressure relief valve required')
  installationNotes.push('Drain pan required if installed above living space')
  
  return {
    brand: result.brand,
    model: result.model,
    serial: result.serial,
    manufactureDate: result.manufactureDate,
    age: result.age,
    ageYears: `${result.age} years`,
    fuelType: fuelTypeDisplay,
    fuelTypeRaw: result.fuelType,
    tankSizeGallons: result.tankSizeGallons,
    tankSizeDisplay: tankDisplay,
    expectedLifeYears: result.expectedLifeYears,
    remainingYears: result.remainingYears,
    estimatedCostMin: result.estimatedCostMin,
    estimatedCostMax: result.estimatedCostMax,
    costRange: formatCostRange(result.estimatedCostMin, result.estimatedCostMax),
    warrantyStatus,
    installationNotes,
    confidence: result.confidence,
    processingMethod: result.processingMethod,
    validationStatus: (result as any).validationStatus,
    validationScore: (result as any).validationScore,
    questionableFields: (result as any).questionableFields
  }
}

/**
 * Check if user should see plumber view (based on role or query param)
 */
export function shouldShowRichView(userRole?: string, forceRich?: boolean): boolean {
  if (forceRich) return true
  if (userRole === 'plumber' || userRole === 'pro') return true
  return false
}

/**
 * Generate job ticket data for "Send to My Plumber" flow
 */
export interface JobTicketData {
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  customerZip?: string
  heaterBrand: string
  heaterModel: string
  heaterSerial: string
  heaterAge: number
  heaterFuelType: string
  heaterTankSize: string
  estimatedCost: string
  urgency: 'low' | 'medium' | 'high'
  notes: string
}

export function buildJobTicket(
  result: ScanResult,
  customerInfo?: {
    name?: string
    email?: string
    phone?: string
    zip?: string
  }
): JobTicketData {
  const richProfile = buildRichProfile(result)
  const simpleProfile = buildSimpleProfile(result)
  
  // Determine urgency
  let urgency: 'low' | 'medium' | 'high' = 'low'
  if (result.remainingYears <= 1) {
    urgency = 'high'
  } else if (result.remainingYears <= 3 || result.age >= 8) {
    urgency = 'medium'
  }
  
  // Generate notes
  const notes = [
    simpleProfile.summary,
    `Manufacture date: ${result.manufactureDate}`,
    `Expected life: ${result.expectedLifeYears} years`,
    `Warranty: ${richProfile.warrantyStatus}`
  ].join('\n')
  
  return {
    customerName: customerInfo?.name,
    customerEmail: customerInfo?.email,
    customerPhone: customerInfo?.phone,
    customerZip: customerInfo?.zip,
    heaterBrand: result.brand,
    heaterModel: result.model,
    heaterSerial: result.serial,
    heaterAge: result.age,
    heaterFuelType: richProfile.fuelType,
    heaterTankSize: richProfile.tankSizeDisplay,
    estimatedCost: richProfile.costRange,
    urgency,
    notes
  }
}
