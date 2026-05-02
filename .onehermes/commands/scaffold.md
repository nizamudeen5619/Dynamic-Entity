# /scaffold — Generate Full-Stack Boilerplate

Quickly scaffold a new feature with all necessary files following ONEHERMES patterns.

## What to Ask Nizam

1. **Feature name** — lowercase, kebab-case (e.g. `expense-claim`)
2. **Type** — CRUD entity or single endpoint?
3. **Database entity** — new model or existing?
4. **UI module** — which Angular module / feature area?
5. **Permissions** — any Keycloak role requirements?

---

## What Gets Generated

```
Backend:
  src/routes/v1/{domain}.route.js          [Route registration]
  src/controllers/{feature}.controller.js    [Thin controller]
  src/services/{feature}.service.js          [Business logic]
  src/models/{feature}.model.js              [Mongoose schema]
  src/validations/{feature}.validation.js    [Joi schemas]

Frontend (Angular):
  src/app/modules/{feature}/                 [Feature module]
  ├── {feature}.component.ts                 [Main component]
  ├── {feature}.service.ts                   [Smart service]
  ├── {feature}.component.html                [Template]
  └── {feature}.component.scss                [Styles]

Tests:
  __tests__/{feature}.service.test.js        [Service tests]
  e2e/recorded/{feature}-flow.spec.js        [Recorded flow test - if needed]
```

---

## Generated Code Guarantees

✅ **Backend**
- Multi-tenant ready (getModelByTenant)
- Error handling with ApiError
- Winston logging
- Joi validation included
- CommonJS syntax

✅ **Frontend**
- Reactive forms (if form-heavy)
- Smart service with RxJS operators
- Subscription cleanup (takeUntil)
- HTTP error handling via interceptor
- OnPush change detection

✅ **Integrations** (if applicable)
- Keycloak role/scope checks
- Token refresh handling
- Proper error boundaries

---

## After Scaffold, You Still Need To

1. **Fill in business logic** — service methods, validation rules
2. **Connect UI form fields** — template bindings, validations
3. **Add integration logic** — Keycloak scopes, Microsoft Graph calls, etc.
4. **Write tests** — unit tests for service, integration tests for API

Claude will generate the structure; you fill in the domain logic.

---

## Example Usage

> "Scaffold a new expense-claim entity. CRUD endpoints, new model, Angular list + form component. Needs Keycloak 'approve-expenses' role."

Claude will generate → User fills in service methods → Done.
