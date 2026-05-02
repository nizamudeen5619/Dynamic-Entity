# ADR-008: Shared Field Component Contract

**Date:** 2026-05-02  
**Status:** Accepted

## Context

`DynamicFieldComponent` mounts field components via `ViewContainerRef.createComponent()` and passes inputs via `setInput()`. For this to work generically (DRY, no special-casing per type), every field component must accept exactly the same set of inputs. LSP: custom field components must be substitutable for built-in ones.

## Decision

All 8 built-in field components AND all consumer-registered custom field components must satisfy this exact 5-input contract:

```typescript
@Input() field!: FieldConfig;        // field definition from config
@Input() control!: AbstractControl;  // reactive form control
@Input() language: string = 'en';    // active language key
@Input() readonly: boolean = false;  // form-level readonly
@Input() masked: boolean = false;    // whether to show XXXXXXXXX
```

Rendering rules:
- `masked === true` → render `<span class="ngx-field__value ngx-field__value--masked">XXXXXXXXX</span>`
- `readonly === true` → render `<span class="ngx-field__value">` with display value
- Otherwise → render the interactive input element

`DynamicFieldComponent` passes all 5 inputs via `setInput()` for ALL types — no conditional logic per type.

## Consequences

- **Pro:** DRY — one mounting pattern for all field types.
- **Pro:** LSP — custom fields are drop-in replacements.
- **Con:** Custom field components that don't implement all 5 inputs will fail silently.
- **Mitigation:** Document the contract in README and provide an abstract base class or interface.
- **Rule:** Never add a 6th required input to the contract without a major version bump.
