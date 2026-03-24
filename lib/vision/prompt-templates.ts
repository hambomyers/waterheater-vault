/**
 * Prompt templates for on-device vision models
 * Keep prompts minimal and focused - on-device models have limited context
 */

/**
 * System prompt for Phi-4-reasoning-vision when analyzing water heater data plates
 */
export const PHI4_WATER_HEATER_SYSTEM = `You are analyzing a water heater data plate image.

Extract these fields ONLY:
- brand (manufacturer name)
- model (full model number)
- serial (serial number)
- fuelType (natural_gas, propane, electric, heat_pump, tankless-gas, or tankless-electric)
- tankSizeGallons (number or null for tankless)
- inputBTU (for gas) or watts (for electric)

Calculate manufacture date from serial number using these patterns:
- Rheem/Ruud: WWYY format at position 2 (e.g., 0423 = week 04, 2023)
- A.O. Smith/State: YYWW format at position 0 (e.g., 2304 = 2023 week 04)
- Bradford White: BWL format (letter codes for year/week)
- Navien: YYYYMM format at position 0
- Rinnai: YYMM format at position 2
- Noritz: YYWW format at position 0
- Bosch: YYYYWW format at position 0
- GE: LETTER_YY format (A=Jan, B=Feb, etc.)

Return JSON only. No explanation.`

/**
 * User prompt template for water heater analysis
 */
export function createWaterHeaterPrompt(extractedText: string): string {
  return `Extracted text from data plate:
${extractedText}

Return JSON with these fields:
{
  "brand": "string",
  "model": "string", 
  "serial": "string",
  "manufactureDate": "YYYY-MM-DD",
  "fuelType": "natural_gas|propane|electric|heat_pump|tankless-gas|tankless-electric",
  "tankSizeGallons": number or null,
  "inputBTU": number or null,
  "confidence": 0-100
}`
}

/**
 * Fallback prompt for Grok Vision API (more detailed, cloud-based)
 */
export const GROK_VISION_SYSTEM = `You are an expert at reading water heater data plates and extracting technical specifications.

Analyze the image and extract:
1. Brand/manufacturer
2. Model number (complete, including all letters and numbers)
3. Serial number
4. Manufacture date (decode from serial using brand-specific patterns)
5. Fuel type (natural gas, propane, electric, heat pump, or tankless)
6. Tank size in gallons (or null for tankless)
7. Input BTU (gas) or watts (electric)
8. Expected lifespan (typical: 8-12 years for tank, 15-20 for tankless)

Serial number decode patterns by brand:
- Rheem/Ruud: WWYY at position 2 (week, year)
- A.O. Smith/State/American: YYWW at position 0
- Bradford White: BWL format (letter=year, numbers=week)
- Navien: YYYYMM at position 0
- Rinnai: YYMM at position 2
- Noritz: YYWW at position 0
- Bosch: YYYYWW at position 0
- GE/GEO: LETTER_YY (A=Jan, B=Feb, etc.)

Return structured JSON with confidence score (0-100).`

/**
 * Simple prompt for quick brand/model extraction
 */
export function createQuickExtractionPrompt(): string {
  return `Extract only:
- Brand name
- Model number
- Serial number

Return as JSON. Be precise.`
}
