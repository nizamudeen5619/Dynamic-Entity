import type { EntityPermissions } from './rbac.types';

export interface EntityConfig {
  entity: string;
  version: number;
  fields: FieldConfig[];
  tabs?: TabConfig[];
  hooks?: EntityHooks;
  defaultLanguage?: string;
  history?: EntityConfigSnapshot[];
  maskData?: boolean;
  permissions?: EntityPermissions;
}

export interface FieldConfig {
  id: string;
  type: BuiltInFieldType | string;
  label: Record<string, string>;
  placeholder?: Record<string, string>;
  validators?: string[];
  component?: string;
  visible?: boolean;
  tableColumn?: boolean;
  columnWidth?: string;
  options?: DropdownOption[];
  tab?: string;
  disabled?: boolean;
  defaultValue?: any;
  dependsOn?: FieldDependency;
  maskData?: boolean;
  readonly?: boolean;
  isSystem?: boolean;
  /** ADR-006: tracks the list name for dropdown/multiSelect fields. Format: "{ENTITY} - {FIELD_ID}" */
  listName?: string;
}

export interface TabConfig {
  id: string;
  label: Record<string, string>;
  order: number;
  maskData?: boolean;
  /** ADR-008: when true, child tabs are rendered as flat siblings */
  flatData?: boolean;
}

export interface FieldDependency {
  field: string;
  value: any;
}

export type BuiltInFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'checkbox'
  | 'date'
  | 'dropdown'
  | 'multiSelect'
  | 'entity-ref'
  | 'array';

export interface DropdownOption {
  value: any;
  label: Record<string, string>;
}

export interface EntityHooks {
  pre?: string;
  post?: string;
}

export interface EntityConfigSnapshot {
  version: number;
  fields: FieldConfig[];
  changedAt: string;
}
