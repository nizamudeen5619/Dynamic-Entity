# /integration-test — Test External Integrations End-to-End

Test ONEHERMES integrations (Keycloak, Microsoft Graph, Kafka, webhooks, etc.) in isolation and full-stack.

## What to Test

Ask Nizam which integration:
1. **Keycloak** — SSO login, token refresh, realm mapping
2. **Microsoft Graph** — user sync, calendar sync, email sending
3. **Kafka** — producer, consumer, message flow, DLQ
4. **Webhooks** — inbound webhook processing, retry logic
5. **MongoDB** — multi-tenant queries, scope filtering
6. **External API** — custom integrations (specify which)

---

## Integration Test Sections

### Setup Phase
1. Load credentials from `.onehermes/config/test.env` (ask Nizam if missing)
2. Start required services (API, consumer processes, etc.)
3. Health checks (API running, service accessible)
4. Prepare test data

### Happy Path Test
1. Execute the integration workflow
2. Verify:
   - [ ] Request formatted correctly
   - [ ] Response received with expected status
   - [ ] Data transformed as expected
   - [ ] Side effects recorded (log entries, records created)
3. Validate state change (database, cache, logs)

### Error Handling Test
1. Simulate failures:
   - Timeout (slow/hung service)
   - 4xx (invalid request)
   - 5xx (service error)
   - Network error
2. Verify:
   - [ ] Error handled gracefully (no crash)
   - [ ] Retry logic triggered (if applicable)
   - [ ] Error logged appropriately
   - [ ] User notified (if frontend involved)

### Edge Cases
1. Expired credentials / tokens
2. Rate limiting (hit API quota)
3. Large payloads (batching, pagination)
4. Concurrent requests (race conditions)
5. Partial failures (partial success in bulk operations)

### Cleanup
1. Delete test data created during flow
2. Reset consumers / queues to clean state

---

## Integration-Specific Guidance

### Keycloak SSO
- Test token expiry and auto-refresh
- Verify realm/scope mapping
- Check tenant isolation
- Validate permission checks (role-based)

### Microsoft Graph
- Test delta sync (incremental queries)
- Verify token expiry handling
- Batch operations (if syncing many users)
- Error scenarios (insufficient permissions, throttling)

### Kafka
- Consumer group coordination
- Offset reset scenarios
- Dead letter queue processing
- Message ordering guarantees

### MongoDB Multi-Tenant
- Query with tenant filter
- Cross-tenant isolation (no data leakage)
- Scope path hierarchies
- Concurrent writes to same entity

---

## Output Format

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Integration Test: [Keycloak / Graph / Kafka / etc]
  Flow: [workflow description]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SETUP
  ✅ Credentials loaded
  ✅ Services healthy
  ✅ Test data prepared

HAPPY PATH
  ✅ Request sent correctly
  ✅ Response: 200 OK
  ✅ Data transformed
  ✅ State updated in DB

ERROR HANDLING
  ✅ Timeout handled (retry triggered)
  ✅ 401 error handled (token refresh attempted)
  ✅ 5xx error handled (logged, failed gracefully)

EDGE CASES
  ✅ Expired token: refresh successful
  ✅ Rate limit: backoff applied
  ⚠️  Concurrent writes: potential race condition (flagged for review)

CLEANUP
  ✅ Test data deleted
  ✅ Queues reset
  ✅ Consumers healthy

RESULT: ✅ PASSED — Integration working as expected
```

---

## After Test

- If all tests pass → ready for deployment
- If any failures → Claude diagnoses and suggests fixes
- If edge cases problematic → refactor integration logic before shipping
