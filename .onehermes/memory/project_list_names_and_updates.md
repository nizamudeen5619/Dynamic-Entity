---
name: List Names and Record Updates Stabilization
description: Commit d0217c78 - stabilized list names using entity key + field ID, improved record update handling
type: project
originSessionId: 751f1096-f34d-4a81-9428-45c0f81877c0
---
## Changes Made
**Branch:** 1H-REL-MASTER  
**Commit:** d0217c78  
**Date:** 2026-04-16

### 1. Stabilized List Names (dynamicEntity-v2.service.js:210-214)

**Problem:** List names were generated from entity name + field label. When field labels changed, the list name changed, creating orphaned lists and duplicates.

**Solution:** Use stable identifiers - entity key + field ID (both capitalized)
```javascript
// Before:
return `${(entityNameEn || '').toUpperCase()} - ${(labelEn || '').toUpperCase()}`;

// After:
return `${(entityKey || '').toUpperCase()} - ${(fieldId || '').toUpperCase()}`;
```

**Impact:** List names now remain stable regardless of field label updates. No more orphaned lists.

### 2. Improved Record Update Handling (dynamicEntityForm-v2.service.js:486-501)

**Problem:** Used `findOneAndUpdate` with `$set` which bypasses Mongoose schema validation. This caused issues with dynamic fields and Mixed arrays.

**Solution:** Use `findById` + `Object.assign` + `.save()` to trigger proper schema validation
```javascript
// Fetch live document
const record = await Model.findById(queryId);

// Apply updates
Object.assign(record, convertDateStrings(updates));
record.markModified(Object.keys(updates));

// Save with validation
await record.save({ runValidators: true });
```

**Impact:** Proper schema validation on updates, better handling of dynamic fields.

## Attempts That Didn't Work

### _id Generation for Array Subdocuments
- **Tried:** Multiple approaches to auto-generate `_id` for array objects (facilities, services, etc.)
- **Issues:**
  - With `strict: false`, Mongoose doesn't enforce subdocument schemas
  - `ensureSubdocumentIds()` function created IDs but they were stored as buffers, not BSON ObjectIds
  - `SubdocumentSchema` approach with `{ _id: true }` created proper ObjectIds, but user decided they don't need subdocuments
- **Status:** Reverted - user chose to keep full `strict: false` without explicit array schemas

## Why This Matters

**List Names:** Field label changes are common during configuration updates. Stable list names prevent data fragmentation and maintain referential integrity in the List model.

**Record Updates:** Proper schema validation ensures consistent data handling, especially important for dynamic entity configurations where field types and structures vary.

## Testing Done
- Verified list name generation uses entity key + field ID
- Confirmed record updates apply schema validation
- Reverted subdocument _id attempts to keep schema fully flexible
