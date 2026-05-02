---
name: Smart insert for new schema tabs/fields at logical position
description: New tabs/fields insert after closest preceding schema item instead of appending at end
type: project
originSessionId: 0dfaffdd-1093-4c87-8f78-3c0c6ad5dc54
---
**Task**: Fix order preservation in `syncDynamicEntityConfigs()` so new schema fields/tabs appear at their logical position based on schema order, not appended at the end.

**Status**: Complete

**Implementation** (file: `n:\Work\backup\Superpower-App\src\utils\dynamicEntitySync.helper.js`):

1. **mergeFields() step 2 (lines 315-339)**: Smart insert logic
   - For each new field, find the closest preceding field from the schema that exists in the merged list
   - Insert new field right after that predecessor
   - If no predecessor exists (new field is earliest in schema), prepend it

2. **mergeTabs() step 2 (lines 377-394)**: Smart insert logic
   - Same algorithm applied to tabs
   - Walk backwards through schema to find closest preceding tab
   - Insert new tab after it, or prepend if no predecessor

**Result**: 
- New fields/tabs appear in their intended schema position relative to existing items
- User's reordering of existing items is fully preserved
- Multiple new items maintain their relative schema order

**Example**:
- Schema: `[A, B, C, D, E]` (E is new after D)
- User order: `[C, A]` (B and D deleted by user)
- After sync: `[C, E, A]` (E inserted after C, its closest schema predecessor)
