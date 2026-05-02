# ADR-006: entity-ref Options Through Registry Only

**Date:** 2026-05-02  
**Status:** Accepted

## Context

`DynamicFieldComponent` mounts field components dynamically via `ViewContainerRef.createComponent()`. Components mounted this way cannot receive `@Input()` loaders from the parent template — only inputs set via `setInput()` at mount time. Passing option-loader functions via `@Input()` on `EntityRefFieldComponent` is not possible in this architecture.

## Decision

Entity-ref options come **only** from `EntityRefRegistryService`. Consumers register loaders via `provideNgxDynamicEntity({ entityRefs: { [entityKey]: loaderFn } })`. `EntityRefFieldComponent` injects the registry and calls `registry.resolve(field.component ?? field.id)` to get its loader function.

Never add `@Input() optionsLoader` or similar to any field component.

## Consequences

- **Pro:** Consistent mounting API for all 8 field types via `setInput()`.
- **Pro:** Custom field components can also use the registry.
- **Con:** Consumers must register entity-ref loaders at app bootstrap, not at template level.
- **Rule:** entity-ref options ONLY through `EntityRefRegistryService`.
