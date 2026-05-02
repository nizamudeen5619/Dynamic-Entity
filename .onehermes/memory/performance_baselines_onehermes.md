---
name: ONEHERMES Performance Baselines
description: Expected performance metrics (page load, API response, database query times) to detect regressions early
type: reference
originSessionId: bbfa8ec4-697b-469f-9e09-efa15153699e
---
## Performance Baselines — ONEHERMES

### Frontend Page Load

**Initial Page Load (Individuals List, 100 records):**
- Full page load: 2-3 seconds
- First paint: < 1.5 seconds
- Interactive (TTI): < 2.5 seconds
- Bundle size: < 800 KB (gzipped)

**Slowdown Signs:**
- > 4 seconds to interactive → likely N+1 queries or unoptimized images
- > 1.2 MB gzipped → dead code or missing code splitting
- Layout shift > 0.1 → images missing dimensions or async content

**Tools to measure:**
```bash
# Lighthouse (Chrome DevTools)
# Network tab (DevTools)
# Performance tab (DevTools) → Web Vitals
```

**Common Regressions:**
| Metric | Good | Warning | Critical |
|--------|------|---------|----------|
| LCP (Largest Contentful Paint) | < 2s | 2-4s | > 4s |
| FID (First Input Delay) | < 100ms | 100-300ms | > 300ms |
| CLS (Cumulative Layout Shift) | < 0.1 | 0.1-0.25 | > 0.25 |
| TTI (Time to Interactive) | < 2.5s | 2.5-4s | > 4s |

---

### API Response Times

**List Endpoints (100-1000 records):**
- Small dataset (< 100): 50-100ms
- Medium dataset (100-10K): 100-300ms
- Large dataset (10K-1M): 300-1000ms
  - Must use pagination (limit 20-100 per page)

**Single Record Endpoints:**
- Fetch: 30-50ms
- Create: 50-100ms
- Update: 50-100ms
- Delete: 30-50ms

**Slowdown Indicators:**
- > 500ms for simple CRUD → missing index or N+1 query
- > 2s for list endpoint → pagination not implemented
- > 100ms for single record → unnecessary population or transformation

**Tools to measure:**
```typescript
// Add timing middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 500) {
      logger.warn(`Slow request: ${req.method} ${req.path} took ${duration}ms`);
    }
  });
  next();
});
```

---

### Database Query Performance

**MongoDB Query Baselines:**

| Query Type | Dataset Size | Good (ms) | Warning (ms) | Critical (ms) |
|-----------|--------------|-----------|--------------|---------------|
| Find by ID | N/A | 5-10 | 10-50 | > 50 |
| Find with filter | 10K | 10-20 | 20-100 | > 100 |
| Find with filter | 100K | 20-50 | 50-200 | > 200 |
| Aggregation | 10K | 20-50 | 50-200 | > 200 |
| Aggregation | 100K | 50-200 | 200-500 | > 500 |
| Bulk write (100 ops) | N/A | 20-50 | 50-100 | > 100 |

**How to check MongoDB query time:**
```bash
# Connect to MongoDB
mongo <connection-string>

# Enable profiling
db.setProfilingLevel(1, { slowms: 100 })

# View slow queries
db.system.profile.find({ millis: { $gt: 100 } }).limit(5).pretty()

# Explain a query execution
db.expenses.find({ tenantId: 'expert', status: 'pending' }).explain('executionStats')
# executionStage: IXSCAN = good (uses index)
# executionStage: COLLSCAN = bad (full table scan)
```

**Missing Index Symptoms:**
```
executionStats: {
  executionStages: {
    stage: "COLLSCAN",  // ← COLLSCAN = full table scan (SLOW)
    nReturned: 5000,
    totalDocsExamined: 1000000  // Examined all 1M docs
  }
}
```

---

### Common Performance Issues & Fixes

#### 1. **Slow List Endpoint**
```
Symptom: GET /v1/expenses takes 2+ seconds
Cause: No pagination (loading 100K+ records)
Fix: Limit to 100, require page parameter
```

#### 2. **N+1 Query Pattern**
```
Symptom: 100-record list takes 5 seconds
Cause: Loop fetching user for each expense (100 queries)
Fix: Use aggregation $lookup or populate
```

#### 3. **Missing Index**
```
Symptom: "status = pending" filter takes 500ms
Cause: No index on { tenantId, status }
Fix: expenseSchema.index({ tenantId: 1, status: 1 })
```

#### 4. **Unnecessary Field Projection**
```
Symptom: Fetching user (30KB) when only need id
Fix: Use .select('id email') or aggregation $project
```

#### 5. **Large Populate Depth**
```
Symptom: Populate chain (user → company → admin) takes 300ms
Fix: Limit depth to 2 levels, use aggregation for deep joins
```

---

### Frontend Performance Optimization Checklist

**Bundle Size:**
- [ ] Code splitting enabled for feature modules
- [ ] Unused imports removed
- [ ] Lazy load routes not needed on initial render
- [ ] Image assets optimized (< 100 KB per image)
- [ ] Minified production build

**Rendering:**
- [ ] OnPush change detection enabled on all components
- [ ] trackBy used in *ngFor loops
- [ ] Subscriptions cleaned up (takeUntil or async pipe)
- [ ] No synchronous operations in templates
- [ ] Images have explicit width/height

**HTTP:**
- [ ] Requests deduped (share()|publish pattern)
- [ ] Caching implemented for stable data
- [ ] Batch operations used instead of N requests
- [ ] Compression enabled (gzip)

---

### API Performance Optimization Checklist

**Queries:**
- [ ] `.lean()` used on MongoDB finds
- [ ] Indexes created for all filter fields
- [ ] Pagination implemented (limit ≤ 100)
- [ ] Aggregation used for complex joins
- [ ] `.select()` used to project only needed fields

**Bulk Operations:**
- [ ] `bulkWrite()` used (not loop + update)
- [ ] Batch size 50-100 (not all at once)
- [ ] Cursor used for large datasets

**Response:**
- [ ] Unnecessary fields excluded
- [ ] Lazy loading for related data
- [ ] Compression middleware enabled
- [ ] Response size < 1 MB

---

### Load Testing Baseline

**Simulate concurrent users:**
```bash
# Using Apache Bench
ab -n 1000 -c 50 http://localhost:3000/v1/expenses

# Expected: 
# Requests per second: > 100
# Mean time per request: < 500ms
# Failed requests: 0
```

**Load Test Goals:**
- 100 concurrent users: All requests < 1000ms
- 500 concurrent users: 95% of requests < 1000ms
- 1000 concurrent users: 90% of requests < 1000ms (scale horizontally)

---

### Monitoring & Alerting

**Key Metrics to Monitor:**

| Metric | Good | Alert | Critical |
|--------|------|-------|----------|
| API p95 response time | < 200ms | > 500ms | > 2000ms |
| MongoDB query p95 | < 50ms | > 100ms | > 500ms |
| Page load (FCP) | < 1.5s | > 2.5s | > 4s |
| Error rate | < 0.1% | > 0.5% | > 1% |
| Uptime | > 99.9% | < 99% | < 95% |

**Tools:**
- Grafana dashboards (APM metrics)
- CloudWatch / DataDog (infrastructure)
- Sentry (error tracking)
- New Relic / Datadog APM (endpoint profiling)

---

### Performance Investigation Workflow

When perf degrades:

1. **Measure**: Which endpoint/page is slow?
2. **Profile**: DevTools (frontend) or APM (backend)
3. **Identify**: Is it database, API logic, or frontend rendering?
4. **Fix**: Apply appropriate optimization (index, caching, code split)
5. **Verify**: Measure improvement (should see > 20% gain)

**Example:**
```
1. User reports: List page takes 5 seconds
2. DevTools shows: API call takes 4 seconds
3. Server logs show: Query takes 3.5 seconds
4. Explain plan shows: COLLSCAN on 1M documents
5. Fix: Add index { tenantId: 1, status: 1 }
6. Result: Query now 50ms, page load 1.5s ✅
```

---

### Regression Detection

**Add performance tests to CI/CD:**
```javascript
// Jest test
it('should load individuals list in < 500ms', async () => {
  const start = Date.now();
  const response = await api.get('/v1/individuals?limit=20');
  const duration = Date.now() - start;
  
  expect(response.status).toBe(200);
  expect(duration).toBeLessThan(500);
});
```

**Prevent regressions:**
- Monitor key endpoints' response times
- Alert if p95 > 1.5x baseline
- Require perf checks before merging PRs

