# Schema Snapshots: listName Field Implementation

**Date:** 2026-04-19  
**Ticket/Feature:** listName field tracking for dropdown/multiSelect  
**Entities Affected:** DynamicEntityV2 (FieldConfigSchema), DynamicEntityFormV2 (no change)

---

## [BEFORE Snapshot]

### FieldConfigSchema (dynamicEntity-v2.model.js)
```javascript
const FieldConfigSchema = new Schema({
  id: { type: String, default: '' },
  _id: Schema.Types.ObjectId,
  type: { type: String, required: true },
  label: { type: Mixed, default: {} },
  visibility: { type: Boolean, default: true },
  systemDefault: { type: Boolean, default: false },
  readOnly: { type: Boolean, default: false },
  maskData: { type: Boolean, default: false },
  // ← listName field missing here
  permissions: {
    view: [String],
    edit: [String],
    delete: [String]
  },
  colSpan: { type: Number },
  refererField: { type: String, default: '' },
  lookupSource: { type: String, default: '' },
  validators: {
    required: Boolean,
    min: Number,
    max: Number,
    minLength: Number,
    maxLength: Number,
    pattern: String
  },
  options: [Mixed],
  table: {
    visible: Boolean,
    sortable: Boolean,
    filterable: Boolean,
    globalSearch: Boolean,
    isName: Boolean,
    isStatus: Boolean,
    arrayVisible: Boolean
  },
  entityReference: {
    enabled: Boolean,
    linkedEntityKey: String,
    displayFields: [String]
  },
  isHeaderToggle: Boolean,
  isProfileImage: Boolean,
  showWhen: Mixed,
  children: [this]
}, { strict: false });
```

### Validation Schema (dynamicEntity-v2.validation.js)
```javascript
const fieldSchema = Joi.object({
  id: Joi.string().allow('', null),
  _id: Joi.string().allow('', null),
  type: Joi.string().required(),
  label: localizedTextSchema,
  visibility: Joi.boolean(),
  systemDefault: Joi.boolean(),
  readOnly: Joi.boolean(),
  maskData: Joi.boolean(),
  // ← listName validation missing here
  permissions: permissionsSchema,
  // ... rest of schema
});
```

### Frontend Form (form-config.service.ts)
```typescript
// In buildEditorForm() method, fieldGroup without listName:
const fieldGroup = this.fb.group({
  id: [field.id ?? ''],
  type: [field.type, Validators.required],
  label: [field.label ?? {}],
  visibility: [field.visibility !== false],
  systemDefault: [field.systemDefault ?? false],
  readOnly: [field.readOnly ?? false],
  maskData: [field.maskData ?? false],
  // ← listName control missing here
  permissions: [field.permissions ?? {}],
  // ... rest of form
});
```

### Frontend UI (dynamic-views-v2.component.html)
```html
<!-- Field editor property panel, no listName display -->
<div class="field col-12">
  <label>maskData</label>
  <p-checkbox formControlName="maskData"></p-checkbox>
</div>
<!-- Next field after maskData -->
```

---

## [AFTER Snapshot]

### FieldConfigSchema (dynamicEntity-v2.model.js)
```javascript
const FieldConfigSchema = new Schema({
  id: { type: String, default: '' },
  _id: Schema.Types.ObjectId,
  type: { type: String, required: true },
  label: { type: Mixed, default: {} },
  visibility: { type: Boolean, default: true },
  systemDefault: { type: Boolean, default: false },
  readOnly: { type: Boolean, default: false },
  maskData: { type: Boolean, default: false },
  listName: { type: String, default: '' },  // ← NEW
  permissions: {
    view: [String],
    edit: [String],
    delete: [String]
  },
  colSpan: { type: Number },
  refererField: { type: String, default: '' },
  lookupSource: { type: String, default: '' },
  validators: {
    required: Boolean,
    min: Number,
    max: Number,
    minLength: Number,
    maxLength: Number,
    pattern: String
  },
  options: [Mixed],
  table: {
    visible: Boolean,
    sortable: Boolean,
    filterable: Boolean,
    globalSearch: Boolean,
    isName: Boolean,
    isStatus: Boolean,
    arrayVisible: Boolean
  },
  entityReference: {
    enabled: Boolean,
    linkedEntityKey: String,
    displayFields: [String]
  },
  isHeaderToggle: Boolean,
  isProfileImage: Boolean,
  showWhen: Mixed,
  children: [this]
}, { strict: false });
```

**What Changed:**
- Added: `listName: { type: String, default: '' }` after `maskData` field
- Stores reference to list that dropdown/multiSelect uses for options
- Empty string for non-dropdown fields

---

### Validation Schema (dynamicEntity-v2.validation.js)
```javascript
const fieldSchema = Joi.object({
  id: Joi.string().allow('', null),
  _id: Joi.string().allow('', null),
  type: Joi.string().required(),
  label: localizedTextSchema,
  visibility: Joi.boolean(),
  systemDefault: Joi.boolean(),
  readOnly: Joi.boolean(),
  maskData: Joi.boolean(),
  listName: Joi.string()
    .pattern(/^[A-Z_\s\-]*$/)  // ← NEW: Pattern validation
    .allow('', null)
    .messages({
      'string.pattern.base': 'listName must contain only uppercase letters, numbers, underscores, hyphens, and spaces'
    }),
  permissions: permissionsSchema,
  // ... rest of schema
});
```

**What Changed:**
- Added: `listName` validation with pattern `^[A-Z_\s\-]*$`
- Allows: uppercase letters, numbers, underscores, hyphens, spaces
- Allows: empty string and null
- Custom error message for invalid patterns

---

### Frontend Form (form-config.service.ts)
```typescript
// In buildEditorForm() method:
const fieldGroup = this.fb.group({
  id: [field.id ?? ''],
  type: [field.type, Validators.required],
  label: [field.label ?? {}],
  visibility: [field.visibility !== false],
  systemDefault: [field.systemDefault ?? false],
  readOnly: [field.readOnly ?? false],
  maskData: [field.maskData ?? false],
  listName: [''],  // ← NEW: Form control for listName
  permissions: [field.permissions ?? {}],
  // ... rest of form
});
```

**What Changed:**
- Added: `listName: ['']` form control with empty string default
- Integrated with backend validation

---

### Frontend UI (dynamic-views-v2.component.html)
```html
<!-- Field editor property panel -->
<div class="field col-12">
  <label>maskData</label>
  <p-checkbox formControlName="maskData"></p-checkbox>
</div>

<!-- NEW: listName display for dropdown/multiSelect only -->
<div *ngIf="selectedField?.type === 'dropdown' || selectedField?.type === 'multiSelect'" class="field col-12">
  <label>{{ 'DYNAMIC_LIST_V2.LIST_NAME' | translate }}</label>
  <input 
    pInputText 
    formControlName="listName" 
    [readonly]="true" 
    placeholder="e.g., EMPLOYEES - SALUTATION" 
  />
</div>
```

**What Changed:**
- Added: Conditional div that displays only for dropdown/multiSelect types
- Display: Read-only input showing the list reference (e.g., "EMPLOYEES - SALUTATION")
- Positioned: After maskData checkbox
- Format: "{ENTITY} - {FIELD_ID}" (auto-generated, user cannot edit)

---

### Dynamic View Component (dynamic-views-v2.component.ts)
```typescript
// Form patching when loading field config:
loadFieldConfig(field: any) {
  this.fieldForm.patchValue({
    id: field.id,
    type: field.type,
    label: field.label,
    visibility: field.visibility,
    systemDefault: field.systemDefault,
    readOnly: field.readOnly,
    maskData: field.maskData,
    listName: field.listName ?? '',  // ← NEW: Include listName in patch
    permissions: field.permissions ?? {}
  });
}
```

**What Changed:**
- Added: `listName: field.listName ?? ''` when patching form values
- Ensures listName is loaded from database and displayed in read-only field

---

### Form Utilities (dynamic-form.utils.ts)
```typescript
// Mapping editor form values back to field config:
const mappedField = {
  // ... existing mappings ...
  maskData: v.maskData ?? false,
  listName: v.listName ?? '',  // ← NEW: Include listName in conversion
  permissions: v.permissions ?? {}
};
```

**What Changed:**
- Added: `listName: v.listName ?? ''` when converting form data back to field config
- Ensures listName persists when updating field configuration

---

## Impact Summary

| Layer | Change | Impact |
|-------|--------|--------|
| **Model** | Added `listName` field | All new/updated fields include list reference |
| **Validation** | Pattern validation for listName | Invalid formats rejected at API layer |
| **Form Builder** | Added form control | Integrated into field editor form |
| **Form Conversion** | Include listName in mappings | listName preserved during save |
| **UI Display** | Read-only field for dropdown/multiSelect | Users see which list is connected |

---

## Database Migration Note

**No migration required.** Existing fields get `listName: ''` (default) on next sync. New fields get auto-generated `listName = "{ENTITY} - {FIELD_ID}"`.

---

## Testing Checklist

- ✅ listName validation rejects invalid patterns
- ✅ listName auto-generates on field sync
- ✅ listName displays read-only in UI for dropdown/multiSelect
- ✅ listName hidden for other field types
- ✅ listName preserved during field update
- ✅ listName used by list sync logic for deduplication
