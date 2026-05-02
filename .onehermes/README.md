# ONEHERMES Development Configuration

**Unified workspace configuration and knowledge base**

**Last Updated**: 2026-04-28  
**Status**: ✅ Consolidated from `.claude/`, `.antigravity_memory/`, `.agent/`

---

## Quick Navigation

### 🔧 Configuration & Tools
- `config/` — IDE settings, project configuration
- `scaffold/` — Feature boilerplate generator
- `commands/` — Specialized command guides
- `workflows/` — Automation workflows

### 📚 Knowledge Base
- `memory/` — Development patterns, conventions, guides
- `decisions/` — Architectural decision records, module tracking

---

## Folder Structure

```
.onehermes/
├── README.md                    [This file]
├── config/
│   ├── CLAUDE.md               [Project configuration]
│   ├── settings.json           [Claude Code settings]
│   └── settings.local.json     [Local overrides]
├── commands/                   [5 specialized guides]
│   ├── scaffold.md
│   ├── perf-audit.md
│   ├── security-scan.md
│   ├── integration-test.md
│   └── refactor-plan.md
├── scaffold/                   [Feature generator system]
│   ├── feature-generator.js
│   └── templates/
│       ├── backend/
│       ├── frontend/
│       └── tests/
├── memory/                     [Development knowledge base]
│   ├── MEMORY.md              [Master index]
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
├── decisions/                  [ADRs, milestones, schemas]
│   ├── HUB.md
│   ├── MEMORY.md
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
│   ├── CLAUDE_LEGACY_INDEX.md
│   └── [other ADRs and decision records]
└── workflows/                 [Automation & process guides]
    ├── resume.md
    ├── warmup.md
    └── weekly_alignment.md
```

---

## For IDE Configuration

**VSCode/JetBrains Settings:**
- See `config/CLAUDE.md` for senior architect role
- See `config/settings.local.json` for permissions
- All commands in `commands/` are registered with IDE

**Scaffold a Feature:**
```bash
node .onehermes/scaffold/feature-generator.js --name my-feature --type crud
```

---

## For Development Work

**Start here:**
1. Read `memory/MEMORY.md` for index
2. Pick relevant guide (patterns, integrations, etc.)
3. Follow the documented pattern
4. Use `/scaffold`, `/perf-audit`, `/security-scan` commands as needed

---

## For Architectural Decisions

**When Making Major Changes:**
1. Check `decisions/HUB.md` for context
2. Review `decisions/ADR_LOG*.md` for prior decisions
3. Propose new ADR if establishing new pattern
4. Update `decisions/MODULE_*.md` if affecting modules

---

## Consolidated From

- ✅ `.claude/` — Configuration, commands, scaffold, memory
- ✅ `.antigravity_memory/` — Decision records, module tracking, schemas
- ✅ `.agent/workflows/` — Automation workflows

**Old folders can be safely deleted** once this is in use.

---

## Access

All files automatically loaded in Claude Code conversations where relevant.

**Primary memory index**: `memory/MEMORY.md`  
**Project configuration**: `config/CLAUDE.md`  
**Architecture decisions**: `decisions/HUB.md`

---

**Status**: ✅ Ready for active development
