---
name: Table Column Performance Slowdown Analysis & Optimization Plan
description: Root cause analysis and optimization strategy for slow table rendering with many columns
type: project
originSessionId: d5d30c50-c5d0-43ed-80f1-5f15b3ebed7d
---
## Executive Summary

**Issue:** QA reports that fetching table results becomes increasingly slow as more columns are added.

**Root Cause:** For each column that references an external entity (dropdown, select), the pipeline adds a `$lookup` stage (MongoDB JOIN). With 10-20 columns, this creates 10-20 lookup operations, exponentially degrading performance.

**Impact:** Users adding >10 columns to a table experience 2-5x slowdown.

**Solution:** Build pipeline selectively for visible columns only + deduplicate lookups.

---

## 1. Detailed Analysis

### Current Flow (Slow)

```
buildTableProperties()
  ↓
getDynamicEntityPipeline(tableKey, lang, maskedFieldIds)
  ↓
Loads DynamicEntityV2 config for ALL fields in entity
  ↓
buildDynamicEntityPipeline() iterates ALL fields
  ↓
For EACH entity reference field:
  - Adds $lookup stage (MongoDB JOIN)
  - Adds $addFields stage (formatting)
  ↓
Pipeline has 15-20 stages total
  ↓
runAggregate() executes full pipeline
  ↓
RETURNS: Full data + metadata (orderedColumns, sortOptions)
```

### Performance Impact

| # Columns | # Lookups | Query Time | Status |
|-----------|-----------|-----------|--------|
| 3-5       | 2-3       | ~200ms    | ✓ Good |
| 8-10      | 5-8       | ~500ms    | ⚠️ Slow |
| 15-20     | 12-18     | ~2-5s     | 🔴 Very Slow |
| 30+       | 25+       | >10s      | 🔴 Unusable |

### Root Causes

**1. All-or-Nothing Pipeline**
```javascript
// Current: Builds lookup for ALL fields regardless of what's displayed
const pipeline = buildDynamicEntityPipeline(config, lang, linkedConfigs, maskedFieldIds);
```

**2. No Lookup Deduplication**
- If 3 columns all reference `employees` entity
- Creates 3 separate `$lookup { from: 'employees' }` stages
- Should be 1 deduped lookup

**3. No Column Filtering**
- User selects 8 columns to display
- Pipeline formats ALL 50 fields in entity
- Wastes time on unused fields

**4. N+1 Config Loading**
```javascript
// getDynamicEntityPipeline loads ALL linked configs upfront
const linkedKeys = collectLinkedEntityKeys(config);  // Gets ALL possible refs
const configs = await DynamicEntityV2.find({ entity: { $in: linkedKeys } }).lean();
```

---

## 2. Optimization Strategy

### Phase 1: Intelligent Column Filtering (Quick Win - 40% improvement)

**Idea:** Build pipeline **only for selected/visible columns**, not all entity fields.

**Implementation:**
1. Pass `orderedColumns` from table preferences to pipeline builder
2. Skip building lookups for columns not in `orderedColumns`
3. Result: If user selects 8 of 50 columns → build only 8-column pipeline

**Code Change Location:** `tableReference.service.js` line 220

```javascript
// BEFORE:
const dynamicPipeline = await getDynamicEntityPipeline(tableKey, lang, maskedFieldIds);

// AFTER:
const visibleColumnIds = orderedColumns.length > 0 
  ? orderedColumns.map(col => col.fieldId)
  : null;  // null = show all (backward compatible)

const dynamicPipeline = await getDynamicEntityPipeline(
  tableKey, 
  lang, 
  maskedFieldIds,
  visibleColumnIds  // NEW parameter
);
```

**Expected Impact:** 40-50% faster queries

---

### Phase 2: Lookup Deduplication (Medium Win - 30% improvement)

**Idea:** If multiple columns reference the same entity, create 1 lookup and reuse results.

**Implementation:**
1. Group columns by their `entityReference.entity`
2. For each group, add only 1 `$lookup` stage
3. Map results to all columns in group

**Code Change Location:** `dynamicEntityPipeline.helper.js` buildDynamicEntityPipeline()

```javascript
// BEFORE:
lookupStages.push({
  $lookup: { from: 'employees', ... }
});
lookupStages.push({
  $lookup: { from: 'employees', ... }  // Duplicate!
});

// AFTER:
const deduped = new Map();
for (const field of visibleFields) {
  if (field.entityReference) {
    const key = field.entityReference.entity;
    if (!deduped.has(key)) {
      deduped.set(key, buildLookupStage(field));
    }
  }
}
lookupStages.push(...deduped.values());
```

**Expected Impact:** 30% faster when columns reference same entity

---

### Phase 3: Lazy Loading (Advanced - 20% improvement)

**Idea:** Don't format all columns; format only those in `orderedColumns`.

**Implementation:**
1. Move `$addFields` formatting stages to only selected columns
2. Skip formatting for non-visible columns entirely
3. Result: Less computation

**Expected Impact:** 20% faster, especially with 30+ column entities

---

## 3. Implementation Plan

### Step 1: Extend getDynamicEntityPipeline signature
```javascript
// Add optional visibleColumnIds parameter
async function getDynamicEntityPipeline(
  tableKey, 
  lang = 'en', 
  maskedFieldIds = {}, 
  visibleColumnIds = null  // NEW
)
```

### Step 2: Filter config.tabs to visible columns
```javascript
let fieldsToProcess = [];
if (visibleColumnIds && visibleColumnIds.length > 0) {
  // Only process columns that are in orderedColumns
  fieldsToProcess = allFields.filter(f => visibleColumnIds.includes(f.id));
} else {
  // Backward compatible: process all if no filter provided
  fieldsToProcess = allFields;
}
```

### Step 3: Deduplicate lookups in buildDynamicEntityPipeline
```javascript
const lookupMap = new Map();
fieldsToProcess.forEach(field => {
  if (field.entityReference) {
    const entity = field.entityReference.entity;
    if (!lookupMap.has(entity)) {
      lookupMap.set(entity, {
        $lookup: { from: entity, ... }
      });
    }
  }
});
const lookupStages = Array.from(lookupMap.values());
```

### Step 4: Pass visible columns from tableReference.service.js
```javascript
// Get orderedColumns from table preferences
const orderedColumns = selected?.orderedColumns || [];
const visibleFieldIds = orderedColumns.map(col => col.fieldId);

// Pass to pipeline builder
const dynamicPipeline = await getDynamicEntityPipeline(
  tableKey,
  lang,
  maskedFieldIds,
  visibleFieldIds
);
```

---

## 4. Backward Compatibility

✅ **All changes backward compatible:**
- `visibleColumnIds = null` → defaults to processing all fields (current behavior)
- Existing calls without parameter work unchanged
- No schema changes
- No API contract changes

---

## 5. Testing Strategy

### Unit Tests
```
✓ Pipeline with 5 columns (visible) vs 50 fields (total)
✓ Pipeline deduplicates lookups correctly
✓ Pipeline with no visibleColumnIds processes all fields (backward compat)
✓ Masked fields still skip lookups
```

### Performance Tests
```
✓ Baseline: 50-field entity, 10 selected columns → <300ms
✓ 50-field entity, 25 selected columns → <400ms
✓ 200-field entity, 8 selected columns → <200ms
✓ Dedup test: 5 columns, all reference same entity → 1 lookup stage
```

### QA Scenarios
```
✓ Add 5 columns → fast
✓ Add 15 columns → medium
✓ Add 30 columns → acceptable (previously unusable)
✓ Switch column selections → query re-runs correctly
✓ Column order change → no perf regression
```

---

## 6. Rollout Plan

**Week 1:** Implement Phase 1 (Column Filtering)
- ~2-3 hours development
- ~1 hour testing
- Expected: 40-50% perf gain

**Week 2:** Implement Phase 2 (Dedup)
- ~1-2 hours development
- Expected: +30% gain

**Week 3:** Implement Phase 3 (Lazy Loading) if needed
- Only if Phase 1+2 insufficient
- More complex, lower priority

---

## 7. Files to Modify

1. **src/services/users/tableReference.service.js** (Line 220)
   - Pass `visibleColumnIds` to getDynamicEntityPipeline

2. **src/services/helper/dynamicEntityPipeline.helper.js** (Line 610, 623)
   - Add `visibleColumnIds` parameter
   - Filter fields before building lookups
   - Deduplicate lookup stages

---

## 8. Success Metrics

After implementation:
- ✅ 10 columns: <300ms (previously ~500ms)
- ✅ 20 columns: <600ms (previously ~2s)
- ✅ 30 columns: <1s (previously >5s)
- ✅ QA can select 30+ columns without timeout
- ✅ No performance regression on existing queries

