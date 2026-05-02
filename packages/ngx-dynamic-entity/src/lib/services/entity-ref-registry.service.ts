import { Injectable, inject } from '@angular/core';
import { ENTITY_REF_REGISTRY } from '../tokens/injection-tokens';

/**
 * EntityRefRegistryService — resolves entity-ref option loader functions.
 * ADR-006: Entity-ref options come ONLY from this registry.
 * Never pass loaders via @Input() on field components.
 *
 * Consumers register loaders via provideNgxDynamicEntity({ entityRefs: { clients: () => [...] } }).
 * EntityRefFieldComponent injects this service and calls resolve(field.component ?? field.id).
 */
@Injectable({ providedIn: 'root' })
export class EntityRefRegistryService {
  private readonly registry = inject(ENTITY_REF_REGISTRY, { optional: true }) ?? new Map();

  /**
   * Get the option loader function for an entity key.
   * @returns Async function that returns options array, or null if not registered.
   */
  resolve(entityKey: string): (() => Promise<any[]>) | null {
    return this.registry.get(entityKey) ?? null;
  }

  has(entityKey: string): boolean {
    return this.registry.has(entityKey);
  }
}
