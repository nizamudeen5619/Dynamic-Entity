# ADR-005: MigrationStrategy 'auto' Server-Side Only

**Date:** 2026-05-02  
**Status:** Accepted

## Context

Three migration strategies exist: `strict` (reject stale records), `graceful` (accept stale records and flag them), and `auto` (auto-migrate on read). Auto-migration in the browser creates inconsistent state — a record migrated on one client would differ from another client until all clients reload.

## Decision

The Angular frontend only exposes `'strict' | 'graceful'`. The `'auto'` strategy is server-side only, implemented in `dynamic-entity-server`. Frontend consumers trigger migration via `POST /migrate/:entity`.

`MigrationStrategy` type in `@dynamic-entity/core` includes all three values (for Node consumers), but the Angular `provideNgxDynamicEntity()` config only accepts `'strict' | 'graceful'`.

## Consequences

- **Pro:** No inconsistent state across browser clients.
- **Pro:** Migrations are auditable server-side (logged via MigrationLogger).
- **Con:** Frontend users may see migration warnings and need to trigger migrations via API.
- **Rule:** Never expose `'auto'` in Angular component/service APIs.
