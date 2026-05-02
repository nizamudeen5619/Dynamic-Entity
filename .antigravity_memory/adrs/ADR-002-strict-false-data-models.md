# ADR-002: strict: false on Data Models

**Date:** 2026-05-02  
**Status:** Accepted

## Context

Dynamic entity records have no fixed shape — the config defines the field structure at runtime. Each entity stores arbitrary user-defined fields. Mongoose `strict: true` (the default) would silently strip any fields not declared in the schema, making it incompatible with a dynamic field system. This pattern is confirmed by the ONEHERMES CRM (`DynamicEntityFormV2` uses `strict: false`).

## Decision

All data collection schemas (`entity_data_{entityKey}`) use `strict: false` and `timestamps: true`.

Config collection schema uses `strict: true` (its shape is known and fixed).

System fields (`_configVersion`, `_needsMigration`, `_deletedAt`) are explicitly declared on the data schema even though `strict: false` would allow them anyway — this ensures indexes are created correctly.

## Consequences

- **Pro:** Any field shape is stored without loss.
- **Pro:** Matches ONEHERMES CRM pattern exactly (ADR-001 from CRM ADR log).
- **Con:** No schema-level type enforcement on user data fields. All validation must happen in `validate.middleware.js`.
- **Rule:** Never add `strict: true` to any data collection schema.
