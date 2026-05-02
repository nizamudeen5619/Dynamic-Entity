# ADR-007: No Multi-Tenancy in v1

**Date:** 2026-05-02  
**Status:** Accepted

## Context

The ONEHERMES CRM uses `getModelByTenant(realm, 'ModelName')` for all database operations — each tenant has an isolated connection/database. This complexity is not appropriate for a generic open-source package where different consumers use different multi-tenancy strategies (separate databases, shared database + tenantId field, schema-per-tenant, etc.).

## Decision

`MongoAdapter` accepts a single Mongoose connection instance. No `getModelByTenant()` pattern. No tenant scoping built in. Single connection per adapter instance.

Multi-tenant consumers must extend `MongoAdapter` or implement `DynamicEntityAdapter` with their own multi-tenant connection strategy.

## Consequences

- **Pro:** Simple, predictable API. No hidden complexity.
- **Pro:** Adapter interface is implementable with any database — not tied to Mongoose multi-tenant pattern.
- **Con:** Multi-tenant consumers must do extra work.
- **Mitigation:** Documentation provides examples for extending `MongoAdapter` for multi-tenancy.
- **Rule:** Never add `tenantId`, `realm`, or connection-switching logic to the adapter in v1.
