# Grok Build Fix Prompt

## Context
Next.js build is failing due to broken TypeScript imports after a code reorganization. The `brain/` directory was moved to `archive/brain-old/` but some files still reference the old paths.

## Current Build Error
```
Type error: Cannot find module '../lib/onDeviceExtractor' or its corresponding type declarations.
in file: ./archive/brain-old/router.ts:3:59
```

## Root Cause
The `vault/private.ts` file imports types from archived brain files:
- `ExtractedData` from `archive/brain-old/on-device.ts`
- `ValuationData` from `archive/brain-old/router.ts`

But those archived files have their own broken imports pointing to non-existent paths.

## Task
Fix the build by resolving the import chain. You have two options:

### Option 1: Define Types Locally (Recommended)
Extract the `ExtractedData` and `ValuationData` type definitions and move them into `vault/private.ts` directly, eliminating the dependency on archived files.

**Steps:**
1. Read `archive/brain-old/on-device.ts` and find the `ExtractedData` interface definition
2. Read `archive/brain-old/router.ts` and find the `ValuationData` interface definition
3. Copy both interface definitions into `vault/private.ts` (add them near the top after the imports)
4. Remove the imports from archived files in `vault/private.ts`
5. Run `pnpm build` to verify it passes

### Option 2: Fix Archive Imports (Not Recommended)
Fix all the broken imports in the archived files so they resolve correctly. This is more complex and touches archived code.

## Files to Modify
- **Primary:** `c:\Users\hambo\Desktop\$IDEAS\waterheater-vault\vault\private.ts`
- **Reference:** `c:\Users\hambo\Desktop\$IDEAS\waterheater-vault\archive\brain-old\on-device.ts` (lines 22-35 for ExtractedData)
- **Reference:** `c:\Users\hambo\Desktop\$IDEAS\waterheater-vault\archive\brain-old\router.ts` (for ValuationData)

## Success Criteria
- `pnpm build` completes successfully with exit code 0
- No TypeScript errors
- The route conflict between `(consumer)/page.tsx` and `(pro)/page.tsx` remains resolved

## Additional Context
The route conflict was already fixed:
- ✅ `app/(pro)/page.tsx` never existed (was already outside the route group)
- ✅ `app/pro/page.tsx` was replaced with a simple protected dashboard placeholder
- ✅ `app/(consumer)/page.tsx` remains as the root homepage
- ✅ `app/(pro)/layout.tsx` still exists for future pro-specific layout

The ONLY remaining issue is the TypeScript import chain in `vault/private.ts`.
