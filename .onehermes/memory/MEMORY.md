# Memory Index — Comprehensive Reference System

**Last Updated**: 2026-05-02  
**Session**: Universe-Scale Testing & Hardening Complete
**Status**: ✅ All current work documented - Fortress State Achieved

---

## 📋 Quick Navigation

### For New Features
→ [Development Experience Improvements](development_experience_improvements_2026_04_28.md) (what changed)  
→ [Feature Scaffold System](feature_scaffold_system.md) (how to generate boilerplate)  
→ [Command Templates Reference](command_templates_reference.md) (specialized commands)

### For Coding Standards
→ [Senior Architect Role](role_senior_architect.md) (default mindset)  
→ [Conventions](conventions_onehermes.md) (naming, style, structure)  
→ [Architecture Patterns](architecture_patterns_onehermes.md) (design patterns + code examples)  
→ [Entity Record Component Patterns](entity_record_component_patterns.md) (reference component for UI)

### For Common Issues
→ [Common Gotchas](gotchas_onehermes.md) (15 documented pitfalls)  
→ [Performance Baselines](performance_baselines_onehermes.md) (targets and metrics)

### For External Integrations
→ [Keycloak SSO Patterns](integration_keycloak_patterns.md) (auth, token refresh, RBAC)  
→ [Microsoft Graph Patterns](integration_microsoft_graph_patterns.md) (user sync, batch ops)  
→ [Kafka Patterns](integration_kafka_patterns.md) (producer/consumer, DLQ)  
→ [MongoDB Multi-Tenant](integration_mongodb_multitenant_patterns.md) (isolation, queries)

---

## 📁 Memory Files by Type

### CORE MINDSET & STANDARDS (Read First)
- [Senior Architect Role](role_senior_architect.md) — Design-first, evaluate trade-offs, catch issues early, optimize for scale
- [Conventions](conventions_onehermes.md) — Code style, naming (kebab-case/camelCase), 125 char lines, CommonJS/TypeScript
- [Architecture Patterns](architecture_patterns_onehermes.md) — Controller→Service→Model, smart services, async pipe, error handling, RxJS
- [Common Gotchas](gotchas_onehermes.md) — 15 pitfalls: cross-tenant queries, N+1, memory leaks, null guards, missing indexes

### DEVELOPMENT WORKFLOW (Daily Use)
- [Development Experience Improvements](development_experience_improvements_2026_04_28.md) — 5 improvements completed (permissions, commands, guides, scaffold, memory)
- [Feature Scaffold System](feature_scaffold_system.md) — Full-stack boilerplate generator with 8 templates
- [Command Templates Reference](command_templates_reference.md) — `/scaffold`, `/perf-audit`, `/security-scan`, `/integration-test`, `/refactor-plan`
- [Entity Record Component Patterns](entity_record_component_patterns.md) — Reference patterns from 2200-line production component

### INTEGRATION GUIDES (When Connecting External Services)
- [Keycloak SSO Patterns](integration_keycloak_patterns.md) — Token refresh, realm mapping, RBAC, interceptors, proactive refresh
- [Microsoft Graph Patterns](integration_microsoft_graph_patterns.md) — User sync, delta queries, batch ops (max 20), token refresh, exponential backoff
- [Kafka Patterns](integration_kafka_patterns.md) — Manual commit, consumer groups, DLQ, batch processing, offset management
- [MongoDB Multi-Tenant](integration_mongodb_multitenant_patterns.md) — getModelByTenant(), tenant filters, scope paths, bulk ops, indexes

### PERFORMANCE & QUALITY
- [Performance Baselines](performance_baselines_onehermes.md) — Page load 2-3s, API < 500ms, query < 50ms, bundle < 800KB gzipped, 100+ req/s

---

## 🗂️ Archived Memories (Completed Work)

The following project-specific memories document completed implementations from prior sessions. They are retained for historical reference but are no longer active development focus:

- ~~[listName Field Configuration](project_listname_field_config.md)~~ — ✅ COMPLETE (2026-04-19)
- ~~[List Names and Record Updates](project_list_names_and_updates.md)~~ — ✅ COMPLETE (2026-04-19)
- ~~[Dynamic Form Fixes Comprehensive](project_dynamic_form_fixes_comprehensive.md)~~ — ✅ COMPLETE (Prior)
- ~~[Array Field Empty Row Bug Fix](array_field_empty_row_fix.md)~~ — ✅ COMPLETE (Prior)
- ~~[Dynamic Entity Hardening - Universe-Scale Testing](project_dynamic_entity_hardening.md)~~ — ✅ COMPLETE (2026-05-02)
- ~~[Data Masking & RBAC Implementation](project_data_masking_complete.md)~~ — ✅ COMPLETE (Prior)

These implementations are merged into main branches. Reference `.antigravity_memory/` directory for detailed session logs.

---

## 🔗 Related Documentation

### In Project Codebase
- `.claude/CLAUDE.md` — Project configuration and senior architect role definition
- `.claude/settings.local.json` — Permission configuration (cleaned up 2026-04-28)
- `.claude/commands/` — 5 command guides
- `.claude/scaffold/` — Feature generator system with 8 templates
- `.antigravity_memory/` — Detailed architectural decision records and module tracking

### In Codebase
- `Superpower_Web/src/app/commonModules/entity-data-table/entity-record/` — Reference component (2200+ lines)
- `Superpower-App/src/models/` — Schema definitions with getModelByTenant pattern
- `Superpower-App/src/services/` — Service layer with Controller→Service→Model pattern
- `Superpower-App/src/utils/` — ApiError class, Winston logging setup

---

## 📚 How to Use This System

### On Every Task
1. **Read relevant memory** based on task type (scaffolding? Integration? Performance?)
2. **Check Common Gotchas** for known pitfalls in that area
3. **Follow Senior Architect patterns** — design-first, evaluate trade-offs

### When Building New Features
1. Use `/scaffold` command to generate boilerplate
2. Reference [Entity Record Component Patterns](entity_record_component_patterns.md) for UI
3. Use [Architecture Patterns](architecture_patterns_onehermes.md) for backend structure
4. Check [Conventions](conventions_onehermes.md) for code style

### When Adding Integrations
1. Find corresponding integration guide (Keycloak/Graph/Kafka/MongoDB)
2. Follow the token refresh and error handling patterns
3. Run `/integration-test` command to validate end-to-end

### When Performance Issues Arise
1. Run `/perf-audit` command
2. Check [Performance Baselines](performance_baselines_onehermes.md) for targets
3. Reference [Common Gotchas](gotchas_onehermes.md) (N+1 queries, memory leaks, indexes)

### When Refactoring
1. Use `/refactor-plan` command to propose approaches without implementation
2. Check [Architecture Patterns](architecture_patterns_onehermes.md) for aligned design
3. Validate against [Conventions](conventions_onehermes.md)

---

## 🎯 Key Principles

### From Senior Architect Role
- **Design-first**: Evaluate 2–3 trade-off approaches before implementing
- **Full-stack review**: Code affects backend, frontend, and integrations together
- **Catch issues early**: Multi-tenant bugs, N+1 queries, memory leaks
- **Optimize for scale**: Batch operations, indexes, pagination, connection pooling

### From Conventions
- **Naming**: kebab-case (files), camelCase (variables), PascalCase (types)
- **File structure**: Feature-based, with routes/controllers/services/models/validations
- **Code style**: 125 character lines, single quotes, lean queries, reactive forms
- **Validation**: Joi on backend, reactive forms on frontend, validate at boundaries

### From Patterns
- **Backend**: Controller → Service → Model, with getModelByTenant for multi-tenancy
- **Frontend**: Smart Service (state) + Dumb Component (view), async pipe for subscriptions
- **Error Handling**: ApiError class (backend), interceptors (frontend), proper logging
- **Testing**: Jest for unit tests, integration tests for API, E2E for workflows

---

## 📊 Memory System Stats

| Category | Count | Updated |
|----------|-------|---------|
| Core mindset & standards | 4 | 2026-04-28 |
| Development workflow | 4 | 2026-04-28 |
| Integration guides | 4 | Prior |
| Performance & quality | 1 | Prior |
| **Total** | **13** | — |

**Archived**: 6 completed project-specific memories (retained for reference)

---

## ⚙️ Maintenance

### When to Update Memory
- ✅ New conventions established
- ✅ Patterns proved effective or change
- ✅ Integration guides updated (new API versions)
- ✅ Performance baselines shift
- ✅ New gotchas discovered

### When NOT to Update Memory
- ❌ Temporary debugging code or one-off fixes
- ❌ Incomplete work (wait until done)
- ❌ Changes already documented in git history
- ❌ Project-specific state (commit messages, recent PRs)

---

## 🚀 Getting Started

**New to the project?**
1. Read [Senior Architect Role](role_senior_architect.md)
2. Read [Conventions](conventions_onehermes.md)
3. Skim [Architecture Patterns](architecture_patterns_onehermes.md)
4. Check [Common Gotchas](gotchas_onehermes.md)

**Need to scaffold a feature?**
→ Use `/scaffold` command or read [Feature Scaffold System](feature_scaffold_system.md)

**Building frontend forms?**
→ Study [Entity Record Component Patterns](entity_record_component_patterns.md)

**Adding external integration?**
→ Read corresponding integration guide (Keycloak/Graph/Kafka/MongoDB)

---

**Last Comprehensive Refresh**: 2026-04-28  
**All memories verified and current** ✅
