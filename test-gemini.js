/**
 * Quick test script for Gemini 2.5 Flash-Lite API
 * Tests with your Rheem water heater image
 */

const fs = require('fs');
const path = require('path');

const GEMINI_API_KEY = 'AIzaSyB1XdGAfLRDEU6kLE_7TMhl4gDHMetmJC8';

async function testGemini(imagePath) {
  console.log('🔍 Testing Gemini 2.5 Flash-Lite...\n');
  
  // Read image and convert to base64
  const imageBuffer = fs.readFileSync(imagePath);
  const imageBase64 = imageBuffer.toString('base64');
  
  const prompt = `You are analyzing a water heater data plate label. Extract ALL information EXACTLY as shown.

CRITICAL RULES:
1. Brand: Return ONLY one of: Rheem, AO Smith, Bradford White, State, Kenmore, Whirlpool, GE, American, Reliance, Navien, Rinnai, Noritz
2. Serial Number: Extract COMPLETE serial including ALL spaces/dashes. Example: "RHLN 01 06 534307" NOT "RHLN0106534307"
3. Model Number: Extract full model code. Example: "PROG50-42N RH62"
4. Manufacture Date: Look for "Manufacture Date" or "Mfg Date" label. Return format: "Month YYYY" or "MM/YYYY"
5. Capacity: Tank size in gallons (look for "U.S. Gallons" or "Capacity")
6. Input: BTU/hr rating (look for "Input" or "BTU/hr")
7. Voltage: Electrical voltage (look for "Voltage" or "V")
8. Fuel Type: Determine from context - "gas", "electric", "propane", "tankless-gas", "tankless-electric", "heat-pump"

Return ONLY valid JSON with these exact fields:
{
  "brand": "...",
  "model": "...",
  "serial": "...",
  "manufactureDate": "...",
  "capacity": 50,
  "btu": 42000,
  "voltage": 120,
  "fuelType": "gas"
}

If a field is not visible, use null. DO NOT guess or make up values.`;

  const startTime = Date.now();
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: imageBase64
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 500,
        }
      })
    }
  );
  
  const responseTime = Date.now() - startTime;
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${error}`);
  }
  
  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  
  console.log('📝 Raw Gemini Response:');
  console.log(content);
  console.log('\n');
  
  // Extract JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }
  
  const parsed = JSON.parse(jsonMatch[0]);
  
  console.log('✅ Parsed Results:');
  console.log(JSON.stringify(parsed, null, 2));
  console.log('\n');
  console.log(`⏱️  Response time: ${responseTime}ms`);
  console.log(`💰 Cost: $0.0002`);
  
  return parsed;
}

// Run test
const imagePath = process.argv[2];
if (!imagePath) {
  console.error('Usage: node test-gemini.js <path-to-image>');
  console.error('Example: node test-gemini.js rheem.jpg');
  process.exit(1);
}

testGemini(imagePath)
  .then(() => {
    console.log('\n✅ Test complete!');
  })
  .catch(err => {
    console.error('\n❌ Test failed:', err.message);
    process.exit(1);
  });
