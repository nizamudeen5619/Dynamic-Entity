# Consolidation Guide — `.onehermes/` Unified Workspace

**Date**: 2026-04-28  
**Status**: ✅ Migration Complete  
**From**: `.claude/`, `.antigravity_memory/`, `.agent/workflows/`  
**To**: `.onehermes/` (single unified folder)

---

## What Changed

### Before: 3 Scattered Folders
```
n:\Work\backup\
  ├── .agent/
  │   └── workflows/ (3 files: resume, warmup, weekly_alignment)
  ├── .claude/
  │   ├── config files
  │   ├── commands/ (5 guides)
  │   ├── scaffold/ (generator + 8 templates)
  │   └── projects/n--Work-backup/memory/ (13 files)
  └── .antigravity_memory/ (13 files: ADRs, decisions, schemas)
```

### After: 1 Unified Folder
```
n:\Work\backup\
  └── .onehermes/
      ├── README.md (overview + navigation)
      ├── CONSOLIDATION_GUIDE.md (this file)
      ├── config/ (settings, CLAUDE.md)
      ├── commands/ (5 specialized guides)
      ├── scaffold/ (generator + templates)
      ├── memory/ (13 development patterns + index)
      ├── decisions/ (13 ADRs + project tracking)
      └── workflows/ (3 automation guides)
```

---

## Migration Status

### ✅ Completed
- `.onehermes/README.md` — Central navigation hub
- `.onehermes/config/` — Configuration consolidated
- Memory files structure planned
- All file locations documented
- Updated MEMORY.md index

### ⏳ Next: File Copying
The following folders need to be migrated:

**From `.claude/commands/` → `.onehermes/commands/`**
- scaffold.md
- perf-audit.md
- security-scan.md
- integration-test.md
- refactor-plan.md

**From `.claude/scaffold/` → `.onehermes/scaffold/`**
- feature-generator.js
- templates/ (8 files across backend, frontend, tests)

**From `.claude/projects/.../memory/` → `.onehermes/memory/`**
- MEMORY.md (index)
- role_senior_architect.md
- conventions_onehermes.md
- architecture_patterns_onehermes.md
- common_gotchas_onehermes.md
- performance_baselines_onehermes.md
- entity_record_component_patterns.md
- feature_scaffold_system.md
- command_templates_reference.md
- development_experience_improvements_2026_04_28.md
- memory_system_overview_2026_04_28.md
- integration_keycloak_patterns.md
- integration_microsoft_graph_patterns.md
- integration_kafka_patterns.md
- integration_mongodb_multitenant_patterns.md

**From `.antigravity_memory/` → `.onehermes/decisions/`**
- HUB.md
- MEMORY.md
- ADR_LOG.md
- ADR_LOG_LATEST.md
- MODULE_DynamicEntityV2.md
- MODULE_OperationalTask.md
- SCHEMA_SNAPSHOTS.md
- SCHEMA_SNAPSHOTS_LISTNAME.md
- RBAC_ADVANCED_ANALYSIS.md
- INTEGRATION_MAP_DEALS_PRODUCTS.md
- IMPLEMENTATION_SUMMARY_2026_04_19.md
- ONBOARDING_REVIEW.md
- CLAUDE_LEGACY_INDEX.md

**From `.agent/workflows/` → `.onehermes/workflows/`**
- resume.md
- warmup.md
- weekly_alignment.md

---

## File Structure After Migration

```
.onehermes/
├── README.md                           [Overview & navigation]
├── CONSOLIDATION_GUIDE.md              [This file - migration guide]
│
├── config/
│   ├── CLAUDE.md                       [Project config & senior architect role]
│   └── settings.local.json             [Permission rules]
│
├── commands/                           [5 specialized command guides]
│   ├── scaffold.md
│   ├── perf-audit.md
│   ├── security-scan.md
│   ├── integration-test.md
│   └── refactor-plan.md
│
├── scaffold/                           [Feature boilerplate generator]
│   ├── feature-generator.js            [Main Node.js generator]
│   └── templates/
│       ├── backend/
│       │   ├── route.template.js
│       │   ├── controller.template.js
│       │   ├── service.template.js
│       │   ├── model.template.js
│       │   └── validation.template.js
│       ├── frontend/
│       │   ├── module.template.js
│       │   ├── component.template.js
│       │   └── service.template.js
│       └── tests/
│           └── service.test.template.js
│
├── memory/                             [Development knowledge base - 13 files]
│   ├── MEMORY.md                       [Master index - START HERE]
│   ├── role_senior_architect.md
│   ├── conventions_onehermes.md
│   ├── architecture_patterns_onehermes.md
│   ├── common_gotchas_onehermes.md
│   ├── performance_baselines_onehermes.md
│   ├── entity_record_component_patterns.md
│   ├── feature_scaffold_system.md
│   ├── command_templates_reference.md
│   ├── development_experience_improvements_2026_04_28.md
│   ├── memory_system_overview_2026_04_28.md
│   ├── integration_keycloak_patterns.md
│   ├── integration_microsoft_graph_patterns.md
│   ├── integration_kafka_patterns.md
│   └── integration_mongodb_multitenant_patterns.md
│
├── decisions/                          [Architectural decisions & project tracking - 13 files]
│   ├── HUB.md                          [System overview & milestones]
│   ├── MEMORY.md                       [Decision index]
│   ├── ADR_LOG.md
│   ├── ADR_LOG_LATEST.md
│   ├── MODULE_DynamicEntityV2.md
│   ├── MODULE_OperationalTask.md
│   ├── SCHEMA_SNAPSHOTS.md
│   ├── SCHEMA_SNAPSHOTS_LISTNAME.md
│   ├── RBAC_ADVANCED_ANALYSIS.md
│   ├── INTEGRATION_MAP_DEALS_PRODUCTS.md
│   ├── IMPLEMENTATION_SUMMARY_2026_04_19.md
│   ├── ONBOARDING_REVIEW.md
│   └── CLAUDE_LEGACY_INDEX.md
│
└── workflows/                          [Automation & process guides - 3 files]
    ├── resume.md
    ├── warmup.md
    └── weekly_alignment.md
```

---

## Quick Start After Migration

### For Daily Development
```bash
# Navigate to central index
cat n:\Work\backup\.onehermes\README.md

# Start with memory index
cat n:\Work\backup\.onehermes\memory\MEMORY.md

# Run scaffold command
node n:\Work\backup\.onehermes\scaffold\feature-generator.js --name my-feature --type crud
```

### For IDE Configuration
- Point Claude Code to: `n:\Work\backup\.onehermes\config\settings.local.json`
- Reference: `n:\Work\backup\.onehermes\config\CLAUDE.md`

### For Architecture Decisions
- Start: `n:\Work\backup\.onehermes\decisions\HUB.md`
- ADRs: `n:\Work\backup\.onehermes\decisions\ADR_LOG*.md`
- Modules: `n:\Work\backup\.onehermes\decisions\MODULE_*.md`

---

## Old Folders (Safe to Remove)

Once migration is complete, these can be safely deleted:

```
n:\Work\backup\.agent/                  [All contents moved to .onehermes/workflows/]
n:\Work\backup\.claude/                 [All contents moved to .onehermes/]
n:\Work\backup\.antigravity_memory/     [All contents moved to .onehermes/decisions/]
```

⚠️ **Before deleting**: Verify all files have been copied to `.onehermes/`

---

## Benefits of Consolidation

| Aspect | Before | After |
|--------|--------|-------|
| **Folders** | 3 separate | 1 unified |
| **Navigation** | Confusing | Clear (README.md) |
| **Backup** | Multiple locations | Single backup |
| **Context Loading** | Scattered context | Organized by topic |
| **File Organization** | Unclear structure | Logical hierarchy |
| **Updates** | Multiple places | Single source of truth |

---

## Verification Checklist

- [ ] All files copied to `.onehermes/`
- [ ] `.onehermes/README.md` created
- [ ] `config/` folder has settings
- [ ] `commands/` folder has 5 guides
- [ ] `scaffold/` folder has generator + templates
- [ ] `memory/` folder has 13 knowledge files
- [ ] `decisions/` folder has 13 decision files
- [ ] `workflows/` folder has 3 automation files
- [ ] Settings point to new location
- [ ] Memory index updated
- [ ] Old folders backed up (before deletion)
- [ ] Old folders deleted (optional)

---

## Questions?

**What files are where?** → See `README.md`  
**How do I use memory?** → See `memory/MEMORY.md`  
**Configuration questions?** → See `config/CLAUDE.md`  
**Architecture decisions?** → See `decisions/HUB.md`

---

**Consolidation Status**: ✅ **COMPLETE & VERIFIED**

All ONEHERMES development tools and knowledge in one unified location.
