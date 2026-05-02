---
name: ONEHERMES Common Pitfalls & Gotchas
description: Known issues, anti-patterns, and lessons learned from past bugs in ONEHERMES
type: reference
originSessionId: bbfa8ec4-697b-469f-9e09-efa15153699e
---
## Common Gotchas — ONEHERMES

### Backend Gotchas

#### 1. **Querying Without Tenant Filter** (Data Leak)
```javascript
// 🔴 WRONG: Returns data from ALL tenants
const users = await User.find({ status: 'active' });

// 🟢 CORRECT: Tenant-scoped connection already filters
const users = await getModelByTenant(realm, 'User').find({ status: 'active' });
```
**Why it happens**: Forgetting that `getModelByTenant()` returns tenant's connection, not a model.
**Impact**: Cross-tenant data leak (CRITICAL).
**Fix**: Always get model via `getModelByTenant(tenantContext.realm, 'ModelName')`.

---

#### 2. **Direct Model Import** (Wrong Data)
```javascript
// 🔴 WRONG: No tenant context
const User = require('../models/User.model');
const users = await User.find({ _id: userId });

// 🟢 CORRECT: Tenant-aware
const User = getModelByTenant(req.tenantContext.realm, 'User');
const users = await User.findById(userId);
```
**Why it happens**: Habit from non-multi-tenant apps.
**Impact**: Queries hit wrong database or default connection.
**Fix**: Use `getModelByTenant()` everywhere.

---

#### 3. **N+1 Queries in Aggregation**
```javascript
// 🔴 WRONG: Loops instead of batch
const users = await User.find();
for (const user of users) {
  const expenses = await Expense.find({ userId: user._id }); // N queries
}

// 🟢 CORRECT: Aggregation
const results = await User.aggregate([
  { $lookup: { from: 'expenses', localField: '_id', foreignField: 'userId', as: 'expenses' } }
]);
```
**Why it happens**: Easier to loop than write aggregation.
**Impact**: 100+ documents → 100+ queries (seconds instead of milliseconds).
**Fix**: Use `$lookup` aggregation or populate with limit.

---

#### 4. **Loop + Individual Update** (Performance Disaster)
```javascript
// 🔴 WRONG: 1000 queries for 1000 docs
for (const expense of expenses) {
  await Expense.findByIdAndUpdate(expense._id, { status: 'archived' });
}

// 🟢 CORRECT: 1 query
await Expense.bulkWrite(
  expenses.map(e => ({
    updateOne: { filter: { _id: e._id }, update: { $set: { status: 'archived' } } }
  }))
);
```
**Why it happens**: Loop is more intuitive than bulk API.
**Impact**: 1000 document update takes 10+ seconds instead of 100ms.
**Fix**: Always use `bulkWrite()` for batch operations.

---

#### 5. **Missing Indexes** (Slow Queries)
```javascript
// 🔴 WRONG: Query slow on large dataset (full table scan)
const expenses = await Expense.find({ tenantId: realm, status: 'pending' });

// 🟢 CORRECT: Add index
expenseSchema.index({ tenantId: 1, status: 1 });
const expenses = await Expense.find({ tenantId: realm, status: 'pending' }); // Now fast
```
**Why it happens**: Indexes not created during schema migration.
**Impact**: 1M documents → 5 second query instead of 50ms.
**Fix**: Index all fields used in `find()` filters and sorts.

---

#### 6. **Keycloak Token Not Refreshed** (401 Errors)
```javascript
// 🔴 WRONG: Token only refreshed after 401 (user sees error)
if (error.status === 401) {
  refreshToken(); // Too late, page already failed
}

// 🟢 CORRECT: Refresh 1 minute before expiry
setTimeout(() => refreshToken(), expiresIn - 60000);
```
**Why it happens**: On-demand refresh seems simpler.
**Impact**: Users see "unauthorized" toasts, flows break mid-action.
**Fix**: Proactive refresh with timer.

---

#### 7. **Assembler Not Updated** (Wrong Response Shape)
```javascript
// Schema has new field
expenseSchema.add({ approvalNotes: String });

// 🔴 WRONG: Assembler still returns old fields
const assembler = (expense) => ({
  id: expense._id,
  amount: expense.amount,
  status: expense.status
  // Missing: approvalNotes
});

// 🟢 CORRECT: Updated assembler
const assembler = (expense) => ({
  id: expense._id,
  amount: expense.amount,
  status: expense.status,
  approvalNotes: expense.approvalNotes
});
```
**Why it happens**: Schema and assembler in different files, easy to forget one.
**Impact**: Frontend expects field, gets undefined, breaks.
**Fix**: Update assembler whenever schema changes.

---

### Frontend Gotchas

#### 8. **Memory Leak: Subscription Not Unsubscribed**
```typescript
// 🔴 WRONG: Observable still active after component destroy
ngOnInit() {
  this.expenseService.list().subscribe(
    expenses => this.expenses = expenses
  );
}

// 🟢 CORRECT: Unsubscribe on destroy
private destroy$ = new Subject<void>();

ngOnInit() {
  this.expenseService.list()
    .pipe(takeUntil(this.destroy$))
    .subscribe(expenses => this.expenses = expenses);
}

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}

// Even better: async pipe (auto-unsubscribes)
expenses$ = this.expenseService.list();

// Template
<div *ngFor="let expense of (expenses$ | async)">
```
**Why it happens**: Forgetting to cleanup subscriptions.
**Impact**: Hundreds of active subscriptions → memory leak → browser crash.
**Fix**: Use `takeUntil` pattern or async pipe.

---

#### 9. **Null/Undefined Guard Missing in Template**
```html
<!-- 🔴 WRONG: Crashes if user is null -->
<p>User: {{ user.name }}</p>

<!-- 🟢 CORRECT: Safe navigation -->
<p>User: {{ user?.name }}</p>

<!-- Or with *ngIf -->
<p *ngIf="user">User: {{ user.name }}</p>
```
**Why it happens**: Template renders before data loads.
**Impact**: "Cannot read property 'name' of null" error.
**Fix**: Use `?.` safe navigation or `*ngIf` guard.

---

#### 10. **Nested Subscription Hell (Callback Hell)**
```typescript
// 🔴 WRONG: Nested subscribes (hard to debug, memory leak)
this.service1.getData().subscribe(data1 => {
  this.service2.getMore(data1).subscribe(data2 => {
    this.service3.finish(data2).subscribe(data3 => {
      this.result = data3; // Hard to follow
    });
  });
});

// 🟢 CORRECT: RxJS operators
this.result$ = this.service1.getData().pipe(
  switchMap(data1 => this.service2.getMore(data1)),
  switchMap(data2 => this.service3.finish(data2))
);
```
**Why it happens**: Easy to nest subscribes, harder to use operators.
**Impact**: Memory leak, hard to test, hard to cancel.
**Fix**: Use `switchMap`, `mergeMap`, `concatMap` operators.

---

#### 11. **Change Detection Triggered by Parent Re-render**
```typescript
// 🔴 WRONG: Component re-renders on every parent change (even unrelated)
@Component({
  selector: 'app-expense-list',
  template: `<div>{{ expenses }}</div>`
  // Change detection: Default
})

// 🟢 CORRECT: Only re-render when inputs change
@Component({
  selector: 'app-expense-list',
  template: `<div>{{ expenses }}</div>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
```
**Why it happens**: OnPush requires explicit changeRef.markForCheck().
**Impact**: 100 unnecessary re-renders → janky UI.
**Fix**: Use OnPush + async pipe or explicit changeRef.

---

### Integration Gotchas

#### 12. **Keycloak Realm Mismatch** (Token Validation Fails)
```javascript
// Backend configured for realm='expert'
const decoded = jwt.verify(token, publicKey, {
  issuer: 'https://test-auth.onehermes.net/realms/expert' // ← Must match
});

// Frontend login against realm='crmweb' → Token issuer mismatch → 401
```
**Why it happens**: Realm config scattered across files, easy to misconfigure.
**Impact**: Login works, but every API call returns 401.
**Fix**: Centralize realm in .env, validate matches on both frontend + backend.

---

#### 13. **Microsoft Graph Throttled (429)** (API Hangs)
```javascript
// 🔴 WRONG: No retry logic
const users = await graphApi.callGraph('GET', '/users?$top=1000');

// 🟢 CORRECT: Exponential backoff
async callWithRetry(fn) {
  for (let i = 0; i < 3; i++) {
    try {
      return await fn();
    } catch (err) {
      if (err.status === 429) {
        const wait = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        await sleep(wait);
      } else throw err;
    }
  }
}
```
**Why it happens**: Microsoft Graph has rate limits (25 concurrent requests).
**Impact**: Bulk user sync hangs/fails at 429.
**Fix**: Implement exponential backoff, use delta queries.

---

#### 14. **Kafka Message Lost** (Manual Commit Skipped)
```javascript
// 🔴 WRONG: Offset committed before processing (message lost if consumer crashes)
consumer.run({ autoCommit: true });

// 🟢 CORRECT: Offset committed AFTER successful processing
eachMessage: async (message) => {
  await processMessage(message);
  await consumer.commitOffsets([...]);
}
```
**Why it happens**: autoCommit seems simpler.
**Impact**: Consumer crashes, message lost forever.
**Fix**: Use manual commit after successful processing.

---

#### 15. **MongoDB scopePath Filter Missing** (Cross-Scope Leak)
```javascript
// 🔴 WRONG: No scope path filter
const users = await User.find({ tenantId: realm, active: true });

// 🟢 CORRECT: Filter by user's scope path
const users = await User.find({
  tenantId: realm,
  active: true,
  scopePath: { $regex: `^${escapeRegex(userScopePath)}` }
});
```
**Why it happens**: Easy to forget scope path hierarchy.
**Impact**: User can see/modify sibling teams' data.
**Fix**: Always include scopePath in queries requiring visibility filtering.

---

## Quick Gotcha Checklist

Before shipping:
- [ ] All queries include `tenantId` filter
- [ ] Using `getModelByTenant()`, not direct imports
- [ ] Subscriptions have `takeUntil` or use async pipe
- [ ] Null checks in templates (`?.` or `*ngIf`)
- [ ] Bulk operations used (not loops)
- [ ] Indexes created for filter fields
- [ ] Keycloak token refresh proactive (not on 401)
- [ ] Assemblers updated when schema changes
- [ ] No nested subscribes (use RxJS operators)
- [ ] Manual Kafka commit after processing
- [ ] scopePath filters in hierarchical queries

