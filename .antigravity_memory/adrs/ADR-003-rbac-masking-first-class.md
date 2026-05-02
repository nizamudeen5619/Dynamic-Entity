# ADR-003: RBAC and Masking as First-Class Features

**Date:** 2026-05-02  
**Status:** Accepted

## Context

GDPR/privacy compliance requires sensitive field masking. The ONEHERMES CRM implemented a 3-level hierarchical mask inheritance (ADR-004 in CRM ADR log) with defense-in-depth: masking applied at API source (backend) AND UI display layer (frontend) to prevent leakage.

Simple boolean flags are insufficient — masking rules must cascade through Form/Tab/Field levels.

## Decision

Implement 3-level hierarchical mask inheritance using OR logic:

```
Form.maskData || Tab.maskData || Field.maskData → effective mask
```

**CRITICAL SYNC RULE:** `rbac.utils.js` (Node) and `RbacService` (Angular) must implement **identical** masking logic at all times. `resolveEffectiveMask(formMask, tabMask, fieldMask) → !!(formMask || tabMask || fieldMask)`. Changing one without the other is a critical production bug.

Masking roles provided by consumer via `maskedRoles` option. Non-masked roles see all fields. Masked roles see `XXXXXXXXX` for masked fields.

`EntityPermissions` (view/edit/delete role arrays) enforced at form level in v1. Tab/field-level reserved for Phase 2.

## Consequences

- **Pro:** GDPR/privacy compliant out of the box.
- **Pro:** Defense-in-depth: backend masks at source, frontend masks at display.
- **Pro:** 40-60% query performance improvement for masked fields (confirmed in CRM hardening).
- **Con:** Any change to masking logic requires changing both `rbac.utils.js` and `RbacService` in the same commit.
- **Rule:** `rbac.utils.js` and `RbacService` changes are always a single atomic commit.
