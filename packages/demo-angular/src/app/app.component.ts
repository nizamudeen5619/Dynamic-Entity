import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  DynamicTableComponent,
  DynamicFormComponent,
  ConfigService,
  EntityConfig,
  VersionedRecord
} from 'ngx-dynamic-entity';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, DynamicTableComponent, DynamicFormComponent],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly configService = inject(ConfigService);
  protected readonly JSON = JSON;

  // ─── Signals ──────────────────────────────────────────────────────────────
  readonly userRoles = signal<string[]>(['admin']);
  readonly view = signal<'list' | 'form' | 'config'>('list');
  readonly config = signal<EntityConfig | null>(null);
  readonly allConfigs = signal<EntityConfig[]>([]);
  readonly records = signal<VersionedRecord[]>([]);
  readonly selectedRecord = signal<VersionedRecord | null>(null);
  readonly selectedConfig = signal<EntityConfig | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly totalRecords = signal<number>(0);
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(20);
  readonly sortField = signal<string>('');
  readonly sortDir = signal<'asc' | 'desc'>('desc');
  readonly searchTerm = signal<string>('');

  // ─── Computed ─────────────────────────────────────────────────────────────
  readonly currentRole = computed(() => this.userRoles()[0]);

  async ngOnInit() {
    await this.loadAllConfigs();
    await this.loadConfig();
    await this.loadRecords();
  }

  // ─── Data Loading ─────────────────────────────────────────────────────────

  async loadAllConfigs() {
    try {
      const configs = await firstValueFrom(this.configService.listConfigs());
      this.allConfigs.set(configs);
    } catch (err) {
      console.error('Failed to list configs:', err);
    }
  }

  async loadConfig() {
    try {
      console.log('Fetching config for clients...');
      const config = await firstValueFrom(this.configService.getConfig('clients')) as EntityConfig;
      console.log('Config loaded:', config.entity);
      this.config.set(config);
    } catch (err) {
      console.error('Failed to load entity configuration:', err);
      this.error.set('Failed to load entity configuration');
    }
  }

  async loadRecords() {
    this.loading.set(true);
    try {
      const headers = new HttpHeaders().set('x-user-roles', this.userRoles().join(','));

      // Build query params
      let params = `?page=${this.currentPage()}&pageSize=${this.pageSize()}`;
      if (this.sortField()) {
        params += `&sortField=${this.sortField()}&sortDir=${this.sortDir()}`;
      }
      if (this.searchTerm()) {
        params += `&search=${encodeURIComponent(this.searchTerm())}`;
      }

      const res = await firstValueFrom(
        this.http.get<{ success: boolean; data: any; pagination: any }>(
          `http://localhost:3001/api/entities/data/clients${params}`,
          { headers }
        )
      );

      this.records.set(res.data);
      this.totalRecords.set(res.pagination.total);
    } catch (err) {
      this.error.set('Failed to load records');
    } finally {
      this.loading.set(false);
    }
  }

  // ─── Event Handlers ────────────────────────────────────────────────────────

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.loadRecords();
  }

  onSortChange(event: { field: string; dir: 'asc' | 'desc' }) {
    this.sortField.set(event.field);
    this.sortDir.set(event.dir);
    this.loadRecords();
  }

  onSearchChange(term: string) {
    this.searchTerm.set(term);
    this.currentPage.set(1); // Reset to first page on search
    this.loadRecords();
  }

  // ─── Actions ──────────────────────────────────────────────────────────────

  setRole(role: string) {
    this.userRoles.set([role]);
    this.loadRecords(); // Reload to see server-side masking change
  }

  setView(view: 'list' | 'form' | 'config') {
    this.view.set(view);
    if (view === 'config') {
      this.selectedConfig.set(null);
    }
  }

  onRowClick(record: VersionedRecord) {
    this.selectedRecord.set(record);
    this.view.set('form');
  }

  onCreateNew() {
    this.selectedRecord.set(null);
    this.view.set('form');
  }

  async onFormSubmit(data: any) {
    this.loading.set(true);
    try {
      const headers = new HttpHeaders().set('x-user-roles', this.userRoles().join(','));
      const url = 'http://localhost:3001/api/entities/data/clients';

      if (this.selectedRecord()) {
        const id = this.selectedRecord()!['_id'];
        await firstValueFrom(this.http.put(`${url}/${id}`, data, { headers }));
      } else {
        await firstValueFrom(this.http.post(url, data, { headers }));
      }

      await this.loadRecords();
      this.view.set('list');
    } catch (err: any) {
      this.error.set(err.error?.message || 'Failed to save record');
    } finally {
      this.loading.set(false);
    }
  }

  async onConfigSubmit(config: any) {
    this.loading.set(true);
    try {
      if (this.selectedConfig()) {
        await firstValueFrom(this.configService.updateConfig(config.entity, config));
      } else {
        await firstValueFrom(this.configService.saveConfig(config));
      }
      await this.loadAllConfigs();
      this.view.set('list');
    } catch (err: any) {
      this.error.set(err.error?.message || 'Failed to save config');
    } finally {
      this.loading.set(false);
    }
  }

  onCancel() {
    this.view.set('list');
  }
}
