# /refactor-plan — Analyze & Plan Refactoring Without Implementing

Design a refactoring strategy, estimate effort, identify risks — without touching code.

## When to Use This

- **Before refactoring a module** — "Should we reorganize the user service?"
- **Simplifying complex logic** — "How to break down this 500-line controller?"
- **Updating patterns** — "Migrate from class components to functional in Angular?"
- **Reducing tech debt** — "Rewrite the MongoDB query layer for clarity?"
- **Testing improvements** — "How to add unit tests to untested code?"
- **Design questions** — "What's the best way to structure state management?"

---

## What Claude Does

1. **Analyze** current code (reads files, identifies smells)
2. **Propose** 2-3 refactoring approaches with trade-offs
3. **Estimate** effort per approach (hours / story points)
4. **Identify** risks (breaking changes, testing gaps, side effects)
5. **Recommend** which approach is safest + best ROI
6. **Create** a step-by-step execution plan (if Nizam approves)

---

## Input: What to Refactor

Ask Nizam:
1. **What's the target** — file, function, module, or entire service?
2. **Why refactor** — what problem are we solving?
   - Hard to test?
   - Performance issues?
   - Code duplication?
   - Hard to extend?
   - Team complaints?
3. **Constraints** — any that must stay the same? External dependencies?

---

## Output: Refactoring Plan

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Refactoring Plan: [what's being refactored]
  Problem: [what we're solving]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CURRENT STATE
  • File: [path]
  • Size: X lines
  • Complexity: [high/medium/low]
  • Code smells: [list]
  • Test coverage: X%

APPROACH A: [name]
  Effort:     5-8 hours
  Risk:       Medium (breaking changes to 2 dependent services)
  Payoff:     30% reduction in function complexity
  Pros:       • Clearer structure
              • Easier to test
  Cons:       • Requires updating 2 dependent services
              • Breaking change to internal API
  Recommendation: Good long-term, medium-term risk

APPROACH B: [name]
  Effort:     2-3 hours
  Risk:       Low (no breaking changes)
  Payoff:     15% reduction in function complexity
  Pros:       • Quick win
              • No dependent service changes
  Cons:       • Only partial improvement
  Recommendation: ✅ START HERE — fast, low-risk improvement

APPROACH C: [name]
  Effort:     12-15 hours
  Risk:       High (architectural change)
  Payoff:     70% reduction in complexity, enables new features
  Pros:       • Comprehensive solution
              • Future-proof design
  Cons:       • Large effort
              • Requires significant testing
  Recommendation: Long-term play (Q3+), revisit after Approach B

RECOMMENDED PATH
  1. Execute Approach B (quick win)
  2. Measure impact + team feedback
  3. Decide on Approach C in next planning cycle

EXECUTION STEPS (for Approach B)
  Step 1: [description] (~X hours)
  Step 2: [description] (~X hours)
  Step 3: Test and verify
  Estimated total: 2-3 hours
  
  Blockers: None
  Dependencies: None
  Risk mitigation: Run full test suite after each step
```

---

## After the Plan

If Nizam approves:
1. Claude creates detailed issue/ticket for the work
2. Creates git branch with descriptive name
3. Can execute immediately if approved (or Nizam can defer)

If Nizam wants changes:
1. Ask what to adjust
2. Revise plan (no code changes yet)
3. Iterate until everyone agrees

---

## Key Principles

- **No code changes** during planning (analysis only)
- **Multiple approaches** — Nizam chooses direction
- **Clear trade-offs** — risk vs reward, short-term vs long-term
- **Testability considered** — hard-to-test code gets special attention
- **Effort estimated** — so Nizam can prioritize
