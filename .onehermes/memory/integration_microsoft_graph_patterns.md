---
name: Microsoft Graph API Integration Patterns
description: How to securely sync users, contacts, calendars, emails, and handle token refresh with Microsoft Graph
type: reference
originSessionId: bbfa8ec4-697b-469f-9e09-efa15153699e
---
## Microsoft Graph Integration — Complete Pattern

### Application Authentication (Tenant Admin Setup)

**Never use user credentials.** Use Client Credentials flow (app-to-app):

```bash
POST https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token
Content-Type: application/x-www-form-urlencoded

client_id={client_id}
client_secret={client_secret}
scope=https://graph.microsoft.com/.default
grant_type=client_credentials
```

Returns access token valid for 1 hour.

### Token Refresh Pattern

```javascript
// microsoftGraphApi.service.js
class MicrosoftGraphService {
  constructor() {
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async getValidToken() {
    if (this.accessToken && this.tokenExpiry > Date.now() + 60000) {
      return this.accessToken; // Token still valid (> 1 min left)
    }
    return this.refreshToken();
  }

  async refreshToken() {
    const response = await axios.post(
      `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
      {
        client_id: GRAPH_CLIENT_ID,
        client_secret: GRAPH_CLIENT_SECRET,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials'
      }
    );

    this.accessToken = response.data.access_token;
    this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
    return this.accessToken;
  }

  async callGraph(method, endpoint, data = null) {
    const token = await this.getValidToken();
    
    try {
      const response = await axios({
        method,
        url: `https://graph.microsoft.com/v1.0${endpoint}`,
        headers: { Authorization: `Bearer ${token}` },
        data
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        // Token invalid despite our checks (shouldn't happen, but refresh just in case)
        await this.refreshToken();
        token = this.accessToken;
        return axios({
          method,
          url: `https://graph.microsoft.com/v1.0${endpoint}`,
          headers: { Authorization: `Bearer ${token}` },
          data
        });
      }
      throw error;
    }
  }
}
```

### Common Graph API Calls

**Get all users (with pagination):**
```javascript
const users = await graphApi.callGraph('GET',
  '/users?$select=id,displayName,userPrincipalName,mail&$top=999'
);
// Returns { value: [{...}, {...}], @odata.nextLink: '...' }
```

**Delta sync (incremental — only changed users):**
```javascript
// First call — get initial state
const response = await graphApi.callGraph('GET',
  '/users/delta?$select=id,displayName,mail'
);
const deltaLink = response['@odata.deltaLink'];

// Save deltaLink for next sync
// Next call (e.g., 1 hour later)
const changes = await graphApi.callGraph('GET', deltaLink);
// Returns only added/modified/deleted users since last sync
```

**Batch requests (get multiple users in one call):**
```javascript
const batchBody = {
  requests: [
    { id: 1, method: 'GET', url: '/users/user1@company.com' },
    { id: 2, method: 'GET', url: '/users/user2@company.com' }
  ]
};

const results = await graphApi.callGraph('POST',
  '/$batch',
  batchBody
);
// Returns { responses: [{ id: 1, status: 200, body: {...} }, ...] }
```

**Send email:**
```javascript
const email = {
  message: {
    subject: 'Expense Approval',
    body: { contentType: 'HTML', content: '<p>Your expense was approved.</p>' },
    toRecipients: [{ emailAddress: { address: 'user@company.com' } }]
  },
  saveToSentItems: true
};

await graphApi.callGraph('POST',
  '/me/sendMail',
  email
);
```

### Batch Operations Best Practices

**DO:**
- Batch 1-20 requests per call (Graph API limit)
- Request only fields you need (`$select=id,displayName`)
- Use delta sync for recurring syncs (drastically reduces data)
- Handle 429 (rate limit) with exponential backoff

**DON'T:**
- Loop to fetch individual users (use `/users/delta` instead)
- Request all fields (performance hit)
- Make 100+ sequential requests (use `/$batch`)
- Ignore rate limits (you'll get throttled)

### Permission Scopes

Declare which Graph API permissions in Azure AD:

```javascript
// Required scopes in manifest
const requiredScopes = [
  'User.Read.All',      // Read all users
  'User.ReadWrite.All', // Write user properties
  'Mail.Send',          // Send emails
  'Calendar.ReadWrite', // Manage calendars
  'Contacts.ReadWrite'  // Manage contacts
];
```

**Important:** User cannot grant these — only tenant admin in Azure AD admin console.

### Error Handling & Retries

```javascript
async callGraphWithRetry(method, endpoint, data = null, maxRetries = 3) {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      return await this.callGraph(method, endpoint, data);
    } catch (error) {
      if (error.response?.status === 429) {
        // Rate limited
        const retryAfter = error.response.headers['retry-after'] || (2 ** retries);
        logger.warn(`Graph API rate limited. Waiting ${retryAfter}s before retry.`);
        await sleep(retryAfter * 1000);
        retries++;
      } else if (error.response?.status >= 500) {
        // Server error — retry
        retries++;
        await sleep((2 ** retries) * 1000); // Exponential backoff
      } else {
        // 4xx client error — don't retry
        throw error;
      }
    }
  }
  
  throw new Error(`Graph API call failed after ${maxRetries} retries`);
}
```

### Sync User Data to MongoDB

```javascript
async syncMicrosoftGraphUsers() {
  const Model = getModelByTenant('expert', 'User');
  const deltaLink = await cache.get('graph_user_delta_link');
  
  // Fetch changes
  const response = await graphApi.callGraph('GET', 
    deltaLink || '/users/delta?$select=id,displayName,userPrincipalName,mail'
  );
  
  const users = response.value || [];
  
  // Bulk update/insert
  const ops = users.map(user => ({
    updateOne: {
      filter: { microsoftId: user.id },
      update: { $set: { ...user, lastSyncedAt: new Date() } },
      upsert: true
    }
  }));
  
  await Model.bulkWrite(ops);
  
  // Save delta link for next sync
  await cache.set('graph_user_delta_link', response['@odata.deltaLink'], 86400);
  
  logger.info(`Synced ${users.length} users from Microsoft Graph`);
}
```

### Common Microsoft Graph Issues & Fixes

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| 401 Invalid Token | Credentials wrong or token expired | Verify client_id/secret, check token refresh logic |
| 403 Insufficient Privileges | Permission not granted in Azure AD | Ask tenant admin to grant permission in Azure portal |
| 429 Rate Limited | Too many requests | Implement exponential backoff, use batch API, use delta sync |
| User not found in Graph | User doesn't exist or deleted | Add error handling for 404, check user sync status |
| Batch request fails partially | One request in batch had error | Check `@odata.error` in each response, retry failed ones |
| Delta sync returns nothing | deltaLink expired (>10 days) | Catch 410 Gone, reset to full sync |

### Testing Microsoft Graph Integration

```bash
# Get access token
TOKEN=$(curl -s -X POST https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token \
  -d "client_id={client_id}&client_secret={secret}&scope=https://graph.microsoft.com/.default&grant_type=client_credentials" \
  | jq -r '.access_token')

# Test user read
curl -X GET https://graph.microsoft.com/v1.0/users?$top=10 \
  -H "Authorization: Bearer $TOKEN"

# Test delta sync
curl -X GET "https://graph.microsoft.com/v1.0/users/delta" \
  -H "Authorization: Bearer $TOKEN"
```

### Key Takeaways

✅ Use Client Credentials (app-to-app), never user credentials  
✅ Proactive token refresh before expiry  
✅ Always use delta sync for recurring syncs (saves bandwidth)  
✅ Batch multiple requests in single API call  
✅ Handle 429 (rate limit) with exponential backoff  
✅ Catch permission scopes upfront (Azure AD admin setup)  
✅ Test with actual Microsoft Graph endpoints (not mock)  
