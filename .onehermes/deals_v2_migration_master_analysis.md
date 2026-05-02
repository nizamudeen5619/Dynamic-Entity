# Deals V2 Migration: Master Impact & Strategy Document

## 1. Executive Summary
The total replacement of Deals V1 with the V2 (Dynamic Entity) module involves a full decommissioning of legacy components and the redirection of all cross-module integrations. While the UI upgrade is significant, the transition introduces critical technical risks in automated backend workflows and data consistency that must be addressed.

---

## 2. UI & Frontend Impact Analysis

### 2.1 Navigation & Integration Swap
Every occurrence of the legacy `openDealSideBar()` method must be refactored. The following integrated modules are affected:
- **Organizations & Individuals**: The "Related Deals" tabs currently attempt to open the `KanbanSidebarComponent`.
    - *Impact*: Inconsistent UX and risk of editing records using an outdated schema.
- **Dashboards**: All "View Deal" buttons on charts and widgets are hardcoded to the V1 sidebar.
- **Project Management**: Links from project tasks back to deals will break if not updated to the dynamic route.

### 2.2 Functional Shifts
- **Sidebar vs. Navigation**: Transition from a "Stay-in-place" editing experience (Sidebar) to a "Full-page" editing experience (Router navigation).
- **View Persistence**: V2 introduces `localStorage` tracking for `viewMode`, a significant upgrade over the stateless V1.

---

## 3. Frontend API & Service Analysis

### 3.1 Hybrid Data Fetching Risk
Currently, the V2 module operates in a hybrid state:
- **Table View**: Uses the **Dynamic Query Engine** (`/preferences/query`).
- **Kanban View**: Uses the **Legacy Deal API** (`/leads/deal/`) via `KanbanService`.
- *Critical Risk*: Data discrepancy. If the backend migration changes the schema, the Kanban board and Table view within V2 will show different data for the same record.

### 3.2 Signal Synchronization
- The `DealService` refactor ensures that legacy components still receive `dealRefresh` signals. However, V2 now relies on a mix of global emitters and local observable success callbacks.

---

## 4. Backend (`Superpower-App`) Impact Analysis

### 4.1 Broken Automation Workflows (Critical)
The legacy `DealController` contains hardcoded business logic that is **bypassed** when using Dynamic Entities:
- **Project Generation**: The `generateProjects(deal)` logic is triggered only on the `/leads/deal` PATCH endpoint. Moving a deal to the "Convert" stage in V2 will **NOT** create a project.
- **Milestone Generation**: Specialized calculation logic for payment frequencies is tied to the legacy controller and is unavailable in the generic dynamic API.

### 4.2 Metadata & Event Sync
- The legacy controller emits `sync-report-metadata` on every write. The dynamic controller must be verified to ensure it emits this same event, otherwise, **Reports and Dashboards** will fail to update.

---

## 5. Risk Matrix & Mitigations

| Risk | Severity | Mitigation Strategy |
| :--- | :--- | :--- |
| **Workflow Breakage** | **Blocker** | Port `generateProjects` logic to a Dynamic Entity backend hook/middleware. |
| **Data Inconsistency** | **High** | Update `DealService` to normalize dynamic responses to the legacy schema during the transition. |
| **Double Refreshes** | **Medium** | Remove local `getDealsDatas()` calls and rely on `KanbanService` emitters (Already Applied). |
| **RBAC Security** | **Medium** | Verify "Deals" Dynamic Form permissions match legacy `view-deal`/`add-deal` roles. |

---

## 6. Phase-Wise Implementation Checklist

### Phase 1: Preparation
- [ ] Port `generateProjects` logic to the backend dynamic entity lifecycle.
- [ ] Verify `sync-report-metadata` emission in dynamic controllers.
- [ ] Align field naming between Dynamic Entity Config and Legacy JSON (e.g., `dealName` vs `name`).

### Phase 2: Integration Swap
- [ ] Update `DealsRoutingModule` to make `DealsV2Component` the default route (`''`).
- [ ] Globally refactor `openDealSideBar` to use `router.navigate(['/dynamic-form/deals', id])`.

### Phase 3: Decommissioning
- [ ] Remove `KanbanSidebarComponent`, `KanbanListComponent`, and `KanbanCardComponent` (Legacy).
- [ ] Delete `deals.component.ts/html` (V1).
- [ ] Clean up `DealsModule` declarations.
