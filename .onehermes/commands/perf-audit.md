# /perf-audit — Performance Audit & Optimization

Analyze code or a feature for performance bottlenecks and suggest optimizations.

## What to Audit

Ask Nizam what to focus on:
1. **A specific endpoint** — "GET /v1/individuals list is slow"
2. **A component/page** — "Individuals list page is sluggish on load"
3. **A service** — "cronJob.service.js performance"
4. **The whole feature** — "Expense submission flow"

---

## Audit Checklist

### Backend
- [ ] **N+1 Queries** — missing `.populate()`, aggregation, batch queries
- [ ] **Indexes** — is the query filtered on indexed fields?
- [ ] **Pagination** — are list endpoints capped at 100+ results?
- [ ] **Data mutations** — bulk writes instead of loop+update?
- [ ] **Caching** — Redis for frequently accessed lookups?
- [ ] **Connection pooling** — MongoDB / external API limits?
- [ ] **Blocking operations** — sync code in async context?
- [ ] **Large payloads** — unnecessary fields returned to frontend?

### Frontend
- [ ] **Subscriptions** — unsubscribed on destroy? Memory leaks?
- [ ] **Change detection** — OnPush enabled where possible?
- [ ] **Change detection triggers** — unnecessary re-renders on parent updates?
- [ ] **Template iterations** — trackBy on *ngFor?
- [ ] **Lazy loading** — components/routes lazy-loaded?
- [ ] **Bundle size** — unused imports, dead code?
- [ ] **Images** — optimized, lazy-loaded, correct dimensions?
- [ ] **HTTP calls** — batched? Deduplicated? Cached?

### Integrations
- [ ] **Token refresh** — proactive or on-demand? Unnecessary calls?
- [ ] **Rate limiting** — respecting API quotas?
- [ ] **Batch requests** — Keycloak user fetch, Graph API deltas?
- [ ] **Connection reuse** — persistent connections for webhooks?
- [ ] **Retry logic** — exponential backoff or hammering?

---

## Output Format

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Performance Audit: [feature/endpoint]
  Current: ~Xms load time / Y queries / Z bundle KB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CRITICAL (potential 50%+ speedup)
  ❌ [issue] — [where] — [fix]

HIGH (10-50% speedup)
  ⚠️ [issue] — [where] — [fix]

MEDIUM (5-10% speedup)
  💡 [issue] — [where] — [fix]

LOW (micro-optimizations)
  📝 [issue] — [where] — [fix]

RESULT: Expected improvement X ms → Y queries → Z KB after fixes
```

---

## After Audit

Claude suggests fixes in order of impact. Nizam decides which to implement.
Typical result: 20-40% perf gain with 2-3 critical fixes.
