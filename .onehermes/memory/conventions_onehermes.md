---
name: ONEHERMES Code Conventions
description: Single source of truth for naming, style, folder structure, and patterns across backend, frontend, integrations
type: reference
originSessionId: bbfa8ec4-697b-469f-9e09-efa15153699e
---
## Code Conventions — ONEHERMES

### Backend (Node.js / Express)

**File Structure:**
```
src/
├── controllers/          [HTTP request handling]
├── services/            [Business logic]
├── models/              [MongoDB schemas]
├── routes/              [Endpoint registration]
├── middlewares/         [Auth, validation, logging]
├── validations/         [Joi schemas]
├── helpers/             [Utilities]
├── config/              [Constants, enums, configuration]
├── locales/             [Error messages, i18n]
└── scripts/             [One-off migrations, setup]
```

**Naming Conventions:**

| Type | Pattern | Example |
|------|---------|---------|
| File | kebab-case | `user.service.js`, `expense-claim.controller.js` |
| Class/Function | camelCase | `getUserById()`, `createExpenseWithApproval()` |
| Constant | UPPER_SNAKE_CASE | `DEFAULT_PAGE_SIZE`, `API_TIMEOUT_MS` |
| Variable | camelCase | `userId`, `expenseAmount` |
| Route | lowercase-kebab | `/v1/user/profile`, `/v1/expense-claim/list` |
| Schema field | camelCase | `createdAt`, `userId`, `approvalStatus` |

**Code Style:**
- 125 character line width (not 80)
- Single quotes (`'string'`, not `"string"`)
- CommonJS (`require`/`module.exports`)
- No arrow functions in class methods (use regular methods)
- Always use `const`, never `var` or `let` (unless reassignment needed)

**Error Handling:**
```javascript
// Bad
throw new Error('User not found');

// Good
throw new ApiError('User not found', 404, { userId });
```

**Logging:**
```javascript
// Bad
console.log('Processing expense:', expense);

// Good
logger.info('Processing expense', { expenseId: expense._id, status: expense.status });
logger.error('Failed to process expense', { error: error.message, expenseId });
```

---

### Frontend (Angular)

**File Structure:**
```
src/app/
├── modules/             [Feature modules]
│  └── expenses/
│     ├── expenses.module.ts
│     ├── expenses.component.ts
│     ├── expenses.component.html
│     ├── expenses.component.scss
│     └── expenses.service.ts
├── shared/             [Shared components, directives, pipes]
├── core/               [Auth, logging, interceptors]
└── assets/             [Images, fonts, styles]
```

**Naming Conventions:**

| Type | Pattern | Example |
|------|---------|---------|
| Component class | PascalCase + Component | `ExpenseListComponent` |
| Service class | PascalCase + Service | `ExpenseService` |
| File | kebab-case | `expense-list.component.ts`, `expense.service.ts` |
| Variable | camelCase | `expenseList`, `isLoading` |
| Observable variable | camelCase$ | `expenses$`, `isLoading$` |
| Input property | camelCase | `@Input() expenseId: string;` |

**Code Style:**
- 125 character line width
- Single quotes
- Use `OnDestroy` + `takeUntil` for subscription cleanup
- Enable `OnPush` change detection
- Use async pipe in templates (auto-unsubscribe)

**Template Patterns:**
```html
<!-- Good: async pipe + safe navigation -->
<div *ngFor="let expense of (expenses$ | async); trackBy: trackByExpenseId">
  {{ expense?.amount | currency }}
</div>

<!-- Bad: manual subscription -->
<div *ngFor="let expense of expenseList">
  {{ expense.amount | currency }}
</div>
```

---

### Shared Patterns

**Enums:**
```javascript
// constants/expenseStatus.enum.js (backend)
const EXPENSE_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};
```

**API Response Format:**
```javascript
{
  "status": true,
  "data": { ... },
  "message": "Expense created successfully",
  "pagination": { "page": 1, "limit": 20, "total": 100 } // Optional
}
```

**Date Format:**
- ISO 8601: `2026-04-28T14:30:00Z` (always UTC)
- Backend returns UTC, frontend displays in user's timezone
- Never use timestamps alone (ambiguous timezone)

**Validation:**
- Backend: Joi schemas (required, not optional)
- Frontend: Reactive forms with sync validators
- Always validate on both sides (never trust frontend)

---

### Database (MongoDB)

**Schema Field Naming:**
```javascript
_id              // Always ObjectId
tenantId         // Required for multi-tenant
createdAt        // ISO date
updatedAt        // ISO date
createdBy        // User ID
status           // Enum string
isActive         // Boolean (is prefix)
metadata         // Object for flexible fields
```

**Queries:**
```javascript
// Lean query (returns plain object, faster)
await Model.find({ status: 'active' }).lean();

// With pagination
await Model.find().limit(20).skip(0).lean();

// Bulk operations
await Model.bulkWrite([
  { updateOne: { filter, update } },
  { deleteOne: { filter } }
]);
```

---

### Git Commits

**Message format:**
```
<type>: <description>

<optional body>

Closes #123
```

**Types:** `feat`, `fix`, `refactor`, `test`, `chore`, `docs`

**Examples:**
```
feat: add expense approval workflow
fix: prevent cross-tenant data leakage in user queries
refactor: simplify expense status enum handling
test: add integration tests for Keycloak token refresh
```

**Branch naming:**
```
feature/expense-approval
fix/keycloak-token-leak
refactor/mongodb-indexes
```

---

### Comments

**NO comments unless the WHY is non-obvious:**
```javascript
// Bad
const users = await User.find(); // Get all users

// Good
const users = await User.find(); // No comment needed

// Good (explains non-obvious constraint)
// Fetch all users eagerly because Angular template needs full list,
// pagination happens client-side for instant filtering
const users = await User.find().lean();
```

---

### Key Takeaways

✅125 char lines, single quotes, camelCase variables  
✅CommonJS backend, TypeScript frontend  
✅Always use getModelByTenant(), ApiError, logger  
✅Lean queries, bulk operations, proper indexing  
✅Observable$ naming, takeUntil cleanup, async pipe  
✅Validate on both backend + frontend  
✅Comments only for WHY, not WHAT  
