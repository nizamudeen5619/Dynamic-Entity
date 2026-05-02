---
name: Feature Scaffold System
description: Node.js generator that creates full-stack boilerplate following ONEHERMES patterns
type: reference
originSessionId: bbfa8ec4-697b-469f-9e09-efa15153699e
---
# Feature Scaffold System

**Location**: `n:\Work\backup\.claude\scaffold\`  
**Status**: ✅ Active (2026-04-28)  
**Templates**: 8 files (backend, frontend, tests)

---

## Quick Start

```bash
node scaffold/feature-generator.js --name expense-claim --type crud --domain expenses --no-ui
```

**Parameters**:
- `--name` (required) — kebab-case feature name
- `--type` (optional, default: crud) — crud | entity | endpoint | service
- `--domain` (optional) — logical domain/area (e.g. "expenses", "hr")
- `--no-ui` (optional flag) — skip frontend files

---

## What Gets Generated

### Backend Files
```
src/
  routes/v1/{domain}.route.js          [Route registration, multi-tenant]
  controllers/{feature}.controller.js   [Thin controller, request handling]
  services/{feature}.service.js         [Business logic, getModelByTenant]
  models/{feature}.model.js             [Mongoose schema for CRUD types]
  validations/{feature}.validation.js   [Joi validation schemas]
```

**Example (expense-claim)**:
- `src/routes/v1/expenses.route.js` — GET, POST, PATCH, DELETE endpoints
- `src/controllers/expense-claim.controller.js` — Handler for each route
- `src/services/expense-claim.service.js` — List, create, update, delete methods
- `src/models/expense-claim.model.js` — Expense schema with required fields
- `src/validations/expense-claim.validation.js` — Joi rules for input validation

### Frontend Files (unless `--no-ui`)
```
src/app/modules/{feature}/
  {feature}.module.ts                  [Angular NgModule, imports/declarations]
  {feature}.component.ts               [Component with smart service injection]
  {feature}.service.ts                 [Smart service with RxJS + HTTP]
  {feature}.component.html             [Basic template with async pipe]
  {feature}.component.scss             [Style placeholder]
```

### Test Files
```
__tests__/{feature}.service.test.js    [Jest test scaffolding with mocks]
```

---

## Generated Code Patterns

### Backend Service Pattern
```javascript
const { getModelByTenant } = require('../../models/getModelByTenant');
const ApiError = require('../../utils/ApiError');

exports.list = async (tenantContext, query) => {
  const Model = await getModelByTenant(tenantContext, 'ExpenseClaim');
  const { page, limit } = query;
  
  const data = await Model.find()
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
    
  return { data, pagination: { page, limit, total: await Model.countDocuments() } };
};

exports.create = async (tenantContext, payload) => {
  const Model = await getModelByTenant(tenantContext, 'ExpenseClaim');
  const result = await Model.create(payload);
  return result;
};
```

**Guarantees**:
✅ Multi-tenant isolation via `getModelByTenant()`  
✅ Error handling with `ApiError` class  
✅ Winston logging available  
✅ Joi validation hooks included  
✅ CommonJS syntax (Node.js standard)

### Frontend Service Pattern
```typescript
@Injectable({ providedIn: 'root' })
export class ExpenseClaimService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<any>(null);
  private dataSubject = new BehaviorSubject<any[]>([]);

  loading$ = this.loadingSubject.asObservable();
  error$ = this.errorSubject.asObservable();
  data$ = this.dataSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadData() {
    this.loadingSubject.next(true);
    this.http.get<any>('/v1/expense-claim')
      .pipe(
        map(response => response.data),
        tap(data => {
          this.dataSubject.next(data);
          this.loadingSubject.next(false);
        }),
        catchError(error => {
          this.errorSubject.next(error);
          this.loadingSubject.next(false);
          return of([]);
        }),
        shareReplay(1)
      )
      .subscribe();
  }
}
```

**Guarantees**:
✅ Smart service with BehaviorSubjects for state  
✅ Observable streams for loading/error/data  
✅ Subscription cleanup ready (async pipe in template)  
✅ RxJS operators (map, tap, catchError, shareReplay)  
✅ OnPush change detection strategy  
✅ Reactive forms with FormBuilder

### Component Pattern
```typescript
@Component({
  selector: 'app-expense-claim',
  templateUrl: './expense-claim.component.html',
  styleUrls: ['./expense-claim.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExpenseClaimComponent implements OnInit, OnDestroy {
  form: FormGroup;
  data$ = this.service.data$;
  loading$ = this.service.loading$;
  error$ = this.service.error$;

  private destroy$ = new Subject<void>();

  constructor(private service: ExpenseClaimService, private fb: FormBuilder) {
    this.form = this.fb.group({
      // TODO: Add form controls
    });
  }

  ngOnInit() {
    this.service.loadData();
  }

  submit() {
    if (this.form.invalid) return;
    this.service.create(this.form.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe(...);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

**Guarantees**:
✅ Subscription cleanup with `destroy$` Subject  
✅ Form state managed with FormGroup  
✅ Smart service injection  
✅ OnPush change detection (performance)  
✅ Template uses async pipe for auto-unsubscribe

---

## After Scaffold: User Responsibilities

1. **Fill Business Logic**
   - Implement service methods (list, create, update, delete)
   - Add validation rules in service
   - Handle edge cases and error scenarios

2. **Connect UI**
   - Add form controls to FormBuilder
   - Bind form fields in template
   - Add table/list display if needed

3. **Add Integrations** (if applicable)
   - Keycloak role checks in controller
   - Microsoft Graph/Kafka calls in service
   - Token refresh handling in HTTP interceptor

4. **Write Tests**
   - Jest unit tests for service methods
   - Integration tests for API endpoints
   - E2E tests for UI flow

5. **Register Routes**
   - Add route to `src/routes/v1/index.js` (backend)
   - Add routing module to feature (frontend)

---

## Template Files Location

```
n:\Work\backup\.claude\scaffold\templates\
  backend/
    route.template.js
    controller.template.js
    service.template.js
    model.template.js
    validation.template.js
  frontend/
    module.template.js
    component.template.js
    service.template.js
  tests/
    service.test.template.js
```

Each template exports a function: `(config) => string` that generates code based on feature name, type, and domain.

---

## Configuration Object

Templates receive `config` with:
```javascript
{
  featureName: 'expense-claim',        // Kebab-case input
  type: 'crud',                        // Feature type
  domain: 'expenses',                  // Logical domain
  includeUI: true                      // Whether to generate frontend files
}
```

Templates derive PascalCase (ExpenseClaim) via normalizeConfig helper.

---

## Recent Fixes (2026-04-28)

- ✅ Template references corrected: `templates.backendService` and `templates.frontendService`
- ✅ All templates properly export functions taking config parameter
- ✅ Directory creation with recursive flag
- ✅ File existence check to prevent overwrites

---

## Integration with Command System

Use `/scaffold` command in IDE to:
1. Specify feature name and type interactively
2. Ask clarifying questions (database entity? Permissions needed?)
3. Run scaffold generator
4. Show next steps checklist

See [Command Templates Reference](command_templates_reference.md) for details.
