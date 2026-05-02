export interface VersionedRecord {
  _configVersion: number;
  _needsMigration: boolean;
  _deletedAt?: string | null;
  [key: string]: any;
}

/**
 * 'auto' is server-side only.
 * Angular only exposes 'strict' | 'graceful' (ADR-005).
 */
export type MigrationStrategy = 'strict' | 'graceful' | 'auto';
