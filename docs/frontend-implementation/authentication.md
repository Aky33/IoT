# Authentication & Authorization — Frontend Integration Guide

## Overview

The backend uses two authentication mechanisms:

| Mechanism | Who uses it | How it works |
|-----------|-------------|--------------|
| **JWT (Bearer token)** | Caregivers, Admins | Access token in header + refresh token in httpOnly cookie |
| **HMAC-SHA256** | IoT gateway | Device ID + timestamp + signature in headers |

Frontend only needs to implement **JWT authentication**.

## Roles

| Role | Description | Created via |
|------|-------------|-------------|
| `admin` | Full system access — manage users, caregivers, devices, invitations | Seed script or invitation with `role: "admin"` |
| `caregiver` | View own devices, notifications, and linked patients | Registration with invitation code |

## JWT Token Lifecycle

```
Login/Register
     ↓
Access Token (15 min) + Refresh Token Cookie (7 days)
     ↓ (access token expires)
POST /auth/refresh → new access token + new refresh cookie
     ↓ (refresh token expires after 7 days)
Must log in again
```

### Access Token

- Short-lived (default 15 minutes)
- Sent in `Authorization` header: `Bearer <token>`
- Contains: `sub` (caregiver ID), `email`, `role`
- **Never stored in localStorage** (XSS risk) — use in-memory variable

### Refresh Token

- Long-lived (7 days)
- Stored as **httpOnly secure cookie** — JavaScript cannot access it
- Automatically sent with requests to `/auth/*` endpoints
- **Rotated on every refresh** — old token invalidated, new one issued
- **Reuse detection** — if someone uses an old rotated token, ALL sessions are revoked

## Implementation

### 1. Login

```js
async function login(email, password) {
  const res = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // IMPORTANT: sends/receives cookies
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error.message);
  }

  const { accessToken } = await res.json();
  // Store in memory (not localStorage)
  setAccessToken(accessToken);
}
```

### 2. Registration

```js
async function register(data) {
  const res = await fetch('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      phone: data.phone,
      invitationCode: data.invitationCode,
    }),
  });

  if (!res.ok) {
    const { error } = await res.json();
    // Handle specific errors:
    // error.code === 'invitationInvalid' → invalid code
    // error.code === 'emailTaken' → email already exists
    // error.code === 'weakPassword' → password too short
    throw new Error(error.message);
  }

  const { accessToken, caregiver } = await res.json();
  setAccessToken(accessToken);
  return caregiver;
}
```

### 3. Authenticated API Calls

```js
async function apiCall(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${getAccessToken()}`,
      'Content-Type': 'application/json',
    },
  });

  // Access token expired — try refresh
  if (res.status === 401) {
    const refreshed = await refreshToken();
    if (refreshed) {
      // Retry with new token
      return fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${getAccessToken()}`,
          'Content-Type': 'application/json',
        },
      });
    }
    // Refresh failed — redirect to login
    redirectToLogin();
    return;
  }

  return res;
}
```

### 4. Token Refresh

```js
async function refreshToken() {
  const res = await fetch('/auth/refresh', {
    method: 'POST',
    credentials: 'include', // sends refreshToken cookie
  });

  if (!res.ok) {
    // Refresh failed — token expired or reuse detected
    setAccessToken(null);
    return false;
  }

  const { accessToken } = await res.json();
  setAccessToken(accessToken);
  return true;
}
```

### 5. Automatic Refresh (Interceptor Pattern)

Set up a timer or interceptor to refresh before expiry:

```js
// Decode JWT to get expiry (without verification — just reading)
function getTokenExpiry(token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  return payload.exp * 1000; // convert to ms
}

// Refresh 1 minute before expiry
function scheduleRefresh(token) {
  const expiry = getTokenExpiry(token);
  const refreshAt = expiry - 60_000; // 1 min before
  const delay = refreshAt - Date.now();

  if (delay > 0) {
    setTimeout(async () => {
      const success = await refreshToken();
      if (success) {
        scheduleRefresh(getAccessToken());
      }
    }, delay);
  }
}
```

### 6. Logout

```js
async function logout() {
  // Close SSE connection if open
  if (sseSource) sseSource.close();

  // Unsubscribe from push
  await fetch('/push/unsubscribe', {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Authorization': `Bearer ${getAccessToken()}` },
  });

  // Logout (clears refresh cookie)
  await fetch('/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });

  setAccessToken(null);
  redirectToLogin();
}
```

## Authorization — What Each Role Can Do

### Admin

| Resource | Create | List | Get | Edit | Delete |
|----------|--------|------|-----|------|--------|
| Users (patients) | yes | yes | yes | yes | yes |
| Caregivers | via invitation | yes | yes | yes | yes |
| Devices | yes | yes (all) | yes (all) | yes | yes |
| Invitations | yes | yes | - | - | yes (revoke) |
| Notifications | - | yes (own) | - | - | - |
| Push subscription | yes | - | VAPID key | yes (unsub) | - |

### Caregiver

| Resource | Create | List | Get | Edit | Delete |
|----------|--------|------|-----|------|--------|
| Users (patients) | no | no | own only | no | no |
| Caregivers | - | no | no | no | no |
| Devices | no | own only | own only | no | no |
| Invitations | no | no | - | - | no |
| Notifications | - | own only | - | - | - |
| Push subscription | yes | - | VAPID key | yes (unsub) | - |
| SSE stream | yes | - | - | - | - |

"Own only" means:
- **Devices:** filtered by `caregiverId` matching the authenticated user
- **Users:** accessible only if the caregiver has a device linked to that user
- **Notifications:** filtered by `caregiverId`

### Handling 403 Forbidden in Frontend

```js
if (res.status === 403) {
  // User doesn't have permission
  // Show "Access denied" message
  // Don't redirect to login — they ARE authenticated, just not authorized
}
```

## Security Best Practices

1. **Never store access tokens in localStorage** — vulnerable to XSS. Use in-memory variable.
2. **Always use `credentials: 'include'`** — required for cookies to be sent/received.
3. **Handle 401 vs 403 differently:**
   - 401 = not authenticated → try refresh, then redirect to login
   - 403 = not authorized → show "access denied", don't redirect
4. **Decode JWT client-side only for UI** (display role, schedule refresh) — never trust it for authorization decisions.
5. **Clear all state on logout** — access token, SSE connection, push subscription.

## Cookie Configuration

The refresh token cookie has these flags:

| Flag | Value | Purpose |
|------|-------|---------|
| `httpOnly` | `true` | JavaScript cannot access it (XSS protection) |
| `secure` | `true` in production | Only sent over HTTPS |
| `sameSite` | `strict` | Not sent in cross-site requests (CSRF protection) |
| `path` | `/auth` | Only sent to auth endpoints |
| `maxAge` | 7 days | Auto-expires |

## Error Handling Quick Reference

```js
switch (error.code) {
  case 'unauthorized':
  case 'tokenExpired':
  case 'tokenInvalid':
    // Try refresh, then redirect to login
    break;
  case 'refreshTokenReuse':
    // Security event — force immediate login
    // All sessions were revoked
    break;
  case 'forbidden':
    // Show "Access denied" — user is logged in but lacks permission
    break;
  case 'invalidCredentials':
    // Show "Wrong email or password"
    break;
  case 'invitationInvalid':
    // Show "Invalid invitation code"
    break;
  case 'emailTaken':
    // Show "Email already registered"
    break;
  case 'weakPassword':
    // Show "Password must be at least 8 characters"
    break;
  case 'rateLimitExceeded':
    // Show "Too many attempts, try again later"
    break;
}
```
