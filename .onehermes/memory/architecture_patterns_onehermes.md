---
name: ONEHERMES Architecture Patterns
description: Full-stack patterns for backend services, Angular components, API design, integrations with working examples
type: reference
originSessionId: bbfa8ec4-697b-469f-9e09-efa15153699e
---
## Architecture Patterns — ONEHERMES

### Backend: Controller → Service → Model

**Pattern:**
```
HTTP Request
    ↓
Controller (parse input, call service, return response)
    ↓
Service (business logic, validation, database)
    ↓
Model (MongoDB schema, queries)
```

**Controller (thin, no business logic):**
```javascript
// src/controllers/expense.controller.js
async create(req, res) {
  try {
    const { error, value } = await expenseValidation.create.validateAsync(req.body);
    if (error) throw new ApiError(error.message, 400);
    
    const expense = await expenseService.create(req.tenantContext, value);
    
    res.status(201).json({
      status: true,
      data: assembler.expense(expense),
      message: 'Expense created successfully'
    });
  } catch (error) {
    next(error);
  }
}
```

**Service (business logic):**
```javascript
// src/services/expense.service.js
async create(tenantContext, data) {
  // Validation
  if (data.amount <= 0) throw new ApiError('Amount must be positive', 400);
  
  // Get tenant model
  const Expense = getModelByTenant(tenantContext.realm, 'Expense');
  
  // Create record
  const expense = await Expense.create({
    ...data,
    tenantId: tenantContext.realm,
    createdBy: tenantContext.userId,
    status: 'pending'
  });
  
  // Publish event
  await kafkaProducer.publishEvent('expense.created', {
    id: expense._id,
    amount: expense.amount
  });
  
  return expense;
}
```

**Model (schema, queries):**
```javascript
// src/models/Expense.model.js
const expenseSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now, index: true }
});

expenseSchema.index({ tenantId: 1, status: 1 });
module.exports = mongoose.model('Expense', expenseSchema);
```

---

### Frontend: Smart Service + Dumb Component

**Pattern:**
```
API Data
    ↓
Smart Service (RxJS, HTTP, caching)
    ↓
Component (receives data via input/observable, handles UI)
    ↓
Template (displays data, captures user input)
```

**Smart Service (manages state & API calls):**
```typescript
// src/app/services/expense.service.ts
@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private expenseSubject = new BehaviorSubject<Expense[]>([]);
  expenses$ = this.expenseSubject.asObservable();

  constructor(private http: HttpClient) {}

  getList(page: number = 1): Observable<Expense[]> {
    return this.http.get<any>(`/v1/expenses?page=${page}&limit=20`).pipe(
      map(response => response.data),
      tap(expenses => this.expenseSubject.next(expenses)),
      shareReplay(1) // Cache result, share among subscribers
    );
  }

  create(expense: Expense): Observable<Expense> {
    return this.http.post<any>('/v1/expenses', expense).pipe(
      map(response => response.data),
      tap(created => {
        const current = this.expenseSubject.value;
        this.expenseSubject.next([created, ...current]);
      })
    );
  }
}
```

**Dumb Component (presentational, receives data):**
```typescript
// src/app/components/expense-list.component.ts
@Component({
  selector: 'app-expense-list',
  template: `
    <div *ngFor="let expense of (expenses$ | async); trackBy: trackById">
      {{ expense.amount | currency }}
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExpenseListComponent {
  @Input() expenses$: Observable<Expense[]>;

  trackById(index: number, expense: Expense) {
    return expense.id;
  }
}
```

**Container Component (wires service to dumb component):**
```typescript
// src/app/pages/expense-list-page.component.ts
@Component({
  selector: 'app-expense-list-page',
  template: `
    <app-expense-list [expenses$]="expenseService.expenses$"></app-expense-list>
  `
})
export class ExpenseListPageComponent implements OnInit {
  constructor(public expenseService: ExpenseService) {}

  ngOnInit() {
    this.expenseService.getList(1).subscribe();
  }
}
```

---

### Error Handling (Backend)

**Custom Error Class:**
```javascript
// src/utils/ApiError.js
class ApiError extends Error {
  constructor(message, statusCode = 500, context = {}) {
    super(message);
    this.statusCode = statusCode;
    this.context = context;
  }
}

module.exports = ApiError;
```

**Usage:**
```javascript
// Service
if (!user) throw new ApiError('User not found', 404, { userId });

// Controller catches it, middleware formats response
app.use((error, req, res, next) => {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      status: false,
      message: error.message,
      context: error.context
    });
  }
  
  // Generic error
  res.status(500).json({
    status: false,
    message: 'Internal server error'
  });
});
```

---

### HTTP Interceptor (Frontend - Token Refresh)

```typescript
// src/app/core/keycloak.interceptor.ts
@Injectable()
export class KeycloakInterceptor implements HttpInterceptor {
  constructor(private auth: KeycloakService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Add token to request
    if (this.auth.isLoggedIn) {
      req = req.clone({
        setHeaders: { Authorization: `Bearer ${this.auth.accessToken}` }
      });
    }

    return next.handle(req).pipe(
      catchError(err => {
        if (err.status === 401) {
          // Try to refresh and retry
          return this.auth.refreshToken().pipe(
            switchMap(() => {
              req = req.clone({
                setHeaders: { Authorization: `Bearer ${this.auth.accessToken}` }
              });
              return next.handle(req);
            }),
            catchError(() => {
              // Refresh failed — logout
              this.auth.logout();
              return throwError(() => err);
            })
          );
        }
        return throwError(() => err);
      })
    );
  }
}
```

---

### Reactive Forms with Validation

**Form Group & Validators:**
```typescript
export class ExpenseFormComponent implements OnInit {
  form: FormGroup;

  constructor(private fb: FormBuilder, private service: ExpenseService) {
    this.form = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0.01)]],
      category: [null, Validators.required],
      notes: [null, Validators.maxLength(500)],
      date: [new Date(), Validators.required]
    });
  }

  submit() {
    if (this.form.invalid) return;

    this.service.create(this.form.value).subscribe(
      () => {
        this.form.reset();
        // Success toast
      },
      error => {
        // Error toast
      }
    );
  }
}
```

**Template with Error Display:**
```html
<form [formGroup]="form" (ngSubmit)="submit()">
  <div>
    <input formControlName="amount" type="number" />
    <span *ngIf="form.get('amount')?.hasError('required')">
      Amount is required
    </span>
    <span *ngIf="form.get('amount')?.hasError('min')">
      Amount must be > 0
    </span>
  </div>
  
  <button [disabled]="form.invalid">Submit</button>
</form>
```

---

### Observable Patterns

**Share Results (Avoid Duplicate Requests):**
```typescript
// Good: Multiple subscribers get same response
const data$ = this.http.get('/api/data').pipe(shareReplay(1));
data$.subscribe(); // Request sent
data$.subscribe(); // Uses cached result
```

**Switch Map (Cancel Previous Request When Input Changes):**
```typescript
// Good: Typing in search cancels previous search
const results$ = this.searchInput$.pipe(
  switchMap(query => this.search(query))
);
```

**Combine Latest (Wait for Multiple Observables):**
```typescript
// Good: Wait for user + company data before rendering
const data$ = combineLatest([this.userService.user$, this.companyService.company$]).pipe(
  map(([user, company]) => ({ user, company }))
);
```

---

### Async Pipe (Auto Subscription Management)

**Without async pipe (memory leak risk):**
```typescript
export class Component implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  data: any;

  ngOnInit() {
    this.service.getData().pipe(
      takeUntil(this.destroy$)
    ).subscribe(d => this.data = d);
  }

  ngOnDestroy() {
    this.destroy$.next();
  }
}
```

**With async pipe (clean):**
```typescript
export class Component {
  data$ = this.service.getData();
}

// Template
<div>{{ (data$ | async)?.name }}</div>
```

---

### Pagination Pattern

**Backend:**
```javascript
const page = req.query.page || 1;
const limit = 20;
const skip = (page - 1) * limit;

const [data, total] = await Promise.all([
  Model.find().limit(limit).skip(skip).lean(),
  Model.countDocuments()
]);

res.json({
  data,
  pagination: { page, limit, total, pages: Math.ceil(total / limit) }
});
```

**Frontend:**
```typescript
export class ListComponent {
  currentPage$ = new BehaviorSubject(1);
  data$: Observable<any[]>;

  constructor(service: Service) {
    this.data$ = this.currentPage$.pipe(
      switchMap(page => service.getList(page))
    );
  }

  nextPage() {
    this.currentPage$.next(this.currentPage$.value + 1);
  }
}
```

---

### Key Takeaways

✅ **Backend**: Controller (input) → Service (logic) → Model (data)  
✅ **Frontend**: Container component → Smart service → Dumb component  
✅ **Observables**: Use shareReplay, switchMap, combineLatest  
✅ **Subscription cleanup**: async pipe or takeUntil  
✅ **Error handling**: ApiError with statusCode + context  
✅ **Validation**: Joi backend, Reactive Forms frontend  
✅ **Pagination**: Always paginate lists (limit ≤ 100)  
