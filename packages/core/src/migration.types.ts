export interface FieldMigration {
  fromVersion: number;
  toVersion: number;
  migrate: (oldValue: any) => any;
}

export interface EntityMigration {
  fieldMigrations: Record<string, FieldMigration[]>;
}

export interface MigrationLogEntry {
  entity: string;
  recordId: string;
  fromVersion: number;
  toVersion: number;
  status: 'success' | 'failed';
  error?: string;
  migratedAt: string;
}

export interface MigrationSummary {
  entity: string;
  total: number;
  succeeded: number;
  failed: number;
  log: MigrationLogEntry[];
}
