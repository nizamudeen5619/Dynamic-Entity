---
name: Entity Record Component Reference Patterns
description: Architectural patterns from entity-record.component.ts, the authoritative reference for component design in ONEHERMES
type: reference
originSessionId: bbfa8ec4-697b-469f-9e09-efa15153699e
---
# Entity Record Component — Reference Patterns

**File**: `n:\Work\backup\Superpower_Web\src\app\commonModules\entity-data-table\entity-record\entity-record.component.ts`  
**Size**: 2200+ lines  
**Status**: ✅ Production component — use as reference for all component work  
**Last Reviewed**: 2026-04-28

---

## Pattern Overview

This component demonstrates the **authoritative** patterns for:
- Component lifecycle management with RxJS
- Form state management (FormGroup + FormArray)
- Multi-tab navigation with nested structures
- Role-based access control (RBAC) at form and field level
- Complex hierarchical data transformation
- Smart service integration
- Change detection optimization

---

## 1. Subscription Management (Memory Leak Prevention)

### Pattern
```typescript
private destroy$ = new Subject<void>();

ngOnInit() {
  this.someService.data$
    .pipe(takeUntil(this.destroy$))
    .subscribe(data => { /* ... */ });
}

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

**Why**: Prevents memory leaks by unsubscribing when component destroys.  
**Use**: On EVERY subscription in ngOnInit or anywhere in the component.  
**Alternative**: Use `async` pipe in template (automatic unsubscribe).

---

## 2. Form Management with Validation

### Pattern: FormGroup + FormArray
```typescript
form: FormGroup;

constructor(private fb: FormBuilder) {
  this.form = this.fb.group({
    basicInfo: this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    }),
    addresses: this.fb.array([
      this.createAddressControl()
    ])
  });
}

private createAddressControl(): FormGroup {
  return this.fb.group({
    street: ['', Validators.required],
    city: ['', Validators.required]
  });
}

addAddress() {
  (this.form.get('addresses') as FormArray).push(this.createAddressControl());
}
```

**Guarantees**:
- Type-safe form control access
- Nested structure support (groups and arrays)
- Validation state tracking
- Custom validators supported

**Key Methods**:
- `form.get('fieldName')` — Access control
- `form.patchValue({...})` — Update partial form
- `form.markAllAsTouched()` — Trigger validation UI
- `form.valid` — Check overall validity

---

## 3. Multi-Tab Architecture

### Pattern: Tab Navigation State
```typescript
primaryTab: string = 'details'; // Active primary tab
outerTabs: string[] = ['tab1', 'tab2', 'tab3'];
activeNestedTabIds: Map<string, string> = new Map();

selectTab(tabId: string) {
  this.primaryTab = tabId;
  // Load data for this tab if lazy-loaded
  if (!this.loadedTabs.has(tabId)) {
    this.loadTabData(tabId);
  }
}

selectNestedTab(parentTabId: string, nestedTabId: string) {
  this.activeNestedTabIds.set(parentTabId, nestedTabId);
}
```

**Patterns**:
- Use `primaryTab` string to track which main tab is active
- Use `activeNestedTabIds` Map for nested tabs (avoids array index issues)
- Lazy-load tab data on first visit (performance)
- Each tab maintains its own form state

**Template**:
```html
<p-tabView [(activeIndex)]="primaryTab">
  <p-tabPanel header="Details">
    <nested-tabs [parentTabId]="primaryTab" 
                 [activeTabId]="activeNestedTabIds.get(primaryTab)"
                 (tabChange)="selectNestedTab(primaryTab, $event)">
    </nested-tabs>
  </p-tabPanel>
</p-tabView>
```

---

## 4. Role-Based Access Control (RBAC)

### Pattern: Field-Level Permissions
```typescript
canEditRecord: boolean;
canDeleteRecord: boolean;

formControlsReadOnly: Map<string, boolean> = new Map();

ngOnInit() {
  // Load permissions from backend
  this.permissionService.getPermissions(this.recordId)
    .pipe(takeUntil(this.destroy$))
    .subscribe(perms => {
      this.canEditRecord = perms.includes('EDIT_RECORD');
      this.canDeleteRecord = perms.includes('DELETE_RECORD');
      
      // Disable specific fields based on RBAC
      if (!perms.includes('EDIT_SALARY')) {
        this.formControlsReadOnly.set('salary', true);
        this.form.get('salary')?.disable();
      }
    });
}

isFieldReadOnly(fieldName: string): boolean {
  return this.formControlsReadOnly.get(fieldName) ?? false;
}
```

**Template**:
```html
<input [formControl]="form.get('salary')" 
       [readonly]="isFieldReadOnly('salary')" />
```

**Hierarchy**: 
- Form-level: Can user view/edit/delete entire record?
- Tab-level: Can user access certain tabs?
- Field-level: Can user modify specific fields?

**Implementation**: Backend sends permission set; frontend applies via `disabled` or `readonly`.

---

## 5. Complex Data Transformation

### Pattern: Flatten/Unflatten Hierarchies
```typescript
private flattenTabs(data: any): any {
  // Convert nested structure to flat form representation
  const flattened = {
    basicInfo: data.basicInfo,
    address: data.addresses?.[0], // Flatten first address
    experience: data.professional?.experience || [],
    education: data.professional?.education || []
  };
  return flattened;
}

private patchRecordWithTabData(tabData: any): any {
  // Reverse: Convert form data back to nested structure
  return {
    basicInfo: tabData.basicInfo,
    addresses: [tabData.address],
    professional: {
      experience: tabData.experience,
      education: tabData.education
    }
  };
}

loadRecord() {
  this.recordService.getById(this.recordId)
    .pipe(
      map(record => this.flattenTabs(record)),
      takeUntil(this.destroy$)
    )
    .subscribe(flattened => {
      this.form.patchValue(flattened);
    });
}

saveRecord() {
  const nested = this.patchRecordWithTabData(this.form.value);
  this.recordService.update(this.recordId, nested)
    .pipe(takeUntil(this.destroy$))
    .subscribe(() => { /* success */ });
}
```

**Key Insight**: Database stores hierarchical data; forms need flattened structure. Transform on load/save.

---

## 6. Visibility and Validation Rules

### Pattern: Dynamic Visibility Based on Rules
```typescript
visibilityRules: Map<string, Function> = new Map([
  ['salary', (data) => data.employmentType === 'FULL_TIME'],
  ['bonusPool', (data) => data.department === 'SALES']
]);

isFieldVisible(fieldName: string, formData: any): boolean {
  const rule = this.visibilityRules.get(fieldName);
  return rule ? rule(formData) : true;
}

ngOnInit() {
  this.form.valueChanges
    .pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    )
    .subscribe(data => {
      this.visibleFields = new Set(
        Array.from(this.visibilityRules.keys()).filter(f => 
          this.isFieldVisible(f, data)
        )
      );
    });
}
```

**Template**:
```html
<div *ngIf="visibleFields.has('salary')">
  <label>Salary</label>
  <input formControlName="salary" />
</div>
```

**Pattern**: Store rules in Map, evaluate on form value changes, update visible fields dynamically.

---

## 7. Change Detection Optimization

### Pattern: OnPush Strategy
```typescript
@Component({
  selector: 'app-entity-record',
  templateUrl: './entity-record.component.html',
  styleUrls: ['./entity-record.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntityRecordComponent {
  // Component only re-renders when:
  // 1. Input properties change
  // 2. Event handlers fire
  // 3. Observable emits (if using async pipe)
}
```

**Impact**: Skips change detection for parent component changes. Significant performance improvement.  
**Requirement**: Use immutable data patterns and async pipe for observables.

---

## 8. State Management with BehaviorSubjects

### Pattern: Service-Level State
```typescript
private recordSubject = new BehaviorSubject<any>(null);
private loadingSubject = new BehaviorSubject<boolean>(false);
private errorSubject = new BehaviorSubject<string>(null);

record$ = this.recordSubject.asObservable();
loading$ = this.loadingSubject.asObservable();
error$ = this.errorSubject.asObservable();

loadRecord(id: string) {
  this.loadingSubject.next(true);
  this.http.get(`/api/records/${id}`)
    .subscribe({
      next: (data) => {
        this.recordSubject.next(data);
        this.loadingSubject.next(false);
      },
      error: (err) => {
        this.errorSubject.next(err.message);
        this.loadingSubject.next(false);
      }
    });
}
```

**Component Usage**:
```html
<div *ngIf="(loading$ | async)">Loading...</div>
<form *ngIf="(record$ | async) as record" [formGroup]="form">
  <!-- Form content -->
</form>
<div *ngIf="(error$ | async) as error" class="error">{{ error }}</div>
```

---

## 9. Inline Row Editing (Array Fields)

### Pattern: Add/Edit Modes
```typescript
editingRowIndex: number | null = null;

editRow(index: number) {
  this.editingRowIndex = index;
}

cancelEdit() {
  this.editingRowIndex = null;
}

saveRow(index: number) {
  const control = (this.form.get('items') as FormArray).at(index);
  if (control.valid) {
    this.editingRowIndex = null;
  }
}

deleteRow(index: number) {
  (this.form.get('items') as FormArray).removeAt(index);
}
```

**Template**:
```html
<tr *ngFor="let item of items; let i = index" [class.editing]="editingRowIndex === i">
  <td>
    <input *ngIf="editingRowIndex === i" [formControl]="control" />
    <span *ngIf="editingRowIndex !== i">{{ item.name }}</span>
  </td>
  <td>
    <button (click)="editingRowIndex === i ? saveRow(i) : editRow(i)">
      {{ editingRowIndex === i ? 'Save' : 'Edit' }}
    </button>
  </td>
</tr>
```

---

## 10. Confirmation Dialogs for Destructive Actions

### Pattern: Prevent Accidental Deletion
```typescript
deleteRecord() {
  this.confirmationService.confirm({
    message: 'Are you sure you want to delete this record?',
    header: 'Confirm',
    icon: 'pi pi-exclamation-triangle',
    accept: () => {
      this.recordService.delete(this.recordId)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.router.navigate(['/records']);
        });
    },
    reject: () => { /* Do nothing */ }
  });
}
```

**Import**: `import { ConfirmationService } from 'primeng/api';`

---

## Summary: Key Takeaways

| Pattern | Location | Why |
|---------|----------|-----|
| `destroy$` + `takeUntil` | ngOnInit subscriptions | Prevent memory leaks |
| `FormBuilder` groups/arrays | Form construction | Type-safe, nested support |
| Lazy tab loading | selectTab() | Performance optimization |
| RBAC field maps | ngOnInit | Fine-grained permissions |
| Flatten/unflatten | load/save | Bridge form ↔ DB structures |
| Visibility rules map | Form changes | Dynamic UI based on state |
| ChangeDetectionStrategy.OnPush | @Component | Performance |
| BehaviorSubjects | Smart service | Reactive state management |
| Inline row editing | FormArray | Edit modes for lists |
| Confirmation dialogs | Destructive actions | Prevent accidents |

---

## When to Use This Component as Reference

✅ Building form-heavy features  
✅ Managing complex hierarchies (tabs, nested groups)  
✅ Implementing RBAC at field level  
✅ Need to handle inline editing  
✅ Large-scale data management components  

❌ Simple list views (use simpler pattern)  
❌ Configuration-only pages (no form needed)  
❌ Real-time collaborative editing (different pattern)
