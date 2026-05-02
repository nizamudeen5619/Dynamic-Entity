---
name: Keycloak SSO Integration Patterns
description: How to properly integrate Keycloak for authentication, token refresh, realm/scope mapping, and role-based access control
type: reference
originSessionId: bbfa8ec4-697b-469f-9e09-efa15153699e
---
## Keycloak Integration — Complete Pattern

### Authentication Flow (Backend)

**Keycloak Token Endpoint**
```bash
POST https://test-auth.onehermes.net/realms/{realm}/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded

client_id=superpower-web
grant_type=password
username={user_email}
password={password}
```

Returns JWT with `access_token`, `refresh_token`, `expires_in`.

### Token Storage & Refresh (Frontend - Angular)

**DO:**
- Store refresh_token in httpOnly secure cookie (automatic, browser-managed)
- Store access_token in memory (destroyed on page reload, prevents XSS)
- Refresh BEFORE expiry using interceptor (not after 401)

**DON'T:**
- Store tokens in localStorage (XSS vulnerability)
- Refresh only on 401 (too late, user sees error briefly)
- Keep same token forever (security risk)

### HTTP Interceptor Pattern

```typescript
// keycloak.interceptor.ts
intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
  // Add access token to every request
  if (this.auth.isLoggedIn && !req.url.includes('/token')) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${this.auth.accessToken}` }
    });
  }
  
  return next.handle(req).pipe(
    catchError(err => {
      if (err.status === 401) {
        // Token expired? Refresh and retry once
        return this.auth.refreshToken().pipe(
          switchMap(() => next.handle(req.clone({
            setHeaders: { Authorization: `Bearer ${this.auth.accessToken}` }
          }))),
          catchError(() => {
            // Refresh failed — user must login again
            this.auth.logout();
            this.router.navigate(['/login']);
            return throwError(() => err);
          })
        );
      }
      return throwError(() => err);
    })
  );
}
```

### Token Expiry & Proactive Refresh

**Recommended approach:**
1. Decode JWT to extract `exp` (expiration timestamp)
2. Calculate time remaining
3. Refresh token 1-2 minutes BEFORE expiry (not on demand)
4. Set a timer to refresh automatically

```typescript
// keycloak.service.ts
setupTokenRefreshTimer() {
  const exp = this.decodeToken(this.accessToken).exp;
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = (exp - now) * 1000; // milliseconds
  const refreshAfter = expiresIn - 120000; // 2 minutes before expiry
  
  setTimeout(() => this.refreshToken(), refreshAfter);
}
```

### Realm & Scope Mapping (Backend)

**Multi-tenant context:**
Each tenant maps to a Keycloak realm (e.g., `expert`, `crmweb`, `noss`).

**On every request:**
1. Extract JWT from `Authorization` header
2. Validate JWT signature against realm's public key
3. Extract `realm_access.roles` and `resource_access.{client}.roles`
4. Set `req.tenantContext = { realm, userId, scopes: roles }`
5. Pass to service layer

```javascript
// middleware/keycloak-auth.js
async function validateKeycloakToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing token' });
  
  try {
    const decoded = jwt.verify(token, getPublicKey(realm), {
      algorithms: ['RS256'],
      issuer: `https://test-auth.onehermes.net/realms/${realm}`
    });
    
    req.tenantContext = {
      realm: decoded.tenant.name, // from token payload
      userId: decoded.sub,
      scopes: decoded.realm_access.roles || [],
      scopePath: decoded.defaultScope // e.g., 'GLOBAL_EXPERT'
    };
    
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    res.status(403).json({ error: 'Invalid token' });
  }
}
```

### Role-Based Access Control (RBAC)

**Backend — every endpoint must check roles:**

```javascript
// controller
async create(req, res) {
  const { tenantContext } = req;
  
  // Check permission
  if (!tenantContext.scopes.includes('add-project')) {
    throw new ApiError('Insufficient permissions', 403);
  }
  
  // Proceed with business logic
}
```

**Frontend — hide/disable UI based on roles:**

```typescript
// component
canCreateProject(): boolean {
  return this.auth.hasRole('add-project');
}
```

### Common Keycloak Issues & Fixes

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| 401 on every request | Token validation failing | Check public key URL, realm name, JWT signature |
| "Token expired" on login | Refresh token not working | Ensure refresh_token in response, interceptor catching 401 |
| User sees brief error then redirect | Refreshing only on 401 | Implement proactive refresh before expiry |
| Cross-tenant data visible | realm not filtered in queries | Always filter by `req.tenantContext.realm` |
| "Insufficient permissions" | Missing role check | Add role check in controller, not just UI |
| SSO redirect loop | Keycloak realm misconfigured | Check redirect URIs in Keycloak admin console |

### Testing Keycloak Integration

```bash
# Get test token
curl -X POST https://test-auth.onehermes.net/realms/expert/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=superpower-web&grant_type=password&username=test@example.com&password=test123"

# Test with token
curl -X GET http://localhost:3000/v1/projects \
  -H "Authorization: Bearer {token}"
```

### Key Takeaways

✅ Token in memory (access) + httpOnly cookie (refresh)  
✅ Proactive refresh 1-2 minutes before expiry  
✅ 401 interceptor for emergency refresh + login redirect  
✅ Every endpoint validates token signature & realm  
✅ Every query filters by `tenantContext.realm`  
✅ UI hides/disables features based on roles  
