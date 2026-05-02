import type { EntityConfig, EntityConfigSnapshot } from './config.types';
import type { VersionedRecord } from './versioning.types';

export interface QueryOptions {
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortDir?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
  includeDeleted?: boolean;
}

export interface PaginatedResult {
  data: VersionedRecord[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface DynamicEntityAdapter {
  // Config CRUD
  findConfig(entity: string): Promise<EntityConfig | null>;
  listConfigs(): Promise<EntityConfig[]>;
  saveConfig(config: EntityConfig): Promise<EntityConfig>;
  updateConfig(entity: string, updates: Partial<EntityConfig>): Promise<EntityConfig>;
  deleteConfig(entity: string): Promise<void>;
  getConfigHistory(entity: string): Promise<EntityConfigSnapshot[]>;
  rollbackConfig(entity: string, version: number): Promise<EntityConfig>;

  // Data CRUD
  findRecords(entity: string, options?: QueryOptions): Promise<PaginatedResult>;
  findRecord(entity: string, id: string): Promise<VersionedRecord | null>;
  saveRecord(entity: string, data: object): Promise<VersionedRecord>;
  updateRecord(entity: string, id: string, data: object): Promise<VersionedRecord>;
  softDeleteRecord(entity: string, id: string): Promise<void>;
  restoreRecord(entity: string, id: string): Promise<VersionedRecord>;
  hardDeleteRecord(entity: string, id: string): Promise<void>;

  // Migration
  findRecordsNeedingMigration(entity: string): Promise<VersionedRecord[]>;
  bulkUpdateRecords(entity: string, updates: Array<{ id: string; data: object }>): Promise<void>;
}
