# Memory Track: Operational Task Module

**Module Designation:** `OperationalTask` / `TaskCreation`
**Owner:** UI Application (`Superpower_Web`), Angular Client
**Target Files:**
- `src/app/components/activeWork/operational-task/*`
- `src/app/commonModules/task-creation/*`
- `src/app/api/project/task.service.ts`

## Purpose
This memory node tracks all architectural decisions, bug remediations, and structure changes explicitly related to the Operational Tasks and Kanban Board components. It operates separately from the `DynamicEntityV2` Metadata Engine.

---
## Architectural Traits & Quirks
- **Task Creation Component (`task-creation`):** Acts as a monolithic shared modal/component handling multiple insertion paths: Adhoc Tasks, Business Process Tasks, and generic Tasks.
- **Save Paradigm:** Currently uses generic Angular FormGroups and `submitTaskData()`. Emits events directly into shared `TaskService` instances, generating multiple generic event hooks (`subscribeToCreateTask`).

---
**LAST_ACTION**: Successfully applied Atomic Commit to resolve OV0-112 ("Multiple API Calls on Save") within `task-creation.component.ts`. Centralized dynamic event subscriptions into `ngOnInit` to destroy the listener loop, and applied strict TS/HTML `isSaving` logic traps.
**PENDING_REFINEMENT**: Awaiting next sprint directive. Ready to deploy the same defensive footprint to `entity-record.component` when assigned.
