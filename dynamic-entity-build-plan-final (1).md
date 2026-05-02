# dynamic-entity — Complete Build Plan for AI (Production-Ready v1)

---

## STEP 0 — Read existing implementation first (MANDATORY)

Before writing a single line of code, read every markdown file inside `.onehermes/`.

Focus on:
- `decisions/MODULE_DynamicEntityV2.md` — Golden Thread (UI → API → DB)
- `memory/architecture_patterns_onehermes.md` — backend/frontend patterns
- `memory/project_dynamic_entity_hardening.md` — RBAC and masking
- `memory/project_dynamic_form_fixes_comprehensive.md` — known bugs and fixes
- `memory/conventions_onehermes.md` — naming, style, file structure
- `decisions/ADR_LOG.md` — decisions already made

Packages must be a faithful extraction. `.onehermes/` files win over this plan in conflicts.

---

## Architecture Principles (non-negotiable)

### SOLID
- **S** — Every file does one thing. Routes handle HTTP. Services handle logic. Utils handle helpers. Never mix.
- **O** — Field types, hooks, validators, entity-ref loaders are all open for extension via registries. Core engine is closed for modification.
- **L** — `MongoAdapter` implements `DynamicEntityAdapter`. Any consumer adapter can substitute it without breaking routes.
- **I** — `DynamicEntityAdapter` splits into focused method groups (Config CRUD, Data CRUD, Migration). Consumers implement only what they need.
- **D** — Routes depend on the `DynamicEntityAdapter` interface, never on `MongoAdapter` directly. Angular components depend on service interfaces, never on HTTP directly.

### DRY
- All API response formatting lives in `response.utils.js` — never inline `res.json()`
- All RBAC and masking logic lives in `rbac.utils.js` (Node) and `RbacService` (Angular) — never duplicated in routes or components
- All error codes live in `@dynamic-entity/core` error-codes — never hardcoded strings
- All config interface types live in `@dynamic-entity/core` — never redeclared in other packages
- All field rendering logic lives in `DynamicFieldComponent` — never duplicated per form

### Reusability
- `@dynamic-entity/core` — usable by Angular, Node, Vue, React, any framework
- `dynamic-entity-server` — usable in any Express app, any database via adapter pattern
- `ngx-dynamic-entity` — zero opinions on styling, zero external UI dependencies
- Field components are self-contained, individually importable
- Registry pattern throughout — everything pluggable, nothing hardcoded

---

## Naming Standards (follow everywhere)

### Node / CommonJS
| Type | Convention | Example |
|---|---|---|
| File | kebab-case | `mongo.adapter.js`, `rbac.utils.js` |
| Class | PascalCase | `MongoAdapter`, `HookRegistry` |
| Function | camelCase | `findRecords()`, `applyFieldMask()` |
| Constant | UPPER_SNAKE_CASE | `DEFAULT_PAGE_SIZE`, `MASKED_VALUE` |
| Variable | camelCase | `entityConfig`, `userRoles` |
| Route path | lowercase-kebab | `/data/:entity`, `/config/:entity/rollback/:version` |

### Angular / TypeScript
| Type | Convention | Example |
|---|---|---|
| Component | PascalCase + Component | `DynamicFormComponent`, `TextFieldComponent` |
| Service | PascalCase + Service | `FieldRegistryService`, `RbacService` |
| File | kebab-case | `dynamic-form.component.ts`, `rbac.service.ts` |
| Injectable token | UPPER_SNAKE_CASE | `FIELD_TYPE_REGISTRY`, `MASKED_ROLES` |
| Observable | camelCase + $ | `config$`, `options$` |
| Signal | camelCase | `searchTerm`, `sortField` |
| Interface | PascalCase | `EntityConfig`, `VersionedRecord` |
| Provider function | provide + PascalCase | `provideNgxDynamicEntity()` |

### Shared
- CSS classes: `ngx-` prefix, BEM-style — `ngx-field`, `ngx-field--readonly`, `ngx-field__label`
- Error codes: UPPER_SNAKE_CASE — `CONFIG_NOT_FOUND`, `VALIDATION_FAILED`
- Hook keys: camelCase — `beforeSave`, `afterSave`, `beforeDelete`

---

## API Response Shape (all routes follow this exactly)

```json
// Success — single record
{ "success": true, "data": { ... }, "message": "Record created" }

// Success — list
{
  "success": true,
  "data": [ ... ],
  "pagination": { "page": 1, "pageSize": 20, "total": 100, "totalPages": 5 }
}

// Error
{
  "success": false,
  "error": { "code": "VALIDATION_FAILED", "message": "Validation failed", "details": [ "..." ] }
}
```

---

## Key Decisions

| Decision | Choice | Reason |
|---|---|---|
| Node language | CommonJS JavaScript | Matches CRM codebase |
| Angular | Angular 17 standalone | New package, clean start |
| Shared types | TypeScript (`@dynamic-entity/core`) | Types only, no runtime |
| MongoDB records | `strict: false` + required field validation | Matches CRM, handles dynamic shape |
| Multi-tenancy | Not in v1 | Out of scope |
| RBAC + masking | 3-level hierarchy from CRM | Core production feature |
| Node build | No build step | CommonJS runs directly |
| Monorepo | Turborepo | Framework-agnostic |

---

## Monorepo Structure

```
dynamic-entity/
  packages/
    core/                        ← @dynamic-entity/core
    dynamic-entity-server/       ← Node.js / Express / CommonJS
    ngx-dynamic-entity/          ← Angular 17 library
    demo-node/
    demo-angular/
  .github/workflows/
    ci.yml
    publish.yml
  turbo.json
  package.json
  .eslintrc.js
  .prettierrc
  README.md
```

---

## Build Phases

- **Phase 1** — `@dynamic-entity/core`
- **Phase 2** — `dynamic-entity-server`
- **Phase 3** — `ngx-dynamic-entity`
- **Phase 4** — Demo apps + CI/CD

Each phase must be clean before the next starts. One file per commit.

---
---

# Phase 1 — @dynamic-entity/core

Zero runtime code. Pure TypeScript interfaces. No dependencies.

---

## Folder structure

```
packages/core/
  src/
    config.types.ts          ← EntityConfig, FieldConfig, TabConfig, DropdownOption
    versioning.types.ts      ← VersionedRecord, MigrationStrategy, EntityConfigSnapshot
    adapter.interface.ts     ← DynamicEntityAdapter, QueryOptions, PaginatedResult
    migration.types.ts       ← FieldMigration, EntityMigration, MigrationSummary
    rbac.types.ts            ← EntityPermissions, RbacContext
    error-codes.ts           ← ErrorCodes const, ErrorCode type
    index.ts                 ← barrel export
  package.json
  tsconfig.json
  tsup.config.ts
```

---

## Blast-Radius Map — Phase 1 (per file)

```
┌─────────────────────────────────────────────────────────────────────┐
│ FILE: config.types.ts                           RISK: ★★★★★ CRITICAL │
├─────────────────────────────────────────────────────────────────────┤
│ If any interface field is renamed or removed:                        │
│  → dynamic-entity-server                                            │
│     • mongo.adapter.js — schema fields, index names                 │
│     • validate.middleware.js — field iteration                       │
│     • config.routes.js — request/response shape                     │
│     • data.routes.js — config lookups                               │
│     • rbac.utils.js — config.maskData, field.maskData               │
│  → ngx-dynamic-entity                                               │
│     • config.service.ts — getConfig return type                     │
│     • dynamic-form.component.ts — config input type                 │
│     • dynamic-table.component.ts — config input type                │
│     • all 8 field components — FieldConfig input type               │
│     • rbac.service.ts — EntityConfig, TabConfig usage               │
│  → demo-node — seed data shape                                      │
│  → demo-angular — mock config shape                                 │
│  → every consumer of either package                                 │
│                                                                     │
│ RULE: Lock this file before Phase 2 starts. Zero changes after.     │
│ Safe changes: adding optional fields only.                          │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ FILE: rbac.types.ts                                 RISK: ★★★★ HIGH │
├─────────────────────────────────────────────────────────────────────┤
│  → dynamic-entity-server                                            │
│     • rbac.utils.js — EntityPermissions shape                       │
│     • data.routes.js — permission checking                          │
│  → ngx-dynamic-entity                                               │
│     • rbac.service.ts — RbacContext, EntityPermissions              │
│     • dynamic-form.component.ts — userRoles input                   │
│     • dynamic-table.component.ts — userRoles input                  │
│                                                                     │
│ RULE: rbac.utils.js (Node) and RbacService (Angular) must always   │
│ implement the same masking logic. Change one = change both.         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ FILE: adapter.interface.ts                          RISK: ★★★★ HIGH │
├─────────────────────────────────────────────────────────────────────┤
│  → dynamic-entity-server                                            │
│     • mongo.adapter.js — must implement every method                │
│     • config.routes.js — uses findConfig, listConfigs, etc.         │
│     • data.routes.js — uses findRecords, saveRecord, etc.           │
│     • migration.routes.js — uses findRecordsNeedingMigration        │
│  → every consumer-built custom adapter                              │
│                                                                     │
│ RULE: Adding optional methods is safe. Renaming or removing         │
│ any method is a breaking change requiring a major version bump.     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ FILE: versioning.types.ts                           RISK: ★★★★ HIGH │
├─────────────────────────────────────────────────────────────────────┤
│  → dynamic-entity-server                                            │
│     • validate.middleware.js — _configVersion check                 │
│     • migration-runner.js — _needsMigration, _configVersion         │
│     • mongo.adapter.js — system fields on schema                    │
│  → ngx-dynamic-entity                                               │
│     • version.service.ts — checkRecord() logic                      │
│     • dynamic-form.component.ts — migration banner                  │
│     • dynamic-table.component.ts — migration badge                  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ FILE: migration.types.ts                          RISK: ★★★ MEDIUM  │
├─────────────────────────────────────────────────────────────────────┤
│  → dynamic-entity-server                                            │
│     • migration-runner.js — FieldMigration, EntityMigration         │
│     • migration-logger.js — MigrationLogEntry, MigrationSummary     │
│     • migration.routes.js — MigrationSummary response shape         │
│  → demo-node — migration registration shape                         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ FILE: error-codes.ts                              RISK: ★★★ MEDIUM  │
├─────────────────────────────────────────────────────────────────────┤
│  → dynamic-entity-server — all routes, error-handler.js             │
│  → consumers checking error codes by string value                   │
│                                                                     │
│ RULE: Only add new codes. Never rename existing ones.               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## config.types.ts

```ts
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
  listName?: string;
}

export interface TabConfig {
  id: string;
  label: Record<string, string>;
  order: number;
  maskData?: boolean;
  flatData?: boolean;
}

export interface FieldDependency {
  field: string;
  value: any;
}

export type BuiltInFieldType =
  | 'text' | 'textarea' | 'number' | 'checkbox'
  | 'date' | 'dropdown' | 'multiSelect' | 'entity-ref' | 'array';

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
```

---

## rbac.types.ts

```ts
export interface EntityPermissions {
  view?: string[];
  edit?: string[];
  delete?: string[];
}

export interface RbacContext {
  userRoles: string[];
  maskedRoles?: string[];
}
```

---

## versioning.types.ts

```ts
export interface VersionedRecord {
  _configVersion: number;
  _needsMigration: boolean;
  _deletedAt?: string | null;
  [key: string]: any;
}

// 'auto' is server-side only — Angular only exposes 'strict' | 'graceful'
export type MigrationStrategy = 'strict' | 'graceful' | 'auto';
```

---

## adapter.interface.ts

```ts
import { EntityConfig, EntityConfigSnapshot } from './config.types';
import { VersionedRecord } from './versioning.types';

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
```

---

## migration.types.ts

```ts
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
```

---

## error-codes.ts

```ts
export const ErrorCodes = {
  CONFIG_NOT_FOUND: 'CONFIG_NOT_FOUND',
  RECORD_NOT_FOUND: 'RECORD_NOT_FOUND',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  MIGRATION_REQUIRED: 'MIGRATION_REQUIRED',
  MIGRATION_FAILED: 'MIGRATION_FAILED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  INVALID_CONFIG_VERSION: 'INVALID_CONFIG_VERSION',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];
```

---

## index.ts

```ts
export * from './config.types';
export * from './versioning.types';
export * from './adapter.interface';
export * from './migration.types';
export * from './rbac.types';
export * from './error-codes';
```

---
---

# Phase 2 — dynamic-entity-server (Node.js / CommonJS)

No TypeScript. No build step. Pure CommonJS. Runs directly.

---

## Folder structure

```
packages/dynamic-entity-server/
  src/
    utils/
      ApiError.js              ← custom error class
      response.utils.js        ← success(), paginated(), error() helpers
      rbac.utils.js            ← hasPermission(), resolveEffectiveMask(), applyFieldMask()
      error-codes.js           ← re-exports from @dynamic-entity/core
    adapter/
      mongo.adapter.js         ← implements DynamicEntityAdapter
    hooks/
      hook-registry.js         ← HookRegistry class
    migrations/
      migration-registry.js    ← MigrationRegistry class
      migration-runner.js      ← migrateRecord(), bulkMigrate()
      migration-logger.js      ← MigrationLogger class
    middleware/
      logger.middleware.js     ← request/response logging
      auth.middleware.js       ← pluggable auth handler
      validate.middleware.js   ← required fields + configVersion check
      error-handler.js         ← global error formatter
    routes/
      config.routes.js         ← Express router for /config
      data.routes.js           ← Express router for /data/:entity
      migration.routes.js      ← Express router for /migrate
    index.js                   ← dynamicEntityRouter() factory + exports
  package.json
  jest.config.js
  README.md
```

---

## Blast-Radius Map — Phase 2 (per file)

Build in this exact order. Each row depends on the rows above it.

```
┌─────────────────────────────────────────────────────────────────────┐
│ FILE: utils/ApiError.js                           RISK: ★★★★ HIGH   │
├─────────────────────────────────────────────────────────────────────┤
│ Every file in Phase 2 uses ApiError.                                │
│  → error-handler.js — instanceof check                             │
│  → all routes — thrown errors                                       │
│  → validate.middleware.js — validation errors                       │
│  → mongo.adapter.js — adapter errors                                │
│                                                                     │
│ RULE: Build this first. Never change the constructor signature      │
│ after any other file uses it.                                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ FILE: utils/response.utils.js              RISK: ★★★★★ CRITICAL     │
├─────────────────────────────────────────────────────────────────────┤
│ Every route file calls success(), paginated(), or error().          │
│  → config.routes.js — all responses                                 │
│  → data.routes.js — all responses                                   │
│  → migration.routes.js — all responses                              │
│                                                                     │
│ RULE: Never change the function signatures or response shape.       │
│ Consumers parse this shape. It is the public API contract.          │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ FILE: utils/rbac.utils.js                         RISK: ★★★★ HIGH   │
├─────────────────────────────────────────────────────────────────────┤
│  → data.routes.js — RBAC permission checks on all write routes      │
│  → data.routes.js — applyFieldMask() on all read responses          │
│  → demo-node — maskedRoles configuration                            │
│                                                                     │
│ CRITICAL SYNC RULE: This file and Angular's RbacService must        │
│ implement the identical masking logic at all times.                  │
│ If resolveEffectiveMask() changes here, it must change in Angular.  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ FILE: adapter/mongo.adapter.js                    RISK: ★★★★ HIGH   │
├─────────────────────────────────────────────────────────────────────┤
│  → config.routes.js — all config CRUD operations                    │
│  → data.routes.js — all data CRUD operations                        │
│  → migration.routes.js — findRecordsNeedingMigration, bulkUpdate    │
│  → validate.middleware.js — findConfig()                            │
│                                                                     │
│ RULE: Must implement every method in DynamicEntityAdapter.          │
│ Indexes must be created on init — not on first query.               │
│ strict: false on all data collection schemas.                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ FILE: hooks/hook-registry.js                      RISK: ★★ LOW      │
├─────────────────────────────────────────────────────────────────────┤
│  → data.routes.js — pre/post hook execution                         │
│  → index.js — registry initialisation                               │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ FILE: migrations/migration-registry.js            RISK: ★★ LOW      │
├─────────────────────────────────────────────────────────────────────┤
│  → migration-runner.js — registry.get(entity)                       │
│  → index.js — registry initialisation                               │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ FILE: migrations/migration-logger.js              RISK: ★★ LOW      │
├─────────────────────────────────────────────────────────────────────┤
│  → migration-runner.js — logs success/failure per record            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ FILE: migrations/migration-runner.js              RISK: ★★★ MEDIUM  │
├─────────────────────────────────────────────────────────────────────┤
│  → migration.routes.js — bulkMigrate() call                         │
│  → demo-node — migration registration shape                         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ FILE: middleware/logger.middleware.js              RISK: ★ MINIMAL   │
├─────────────────────────────────────────────────────────────────────┤
│  → index.js — mounted on router                                     │
│  Self-contained. No downstream dependencies.                        │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ FILE: middleware/auth.middleware.js                RISK: ★ MINIMAL   │
├─────────────────────────────────────────────────────────────────────┤
│  → index.js — mounted on router                                     │
│  → data.routes.js — req.userRoles attached here                     │
│  Self-contained. Consumer provides handler.                         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ FILE: middleware/validate.middleware.js            RISK: ★★★ MEDIUM  │
├─────────────────────────────────────────────────────────────────────┤
│  → data.routes.js POST and PUT — all write operations               │
│  → req.entityConfig attached here (used in routes)                  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ FILE: middleware/error-handler.js                 RISK: ★★★★ HIGH   │
├─────────────────────────────────────────────────────────────────────┤
│  → mounted last in index.js — catches all route errors              │
│  → consumers parsing error response shape                           │
│                                                                     │
│ RULE: Never change the error response shape.                        │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ FILE: routes/config.routes.js                     RISK: ★★★ MEDIUM  │
├─────────────────────────────────────────────────────────────────────┤
│  → index.js — mounted on /config                                    │
│  → consumers calling config CRUD endpoints                          │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ FILE: routes/data.routes.js                       RISK: ★★★★ HIGH   │
├─────────────────────────────────────────────────────────────────────┤
│  → index.js — mounted on /data                                      │
│  → consumers calling all data CRUD endpoints                        │
│  → integrates: adapter, hookRegistry, rbac.utils, validate          │
│  Most complex route file. Most integration surface.                 │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ FILE: routes/migration.routes.js                  RISK: ★★ LOW      │
├─────────────────────────────────────────────────────────────────────┤
│  → index.js — mounted on /migrate                                   │
│  → consumers triggering bulk migration                              │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ FILE: index.js (router factory)            RISK: ★★★★★ CRITICAL     │
├─────────────────────────────────────────────────────────────────────┤
│  → every consumer's require('dynamic-entity-server')                │
│  → every consumer's app.use() call                                  │
│  → dynamicEntityRouter() options shape                              │
│                                                                     │
│ RULE: This is the public API. Never remove or rename an option.     │
│ Only add new optional options.                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## SOLID application in Phase 2

**S — Single Responsibility:**
- `ApiError.js` — only defines the error class
- `response.utils.js` — only formats responses
- `rbac.utils.js` — only handles permissions and masking
- `mongo.adapter.js` — only handles DB operations
- Routes — only handle HTTP layer, delegate everything to adapter/utils

**O — Open/Closed:**
- `HookRegistry` — open for new hooks via `register()`, closed for modification
- `MigrationRegistry` — open for new entity migrations, closed for modification
- `MongoAdapter` — open for extension (subclass), closed for modification in routes (depend on interface)

**L — Liskov Substitution:**
- Any class implementing `DynamicEntityAdapter` can substitute `MongoAdapter` in routes without breaking anything
- Test this by writing a `MemoryAdapter` for tests

**I — Interface Segregation:**
- `DynamicEntityAdapter` groups Config CRUD separately from Data CRUD and Migration
- Routes only import what they need

**D — Dependency Inversion:**
- Routes receive adapter as a parameter, never instantiate `MongoAdapter` directly
- `dynamicEntityRouter(options)` — adapter injected, not coupled

---

## Implementation details

### utils/ApiError.js
```js
'use strict';

class ApiError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = []) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

module.exports = ApiError;
```

### utils/response.utils.js
```js
'use strict';

const sendSuccess = (res, data, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({ success: true, data, message });

const sendPaginated = (res, data, pagination, message = 'Success') =>
  res.json({ success: true, data, pagination, message });

const sendError = (res, code, message, details = [], statusCode = 400) =>
  res.status(statusCode).json({ success: false, error: { code, message, details } });

module.exports = { sendSuccess, sendPaginated, sendError };
```

### utils/rbac.utils.js
```js
'use strict';

const MASKED_VALUE = 'XXXXXXXXX';

// SRP: each function does exactly one thing
const hasPermission = (userRoles = [], requiredRoles = []) => {
  if (!requiredRoles.length) return true;
  return userRoles.some(role => requiredRoles.includes(role));
};

// 3-level OR resolution — matches CRM ADR-004 exactly
const resolveEffectiveMask = (formMask, tabMask, fieldMask) =>
  !!(formMask || tabMask || fieldMask);

const isUserMaskedRole = (userRoles = [], maskedRoles = []) =>
  maskedRoles.some(r => userRoles.includes(r));

const shouldMaskField = (field, tab, config, userRoles, maskedRoles) => {
  if (!isUserMaskedRole(userRoles, maskedRoles)) return false;
  return resolveEffectiveMask(config.maskData, tab?.maskData, field.maskData);
};

// DRY: single masking function used by all read routes
const applyFieldMask = (record, config, userRoles, maskedRoles) => {
  const masked = { ...record };
  for (const field of config.fields || []) {
    const tab = (config.tabs || []).find(t => t.id === field.tab);
    if (shouldMaskField(field, tab, config, userRoles, maskedRoles)) {
      masked[field.id] = MASKED_VALUE;
    }
  }
  return masked;
};

module.exports = {
  MASKED_VALUE,
  hasPermission,
  resolveEffectiveMask,
  shouldMaskField,
  applyFieldMask,
};
```

### adapter/mongo.adapter.js

Key rules:
- Data collections: `entity_data_{entityKey}` — one collection per entity
- Config collection: `entity_configs` (configurable)
- All data schemas: `strict: false`, `timestamps: true`
- System fields always on data schema: `_configVersion`, `_needsMigration`, `_deletedAt`
- Indexes created on model init — not lazily:
  ```js
  schema.index({ _configVersion: 1 });
  schema.index({ _needsMigration: 1 });
  schema.index({ _deletedAt: 1 });
  schema.index({ createdAt: -1 });
  ```
- Pagination: `skip = (page-1) * pageSize`, `limit = pageSize`, cap pageSize at 100
- Soft delete: `_deletedAt = new Date()`, exclude from finds unless `includeDeleted: true`
- Config update: always push old to `history`, increment `version`
- Search: case-insensitive regex on string-type fields only, never system fields
- All methods return plain objects (`.lean()` on Mongoose queries)

### hooks/hook-registry.js
```js
'use strict';

class HookRegistry {
  constructor() {
    this._registry = new Map();
  }

  register(key, fn) {
    this._registry.set(key, fn);
    return this; // fluent API
  }

  has(key) {
    return this._registry.has(key);
  }

  async run(key, data, context = {}) {
    const hook = this._registry.get(key);
    if (!hook) return data;
    return hook(data, context);
  }
}

module.exports = HookRegistry;
```

### migrations/migration-runner.js

```js
// migrateRecord(record, config, registry)
// For each field: find FieldMigration[] where fromVersion <= record._configVersion < toVersion
// Run in version order
// Set _configVersion = config.version, _needsMigration = false
// Return migrated record

// bulkMigrate(entity, adapter, config, registry)
// 1. findRecordsNeedingMigration(entity)
// 2. For each: migrateRecord in try/catch
// 3. Log to MigrationLogger
// 4. Batch successful updates via bulkUpdateRecords
// 5. Return MigrationSummary
```

### middleware/validate.middleware.js

```js
// 1. findConfig(entity) — 404 if missing
// 2. Check required validators on req.body fields
//    Collect all errors into array, return 400 VALIDATION_FAILED with details[]
// 3. Check _configVersion if present on req.body:
//    strict → 409 MIGRATION_REQUIRED
//    graceful → req.body._needsMigration = true, continue
// 4. Attach config to req.entityConfig
// 5. next()
```

### routes/data.routes.js

RBAC check pattern (reuse on every write route):
```js
const checkPermission = (config, userRoles, permissionType) => {
  const required = config.permissions?.[permissionType] || [];
  if (!hasPermission(userRoles, required)) {
    throw new ApiError('Forbidden', 403, 'FORBIDDEN');
  }
};
```

Read masking pattern (reuse on every read route):
```js
const maskResponse = (record, config, req, options) =>
  applyFieldMask(record, config, req.userRoles || [], options.maskedRoles || []);
```

### Route definitions

**Config routes — `/config`**
```
GET    /                      → listConfigs()
GET    /:entity               → findConfig — 404 if not found
GET    /:entity/history       → getConfigHistory(entity)
POST   /                      → saveConfig — version:1, history:[]
PUT    /:entity               → updateConfig — increment version, push to history
DELETE /:entity               → deleteConfig
POST   /:entity/rollback/:version → rollbackConfig(entity, version)
```

**Data routes — `/data/:entity`**
```
GET    /                      → findRecords — paginated, masked
GET    /:id                   → findRecord — 404 if not found, masked
POST   /                      → RBAC(edit) → pre hook → validate → saveRecord → post hook
PUT    /:id                   → RBAC(edit) → pre hook → validate → updateRecord → post hook
DELETE /:id                   → RBAC(delete) → softDeleteRecord
POST   /:id/restore           → restoreRecord
DELETE /:id/hard              → RBAC(delete) → hardDeleteRecord
```

Query params on GET `/`:
`page`, `pageSize` (max 100), `sortField`, `sortDir`, `search`, `filters` (JSON string), `includeDeleted`

**Migration routes — `/migrate`**
```
GET    /:entity/status        → count _needsMigration: true records
POST   /:entity               → bulkMigrate → MigrationSummary
```

### index.js (router factory)

```js
'use strict';

const express = require('express');
const MongoAdapter = require('./adapter/mongo.adapter');
const HookRegistry = require('./hooks/hook-registry');
const MigrationRegistry = require('./migrations/migration-registry');
const loggerMiddleware = require('./middleware/logger.middleware');
const authMiddleware = require('./middleware/auth.middleware');
const errorHandler = require('./middleware/error-handler');
const configRoutes = require('./routes/config.routes');
const dataRoutes = require('./routes/data.routes');
const migrationRoutes = require('./routes/migration.routes');

/**
 * Factory function — DIP: routes receive adapter, never instantiate it
 * @param {object} options
 * @param {import('./adapter/mongo.adapter')} options.adapter
 * @param {Record<string, Function>} [options.hooks]
 * @param {Record<string, object>} [options.migrations]
 * @param {'strict'|'graceful'} [options.migrationStrategy]
 * @param {string[]} [options.maskedRoles]
 * @param {Function} [options.auth]
 * @param {boolean} [options.logging]
 */
const dynamicEntityRouter = (options = {}) => {
  const router = express.Router();

  const hookRegistry = new HookRegistry();
  Object.entries(options.hooks || {}).forEach(([k, fn]) => hookRegistry.register(k, fn));

  const migrationRegistry = new MigrationRegistry();
  Object.entries(options.migrations || {}).forEach(([e, m]) => migrationRegistry.register(e, m));

  const routeOptions = {
    adapter: options.adapter,
    hookRegistry,
    migrationRegistry,
    migrationStrategy: options.migrationStrategy || 'graceful',
    maskedRoles: options.maskedRoles || [],
  };

  if (options.logging !== false) router.use(loggerMiddleware);
  router.use(authMiddleware(options.auth));

  router.use('/config', configRoutes(routeOptions));
  router.use('/data', dataRoutes(routeOptions));
  router.use('/migrate', migrationRoutes(routeOptions));

  router.use(errorHandler);
  return router;
};

module.exports = { dynamicEntityRouter, MongoAdapter };
```

---

## Node rules for AI

- CommonJS only — `require()` / `module.exports`
- No TypeScript — plain `.js` files, no build step
- All types via JSDoc `@typedef` for editor hints only
- All errors via `ApiError` class
- All routes: try/catch → `next(err)` — never raw `res.status(500)`
- All responses via `sendSuccess()`, `sendPaginated()`, `sendError()` — never raw `res.json()`
- `strict: false` on all data Mongoose models
- Soft delete is default — `/hard` route for permanent delete
- `pageSize` capped at 100
- Config `PUT` always increments version and pushes to history
- Every new record gets `_configVersion` = current config version, `_needsMigration` = false
- RBAC: check `req.userRoles` against `config.permissions` on every write route
- Masking: apply `applyFieldMask()` on every read response
- Build order follows Blast-Radius Map dependency order (top to bottom)
- Lint-check after every file

---
---

# Phase 3 — ngx-dynamic-entity (Angular 17)

New package. Angular 17 standalone throughout. Imports types from `@dynamic-entity/core`.

---

## Folder structure

```
packages/ngx-dynamic-entity/
  src/
    lib/
      tokens/
        injection-tokens.ts          ← all InjectionTokens
      providers/
        provide-ngx-dynamic-entity.ts ← provideNgxDynamicEntity()
      services/
        config.service.ts            ← ConfigService
        field-registry.service.ts    ← FieldRegistryService
        hook-registry.service.ts     ← HookRegistryService
        validator-registry.service.ts ← ValidatorRegistryService
        entity-ref-registry.service.ts ← EntityRefRegistryService
        version.service.ts           ← VersionService
        rbac.service.ts              ← RbacService
      form/
        dynamic-form.component.ts
        dynamic-form.component.html
        dynamic-field/
          dynamic-field.component.ts
      table/
        dynamic-table.component.ts
        dynamic-table.component.html
      field-types/
        text-field.component.ts
        textarea-field.component.ts
        number-field.component.ts
        checkbox-field.component.ts
        date-field.component.ts
        dropdown-field.component.ts
        multi-select-field.component.ts
        entity-ref-field.component.ts
    public-api.ts
  package.json
  tsconfig.json
  ng-package.json
  README.md
```

---

## Blast-Radius Map — Phase 3 (per file)

Build in this exact order.

```
┌─────────────────────────────────────────────────────────────────────┐
│ FILE: tokens/injection-tokens.ts                  RISK: ★★★★ HIGH   │
├─────────────────────────────────────────────────────────────────────┤
│  → provide-ngx-dynamic-entity.ts — provides all tokens              │
│  → every service that injects a token                               │
│  → public-api.ts — exported to consumers                            │
│                                                                     │
│ RULE: Never rename a token after consumers use it.                  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ FILE: providers/provide-ngx-dynamic-entity.ts     RISK: ★★★★ HIGH   │
├─────────────────────────────────────────────────────────────────────┤
│  → every consumer's app.config.ts                                   │
│  → demo-angular/app.config.ts                                       │
│                                                                     │
│ RULE: Never remove or rename a config option.                       │
│ Only add new optional properties.                                   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ FILE: services/rbac.service.ts                    RISK: ★★★★ HIGH   │
├─────────────────────────────────────────────────────────────────────┤
│  → dynamic-form.component.ts — permission check, masking            │
│  → dynamic-table.component.ts — cell masking, action gating         │
│  → all 8 field components — masked input rendering                  │
│                                                                     │
│ CRITICAL SYNC: resolveEffectiveMask() must match                    │
│ rbac.utils.js in dynamic-entity-server exactly.                     │
│ Changing one without the other is a critical bug.                   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ FILE: services/field-registry.service.ts          RISK: ★★★★ HIGH   │
├─────────────────────────────────────────────────────────────────────┤
│  → dynamic-field.component.ts — resolve(field.type)                 │
│  → all built-in field components — pre-registered here              │
│  → every consumer registering custom fieldTypes                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ FILE: services/entity-ref-registry.service.ts     RISK: ★★★ MEDIUM  │
├─────────────────────────────────────────────────────────────────────┤
│  → entity-ref-field.component.ts — resolve(field.component??field.id)│
│  → every consumer registering entityRefs                            │
│                                                                     │
│ RULE: entity-ref options ONLY from this registry.                   │
│ Never via @Input() directly on any component.                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ FILE: services/version.service.ts                 RISK: ★★★ MEDIUM  │
├─────────────────────────────────────────────────────────────────────┤
│  → dynamic-form.component.ts — checkRecord() on initialData         │
│  → dynamic-table.component.ts — needsMigration() per row            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ FILE: services/validator-registry.service.ts      RISK: ★★ LOW      │
├─────────────────────────────────────────────────────────────────────┤
│  → dynamic-form.component.ts — buildForm() validator resolution     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ FILE: services/hook-registry.service.ts           RISK: ★★ LOW      │
├─────────────────────────────────────────────────────────────────────┤
│  → dynamic-form.component.ts — pre/post hook on submit              │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ FILE: services/config.service.ts                  RISK: ★★ LOW      │
├─────────────────────────────────────────────────────────────────────┤
│  → dynamic-form.component.ts — when fetching config by URL          │
│  → dynamic-table.component.ts — when fetching config by URL         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ FILE: field-types/*.component.ts (all 8)          RISK: ★★ LOW      │
├─────────────────────────────────────────────────────────────────────┤
│  → field-registry.service.ts — pre-registered here                  │
│  → dynamic-field.component.ts — mounted via createComponent()       │
│                                                                     │
│ REUSABILITY RULE: All field components share the same input         │
│ contract: field, control, language, readonly, masked.               │
│ Build a base abstract class or shared interface for this.           │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ FILE: form/dynamic-field.component.ts             RISK: ★★★★ HIGH   │
├─────────────────────────────────────────────────────────────────────┤
│  → dynamic-form.component.ts — renders every field through here     │
│  → every built-in and custom field component — mounted here         │
│                                                                     │
│ RULE: Never add field-type-specific logic here.                     │
│ This component must remain generic.                                 │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ FILE: form/dynamic-form.component.ts              RISK: ★★★★ HIGH   │
├─────────────────────────────────────────────────────────────────────┤
│  → every consumer template using <ngx-dynamic-form>                 │
│  → demo-angular                                                     │
│                                                                     │
│ RULE: Never remove an @Input() or @Output() in a minor version.     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ FILE: table/dynamic-table.component.ts            RISK: ★★★★ HIGH   │
├─────────────────────────────────────────────────────────────────────┤
│  → every consumer template using <ngx-dynamic-table>                │
│  → demo-angular                                                     │
│                                                                     │
│ RULE: Never remove an @Input() or @Output() in a minor version.     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ FILE: public-api.ts                        RISK: ★★★★★ CRITICAL     │
├─────────────────────────────────────────────────────────────────────┤
│  → every consumer's import statements                               │
│                                                                     │
│ RULE: Never remove an export. Only add. Removing is a major bump.   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## SOLID application in Phase 3

**S — Single Responsibility:**
- `RbacService` — only permission checks and masking
- `FieldRegistryService` — only field type resolution
- `EntityRefRegistryService` — only entity-ref loader resolution
- `VersionService` — only config version comparison and migration strategy
- `DynamicFieldComponent` — only mounts the right field component, nothing else
- Each field component — only renders its own field type

**O — Open/Closed:**
- Field types: open for extension via `FIELD_TYPE_REGISTRY`, core engine closed
- Validators: open via `VALIDATOR_REGISTRY`
- Hooks: open via `HOOK_REGISTRY`
- Entity refs: open via `ENTITY_REF_REGISTRY`

**L — Liskov:**
- All field components are interchangeable — same input contract (`field`, `control`, `language`, `readonly`, `masked`)
- Custom field components must satisfy the same contract to be registered

**I — Interface Segregation:**
- `provideNgxDynamicEntity()` config has all optional properties — consumers provide only what they use

**D — Dependency Inversion:**
- `DynamicFormComponent` depends on `FieldRegistryService` interface, not on `TextFieldComponent`
- All field components injected via registry, not imported directly

---

## Shared field component contract (reusability rule)

All 8 built-in field components AND all consumer custom field components must satisfy this exact interface:

```ts
// This is the contract. Every field component implements it.
// DRY: DynamicFieldComponent passes these inputs via setInput()
// for ALL field types — no special casing per type.

@Input() field!: FieldConfig;           // field definition from config
@Input() control!: AbstractControl;     // reactive form control
@Input() language: string = 'en';       // active language key
@Input() readonly: boolean = false;     // form-level readonly
@Input() masked: boolean = false;       // whether to show XXXXXXXXX
```

If `masked === true` → render `<span class="ngx-field__value ngx-field__value--masked">XXXXXXXXX</span>`
If `readonly === true` → render `<span class="ngx-field__value">` with value
Otherwise → render the input element

---

## CSS naming (BEM, ngx- prefix)

```
ngx-field                      ← field wrapper
ngx-field--text                ← modifier: field type
ngx-field--readonly            ← modifier: readonly state
ngx-field--masked              ← modifier: masked state
ngx-field--invalid             ← modifier: validation error state
ngx-field__label               ← element: label
ngx-field__input               ← element: input
ngx-field__error               ← element: error message
ngx-field__value               ← element: readonly/masked display value
ngx-field__value--masked       ← modifier on value element

ngx-form                       ← form wrapper
ngx-form__tabs                 ← tab bar
ngx-form__tab                  ← single tab button
ngx-form__tab--active          ← active tab modifier
ngx-form__panel                ← tab panel content
ngx-form__migration-banner     ← migration warning
ngx-form__submit               ← submit button

ngx-table                      ← table wrapper
ngx-table__search              ← search input
ngx-table__th                  ← header cell
ngx-table__td                  ← data cell
ngx-table__td--masked          ← masked cell modifier
ngx-table__migration-badge     ← needs migration badge
ngx-table__actions             ← action buttons cell
ngx-table__empty               ← empty state row
ngx-table__pagination          ← pagination controls
```

---

## Key components

### RbacService
```ts
@Injectable({ providedIn: 'root' })
export class RbacService {
  private maskedRoles = inject(MASKED_ROLES, { optional: true }) ?? [];

  hasPermission(userRoles: string[], requiredRoles?: string[]): boolean {
    if (!requiredRoles?.length) return true;
    return userRoles.some(r => requiredRoles.includes(r));
  }

  // Must match rbac.utils.js resolveEffectiveMask() exactly
  resolveEffectiveMask(formMask?: boolean, tabMask?: boolean, fieldMask?: boolean): boolean {
    return !!(formMask || tabMask || fieldMask);
  }

  shouldMaskField(field: FieldConfig, tab: TabConfig | undefined, config: EntityConfig, userRoles: string[]): boolean {
    const isMaskedRole = this.maskedRoles.some(r => userRoles.includes(r));
    if (!isMaskedRole) return false;
    return this.resolveEffectiveMask(config.maskData, tab?.maskData, field.maskData);
  }
}
```

### DynamicFormComponent inputs/outputs
```ts
// Inputs
@Input() config!: EntityConfig;
@Input() initialData?: Record<string, any>;
@Input() userRoles: string[] = [];
@Input() language: string = 'en';
@Input() readonly: boolean = false;
@Input() loading: boolean = false;
@Input() error: string | null = null;

// Outputs
@Output() formSubmit = new EventEmitter<Record<string, any>>();
@Output() formChange = new EventEmitter<Record<string, any>>();
@Output() formReset = new EventEmitter<void>();
```

### DynamicTableComponent inputs/outputs
```ts
// Inputs
@Input() config!: EntityConfig;
@Input() data: VersionedRecord[] = [];
@Input() userRoles: string[] = [];
@Input() language: string = 'en';
@Input() loading: boolean = false;
@Input() error: string | null = null;
@Input() totalRecords: number = 0;
@Input() pageSize: number = 20;
@Input() currentPage: number = 1;

// Outputs
@Output() rowClick = new EventEmitter<VersionedRecord>();
@Output() rowEdit = new EventEmitter<VersionedRecord>();
@Output() rowDelete = new EventEmitter<VersionedRecord>();
@Output() pageChange = new EventEmitter<number>();
@Output() pageSizeChange = new EventEmitter<number>();
```

---

## Angular rules for AI

- Angular 17+ — standalone everywhere, no NgModule
- All types from `@dynamic-entity/core` — never redeclare
- `inject()` only — no constructor injection
- `@if`, `@for`, `@switch`, `@empty` — never `*ngIf`, `*ngFor`
- Signals for local reactive state (`searchTerm`, `sortField`, `sortDir`, `activeTab`)
- Reactive Forms only
- Zero external dependencies
- Zero default CSS — `ngx-*` BEM class names only
- `MigrationStrategy` on frontend is `'strict' | 'graceful'` only — never `'auto'`
- entity-ref options ONLY through `EntityRefRegistryService` — never `@Input()`
- RBAC and masking ONLY through `RbacService` — never inline in components
- All field components satisfy the shared contract (field, control, language, readonly, masked)
- Build order follows Blast-Radius Map top to bottom
- Compile-check after every file

---

## public-api.ts

```ts
export * from './lib/tokens/injection-tokens';
export * from './lib/providers/provide-ngx-dynamic-entity';
export * from './lib/services/config.service';
export * from './lib/services/field-registry.service';
export * from './lib/services/hook-registry.service';
export * from './lib/services/validator-registry.service';
export * from './lib/services/entity-ref-registry.service';
export * from './lib/services/version.service';
export * from './lib/services/rbac.service';
export * from './lib/form/dynamic-form.component';
export * from './lib/table/dynamic-table.component';

// Re-export core types so consumers need only one import
export type {
  EntityConfig, FieldConfig, TabConfig, DropdownOption,
  FieldDependency, EntityHooks, VersionedRecord,
  EntityPermissions, RbacContext, MigrationStrategy,
} from '@dynamic-entity/core';
```

---
---

# Phase 4 — Demo Apps + CI/CD

---

## demo-node

- CommonJS, connects to local MongoDB
- Uses `MongoAdapter`
- Seeds 20 realistic client records (real names, real-looking data — no lorem ipsum)
- Configures `maskedRoles: ['IT_SUPPORT']`
- Registers `beforeSave` and `afterSave` hooks
- Registers a `status` field migration (text → dropdown) for clients entity
- Exposes all routes on `/api/entities`

## demo-angular

- Connects to demo-node via HTTP
- Uses `provideNgxDynamicEntity()` with custom phone field, validators, entity-ref loaders
- Includes a role switcher UI (`['admin']`, `['IT_SUPPORT']`, `['viewer']`) to demonstrate masking live
- Demonstrates: form with tabs, field dependencies, entity-ref, readonly, masking, migration banner
- Demonstrates: table with pagination, search, sort, masked cells, `_needsMigration` badge
- Real-looking client data throughout

---

## GitHub Actions

### ci.yml — on every PR
```yaml
name: CI
on: [pull_request]
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx turbo lint
      - run: npx turbo test
      - run: npx turbo build
```

### publish.yml — on merge to main
```yaml
name: Publish
on:
  push:
    branches: [main]
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: https://registry.npmjs.org
      - run: npm ci
      - run: npx turbo build
      - uses: changesets/action@v1
        with:
          publish: npx changeset publish
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---
---

# Antigravity Integration

---

## Antigravity Rules

- Read `.onehermes/` at the start of every session
- One file per atomic commit — conventional commit format
- Write Blast-Radius Map for the specific file before touching it
- Log ADR before implementing any architectural decision
- Never change `@dynamic-entity/core` interfaces after Phase 1 without new ADR + major version bump
- Confirm `npx turbo build` clean after each phase before starting the next
- `rbac.utils.js` (Node) and `RbacService` (Angular) must always stay in sync — any change to one requires same change to the other in the same commit

---

## ADR Stubs

Create these as files in `.antigravity_memory/adrs/` before writing any code.

**ADR-001 — CommonJS for Node package**
Decision: CommonJS JavaScript, no build step. Matches CRM. Simpler for contributors.
Consequences: No compile-time type errors. Use JSDoc for editor hints.

**ADR-002 — strict: false on data models**
Decision: Mongoose `strict: false` on all data collections.
Reason: Dynamic entity records have no fixed shape. Config defines shape at runtime.
Consequences: No schema-level type enforcement on user data. Validate via middleware.

**ADR-003 — RBAC and masking as first-class features**
Decision: 3-level mask hierarchy (`Form || Tab || Field`) and `EntityPermissions` in v1.
Reason: Production feature from CRM. Core use case.
Consequences: `rbac.utils.js` and `RbacService` must always implement identical logic.

**ADR-004 — Industry standard REST response shape**
Decision: `{ success, data, message }` / `{ success, error }` / `{ success, data, pagination }`.
Reason: Clean public API for open source consumers. CRM had a slightly different shape.
Consequences: Consumers cannot parse the same way as the CRM. Must adapt.

**ADR-005 — MigrationStrategy 'auto' server-side only**
Decision: Angular only exposes `'strict' | 'graceful'`. `'auto'` only in Node package.
Reason: Auto-migration in the browser creates inconsistent state.
Consequences: Frontend consumers trigger migration via `POST /migrate/:entity`.

**ADR-006 — entity-ref options through registry only**
Decision: `EntityRefRegistryService` is the only source for entity-ref options.
Reason: Generic component mounting via `createComponent()` cannot receive `@Input()` loaders.
Consequences: Consumers must register loaders in `provideNgxDynamicEntity({ entityRefs: {...} })`.

**ADR-007 — No multi-tenancy in v1**
Decision: No `getModelByTenant()` pattern. Single connection per adapter instance.
Reason: Complexity. Consumer responsibility. Different consumers use different strategies.
Consequences: Multi-tenant consumers must extend `MongoAdapter` or implement their own.

**ADR-008 — Shared field component contract**
Decision: All field components (built-in and custom) satisfy the same 5-input contract.
Reason: DRY and LSP — `DynamicFieldComponent` passes inputs generically via `setInput()`.
Consequences: Custom field components that don't satisfy the contract will fail silently.

---

## Session Start Checklist

1. Read all `.onehermes/` files
2. Read all ADRs in `.antigravity_memory/adrs/`
3. Identify which phase and which file you are building
4. Read the Blast-Radius Map for that file
5. Confirm previous phase compiled/linted clean
6. Write the file
7. Lint-check (Node) or compile-check (Angular)
8. Commit atomically: `feat(core): add config.types.ts`
9. Move to the next file in the dependency order
