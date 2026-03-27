# Water Heater Scanner - Confidence Validation System Design

## Current State
- Gemini 2.5 Flash-Lite extracts water heater data in 2-3 seconds
- Shows 0% confidence (missing field)
- React hydration errors (non-critical)
- Image storage implemented for AI learning

## Core Problem
Need REAL confidence metric, not fake/mock scores. Users need to trust the data accuracy.

## Proposed Solution: Two-Stage Confidence System

### Stage 1: Instant Results (2-3 seconds)
- Gemini extracts: Brand, Model, Serial, Manufacture Date, Capacity, Fuel Type
- Calculate **base confidence** from data completeness:
  - Brand detected: +25%
  - Model detected: +20%
  - Serial detected: +25%
  - Manufacture date parsed: +20%
  - Tank size matches model: +10%
  - Serial pattern matches brand format: +15%
  - Model exists in catalog: +10%
  - Age calculation reasonable: +10%
  - Cap at 95% for initial display

### Stage 2: Validation Layer (Background, +5-8 seconds)
- Use Brave Search API to validate Gemini's extraction
- Store original image in flywheel database
- Cross-reference against real-world data
- Provide **validation confidence** score 1-10

## Technical Implementation

### Backend Changes (smart-scan.ts)
```typescript
// 1. Return immediate results with base confidence
const baseConfidence = calculateBaseConfidence(geminiResult)

// 2. Store image + extraction for learning
await storeScanResult(imageId, geminiResult, imageBuffer)

// 3. Async validation with Brave
const validationPromise = validateWithBrave(geminiResult, env.BRAVE_API_KEY)

// 4. Return initial response
return {
  ...geminiResult,
  confidence: baseConfidence,
  validationStatus: 'verifying',
  imageId
}
```

### Brave Validation Logic
```typescript
async function validateWithBrave(extraction: any, apiKey: string) {
  // Search for brand + model + specifications
  const query = `${extraction.brand} ${extraction.model} water heater specifications`
  const searchResults = await braveSearch(apiKey, query)
  
  // Validate key fields against search results
  const validationScore = calculateValidationScore(extraction, searchResults)
  
  // Return 1-10 score
  return {
    score: validationScore,
    verifiedFields: [...],
    questionableFields: [...]
  }
}
```

### Frontend Changes (scan page)
```typescript
// Real-time confidence updates
const [confidence, setConfidence] = useState(baseConfidence)
const [validationStatus, setValidationStatus] = useState('verifying')

// WebSocket or polling for validation updates
useEffect(() => {
  const checkValidation = async () => {
    const result = await fetch(`/api/consumer/validation/${imageId}`)
    if (result.validationComplete) {
      setConfidence(result.confidence)
      setValidationStatus('validated')
    }
  }
  
  const interval = setInterval(checkValidation, 1000)
  return () => clearInterval(interval)
}, [])
```

## UI/UX Design

### Initial Display
```
Age: 18 years
Confidence: 78%
⚪ Verifying with web search...
[Subtle pulsing animation]
```

### After Validation
```
Age: 18 years
Confidence: 9/10 ✓
✅ Validated by web search
```

### Low Confidence (< 8/10)
```
Age: 18 years
Confidence: 6/10 ⚠️
⚠️ Double-check: Model number, Fuel type
[Edit buttons for questionable fields]
```

## Database Schema Additions

### Validation Results Table
```sql
CREATE TABLE validation_results (
  id TEXT PRIMARY KEY,
  image_id TEXT NOT NULL,
  validation_score INTEGER NOT NULL,
  verified_fields TEXT,
  questionable_fields TEXT,
  search_query TEXT,
  search_results TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (image_id) REFERENCES scan_images(id)
);
```

### Image Storage Enhancement
```sql
ALTER TABLE scan_results ADD COLUMN original_image_url TEXT;
ALTER TABLE scan_results ADD COLUMN validation_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE scan_results ADD COLUMN validation_score INTEGER;
```

## Flywheel Learning System

### Data Collection
- Original water heater label images
- Gemini extraction results
- Brave validation results
- User corrections/edits

### Learning Loop
1. Store every scan + image
2. Track which extractions get validated vs questioned
3. Identify patterns in low-confidence extractions
4. Improve Gemini prompts based on failures
5. Build brand-specific pattern recognition

### Success Metrics
- Validation success rate by brand
- Common extraction errors
- User correction frequency
- Confidence score accuracy

## Technical Challenges & Solutions

### 1. React Hydration Errors
- **Cause**: Server/client HTML mismatch in pro marketing page
- **Solution**: Use `useEffect` for dynamic content, ensure consistent styling

### 2. API Response Time
- **Challenge**: Brave API adds latency
- **Solution**: Async validation, real-time updates

### 3. Cost Management
- **Brave API**: $0.001 per search
- **Gemini**: $0.0002 per scan
- **Total**: ~$0.0012 per scan (still very cheap)

### 4. False Positives
- **Risk**: Brave validates incorrect data
- **Solution**: Multiple source validation, confidence thresholds

## Development Plan

### Phase 1: Base Confidence (Week 1)
1. Implement `calculateBaseConfidence()` function
2. Fix 0% confidence display
3. Add data completeness scoring
4. Test with real water heater images

### Phase 2: Brave Validation (Week 2)
1. Implement `validateWithBrave()` function
2. Add validation results table
3. Create validation endpoint
4. Test validation accuracy

### Phase 3: Real-time UI (Week 3)
1. Add pulsing "verifying" UI
2. Implement real-time confidence updates
3. Add low-confidence warnings
4. Test user experience

### Phase 4: Flywheel Learning (Week 4)
1. Enhance image storage system
2. Add pattern learning from validation results
3. Implement Gemini prompt improvements
4. Measure accuracy improvements

## Competitive Advantages

1. **Real Confidence**: Not fake scores, based on actual validation
2. **Data Moat**: Image database + validation patterns
3. **Self-Improving**: Gets more accurate with every scan
4. **User Trust**: Shows when data is questionable
5. **Cost Effective**: <$0.002 per scan with validation

## Success Criteria
- Confidence scores reflect actual accuracy
- Users trust low-confidence warnings
- Validation accuracy > 90%
- Scan completion rate remains > 95%
- System learns from each scan

## Future Enhancements
1. Multiple validation sources (manuals, recall databases)
2. User feedback loop for corrections
3. Brand-specific optimization
4. HVAC equipment expansion
5. Insurance API integration

---

**Request for Grok Review**: Please analyze this design and provide:
1. Technical feasibility assessment
2. Potential improvements or simplifications
3. Missing considerations
4. Implementation priorities
5. Alternative approaches
