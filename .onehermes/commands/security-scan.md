# /security-scan — Security Vulnerability Audit

Analyze code for common security vulnerabilities and compliance issues.

## What to Scan

Ask Nizam what to focus on:
1. **A specific endpoint** — "POST /v1/data-export endpoint"
2. **A service** — "keycloak.service.js"
3. **A component** — "user-form.component.ts"
4. **The whole feature** — "Expense submission flow"
5. **The entire codebase** — "Full scan for OWASP Top 10"

---

## Security Checklist

### OWASP Top 10

#### A1 - Injection
- [ ] Raw user input passed to MongoDB queries? (NoSQL injection)
- [ ] User input in API URLs without encoding? (Header injection)
- [ ] User input in logs? (Log injection)
- [ ] String interpolation in system commands? (Command injection)

#### A2 - Broken Auth
- [ ] JWT validation (signature, expiry)?
- [ ] Keycloak token refresh on 401?
- [ ] Session fixation prevention?
- [ ] Password reset token expiry?

#### A3 - Sensitive Data Exposure
- [ ] Passwords/tokens logged anywhere?
- [ ] PII (SSN, phone, email) encrypted at rest?
- [ ] HTTPS enforced? (not HTTP in prod)
- [ ] Sensitive data in localStorage? (use secure cookies)
- [ ] API responses contain unnecessary fields?

#### A4 - XML External Entities (XXE)
- [ ] XML parsers configured securely?
- [ ] DocX/XLSX parsing without DTD?

#### A5 - Broken Access Control
- [ ] Multi-tenant isolation verified? (no cross-tenant queries)
- [ ] Role-based checks on every endpoint? (not just UI)
- [ ] Resource ownership verified before CRUD?
- [ ] Keycloak realm/scope filtering applied?

#### A6 - Security Misconfiguration
- [ ] Hardcoded secrets in code?
- [ ] Debug mode enabled in production?
- [ ] Default credentials anywhere?
- [ ] Unnecessary services exposed?

#### A7 - XSS
- [ ] User input sanitized in templates? (use `[innerText]` not `[innerHTML]`)
- [ ] Angular auto-escaping enabled? (default is on)
- [ ] Dynamic HTML from user input avoided?

#### A8 - CSRF
- [ ] CSRF tokens on state-changing requests?
- [ ] SameSite cookie flag set?

#### A9 - Vulnerable Dependencies
- [ ] npm audit issues?
- [ ] Libraries up-to-date?
- [ ] Known CVEs in dependencies?

#### A10 - Insufficient Logging
- [ ] Security events logged? (auth failures, permission denials)
- [ ] Logs contain no sensitive data?
- [ ] Logs immutable/tamper-proof?

---

## Additional ONEHERMES Checks

- [ ] `getModelByTenant()` used (not direct model imports)?
- [ ] Tenant context validated on every request?
- [ ] scopePath properly filtered in queries?
- [ ] apiKey / secret storage (not in .env files checked in)?
- [ ] Webhook signature validation?
- [ ] Rate limiting on sensitive endpoints?

---

## Output Format

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Security Scan: [file/feature/endpoint]
  Risk Level: [CRITICAL / HIGH / MEDIUM / LOW]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CRITICAL (immediate fix needed)
  🔴 [vulnerability] — [where] — [fix]

HIGH (fix within sprint)
  🟠 [vulnerability] — [where] — [fix]

MEDIUM (backlog)
  🟡 [vulnerability] — [where] — [fix]

LOW (nice-to-have)
  🟢 [vulnerability] — [where] — [fix]

SUMMARY: X critical, Y high, Z medium issues found.
Estimated fix time: A hours
```

---

## After Scan

Claude prioritizes by severity. Nizam fixes critical/high immediately, schedules medium for next sprint.
