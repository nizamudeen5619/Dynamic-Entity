import { Injectable, inject } from '@angular/core';
import { AbstractControl, ValidatorFn, Validators } from '@angular/forms';
import { VALIDATOR_REGISTRY } from '../tokens/injection-tokens';

/**
 * ValidatorRegistryService — resolves validator key strings to Angular ValidatorFns.
 * Built-in validators: 'required', 'email', 'min:N', 'max:N', 'minLength:N', 'maxLength:N'.
 * Consumers can register custom validators via provideNgxDynamicEntity({ validators: {...} }).
 */
@Injectable({ providedIn: 'root' })
export class ValidatorRegistryService {
  private readonly consumerRegistry = inject(VALIDATOR_REGISTRY, { optional: true }) ?? new Map();

  /**
   * Resolve a validator key to a ValidatorFn.
   * Supports parameterized built-ins like 'min:0', 'maxLength:255'.
   */
  resolve(validatorKey: string): ValidatorFn | null {
    // Consumer validators take precedence
    if (this.consumerRegistry.has(validatorKey)) {
      return this.consumerRegistry.get(validatorKey);
    }

    // Built-in validators
    if (validatorKey === 'required') return Validators.required;
    if (validatorKey === 'email') return Validators.email;

    const [name, param] = validatorKey.split(':');
    const value = parseFloat(param);

    if (name === 'min' && !isNaN(value)) return Validators.min(value);
    if (name === 'max' && !isNaN(value)) return Validators.max(value);
    if (name === 'minLength' && !isNaN(value)) return Validators.minLength(value);
    if (name === 'maxLength' && !isNaN(value)) return Validators.maxLength(value);

    return null;
  }

  /** Resolve multiple validator keys into a ValidatorFn[] */
  resolveAll(validatorKeys: string[] = []): ValidatorFn[] {
    return validatorKeys.map(k => this.resolve(k)).filter((v): v is ValidatorFn => v !== null);
  }
}
