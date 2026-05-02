# ADR-001: CommonJS for Node Package

**Date:** 2026-05-02  
**Status:** Accepted

## Context

The open-source `dynamic-entity-server` package must be usable in any Node.js/Express app. The ONEHERMES CRM (Superpower-App) is written entirely in CommonJS (`require`/`module.exports`), no TypeScript, no build step. Contributors to both projects should use the same mental model.

## Decision

Use CommonJS JavaScript for `dynamic-entity-server`. No TypeScript. No build step. Plain `.js` files run directly via Node.js.

Use JSDoc `@typedef` and `@param` annotations for editor hints only — no runtime type enforcement.

## Consequences

- **Pro:** Zero setup friction. `require('dynamic-entity-server')` works immediately after `npm install`.
- **Pro:** Matches ONEHERMES CRM codebase conventions exactly.
- **Pro:** No compile errors to debug — what you write is what runs.
- **Con:** No compile-time type errors. Validation is via JSDoc + Jest tests.
- **Mitigation:** Types are defined in `@dynamic-entity/core` (TypeScript). Consumers using TypeScript get full types.
