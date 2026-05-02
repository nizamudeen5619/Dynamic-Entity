---
name: Memory System Overview
description: Unified view of the dual-memory system and how to use both
type: reference
originSessionId: bbfa8ec4-697b-469f-9e09-efa15153699e
---
# Memory System Overview — Dual Architecture

**Date**: 2026-04-28  
**Status**: ✅ Both systems refreshed and consolidated  
**Scope**: ONEHERMES full-stack (backend, frontend, integrations)

---

## Two Memory Systems

### 1. **`C:\Users\Admin\.claude\projects\n--Work-backup\memory\`**

**Purpose**: General development patterns and references  
**Type**: Long-lived architectural knowledge  
**Used By**: Every task (coding standards, patterns, conventions)  
**Update Frequency**: As patterns evolve  
**Files**: 13 active memories + 6 archived

**Key Contents**:
- Senior architect mindset & conventions
- Architecture patterns with code examples
- Common gotchas and performance baselines
- Integration guides (Keycloak, Graph, Kafka, MongoDB)
- Development workflow improvements & scaffold system
- Entity record component reference patterns

### 2. **`n:\Work\backup\.antigravity_memory\`**

**Purpose**: Project-specific decision records and module tracking  
**Type**: Session-based architectural decisions and implementation logs  
**Used By**: Complex refactoring, ONEHERMES DynamicEntityV2 work, decision justification  
**Update Frequency**: After major implementations or architectural decisions  
**Files**: 13 detailed files with ADRs, schema snapshots, module golden threads

**Key Contents**:
- Architectural decision records (ADR-001 through ADR-009)
- Complete implementation summaries (listName, RBAC, performance optimization)
- Module golden threads (DynamicEntityV2, OperationalTask)
- Schema snapshots and integration maps
- Integration analysis (Deals/Products)
- Stability milestones

---

## How They Work Together

```
Daily Development Work
    ↓
    ├─→ Check MEMORY.md (patterns & conventions)
    ├─→ Use /scaffold command (generate boilerplate)
    ├─→ Follow entity-record.component.ts patterns
    ├─→ Check integration guides for external services
    └─→ Run /perf-audit or /security-scan as needed
    
Complex Architectural Decisions
    ↓
    ├─→ Use /refactor-plan to propose approaches
    ├─→ Check .antigravity_memory/HUB.md for context
    ├─→ Review ADR_LOG for relevant decision records
    ├─→ Propose new ADR if creating new pattern
    └─→ Document in .antigravity_memory/ after implementation
```

---

## Memory System Refresh — What Changed (2026-04-28)

### CONSOLIDATION
✅ Created **unified MEMORY.md** index in primary memory system  
✅ Organized by use case (new features, integrations, performance, refactoring)  
✅ Added quick navigation section  
✅ Archived 6 completed project-specific memories

### NEW DOCUMENTATION
✅ **Development Experience Improvements** — Documented 5 improvements completed  
✅ **Feature Scaffold System** — Complete guide to the Node.js boilerplate generator  
✅ **Command Templates Reference** — All 5 specialized commands documented  
✅ **Entity Record Component Patterns** — Reference patterns from 2200-line production component  

### CLEANUP
✅ Removed outdated project-specific memories from active index  
✅ Updated `.antigravity_memory/HUB.md` with DX-01 milestone  
✅ Updated `.antigravity_memory/MEMORY.md` to link to new work

### TOOLING
✅ Fixed feature-generator.js template references  
✅ Verified all 8 templates properly export functions  
✅ Cleaned up permissions from 159 rules to 5

---

## Files by Purpose

### IMMEDIATE REFERENCE (Read first when starting a task)

| File | Purpose | Location |
|------|---------|----------|
| MEMORY.md | Central index with navigation | Primary memory |
| role_senior_architect.md | Default mindset for every prompt | Primary memory |
| conventions_onehermes.md | Code style, naming, structure | Primary memory |

### WHEN BUILDING FEATURES

| File | Purpose | Location |
|------|---------|----------|
| development_experience_improvements_2026_04_28.md | Overview of all 5 improvements | Primary memory |
| feature_scaffold_system.md | How to use the scaffold generator | Primary memory |
| command_templates_reference.md | All 5 /commands explained | Primary memory |
| architecture_patterns_onehermes.md | Design patterns + code examples | Primary memory |
| entity_record_component_patterns.md | Reference patterns for UI | Primary memory |

### WHEN FIXING BUGS OR PERFORMANCE ISSUES

| File | Purpose | Location |
|------|---------|----------|
| common_gotchas_onehermes.md | 15 documented pitfalls | Primary memory |
| performance_baselines_onehermes.md | Targets and metrics | Primary memory |

### WHEN ADDING INTEGRATIONS

| File | Purpose | Location |
|------|---------|----------|
| integration_keycloak_patterns.md | Token refresh, RBAC, interceptors | Primary memory |
| integration_microsoft_graph_patterns.md | User sync, batch ops, delta queries | Primary memory |
| integration_kafka_patterns.md | Producer/consumer, DLQ, commits | Primary memory |
| integration_mongodb_multitenant_patterns.md | Isolation, queries, indexes | Primary memory |

### WHEN MAKING ARCHITECTURAL DECISIONS

| File | Purpose | Location |
|------|---------|----------|
| HUB.md | System overview and milestones | Antigravity memory |
| ADR_LOG.md | Foundational decisions | Antigravity memory |
| ADR_LOG_LATEST.md | Recent decisions (ADR-006 through 009) | Antigravity memory |
| MODULE_DynamicEntityV2.md | Golden thread for metadata engine | Antigravity memory |

---

## Quick Commands

```bash
# View main memory index
cat C:\Users\Admin\.claude\projects\n--Work-backup\memory\MEMORY.md

# View antigravity hub
cat n:\Work\backup\.antigravity_memory\HUB.md

# Generate a feature
node n:\Work\backup\.claude\scaffold\feature-generator.js --name my-feature --type crud

# View a specific guide
cat n:\Work\backup\.claude\commands\scaffold.md
```

---

## Memory Update Process

### When to Update Memory
1. ✅ New patterns proven effective
2. ✅ Conventions change or clarify
3. ✅ Integration guides need updates (API version changes)
4. ✅ New gotchas discovered
5. ✅ Performance baselines shift
6. ✅ Major architectural decision made

### How to Update
1. Locate relevant memory file
2. Update with current information
3. Include date and scope
4. Update MEMORY.md index if file added/removed
5. If major decision, create ADR entry in `.antigravity_memory/`

### What NOT to Update
- ❌ Temporary debugging code
- ❌ Incomplete work (wait until done)
- ❌ Code already in git history
- ❌ Project-specific state (recent PRs, commit messages)

---

## System Health

| Metric | Value | Status |
|--------|-------|--------|
| Memory files (primary) | 13 active | ✅ Current |
| Memory files (archived) | 6 | ✅ For reference |
| Memory files (antigravity) | 13 | ✅ Up-to-date |
| Command templates | 5 | ✅ Documented |
| Integration guides | 4 | ✅ Current |
| Last refresh | 2026-04-28 | ✅ Today |

---

## Common Workflows

### Scaffolding a New Feature
```
1. User: "Scaffold expense-claim entity"
2. Claude: Reads feature_scaffold_system.md
3. Claude: Runs node scaffold/feature-generator.js --name expense-claim --type crud
4. Claude: References entity_record_component_patterns.md for UI
5. Claude: Follows architecture_patterns_onehermes.md for backend
6. Result: 9+ files ready for domain logic
```

### Adding Keycloak Integration
```
1. Claude: Reads integration_keycloak_patterns.md
2. Claude: Follows token refresh pattern
3. Claude: Implements interceptor for proactive refresh
4. Claude: Adds RBAC checks in controller
5. Claude: Tests with /integration-test command
```

### Fixing Performance Issue
```
1. Claude: Runs /perf-audit command
2. Claude: Checks performance_baselines_onehermes.md for targets
3. Claude: Consults common_gotchas_onehermes.md (N+1? memory leak? missing index?)
4. Claude: Proposes fix with /refactor-plan (no implementation)
5. User approves approach
6. Claude: Implements and validates
```

---

## Future Maintenance

### Next Review: 2026-05-28
- Check if new conventions have emerged
- Verify command templates still reflect actual usage
- Update performance baselines if shift detected
- Archive any newly completed project work

### When Major Features Complete
- Create ADR in `.antigravity_memory/`
- Document patterns learned
- Add to common gotchas if discovery
- Update architecture patterns if replicable

---

## Access

**Primary Memory System**:  
`C:\Users\Admin\.claude\projects\n--Work-backup\memory\MEMORY.md`

**Antigravity Project Memory**:  
`n:\Work\backup\.antigravity_memory\MEMORY.md`

**Both systems automatically loaded** in every conversation context where they're relevant.

---

**Memory System Status**: ✅ **COMPREHENSIVE & CURRENT**

All patterns documented, consolidated, and ready for active development.
