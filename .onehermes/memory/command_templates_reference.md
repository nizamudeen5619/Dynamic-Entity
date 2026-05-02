---
name: Command Templates Reference
description: 5 specialized command guides for common development tasks
type: reference
originSessionId: bbfa8ec4-697b-469f-9e09-efa15153699e
---
# Command Templates Reference

**Location**: `n:\Work\backup\.claude\commands\`  
**Status**: ✅ Active (2026-04-28)  
**Count**: 5 commands + guides

---

## 1. `/scaffold` — Generate Full-Stack Boilerplate

**Purpose**: Quickly scaffold a new feature with all necessary files following ONEHERMES patterns.

**Inputs**:
- Feature name (kebab-case, e.g. `expense-claim`)
- Type (crud | entity | endpoint | service)
- Domain (logical area, e.g. `expenses`, `hr`)
- Database entity (new model or existing?)
- UI module (which Angular feature?)
- Permissions (Keycloak roles if needed?)

**Outputs**:
- Backend: routes, controllers, services, models, validations
- Frontend: module, component, service, template, styles
- Tests: Jest scaffolding

**Guarantees**:
- Multi-tenant ready (getModelByTenant)
- Error handling with ApiError
- Winston logging
- Joi validation
- Reactive forms + RxJS
- Subscription cleanup

**Next Steps**: Fill in business logic → connect UI → add integrations → write tests

**File**: `n:\Work\backup\.claude\commands\scaffold.md`

---

## 2. `/perf-audit` — Identify Performance Bottlenecks

**Purpose**: Audit codebase for performance issues and bottlenecks.

**Scope**:
- N+1 queries (database)
- Missing database indexes
- Bundle size bloat (frontend)
- Unoptimized queries (lean(), select())
- Memory leaks (subscriptions)
- Unnecessary change detection
- Connection pooling issues

**Outputs**:
- List of bottlenecks ranked by impact
- Reproduction steps
- Fix recommendations with code examples
- Effort estimation

**Baselines** (from performance_baselines_onehermes.md):
- Page load: 2–3s target
- API response: < 500ms
- MongoDB query: < 50ms
- Bundle size: < 800KB gzipped
- Throughput: 100+ requests/second

**Tools Used**:
- Chrome DevTools (profiling)
- MongoDB .explain()
- Angular change detection analysis
- Bundle analyzer

**File**: `n:\Work\backup\.claude\commands\perf-audit.md`

---

## 3. `/security-scan` — Detect Vulnerabilities

**Purpose**: Security review for OWASP Top 10 and ONEHERMES-specific risks.

**Scope**:
- Injection risks (SQL, command, NoSQL injection)
- Authentication/authorization flaws (Keycloak misconfig, token expiry)
- Sensitive data exposure (logs, error messages, credentials)
- XML External Entities (XXE) — if parsing XML
- Broken access control (multi-tenant violations, RBAC)
- Security misconfiguration (env vars, secrets in code)
- XSS vulnerabilities (template escaping)
- Insecure deserialization (JSON parsing)
- Using components with known vulnerabilities
- Insufficient logging/monitoring

**Outputs**:
- Vulnerabilities ranked by severity
- Code location + reproduction
- Fix with secure code example
- Test plan

**ONEHERMES Focus**:
- Multi-tenant data isolation violations
- Missing tenantId filters on queries
- Keycloak realm/role mismatches
- Unvalidated input at API boundaries
- Credentials in logs

**File**: `n:\Work\backup\.claude\commands\security-scan.md`

---

## 4. `/integration-test` — End-to-End Integration Testing

**Purpose**: Test external service integrations (Keycloak, Microsoft Graph, Kafka, webhooks) end-to-end.

**Integrations Covered**:
1. **Keycloak SSO** — Token refresh, realm mapping, RBAC checks
2. **Microsoft Graph API** — User sync, delta queries, batch operations
3. **Kafka** — Producer/consumer flow, offset management, DLQ
4. **Webhooks** — Inbound webhook handling, retry logic, idempotency

**Test Structure**:
1. **Setup Phase** — Auth tokens, test data, mocks
2. **Happy Path** — Normal operation with valid inputs
3. **Error Handling** — Rate limiting, timeouts, auth failures
4. **Edge Cases** — Large batches, expired tokens, concurrent requests
5. **Cleanup** — Database cleanup, token revocation

**Outputs**:
- Test checklist (manual + automated)
- Code examples for each scenario
- Debugging tips
- Known issues and workarounds

**File**: `n:\Work\backup\.claude\commands\integration-test.md`

---

## 5. `/refactor-plan` — Plan Refactoring Without Implementation

**Purpose**: Propose refactoring strategies with multiple approaches and trade-offs (no code changes made).

**Inputs**:
- Code area to refactor (file, component, module)
- Goal (performance, readability, maintainability, etc.)
- Constraints (backward compatibility? Live traffic?)

**Outputs** (Analysis only):
1. **Current State Assessment** — What's working, what's not
2. **3 Approaches** — 2–3 refactoring strategies with pros/cons
3. **Effort Estimation** — Time, risk, complexity
4. **Dependency Analysis** — What breaks if we change this?
5. **Phased Plan** — How to rollout without downtime
6. **Rollback Strategy** — How to undo if it goes wrong

**Does NOT**:
- Implement changes
- Create commits
- Modify code

**Used For**:
- Decision-making before big refactors
- Scope creep prevention ("do we really need X?")
- Risk mitigation
- Architecture alignment

**File**: `n:\Work\backup\.claude\commands\refactor-plan.md`

---

## How Commands Work in IDE

1. **User Types Command**: `/scaffold`, `/perf-audit`, etc.
2. **Claude Loads Guide**: Reads corresponding `.md` file
3. **Claude Asks Questions**: Interactive prompts for inputs
4. **Claude Executes**: Follows the command structure
5. **Claude Reports**: Shows outputs and next steps

---

## Integration with Scaffold System

All commands follow ONEHERMES patterns documented in:
- [Architecture Patterns](architecture_patterns_onehermes.md) — Design patterns
- [Conventions](conventions_onehermes.md) — Code style, naming
- [Common Gotchas](gotchas_onehermes.md) — Known pitfalls
- [Performance Baselines](performance_baselines_onehermes.md) — Target metrics

Example: `/scaffold` generates code that passes `/security-scan` and `/perf-audit`.

---

## File Locations

```
n:\Work\backup\.claude\commands\
  scaffold.md
  perf-audit.md
  security-scan.md
  integration-test.md
  refactor-plan.md
```

All files are markdown guides that Claude follows to provide structured, consistent output.

---

## Command Frequency

- **`/scaffold`** — Used for every new feature
- **`/security-scan`** — Used before PR review on user input features
- **`/perf-audit`** — Used when performance regression reported
- **`/integration-test`** — Used when adding Keycloak/Graph/Kafka logic
- **`/refactor-plan`** — Used before major refactoring work

---

## Extending Commands

To add a new command:
1. Create `n:\Work\backup\.claude\commands\{name}.md`
2. Structure: Inputs → Outputs → Guarantees → Next Steps
3. Link in this reference
4. Update memory with entry
