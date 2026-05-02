import { Injectable, inject } from '@angular/core';
import type { EntityConfig, FieldConfig, TabConfig } from '@dynamic-entity/core';
import { MASKED_ROLES } from '../tokens/injection-tokens';

/**
 * RbacService — ALL permission checks and masking logic live here.
 * CRITICAL SYNC: resolveEffectiveMask() must be identical to rbac.utils.js in dynamic-entity-server.
 * Changing one without the other is a critical production bug (ADR-003).
 */
@Injectable({ providedIn: 'root' })
export class RbacService {
  private readonly maskedRoles = inject(MASKED_ROLES, { optional: true }) ?? [];

  /**
   * Check if any of the user's roles satisfy the required roles.
   * hasPermission(roles, undefined) → true (no restriction).
   */
  hasPermission(userRoles: string[], requiredRoles?: string[]): boolean {
    if (!requiredRoles?.length) return true;
    return userRoles.some(r => requiredRoles.includes(r));
  }

  /**
   * ADR-003: 3-level OR resolution.
   * MUST match rbac.utils.js resolveEffectiveMask() exactly.
   */
  resolveEffectiveMask(formMask?: boolean, tabMask?: boolean, fieldMask?: boolean): boolean {
    return !!(formMask || tabMask || fieldMask);
  }

  /** Check if the user's roles include any masked role */
  isUserMaskedRole(userRoles: string[]): boolean {
    return this.maskedRoles.some(r => userRoles.includes(r));
  }

  /** Determine if a specific field should be masked for this user */
  shouldMaskField(field: FieldConfig, tab: TabConfig | undefined, config: EntityConfig, userRoles: string[]): boolean {
    if (!this.isUserMaskedRole(userRoles)) return false;
    return this.resolveEffectiveMask(config.maskData, tab?.maskData, field.maskData);
  }

  /** Get view/edit/delete permissions for a config */
  getPermissions(config: EntityConfig, userRoles: string[]) {
    return {
      canView: this.hasPermission(userRoles, config.permissions?.view),
      canEdit: this.hasPermission(userRoles, config.permissions?.edit),
      canDelete: this.hasPermission(userRoles, config.permissions?.delete),
    };
  }
}
