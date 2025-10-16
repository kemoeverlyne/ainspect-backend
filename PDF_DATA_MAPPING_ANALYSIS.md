# PDF Data Mapping Analysis

## Current Situation

The PDF generation system has **TWO different data structures** being used:

### 1. Frontend Template (`StandardReportPDFTemplate.tsx`)
Expects this data structure:
```typescript
{
  id: string;
  address: string;
  date: string;
  inspector: { name, company, phone, email, license };
  client: { name, phone, email };
  summary: {
    overallScore: number;        // ❌ NOT in backend
    totalIssues: number;          // ❌ NOT in backend  
    criticalIssues: number;       // ❌ NOT in backend
    safetyIssues: number;         // ✅ EXISTS
  };
  systems: { [key]: { name, status, issueCount, ... } };
}
```

### 2. Backend PDF Generator (`pdfGenerator.ts`)
Currently uses:
```typescript
{
  reportData: {
    summary: {
      itemsPassed: number;        // ✅ Generated
      itemsFailed: number;        // ✅ Generated
      safetyIssues: number;       // ✅ Generated
      majorDefects: number;       // ✅ Generated
      totalItems: number;         // ✅ Generated
      overallCondition: string;   // ✅ Generated
      complianceScore: number;    // ✅ Generated
      
      // MISSING from backend:
      overallScore: number;       // ❌ Should be alias for complianceScore
      totalIssues: number;        // ❌ Should be alias for itemsFailed
      criticalIssues: number;     // ❌ Should be alias for majorDefects
    };
  };
}
```

## The Problem

When the frontend saves inspection data, it populates:
- `summary.itemsPassed`
- `summary.itemsFailed`
- `summary.safetyIssues`
- `summary.majorDefects`
- `summary.complianceScore`
- `summary.overallCondition`

But the frontend template expects **DIFFERENT field names**:
- `summary.overallScore` (not `complianceScore`)
- `summary.totalIssues` (not `itemsFailed`)
- `summary.criticalIssues` (not `majorDefects`)

## The Solution

We have **THREE options**:

### Option 1: Update Backend to Include BOTH Sets of Fields (RECOMMENDED) ✅
Add aliases in the backend when generating PDFs:

```typescript
summary: {
  // Current fields (keep these)
  itemsPassed: data.itemsPassed,
  itemsFailed: data.itemsFailed,
  safetyIssues: data.safetyIssues,
  majorDefects: data.majorDefects,
  complianceScore: data.complianceScore,
  
  // Add aliases for template compatibility
  overallScore: data.complianceScore,      // Alias
  totalIssues: data.itemsFailed,            // Alias
  criticalIssues: data.majorDefects,        // Alias
}
```

**Pros:**
- ✅ Backward compatible
- ✅ Works with existing frontend template
- ✅ No frontend changes needed
- ✅ Simple to implement

**Cons:**
- ❌ Some data duplication (minimal)

### Option 2: Update Frontend Template to Use Backend Fields
Change `StandardReportPDFTemplate.tsx` to use backend field names.

**Pros:**
- ✅ Single source of truth for field names
- ✅ No data duplication

**Cons:**
- ❌ Have to update template
- ❌ May break if template is shared/reused elsewhere

### Option 3: Add Data Transformer
Create a transformer function that converts backend data to template format.

**Pros:**
- ✅ Clean separation of concerns
- ✅ Flexible

**Cons:**
- ❌ More complex
- ❌ Extra processing step

---

## Recommended Implementation

**Go with Option 1** - Add aliases in backend PDF generation route.

### Where to Fix

File: `ainspect-backend/server/routes.ts` (lines 242-261)

**Current code:**
```typescript
const standardData = {
  id: inspection.id,
  clientName: ...,
  // ...
  reportData: reportDataObj,  // ❌ Direct passthrough
  status: inspection.status || 'completed'
};
```

**Updated code:**
```typescript
const standardData = {
  id: inspection.id,
  clientName: ...,
  // ...
  reportData: {
    ...reportDataObj,
    summary: {
      ...(reportDataObj.summary || {}),
      // Add aliases for template compatibility
      overallScore: reportDataObj.summary?.complianceScore || 0,
      totalIssues: reportDataObj.summary?.itemsFailed || 0,
      criticalIssues: reportDataObj.summary?.majorDefects || 0,
    }
  },
  status: inspection.status || 'completed'
};
```

---

## Current Backend PDF HTML Generation

The backend's `createStandardReportHTML` method **already uses** the correct fields:
- ✅ `reportData.summary.itemsPassed` (line 918)
- ✅ `reportData.summary.itemsFailed` (line 922)
- ✅ `reportData.summary.safetyIssues` (line 926)
- ✅ `reportData.summary.majorDefects` (line 930)

But the frontend template expects:
- ❌ `summary.overallScore`
- ❌ `summary.totalIssues`
- ❌ `summary.criticalIssues`

---

## Action Items

1. ✅ Update `routes.ts` to add field aliases
2. ✅ Test PDF generation with new fields
3. ✅ Verify template receives correct data
4. ✅ Confirm "overallScore", "totalIssues", "criticalIssues" appear in PDF

---

**Status:** Ready to implement  
**Impact:** Medium - Fixes data mapping for template  
**Breaking Changes:** None  


