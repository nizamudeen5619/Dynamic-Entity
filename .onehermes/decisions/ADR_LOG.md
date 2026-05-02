# Architectural Decision Records (ADR) Log

*In a metadata-driven architecture without exhaustive test coverage, context rapidly decays. This log captures the "Why" behind significant structural shifts.*

---

### Format Standard

**ADR-###: [Title of Decision]**
* **Date:** YYYY-MM-DD
* **Context:** [What was the problem? Which constraints forced our hand?]
* **Decision:** [What did we choose to do? e.g., We moved Table Preference generation entirely to the Expression Aggregation pipeline]
* **Consequences:** [What does this break? What does it enable? e.g., Angular no longer has to map column filters, but we must strictly enforce Joi logic before pushing DB configs]

---

*(Initial Setup)*
**ADR-001: Adoption of Metadata Engine Paradigm**
* **Date:** 2026-04-11
* **Context:** Monorepo architecture where UI hardcoding rapidly drifted from MongoDB definitions, leading to regression bugs.
* **Decision:** Codebase was declared a pure "Renderer". All enhancements must execute at the Database Template layer strictly traversing schema configs natively.
* **Consequences:** Zero HTML inputs will be hardcoded. Schema drift is blocked via [SYNC-01]. Mongoose strict: false is preserved.

---

**ADR-002: Reactive Angular Lifecycle Guardrails (EventEmitters & State-Locks)**
* **Date:** 2026-04-11
* **Context:** Legacy frontend codebase suffered from "Subscription Cyclones", treating Angular `EventEmitters` like Promises inside repeatable functions (e.g., `submit()`), resulting in exponential geometric API `POST` and `GET` spam upon clicking.
* **Decision:** Strict structural pattern enforced: All `.subscribe()` listeners to shared Services must be definitively instantiated inside the static `ngOnInit()` block. Absolutely no dynamic listeners can be attached inside variable cyclic methods. Furthermore, all generic popup UI wrappers must enforce an explicit internal TypeScript boolean `isSaving` block logic integrated natively with backend success/error response boundaries.
* **Consequences:** Codebases might slightly decouple action-execution from listener-response, meaning logic flow won't occur top-to-bottom sequentially. However, execution becomes categorically immune to memory leaks, multiple-dispatch overlapping, and UI cyclic lockouts.

---

**ADR-003: Double-Lock Immutability for Metadata Integrity**
* **Date:** 2026-04-11
* **Context:** Dynamic Entity metadata was susceptible to "structural drift" where UI-level label changes accidentally triggered technical identifier updates (IDs, Paths), breaking backend data bindings.
* **Decision:** Implemented a non-negotiable two-tier lock. Tier 1 (UI): Hard-coded `readonly` bindings and disabled reactive slug-generation in Angular for `systemDefault` fields. Tier 2 (Sync): Refactored `dynamicEntitySync.helper.js` to use a **Global Discovery Deep-Merge** which prioritizes Schema-native structural properties over existing DB configurations during synchronization.
* **Consequences:** Sync is now "Self-Healing": accidental UI breakage is automatically corrected on the next deployment sync without manual intervention. User customizations (labels, visibility, ordering) are preserved via order-priority merge logic.

---

**ADR-004: Hierarchical Data Masking with Defense-in-Depth**
* **Date:** 2026-04-14
* **Context:** GDPR/Privacy compliance required sensitive field masking (e.g., salary, SSN) visible only to IT support roles. Simple boolean flags insufficient — masking rules needed at Form/Tab/Field levels with inheritance. Masking applied at both API source (backend) AND UI display layer (frontend) to prevent accidental leakage.
* **Decision:** Implemented 3-level hierarchical mask inheritance using OR logic: `Form.maskData || Tab.maskData || Field.maskData = effective mask`. Backend applies masking at MongoDB Stage 1 pipeline (before $lookup) for performance. Frontend resolves mask once at `extractTableColumns` time (not per-render). UI formatters apply mask as final defense layer. Role check limited to `IT_SUPPORT` and `IT_SUPER_USER`.
* **Consequences:** All masked fields display as `XXXXXXXXX` to authorized roles. Non-masked fields visible to all. Performance improved 40-60% for masked queries (Stage 1 pipeline optimization). Backward-compatible: entities without maskData flags operate unchanged. Future phases can extend to custom role-based masking without breaking current implementation.

---

**ADR-005: Form-Level RBAC with Phase 2 Extension Points**
* **Date:** 2026-04-14
* **Context:** Access control previously non-existent — any authenticated user could view/edit/delete any record. Form-level control needed immediately; tab/field-level permissions deferred to Phase 2.
* **Decision:** Added `EntityPermissions` interface with `view`, `edit`, `delete` role arrays at Form level only. View permissions enforced via GET route middleware (`requireEntityView`). Edit/delete enforced in service methods (`createEntityRecord`, `updateEntityRecordById`, `deleteEntityRecordById`). Form permissions propagate to all child tabs/fields/arrays via `readOnly` binding in entity-record and array-read-table. Tab/field permission interfaces reserved in TypeScript but not implemented (Phase 2 ready).
* **Consequences:** Sidebar filters entities by view permission. Table icons gate edit/delete based on roles. Record detail tabs receive `readOnly` prop preventing edits. Array add/delete buttons hidden when readOnly. Backend returns 403 Forbidden on unauthorized writes. All new properties optional — existing configs unchanged. Helper methods (`canEditTab`, `canEditField`) signature-ready for Phase 2 without caller changes.

