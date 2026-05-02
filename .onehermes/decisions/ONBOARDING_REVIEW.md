# AI Engineering Environment: Onboarding & Initialization Review

This document is a structured index of the "Local Ghost" onboarding sequence for the `Superpower` Monorepo. It covers how the AI assistant was configured, constrained, and integrated into the development environment to operate as a disciplined, context-aware engineering collaborator.

---

## 1. Local Memory Vault (`.antigravity_memory/`)

A hidden, Git-ignored folder was established to give the AI persistent context across sessions. Without this, the AI loses all project-specific knowledge between conversations, leading to repeated explanations and inconsistent decisions.

| File | Purpose |
|---|---|
| `HUB.md` | Master index of the core stack: Angular v17, Express v4, PrimeNG. Also maps `environment.service.ts` API intercepts to their corresponding Express `.env` variables. |
| `MODULE_DynamicEntityV2.md` | Session-continuity tracker for the Metadata Engine module. Records `LAST_ACTION` and `PENDING_REFINEMENT` so each session picks up exactly where the last one ended. |
| `SCHEMA_SNAPSHOTS.md` | A manual schema version ledger. Since the project operates without automated tests, this file tracks structural changes to the JSON schema before any UI modifiers are pushed. |
| `ADR_LOG.md` | Architectural Decision Record log. Documents the reasoning behind every major engineering decision so future developers (or future sessions) understand the "why", not just the "what". |
| `.jira.env` | An isolated environment file scaffolded for Atlassian REST API integration. Ultimately deemed unnecessary, as the VSCode Jira sidebar extension handled ticket tracking sufficiently. |

---

## 2. AI Behavioral Constraints (`.antigravityrules`)

A set of explicit rules was defined to lock the AI into disciplined, senior-developer behavior. These constraints prevent the most common failure modes of AI-assisted development: silent breakage, scope creep, and reckless dependency changes.

- **[SYNC-01] API-UI Contract Protection:** The AI cannot modify any backend API response payload without first producing a UI Impact Report, documenting the downstream effect on Angular components consuming that endpoint.

- **Global Error Handling Standard:** All Node.js/Express API routes must use the shared `ApiError` utility. Swallowing errors or using unstructured `console.error` fallbacks is not permitted.

- **[EXT-01] Dependency Freeze:** The AI cannot upgrade or add entries to `package.json` without explicit approval. This prevents silent breaking changes introduced by version drift.

- **[NO-TEST-SAFETY] Zero-Test Compensation:** Since no automated test suite exists, every code change must be accompanied by a Blast-Radius Map (what else could this break?) and a 3-Step Manual Test Plan before implementation proceeds.

- **Cognitive Discipline Rules:**
  - **[PM-01] Pre-Mortem:** Before implementing anything significant, identify what could go wrong and why.
  - **[ATOM-01] Atomic Changes:** A maximum of 3 files may be modified in a single session task. Larger changes must be broken into sequential tasks.
  - **[CHALLENGE] Devil's Advocate:** The AI must challenge its own proposed approach before committing to it, actively looking for simpler alternatives.

---

## 3. Historical Context Extraction

Previous AI session history was recovered and ingested to preserve architectural knowledge that would otherwise have been lost.

- **Claude Legacy Index (`CLAUDE_LEGACY_INDEX.md`):** The `history.jsonl` file from prior AI interactions was parsed directly via the filesystem to extract retained architectural decisions.

- **Recovered Patterns Locked In:**
  - All database queries of significance use MongoDB Aggregation Pipelines (`$facet`, `$lookup`) for structured, composable data retrieval.
  - Multi-document writes are wrapped in `session.startTransaction()` to ensure atomicity and prevent partial-write corruption.
  - Mongoose schemas use `strict: false` intentionally, with Joi validators on the Express layer handling input shape enforcement.

---

## 4. Tooling & Execution Pipeline Setup

The development environment was audited and extended to support consistent AI-assisted workflows.

- **Architecture Trace:** The full request path was confirmed — from the Angular UI table renderer (`[apiUrl]/configuration/dynamic...`) through to the Abstract Factory backend pattern (`getEntityRecordModel`). The UI-to-database map is verified stable.

- **Git Workflow Alignment:**
  - Local `.docx` documentation was extracted via PowerShell for review.
  - Commit conventions set to [Conventional Commits](https://www.conventionalcommits.org/) (`feat(scope): ...`).
  - Branch history enforces linear rebasing and Semantic Versioning for releases.

- **Tooling Setup:**
  - Verified native Git availability in the environment.
  - Installed GitHub CLI (`gh`) via `winget`.
  - Audited Jira CLI package compatibility (determined unnecessary given VSCode integration).

- **Warmup Protocol (`.agent/workflows/warmup.md`):** A reusable session-start workflow that orients the AI to the active Git branch, loads relevant ADR context, and confirms the current Jira ticket — eliminating the cold-start tax on every new session.

---

## Outcome

| Area | Status |
|---|---|
| AI context persistence | Established via `.antigravity_memory/` vault |
| Behavioral guardrails | Enforced via `.antigravityrules` rule file |
| Historical knowledge | Recovered and locked into session memory |
| Tooling & Git alignment | Verified and configured |
| Session reloading | Automated via warmup workflow |

The environment is now ready for targeted feature development inside the `DynamicEntityV2` module, with reduced risk of context loss, rogue changes, or undocumented architectural drift.

> **Note on test coverage:** This project operates without an automated test suite. The `[NO-TEST-SAFETY]` constraints — Blast-Radius Mapping and 3-Step Manual Test Plans — are the primary mechanism for validating changes safely before they reach production.
