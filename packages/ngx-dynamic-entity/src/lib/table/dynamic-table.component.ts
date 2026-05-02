import { Component, Input, Output, EventEmitter, signal, computed, inject, OnChanges, SimpleChanges } from '@angular/core';
import type { EntityConfig, VersionedRecord } from '@dynamic-entity/core';
import { RbacService } from '../services/rbac.service';
import { VersionService } from '../services/version.service';

/**
 * DynamicTableComponent — renders entity records as a searchable, sortable, paginated table.
 * Columns determined by FieldConfig.tableColumn === true.
 * Cell masking applied via RbacService (defense-in-depth).
 * Pagination, sort, and search emit events — parent controls data fetching (smart/dumb pattern).
 */
@Component({
  selector: 'ngx-dynamic-table',
  standalone: true,
  imports: [],
  templateUrl: './dynamic-table.component.html',
})
export class DynamicTableComponent implements OnChanges {
  // ─── Inputs ───────────────────────────────────────────────────────────────
  @Input() config!: EntityConfig;
  @Input() data: VersionedRecord[] = [];
  @Input() userRoles: string[] = [];
  @Input() language: string = 'en';
  @Input() loading: boolean = false;
  @Input() error: string | null = null;
  @Input() totalRecords: number = 0;
  @Input() pageSize: number = 20;
  @Input() currentPage: number = 1;

  // ─── Outputs ──────────────────────────────────────────────────────────────
  @Output() rowClick = new EventEmitter<VersionedRecord>();
  @Output() rowEdit = new EventEmitter<VersionedRecord>();
  @Output() rowDelete = new EventEmitter<VersionedRecord>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();
  @Output() sortChange = new EventEmitter<{ field: string; dir: 'asc' | 'desc' }>();
  @Output() searchChange = new EventEmitter<string>();

  // ─── Services ─────────────────────────────────────────────────────────────
  private readonly rbacService = inject(RbacService);
  private readonly versionService = inject(VersionService);

  // ─── Signals ──────────────────────────────────────────────────────────────
  readonly sortField = signal<string>('');
  readonly sortDir = signal<'asc' | 'desc'>('desc');
  readonly searchTerm = signal<string>('');

  // ─── Computed ─────────────────────────────────────────────────────────────
  readonly tableColumns = computed(() => 
    (this.config?.fields || []).filter(f => f.tableColumn === true)
  );

  get permissions() {
    return this.rbacService.getPermissions(this.config, this.userRoles);
  }

  get totalPages(): number {
    return Math.ceil(this.totalRecords / this.pageSize) || 0;
  }

  ngOnChanges(_changes: SimpleChanges): void {
    // Pre-resolve masking per column once (ONEHERMES hardening: pre-resolved at extract time)
    this._resolveColumnMasks();
  }

  private columnMaskCache = new Map<string, boolean>();

  private _resolveColumnMasks(): void {
    if (!this.config) return;
    this.columnMaskCache.clear();
    for (const field of this.tableColumns()) {
      const tab = (this.config.tabs || []).find(t => t.id === field.tab);
      const masked = this.rbacService.shouldMaskField(field, tab, this.config, this.userRoles);
      this.columnMaskCache.set(field.id, masked);
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  isCellMasked(fieldId: string): boolean {
    return this.columnMaskCache.get(fieldId) ?? false;
  }

  getCellValue(record: VersionedRecord, fieldId: string): string {
    if (this.isCellMasked(fieldId)) return 'XXXXXXXXX';
    const value = record[fieldId];
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value instanceof Date || (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/))) {
      try {
        return new Date(value).toLocaleDateString();
      } catch {
        return String(value);
      }
    }
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  }

  needsMigration(record: VersionedRecord): boolean {
    return this.versionService.needsMigration(record, this.config);
  }

  getColumnLabel(fieldId: string): string {
    const field = (this.config?.fields || []).find(f => f.id === fieldId);
    return field?.label?.[this.language] || field?.label?.['en'] || fieldId;
  }

  // ─── Sort / Search / Pagination ───────────────────────────────────────────

  onSort(fieldId: string): void {
    if (this.sortField() === fieldId) {
      const next = this.sortDir() === 'asc' ? 'desc' : 'asc';
      this.sortDir.set(next);
    } else {
      this.sortField.set(fieldId);
      this.sortDir.set('asc');
    }
    this.sortChange.emit({ field: this.sortField(), dir: this.sortDir() });
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.searchChange.emit(value);
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.pageChange.emit(page);
  }

  onEdit(event: Event, record: VersionedRecord): void {
    event.stopPropagation();
    this.rowEdit.emit(record);
  }

  onDelete(event: Event, record: VersionedRecord): void {
    event.stopPropagation();
    this.rowDelete.emit(record);
  }
}
