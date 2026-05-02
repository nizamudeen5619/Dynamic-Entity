---
name: Fix syncDynamicEntityConfigs merge logic to preserve user customizations
description: Implemented 3 fixes to prevent sync from erasing field options, deleted fields, and permissions
type: project
originSessionId: 0dfaffdd-1093-4c87-8f78-3c0c6ad5dc54
---
**Task**: Make `syncDynamicEntityConfigs()` preserve user customizations when syncing entity configs from metadata JSON files.

**Status**: Complete

**Problem**: 
- User-edited field options were overwritten by schema defaults
- Fields deleted by users re-appeared after sync
- Tab/field maskData and permissions were lost on sync

**Implementation** (file: `n:\Work\backup\Superpower-App\src\utils\dynamicEntitySync.helper.js`):

1. **Helper function added (lines 256-271)**: `collectAllExistingFieldKeys()` — builds a Set of all field IDs and refererFields that exist in the current DB entity, used to detect deleted fields.

2. **mergeFields() updated (lines 296, 299-300)**: 
   - Preserve `options` from DB if user has customized them
   - Preserve `maskData` and `permissions` from DB

3. **mergeFields() step 2 updated (lines 317-325)**:
   - Only re-add schema fields if they're truly new to the entity
   - Skip re-adding fields the user deliberately deleted

4. **mergeTabs() updated (lines 349-350)**:
   - Preserve tab-level `maskData` and `permissions` from DB

**Preserved customizations** (after fix):
- ✅ Field visibility, order, label
- ✅ Tab order, visibility, label
- ✅ Custom tabs/fields
- ✅ **Field options (newly preserved)**
- ✅ **Deleted fields stay deleted (newly preserved)**
- ✅ **Field/tab maskData and permissions (newly preserved)**
- ✅ New schema fields are still added

**Verification**: Run pre-deployment with `Dynamic Entity Sync` enabled → changes to field visibility, options, deleted fields, and permissions persist.
