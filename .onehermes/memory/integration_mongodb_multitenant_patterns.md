---
name: MongoDB Multi-Tenant Patterns
description: How to safely query multi-tenant data, prevent cross-tenant leaks, handle scope paths, and backfill data
type: reference
originSessionId: bbfa8ec4-697b-469f-9e09-efa15153699e
---
## MongoDB Multi-Tenant Architecture

### Overview

**One database per tenant** (isolated) or **one database with tenant column filter** (shared, must validate).

ONEHERMES uses **tenant-scoped connections**:
- MongoDB connection pool per tenant
- Each query automatically runs against tenant's DB
- Middleware validates tenant context before passing to service

### Getting Tenant Model (Safe Pattern)

```javascript
// DO: Always use getModelByTenant()
const Model = getModelByTenant(tenantContext.realm, 'User');
const users = await Model.find({ _id: userId });

// DON'T: Direct model import (no tenant context)
const Model = require('../models/User.model');
const users = await Model.find({ _id: userId }); // Could access wrong tenant's data
```

**getModelByTenant() pattern:**
```javascript
// src/models/getModelByTenant.js
function getModelByTenant(tenantId, modelName) {
  const tenantConnection = getTenantConnection(tenantId);
  
  if (!tenantConnection) {
    throw new ApiError(`Tenant not found: ${tenantId}`, 400);
  }
  
  return tenantConnection.model(modelName);
}

function getTenantConnection(tenantId) {
  // Returns tenant's private MongoDB connection
  const connections = {
    'expert': mongoClient.db('expert_db'),
    'crmweb': mongoClient.db('crmweb_db'),
    'noss': mongoClient.db('noss_db')
  };
  
  return connections[tenantId];
}
```

### Query Patterns (Backend - Node.js)

**Simple find:**
```javascript
const users = await getModelByTenant(req.tenantContext.realm, 'User')
  .find({ status: 'active' })
  .lean();
```

**With pagination:**
```javascript
const page = req.query.page || 1;
const limit = 100;
const skip = (page - 1) * limit;

const [data, total] = await Promise.all([
  getModelByTenant(req.tenantContext.realm, 'User')
    .find({ status: 'active' })
    .limit(limit)
    .skip(skip)
    .lean(),
  getModelByTenant(req.tenantContext.realm, 'User')
    .countDocuments({ status: 'active' })
]);

res.json({
  data,
  pagination: { page, limit, total, pages: Math.ceil(total / limit) }
});
```

**Populate (join):**
```javascript
// Good: Lean + minimal fields
const expenses = await getModelByTenant(realm, 'Expense')
  .find({ status: 'pending' })
  .populate({
    path: 'userId',
    select: 'name email',
    model: getModelByTenant(realm, 'User')
  })
  .lean();

// Bad: Full object loaded, memory heavy
const expenses = await Model.find().populate('userId');
```

**Aggregation (for complex queries):**
```javascript
const stats = await getModelByTenant(realm, 'Expense')
  .aggregate([
    {
      $match: { status: 'approved', createdAt: { $gte: startDate } }
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { total: -1 }
    }
  ])
  .exec();
```

### Schema Design with Tenant Scope

**Always include tenant filter field:**

```javascript
// src/models/Expense.model.js
const expenseSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  tenantId: { type: String, required: true, index: true }, // ← CRITICAL
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: Number,
  status: String,
  createdAt: Date
});

// Compound index for common query pattern
expenseSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
```

**NEVER query without tenantId filter:**
```javascript
// BAD: Could return any tenant's data
const allExpenses = await Model.find({ status: 'pending' });

// GOOD: Always filter by tenant
const expenses = await Model.find({
  tenantId: req.tenantContext.realm,
  status: 'pending'
});
```

### Scope Paths (Hierarchical Tenant Isolation)

Some tenants have **sub-scopes**. Example: `GLOBAL_EXPERT` → `DEPARTMENT_A` → `TEAM_1`

```javascript
// Schema with scopePath
const userSchema = new mongoose.Schema({
  _id: ObjectId,
  tenantId: String,
  scopePath: String, // e.g., 'GLOBAL_EXPERT/DEPARTMENT_A/TEAM_1'
  name: String
});

// Query: Users visible to someone in DEPARTMENT_A
async getVisibleUsers(req) {
  const userScope = req.tenantContext.scopePath; // 'GLOBAL_EXPERT/DEPARTMENT_A'
  
  // Find users whose scopePath starts with userScope
  const users = await Model.find({
    tenantId: req.tenantContext.realm,
    scopePath: { $regex: `^${escapeRegex(userScope)}` }
  });
  
  return users; // Returns users in DEPARTMENT_A and TEAM_1, TEAM_2, etc.
}
```

### Bulk Operations (Migration/Backfill)

**DO:**
```javascript
// Process in batches, use bulkWrite
const BATCH_SIZE = 100;
const Model = getModelByTenant(tenantId, 'Expense');

async function backfillStatus() {
  let processed = 0;
  let batch = [];
  
  const cursor = Model.find({ status: { $exists: false } }).cursor();
  
  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    batch.push({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: { status: 'pending' } }
      }
    });
    
    if (batch.length >= BATCH_SIZE) {
      await Model.bulkWrite(batch);
      processed += batch.length;
      logger.info(`Backfilled ${processed} documents`);
      batch = [];
    }
  }
  
  // Final batch
  if (batch.length > 0) {
    await Model.bulkWrite(batch);
    processed += batch.length;
  }
  
  logger.info(`Backfill complete: ${processed} documents updated`);
}
```

**DON'T:**
```javascript
// Antipattern: Loop + individual update (N queries instead of 1)
const docs = await Model.find({ status: { $exists: false } });
for (const doc of docs) {
  doc.status = 'pending';
  await doc.save(); // ← BAD: one query per document
}
```

### Indexes for Performance

**Create these indexes:**
```javascript
// src/models/Expense.model.js
expenseSchema.index({ tenantId: 1 }); // Always needed
expenseSchema.index({ tenantId: 1, status: 1 }); // Common filter
expenseSchema.index({ tenantId: 1, userId: 1 }); // Common lookup
expenseSchema.index({ tenantId: 1, createdAt: -1 }); // Sorting
expenseSchema.index({ tenantId: 1, status: 1, createdAt: -1 }); // Common combo
```

**Check index usage:**
```bash
# Connect to MongoDB
mongo <connection-string>

# Use tenant DB
use expert_db

# View indexes
db.expenses.getIndexes()

# Check query execution plan
db.expenses.find({ tenantId: 'expert', status: 'pending' }).explain('executionStats')
# If executionStage is COLLSCAN (not IXSCAN), index is missing
```

### Common Multi-Tenant Issues & Fixes

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Cross-tenant data leak | Query missing tenantId filter | Add tenantId to every find query |
| N+1 queries | Not using populate batching | Use populate with limit, or aggregation |
| Slow queries on large datasets | Missing indexes | Index tenantId + filter fields |
| Cannot read tenant data | getModelByTenant() returns wrong connection | Check tenant name in tenantContext.realm |
| Backfill timed out | Processing all documents at once | Use cursor + batch processing |
| Duplicate data after migration | Running backfill twice | Add idempotency check (check if status already set) |

### Testing Multi-Tenant Isolation

```javascript
// Test: one tenant cannot see another's data
async function testTenantIsolation() {
  const expertModel = getModelByTenant('expert', 'Expense');
  const crwebModel = getModelByTenant('crmweb', 'Expense');
  
  // Create expense in 'expert' tenant
  const expense = await expertModel.create({
    tenantId: 'expert',
    amount: 100
  });
  
  // Try to read from 'crmweb' tenant
  const found = await crwebModel.findById(expense._id);
  
  // Should NOT find it (different database)
  assert.isNull(found);
}
```

### Key Takeaways

✅ Always use `getModelByTenant()` (never direct model imports)  
✅ Every query includes `{ tenantId: req.tenantContext.realm }`  
✅ Create compound indexes with tenantId + filter fields  
✅ Use bulk operations for backfills (not loop + update)  
✅ Scope paths enable hierarchical data visibility  
✅ Test tenant isolation (one tenant can't read another's data)  
✅ Use cursor + batches for large data migrations  
