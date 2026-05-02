# Weekly Alignment Protocol (The Project Heartbeat)

*Execute this workflow at the end of the sprint (typically Friday) to prevent architectural stagnation and technical debt compounding.*

### Pre-Flight Sequence:
1. **Audit Memory Vault:** Scan the contents of `n:\Work\backup\.antigravity_memory\` (including `ADR_LOG.md` and `SCHEMA_SNAPSHOTS.md`).
2. **Evaluate Complexity:** Analyze the structural evolution of the `DynamicEntityV2` module and other components tracking throughout the week. Identify modules that violate YAGNI or are becoming unwieldy.
3. **Hub Refresh:** Update `n:\Work\backup\.antigravity_memory\HUB.md` with a 'State of the Project' summary.
4. **Refactor Proposals:** Output a brief hit-list indicating exactly which modules have crossed the complexity threshold, generating explicit recommendations for where we should safely simplify and abstract during the next sprint cycle.
