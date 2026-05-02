import { Injectable, inject } from '@angular/core';
import type { VersionedRecord, EntityConfig, MigrationStrategy } from '@dynamic-entity/core';
import { MIGRATION_STRATEGY } from '../tokens/injection-tokens';

/**
 * VersionService — checks config version staleness and migration strategy.
 * ADR-005: Frontend strategy is 'strict' | 'graceful' only. Never 'auto'.
 */
@Injectable({ providedIn: 'root' })
export class VersionService {
  private readonly strategy = inject(MIGRATION_STRATEGY, { optional: true }) ?? 'graceful';

  /**
   * Check if a record is stale compared to the current config version.
   * Returns true if the record needs migration.
   */
  needsMigration(record: Partial<VersionedRecord>, config: EntityConfig): boolean {
    if (!record._configVersion) return false;
    return record._configVersion < config.version || !!record._needsMigration;
  }

  /**
   * Get the effective migration strategy for frontend use.
   * Only 'strict' or 'graceful' — never 'auto' (ADR-005).
   */
  getStrategy(): 'strict' | 'graceful' {
    return this.strategy === 'strict' ? 'strict' : 'graceful';
  }

  /**
   * Determine if form submission should be blocked for a stale record.
   * 'strict' → block; 'graceful' → allow with warning.
   */
  shouldBlockSubmit(record: Partial<VersionedRecord>, config: EntityConfig): boolean {
    return this.getStrategy() === 'strict' && this.needsMigration(record, config);
  }
}
