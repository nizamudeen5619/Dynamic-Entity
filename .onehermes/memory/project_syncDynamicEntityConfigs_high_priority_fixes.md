---
name: HIGH priority fixes - O(n²) performance and global state mutation
description: Optimized smart insert from O(n²) to O(n·k) and fixed scope leakage in recursive merge
type: project
originSessionId: 0dfaffdd-1093-4c87-8f78-3c0c6ad5dc54
---
**Task**: Fix two HIGH priority architectural issues in `syncDynamicEntityConfigs()`

**Status**: Complete

---

## Fix 1 — O(n²) Smart Insert → O(n·k) with Map Lookup

**File**: `n:\Work\backup\Superpower-App\src\utils\dynamicEntitySync.helper.js`

**Problem**: Both `mergeFields()` step 2 and `mergeTabs()` step 2 called `findIndex()` (O(n)) inside nested loops over predecessors, resulting in O(k²·n) complexity where k = new items, n = merged items.

**Solution**: 
- Build `mergedIdToIdx = Map<id → index>` before processing new items (O(n))
- Look up positions in O(1) instead of O(n)
- Rebuild map after each splice since indices shift (O(n))
- Total: O(k·n) — linear in practice since k is typically 1–5

**Changes**:
- `mergeFields()` lines 318–344: Added map-based lookup
- `mergeTabs()` lines 383–404: Added map-based lookup

---

## Fix 2 — Global State Mutation in Recursion → Scoped `localPlacedIds`

**File**: `n:\Work\backup\Superpower-App\src\utils\dynamicEntitySync.helper.js`

**Problem**: `placedSchemaFieldIds` is a single global `Set`. When `mergeFields()` recurses for nested fields (array/group children), the same Set is used. If a child field has the same ID as a top-level field already placed (e.g., both `status`), the child is silently skipped in step 2.

**Solution**:
- Add optional `localPlacedIds` parameter to `mergeFields()` (line 275)
- Default to global `placedSchemaFieldIds` for top-level calls (cross-tab deduplication preserved)
- Pass fresh `new Set()` for child recursion (isolated scoping)
- All references inside function changed to use `localPlacedIds`

**Changes**:
- `mergeFields()` signature (line 275): Added `localPlacedIds = placedSchemaFieldIds` parameter
- Line 303: Pass `new Set()` for child recursion
- Lines 307, 321, 342: Changed `placedSchemaFieldIds` to `localPlacedIds`

---

## Impact

✅ **Performance**: Sync for 100+ field entities now completes in linear time instead of quadratic
✅ **Correctness**: Child fields with duplicate IDs are no longer silently lost
✅ **Scope Safety**: Recursion now has proper scope boundaries while preserving global deduplication

**Verification**:
- Entity with 100+ fields syncs without noticeable slowdown
- Array field with child `status` + top-level `status` both appear after sync
- New field added between existing fields inserts at correct position
