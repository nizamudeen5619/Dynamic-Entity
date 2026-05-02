---
name: Array Field Empty Row Bug Fix
description: Filter empty objects when building FormArrays to prevent phantom empty rows
type: project
originSessionId: d5d30c50-c5d0-43ed-80f1-5f15b3ebed7d
---
## Issue
When adding a new row to an empty array field, two rows appeared:
- Row 1: Empty (phantom row)
- Row 2: User-entered data

Root cause: Record data contained completely empty objects like `{0: {}}` which were being converted to FormGroups and added to FormArrays during form initialization.

## Solution
Filter out completely empty objects in `buildControl()` method in entity-data.service.ts when building FormArrays.

An object is considered empty if ALL properties are:
- null
- undefined
- empty string
- empty arrays

## Implementation
**File:** `Superpower_Web/src/app/commonModules/entity-data-table/service/entity-data.service.ts`

In the array field handling of `buildControl()` method:
```typescript
// Filter out completely empty objects before creating FormGroups
const filteredRows = rows.filter((row: any) => {
    if (!row || typeof row !== 'object') return true;
    return Object.values(row).some(
        (v: any) => v !== null && v !== undefined && v !== '' && (!Array.isArray(v) || v.length > 0)
    );
});

for (const row of filteredRows) {
    const children = (field.children ?? []).filter((c) => c !== undefined);
    fa.push(this.buildArrayItemGroup(children, row));
}
```

## Commit
`fix(array-field): Remove empty objects when building FormArray`

## Impact
- Only affects **form display/initialization** - database data unchanged
- Existing values with real data are preserved
- Only phantom empty objects are filtered out
- Does not affect data sync operations like `syncFieldOptionsToLists`

## Why Single Location
Filtering only happens in `buildControl()` because:
1. That's where FormArrays are initially created from record data
2. Single source of truth prevents duplicate/conflicting logic
3. Covers all paths: section edit, record view, form initialization
