import { Injectable, inject } from '@angular/core';
import { HOOK_REGISTRY } from '../tokens/injection-tokens';

/**
 * HookRegistryService — stores and runs Angular-side pre/post hooks.
 * Consumers register hooks via provideNgxDynamicEntity({ hooks: { 'clients:beforeSave': fn } }).
 */
@Injectable({ providedIn: 'root' })
export class HookRegistryService {
  private readonly registry = inject(HOOK_REGISTRY, { optional: true }) ?? new Map();

  has(key: string): boolean {
    return this.registry.has(key);
  }

  async run(key: string, data: any, context: any = {}): Promise<any> {
    const hook = this.registry.get(key);
    if (!hook) return data;
    return hook(data, context);
  }
}
