# Memory Index

**Last Updated:** 2026-04-28

## Completed Implementations (Latest — 2026-04-28)

- [Development Experience Improvements 2026-04-28](../../.claude/projects/n--Work-backup/memory/development_experience_improvements_2026_04_28.md) — ✅ **COMPLETE** — 5 major improvements: Permissions cleanup, Command templates (5 guides), Integration helpers (4 patterns), Organization memories (5 docs), Feature scaffold system. Unified memory system consolidation.

## Completed Implementations (Prior)

- [Implementation Summary 2026-04-19](IMPLEMENTATION_SUMMARY_2026_04_19.md) — ✅ **COMPLETE** — Full change inventory, file-by-file breakdown, commit hashes, testing results, deployment checklist

- [ADR-006 through ADR-009](ADR_LOG_LATEST.md) — ✅ **COMPLETE** — listName field, system readonly, performance hardening
  - **ADR-006**: listName field tracking & smart list deduplication
    - Backend commits: `1d690a70` (main), `31512b48` (validation), `aa799ed5` (flatData)
    - Frontend commit: `76b8fbfe8`
    - Branch: `feature/listname-field-config` (both repos pushed, ready for PR)
  - **ADR-007**: System field immutability & readonly markers (userId, individualNumber, employeeNumber, orgId)
  - **ADR-008**: Professional tab metadata flag (flatData)
  - **ADR-009**: Dynamic entity sync performance & correctness hardening (O(n²) → O(n·k) + localPlacedIds)

- [RBAC Advanced Analysis](RBAC_ADVANCED_ANALYSIS.md) — ✅ **COMPLETE** — Hierarchical data masking & form-level RBAC fully implemented and deployed
  - Backend commit: `bf6c9a1d` (12 files, 360 insertions)
  - Frontend commit: `a0ed2a3e8` (19 files, 7227 insertions)
  - Branch: `feat/dynamic-entity-hardening` (both repos pushed)

## Reference Materials

**Deep Analysis & Integration Maps:**
- [INTEGRATION_MAP_DEALS_PRODUCTS](INTEGRATION_MAP_DEALS_PRODUCTS.md) — ✅ Comprehensive analysis: How Deals currently integrate with X; Product model comparison; SearchComponent flow; 8 critical implementation hurdles; decision points; migration roadmap

**Core Architecture:**
- [HUB](HUB.md) — System router and global tech stack map
- [ADR LOG](ADR_LOG.md) — Architectural decision records (foundational)
- [ADR LOG LATEST](ADR_LOG_LATEST.md) — Latest ADRs (006-009: listName, readonly, perf optimization)
- [MODULE_DynamicEntityV2](MODULE_DynamicEntityV2.md) — Metadata engine golden thread (updated with LAST_ACTION)
- [MODULE_OperationalTask](MODULE_OperationalTask.md) — Operational task and Kanban module

**Schema & Patterns:**
- [SCHEMA_SNAPSHOTS](SCHEMA_SNAPSHOTS.md) — Database schema snapshots (foundational)
- [SCHEMA_SNAPSHOTS_LISTNAME](SCHEMA_SNAPSHOTS_LISTNAME.md) — listName field before/after schemas
- [CLAUDE_LEGACY_INDEX](CLAUDE_LEGACY_INDEX.md) — Legacy code and architectural directives

**Onboarding:**
- [ONBOARDING_REVIEW](ONBOARDING_REVIEW.md) — Onboarding and context review
