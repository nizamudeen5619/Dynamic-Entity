import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import type { EntityConfig } from '@dynamic-entity/core';
import { DYNAMIC_ENTITY_API_URL } from '../tokens/injection-tokens';

/**
 * ConfigService — fetches entity configs from the dynamic-entity-server API.
 * Uses shareReplay(1) to cache per config key — avoids duplicate HTTP requests.
 * Following ONEHERMES smart service pattern: Observable$ + shareReplay.
 */
@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(DYNAMIC_ENTITY_API_URL, { optional: true }) ?? '';
  private readonly cache = new Map<string, Observable<EntityConfig>>();

  /** Get a config by entity key. Cached via shareReplay(1). */
  getConfig(entity: string): Observable<EntityConfig> {
    if (!this.cache.has(entity)) {
      const config$ = this.http
        .get<{ success: boolean; data: EntityConfig }>(`${this.apiUrl}/config/${entity}`)
        .pipe(
          map(res => res.data!), // ADR-004: Success guarantees data
          shareReplay(1),
        );
      this.cache.set(entity, config$);
    }
    return this.cache.get(entity)!;
  }

  /** List all configs */
  listConfigs(): Observable<EntityConfig[]> {
    return this.http
      .get<{ success: boolean; data: EntityConfig[] }>(`${this.apiUrl}/config`)
      .pipe(map(res => res.data!)); // ADR-004: Success guarantees data
  }

  /** Create a new config */
  saveConfig(config: EntityConfig): Observable<EntityConfig> {
    return this.http
      .post<{ success: boolean; data: EntityConfig }>(`${this.apiUrl}/config`, config)
      .pipe(map(res => res.data!));
  }

  /** Update an existing config */
  updateConfig(entity: string, updates: Partial<EntityConfig>): Observable<EntityConfig> {
    return this.http
      .put<{ success: boolean; data: EntityConfig }>(`${this.apiUrl}/config/${entity}`, updates)
      .pipe(
        map(res => {
          this.invalidate(entity);
          return res.data!;
        })
      );
  }

  /** Invalidate cache for an entity (call after config update) */
  invalidate(entity: string): void {
    this.cache.delete(entity);
  }
}
