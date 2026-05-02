# ADR-004: Industry Standard REST Response Shape

**Date:** 2026-05-02  
**Status:** Accepted

## Context

A public open-source package needs a clean, predictable API contract. The ONEHERMES CRM uses `{ status: true/false, data, message }` but this deviates slightly from common open-source conventions. The new package uses a cleaner shape that is self-documenting and consistent.

## Decision

All API responses follow exactly these three shapes — no exceptions:

```json
// Success — single record
{ "success": true, "data": { ... }, "message": "Record created" }

// Success — list
{ "success": true, "data": [ ... ], "pagination": { "page": 1, "pageSize": 20, "total": 100, "totalPages": 5 } }

// Error
{ "success": false, "error": { "code": "VALIDATION_FAILED", "message": "Validation failed", "details": [ "..." ] } }
```

All formatting lives in `response.utils.js` — `sendSuccess()`, `sendPaginated()`, `sendError()`. Never inline `res.json()` in routes.

## Consequences

- **Pro:** Predictable contract for all consumers.
- **Pro:** Centralized formatting means shape changes in one place.
- **Con:** Consumers from ONEHERMES CRM must adapt (different `status` vs `success` key).
- **Rule:** Never change response shape. Never call `res.json()` directly in routes.
