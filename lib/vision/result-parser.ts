/**
 * Result parser utilities for vision scan results
 * Handles validation, normalization, and transformation of scan data
 */

import type { ScanResult } from './on-device-scanner'

/**
 * Validate scan result has all required fields
 */
export function validateScanResult(result: Partial<ScanResult>): result is ScanResult {
  const required = ['brand', 'model', 'serial', 'manufactureDate', 'age', 'fuelType']
  
  for (const field of required) {
    if (!(field in result) || result[field as keyof ScanResult] === null || result[field as keyof ScanResult] === undefined) {
      console.error(`Missing required field: ${field}`)
      return false
    }
  }
  
  return true
}

/**
 * Normalize brand names to standard format
 */
export function normalizeBrand(brand: string): string {
  const normalized = brand.toLowerCase().trim()
  
  const brandMap: Record<string, string> = {
    'rheem': 'Rheem',
    'ruud': 'Rheem',
    'ao smith': 'A.O. Smith',
    'a.o. smith': 'A.O. Smith',
    'a o smith': 'A.O. Smith',
    'aosmith': 'A.O. Smith',
    'state': 'A.O. Smith',
    'american': 'A.O. Smith',
    'bradford white': 'Bradford White',
    'bradfordwhite': 'Bradford White',
    'navien': 'Navien',
    'rinnai': 'Rinnai',
    'noritz': 'Noritz',
    'bosch': 'Bosch',
    'ge': 'GE',
    'general electric': 'GE',
    'whirlpool': 'Whirlpool',
    'kenmore': 'Kenmore',
    'reliance': 'Reliance'
  }
  
  return brandMap[normalized] || brand
}

/**
 * Calculate estimated replacement cost based on specs
 */
export function calculateEstimatedCost(
  fuelType: ScanResult['fuelType'],
  tankSizeGallons: number | null
): { min: number; max: number } {
  // Tankless units
  if (tankSizeGallons === null || fuelType.includes('tankless')) {
    if (fuelType === 'tankless-gas') {
      return { min: 2000, max: 3500 }
    } else {
      return { min: 1500, max: 2500 }
    }
  }
  
  // Tank units by fuel type and size
  if (fuelType === 'natural_gas' || fuelType === 'propane') {
    if (tankSizeGallons <= 40) {
      return { min: 900, max: 1200 }
    } else if (tankSizeGallons <= 50) {
      return { min: 1000, max: 1400 }
    } else if (tankSizeGallons <= 75) {
      return { min: 1300, max: 1800 }
    } else {
      return { min: 1600, max: 2200 }
    }
  }
  
  if (fuelType === 'electric') {
    if (tankSizeGallons <= 40) {
      return { min: 700, max: 950 }
    } else if (tankSizeGallons <= 50) {
      return { min: 750, max: 1100 }
    } else if (tankSizeGallons <= 75) {
      return { min: 1000, max: 1400 }
    } else {
      return { min: 1200, max: 1700 }
    }
  }
  
  if (fuelType === 'heat_pump') {
    return { min: 1800, max: 3000 }
  }
  
  // Default fallback
  return { min: 1000, max: 1500 }
}

/**
 * Calculate expected lifespan based on fuel type
 */
export function calculateExpectedLife(fuelType: ScanResult['fuelType']): number {
  if (fuelType.includes('tankless')) {
    return 20 // Tankless units last longer
  }
  
  if (fuelType === 'heat_pump') {
    return 15 // Heat pump units
  }
  
  if (fuelType === 'natural_gas' || fuelType === 'propane') {
    return 12 // Gas tank units
  }
  
  return 11 // Electric tank units
}

/**
 * Format age for display (homeowner-friendly)
 */
export function formatAgeSimple(age: number): string {
  if (age === 0) return 'Brand new'
  if (age === 1) return '1 year old'
  return `${age} years old`
}

/**
 * Format remaining life for display (homeowner-friendly)
 */
export function formatRemainingSimple(remaining: number): string {
  if (remaining <= 0) return 'Replace now'
  if (remaining === 1) return '~1 year remaining'
  if (remaining <= 3) return `~${remaining} years remaining (plan soon)`
  return `~${remaining} years remaining`
}

/**
 * Get color code for remaining life gauge
 */
export function getRemainingLifeColor(remaining: number, expected: number): 'green' | 'amber' | 'red' {
  const percentage = (remaining / expected) * 100
  
  if (percentage > 40) return 'green'
  if (percentage > 20) return 'amber'
  return 'red'
}

/**
 * Format cost range for display
 */
export function formatCostRange(min: number, max: number): string {
  return `$${min.toLocaleString()}–$${max.toLocaleString()}`
}

/**
 * Convert fuel type to display string
 */
export function formatFuelType(fuelType: ScanResult['fuelType']): string {
  const fuelMap: Record<ScanResult['fuelType'], string> = {
    'natural_gas': 'Natural Gas',
    'propane': 'Propane',
    'electric': 'Electric',
    'heat_pump': 'Heat Pump Electric',
    'tankless-gas': 'Tankless Gas',
    'tankless-electric': 'Tankless Electric'
  }
  
  return fuelMap[fuelType] || fuelType
}

/**
 * Check if water heater is in "danger zone" (needs attention soon)
 */
export function isDangerZone(age: number, remaining: number): boolean {
  return age >= 8 || remaining <= 3
}

/**
 * Generate simple summary text for homeowners
 */
export function generateSimpleSummary(result: ScanResult): string {
  const age = formatAgeSimple(result.age)
  const remaining = formatRemainingSimple(result.remainingYears)
  const cost = formatCostRange(result.estimatedCostMin, result.estimatedCostMax)
  
  return `${age}. ${remaining}. Estimated replacement: ${cost}.`
}
