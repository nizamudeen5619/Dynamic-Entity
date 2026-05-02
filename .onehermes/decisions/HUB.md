# System Router (The Hub)

## 1. Global Tech Stack Map

### Frontend: Superpower_Web (Angular)
- **Framework**: Angular v17.3.12 (with `@angular/core`, `@angular/forms`, etc.)
- **Language**: TypeScript v5.2.2
- **UI Components**: PrimeNG v17.2.0, PrimeFlex, PrimeIcons
- **State/Reactivity**: RxJS ~7.8.1
- **Styling**: SCSS (compiled via standard Angular CLI configuration)
- **Rich Media**: Quill v1.3.7, TinyMCE, `signature_pad` v5.0.4
- **Visualization/PDF**: Chart.js, ApexCharts, `pdfmake`, `html2canvas`

### Backend: Superpower-App (Express)
- **Runtime**: Node.js >= 18.0.0
- **Framework**: Express v4.17.1
- **Database Engine**: MongoDB v6.21.0 w/ Mongoose v8.23.0
- **Authentication**: JWT (`jsonwebtoken`), Passport (`passport`, `passport-jwt`, `passport-oauth2`)
- **Process Manager**: PM2 v5.1.0
- **Cloud/Blob Storage**: AWS SDK S3, Google Cloud Storage, Azure Identity
- **Other Core Utilities**: `joi` for validation, `morgan`/`winston` for logging, `socket.io` for realtime, Node-Cache

---

## 2. Infrastructure & Network Topology

### Environments & Secrets (`.env` vs `environment.ts`)
- **Backend (.env)**: Express server runs natively on `PORT=3000`. MongoDB utilizes a multitenant replica connection string. Exposes APIs at `http://localhost:3000`. Supports tenant scoping via `TENANT_IDS`.
- **Frontend (environment.service.ts)**: Replaces hardcoded config by parsing `window.location.hostname` and intercepting path realms to dynamically configure `base_url` and `api_url` mapping objects. It bridges calls via an abstracted dictionary (e.g., `this.API_URL['entity_form_v2']`).

---

## 3. Connection Map (UI -> API)

**Pattern**: Angular `ApiServices` are abstracted via common services communicating with standard Express REST routers.

- `FormConfigService` ↔ GET/POST/PATCH `/configuration/dynamic_entity_v2`
- `EntityDataService` ↔ GET/POST/PATCH `/configuration/dynamic_entity_form_v2/`
- `EntityReferenceService` ↔ Resolves linked fields by cross-referencing DynamicEntityV2 Form APIs.
- `TablePreferenceApiService` ↔ POST `/preferences/query`

---

## 3. Module & Legacy Index

All mapped system modules are broken down into discrete "Spoke" records containing their specific Golden Threads and dependencies. The legacy contexts extracted from external assistants are also bridged here.

1. [MODULE_DynamicEntityV2](./MODULE_DynamicEntityV2.md) - *The Metadata Engine*
2. [MODULE_OperationalTask](./MODULE_OperationalTask.md) - *The Operational Task & Kanban Creation Module*
3. [CLAUDE_LEGACY_INDEX](./CLAUDE_LEGACY_INDEX.md) - *Architectural directives and context extracted from Claude logs*

---

## 4. Stability Milestones

- **[x] OT-01: Operational Task Hardening (OV0-112)**
  - *Resolved duplicate API call "spam" by implement `isSaving` state-locks and detangling subscription loops.*
- **[x] DE-01: Dynamic Entity Sync Hardening**
  - *Implemented "Global Discovery" deep-merge logic to preserve user layouts while enforcing schema structural integrity.*
- **[x] DE-02: Metadata Immutability Locks**
  - *Sealed UI-level structural properties (ID, Path, Type) for system fields to prevent configuration drift.*
- **[x] DE-03: Hierarchical Data Masking & Form-Level RBAC (2026-04-14)**
  - *3-level mask inheritance (Form/Tab/Field) with OR logic. Backend Stage 1 pipeline optimization (40-60% faster). Frontend pre-resolved mask + defense-in-depth. Form-level RBAC with view/edit/delete permissions. Phase 2 extension points reserved for tab/field-level granularity.*
  - **Commits:** Backend `bf6c9a1d`, Frontend `a0ed2a3e8` — Branch: `feat/dynamic-entity-hardening`
- **[x] DX-01: Development Experience Improvements (2026-04-28)**
  - *5 major improvements: (1) Permissions cleanup (159 → 5 rules), (2) Command templates system (/scaffold, /perf-audit, /security-scan, /integration-test, /refactor-plan), (3) Integration helper guides (4 comprehensive patterns), (4) Organization memories (5 reference docs), (5) Feature scaffold system (Node.js generator with 8 templates)*
  - **Status:** All improvements implemented and documented. Scaffold system tested and fixed template references.

---


## 4. Architectural Rules & Constraints

> **Rule [SYNC-01]:** "You are forbidden from finalizing a Backend change without generating a 'UI Impact Report.' This report must list every Angular Service, Component, and Interface that needs to change to match the new API contract."

> [!NOTE]
> *No critical binary or proprietary file formats were encountered during the Claude log extraction that required manual conversion. The `history.jsonl` was natively decoded.*
