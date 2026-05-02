# The Warmup Protocol

*Execute this workflow when returning to the codebase after a period of rest to restore full architectural continuity instantly.*

### Pre-Flight Sequence:
1. **Trace ADRs:** Read the most recent 5 entries in `n:\Work\backup\.antigravity_memory\ADR_LOG.md` to re-establish the contextual "Why" of our recent structural changes.
2. **Anchor Session:** Read the `LAST_ACTION` and `PENDING_REFINEMENT` footers inside our active module's memory Spoke (e.g., `n:\Work\backup\.antigravity_memory\MODULE_DynamicEntityV2.md`).
3. **Verify State:** Query Git for the current branch state implicitly (`git status` / `git rev-parse --abbrev-ref HEAD`). Cross-reference the Jira Ticket ID from the branch name.
4. **Report Back:** Output exactly a 3-sentence summary: 
   - *"Here is where we are..."* (Branch stats / Ticket state)
   - *"Here is why we did the last thing..."* (ADR Context / Last Action)
   - *"Here is exactly what is next."* (Pending refinement queue)
